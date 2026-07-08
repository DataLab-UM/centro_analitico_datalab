# Centro Analítico Inmersivo — DataLab UM

Recorrido VR (WebXR / A-Frame) por las oficinas de DataLab UM, pensado para
Meta Quest en un stand de feria. **100 % estático y offline-first**: sin build,
sin backend, las librerías viven en `vendor/`. Se publica en GitHub Pages con
cada push a `main` (https://datalab-um.github.io/centro_analitico_datalab/).

## Cómo correr y probar

```bash
python -m http.server 8000    # desde la raíz del repo → http://localhost:8000
```

No hay suite de tests. Verificación: abrir en navegador, o headless con
Playwright (los scripts de prueba de sesiones anteriores viven en el
scratchpad, no en el repo). En el Quest: Quest Browser → URL → botón VR.

## Mapa del mundo

Un solo `index.html` con 5 zonas separadas 60 m entre sí (el rig se
teletransporta, el fondo 360 cambia):

| Zona | Centro | Fondo | Fuente panorámica |
|---|---|---|---|
| Lobby (origen) | `0 0 0` | `#video-lobby` (`escena 6VR.mp4`) | `assets/escenas/Escena 6 datalab.png` |
| Business Intelligence | `-60 0 0` | `#video-bi` (`escena 2VR.mp4`) | `escena 2.png` |
| Agentes de IA | `60 0 0` | `#video-ia` (`escena 3VR.mp4`) | `escena 3.png` |
| Plataformas Web | `0 0 -60` | `#video-web` (`escena 4VR.mp4`) | `escena 4.png` |
| Panorama de Crecimiento | `0 0 60` | `#video-panorama` (`escena 5VR.mp4`) | `escena 5.png` |

## Sistema de fondos 360 (imagen + video)

- Cada zona tiene un skybox JPG estático **y** un video 360 generado en Kling
  (image-to-video desde la panorámica, cámara estática) en `assets/videos/`.
- `js/portal.js` — componente `portal`: teletransporta y conmuta fondo. Si el
  portal declara `video:` y el `<video>` carga, muestra la
  `<a-videosphere id="esfera-video">`; si el video falta o falla, **cae solo
  al skybox estático** (por eso se puede cablear un video antes de tenerlo).
- Componente `fondo-lobby` (en `portal.js`): arranca el video del lobby al
  cargar la página; reintento de `play()` al primer clic si el navegador
  bloquea el autoplay.
- Solo el video del lobby lleva `preload="auto"`; los de oficinas usan
  `preload="metadata"` para no descargar ~40 MB al abrir la página.
- Para regenerar un video: Kling image-to-video con el PNG de
  `assets/escenas/`, prompt con "Static camera, seamless 360 equirectangular…
  No camera movement", guardar como `assets/videos/escena NVR.mp4`.

## DATO, el robot guía (`js/guia.js`)

- Componente `robot-guia`, uno por zona. Habla cuando el visitante está a
  <16 m; se calla al salir de la zona.
- Voz: MP3 pregrabados en `assets/voz/` nombrados por hash djb2 del texto
  (voz neural edge-tts "Gonzalo es-CO"). Fallback: speechSynthesis del
  navegador. **Si cambias cualquier texto de `robot-guia` en `index.html`,
  regenera los audios**: `python tools/genera_voces.py`.
- Lobby con `unaVez: true`: introducción completa solo la primera vez; en
  regresos dice el mensaje corto `regreso`. Salir de la zona a mitad del
  discurso también cuenta como "ya la vio" (`haVisto = true` al salir).
  Botón REPETIR = discurso completo de nuevo.

## Otros archivos clave

- `js/paneles.js` + `js/datos.js` — dashboards ECharts en vivo (texturas a 10 fps).
- `js/terminal-codigo.js` — pantallas de "código escribiéndose solo" (guiones: desarrollo, agentes).
- `js/botones.js` — botones 3D que disparan eventos a paneles/consola.
- `js/ambiente.js` — partículas, pulsos de piso, holograma del logo.
- `js/interaccion.js` — hover de paneles, `montaje-panel` (bisel+poste de los
  dashboards BI), `tarjeta` (card del design system: borde, cabecera con título
  y punto de estado, poste opcional) y `fichas-agentes` (rejilla de agentes).
- `tools/genera_derivados.py` — regenera skyboxes JPG y previews desde `assets/escenas/`.
- `tools/genera_voces.py` — regenera los MP3 de DATO (requiere edge-tts).
- `INTEGRACION.md` — guía de integración/uso en el stand (para humanos, no técnica).
- `templates/oficina-ia.html` — página 2D de referencia: es la **fuente del
  design system** (tokens de color, cards, chips de estado) que el componente
  `tarjeta` traduce al VR. No está enlazada desde el recorrido.

## Convenciones

- Todo en español: código, comentarios, commits, textos.
- Interacción por mirada (cursor fuse 1.5 s), sin depender de controles.
- Los `<a-text>` usan la fuente MSDF empaquetada (`assets/fonts/Roboto-msdf.json`)
  y **sin tildes ni signos especiales** en los `value` (la fuente no los trae).
- Pensado para hardware del Quest: shaders flat, texturas optimizadas, ECharts a 10 fps.

## Estado actual (2026-07-08)

Hecho:
- 5 zonas completas con portales, DATO con voz, dashboards, terminales, ambiente.
- Fondos animados 360 (Kling) funcionando en **todas** las zonas, con fallback estático.
- Fix del bucle de DATO: ya no repite la introducción al volver al lobby.
- Menús de oficinas rediseñados con el componente `tarjeta` (design system del
  template): consola y botonera IA, fichas de agentes activos, tarjetas de
  servicio Web, CTA del Panorama — todo con cabecera, estado e instalación al piso.

Pendiente:
- Probar en el Quest físico (rendimiento con 5 videos, autoplay en Quest Browser).
- Plan B offline para la feria: servir desde laptop en red local requiere HTTPS
  local (WebXR no corre por HTTP salvo en localhost) — sin resolver.
- Valorar llevar `tarjeta` también al lobby (letrero de bienvenida) y a las
  placas descriptivas de BI si se quiere unificar al 100 %.
