# Centro Analítico Inmersivo — Paquete de integración

**Experiencia en vivo:** https://datalab-um.github.io/centro_analitico_datalab/

Experiencia WebXR autocontenida para Meta Quest. No requiere instalación,
build, ni tienda de aplicaciones: **el punto de integración es la URL**.

---

## 1. Cómo abrirla en las gafas Meta Quest

1. Ponerse el visor → abrir **Quest Browser** (el navegador nativo).
2. Escribir la URL (o guardarla como favorito la primera vez).
3. Tocar el botón **"VR"** / ícono de gafas en la esquina de la página.
4. Listo: el visitante está dentro. Sin controles también funciona
   (navegación por mirada: fijar la vista 1.5 s en los anillos del piso).

## 2. Integración con tu entorno (cualquier herramienta)

| Tu entorno | Cómo conectar |
|---|---|
| **Unity / Unreal** | Al terminar tu flujo, abre la URL en el navegador del Quest (`Application.OpenURL(...)` en Unity) o embébela con un plugin WebView (ej. Vuplex). |
| **WebXR / A-Frame / Three.js** | Enlaza la URL como una escena más (`window.location`), o fusionamos repos si prefieres una sola app. |
| **Horizon Worlds u otro** | Cambio de app a Quest Browser con la URL en favoritos (~5 segundos en el stand). |
| **Nada aún** | La experiencia funciona sola como recorrido completo del stand. |

## 3. Qué ve el visitante (el guion)

1. **Sala de control DataLab** — aparece rodeado por 4 dashboards en vivo
   (ventas en tiempo real, actividad de clientes, salud operativa, predicción
   de crecimiento) dentro del centro de comando 360 brandeado.
2. **Desarrollo en vivo** — al girarse: monitor con código escribiéndose solo
   (pipeline de ML y API de dashboard).
3. **Panorama de crecimiento** — teletransporte a la ciudad inteligente:
   línea de tiempo *Hoy → Con datos → Evolucionada*.
4. **Cierre** — "DATALAB UM CONSTRUYE ESTO · Tecnología que inspira confianza ·
   Pregunta por tus 30 minutos de asesoría gratuita".

## 4. Mostrarlo en el TV del stand

Casting nativo de Quest (nada que desarrollar): en el visor, botón
**Compartir → Transmitir**, y en un PC/laptop conectado al TV abrir
**oculus.com/casting** con la cuenta Meta del visor. Pantalla completa y listo.

## 5. Assets exportables (plan B para importar a tu motor)

Si prefieres integrar el contenido dentro de tu propia escena en lugar de
abrir la URL, en este repo están los insumos:

| Asset | Ruta | Formato |
|---|---|---|
| Panorámicas 360 originales (6 escenas) | `assets/escenas/` | PNG equirectangular 2912×1440 |
| Panorámicas optimizadas | `assets/skybox-sala.jpg`, `assets/skybox-panorama.jpg` | JPG equirectangular |
| Logos DataLab | `assets/logos/` | PNG |
| Video de la terminal de código | *bajo pedido* — se exporta a MP4 desde el componente si tu motor lo necesita |

## 6. Editar contenidos (sin saber 3D)

| Quiero cambiar... | Archivo | Qué tocar |
|---|---|---|
| Textos del título / CTA | `index.html` | Atributos `value` de los `<a-text>` |
| El código que "programan" | `js/terminal-codigo.js` | El array `GUIONES` al inicio |
| Los datos/gráficos de los paneles | `js/paneles.js` y `js/datos.js` | Config de cada tipo |
| Las panorámicas 360 | `assets/*.jpg` | Reemplazar archivo (mismo nombre) |

Cada `git push` a `main` publica automáticamente en la URL (~1 minuto).

## 7. Requisitos y plan B

- **Requisito único:** internet en el Quest para cargar la página la primera vez.
- **Plan B sin internet en la feria:** el repo es 100 % offline (librerías y
  fuentes empaquetadas) — se sirve desde un laptop en la red local del stand.
  Requiere HTTPS local (detalle a resolver en el ensayo con el Quest físico).
- Rendimiento: texturas optimizadas y refresco de gráficos limitado a 10 fps,
  pensado para el hardware del Quest.

---
*Repo: https://github.com/DataLab-UM/centro_analitico_datalab · DataLab UM*
