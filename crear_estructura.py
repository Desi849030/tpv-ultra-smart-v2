"""
╔══════════════════════════════════════════════════════════════╗
║   crear_estructura.py  —  TPV ULTRA SMART                   ║
║   Crea la estructura de carpetas organizada del proyecto     ║
╚══════════════════════════════════════════════════════════════╝

CÓMO USAR:
    1. Pon este archivo en la misma carpeta que tus archivos actuales
    2. Ejecuta: python crear_estructura.py
    3. Mueve los archivos a sus carpetas nuevas (el script lo indica)
"""

import os
import shutil

# ── Ruta base del proyecto ────────────────────────────────────
# Cambia esta ruta si tu proyecto está en otro lugar
BASE = os.path.dirname(os.path.abspath(__file__))

# ══════════════════════════════════════════════════════════════
#  ESTRUCTURA DE CARPETAS
# ══════════════════════════════════════════════════════════════
CARPETAS = [
    # Backend — toda la lógica Python
    "backend",

    # Frontend — interfaz de usuario
    "frontend/templates",       # index.html va aquí
    "frontend/static/js",       # archivos .js
    "frontend/static/css",      # archivos .css (si los creas)
    "frontend/static/icons",    # iconos de la app (PWA)
    "frontend/static/uploads",  # imágenes de productos subidas por el usuario

    # Base de datos — archivos .db y scripts SQL
    "database",

    # Configuración — claves secretas, variables de entorno
    "config",

    # Compilación — notebook de Colab y buildozer
    "compilacion",

    # Logs — registro de actividad (se genera automáticamente)
    "logs",
]

# ══════════════════════════════════════════════════════════════
#  MAPA DE ARCHIVOS ACTUALES → CARPETA DESTINO
# ══════════════════════════════════════════════════════════════
ARCHIVOS = {
    # ── Backend ──────────────────────────────────────────────
    "app.py":                           "backend",
    "database.py":                      "backend",
    "tienda_routes.py":                 "backend",
    "supabase_sync.py":                 "backend",
    "pwa_routes.py":                    "backend",

    # ── Raíz (permanecen aquí, son el punto de entrada) ──────
    "main.py":                          ".",        # Kivy lo busca aquí
    "buildozer.spec":                   ".",
    "requirements.txt":                 ".",

    # ── Frontend — HTML ───────────────────────────────────────
    "index.html":                       "frontend/templates",

    # ── Frontend — JavaScript ─────────────────────────────────
    "tpv_main.js":                      "frontend/static/js",
    "tpv_auth.js":                      "frontend/static/js",
    "tpv_tienda.js":                    "frontend/static/js",
    "tpv_export.js":                    "frontend/static/js",
    "tpv_debugger.js":                  "frontend/static/js",

    # ── Frontend — Iconos PWA ─────────────────────────────────
    "pwa-icon-192.png":                 "frontend/static/icons",
    "pwa-icon-512.png":                 "frontend/static/icons",
    "manifest.json":                    "frontend/static/icons",
    "service-worker.js":                "frontend/static/js",

    # ── Base de datos ─────────────────────────────────────────
    "tpv_datos.db":                     "database",
    "supabase_completo.sql":            "database",
    "supabase_tablas_faltantes.sql":    "database",

    # ── Configuración ─────────────────────────────────────────
    ".tpv_secret_key":                  "config",
    "_tpv_secret_key":                  "config",

    # ── Compilación ───────────────────────────────────────────
    "TPV_Compilar_APK.ipynb":           "compilacion",
    "TPV_Compilar_APK_FIXED.ipynb":     "compilacion",
    "generar_icono_pwa.py":             "compilacion",
}


def crear_carpetas():
    print("\n📂 Creando estructura de carpetas...\n")
    for carpeta in CARPETAS:
        ruta = os.path.join(BASE, carpeta)
        os.makedirs(ruta, exist_ok=True)
        print(f"   ✅ {carpeta}/")
    print("\n✅ Carpetas creadas correctamente\n")


def mover_archivos(modo_copia=False):
    """
    modo_copia=True  → copia los archivos (más seguro, original intacto)
    modo_copia=False → mueve los archivos
    """
    accion = "Copiando" if modo_copia else "Moviendo"
    print(f"📦 {accion} archivos a sus carpetas...\n")

    movidos   = []
    no_encontrados = []

    for archivo, destino in ARCHIVOS.items():
        origen = os.path.join(BASE, archivo)

        if not os.path.exists(origen):
            no_encontrados.append(archivo)
            continue

        if destino == ".":
            # Se queda en la raíz, no mover
            print(f"   📌 {archivo} → raíz (no se mueve)")
            continue

        carpeta_destino = os.path.join(BASE, destino)
        ruta_destino    = os.path.join(carpeta_destino, archivo)

        try:
            if modo_copia:
                shutil.copy2(origen, ruta_destino)
            else:
                shutil.move(origen, ruta_destino)
            movidos.append(f"{archivo} → {destino}/")
            print(f"   ✅ {archivo} → {destino}/")
        except Exception as e:
            print(f"   ❌ Error con {archivo}: {e}")

    print(f"\n✅ {len(movidos)} archivos procesados")
    if no_encontrados:
        print(f"⚠️  No encontrados ({len(no_encontrados)}): {', '.join(no_encontrados)}")


def crear_gitignore():
    """Crea un .gitignore para no subir archivos sensibles a GitHub."""
    contenido = """# TPV Ultra Smart — archivos a ignorar en Git

# Claves secretas (NUNCA subir)
config/
.tpv_secret_key
_tpv_secret_key
*.key

# Base de datos local
database/*.db

# Compilación Android (archivos grandes)
.buildozer/
bin/
*.apk

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.egg-info/

# Entornos virtuales
venv/
env/
.venv/

# Logs
logs/
*.log

# Sistema operativo
.DS_Store
Thumbs.db
"""
    ruta = os.path.join(BASE, ".gitignore")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(contenido)
    print("✅ .gitignore creado")


def crear_readme():
    """Crea un README.md con la documentación básica."""
    contenido = """# TPV Ultra Smart v7.0

Sistema de Punto de Venta profesional para Android.
Funciona offline con SQLite y sincroniza con Supabase cuando hay internet.

## Estructura del proyecto

```
TPV_APK/
├── main.py                     ← Punto de entrada (Kivy + Android)
├── buildozer.spec              ← Config compilación APK
├── requirements.txt            ← Dependencias Python
│
├── backend/                    ← Lógica del servidor
│   ├── app.py                  ← Flask: API REST completa
│   ├── database.py             ← Base de datos SQLite
│   ├── tienda_routes.py        ← Rutas del módulo tienda
│   ├── supabase_sync.py        ← Sincronización con Supabase
│   └── pwa_routes.py           ← Rutas PWA (manifest, SW, iconos)
│
├── frontend/
│   ├── templates/
│   │   └── index.html          ← Interfaz principal del TPV
│   └── static/
│       ├── js/                 ← Módulos JavaScript
│       │   ├── tpv_main.js
│       │   ├── tpv_auth.js
│       │   ├── tpv_tienda.js
│       │   ├── tpv_export.js
│       │   ├── tpv_debugger.js
│       │   └── service-worker.js
│       ├── icons/              ← Iconos de la app
│       │   ├── pwa-icon-192.png
│       │   ├── pwa-icon-512.png
│       │   └── manifest.json
│       └── uploads/            ← Imágenes de productos
│
├── database/                   ← Datos y scripts SQL
│   ├── tpv_datos.db
│   ├── supabase_completo.sql
│   └── supabase_tablas_faltantes.sql
│
├── config/                     ← Configuración (no subir a Git)
│   └── .tpv_secret_key
│
└── compilacion/                ← Herramientas para generar APK
    ├── TPV_Compilar_APK_FIXED.ipynb
    └── generar_icono_pwa.py
```

## Cómo compilar la APK

1. Sube la carpeta a Google Drive
2. Abre `compilacion/TPV_Compilar_APK_FIXED.ipynb` en Google Colab
3. Ejecuta las celdas en orden
4. Descarga la APK de la carpeta `bin/`

## Tecnologías

- **Backend**: Python 3 + Flask
- **Frontend**: HTML5 + CSS3 + JavaScript ES6
- **Base de datos local**: SQLite
- **Nube**: Supabase (PostgreSQL)
- **App Android**: Kivy + Buildozer
"""
    ruta = os.path.join(BASE, "README.md")
    with open(ruta, "w", encoding="utf-8") as f:
        f.write(contenido)
    print("✅ README.md creado")


# ══════════════════════════════════════════════════════════════
#  MENÚ PRINCIPAL
# ══════════════════════════════════════════════════════════════

def menu():
    print("=" * 55)
    print("  TPV ULTRA SMART — Organizar estructura del proyecto")
    print("=" * 55)
    print()
    print("  1. Solo crear las carpetas vacías")
    print("  2. Crear carpetas Y copiar archivos (original intacto)")
    print("  3. Crear carpetas Y mover archivos (más limpio)")
    print("  4. Solo crear .gitignore y README.md")
    print("  5. Todo completo (carpetas + mover + gitignore + readme)")
    print()

    opcion = input("  Elige una opción (1-5): ").strip()

    if opcion == "1":
        crear_carpetas()

    elif opcion == "2":
        crear_carpetas()
        mover_archivos(modo_copia=True)

    elif opcion == "3":
        crear_carpetas()
        mover_archivos(modo_copia=False)

    elif opcion == "4":
        crear_gitignore()
        crear_readme()

    elif opcion == "5":
        crear_carpetas()
        mover_archivos(modo_copia=False)
        crear_gitignore()
        crear_readme()
        print("\n🎉 ¡Proyecto organizado completamente!")

    else:
        print("Opción no válida")

    print()


if __name__ == "__main__":
    menu()
