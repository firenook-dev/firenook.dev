"""Turns a recording from record.py into the frames the home page plays.

The screen is replayed in a terminal emulator (pyte) and kept at the end of
each of Firenook's synchronized updates, so no frame is half painted. The run
ends before q is pressed, pauses longer than a moment are shortened, and each
frame keeps only the rows that changed, as runs of text with a style.

    python3 build.py RECORDING.json ../../src/data/terminal-wide.json
"""

import base64
import json
import sys

import pyte

FRAME_END = b"\x1b[?2026l"
FRAME_START = b"\x1b[?2026h"
COLOURS = {"red": "r", "green": "g", "blue": "u", "f23818": "f", "ff9800": "a"}
LONGEST_PAUSE = 0.8
SHORTENED_TO = 0.6


def style(char):
    names = []
    if char.blink:  # dim, which pyte does not keep, arrives here as blink
        names.append("d")
    if char.bold:
        names.append("b")
    if char.underscore:
        names.append("l")
    colour = COLOURS.get(char.fg)
    if colour:
        names.append(colour)
    return " ".join(names)


def snapshot(screen):
    rows = []
    for y in range(screen.lines):
        line = screen.buffer[y]
        runs = []
        for x in range(screen.columns):
            char = line[x]
            name = style(char)
            if runs and runs[-1][1] == name:
                runs[-1][0] += char.data
            else:
                runs.append([char.data, name])
        while runs and runs[-1][1] == "" and runs[-1][0].strip() == "":
            runs.pop()
        if runs and runs[-1][1] == "":
            runs[-1][0] = runs[-1][0].rstrip()
        rows.append(runs)
    return rows


def main():
    recording = json.load(open(sys.argv[1]))
    screen = pyte.Screen(recording["cols"], recording["rows"])
    stream = pyte.ByteStream(screen)
    frames = []
    held = b""

    for chunk in recording["chunks"]:
        data = held + base64.b64decode(chunk["b"]).replace(b"\x1b[2m", b"\x1b[5m").replace(b"\x1b[22m", b"\x1b[22;25m")
        held = b""
        end = data.rfind(FRAME_END)
        if end >= 0:
            stream.feed(data[: end + len(FRAME_END)])
            frames.append((chunk["t"], snapshot(screen)))
            data = data[end + len(FRAME_END):]
        # A marker split across two writes waits for the rest of it.
        for size in range(len(FRAME_END) - 1, 0, -1):
            if data.endswith(FRAME_END[:size]):
                held, data = data[-size:], data[:-size]
                break
        if FRAME_START in data:
            held = data + held
            continue
        if data:
            stream.feed(data)
            frames.append((chunk["t"], snapshot(screen)))

    # The run ends where q was pressed; the screen is blank before the card.
    def text(rows):
        return "".join(run[0] for row in rows for run in row)

    last = max(i for i, frame in enumerate(frames) if "q quit" in text(frame[1]))
    frames = [frame for frame in frames[: last + 1] if text(frame[1]).strip()]

    played = []
    clock = 0.0
    previous_time = frames[0][0]
    previous_rows = [[] for _ in range(recording["rows"])]
    for when, rows in frames:
        gap = when - previous_time
        clock += SHORTENED_TO if gap > LONGEST_PAUSE else gap
        previous_time = when
        changed = [[y, row] for y, row in enumerate(rows) if row != previous_rows[y]]
        if changed:
            played.append({"t": round(clock, 3), "d": changed})
        previous_rows = rows

    out = {"cols": recording["cols"], "rows": recording["rows"], "frames": played}
    with open(sys.argv[2], "w") as file:
        json.dump(out, file, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(played)} frames over {clock:.2f} s")


if __name__ == "__main__":
    main()
