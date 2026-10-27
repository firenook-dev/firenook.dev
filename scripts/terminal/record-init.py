"""Records `firenook init` making a new project, for the README's second GIF.

Starts `npx firenook@VERSION init` in a new, empty folder (its name makes the
project id: shop becomes demo-shop) inside a pseudo-terminal of the given
size, moves down two fields of the screen of choices and presses Enter. The
set-up runs (npm quiet, and preferring its cache as a second install would),
Enter answers yes to starting the emulators, one request reaches the new
helloWorld function, then it presses q. Every byte the screen wrote is kept
with its time, for build.py; the folder is left for you to delete.

    python3 record-init.py COLUMNS ROWS FOLDER VERSION OUT.json
"""

import base64
import fcntl
import json
import os
import pty
import select
import struct
import sys
import termios
import time
import urllib.request

DOWN = b"\x1b[B"
HELLO = "http://127.0.0.1:5001/demo-shop/us-central1/helloWorld"


def main():
    cols, rows, folder, version, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5]
    if os.path.exists(folder) and os.listdir(folder):
        sys.exit(f"{folder} is not empty: init needs a new folder")
    os.makedirs(folder, exist_ok=True)

    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(folder)
        env = dict(os.environ, TERM="xterm-256color", COLORTERM="truecolor", COLUMNS=str(cols), LINES=str(rows))
        env.pop("GOOGLE_APPLICATION_CREDENTIALS", None)
        # npm's own notices and spinner stay out of the picture.
        env.update(npm_config_prefer_offline="true", npm_config_audit="false", npm_config_fund="false",
                   npm_config_loglevel="warn", npm_config_progress="false")
        os.execvpe("npx", ["npx", "--yes", f"firenook@{version}", "init"], env)
    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))

    start = time.time()
    chunks = []
    seen = bytearray()

    def pump(seconds):
        end = time.time() + seconds
        while time.time() < end:
            ready, _, _ = select.select([fd], [], [], 0.05)
            if not ready:
                continue
            try:
                data = os.read(fd, 65536)
            except OSError:
                return
            if not data:
                return
            chunks.append({"t": round(time.time() - start, 4), "b": base64.b64encode(data).decode()})
            seen.extend(data)

    def wait_for(text, seconds, since=0):
        deadline = time.time() + seconds
        while time.time() < deadline and text not in bytes(seen[since:]):
            pump(0.2)
        return text in bytes(seen[since:])

    failed = None
    if not wait_for(b"create", 120):
        failed = "the screen of choices"
    else:
        pump(1.4)
        os.write(fd, DOWN)
        pump(0.9)
        os.write(fd, DOWN)
        pump(1.1)
        os.write(fd, b"\r")
        if not wait_for(b"Start the emulators now", 300, since=len(seen)):
            failed = "the question to start the emulators"
        else:
            pump(1.3)
            os.write(fd, b"\r")
        if not failed and not wait_for(b"ready", 120, since=len(seen)):
            failed = "the emulators to be ready"
        if not failed:
            pump(1.5)
            try:
                urllib.request.urlopen(HELLO, timeout=10).read()
            except Exception as error:
                print(f"helloWorld: {error}")
            pump(2.5)
    os.write(fd, b"q")
    pump(8)
    try:
        os.kill(pid, 15)
    except ProcessLookupError:
        pass

    with open(out, "w") as file:
        json.dump({"cols": cols, "rows": rows, "chunks": chunks}, file)
    print(f"{len(chunks)} writes over {time.time() - start:.1f} s")
    if failed:
        sys.exit(f"gave up waiting for {failed}; the bytes so far are in {out}")


if __name__ == "__main__":
    main()
