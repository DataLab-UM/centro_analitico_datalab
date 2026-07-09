/*
 * panorama.js — panorama-vivo: la pantalla gigante del Panorama de Crecimiento.
 * Vista principal: la carrera de dos empresas durante 24 meses — la que decide
 * a ciegas (gris, tropieza) contra la que decide con datos (verde, crece) —
 * con eventos apareciendo sobre las curvas.
 * Los botones de las estelas de la línea de tiempo emiten 'enfocar' (0..2) y
 * la pantalla muestra esa etapa en detalle: cómo se decide, qué pasa y la
 * certeza al decidir. Sin interacción por VOLVER_TRAS segundos, regresa sola.
 */
AFRAME.registerComponent('panorama-vivo', {
  // fase >= 0: pantalla dedicada que muestra SIEMPRE esa fase (galeria);
  // fase -1: pantalla central con la carrera + fases seleccionables
  schema: { fase: { default: -1 } },

  init: function () {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.VOLVER_TRAS = 30;
    this.t = 0;
    this.vista = this.data.fase >= 0 ? this.data.fase : -1;
    this.ultimaInteraccion = -Infinity;
    this.ticker = 0;
    this.posMundo = new THREE.Vector3();

    // las 4 fases de la evolucion: de lo manual a la vanguardia
    this.ETAPAS = [
      { nombre: 'INICIOS: TODO A PULSO', color: '#8aa4b8', certeza: 25,
        sub: 'la empresa arranca: nada se mide, todo es memoria e intuicion',
        momentos: [
          'las ventas se anotan en un cuaderno',
          'el inventario se cuenta a mano cada mes',
          'los clientes se conocen de memoria',
          'crecer depende de la intuicion del dueno'
        ],
        resultado: 'Sobrevive, pero no puede crecer: no sabe que funciona' },
      { nombre: 'DESPERTAR: PRIMEROS DATOS', color: '#1990b8', certeza: 48,
        sub: 'los datos se ordenan: hojas de calculo y primeros reportes',
        momentos: [
          'las ventas pasan del cuaderno a hojas de calculo',
          'aparece el primer reporte mensual',
          'se descubren productos que no rotan hace meses',
          'primeras decisiones tomadas con numeros'
        ],
        resultado: '+8% de margen solo con orden: los datos empiezan a hablar' },
      { nombre: 'CON DATOS: OPERACION VISIBLE', color: '#4dd8ff', certeza: 78,
        sub: 'dashboards en vivo: toda la operacion a la vista',
        momentos: [
          'dashboard en vivo de ventas e inventario',
          'alerta a tiempo: stock bajo, repuesto hoy',
          'reportes en 1 clic para la gerencia',
          'cada area mide sus propios resultados'
        ],
        resultado: '+15% en ventas y quiebres de stock casi en cero' },
      { nombre: 'VANGUARDIA: DATOS AL 100% + IA', color: '#2ec98a', certeza: 95,
        sub: 'la IA anticipa y la empresa se adelanta al mercado',
        momentos: [
          'la IA predice la demanda del proximo viernes',
          'agentes virtuales atienden clientes 24/7',
          'compras y precios se ajustan solos',
          'la expansion se decide donde dicen los datos'
        ],
        resultado: '2.4x mas grande en 2 años, a la vanguardia del sector' }
    ];
    this.TICKER = [
      'la diferencia no es suerte: son datos a tiempo',
      'cada mes sin datos es dinero que no se ve',
      'pregunta por tus 30 minutos de asesoria gratuita',
      'DataLab: tecnologia que inspira confianza'
    ];

    // métricas comparables en la pantalla central (botones al pie)
    this.metrica = 0;
    this.inicioCarrera = 0;
    this.METRICAS = [
      { nombre: 'VENTAS', nota: 'mas alto es mejor',
        gris: (i) => 46 - i * 0.35 - (i >= 8 ? 10 * Math.min(1, (i - 8) / 2) : 0) -
                     (i >= 16 ? 8 * Math.min(1, (i - 16) / 2) : 0),
        verde: (i) => Math.min(96, 34 + i * 2.6),
        eventos: [
          [8, 'gris', 'crisis de inventario', '#ff6b6b', -46],
          [11, 'verde', 'la prediccion evito el quiebre', '#2ec98a', -42],
          [16, 'gris', 'cliente clave perdido', '#ff6b6b', 38],
          [20, 'verde', 'ventas +23%', '#2ec98a', -40]
        ],
        final: '2 años despues: 2.4x mas ventas' },
      { nombre: 'COSTOS', nota: 'mas bajo es mejor',
        gris: (i) => Math.min(92, 42 + i * 1.6 + (i >= 7 ? 8 : 0) + (i >= 14 ? 6 : 0)),
        verde: (i) => Math.max(24, 56 - i * 1.3),
        eventos: [
          [7, 'gris', 'compras de urgencia +18%', '#ff6b6b', -44],
          [10, 'verde', 'inventario optimizado', '#2ec98a', 38],
          [15, 'gris', 'horas extra por reportes', '#ff6b6b', -42],
          [19, 'verde', 'procesos automaticos -20%', '#2ec98a', 40]
        ],
        final: 'costos 30% mas bajos, sin apagar incendios' },
      { nombre: 'CLIENTES', nota: 'mas alto es mejor',
        gris: (i) => 50 - i * 0.5 - (i >= 9 ? 6 : 0) - (i >= 15 ? 5 : 0),
        verde: (i) => Math.min(94, 40 + i * 2.1),
        eventos: [
          [9, 'gris', 'se van y nadie sabe por que', '#ff6b6b', 36],
          [12, 'verde', 'la IA detecta la fuga a tiempo', '#2ec98a', -42],
          [16, 'gris', 'quejas contestadas en dias', '#ff6b6b', 38],
          [20, 'verde', 'atencion 24/7 con agentes', '#2ec98a', -40]
        ],
        final: '2x clientes, y mas fieles' },
      { nombre: 'TRABAJO MANUAL', nota: 'mas bajo es mejor',
        gris: (i) => Math.min(92, 48 + i * 1.4),
        verde: (i) => Math.max(12, 60 - i * 2.0),
        eventos: [
          [8, 'gris', '3 semanas para cerrar el mes', '#ff6b6b', -44],
          [11, 'verde', 'reportes en 1 clic', '#2ec98a', 40],
          [15, 'gris', 'doble digitacion de datos', '#ff6b6b', -42],
          [19, 'verde', 'la IA hace lo repetitivo', '#2ec98a', 42]
        ],
        final: '312 horas al mes recuperadas para crecer' }
    ];

    // cambiar la métrica comparada (botones al pie de la pantalla central)
    this.el.addEventListener('metrica', (e) => {
      if (this.data.fase >= 0) return;   // las pantallas de galeria no cambian
      const idx = parseInt(e.detail.dato, 10) || 0;
      if (!this.METRICAS[idx]) return;
      this.metrica = idx;
      this.inicioCarrera = this.t;       // la carrera arranca de cero
    });

    // aplicar la textura sin depender del orden de 'loaded' (evita pantalla blanca)
    const aplicarTextura = () => {
      const mesh = this.el.getObject3D('mesh');
      if (!mesh || this.textura) return;
      this.textura = new THREE.CanvasTexture(this.canvas);
      this.textura.anisotropy = 8;
      mesh.material.map = this.textura;
      mesh.material.needsUpdate = true;
    };
    if (this.el.hasLoaded) aplicarTextura();
    else this.el.addEventListener('loaded', aplicarTextura);
    this.aplicarTextura = aplicarTextura;

    // ponytail: 10 fps, amable con el Quest; y si el visitante esta lejos
    // (otra zona), la pantalla no redibuja: 5 canvases aqui no salen gratis
    this.intervalo = setInterval(() => {
      this.t += 0.1;
      const rig = document.querySelector('#rig');
      if (rig) {
        this.el.object3D.getWorldPosition(this.posMundo);
        if (rig.object3D.position.distanceTo(this.posMundo) > 30) return;
      }
      if (this.data.fase < 0 && this.vista >= 0 &&
          performance.now() - this.ultimaInteraccion > this.VOLVER_TRAS * 1000) {
        this.vista = -1;
      }
      const seg = Math.floor(this.t);
      if (seg % 5 === 0 && seg !== this.ultimoTicker) {
        this.ultimoTicker = seg;
        this.ticker = (this.ticker + 1) % this.TICKER.length;
      }
      this.dibujar();
      if (!this.textura) this.aplicarTextura();
      if (this.textura) this.textura.needsUpdate = true;
    }, 100);
  },

  remove: function () { clearInterval(this.intervalo); },

  caja: function (x, y, w, h, r, relleno, borde, grosor) {
    const ctx = this.ctx;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 2; ctx.stroke(); }
  },

  dibujar: function () {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(0, 0, 1024, 640);
    if (this.vista < 0) this.vistaCarrera();
    else this.vistaEtapa(this.vista);
    // ticker inferior
    ctx.fillStyle = '#0f2233';
    ctx.fillRect(0, 574, 1024, 66);
    ctx.fillStyle = '#ffd27d';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('> DATALAB', 30, 615);
    ctx.fillStyle = '#c8dcec';
    ctx.font = '22px monospace';
    ctx.fillText(this.TICKER[this.ticker], 200, 615);
  },

  // ---------- vista principal: la carrera de dos empresas, por métrica ----------

  vistaCarrera: function () {
    const ctx = this.ctx;
    const M = this.METRICAS[this.metrica];
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#ffd27d';
    ctx.fillText('LA HISTORIA DE DOS EMPRESAS', 512, 48);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('una decide a ciegas, la otra con datos - comparando: ' +
                 M.nombre.toLowerCase(), 512, 82);

    const GX = 90, GY = 130, GW = 844, GH = 380;
    this.caja(GX, GY, GW, GH, 12, '#0c1b2b', '#1e3d52', 1.5);

    // chip de la métrica activa
    const chipW = 60 + M.nombre.length * 15;
    this.caja(GX + GW - chipW - 16, GY + 16, chipW, 34, 10, 'rgba(255,210,125,0.14)', '#ffd27d', 1.5);
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#ffd27d';
    ctx.fillText(M.nombre + ' - ' + M.nota, GX + GW - chipW / 2 - 16, GY + 38);

    // leyenda
    this.caja(GX + 20, GY + 16, 250, 30, 8, 'rgba(138,164,184,0.12)');
    ctx.fillStyle = '#8aa4b8';
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('— decide a ciegas', GX + 34, GY + 36);
    this.caja(GX + 20, GY + 54, 250, 30, 8, 'rgba(46,201,138,0.12)');
    ctx.fillStyle = '#2ec98a';
    ctx.fillText('— decide con datos (DataLab)', GX + 34, GY + 74);

    // la carrera: 24 meses dibujándose en bucle (reinicia al cambiar métrica)
    const MESES = 24;
    const mes = ((this.t - this.inicioCarrera) * 1.35) % (MESES + 8);
    const n = Math.min(MESES, mes);
    const fin = mes > MESES + 1;
    const px = (i) => GX + 40 + (i / (MESES - 1)) * (GW - 80);
    const py = (v) => GY + GH - 50 - Math.max(0, Math.min(100, v)) * (GH - 120) / 100;

    [[M.gris, '#8aa4b8'], [M.verde, '#2ec98a']].forEach(([f, color]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        if (i === 0) ctx.moveTo(px(i), py(f(i))); else ctx.lineTo(px(i), py(f(i)));
      }
      ctx.stroke();
      if (n > 0 && n < MESES) {                    // punto vivo en la punta
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(px(n), py(f(n)), 6, 0, Math.PI * 2); ctx.fill();
      }
    });

    // eventos sobre las curvas (solo mientras corre la carrera)
    if (!fin) {
      M.eventos.forEach(([m, quien, texto, color, dy]) => {
        if (n < m) return;
        const x = px(m), y = py((quien === 'gris' ? M.gris : M.verde)(m));
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
        const w = 30 + texto.length * 10;
        const bx = Math.max(GX + 8, Math.min(x - w / 2, GX + GW - w - 8));
        this.caja(bx, y + dy - 14, w, 30, 8, 'rgba(10,20,32,0.95)', color, 1.5);
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = color;
        ctx.fillText(texto, bx + w / 2, y + dy + 6);
      });
    }

    // eje de meses
    ctx.fillStyle = '#3a6a8a';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < MESES; i += 4) ctx.fillText('mes ' + (i + 1), px(i), GY + GH - 16);

    // veredicto final: la gráfica se atenúa y el mensaje queda limpio encima
    if (fin) {
      this.caja(GX, GY, GW, GH, 12, 'rgba(10,20,32,0.78)');
      this.caja(GX + GW / 2 - 260, GY + 130, 520, 100, 14, 'rgba(46,201,138,0.13)', '#2ec98a', 2.5);
      ctx.textAlign = 'center';
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#2ec98a';
      ctx.fillText(M.final, 512, GY + 172);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#c8dcec';
      ctx.fillText('la diferencia fue decidir con datos', 512, GY + 206);
    }

    ctx.textAlign = 'center';
    ctx.font = 'bold 19px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText('Compara ventas, costos, clientes y trabajo manual con los botones', 512, 552);
  },

  // ---------- vista de una fase: cómo se trabaja y qué resultado dio ----------

  vistaEtapa: function (idx) {
    const ctx = this.ctx;
    const e = this.ETAPAS[idx];
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = e.color;
    ctx.fillText('FASE ' + (idx + 1) + ' - ' + e.nombre, 512, 48);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText(e.sub, 512, 82);

    // barrita de regreso automático (solo en la pantalla central)
    if (this.data.fase < 0) {
      const restante = 1 -
        (performance.now() - this.ultimaInteraccion) / (this.VOLVER_TRAS * 1000);
      ctx.fillStyle = '#1e3d52';
      ctx.fillRect(824, 22, 170, 8);
      ctx.fillStyle = e.color;
      ctx.fillRect(824, 22, Math.max(0, 170 * restante), 8);
    }

    // izquierda: medidor de certeza al decidir
    const cx = 250, cy = 300, R = 105;
    const cert = e.certeza + Math.sin(this.t * 1.4) * 2;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3d52';
    ctx.beginPath(); ctx.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
    ctx.strokeStyle = e.color;
    ctx.beginPath();
    ctx.arc(cx, cy, R, Math.PI * 0.75, Math.PI * 0.75 + (cert / 100) * Math.PI * 1.5);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#e8f0f6';
    ctx.fillText(Math.round(cert) + '%', cx, cy + 14);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('certeza al decidir', cx, cy + 52);

    // visual de la fase bajo el medidor
    if (idx === 0) {
      // cuaderno y signos de pregunta: nada se mide
      for (let i = 0; i < 4; i++) {
        this.caja(cx - 70 + i * 8, 440 - i * 10, 130, 14, 3, '#13293d', '#3a5a74', 1);
      }
      ctx.font = 'bold 34px monospace';
      ctx.fillStyle = '#ff6b6b';
      ['?', '?', '?'].forEach((q, i) => {
        ctx.fillText(q, cx - 50 + i * 50, 415 + Math.sin(this.t * 2 + i) * 6);
      });
    } else if (idx === 1) {
      // hoja de calculo: celdas que se van llenando
      this.caja(cx - 100, 400, 200, 78, 6, '#0c1b2b', e.color + '88', 1.5);
      const llenas = Math.floor(this.t * 2) % 24;
      for (let f = 0; f < 3; f++) {
        for (let col = 0; col < 8; col++) {
          const on = f * 8 + col <= llenas;
          ctx.fillStyle = on ? e.color + 'aa' : '#13293d';
          ctx.fillRect(cx - 92 + col * 23, 408 + f * 22, 19, 16);
        }
      }
    } else if (idx === 2) {
      // mini tablero en vivo
      for (let i = 0; i < 3; i++) {
        const bx = cx - 95 + i * 68;
        this.caja(bx, 408, 58, 52, 6, '#0c1b2b', e.color + '66', 1.5);
        ctx.fillStyle = e.color;
        const h = 12 + ((i * 17 + Math.floor(this.t * 3) * 7) % 28);
        ctx.fillRect(bx + 10, 452 - h, 10, h);
        ctx.fillRect(bx + 26, 452 - h * 0.7, 10, h * 0.7);
        ctx.fillRect(bx + 42, 452 - h * 1.15, 10, Math.min(h * 1.15, 38));
      }
    } else {
      // skyline creciendo: la empresa se expande
      [[0, 26], [1, 44], [2, 66], [3, 92]].forEach(([i, h]) => {
        const crecer = Math.min(1, (this.t % 6) / 3 + i * 0.12);
        this.caja(cx - 86 + i * 46, 462 - h * crecer, 34, h * crecer, 3,
                  i === 3 ? '#ffd27d' : e.color);
      });
    }

    // derecha: así se trabaja en esta fase (aparece momento a momento)
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = e.color;
    ctx.fillText('ASI SE TRABAJA EN ESTA FASE', 470, 144);
    const visibles = 1 + (Math.floor(this.t / 1.8) % e.momentos.length);
    e.momentos.slice(0, visibles).forEach((m, i) => {
      const y = 182 + i * 72;
      this.caja(470, y - 30, 500, 56, 10, 'rgba(15,34,51,0.95)', e.color + '66', 1.5);
      ctx.fillStyle = e.color;
      ctx.font = 'bold 19px monospace';
      ctx.fillText(idx === 0 ? 'x' : 'ok', 492, y + 4);
      ctx.fillStyle = '#e8f0f6';
      ctx.font = '17px monospace';
      ctx.fillText(m, idx === 0 ? 520 : 532, y + 4);
    });

    // el resultado de la fase, cuando ya se vieron todos los momentos
    if (visibles === e.momentos.length) {
      this.caja(470, 478, 500, 56, 10,
                idx === 0 ? 'rgba(255,107,107,0.12)' : 'rgba(46,201,138,0.12)',
                idx === 0 ? '#ff6b6b' : '#2ec98a', 2);
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = idx === 0 ? '#ff6b6b' : '#2ec98a';
      ctx.fillText('RESULTADO:', 490, 500);
      ctx.fillStyle = '#e8f0f6';
      ctx.font = '16px monospace';
      ctx.fillText(e.resultado, 490, 524);
    }
  }
});

