import sys, os, threading, time, traceback

LOG_FILE = "/storage/emulated/0/tpv_crash.log"

def log(msg):
    with open(LOG_FILE, "a") as f:
        f.write(msg + "\n")

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
except:
    BASE_DIR = os.getcwd()

BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
for p in [BASE_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)

os.chdir(BASE_DIR)
log(f"BASE_DIR: {BASE_DIR}")
log(f"BACKEND_DIR exists: {os.path.exists(BACKEND_DIR)}")
log(f"sys.path: {sys.path}")

def start_flask():
    try:
        log("importando tpv_rutas...")
        import tpv_rutas
        log("importando database...")
        import database
        log("importando app...")
        from app import app as flask_app
        log("creando tablas...")
        from database import crear_tablas
        crear_tablas()
        log("arrancando Flask en 127.0.0.1:5050")
        flask_app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)
    except Exception as e:
        log(f"ERROR FLASK: {e}")
        log(traceback.format_exc())

threading.Thread(target=start_flask, daemon=True).start()
time.sleep(2)

def main(url):
    log("main() llamado por webview")
    return "http://127.0.0.1:5050"
