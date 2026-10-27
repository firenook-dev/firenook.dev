"""Turns a screen from build.py into the GIF the repository's README shows.

The frames are drawn as the home page draws them, in a window of the same
look, and taken with Chrome at twice their size. Before the screen plays, the
prompt shows the command: with --swap, the official command with its one word
changed and --append typed after it, as on the home page; without, the
command typed. Frames shown for less than a GIF can hold (20 ms) are left
out, and the last frame holds for --hold seconds. With --longest-wait, a
stretch in which only timers and spinners move (an npm install) plays faster
to last that many seconds; the timers still show the real times.

    python3 gif.py FRAMES.json OUT.gif --title demo-shop \\
        --command "npx firebase emulators:start" --swap firebase=firenook --append " --keep-data"
    python3 gif.py FRAMES.json OUT.gif --title "~/shop" --command "npx firenook init" --longest-wait 2.5

Needs Google Chrome, or `playwright install chromium`, and ImageMagick and
gifsicle on PATH.
"""

import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(HERE, "..", ".."))
FONTS = {
    "plex": "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2",
    "plexBold": "node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-600-normal.woff2",
    "figtree": "node_modules/@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2",
    "symbols": "src/assets/fonts/terminal-symbols.woff2",
}

# The window and the screen's styles, as src/components/Terminal.astro and
# src/styles/global.css draw them.
PAGE = """<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:"IBM Plex Mono";font-weight:400;font-display:block;src:url("%(plex)s")}
@font-face{font-family:"IBM Plex Mono";font-weight:600;font-display:block;src:url("%(plexBold)s")}
@font-face{font-family:"Figtree Variable";font-weight:300 900;font-display:block;src:url("%(figtree)s")}
@font-face{font-family:"Firenook Terminal Symbols";font-display:block;src:url("%(symbols)s");unicode-range:U+2500-259F,U+25CF,U+2713,U+2715,U+2800-28FF}
html,body{margin:0;background:transparent}
.win{display:inline-block;overflow:hidden;border:1px solid rgb(255 255 255/.13);border-radius:14px;background:#0f0f11}
.bar{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:.7rem 1.1rem;border-bottom:1px solid rgb(255 255 255/.08);background:rgb(255 255 255/.02);color:#a9a7ae;font:560 13px/1.2 "Figtree Variable",system-ui,sans-serif}
.lights{display:flex;gap:7px}.lights i{width:11px;height:11px;border-radius:50%%}
.lights i:nth-child(1){background:#ff5f57}.lights i:nth-child(2){background:#febc2e}.lights i:nth-child(3){background:#28c840}
.screen{padding:1.5rem 1.5rem 1.25rem}
pre{margin:0;color:#e8e6e1;font-family:"IBM Plex Mono","Firenook Terminal Symbols",monospace;font-size:13px;line-height:1.3;white-space:pre;width:%(cols)sch;height:calc(%(rows)s * 1.3em)}
.w{display:inline-block}.d{color:#8b8990}.b{font-weight:600}.g{color:#4cc38a}.r{color:#ff6a5f}.u{color:#86adff}.f{color:#f23818}.a{color:#ff9800}.l{text-decoration:underline}
.old.struck{color:#8b8990;text-decoration:line-through;text-decoration-color:#ff6a5f;text-decoration-thickness:2px;margin-right:1ch}
.new{color:#4cc38a}
.cursor{display:inline-block;width:.6em;height:1.1em;margin-left:1px;vertical-align:text-bottom;background:#e8e6e1}
</style>
<div class="win"><div class="bar"><span class="lights"><i></i><i></i><i></i></span><span>%(title)s</span><span></span></div>
<div class="screen"><pre id="screen"></pre></div></div>
<script>
const escape = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// src/lib/terminal.ts: each stretch of characters outside ASCII is held to
// its width in columns, so the grid lines up whatever the font.
function rowHtml(runs) {
  let out = '';
  for (const [text, style] of runs) {
    let inner = '';
    for (const part of text.match(/[\\x00-\\x7f]+|[^\\x00-\\x7f]+/g) ?? []) {
      if (/^[\\x00-\\x7f]/.test(part)) inner += escape(part);
      else inner += `<span class="w" style="width:${[...part].length}ch">${escape(part)}</span>`;
    }
    out += style ? `<span class="${style}">${inner}</span>` : inner;
  }
  return out;
}
window.showRows = (rows) => { document.getElementById('screen').innerHTML = rows.map(rowHtml).join('\\n'); };
window.showHtml = (markup) => { document.getElementById('screen').innerHTML = markup; };
</script>"""

SHORTEST = 0.02


def prompt_frames(args):
    """The prompt before the screen plays, as (seconds, markup)."""
    esc = html.escape
    frames = []
    if args.swap:
        old, new = args.swap.split("=", 1)
        before, after = args.command.split(old, 1)

        def line(struck, typed, appended, cursor=True):
            word = f'<span class="old{" struck" if struck else ""}">{esc(old)}</span>'
            return (f'<span class="d">$</span> {esc(before)}{word}<span class="new">{esc(typed)}</span>'
                    f'{esc(after)}<span class="new">{esc(appended)}</span>'
                    + ('<span class="cursor"></span>' if cursor else ""))

        frames.append((1.2, line(False, "", "")))
        frames.append((0.3, line(True, "", "")))
        for i in range(1, len(new) + 1):
            frames.append((0.06, line(True, new[:i], "")))
        frames[-1] = (0.25, frames[-1][1])
        for i in range(1, len(args.append) + 1):
            frames.append((0.045, line(True, new, args.append[:i])))
        frames[-1] = (0.6, frames[-1][1])
    else:
        command = args.command
        frames.append((0.8, '<span class="d">$</span> <span class="cursor"></span>'))
        for i in range(1, len(command) + 1):
            frames.append((0.05, f'<span class="d">$</span> {esc(command[:i])}<span class="cursor"></span>'))
        frames[-1] = (0.6, frames[-1][1])
    return frames


def waiting(rows):
    """The screen without its times, spinners, spacing and rules: equal while
    only timers tick, even when a time grows a digit or turns ms into s."""
    text = "".join(text for row in rows for text, _ in row)
    text = re.sub(r"\d+(?:\.\d+)?\s*m?s\b", "", text)
    return re.sub(r"[0-9⠀-⣿─\s]", "", text)


def screen_frames(recording, hold, longest_wait):
    """Each frame of the recording as (seconds, rows), the rows complete. A
    stretch in which only timers and spinners move, longer than longest_wait,
    is played faster to last that long, a frame every 80 ms at most."""
    rows = [[] for _ in range(recording["rows"])]
    timed = []
    for frame in recording["frames"]:
        for y, runs in frame["d"]:
            rows[y] = runs
        timed.append((frame["t"], [list(row) for row in rows]))
    shown = [(timed[i + 1][0] - when) if i + 1 < len(timed) else hold for i, (when, _) in enumerate(timed)]
    real = list(shown)

    if longest_wait:
        i = 0
        while i < len(timed) - 1:
            j = i
            while j + 1 < len(timed) - 1 and waiting(timed[j + 1][1]) == waiting(timed[i][1]):
                j += 1
            length = sum(shown[i : j + 1])
            if length > longest_wait:
                factor = longest_wait / length
                for k in range(i, j + 1):
                    shown[k] *= factor
            i = j + 1

    out = []
    for (when, screen), seconds, was in zip(timed, shown, real):
        if out and out[-1][0] < 0.08 and waiting(out[-1][1]) == waiting(screen):
            # Only a timer moved within 80 ms: one frame, with the newer times.
            out[-1] = (out[-1][0] + seconds, screen)
        elif out and was < SHORTEST:
            # Never on screen long enough to see: the frame before keeps showing.
            out[-1] = (out[-1][0] + seconds, out[-1][1])
        else:
            out.append((seconds, screen))
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("frames")
    parser.add_argument("out")
    parser.add_argument("--title", required=True)
    parser.add_argument("--command", required=True)
    parser.add_argument("--swap")
    parser.add_argument("--append", default="")
    parser.add_argument("--hold", type=float, default=4.5)
    parser.add_argument("--longest-wait", type=float)
    args = parser.parse_args()

    recording = json.load(open(args.frames))
    urls = {key: "file://" + os.path.join(SITE, path) for key, path in FONTS.items()}
    page_html = PAGE % {**urls, "cols": recording["cols"], "rows": recording["rows"], "title": html.escape(args.title)}

    work = tempfile.mkdtemp(prefix="firenook-gif-")
    page_path = os.path.join(work, "page.html")
    with open(page_path, "w") as file:
        file.write(page_html)

    steps = [(seconds, "html", markup) for seconds, markup in prompt_frames(args)]
    steps += [(seconds, "rows", rows) for seconds, rows in screen_frames(recording, args.hold, args.longest_wait)]

    images = []
    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(channel="chrome")
        except Exception:
            browser = p.chromium.launch()
        page = browser.new_page(device_scale_factor=2, viewport={"width": 1400, "height": 1000})
        page.goto("file://" + page_path)
        page.evaluate("document.fonts.load('600 13px \"IBM Plex Mono\"')")
        page.evaluate("document.fonts.load('13px \"Firenook Terminal Symbols\"', '\\u2500')")
        page.evaluate("document.fonts.ready")
        window = page.locator(".win")
        for index, (seconds, kind, value) in enumerate(steps):
            page.evaluate("([kind, value]) => kind === 'html' ? showHtml(value) : showRows(value)", [kind, value])
            path = os.path.join(work, f"{index:04d}.png")
            window.screenshot(path=path, omit_background=True)
            images.append((seconds, path))
        browser.close()

    # Delays in hundredths of a second, rounded on the running total so the
    # whole keeps its length.
    command = ["magick"]
    clock = 0.0
    for seconds, path in images:
        delay = round((clock + seconds) * 100) - round(clock * 100)
        clock += seconds
        command += ["-delay", str(max(delay, 2)), path]
    raw = os.path.join(work, "raw.gif")
    subprocess.run(command + ["-loop", "0", raw], check=True)
    subprocess.run(["gifsicle", "-O3", "--colors", "128", raw, "-o", args.out], check=True)
    shutil.rmtree(work)
    print(f"{len(images)} frames over {clock:.1f} s, {os.path.getsize(args.out) // 1024} KB")


if __name__ == "__main__":
    sys.exit(main())
