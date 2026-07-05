/*
 * interaccion.js — comportamiento e instalación física de los tableros.
 *
 * panel-interactivo: el tablero reacciona al apuntarlo (crece suave).
 *   Solo hover, sin click: el fuse del cursor dispararía "clics" al leer
 *   el gráfico >1.5s; zoom con gatillo llegará con laser-controls en el Quest.
 *
 * montaje-panel: convierte el tablero flotante en una instalación:
 *   bisel oscuro + halo de luz + poste al piso + base. Se pone en el
 *   wrapper del panel; `alto` = altura del centro del tablero.
 */
AFRAME.registerComponent('panel-interactivo', {
  init: function () {
    const el = this.el;
    el.classList.add('apuntable');
    el.addEventListener('mouseenter', () => {
      el.setAttribute('animation__hover',
        'property: scale; to: 1.14 1.14 1.14; dur: 200; easing: easeOutQuad');
    });
    el.addEventListener('mouseleave', () => {
      el.setAttribute('animation__hover',
        'property: scale; to: 1 1 1; dur: 200; easing: easeOutQuad');
    });
  }
});

AFRAME.registerComponent('montaje-panel', {
  schema: {
    alto: { default: 1.95 },     // altura del centro del tablero
    ancho: { default: 2.6 },
    altura: { default: 1.46 }    // alto del tablero
  },

  init: function () {
    const el = this.el;
    const d = this.data;

    // bisel: caja oscura detrás del tablero
    const bisel = document.createElement('a-box');
    bisel.setAttribute('width', d.ancho + 0.14);
    bisel.setAttribute('height', d.altura + 0.14);
    bisel.setAttribute('depth', 0.06);
    bisel.setAttribute('position', '0 ' + d.alto + ' -0.045');
    bisel.setAttribute('color', '#0a1420');
    el.appendChild(bisel);

    // halo de luz de marca alrededor
    const halo = document.createElement('a-plane');
    halo.setAttribute('width', d.ancho + 0.26);
    halo.setAttribute('height', d.altura + 0.26);
    halo.setAttribute('position', '0 ' + d.alto + ' -0.09');
    halo.setAttribute('color', '#5fd87a');
    halo.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.16');
    el.appendChild(halo);

    // poste al piso + base
    const altoPoste = d.alto - d.altura / 2;
    const poste = document.createElement('a-cylinder');
    poste.setAttribute('radius', 0.035);
    poste.setAttribute('height', altoPoste);
    poste.setAttribute('position', '0 ' + (altoPoste / 2) + ' -0.06');
    poste.setAttribute('color', '#133445');
    el.appendChild(poste);

    const base = document.createElement('a-cylinder');
    base.setAttribute('radius', 0.3);
    base.setAttribute('height', 0.05);
    base.setAttribute('position', '0 0.025 -0.06');
    base.setAttribute('color', '#133445');
    el.appendChild(base);
  }
});
