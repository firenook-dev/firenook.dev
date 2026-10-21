"""Records Firenook's terminal screen for the home page.

Starts `firenook emulators:start --keep-data` in demo-shop/ (on the data
seed.mjs saved) inside a pseudo-terminal of the given size, waits until it is ready, sends two checkouts and a webhook without
a signature (which fails), then presses q. Every byte the screen wrote is kept
with its time, for build.py.

    python3 record.py COLUMNS ROWS OUT.json
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

HERE = os.path.dirname(os.path.abspath(__file__))
DEMO = os.path.join(HERE, "demo-shop")
FUNCTIONS = "http://127.0.0.1:5001/demo-shop/us-central1/"


def main():
    cols, rows, out = int(sys.argv[1]), int(sys.argv[2]), sys.argv[3]
    pid, fd = pty.fork()
    if pid == 0:
        os.chdir(DEMO)
        env = dict(os.environ, TERM="xterm-256color", COLORTERM="truecolor", COLUMNS=str(cols), LINES=str(rows))
        os.execvpe("npx", ["npx", "firenook", "emulators:start", "--keep-data"], env)
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

    def post(name, body):
        request = urllib.request.Request(
            FUNCTIONS + name, data=json.dumps(body).encode(), method="POST",
            headers={"content-type": "application/json"},
        )
        try:
            urllib.request.urlopen(request, timeout=10).read()
        except Exception:
            pass  # The webhook answers 500 on purpose.

    deadline = time.time() + 60
    while time.time() < deadline and b"ready" not in bytes(seen).lower():
        pump(0.2)
    ready_at = time.time() - start
    pump(1.5)
    post("checkout", {"items": [{"sku": "mug", "price": 18, "qty": 2}]})
    pump(1.2)
    post("checkout", {"items": [{"sku": "tote", "price": 24, "qty": 1}, {"sku": "pin", "price": 4, "qty": 2}]})
    pump(1.2)
    post("stripeWebhook", {"type": "checkout.session.completed"})
    pump(2.5)
    os.write(fd, b"q")
    pump(8)
    try:
        os.kill(pid, 15)
    except ProcessLookupError:
        pass

    with open(out, "w") as file:
        json.dump({"cols": cols, "rows": rows, "readyAt": round(ready_at, 3), "chunks": chunks}, file)
    print(f"ready in {ready_at:.2f} s, {len(chunks)} writes")


if __name__ == "__main__":
    main()
