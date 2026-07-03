# Centro Analítico Inmersivo

Recorrido VR (WebXR) por un centro analítico de datos, para Meta Quest.
Corre en el navegador — no requiere instalación en las gafas ni motor externo.

## Correr en local (modo simulado, sin gafas)

```sh
python -m http.server 8000
# o: npx serve
```

Abrir http://localhost:8000

**Controles escritorio:** mouse = mirar · WASD = moverse

**Simular las gafas:** instalar la extensión de Chrome
[Immersive Web Emulator](https://chromewebstore.google.com/detail/immersive-web-emulator/cgffilbpcibhmcfbgggfhfolhkfbhmik)
(de Meta) → DevTools → pestaña "WebXR" → emula visor y controles del Quest.

## Estructura

```
index.html          Escena A-Frame (ambiente, paneles, cámara)
js/panel-datos.js   Componente: dashboard animado canvas -> textura 3D
assets/             Skybox 360, videos (se agregan días 2-7)
```

## Estado (plan de 15 días)

- [x] Día 1: repo + escena base + panel animado validando canvas->textura
- [ ] Días 2-3: skybox 360 futurista propio
- [ ] Días 4-6: dashboards ECharts (3-4 paneles)
- [ ] Día 7: zona de desarrollo (video de código)
- [ ] Días 8-9: recorrido por 3 zonas + CTA
- [ ] Días 10-15: pruebas, rendimiento, integración, ensayo

## Integración con cualquier entorno

El punto de integración es la URL desplegada: cualquier motor (Unity, Unreal,
WebXR) puede abrirla en el Quest Browser. Plan B: los assets (skybox PNG,
videos MP4) son importables a cualquier motor.
