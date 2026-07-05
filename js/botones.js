/*
 * botones.js — boton-3d: botón físico que dispara una acción en otro elemento.
 * Mirarlo 1.5s (fuse) o clic = destella verde y emite el evento al objetivo.
 * Uso:
 *   <a-entity boton-3d="etiqueta: 12 MESES; objetivo: #panel-x; evento: filtro; dato: meses"
 *             position="..."></a-entity>
 */
AFRAME.registerComponent('boton-3d', {
  schema: {
    etiqueta: { default: '' },
    objetivo: { default: '' },   // selector del elemento que recibe el evento
    evento: { default: '' },
    dato: { default: '' }
  },

  init: function () {
    const el = this.el;

    this.placa = document.createElement('a-plane');
    this.placa.setAttribute('width', 1.05);
    this.placa.setAttribute('height', 0.3);
    this.placa.setAttribute('color', '#133445');
    this.placa.setAttribute('material', 'shader: flat');
    this.placa.classList.add('clickable');
    el.appendChild(this.placa);

    const borde = document.createElement('a-plane');
    borde.setAttribute('width', 1.11);
    borde.setAttribute('height', 0.36);
    borde.setAttribute('position', '0 0 -0.005');
    borde.setAttribute('color', '#5fd87a');
    borde.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.35');
    el.appendChild(borde);

    const texto = document.createElement('a-text');
    texto.setAttribute('font', 'assets/fonts/Roboto-msdf.json');
    texto.setAttribute('value', this.data.etiqueta);
    texto.setAttribute('align', 'center');
    texto.setAttribute('color', '#e8f0f6');
    texto.setAttribute('width', 1.5);
    texto.setAttribute('position', '0 0 0.01');
    el.appendChild(texto);

    el.addEventListener('mouseenter', () => el.object3D.scale.set(1.12, 1.12, 1.12));
    el.addEventListener('mouseleave', () => el.object3D.scale.set(1, 1, 1));
    el.addEventListener('click', () => {
      const objetivo = document.querySelector(this.data.objetivo);
      if (objetivo) objetivo.emit(this.data.evento, { dato: this.data.dato });
      // destello de confirmación
      this.placa.setAttribute('color', '#2ec98a');
      setTimeout(() => this.placa.setAttribute('color', '#133445'), 300);
    });
  }
});
