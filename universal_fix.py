import re

with open('main.py', 'r') as f:
    content = f.read()

# 1. Forzar cambio de https a http (para evitar errores SSL en localhost)
content = re.sub(r"https://localhost:8080", "http://localhost:8080", content)

# 2. Encontrar TODAS las líneas con localhost y envolverlas en el if/else
# Explicación Regex:
# ^(\s+)       -> Captura la indentación (espacios al inicio)
# (.*localhost:8080.*) -> Captura toda la línea
pattern = r"^(\s+)(.*localhost:8080.*)"
replacement = r"\1if not os.environ.get('GITHUB_ACTIONS'):\n\1    \2\n\1else:\n\1    pass"

new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE)

if new_content != content:
    with open('main.py', 'w') as f:
        f.write(new_content)
    print("✅ Parche Universal aplicado a TODAS las líneas con localhost.")
else:
    print("⚠️ No se detectaron cambios (¿Ya estaba parcheado?). Revisando...")
    # Chequeo manual por si acaso
    if "GITHUB_ACTIONS" not in new_content:
        print("❌ ERROR: El parche no se aplicó y el archivo no tiene protección.")

# 3. Asegurar import os (Revisión rápida)
lines = open('main.py').readlines()
has_import = any("import os" in l for l in lines[:5])
if not has_import:
    with open('main.py', 'r') as f: lines = f.readlines()
    idx = 1 if lines[0].startswith("#!") else 0
    lines.insert(idx, "import os\n")
    with open('main.py', 'w') as f: f.writelines(lines)
    print("✅ Import 'os' añadido.")
else:
    print("✅ Import 'os' ya existe.")
