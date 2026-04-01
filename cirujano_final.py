import re

print("🔧 Iniciando reparación definitiva...")

# 1. Leer el archivo
with open('main.py', 'r') as f:
    content = f.read()

# --- REPARACIÓN 1: WebView (loadUrl) ---
# Busca la línea exacta y la reemplaza por el bloque protegido
pattern_webview = r"(\s+)self\.webview\.loadUrl\('http://localhost:8080'\)"
replace_webview = r"\1if not os.environ.get('GITHUB_ACTIONS'):\n\1    self.webview.loadUrl('http://localhost:8080')\n\1else:\n\1    pass"
content, count1 = re.subn(pattern_webview, replace_webview, content)
print(f"🔩 WebView parcheada: {count1} cambios.")

# --- REPARACIÓN 2: Webbrowser (btn.bind) ---
# Esta línea es un lambda, hay que ser cuidadoso
pattern_browser = r"(\s+)self\.btn\.bind\(on_press=lambda x: __import__\('webbrowser'\)\.open\(\"http://localhost:8080\"\)\)"
replace_browser = r"\1if not os.environ.get('GITHUB_ACTIONS'):\n\1    self.btn.bind(on_press=lambda x: __import__('webbrowser').open(\"http://localhost:8080\"))\n\1else:\n\1    pass"
content, count2 = re.subn(pattern_browser, replace_browser, content)
print(f"🔩 Webbrowser parcheada: {count2} cambios.")

# --- REPARACIÓN 3: Urllib (urlopen) ---
# Busca la línea de llamada a la función
pattern_urllib = r"(\s+)urllib\.request\.urlopen\(\"http://localhost:8080/api/status\", timeout=1\)"
replace_urllib = r"\1if not os.environ.get('GITHUB_ACTIONS'):\n\1    urllib.request.urlopen(\"http://localhost:8080/api/status\", timeout=1)"
content, count3 = re.subn(pattern_urllib, replace_urllib, content)
print(f"🔩 Urllib parcheada: {count3} cambios.")

# --- REPARACIÓN 4: Asegurar import os ---
if "import os" not in content:
    # Insertar después de shebang o al inicio
    lines = content.split('\n')
    insert_pos = 0
    if lines[0].startswith("#!"):
        insert_pos = 1
    lines.insert(insert_pos, "import os")
    content = '\n'.join(lines)
    print("🔩 Import os añadido.")
else:
    print("✅ Import os ya existe.")

# --- GUARDAR ---
with open('main.py', 'w') as f:
    f.write(content)

print("✅ Archivo main.py guardado con éxito.")
