"""Open the included local preview without installing Node or rebuilding."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import threading, webbrowser
root=Path(__file__).resolve().parent
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
url=f'http://127.0.0.1:{server.server_port}/preview/'
print(f'Game Forge preview: {url}\nKeep this window open. Press Ctrl+C to stop.')
threading.Timer(0.8,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:server.server_close()
