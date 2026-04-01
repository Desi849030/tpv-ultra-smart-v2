import re

with open('main.py', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # --- REGLA 1: Línea 119 (WebView) ---
    # Busca: self.webview.loadUrl('https://localhost:8080')
    if "self.webview.loadUrl" in line and "localhost:8080" in line:
        # Eliminar espacios al inicio para calcular indentación
        indent = len(line) - len(line.lstrip())
        spaces = " " * indent
        
        new_lines.append(spaces + "# Skip connection on GitHub Actions\n")
        new_lines.append(spaces + "if not os.environ.get('GITHUB_ACTIONS'):\n")
        new_lines.append(spaces + "    " + line.lstrip().replace("https://", "http://")) # Cambiar a http
        new_lines.append(spaces + "else:\n")
        new_lines.append(spaces + "    pass\n")
        i += 1
        
    # --- REGLA 2: Línea 72 (urllib) ---
    elif "urllib.request.urlopen" in line and "localhost:8080" in line:
        indent = len(line) - len(line.lstrip())
        spaces = " " * indent
        
        new_lines.append(spaces + "# Skip status check on GitHub Actions\n")
        new_lines.append(spaces + "if not os.environ.get('GITHUB_ACTIONS'):\n")
        new_lines.append(spaces + "    " + line.lstrip().replace("https://", "http://")) # Cambiar a http
        new_lines.append(spaces + "else:\n")
        new_lines.append(spaces + "    print('Skipping localhost check')\n")
        i += 1
        
    # --- REGLA 3: Línea 88 (webbrowser) ---
    elif "webbrowser.open" in line and "localhost:8080" in line:
        indent = len(line) - len(line.lstrip())
        spaces = " " * indent
        
        new_lines.append(spaces + "# Skip browser open on GitHub Actions\n")
        new_lines.append(spaces + "if not os.environ.get('GITHUB_ACTIONS'):\n")
        new_lines.append(spaces + "    " + line.lstrip().replace("https://", "http://")) # Cambiar a http
        new_lines.append(spaces + "else:\n")
        new_lines.append(spaces + "    print('Skipping browser open')\n")
        i += 1
        
    else:
        new_lines.append(line)
        i += 1

# Escribir el archivo parcheado
with open('main.py', 'w') as f:
    f.writelines(new_lines)

print("✅ Parche Maestro aplicado a las 3 líneas.")
print("   - Convertido a http:// (para evitar error SSL en localhost).")
print("   - Envuelto en bloque if GITHUB_ACTIONS.")
