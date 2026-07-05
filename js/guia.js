/*
 * guia.js — robot-guia "DATO": asistente que presenta cada zona.
 * Burbuja con texto máquina-de-escribir + voz sintetizada natural (si el
 * navegador la soporta, offline). Siempre mira al visitante; reinicia su
 * discurso cuando el visitante llega a su zona.
 * Uso: <a-entity robot-guia="mensajes: Hola!|Segundo mensaje|..." position="..."></a-entity>
 */
(function () {

  // ---- voz: elegir la más natural disponible, preferencia latino/neutro ----
  let VOZ = null;
  function elegirVoz() {
    if (!('speechSynthesis' in window)) return;
    const voces = window.speechSynthesis.getVoices();
    const criterios = [
      (v) => /es[-_](US|419|MX|CO)/i.test(v.lang) && /natural|neural|google/i.test(v.name),
      (v) => /es[-_](US|419|MX|CO)/i.test(v.lang),
      (v) => /^es/i.test(v.lang) && /natural|neural|google/i.test(v.name),
      (v) => /^es/i.test(v.lang)
    ];
    for (const ok of criterios) {
      const v = voces.find(ok);
      if (v) { VOZ = v; return; }
    }
  }
  if ('speechSynthesis' in window) {
    elegirVoz();
    window.speechSynthesis.addEventListener('voiceschanged', elegirVoz);
  }

  // lo que se escribe no siempre es lo que se debe decir
  const PRONUNCIA = [
    [/24\/7/g, 'veinticuatro siete'],
    [/\bIA\b/g, 'i a'],
    [/\bVR\b/g, 'realidad virtual'],
    [/\bUM\b/g, 'u eme'],
    [/e-commerce/gi, 'comercio electrónico'],
    [/\bapps\b/gi, 'aplicaciones']
  ];
  function pronunciable(msg) {
    return PRONUNCIA.reduce((t, [re, con]) => t.replace(re, con), msg);
  }

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
        'property: position; from: 0 0 0; to: 0 0.09 0; dir: alternate; loop: true; dur: 2400; easing: easeInOutSine');
      el.appendChild(cuerpo);

      // dron estilo cápsula: cabeza redondeada + visor oscuro + cuerpo huevo
      const partes = [
        // cabeza
        ['a-sphere',   { radius: 0.19, position: '0 1.52 0', scale: '1 0.85 1', color: '#eef4f8' }],
        // visor oscuro embebido en la cara
        ['a-sphere',   { radius: 0.155, position: '0 1.52 0.055', scale: '1 0.68 0.8', color: '#0a1420' }],
        // ojos verdes con brillo
        ['a-sphere',   { radius: 0.028, position: '-0.055 1.54 0.185', color: '#5fd87a', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.028, position: '0.055 1.54 0.185', color: '#5fd87a', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.009, position: '-0.048 1.548 0.208', color: '#ffffff', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.009, position: '0.062 1.548 0.208', color: '#ffffff', material: 'shader: flat' }],
        // cuello
        ['a-cylinder', { radius: 0.05, height: 0.08, position: '0 1.38 0', color: '#c8d6e2' }],
        // torso tipo cápsula
        ['a-sphere',   { radius: 0.24, position: '0 1.05 0', scale: '0.85 1.2 0.7', color: '#eef4f8' }],
        // placa de pecho
        ['a-circle',   { radius: 0.1, position: '0 1.14 0.17', color: '#133445', material: 'shader: flat' }],
        // hombros y brazos colgantes
        ['a-sphere',   { radius: 0.055, position: '-0.225 1.22 0', color: '#c8d6e2' }],
        ['a-sphere',   { radius: 0.055, position: '0.225 1.22 0', color: '#c8d6e2' }],
        ['a-cylinder', { radius: 0.026, height: 0.28, position: '-0.26 1.05 0', rotation: '0 0 10', color: '#dfe9f0' }],
        ['a-cylinder', { radius: 0.026, height: 0.28, position: '0.26 1.05 0', rotation: '0 0 -10', color: '#dfe9f0' }],
        ['a-sphere',   { radius: 0.038, position: '-0.285 0.9 0', color: '#c8d6e2' }],
        ['a-sphere',   { radius: 0.038, position: '0.285 0.9 0', color: '#c8d6e2' }],
        // anillo propulsor bajo el torso
        ['a-torus',    { radius: 0.13, 'radius-tubular': 0.02, position: '0 0.68 0', rotation: '-90 0 0', color: '#133445' }],
      ];
      partes.forEach(([tag, attrs]) => {
        const p = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
        cuerpo.appendChild(p);
      });

      // resplandor del propulsor (pulsa)
      const chorro = document.createElement('a-circle');
      chorro.setAttribute('radius', 0.1);
      chorro.setAttribute('position', '0 0.66 0');
      chorro.setAttribute('rotation', '-90 0 0');
      chorro.setAttribute('color', '#5fd87a');
      chorro.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.55; side: double');
      chorro.setAttribute('animation',
        'property: components.material.material.opacity; from: 0.25; to: 0.65; dir: alternate; loop: true; dur: 700');
      cuerpo.appendChild(chorro);

      // logo DataLab en el pecho
      const pecho = document.createElement('a-image');
      pecho.setAttribute('src', '#logo');
      pecho.setAttribute('width', 0.15);
      pecho.setAttribute('height', 0.15);
      pecho.setAttribute('position', '0 1.14 0.175');
      cuerpo.appendChild(pecho);

      // sombra suave en el piso (ancla visual del vuelo)
      const sombra = document.createElement('a-circle');
      sombra.setAttribute('radius', 0.26);
      sombra.setAttribute('rotation', '-90 0 0');
      sombra.setAttribute('position', '0 0.01 0');
      sombra.setAttribute('color', '#000000');
      sombra.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.28');
      el.appendChild(sombra);

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
        const u = new SpeechSynthesisUtterance(pronunciable(msg));
        if (VOZ) u.voice = VOZ;
        u.lang = VOZ ? VOZ.lang : 'es-US';
        u.rate = 1.0;   // ritmo natural
        u.pitch = 1.0;  // tono neutro, sin agudo robótico
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
})();
