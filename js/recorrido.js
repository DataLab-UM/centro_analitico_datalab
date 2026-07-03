/*
 * recorrido.js — navegación entre zonas por teletransporte.
 * El visitante mira un punto en el piso 1.5s (fuse) o hace clic/gatillo: salto
 * instantáneo del rig. Instantáneo a propósito: el desplazamiento suave marea
 * a los novatos en VR; el salto seco es la práctica estándar de confort.
 */
AFRAME.registerComponent('teletransporte', {
  schema: { destino: { type: 'vec3' } },

  init: function () {
    const el = this.el;
    el.addEventListener('click', () => {
      const d = this.data.destino;
      document.querySelector('#rig').setAttribute('position', d.x + ' ' + d.y + ' ' + d.z);
    });
    // feedback al apuntar: el punto crece
    el.addEventListener('mouseenter', () => el.setAttribute('scale', '1.3 1.3 1.3'));
    el.addEventListener('mouseleave', () => el.setAttribute('scale', '1 1 1'));
  }
});
