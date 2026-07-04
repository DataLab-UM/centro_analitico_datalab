/*
 * interaccion.js — panel-interactivo: el tablero reacciona al apuntarlo
 * (crece suave y resalta su placa). Solo hover, sin click:
 * ponytail: el fuse del cursor dispararía "clics" al leer el gráfico >1.5s;
 * zoom con gatillo llegará cuando montemos laser-controls con el Quest real.
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
