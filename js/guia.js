/*
 * guia.js — robot-guia "DATO": asistente que presenta cada zona.
 * Burbuja con texto máquina-de-escribir + voz sintetizada (si el navegador
 * la soporta, offline). Siempre mira al visitante; reinicia su discurso
 * cuando el visitante llega a su zona.
 * Uso: <a-entity robot-guia="mensajes: Hola!|Segundo mensaje|..." position="..."></a-entity>
 */
AFRAME.registerComponent('robot-guia', {
  schema: {
    mensajes: { default: '' },   // mensajes separados por |
    nombre: { default: 'DATO — guia virtual' }
  },

  init: function () {
    this.lista = this.data.mensajes.split('|').map(s => s.trim()).filter(Boolean);
    this.idx = 0;
    this.col = 0;
    this.esperaHasta = 0;
    this.cerca = false;
    this.construir();
    this.intervalo = setInterval(() => this.paso(), 40);
  },

  remove: function () { clearInterval(this.intervalo); },

  construir: function () {
    const el = this.el;
    const FUENTE = 'assets/fonts/Roboto-msdf.json';

    // cuerpo flotante (bob suave)
    const cuerpo = document.createElement('a-entity');
    cuerpo.setAttribute('animation',
      'property: position; from: 0 0 0; to: 0 0.09 0; dir: alternate; loop: true; dur: 2200; easing: easeInOutSine');
    el.appendChild(cuerpo);

    const partes = [
      ['a-sphere',   { radius: 0.2, position: '0 1.5 0', color: '#e8f0f6' }],
      ['a-box',      { width: 0.27, height: 0.09, depth: 0.06, position: '0 1.52 0.16', color: '#0a1420' }],
      ['a-circle',   { radius: 0.026, position: '-0.06 1.52 0.196', color: '#5fd87a', material: 'shader: flat' }],
      ['a-circle',   { radius: 0.026, position: '0.06 1.52 0.196', color: '#5fd87a', material: 'shader: flat' }],
      ['a-cylinder', { radius: 0.01, height: 0.12, position: '0 1.72 0', color: '#8aa4b8' }],
      ['a-cylinder', { radius: 0.14, height: 0.42, position: '0 1.1 0', color: '#c8d6e2' }],
    ];
    partes.forEach(([tag, attrs]) => {
      const p = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
      cuerpo.appendChild(p);
    });

    const tip = document.createElement('a-sphere');
    tip.setAttribute('radius', 0.032);
    tip.setAttribute('position', '0 1.8 0');
    tip.setAttribute('color', '#5fd87a');
    tip.setAttribute('animation',
      'property: scale; from: 1 1 1; to: 1.5 1.5 1.5; dir: alternate; loop: true; dur: 900');
    cuerpo.appendChild(tip);

    const pecho = document.createElement('a-image');
    pecho.setAttribute('src', '#logo');
    pecho.setAttribute('width', 0.17);
    pecho.setAttribute('height', 0.17);
    pecho.setAttribute('position', '0 1.13 0.145');
    cuerpo.appendChild(pecho);

    // burbuja de diálogo
    const burbuja = document.createElement('a-plane');
    burbuja.setAttribute('width', 2.05);
    burbuja.setAttribute('height', 0.95);
    burbuja.setAttribute('position', '0 2.42 0');
    burbuja.setAttribute('color', '#133445');
    burbuja.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.92');
    el.appendChild(burbuja);

    const nombre = document.createElement('a-text');
    nombre.setAttribute('font', FUENTE);
    nombre.setAttribute('value', this.data.nombre);
    nombre.setAttribute('align', 'center');
    nombre.setAttribute('color', '#5fd87a');
    nombre.setAttribute('width', 1.7);
    nombre.setAttribute('position', '0 2.75 0.01');
    el.appendChild(nombre);

    this.texto = document.createElement('a-text');
    this.texto.setAttribute('font', FUENTE);
    this.texto.setAttribute('value', '');
    this.texto.setAttribute('align', 'center');
    this.texto.setAttribute('color', '#e8f0f6');
    this.texto.setAttribute('width', 1.85);
    this.texto.setAttribute('wrap-count', 34);
    this.texto.setAttribute('position', '0 2.34 0.01');
    el.appendChild(this.texto);
  },

  paso: function () {
    if (!this.lista.length) return;
    const ahora = performance.now();
    const msg = this.lista[this.idx];

    if (this.col === 0 && ahora >= this.esperaHasta) this.hablar(msg);

    if (this.col < msg.length) {
      this.col += 2; // velocidad de escritura
      this.texto.setAttribute('value', msg.slice(0, this.col));
      if (this.col >= msg.length) this.esperaHasta = ahora + 4200; // pausa de lectura
    } else if (ahora >= this.esperaHasta) {
      this.idx = (this.idx + 1) % this.lista.length;
      this.col = 0;
    }
  },

  hablar: function (msg) {
    // habla solo si el visitante está en esta zona (evita 5 robots a coro)
    if (!this.cerca || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = 'es-ES';
      u.rate = 1.05;
      u.pitch = 1.15;
      window.speechSynthesis.speak(u);
    } catch (e) { /* sin voz: la burbuja basta */ }
  },

  tick: function (t) {
    if (t - (this.ultimoTick || 0) < 150) return;
    this.ultimoTick = t;
    const cam = this.el.sceneEl.camera;
    if (!cam) return;

    // billboard: mirar siempre al visitante (solo eje Y)
    const posCam = new THREE.Vector3();
    cam.getWorldPosition(posCam);
    const pos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(pos);
    const dx = posCam.x - pos.x, dz = posCam.z - pos.z;
    this.el.object3D.rotation.y = Math.atan2(dx, dz);

    // al llegar el visitante a la zona, reinicia el discurso desde el saludo
    const dist = Math.sqrt(dx * dx + dz * dz);
    const cercaAhora = dist < 16;
    if (cercaAhora && !this.cerca) {
      this.idx = 0;
      this.col = 0;
      this.esperaHasta = 0;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    this.cerca = cercaAhora;
  }
});
