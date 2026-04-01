import sys, os, traceback

print("="*40)
print("TPV DEBUG")
print("="*40)

# Simula lo que hace la APK
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')

print(f"BASE_DIR: {BASE_DIR}")
print(f"BACKEND_DIR: {BACKEND_DIR}")
print(f"backend existe: {os.path.exists(BACKEND_DIR)}")
print(f"archivos en base: {os.listdir(BASE_DIR)[:10]}")
print(f"archivos en backend: {os.listdir(BACKEND_DIR)[:10]}")

sys.path.insert(0, BASE_DIR)
sys.path.insert(0, BACKEND_DIR)

print("\n--- Probando imports ---")
tests = ['flask', 'tpv_rutas', 'database', 'supabase_sync', 'tienda_routes', 'app']
for mod in tests:
    try:
        __import__(mod)
        print(f"OK: {mod}")
    except Exception as e:
        print(f"FALLO: {mod} -> {e}")

print("\n--- Probando Flask ---")
try:
    from app import app
    print("app importado OK")
    from database import crear_tablas
    crear_tablas()
    print("DB OK")
    print("\nTodo OK - Flask deberia arrancar")
except Exception as e:
    print(f"ERROR: {e}")
    print(traceback.format_exc())

print("="*40)
