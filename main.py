import sys, os, threading, time, traceback

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
except:
    BASE_DIR = os.getcwd()

BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
for p in [BASE_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.chdir(BASE_DIR)

STATUS = []

def log(msg):
    STATUS.append(msg)
    try:
        with open("/storage/emulated/0/tpv_debug.log", "a") as f:
            f.write(msg + "\n")
    except:
        pass

log("main.py iniciado")
log(f"BASE_DIR={BASE_DIR}")
log(f"backend existe={os.path.exists(BACKEND_DIR)}")

def start_flask():
    try:
        log("importando flask...")
        import flask
        log(f"flask {flask.__version__} OK")
        log("importando tpv_rutas...")
        import tpv_rutas
        log("tpv_rutas OK")
        log("importando database...")
        import database
        log("database OK")
        log("importando app...")
        from app import app as flask_app
        log("app OK")
        from database import crear_tablas
        crear_tablas()
        log("DB OK - arrancando Flask 127.0.0.1:5050")
        flask_app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)
    except Exception as e:
        log(f"ERROR: {e}")
        log(traceback.format_exc()[-500:])

threading.Thread(target=start_flask, daemon=True).start()
time.sleep(3)

def main(url):
    log("webview main() llamado")
    estado = "<br>".join(STATUS[-20:])
    # Página de debug que muestra el estado
    html = f"""<!DOCTYPE html>
<html>
<head>
<meta name='viewport' content='width=device-width'>
<style>
body{{background:#111;color:#0f0;font-family:monospace;padding:10px;font-size:13px}}
h2{{color:#ff0}}
</style>
</head>
<body>
<h2>TPV Debug</h2>
<div id='log'>{estado}</div>
<script>
setTimeout(function(){{
  window.location.href = 'http://127.0.0.1:5050';
}}, 4000);
</script>
</body>
</html>"""
    
    # Guardar HTML de debug
    debug_path = os.path.join(BASE_DIR, 'debug.html')
    with open(debug_path, 'w') as f:
        f.write(html)
    
    return "file://" + debug_path
