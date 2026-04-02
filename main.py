import sys, os, threading, time, traceback
from http.server import HTTPServer, BaseHTTPRequestHandler

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
except:
    BASE_DIR = os.getcwd()

BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
for p in [BASE_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)
os.chdir(BASE_DIR)

FLASK_READY = False

class LoadingHandler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if FLASK_READY:
            self.send_response(302)
            self.send_header("Location", "http://127.0.0.1:5050")
            self.end_headers()
        else:
            html = b"""<!DOCTYPE html>
<html><head>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<meta http-equiv='refresh' content='2'>
<style>
body{background:#1a1a2e;color:#00ff88;font-family:monospace;
     display:flex;flex-direction:column;align-items:center;
     justify-content:center;height:100vh;margin:0}
h2{color:#f0a500;font-size:22px}
p{font-size:14px}
.bar{width:60px;height:8px;background:#00ff88;border-radius:4px;
     display:inline-block;margin:3px;animation:pulse 1s infinite}
.bar:nth-child(2){animation-delay:.2s}
.bar:nth-child(3){animation-delay:.4s}
@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}
</style></head><body>
<h2>TPV Ultra Smart</h2>
<div><span class='bar'></span><span class='bar'></span><span class='bar'></span></div>
<p>Iniciando servidor...</p>
</body></html>"""
            self.send_response(200)
            self.send_header("Content-Type","text/html")
            self.end_headers()
            self.wfile.write(html)

# Arrancar servidor sincrónicamente
_server = HTTPServer(("127.0.0.1", 5049), LoadingHandler)
threading.Thread(target=_server.serve_forever, daemon=True).start()

def start_flask():
    global FLASK_READY
    try:
        from app import app as flask_app
        from database import crear_tablas
        crear_tablas()
        FLASK_READY = True
        flask_app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)
    except Exception as e:
        try:
            with open("/storage/emulated/0/tpv_error.log", "w") as f:
                f.write(str(e) + "\n" + traceback.format_exc())
        except: pass

threading.Thread(target=start_flask, daemon=True).start()

def main(url):
    return "http://127.0.0.1:5049"
