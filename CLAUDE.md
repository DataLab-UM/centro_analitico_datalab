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
- `unaVez` es el **default**: cada robot dice su discurso completo solo la
  primera visita; al salir de la zona el guion queda visto y congelado; en
  regresos, silencio (el lobby dice su `regreso` corto). Botón REPETIR =
  discurso completo de nuevo.

## Otros archivos clave

- `js/paneles.js` + `js/datos.js` — dashboards ECharts en vivo (texturas a 10 fps).
  Tipos por oficina: BI (ventas, calor, kpi, prediccion, embudo, canales),
  agentes (acciones, horas, estado-agentes, calidad) y panorama (impacto-ia,
  adopcion, retorno). Varios aceptan evento `filtro` desde botones 3D.
- **Pantallas gigantes canvas** (todas: 1024x640, 10 fps, textura race-safe,
  botones 3D les emiten eventos, regreso automático con reloj real, y
  **guardián de rendimiento**: si el rig está a >30 m — otra zona — no se
  redibuja ni se sube textura; los paneles ECharts tampoco actualizan datos):
  - `js/pipeline.js` — BI: el viaje del dato, 4 vistas (`enfocar`).
  - `js/agentes.js` — IA: escenas por agente: chat, correos, señas con mano
    realista, RAG (`enfocar` desde las fichas clickeables).
  - `js/dev-vivo.js` — Web: split código→producto, 3 proyectos (`proyecto`).
  - `js/escenas-web.js` — Web: 3 pantallas de servicio (app viva, tienda,
    recorrido VR en primera persona).
  - `js/panorama.js` — Panorama: carrera de dos empresas por métrica
    (`metrica`) + vistas de fase; `fase: N` la fija para la galería del fondo.
- `js/terminal-codigo.js` — terminal de código antigua (ya sin uso en escena).
- `js/botones.js` — botones 3D que disparan eventos a paneles/pantallas.
- `js/ambiente.js` — partículas, pulsos de piso, holograma del logo.
- `js/interaccion.js` — hover de paneles, `montaje-panel` (bisel+poste),
  `tarjeta` (card del design system) y `fichas-agentes` (fichas clickeables).
- En canvas la ñ y tildes SÍ funcionan (fuente del sistema); en `a-text` no.
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

## Estado actual (2026-07-09)

Hecho — las 5 zonas renovadas por completo:
- Fondos animados 360 (Kling) en todas las zonas, con fallback estático y
  fundido a negro en cada teletransporte.
- Lobby: portales amplios animados (mecerse + halo + hover suave), letrero
  elevado, DATO al costado.
- Patrón común de oficina: título a 4.7 m, pantalla gigante canvas al fondo
  (~14 m, elevada) con consola de botones a su pie, arco de tableros ECharts
  con filtros, DATO al costado, corredor central libre.
- BI: 6 tableros + pantalla "el viaje de tus datos" (4 vistas).
- IA: fichas de agentes como selector; escenas por agente (chat con consulta,
  correos clasificándose, señas con mano realista y landmarks, RAG); 4
  tableros de estadísticas de agentes.
- Web: 3 pantallas de servicio en vivo + pantalla gigante "desarrollo en
  vivo" (código → producto, 3 proyectos).
- Panorama: carrera de dos empresas comparable por métrica (ventas, costos,
  clientes, trabajo manual), galería de 4 pantallas de fase en la pared del
  fondo, 3 tableros del caso de negocio (salto con IA, adopción, retorno).
- Voces: discurso una sola vez por zona (congelado al salir), REPETIR lo
  revive; MP3 regenerados para todos los guiones actuales.

Pendiente:
- Probar en el Quest físico: rendimiento con los 5 videos (los ~20 canvases
  ya solo redibujan en la zona activa gracias al guardián de distancia,
  aplicado el 2026-07-09 a todas las pantallas y paneles).
- Plan B offline para la feria: servir desde laptop en red local requiere
  HTTPS local (WebXR no corre por HTTP salvo en localhost) — sin resolver.
- `js/terminal-codigo.js` quedó sin uso en escena: decidir si se elimina.
