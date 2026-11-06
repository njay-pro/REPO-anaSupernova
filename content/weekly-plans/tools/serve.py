#!/usr/bin/env python3
"""Silent static file server for the weekly plan cards.

Why not `python3 -m http.server`:
  http.server writes a log line to stderr on EVERY request. When the process is
  detached from an interactive session its stderr pipe can close, the write
  raises, the handler thread dies — and the listening socket stays up while
  every subsequent request hangs. Symptom: `lsof` shows LISTEN, `curl` returns
  000. This server never logs, so there is nothing to fail on.

Usage:
    python3 tools/serve.py [--port 8765] [--dir .]
"""
import argparse
import os
import socket
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args, **kwargs):
        pass

    def log_error(self, *args, **kwargs):
        pass

    def end_headers(self):
        # plans change often; never let Safari serve a stale card
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--dir", default=".")
    a = ap.parse_args()

    os.chdir(os.path.abspath(a.dir))
    httpd = ThreadingHTTPServer(("0.0.0.0", a.port), QuietHandler)
    host = socket.gethostname().split(".")[0]
    print(f"serving {os.getcwd()} on 0.0.0.0:{a.port}", flush=True)
    print(f"  http://{host}.local:{a.port}/", flush=True)
    print(f"  http://{lan_ip()}:{a.port}/", flush=True)
    httpd.serve_forever()


if __name__ == "__main__":
    main()
