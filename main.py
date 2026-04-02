def main(url):
    return "http://127.0.0.1:5050"

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

def start_flask():
    try:
        import tpv_rutas
        import database
        from app import app as flask_app
        from database import crear_tablas
        crear_tablas()
        flask_app.run(host="127.0.0.1", port=5050, debug=False, use_reloader=False)
    except Exception as e:
        import traceback
        with open("/storage/emulated/0/tpv_error.log", "w") as f:
            f.write(str(e) + "\n" + traceback.format_exc())

threading.Thread(target=start_flask, daemon=True).start()
time.sleep(2)
