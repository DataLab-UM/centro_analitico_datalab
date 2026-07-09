/*
 * portal.js — puerta entre oficinas: marco + vista previa + título.
 * Mirarla 1.5s (fuse) o clic = teletransporte del rig + cambio de skybox.
 * Uso:
 *   <a-entity portal="destino: -60 0 0; cielo: #cielo-bi;
 *                     titulo: BUSINESS INTELLIGENCE; preview: #prev-bi"
 *             position="..." rotation="..."></a-entity>
 */
AFRAME.registerComponent('portal', {
  schema: {
    destino: { type: 'vec3' },
    cielo: { default: '' },          // selector del <img> del skybox destino
    video: { default: '' },          // selector del <video> 360 (fondo animado)
    rotacionCielo: { default: '0 0 0' },
    titulo: { default: '' },
    preview: { default: '' }         // selector del <img> de la miniatura
  },

  init: function () {
    const el = this.el;
    const FUENTE = 'assets/fonts/Roboto-msdf.json';

    // grupo flotante: toda la carta se mece suave (cada portal a su ritmo)
    const flotante = document.createElement('a-entity');
    flotante.setAttribute('animation',
      'property: position; from: 0 0 0; to: 0 0.06 0; dir: alternate; loop: true; ' +
      'dur: ' + Math.round(2600 + Math.random() * 900) + '; easing: easeInOutSine');
    el.appendChild(flotante);

    // halo de acento respirando detrás del marco
    const halo = document.createElement('a-plane');
    halo.setAttribute('width', 2.46);
    halo.setAttribute('height', 2.76);
    halo.setAttribute('position', '0 1.5 -0.02');
    halo.setAttribute('color', '#5fd87a');
    halo.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.2');
    halo.setAttribute('animation',
      'property: components.material.material.opacity; from: 0.12; to: 0.3; dir: alternate; loop: true; dur: 1800; easing: easeInOutSine');
    flotante.appendChild(halo);

    // marco (es el objeto clickable: tiene geometría para el raycaster)
    const marco = document.createElement('a-plane');
    marco.setAttribute('width', 2.3);
    marco.setAttribute('height', 2.6);
    marco.setAttribute('position', '0 1.5 0');
    marco.setAttribute('color', '#133445');
    marco.setAttribute('material', 'shader: flat');
    marco.classList.add('clickable');
    flotante.appendChild(marco);

    // vista previa de la oficina destino
    const prev = document.createElement('a-image');
    prev.setAttribute('src', this.data.preview);
    prev.setAttribute('width', 2.06);
    prev.setAttribute('height', 1.29);
    prev.setAttribute('position', '0 1.98 0.01');
    flotante.appendChild(prev);

    // título
    const titulo = document.createElement('a-text');
    titulo.setAttribute('font', FUENTE);
    titulo.setAttribute('value', this.data.titulo);
    titulo.setAttribute('align', 'center');
    titulo.setAttribute('color', '#5fd87a');
    titulo.setAttribute('width', 2.15);
    titulo.setAttribute('position', '0 0.92 0.01');
    flotante.appendChild(titulo);

    const entrar = document.createElement('a-text');
    entrar.setAttribute('font', FUENTE);
    entrar.setAttribute('value', 'mira aqui para entrar');
    entrar.setAttribute('align', 'center');
    entrar.setAttribute('color', '#8aa4b8');
    entrar.setAttribute('width', 1.3);
    entrar.setAttribute('position', '0 0.42 0.01');
    flotante.appendChild(entrar);

    // anillo pulsante en el piso (afordancia heredada de los hotspots)
    const aro = document.createElement('a-ring');
    aro.setAttribute('rotation', '-90 0 0');
    aro.setAttribute('position', '0 0.02 0.6');
    aro.setAttribute('radius-inner', 0.4);
    aro.setAttribute('radius-outer', 0.48);
    aro.setAttribute('color', '#5fd87a');
    aro.setAttribute('material', 'shader: flat');
    aro.setAttribute('animation',
      'property: scale; from: 1 1 1; to: 1.18 1.18 1.18; dir: alternate; loop: true; dur: 1200');
    el.appendChild(aro);

    // interacción (el click del marco burbujea hasta aquí)
    el.addEventListener('mouseenter', () => {
      el.setAttribute('animation__hover',
        'property: scale; to: 1.08 1.08 1.08; dur: 180; easing: easeOutQuad');
    });
    el.addEventListener('mouseleave', () => {
      el.setAttribute('animation__hover',
        'property: scale; to: 1 1 1; dur: 180; easing: easeOutQuad');
    });

    const viajar = () => {
      const d = this.data.destino;
      document.querySelector('#rig').setAttribute('position', d.x + ' ' + d.y + ' ' + d.z);

      const cielo = document.querySelector('a-sky');
      const esfera = document.querySelector('#esfera-video');
      // pausar cualquier fondo animado previo
      document.querySelectorAll('a-assets video').forEach((v) => v.pause());

      const vid = this.data.video ? document.querySelector(this.data.video) : null;
      if (vid && !vid.error && esfera) {
        // zona con fondo animado (video 360)
        esfera.setAttribute('src', this.data.video);
        esfera.setAttribute('rotation', this.data.rotacionCielo);
        esfera.setAttribute('visible', 'true');
        cielo.setAttribute('visible', 'false');
        vid.currentTime = 0; vid.play().catch(() => {});
      } else {
        // zona con fondo estatico
        if (esfera) esfera.setAttribute('visible', 'false');
        cielo.setAttribute('visible', 'true');
        if (this.data.cielo) cielo.setAttribute('src', this.data.cielo);
        cielo.setAttribute('rotation', this.data.rotacionCielo);
      }
    };

    el.addEventListener('click', () => {
      // transición inmersiva: fundido a negro, viaje y reaparición
      const fundido = document.querySelector('#fundido');
      if (!fundido) { viajar(); return; }
      fundido.setAttribute('animation__in',
        'property: components.material.material.opacity; to: 1; dur: 280; easing: easeInQuad');
      setTimeout(() => {
        viajar();
        fundido.setAttribute('animation__out',
          'property: components.material.material.opacity; to: 0; dur: 500; delay: 150; easing: easeOutQuad');
      }, 320);
    });
  }
});

/*
 * fondo-lobby — arranca la experiencia con el video 360 del lobby.
 * Va en la videosphere. Si el video no existe o falla, el <a-sky>
 * estático queda como fondo (no hace nada).
 */
AFRAME.registerComponent('fondo-lobby', {
  schema: {
    video: { default: '#video-lobby' },
    rotacion: { default: '0 180 0' }
  },

  init: function () {
    const esfera = this.el;
    const vid = document.querySelector(this.data.video);
    if (!vid) return;

    const activar = () => {
      // solo si seguimos en el lobby (el rig no se ha teletransportado)
      const rig = document.querySelector('#rig').object3D.position;
      if (rig.length() > 1) return;
      esfera.setAttribute('src', this.data.video);
      esfera.setAttribute('rotation', this.data.rotacion);
      esfera.setAttribute('visible', 'true');
      document.querySelector('a-sky').setAttribute('visible', 'false');
      vid.play().catch(() => {});
    };

    if (vid.readyState >= 2) activar();
    else vid.addEventListener('canplay', activar, { once: true });
    // autoplay bloqueado por el navegador: reintenta al primer gesto
    window.addEventListener('click', () => {
      if (esfera.getAttribute('visible') && vid.paused && !vid.error) vid.play().catch(() => {});
    }, { once: true });
  }
});
