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
    rotacionCielo: { default: '0 0 0' },
    titulo: { default: '' },
    preview: { default: '' }         // selector del <img> de la miniatura
  },

  init: function () {
    const el = this.el;
    const FUENTE = 'assets/fonts/Roboto-msdf.json';

    // marco (es el objeto clickable: tiene geometría para el raycaster)
    const marco = document.createElement('a-plane');
    marco.setAttribute('width', 1.9);
    marco.setAttribute('height', 2.5);
    marco.setAttribute('position', '0 1.35 0');
    marco.setAttribute('color', '#133445');
    marco.setAttribute('material', 'shader: flat');
    marco.classList.add('clickable');
    el.appendChild(marco);

    // vista previa de la oficina destino
    const prev = document.createElement('a-image');
    prev.setAttribute('src', this.data.preview);
    prev.setAttribute('width', 1.66);
    prev.setAttribute('height', 1.04);
    prev.setAttribute('position', '0 1.8 0.01');
    el.appendChild(prev);

    // título
    const titulo = document.createElement('a-text');
    titulo.setAttribute('font', FUENTE);
    titulo.setAttribute('value', this.data.titulo);
    titulo.setAttribute('align', 'center');
    titulo.setAttribute('color', '#5fd87a');
    titulo.setAttribute('width', 1.8);
    titulo.setAttribute('position', '0 0.85 0.01');
    el.appendChild(titulo);

    const entrar = document.createElement('a-text');
    entrar.setAttribute('font', FUENTE);
    entrar.setAttribute('value', 'mira aqui para entrar');
    entrar.setAttribute('align', 'center');
    entrar.setAttribute('color', '#8aa4b8');
    entrar.setAttribute('width', 1.2);
    entrar.setAttribute('position', '0 0.35 0.01');
    el.appendChild(entrar);

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
    el.addEventListener('mouseenter', () => el.object3D.scale.set(1.06, 1.06, 1.06));
    el.addEventListener('mouseleave', () => el.object3D.scale.set(1, 1, 1));
    el.addEventListener('click', () => {
      const d = this.data.destino;
      document.querySelector('#rig').setAttribute('position', d.x + ' ' + d.y + ' ' + d.z);
      const cielo = document.querySelector('a-sky');
      if (this.data.cielo) cielo.setAttribute('src', this.data.cielo);
      cielo.setAttribute('rotation', this.data.rotacionCielo);
    });
  }
});
