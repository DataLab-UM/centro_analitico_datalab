"""
Genera los derivados de assets de marca:
 - skyboxes JPG optimizados por oficina
 - miniaturas (previews) para los portales del lobby
 - logo DataLab con fondo transparente
Uso: python tools/genera_derivados.py
"""
from PIL import Image

# escena -> (skybox jpg, preview jpg)
MAPA = {
    'assets/escenas/Escena 6 datalab.png':  ('assets/skybox-lobby.jpg',    'assets/prev-lobby.jpg'),
    'assets/escenas/escena 2.png':          ('assets/skybox-bi.jpg',       'assets/prev-bi.jpg'),
    'assets/escenas/escena 3.png':          ('assets/skybox-ia.jpg',       'assets/prev-ia.jpg'),
    'assets/escenas/escena 4.png':          ('assets/skybox-web.jpg',      'assets/prev-web.jpg'),
    'assets/escenas/escena 5.png':          ('assets/skybox-panorama.jpg', 'assets/prev-ciudad.jpg'),
}

for origen, (skybox, preview) in MAPA.items():
    img = Image.open(origen).convert('RGB')
    img.save(skybox, quality=85, optimize=True, progressive=True)
    w, h = img.size
    # recorte central de la panoramica como miniatura del portal
    crop = img.crop((int(w * 0.34), int(h * 0.26), int(w * 0.66), int(h * 0.62)))
    crop.resize((480, 300)).save(preview, quality=82, optimize=True)
    print(skybox, '+', preview)

# logo: blanco -> transparente
logo = Image.open('assets/logos/IMG_4446.PNG').convert('RGBA')
pix = logo.getdata()
logo.putdata([(r, g, b, 0) if r > 235 and g > 235 and b > 235 else (r, g, b, a)
              for r, g, b, a in pix])
logo.save('assets/logo-icono.png')
print('assets/logo-icono.png')
