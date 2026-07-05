"""
Genera los audios de DATO con voz neural de Microsoft (edge-tts, gratis).
Lee los mensajes de los robot-guia directamente de index.html, les aplica
las correcciones de pronunciacion y guarda assets/voz/<hash djb2>.mp3 —
el mismo hash que calcula js/guia.js para encontrar el audio de cada frase.

Uso: python tools/genera_voces.py            (requiere internet solo al generar)
Voz: es-CO-GonzaloNeural (masculina, neutra latina). Cambiala abajo si quieres
     otra: edge-tts --list-voices | findstr es-
"""
import asyncio
import os
import re
import edge_tts

VOZ = "es-CO-GonzaloNeural"
RITMO = "+12%"   # agil, sin arrastrarse

PRONUNCIA = [
    (re.compile(r"24/7"), "veinticuatro siete"),
    (re.compile(r"\bIA\b"), "i a"),
    (re.compile(r"\bVR\b"), "realidad virtual"),
    (re.compile(r"\bUM\b"), "u eme"),
    (re.compile(r"e-commerce", re.I), "comercio electrónico"),
    (re.compile(r"\bapps\b", re.I), "aplicaciones"),
]


def djb2(txt):
    """Identico al djb2 de js/guia.js."""
    h = 5381
    for ch in txt:
        h = ((h * 33) ^ ord(ch)) & 0xFFFFFFFF
    return format(h, "x")


def extraer_mensajes(html):
    """Todos los mensajes de los robot-guia: 'mensajes' y 'regreso'."""
    frases = set()
    for bloque in re.findall(r'robot-guia="([^"]+)"', html):
        props = {}
        for parte in bloque.split(";"):
            if ":" in parte:
                clave, valor = parte.split(":", 1)
                props[clave.strip()] = valor.strip()
        for msg in props.get("mensajes", "").split("|"):
            if msg.strip():
                frases.add(msg.strip())
        if props.get("regreso"):
            frases.add(props["regreso"])
    return sorted(frases)


def pronunciable(msg):
    for regla, con in PRONUNCIA:
        msg = regla.sub(con, msg)
    return msg


async def main():
    html = open("index.html", encoding="utf-8").read()
    frases = extraer_mensajes(html)
    os.makedirs("assets/voz", exist_ok=True)

    for frase in frases:
        destino = f"assets/voz/{djb2(frase)}.mp3"
        if os.path.exists(destino):
            print("ya existe:", destino, "-", frase[:50])
            continue
        tts = edge_tts.Communicate(pronunciable(frase), VOZ, rate=RITMO)
        await tts.save(destino)
        print("generado:", destino, "-", frase[:50])

    print(f"\n{len(frases)} frases listas en assets/voz/")


asyncio.run(main())
