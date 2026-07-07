/*
 * ambiente.js — capa de vida sobre los fondos 360 estáticos.
 *
 * particulas: motas de luz flotando (THREE.Points, un solo draw call).
 *   <a-entity particulas="cantidad: 150; color: #5fd87a; radio: 12; alto: 7"></a-entity>
 *
 * pulso-piso: anillos de luz que se expanden y desvanecen desde un punto.
 *   <a-entity pulso-piso="color: #5fd87a" position="0 0.03 -6"></a-entity>
 *
 * holo-logo: logo DataLab como holograma giratorio con satelites en orbita.
 *   <a-entity holo-logo position="0 4.6 -7"></a-entity>
 */
(function () {

  AFRAME.registerComponent('particulas', {
    schema: {
      cantidad: { default: 120 },
      color: { default: '#5fd87a' },
      radio: { default: 12 },     // radio del cilindro donde viven
      alto: { default: 7 },
      velocidad: { default: 0.25 } // m/s de ascenso
    },

    init: function () {
      const n = this.data.cantidad;
      this.pos = new Float32Array(n * 3);
      this.fase = new Float32Array(n);      // para el vaivén lateral
      this.vel = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * this.data.radio;
        this.pos[i * 3] = Math.cos(ang) * r;
        this.pos[i * 3 + 1] = Math.random() * this.data.alto;
        this.pos[i * 3 + 2] = Math.sin(ang) * r;
        this.fase[i] = Math.random() * Math.PI * 2;
        this.vel[i] = this.data.velocidad * (0.5 + Math.random());
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
      const mat = new THREE.PointsMaterial({
        color: this.data.color,
        size: 0.055,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      this.el.setObject3D('particulas', new THREE.Points(geo, mat));
      this.geo = geo;
    },

    remove: function () { this.el.removeObject3D('particulas'); },

    tick: function (t, dt) {
      if (!dt) return;
      const n = this.data.cantidad, s = dt / 1000;
      for (let i = 0; i < n; i++) {
        this.pos[i * 3 + 1] += this.vel[i] * s;               // asciende
        this.pos[i * 3] += Math.sin(t / 1400 + this.fase[i]) * 0.0035; // vaivén
        if (this.pos[i * 3 + 1] > this.data.alto) this.pos[i * 3 + 1] = 0;
      }
      this.geo.attributes.position.needsUpdate = true;
    }
  });

  AFRAME.registerComponent('pulso-piso', {
    schema: {
      color: { default: '#5fd87a' },
      radioMax: { default: 4 },
      duracion: { default: 3200 }
    },

    init: function () {
      // 3 anillos desfasados = pulso continuo
      for (let i = 0; i < 3; i++) {
        const anillo = document.createElement('a-ring');
        anillo.setAttribute('rotation', '-90 0 0');
        anillo.setAttribute('radius-inner', 0.9);
        anillo.setAttribute('radius-outer', 1.0);
        anillo.setAttribute('color', this.data.color);
        anillo.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.5; side: double');
        const retraso = Math.round(i * this.data.duracion / 3);
        anillo.setAttribute('animation__crecer',
          `property: scale; from: 0.1 0.1 0.1; to: ${this.data.radioMax} ${this.data.radioMax} 1; loop: true; dur: ${this.data.duracion}; delay: ${retraso}; easing: linear`);
        anillo.setAttribute('animation__esfumar',
          `property: components.material.material.opacity; from: 0.5; to: 0; loop: true; dur: ${this.data.duracion}; delay: ${retraso}; easing: linear`);
        this.el.appendChild(anillo);
      }
    }
  });

  AFRAME.registerComponent('holo-logo', {
    init: function () {
      const el = this.el;

      // logo girando (doble cara) con respiración de escala
      const logo = document.createElement('a-image');
      logo.setAttribute('src', '#logo');
      logo.setAttribute('width', 1.5);
      logo.setAttribute('height', 1.5);
      logo.setAttribute('material', 'side: double; transparent: true');
      logo.setAttribute('animation__girar',
        'property: rotation; to: 0 360 0; loop: true; dur: 16000; easing: linear');
      logo.setAttribute('animation__latir',
        'property: scale; from: 1 1 1; to: 1.07 1.07 1.07; dir: alternate; loop: true; dur: 2200; easing: easeInOutSine');
      el.appendChild(logo);

      // aro holografico bajo el logo
      const aro = document.createElement('a-torus');
      aro.setAttribute('radius', 1.05);
      aro.setAttribute('radius-tubular', 0.008);
      aro.setAttribute('color', '#5fd87a');
      aro.setAttribute('opacity', 0.5);
      aro.setAttribute('rotation', '90 0 0');
      aro.setAttribute('position', '0 -0.95 0');
      aro.setAttribute('animation',
        'property: rotation; from: 90 0 0; to: 90 360 0; loop: true; dur: 9000; easing: linear');
      el.appendChild(aro);

      // satelites orbitando en sentidos opuestos
      [[1.2, 10000, '#5fd87a'], [1.45, 14000, '#7dffb0']].forEach(([r, dur, color], i) => {
        const orbita = document.createElement('a-entity');
        orbita.setAttribute('animation',
          `property: rotation; to: 0 ${i === 0 ? 360 : -360} 0; loop: true; dur: ${dur}; easing: linear`);
        const punto = document.createElement('a-sphere');
        punto.setAttribute('radius', 0.05);
        punto.setAttribute('position', r + ' 0 0');
        punto.setAttribute('color', color);
        punto.setAttribute('material', 'shader: flat');
        orbita.appendChild(punto);
        el.appendChild(orbita);
      });
    }
  });
})();
