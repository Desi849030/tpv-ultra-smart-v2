import sys, os, threading, time, traceback

def find_app_dir():
    candidatos = [
        os.path.dirname(os.path.abspath(__file__)),
        '/data/user/0/com.universidad.tpv.tpvultrasmart/files/app',
        '/data/data/com.universidad.tpv.tpvultrasmart/files/app',
        os.getcwd(),
    ]
    for d in candidatos:
        if os.path.exists(os.path.join(d, 'backend', 'app.py')):
            return d
    return candidatos[0]

APP_DIR = find_app_dir()
BACKEND_DIR = os.path.join(APP_DIR, 'backend')

for p in [APP_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.chdir(APP_DIR)

# Servidor de debug minimo en puerto 5051
from http.server import HTTPServer, BaseHTTPRequestHandler
LOGS = [f"APP_DIR: {APP_DIR}", f"backend existe: {os.path.exists(BACKEND_DIR)}"]

class DebugHandler(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        if self.path == '/status':
            body = "\n".join(LOGS[-20:]).encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(body)
        else:
            html = b"""<!DOCTYPE html>
<html><head>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<meta http-equiv='refresh' content='2;url=http://127.0.0.1:5050'>
<style>
body{background:#1a1a2e;color:#00ff88;font-family:monospace;padding:20px;font-size:14px}
h2{color:#f0a500}
#log{white-space:pre-wrap;margin-top:10px}
.dot{animation:blink 1s infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
</style>
</head><body>
<h2>TPV Ultra Smart</h2>
<p>Iniciando<span class='dot'>...</span></p>
<div id='log'>Cargando...</div>
<script>
function upd(){
  fetch('/status').then(r=>r.text()).then(t=>{
    document.getElementById('log').innerText=t;
    if(t.includes('arrancando Flask')){
      setTimeout(()=>location.href='http://127.0.0.1:5050',1500);
    }
  }).catch(()=>{});
}
setInterval(upd,800);
upd();
</script>
</body></html>"""
            self.send_response(200)
            self.send_header("Content-Type","text/html")
            self.end_headers()
            self.wfile.write(html)

def start_debug_server():
    HTTPServer(("127.0.0.1", 5051), DebugHandler).serve_forever()

def start_flask():
    try:
        LOGS.append("importando flask...")
        from app import app as flask_app
        LOGS.append("flask OK")
        LOGS.append("importando database...")
        from database import crear_tablas
        LOGS.append("database OK")
        crear_tablas()
        LOGS.append("arrancando Flask en 127.0.0.1:5050")
        flask_app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)
    except Exception as e:
        LOGS.append(f"ERROR: {e}")
        LOGS.append(traceback.format_exc()[-300:])
        try:
            with open("/storage/emulated/0/tpv_error.log", "w") as f:
                f.write("\n".join(LOGS))
        except: pass

threading.Thread(target=start_debug_server, daemon=True).start()
threading.Thread(target=start_flask, daemon=True).start()
time.sleep(1)

def main(url):
    return "http://127.0.0.1:5051"
