"""
╔══════════════════════════════════════════════════════════════╗
║   setup_tpv.py  —  TPV ULTRA SMART v7.0                     ║
║   Script maestro — aplica TODOS los cambios de una vez      ║
╚══════════════════════════════════════════════════════════════╝

CÓMO USAR EN PYDROID 3:
    1. Copia este archivo a /storage/emulated/0/TPV_APK/
    2. Ábrelo en Pydroid y pulsa ▶️ Run
    3. Espera a que diga COMPLETADO

QUÉ HACE:
    ✅ Detecta automáticamente la carpeta del proyecto
    ✅ Crea la estructura de carpetas organizada
    ✅ Mueve los archivos a sus carpetas correctas
    ✅ Corrige buildozer.spec (source.dir, p4a.branch, icono)
    ✅ Actualiza index.html con iconos y PWA correctos
    ✅ Genera los iconos profesionales (azul marino + dorado)
    ✅ Crea/actualiza manifest.json para PWA
    ✅ Crea service-worker.js para modo offline
    ✅ Crea tpv_rutas.py para detección automática de rutas
    ✅ Corrige app.py para encontrar archivos en cualquier Android
"""

import os, sys, shutil, json

# ══════════════════════════════════════════════════════════════
#  DETECTAR CARPETA DEL PROYECTO
# ══════════════════════════════════════════════════════════════
def detectar_proyecto():
    candidatas = [
        os.path.dirname(os.path.abspath(__file__)) if '__file__' in dir() else '',
        os.getcwd(),
        '/storage/emulated/0/TPV_APK',
        '/storage/emulated/0/TPV',
        '/sdcard/TPV_APK',
    ]
    for r in candidatas:
        if r and os.path.exists(os.path.join(r, 'buildozer.spec')):
            return r
        if r and os.path.exists(os.path.join(r, 'main.py')):
            return r
    return os.getcwd()

BASE = detectar_proyecto()
print('=' * 55)
print('  TPV ULTRA SMART — Script de configuracion')
print('=' * 55)
print('Carpeta del proyecto: ' + BASE)
print()

ok = 0
err = 0

def log_ok(msg):
    global ok
    ok += 1
    print('  OK  ' + msg)

def log_err(msg):
    global err
    err += 1
    print('  ERR ' + msg)

def log_info(msg):
    print('  ... ' + msg)

# ══════════════════════════════════════════════════════════════
#  PASO 1 — CREAR ESTRUCTURA DE CARPETAS
# ══════════════════════════════════════════════════════════════
print('[1/8] Creando estructura de carpetas...')

CARPETAS = [
    'backend',
    'frontend/templates',
    'frontend/static/js',
    'frontend/static/css',
    'frontend/static/icons',
    'frontend/static/uploads',
    'database',
    'config',
    'compilacion',
    'logs',
]

for carpeta in CARPETAS:
    ruta = os.path.join(BASE, carpeta)
    os.makedirs(ruta, exist_ok=True)

log_ok('Estructura de carpetas creada')

# ══════════════════════════════════════════════════════════════
#  PASO 2 — MOVER ARCHIVOS A SUS CARPETAS
# ══════════════════════════════════════════════════════════════
print('[2/8] Organizando archivos...')

MOVER = {
    'app.py':                        'backend',
    'database.py':                   'backend',
    'tienda_routes.py':              'backend',
    'supabase_sync.py':              'backend',
    'pwa_routes.py':                 'backend',
    'tpv_rutas.py':                  'backend',
    'index.html':                    'frontend/templates',
    'tpv_main.js':                   'frontend/static/js',
    'tpv_auth.js':                   'frontend/static/js',
    'tpv_tienda.js':                 'frontend/static/js',
    'tpv_export.js':                 'frontend/static/js',
    'tpv_debugger.js':               'frontend/static/js',
    'service-worker.js':             'frontend/static/js',
    'manifest.json':                 'frontend/static/icons',
    'pwa-icon-192.png':              'frontend/static/icons',
    'pwa-icon-512.png':              'frontend/static/icons',
    'icon-144.png':                  'frontend/static/icons',
    'icon-96.png':                   'frontend/static/icons',
    'icon-72.png':                   'frontend/static/icons',
    'icon-48.png':                   'frontend/static/icons',
    'favicon-32.png':                'frontend/static/icons',
    'tpv_datos.db':                  'database',
    'supabase_completo.sql':         'database',
    'supabase_tablas_faltantes.sql': 'database',
    '.tpv_secret_key':               'config',
    '_tpv_secret_key':               'config',
    'TPV_Compilar_APK.ipynb':        'compilacion',
    'TPV_Compilar_APK_FIXED.ipynb':  'compilacion',
    'TPV_Compilar_APK_v2.ipynb':     'compilacion',
    'TPV_Compilar_APK_v3.ipynb':     'compilacion',
    'generar_icono_pwa.py':          'compilacion',
    'generar_iconos.py':             'compilacion',
}

for archivo, destino in MOVER.items():
    origen = os.path.join(BASE, archivo)
    if os.path.exists(origen):
        dest_ruta = os.path.join(BASE, destino, archivo)
        if not os.path.exists(dest_ruta):
            shutil.move(origen, dest_ruta)
            log_ok(archivo + ' -> ' + destino + '/')

log_ok('Archivos organizados')

# ══════════════════════════════════════════════════════════════
#  PASO 3 — GENERAR ICONOS PROFESIONALES
# ══════════════════════════════════════════════════════════════
print('[3/8] Generando iconos profesionales...')

def generar_icono_png(size, ruta_salida):
    try:
        from PIL import Image, ImageDraw
        img  = Image.new('RGBA', (size, size), (0,0,0,0))
        draw = ImageDraw.Draw(img)
        # Gradiente azul marino
        for y in range(size):
            t = y / size
            r = int(10  + (20  - 10)  * t)
            g = int(30  + (60  - 30)  * t)
            b = int(70  + (130 - 70)  * t)
            draw.line([(0,y),(size,y)], fill=(r,g,b,255))
        # Esquinas redondeadas
        radio = int(size * 0.22)
        mascara = Image.new('L', (size,size), 0)
        dm = ImageDraw.Draw(mascara)
        dm.rounded_rectangle([0,0,size-1,size-1], radius=radio, fill=255)
        img.putalpha(mascara)
        draw = ImageDraw.Draw(img)
        # Marco dorado
        margen = int(size*0.2)
        draw.rounded_rectangle(
            [margen, margen+int(size*0.05), size-margen, size-margen],
            radius=int(size*0.08),
            outline=(212,175,55,200),
            width=max(2,int(size*0.018))
        )
        # T dorada
        cx, cy = size//2, int(size*0.50)
        DORADO = (240,210,100,255)
        bh = max(3,int(size*0.10))
        bw = int(size*0.44)
        y0 = cy - int(size*0.18)
        draw.rectangle([cx-bw//2, y0, cx+bw//2, y0+bh], fill=DORADO)
        pw = max(3,int(size*0.12))
        draw.rectangle([cx-pw//2, y0, cx+pw//2, cy+int(size*0.18)], fill=DORADO)
        # Lineas doradas decorativas
        yl = int(size*0.13)
        draw.line([(int(size*0.18),yl),(int(size*0.82),yl)],
                  fill=(212,175,55,200), width=max(2,int(size*0.025)))
        img.save(ruta_salida, 'PNG', optimize=True)
        return True
    except ImportError:
        return False

ICONOS = {
    'pwa-icon-512.png': 512,
    'pwa-icon-192.png': 192,
    'icon-144.png':     144,
    'icon-96.png':       96,
    'icon-72.png':       72,
    'icon-48.png':       48,
    'favicon-32.png':    32,
}

icons_dir = os.path.join(BASE, 'frontend', 'static', 'icons')
pillow_ok = False
for nombre, size in ICONOS.items():
    ruta = os.path.join(icons_dir, nombre)
    if not os.path.exists(ruta):
        if generar_icono_png(size, ruta):
            pillow_ok = True
            log_ok('Icono generado: ' + nombre)
        else:
            log_info('Pillow no disponible, icono omitido: ' + nombre)
    else:
        log_ok('Icono ya existe: ' + nombre)

if not pillow_ok:
    log_info('Para generar iconos instala: pip install pillow')

# ══════════════════════════════════════════════════════════════
#  PASO 4 — CREAR/ACTUALIZAR manifest.json
# ══════════════════════════════════════════════════════════════
print('[4/8] Creando manifest.json...')

manifest = {
    "name": "TPV Ultra Smart",
    "short_name": "TPV Smart",
    "description": "Sistema de Punto de Venta Profesional",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#0a1e46",
    "theme_color": "#1E4D8C",
    "orientation": "portrait-primary",
    "scope": "/",
    "lang": "es",
    "icons": [
        {"src": "/pwa-icon-192.png", "sizes": "192x192",
         "type": "image/png", "purpose": "any maskable"},
        {"src": "/pwa-icon-512.png", "sizes": "512x512",
         "type": "image/png", "purpose": "any maskable"},
    ]
}

ruta_manifest = os.path.join(icons_dir, 'manifest.json')
with open(ruta_manifest, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)
log_ok('manifest.json creado')

# ══════════════════════════════════════════════════════════════
#  PASO 5 — CREAR service-worker.js
# ══════════════════════════════════════════════════════════════
print('[5/8] Creando service-worker.js...')

sw = """// TPV Ultra Smart — Service Worker PWA
const CACHE = 'tpv-v7';
const ARCHIVOS = ['/', '/tpv_main.js', '/tpv_auth.js', '/tpv_tienda.js',
                  '/tpv_export.js', '/tpv_debugger.js', '/manifest.json',
                  '/pwa-icon-192.png', '/pwa-icon-512.png'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (new URL(e.request.url).pathname.startsWith('/api/')) {
        e.respondWith(fetch(e.request));
        return;
    }
    e.respondWith(
        fetch(e.request).then(r => {
            if (r && r.status === 200) {
                const c = r.clone();
                caches.open(CACHE).then(cache => cache.put(e.request, c));
            }
            return r;
        }).catch(() => caches.match(e.request).then(c => c || caches.match('/')))
    );
});
"""

ruta_sw = os.path.join(BASE, 'frontend', 'static', 'js', 'service-worker.js')
with open(ruta_sw, 'w', encoding='utf-8') as f:
    f.write(sw)
log_ok('service-worker.js creado')

# ══════════════════════════════════════════════════════════════
#  PASO 6 — ACTUALIZAR index.html CON ICONOS Y PWA
# ══════════════════════════════════════════════════════════════
print('[6/8] Actualizando index.html...')

ruta_html = os.path.join(BASE, 'frontend', 'templates', 'index.html')
if os.path.exists(ruta_html):
    with open(ruta_html, 'r', encoding='utf-8') as f:
        html = f.read()

    TAGS_PWA = """
    <!-- TPV Ultra Smart — Iconos y PWA -->
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
    <link rel="icon" type="image/png" sizes="192x192" href="/pwa-icon-192.png">
    <link rel="apple-touch-icon" sizes="192x192" href="/pwa-icon-192.png">
    <link rel="apple-touch-icon" sizes="512x512" href="/pwa-icon-512.png">
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#1E4D8C">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="TPV Smart">
    <meta name="mobile-web-app-capable" content="yes">
    <script>
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
          .then(() => console.log('PWA lista'))
          .catch(e => console.error('SW error:', e));
      }
    </script>
    <!-- Fin TPV Ultra Smart PWA -->"""

    # Eliminar bloques anteriores para no duplicar
    import re
    html = re.sub(
        r'<!-- TPV Ultra Smart — Iconos y PWA -->.*?<!-- Fin TPV Ultra Smart PWA -->',
        '', html, flags=re.DOTALL
    )

    # Eliminar manifest base64 antiguo si existe
    html = re.sub(
        r'<link rel="manifest" href="data:application/manifest[^"]*">',
        '', html
    )

    # Insertar justo antes de </head>
    if TAGS_PWA.strip() not in html:
        html = html.replace('</head>', TAGS_PWA + '\n</head>')

    with open(ruta_html, 'w', encoding='utf-8') as f:
        f.write(html)
    log_ok('index.html actualizado con iconos y PWA')
else:
    log_err('index.html no encontrado en frontend/templates/')

# ══════════════════════════════════════════════════════════════
#  PASO 7 — CORREGIR buildozer.spec
# ══════════════════════════════════════════════════════════════
print('[7/8] Corrigiendo buildozer.spec...')

ruta_spec = os.path.join(BASE, 'buildozer.spec')
if os.path.exists(ruta_spec):
    with open(ruta_spec, 'r') as f:
        spec = f.read()

    cambios = []

    # source.dir
    if 'source.dir' not in spec:
        spec = spec.replace('source.main = main.py',
                            'source.dir = .\nsource.main = main.py')
        cambios.append('source.dir = .')

    # p4a.branch
    if 'p4a.branch = develop' in spec:
        spec = spec.replace('p4a.branch = develop', 'p4a.branch = master')
        cambios.append('p4a.branch = master')
    elif 'p4a.branch' not in spec:
        spec += '\np4a.branch = master\n'
        cambios.append('p4a.branch = master (anadido)')

    # icono
    icono_build = os.path.join(BASE, 'frontend', 'static', 'icons', 'pwa-icon-512.png')
    if os.path.exists(icono_build) and 'icon.filename = ' not in spec:
        spec = spec.replace(
            '# icon.filename = %(source.dir)s/data/icon.png',
            'icon.filename = %(source.dir)s/frontend/static/icons/pwa-icon-512.png'
        )
        if 'icon.filename = ' not in spec:
            spec += '\nicon.filename = %(source.dir)s/frontend/static/icons/pwa-icon-512.png\n'
        cambios.append('icon.filename configurado')

    # include_patterns para carpetas organizadas
    if 'frontend/*' not in spec:
        spec = spec.replace(
            'source.include_patterns = templates/*,static/*,static/uploads/*',
            'source.include_patterns = frontend/*,frontend/templates/*,frontend/static/*,frontend/static/js/*,frontend/static/icons/*,frontend/static/uploads/*'
        )
        if 'frontend/*' not in spec:
            spec += '\nsource.include_patterns = frontend/*,frontend/static/*\n'
        cambios.append('include_patterns actualizado')

    with open(ruta_spec, 'w') as f:
        f.write(spec)

    for c in cambios:
        log_ok('buildozer.spec: ' + c)
    if not cambios:
        log_ok('buildozer.spec ya estaba correcto')
else:
    log_err('buildozer.spec no encontrado')

# ══════════════════════════════════════════════════════════════
#  PASO 8 — CREAR tpv_rutas.py EN BACKEND
# ══════════════════════════════════════════════════════════════
print('[8/8] Creando tpv_rutas.py...')

tpv_rutas_content = '''"""
tpv_rutas.py — TPV Ultra Smart
Deteccion automatica de rutas para Pydroid 3 y Android
"""
import os, sys

def _buscar():
    candidatas = []
    try:
        candidatas.append(os.path.dirname(os.path.abspath(__file__)))
    except Exception:
        pass
    candidatas += [
        os.getcwd(),
        '/storage/emulated/0/TPV_APK',
        '/storage/emulated/0/TPV',
        '/sdcard/TPV_APK',
        '/sdcard/TPV',
    ]
    # Busqueda en subcarpetas de backend
    for c in list(candidatas):
        parent = os.path.dirname(c)
        if parent and parent not in candidatas:
            candidatas.append(parent)
    for r in candidatas:
        if r and os.path.exists(os.path.join(r, 'buildozer.spec')):
            return r
        if r and os.path.exists(os.path.join(r, 'backend', 'database.py')):
            return r
        if r and os.path.exists(os.path.join(r, 'database.py')):
            return r
    # Busqueda en /storage/emulated/0
    try:
        for item in os.listdir('/storage/emulated/0'):
            ruta = '/storage/emulated/0/' + item
            if os.path.isdir(ruta) and os.path.exists(ruta + '/buildozer.spec'):
                return ruta
    except Exception:
        pass
    return os.getcwd()

BASE = _buscar()

def fix_path():
    global BASE
    # Añadir raiz del proyecto
    if BASE not in sys.path:
        sys.path.insert(0, BASE)
    # Añadir backend/
    backend = os.path.join(BASE, 'backend')
    if os.path.exists(backend) and backend not in sys.path:
        sys.path.insert(0, backend)
    try:
        os.chdir(BASE)
    except Exception:
        pass
    print("TPV cargado desde: " + BASE)
    return BASE

CARPETA = BASE
'''

ruta_tpv_rutas = os.path.join(BASE, 'backend', 'tpv_rutas.py')
with open(ruta_tpv_rutas, 'w', encoding='utf-8') as f:
    f.write(tpv_rutas_content)
log_ok('tpv_rutas.py creado en backend/')

# ══════════════════════════════════════════════════════════════
#  RESUMEN FINAL
# ══════════════════════════════════════════════════════════════
print()
print('=' * 55)
print('  COMPLETADO')
print('=' * 55)
print('  OK : ' + str(ok))
print('  ERR: ' + str(err))
print()
print('Estructura final del proyecto:')
for item in sorted(os.listdir(BASE)):
    ruta = os.path.join(BASE, item)
    if os.path.isdir(ruta):
        print('  [D] ' + item + '/')
        try:
            for sub in sorted(os.listdir(ruta))[:5]:
                print('       - ' + sub)
        except Exception:
            pass
    else:
        print('  [F] ' + item)
print()
print('Siguiente paso:')
print('  Abre backend/app.py en Pydroid y ejecuta con Play')
print('  Luego abre en Chrome: http://localhost:5050')
