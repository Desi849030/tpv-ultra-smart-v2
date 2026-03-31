#!/bin/bash
echo "📝 Generando reporte de auditoría..."

cat << 'REPORT' > reporte_auditoria.txt
=== INFORME DE AUDITORÍA TPV ULTRA SMART ===
Fecha: $(date)
====================================

--- 1. DEPENDENCIAS (requirements.txt) ---
REPORT

if [ -f requirements.txt ]; then
    cat requirements.txt >> reporte_auditoria.txt
else
    echo "No encontrado" >> reporte_auditoria.txt
fi

cat << 'REPORT' >> reporte_auditoria.txt

--- 2. CONFIGURACIÓN (buildozer.spec) ---
REPORT

if [ -f buildozer.spec ]; then
    cat buildozer.spec >> reporte_auditoria.txt
else
    echo "No encontrado" >> reporte_auditoria.txt
fi

cat << 'REPORT' >> reporte_auditoria.txt

--- 3. INICIO DE LA APP (main.py - primeras 30 líneas) ---
REPORT

head -n 30 main.py >> reporte_auditoria.txt

cat << 'REPORT' >> reporte_auditoria.txt

--- 4. CONEXIONES LOCALHOST ---
REPORT

grep -n "localhost" main.py >> reporte_auditoria.txt

cat << 'REPORT' >> reporte_auditoria.txt

--- 5. ESTRUCTURA DE CARPETAS ---
REPORT

ls -R >> reporte_auditoria.txt

cat << 'REPORT' >> reporte_auditoria.txt

====================================
FIN DEL INFORME
REPORT

echo "✅ Reporte generado exitosamente en: reporte_auditoria.txt"
echo "👉 Ahora abre el archivo y pega el contenido aquí."
