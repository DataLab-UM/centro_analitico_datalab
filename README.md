# Centro Analítico Inmersivo — DataLab UM

Recorrido VR (WebXR) por un centro analítico de datos, para Meta Quest.
Corre en el navegador — no requiere instalación en las gafas ni motor externo.

**En vivo:** https://datalab-um.github.io/centro_analitico_datalab/

**Integración con otros entornos:** ver [INTEGRACION.md](INTEGRACION.md)

## Correr en local (modo simulado, sin gafas)

```sh
python -m http.server 8000
# o: npx serve
```

Abrir http://localhost:8000

**Controles escritorio:** mouse = mirar · WASD = moverse · clic en los anillos
del piso = teletransporte (en Quest: mirada fija 1.5 s)

**Simular las gafas:** instalar la extensión de Chrome
[Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)
(de Meta) → DevTools → pestaña "WebXR" → emula visor y controles del Quest.

## Estructura

```
index.html              Escena A-Frame (zonas, paneles, cámara, hotspots)
js/datos.js             Simulador de datos en vivo (sin backend)
js/paneles.js           Componente panel-echarts: dashboards -> textura 3D
js/terminal-codigo.js   Terminal con código escribiéndose en vivo
js/recorrido.js         Teletransporte por mirada + cambio de skybox
assets/                 Skyboxes 360 brandeados, logos, fuente MSDF
vendor/                 A-Frame y ECharts empaquetados (offline-first)
tools/genera_skybox.py  Generador del skybox procedural (plan B)
```

## Estado (plan de 15 días)

- [x] Día 1: repo + escena base + validación canvas->textura
- [x] Días 2-3: skybox 360 (procedural, luego brandeado DataLab)
- [x] Días 4-6: sala de control — 4 paneles ECharts en vivo
- [x] Día 7: zona de desarrollo — terminal de código en vivo
- [x] Días 8-9: recorrido — teletransporte, panorama de crecimiento, CTA
- [x] Empaquetado offline (librerías + fuente locales, cero red en runtime)
- [x] Deploy público (GitHub Pages) + branding DataLab UM
- [x] Día 13: paquete de integración (INTEGRACION.md)
- [ ] Día 10: prueba de usuario (ponerle la experiencia a alguien externo)
- [ ] Día 14: ensayo general con Quest físico + casting al TV
- [ ] Día 15: colchón / pulido final
