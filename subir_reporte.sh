#!/bin/bash

echo "📝 Generando y subiendo reporte a GitHub Gist..."

# Crear el contenido del reporte
CONTENIDO="=== INFORME DE AUDITORÍA TPV ULTRA SMART ===
Fecha: $(date)
====================================

--- 1. DEPENDENCIAS (requirements.txt) ---
 $(if [ -f requirements.txt ]; then cat requirements.txt; else echo "No encontrado"; fi)

--- 2. CONFIGURACIÓN (buildozer.spec) ---
 $(if [ -f buildozer.spec ]; then cat buildozer.spec; else echo "No encontrado"; fi)

--- 3. INICIO DE LA APP (main.py - primeras 30 líneas) ---
 $(head -n 30 main.py)

--- 4. CONEXIONES LOCALHOST ---
 $(grep -n "localhost" main.py)

--- 5. ESTRUCTURA DE CARPETAS ---
 $(ls -R)
"

# Subir usando GitHub CLI (gh)
# Nota: Esto creará un Gist público. Si es privado, quita el flag --public
echo "$CONTENIDO" | gh gist create --public --filename "reporte_auditoria.txt" --desc "Reporte automático TPV"

echo ""
echo "✅ ¡Reporte subido!"
echo "👀 Revisa el enlace de arriba (el que empieza por https://gist.github.com/...)"
echo "👌 Por favor, cópiale ese enlace y pégamelo aquí en el chat."
