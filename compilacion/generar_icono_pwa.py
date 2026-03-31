"""
generar_icono_pwa.py  —  TPV Ultra Smart
Genera los iconos necesarios para la PWA (192x192 y 512x512)
Requiere: pip install pillow
"""

def generar_iconos():
    try:
        from PIL import Image, ImageDraw, ImageFont
        import os

        for size in [192, 512]:
            img = Image.new('RGB', (size, size), color='#1E4D8C')
            draw = ImageDraw.Draw(img)

            # Circulo interior blanco
            margen = int(size * 0.1)
            draw.ellipse(
                [margen, margen, size - margen, size - margen],
                fill='#2E75B6'
            )

            # Texto TPV centrado
            font_size = int(size * 0.22)
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()

            texto = "TPV"
            bbox = draw.textbbox((0, 0), texto, font=font)
            tw = bbox[2] - bbox[0]
            th = bbox[3] - bbox[1]
            x = (size - tw) // 2
            y = (size - th) // 2 - int(size * 0.05)
            draw.text((x, y), texto, fill='white', font=font)

            # Subtexto
            font_small_size = int(size * 0.1)
            try:
                font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_small_size)
            except Exception:
                font_small = ImageFont.load_default()

            subtexto = "SMART"
            bbox2 = draw.textbbox((0, 0), subtexto, font=font_small)
            sw = bbox2[2] - bbox2[0]
            sx = (size - sw) // 2
            sy = y + th + int(size * 0.02)
            draw.text((sx, sy), subtexto, fill='#ADD8FF', font=font_small)

            nombre = f'pwa-icon-{size}.png'
            img.save(nombre)
            print(f'✅ Icono generado: {nombre} ({size}x{size}px)')

        print('\n✅ Iconos listos. Cópialos a la carpeta de tu proyecto.')

    except ImportError:
        print('❌ Pillow no instalado. Ejecuta: pip install pillow')
        print('   O usa cualquier imagen PNG de 192x192 y 512x512 renombrada como:')
        print('   pwa-icon-192.png y pwa-icon-512.png')

if __name__ == '__main__':
    generar_iconos()
