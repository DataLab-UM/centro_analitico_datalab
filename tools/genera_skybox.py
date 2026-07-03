"""
Genera el skybox 360 procedural (placeholder de calidad) y la textura de piso.
Uso: python tools/genera_skybox.py
Salida: assets/skybox.png (4096x2048 equirectangular) y assets/piso-grid.png

El skybox final se puede reemplazar por uno de Blockade Labs (mismo nombre
de archivo, mismo formato equirectangular) sin tocar codigo.
"""
import math
import random
from PIL import Image, ImageDraw, ImageFilter

random.seed(42)  # reproducible

W, H = 4096, 2048
HORIZONTE = H // 2

# --- cielo: gradiente espacio profundo -> horizonte cian ---
img = Image.new("RGB", (W, H))
px = img.load()
for y in range(H):
    if y < HORIZONTE:
        # de casi negro (arriba) a azul profundo (horizonte)
        t = y / HORIZONTE
        r = int(2 + 8 * t)
        g = int(4 + 24 * t)
        b = int(10 + 48 * t)
    else:
        # bajo el horizonte: azul oscuro que se apaga (lo tapa el piso)
        t = (y - HORIZONTE) / (H - HORIZONTE)
        r = int(10 - 8 * t)
        g = int(28 - 22 * t)
        b = int(58 - 46 * t)
    for x in range(0, W):
        px[x, y] = (r, g, b)

draw = ImageDraw.Draw(img, "RGBA")

# --- resplandor del horizonte (banda cian) ---
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
for i in range(90):
    alpha = int(70 * (1 - i / 90) ** 2)
    gd.line([(0, HORIZONTE - i), (W, HORIZONTE - i)], fill=(60, 200, 255, alpha))
    gd.line([(0, HORIZONTE + i // 2), (W, HORIZONTE + i // 2)], fill=(40, 160, 220, alpha // 2))
img = Image.alpha_composite(img.convert("RGBA"), glow)

# --- pilares de luz ("flujos de datos" subiendo del horizonte) ---
pilares = Image.new("RGBA", (W, H), (0, 0, 0, 0))
pd = ImageDraw.Draw(pilares)
for _ in range(26):
    x = random.randint(0, W)
    altura = random.randint(180, 520)
    ancho = random.randint(3, 10)
    tono = random.choice([(80, 220, 255), (120, 255, 200), (90, 180, 255)])
    for dy in range(altura):
        alpha = int(60 * (1 - dy / altura) ** 1.5)
        pd.line([(x - ancho // 2, HORIZONTE - dy), (x + ancho // 2, HORIZONTE - dy)],
                fill=tono + (alpha,))
pilares = pilares.filter(ImageFilter.GaussianBlur(3))
img = Image.alpha_composite(img, pilares)

# --- estrellas (mas densas arriba) ---
draw = ImageDraw.Draw(img, "RGBA")
for _ in range(2600):
    x = random.randint(0, W - 1)
    y = int(abs(random.gauss(0, HORIZONTE * 0.45)))  # concentradas arriba
    if y >= HORIZONTE - 60:
        continue
    brillo = random.randint(90, 255)
    tam = random.choice([1, 1, 1, 2])
    draw.ellipse([x, y, x + tam, y + tam], fill=(brillo, brillo, min(255, brillo + 30), 255))

img.convert("RGB").save("assets/skybox.png", optimize=True)
print("assets/skybox.png listo")

# --- piso: grid tileable oscuro con lineas cian ---
G = 512
piso = Image.new("RGB", (G, G), (6, 14, 24))
gd = ImageDraw.Draw(piso, "RGBA")
paso = 64
for i in range(0, G + 1, paso):
    gd.line([(i, 0), (i, G)], fill=(50, 170, 220, 90), width=2)
    gd.line([(0, i), (G, i)], fill=(50, 170, 220, 90), width=2)
# linea mayor cada 4 celdas
for i in range(0, G + 1, paso * 4):
    gd.line([(i, 0), (i, G)], fill=(80, 220, 255, 150), width=3)
    gd.line([(0, i), (G, i)], fill=(80, 220, 255, 150), width=3)
piso.save("assets/piso-grid.png", optimize=True)
print("assets/piso-grid.png listo")
