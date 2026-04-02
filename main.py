import sys, os, threading, time, traceback

LOG = "/storage/emulated/0/tpv.log"

def log(m):
    try:
        with open(LOG, "a") as f:
            f.write(m + "\n")
    except:
        pass

log("=== INICIO ===")

try:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
except:
    BASE_DIR = os.getcwd()

BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
log(f"BASE_DIR={BASE_DIR}")
log(f"BACKEND_DIR existe={os.path.exists(BACKEND_DIR)}")

for p in [BASE_DIR, BACKEND_DIR]:
    if p not in sys.path:
        sys.path.insert(0, p)
os.chdir(BASE_DIR)

def start_flask():
    try:
        log("importando flask...")
        import flask
        log(f"flask {flask.__version__}")
        log("importando database...")
        import database
        log("importando app...")
        from app import app as flask_app
        log("app importada")
        from database import crear_tablas
        crear_tablas()
        log("DB lista - arrancando Flask")
        flask_app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)
    except Exception as e:
        log(f"ERROR: {e}")
        log(traceback.format_exc())

threading.Thread(target=start_flask, daemon=True).start()
log("hilo flask iniciado")
time.sleep(5)
log("main() retornando URL")

def main(url):
    return "http://127.0.0.1:5050"
