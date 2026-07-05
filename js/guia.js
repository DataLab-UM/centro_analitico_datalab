/*
 * guia.js — robot-guia "DATO": asistente que presenta cada zona.
 *
 * Voz: prefiere audios pregrabados con voz neural (assets/voz/<hash>.mp3,
 * generados con tools/genera_voces.py); si no existen, cae al sintetizador
 * del navegador. La burbuja escribe el texto tipo máquina de escribir.
 *
 * Comportamiento: el discurso se dice UNA vez por visita a la zona. Con
 * `unaVez: true` (lobby) la introducción completa suena solo la primera
 * vez; en visitas siguientes se dice el mensaje corto `regreso`. El botón
 * REPETIR siempre vuelve a dar el discurso completo.
 */
(function () {

  // hash djb2 (igual en tools/genera_voces.py) para nombrar los audios
  function djb2(txt) {
    let h = 5381;
    for (let i = 0; i < txt.length; i++) {
      h = ((h * 33) ^ txt.charCodeAt(i)) >>> 0;
    }
    return h.toString(16);
  }

  // ---- respaldo: voz del navegador (masculina, natural, latina si hay) ----
  let VOZ = null;
  const HOMBRE = /jorge|alvaro|álvaro|gonzalo|alonso|raul|raúl|pablo|diego|andres|andrés|carlos|emilio|enrique|juan|luis|miguel|tomas|tomás|dario|darío|\bmale\b/i;
  function elegirVoz() {
    if (!('speechSynthesis' in window)) return;
    const voces = window.speechSynthesis.getVoices();
    const latino = (v) => /es[-_](US|419|MX|CO|AR|CL)/i.test(v.lang);
    const natural = (v) => /natural|neural|google/i.test(v.name);
    const criterios = [
      (v) => latino(v) && HOMBRE.test(v.name) && natural(v),
      (v) => /^es/i.test(v.lang) && HOMBRE.test(v.name) && natural(v),
      (v) => /^es/i.test(v.lang) && HOMBRE.test(v.name),
      (v) => latino(v) && natural(v),
      (v) => latino(v),
      (v) => /^es/i.test(v.lang) && natural(v),
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

  // lo que se escribe no siempre es lo que se debe decir (solo respaldo;
  // los MP3 se generan ya con estas correcciones aplicadas)
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
      nombre: { default: 'DATO — guia virtual' },
      unaVez: { default: false },  // introduccion completa solo la primera vez
      regreso: { default: '' }     // mensaje corto para las visitas siguientes
    },

    init: function () {
      this.lista = this.data.mensajes.split('|').map(s => s.trim()).filter(Boolean);
      this.actual = this.lista;    // lo que se está narrando ahora
      this.idx = 0;
      this.col = 0;
      this.esperaHasta = 0;
      this.cerca = false;
      this.terminado = false;
      this.haVisto = false;        // ya escuchó la introducción completa
      this.audioSonando = false;
      this.audioActual = null;
      this.construir();
      this.intervalo = setInterval(() => this.paso(), 40);
    },

    remove: function () {
      clearInterval(this.intervalo);
      this.callar();
    },

    callar: function () {
      if (this.audioActual) { this.audioActual.pause(); this.audioActual = null; }
      this.audioSonando = false;
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },

    reiniciarCon: function (mensajes) {
      this.callar();
      this.actual = mensajes;
      this.idx = 0;
      this.col = 0;
      this.esperaHasta = 0;
      this.terminado = false;
    },

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
        ['a-sphere',   { radius: 0.19, position: '0 1.52 0', scale: '1 0.85 1', color: '#eef4f8' }],
        ['a-sphere',   { radius: 0.155, position: '0 1.52 0.055', scale: '1 0.68 0.8', color: '#0a1420' }],
        ['a-sphere',   { radius: 0.028, position: '-0.055 1.54 0.185', color: '#5fd87a', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.028, position: '0.055 1.54 0.185', color: '#5fd87a', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.009, position: '-0.048 1.548 0.208', color: '#ffffff', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.009, position: '0.062 1.548 0.208', color: '#ffffff', material: 'shader: flat' }],
        ['a-cylinder', { radius: 0.05, height: 0.08, position: '0 1.38 0', color: '#c8d6e2' }],
        ['a-sphere',   { radius: 0.24, position: '0 1.05 0', scale: '0.85 1.2 0.7', color: '#eef4f8' }],
        ['a-circle',   { radius: 0.1, position: '0 1.14 0.17', color: '#133445', material: 'shader: flat' }],
        ['a-sphere',   { radius: 0.055, position: '-0.225 1.22 0', color: '#c8d6e2' }],
        ['a-sphere',   { radius: 0.055, position: '0.225 1.22 0', color: '#c8d6e2' }],
        ['a-cylinder', { radius: 0.026, height: 0.28, position: '-0.26 1.05 0', rotation: '0 0 10', color: '#dfe9f0' }],
        ['a-cylinder', { radius: 0.026, height: 0.28, position: '0.26 1.05 0', rotation: '0 0 -10', color: '#dfe9f0' }],
        ['a-sphere',   { radius: 0.038, position: '-0.285 0.9 0', color: '#c8d6e2' }],
        ['a-sphere',   { radius: 0.038, position: '0.285 0.9 0', color: '#c8d6e2' }],
        ['a-torus',    { radius: 0.13, 'radius-tubular': 0.02, position: '0 0.68 0', rotation: '-90 0 0', color: '#133445' }],
      ];
      partes.forEach(([tag, attrs]) => {
        const p = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => p.setAttribute(k, v));
        cuerpo.appendChild(p);
      });

      const chorro = document.createElement('a-circle');
      chorro.setAttribute('radius', 0.1);
      chorro.setAttribute('position', '0 0.66 0');
      chorro.setAttribute('rotation', '-90 0 0');
      chorro.setAttribute('color', '#5fd87a');
      chorro.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.55; side: double');
      chorro.setAttribute('animation',
        'property: components.material.material.opacity; from: 0.25; to: 0.65; dir: alternate; loop: true; dur: 700');
      cuerpo.appendChild(chorro);

      const pecho = document.createElement('a-image');
      pecho.setAttribute('src', '#logo');
      pecho.setAttribute('width', 0.15);
      pecho.setAttribute('height', 0.15);
      pecho.setAttribute('position', '0 1.14 0.175');
      cuerpo.appendChild(pecho);

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

      // botón REPETIR sobre la burbuja: vuelve a dar la explicación completa
      const boton = document.createElement('a-plane');
      boton.setAttribute('width', 0.72);
      boton.setAttribute('height', 0.24);
      boton.setAttribute('position', '0 3.05 0');
      boton.setAttribute('color', '#133445');
      boton.setAttribute('material', 'shader: flat');
      boton.classList.add('clickable');
      el.appendChild(boton);

      const bordeBoton = document.createElement('a-plane');
      bordeBoton.setAttribute('width', 0.78);
      bordeBoton.setAttribute('height', 0.3);
      bordeBoton.setAttribute('position', '0 3.05 -0.005');
      bordeBoton.setAttribute('color', '#5fd87a');
      bordeBoton.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.35');
      el.appendChild(bordeBoton);

      const textoBoton = document.createElement('a-text');
      textoBoton.setAttribute('font', FUENTE);
      textoBoton.setAttribute('value', 'REPETIR');
      textoBoton.setAttribute('align', 'center');
      textoBoton.setAttribute('color', '#5fd87a');
      textoBoton.setAttribute('width', 1.3);
      textoBoton.setAttribute('position', '0 3.05 0.01');
      el.appendChild(textoBoton);

      boton.addEventListener('mouseenter', () => boton.setAttribute('color', '#1d4a63'));
      boton.addEventListener('mouseleave', () => boton.setAttribute('color', '#133445'));
      boton.addEventListener('click', () => this.reiniciarCon(this.lista));
    },

    paso: function () {
      if (!this.actual.length || this.terminado) return;
      const ahora = performance.now();
      const msg = this.actual[this.idx];

      if (this.col === 0 && ahora >= this.esperaHasta) this.hablar(msg);

      if (this.col < msg.length) {
        this.col += 2; // velocidad de escritura
        this.texto.setAttribute('value', msg.slice(0, this.col));
        if (this.col >= msg.length) this.esperaHasta = ahora + 4200; // respaldo si no hay audio
      } else if (ahora >= this.esperaHasta && !this.audioSonando) {
        if (this.idx + 1 >= this.actual.length) {
          this.terminado = true;   // fin: sin bucle
          this.haVisto = true;
        } else {
          this.idx++;
          this.col = 0;
        }
      }
    },

    hablar: function (msg) {
      if (!this.cerca) return;
      this.callar();

      // 1) audio pregrabado con voz neural (generado por tools/genera_voces.py)
      const audio = new Audio('assets/voz/' + djb2(msg) + '.mp3');
      this.audioActual = audio;
      this.audioSonando = true;
      audio.addEventListener('ended', () => {
        this.audioSonando = false;
        this.esperaHasta = performance.now() + 700;
      });
      audio.addEventListener('error', () => { this.audioSonando = false; });
      audio.play().then(() => {
        // sonando: el avance del discurso espera al final del audio
      }).catch(() => {
        // 2) respaldo: sintetizador del navegador
        this.audioSonando = false;
        if (!('speechSynthesis' in window)) return;
        try {
          const u = new SpeechSynthesisUtterance(pronunciable(msg));
          if (VOZ) u.voice = VOZ;
          u.lang = VOZ ? VOZ.lang : 'es-US';
          u.rate = 1.18;
          u.pitch = 1.0;
          this.audioSonando = true;
          u.onend = () => {
            this.audioSonando = false;
            this.esperaHasta = performance.now() + 700;
          };
          u.onerror = () => { this.audioSonando = false; };
          window.speechSynthesis.speak(u);
        } catch (e) { this.audioSonando = false; }
      });
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

      // llegadas y salidas de la zona
      const dist = Math.sqrt(dx * dx + dz * dz);
      const cercaAhora = dist < 16;
      if (cercaAhora && !this.cerca) {
        if (!this.haVisto || !this.data.unaVez) {
          this.reiniciarCon(this.lista);            // discurso completo
        } else if (this.data.regreso) {
          this.reiniciarCon([this.data.regreso]);   // solo el saludo corto
        }
      }
      if (!cercaAhora && this.cerca) this.callar();  // se fue: silencio
      this.cerca = cercaAhora;
    }
  });
})();
