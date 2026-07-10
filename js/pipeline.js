/*
 * pipeline.js — pipeline-vivo: la pantalla gigante de la oficina BI.
 * Vista principal: el viaje del dato (4 etapas unidas por paquetes de luz,
 * contadores vivos y ticker). Los botones 3D emiten 'enfocar' con el índice
 * de etapa y la pantalla COMPLETA cambia a una vista dedicada (fuentes,
 * integración, modelo, impacto). Sin interacción por VOLVER_TRAS segundos,
 * regresa sola a la vista principal.
 */
AFRAME.registerComponent('pipeline-vivo', {
  init: function () {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.VOLVER_TRAS = 10;           // segundos sin interacción para volver
    this.t = 0;
    this.vista = -1;                 // -1 = principal; 0..3 = vista dedicada
    this.ultimaInteraccion = -Infinity; // en ms reales (performance.now)
    this.focoAmbiente = 0;           // caption rotativa de la vista principal
    this.regs = 128400;
    this.ticker = 0;

    this.NODOS = [
      { x: 130, color: '#4dd8ff', titulo: 'TUS SISTEMAS', sub: 'CRM - ventas - web',
        dato: () => this.regs.toLocaleString('es-CO') + ' registros',
        caption: 'Cada venta, cliente y visita queda registrada al instante.' },
      { x: 385, color: '#5fd87a', titulo: 'INTEGRACION', sub: 'limpieza automatica',
        dato: () => '99.2% datos confiables',
        caption: 'Los datos se unen y se limpian solos: una sola fuente de verdad.' },
      { x: 640, color: '#b48cff', titulo: 'MODELO IA', sub: 'aprende tu negocio',
        dato: () => '87% de precision',
        caption: 'La IA aprende de tu historia y anticipa lo que viene.' },
      { x: 895, color: '#ffd27d', titulo: 'DECISIONES', sub: 'dashboards y alertas',
        dato: () => '+23% en ventas',
        caption: 'Recibes dashboards y alertas a tiempo para decidir primero.' }
    ];
    this.TICKER = [
      '+412 registros nuevos desde el CRM',
      'Modelo reentrenado: precision 87.4%',
      'Alerta: pico de demanda previsto para el viernes',
      'Dashboard de gerencia actualizado hace 3 segundos',
      'Sugerencia: aumentar inventario de la linea premium'
    ];
    this.FUENTES = [
      ['CRM',              'API en tiempo real'],
      ['Facturacion',      'sincroniza cada 5 min'],
      ['Tienda web',       'webhooks al instante'],
      ['App movil',        'conector nativo'],
      ['WhatsApp',         'API oficial'],
      ['Hojas de calculo', 'importacion automatica']
    ];
    this.PASOS_LIMPIEZA = [
      ['Registros recibidos',   12480, '#4dd8ff'],
      ['Duplicados eliminados',   312, '#ff6b6b'],
      ['Formatos unificados',   12168, '#5fd87a'],
      ['Listos para el modelo', 12104, '#7dffb0']
    ];
    this.PREDICCIONES = [
      'Viernes: pico de demanda +34%',
      'Linea premium: stock agotado en 9 dias',
      'Cliente frecuente: 78% prob. de recompra',
      'Martes flojo: ideal para mantenimiento'
    ];
    this.IMPACTOS = [
      ['+23%', 'en ventas',              '#5fd87a'],
      ['-18%', 'inventario muerto',      '#4dd8ff'],
      ['2.4x', 'decisiones mas rapidas', '#ffd27d']
    ];
    // paquetes de luz viajando por el flujo (posición 0..1, velocidad propia)
    this.paquetes = Array.from({ length: 12 }, () => ({
      p: Math.random(), v: 0.0025 + Math.random() * 0.0035
    }));

    this.el.addEventListener('enfocar', (e) => {
      this.vista = parseInt(e.detail.dato, 10) || 0;
      this.ultimaInteraccion = performance.now();
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

    // ponytail: 10 fps, amable con el Quest; y sin visitante cerca no redibuja
    this.posMundo = new THREE.Vector3();
    this.intervalo = setInterval(() => {
      this.t += 0.1;
      const rig = document.querySelector('#rig');
      if (rig) {
        this.el.object3D.getWorldPosition(this.posMundo);
        if (rig.object3D.position.distanceTo(this.posMundo) > 30) return;
      }
      this.paquetes.forEach((q) => { q.p = (q.p + q.v * 10) % 1; });
      if (Math.random() < 0.35) this.regs += Math.floor(Math.random() * 60);
      // volver a la vista principal tras VOLVER_TRAS segundos sin interacción
      // (reloj real, no this.t: los timers pueden ir lentos y frenarian el regreso)
      if (this.vista >= 0 &&
          performance.now() - this.ultimaInteraccion > this.VOLVER_TRAS * 1000) {
        this.vista = -1;
      }
      const seg = Math.floor(this.t);
      if (seg % 6 === 0 && seg !== this.ultimoFoco) {
        this.ultimoFoco = seg;
        this.focoAmbiente = (this.focoAmbiente + 1) % 4;
      }
      if (seg % 4 === 0 && seg !== this.ultimoTicker) {
        this.ultimoTicker = seg;
        this.ticker = (this.ticker + 1) % this.TICKER.length;
      }
      this.dibujar();
      if (!this.textura) this.aplicarTextura(); // rescate si 'loaded' nunca llegó
      if (this.textura) this.textura.needsUpdate = true;
    }, 100);
  },

  remove: function () { clearInterval(this.intervalo); },

  // ---------- utilidades de dibujo ----------

  cabecera: function (titulo, color, sub) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = color;
    ctx.fillText(titulo, 512, 58);
    if (sub) {
      ctx.font = '22px monospace';
      ctx.fillStyle = '#c8dcec';
      ctx.fillText(sub, 512, 100);
    }
  },

  tickerInferior: function () {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f2233';
    ctx.fillRect(0, 574, 1024, 66);
    ctx.fillStyle = '#5fd87a';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('> EN VIVO', 30, 615);
    ctx.fillStyle = '#c8dcec';
    ctx.font = '22px monospace';
    ctx.fillText(this.TICKER[this.ticker], 180, 615);
  },

  // barrita de cuenta regresiva para volver a la vista principal
  regresoAutomatico: function (color) {
    const restante = 1 -
      (performance.now() - this.ultimaInteraccion) / (this.VOLVER_TRAS * 1000);
    const ctx = this.ctx;
    ctx.fillStyle = '#1e3d52';
    ctx.fillRect(824, 26, 170, 8);
    ctx.fillStyle = color;
    ctx.fillRect(824, 26, Math.max(0, 170 * restante), 8);
  },

  dibujar: function () {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(0, 0, 1024, 640);
    const vistas = [this.vistaFuentes, this.vistaIntegracion, this.vistaModelo, this.vistaImpacto];
    if (this.vista < 0) this.vistaPrincipal();
    else {
      vistas[this.vista].call(this);
      this.regresoAutomatico(this.NODOS[this.vista].color);
    }
    this.tickerInferior();
  },

  // ---------- vista principal: el viaje del dato ----------

  vistaPrincipal: function () {
    const ctx = this.ctx, Y = 330;
    const nodoFoco = this.NODOS[this.focoAmbiente];
    this.cabecera('EL VIAJE DE TUS DATOS', '#5fd87a');
    ctx.font = 'bold 25px monospace';
    ctx.fillStyle = nodoFoco.color;
    ctx.textAlign = 'center';
    ctx.fillText(nodoFoco.caption, 512, 112);

    // línea del flujo + paquetes de luz
    ctx.strokeStyle = '#1e3d52';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(this.NODOS[0].x, Y);
    ctx.lineTo(this.NODOS[3].x, Y);
    ctx.stroke();
    this.paquetes.forEach((q) => {
      const x = this.NODOS[0].x + q.p * (this.NODOS[3].x - this.NODOS[0].x);
      const y = Y + Math.sin(q.p * 26 + this.t * 2) * 7;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, 'rgba(125,255,176,0.95)');
      g.addColorStop(1, 'rgba(125,255,176,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    });

    this.NODOS.forEach((n, i) => {
      const activo = i === this.focoAmbiente;
      const R = 52 * (activo ? 1 + Math.sin(this.t * 3) * 0.06 : 1);
      ctx.fillStyle = activo ? n.color + '44' : n.color + '22';
      ctx.beginPath(); ctx.arc(n.x, Y, R + 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f2233';
      ctx.beginPath(); ctx.arc(n.x, Y, R, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = activo ? 5 : 2.5;
      ctx.strokeStyle = n.color;
      ctx.beginPath(); ctx.arc(n.x, Y, R, 0, Math.PI * 2); ctx.stroke();
      this.glifo(ctx, i, n.x, Y, n.color);
      ctx.textAlign = 'center';
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = activo ? n.color : '#c8dcec';
      ctx.fillText(n.titulo, n.x, Y + 105);
      ctx.font = '19px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText(n.sub, n.x, Y + 135);
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = n.color;
      ctx.fillText(n.dato(), n.x, Y + 172);
    });
  },

  // ---------- vista 0: fuentes ----------

  vistaFuentes: function () {
    const ctx = this.ctx, COLOR = '#4dd8ff';
    this.cabecera('TUS SISTEMAS, CONECTADOS EN VIVO', COLOR,
      'Cada fuente se consulta sola: nadie exporta ni pega datos a mano.');
    this.FUENTES.forEach(([nombre, como], i) => {
      const x = 82 + (i % 3) * 300, y = 150 + Math.floor(i / 3) * 190;
      ctx.fillStyle = '#0f2233';
      ctx.fillRect(x, y, 260, 150);
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 260, 150);
      // punto "en linea" parpadeando
      const on = Math.sin(this.t * 3 + i) > -0.3;
      ctx.fillStyle = on ? '#5fd87a' : '#1e3d52';
      ctx.beginPath(); ctx.arc(x + 232, y + 26, 7, 0, Math.PI * 2); ctx.fill();
      ctx.textAlign = 'left';
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(nombre, x + 20, y + 44);
      ctx.font = '19px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText(como, x + 20, y + 82);
      ctx.font = 'bold 21px monospace';
      ctx.fillStyle = COLOR;
      const regs = 40 + ((i * 97 + Math.floor(this.t * 2) * 13) % 360);
      ctx.fillText('+' + regs + ' registros/min', x + 20, y + 122);
    });
  },

  // ---------- vista 1: integración y limpieza ----------

  vistaIntegracion: function () {
    const ctx = this.ctx, COLOR = '#5fd87a';
    this.cabecera('LIMPIEZA Y UNIFICACION AUTOMATICA', COLOR,
      'De datos crudos a una sola fuente de verdad, sin trabajo manual.');
    const MAX = this.PASOS_LIMPIEZA[0][1];
    this.PASOS_LIMPIEZA.forEach(([nombre, base, color], i) => {
      const y = 160 + i * 100;
      const valor = base + ((Math.floor(this.t) * 7 + i * 31) % 40);
      // ancho animado que "entra" con pequeño pulso
      const w = Math.max(90, 700 * (valor / MAX) * (1 + Math.sin(this.t * 2 + i) * 0.01));
      ctx.fillStyle = '#0f2233';
      ctx.fillRect(80, y, 700, 62);
      ctx.fillStyle = color + '33';
      ctx.fillRect(80, y, w, 62);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(80, y, 700, 62);
      ctx.textAlign = 'left';
      ctx.font = 'bold 23px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(nombre, 100, y + 39);
      ctx.textAlign = 'right';
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = color;
      ctx.fillText(valor.toLocaleString('es-CO'), 940, y + 39);
    });
  },

  // ---------- vista 2: modelo IA ----------

  vistaModelo: function () {
    const ctx = this.ctx, COLOR = '#b48cff';
    this.cabecera('EL MODELO APRENDE TU NEGOCIO', COLOR,
      'Se reentrena cada noche con tus ventas del dia.');
    // izquierda: anillo de precisión
    const cx = 250, cy = 330, R = 110;
    const prec = 87.3 + Math.sin(this.t * 0.8) * 0.4;
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#1e3d52';
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = COLOR;
    ctx.beginPath();
    ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (prec / 100) * Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px monospace';
    ctx.fillStyle = '#e8f0f6';
    ctx.fillText(prec.toFixed(1) + '%', cx, cy + 8);
    ctx.font = '21px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('precision actual', cx, cy + 44);
    ctx.fillText('entrenado con ' + Math.floor(14 + this.t / 60) + ' meses de historia', cx, cy + 168);

    // derecha: predicciones en vivo (aparecen de a una)
    ctx.textAlign = 'left';
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = COLOR;
    ctx.fillText('PREDICCIONES DE HOY', 480, 190);
    const visibles = 1 + (Math.floor(this.t / 1.5) % this.PREDICCIONES.length);
    this.PREDICCIONES.slice(0, visibles).forEach((p, i) => {
      const y = 235 + i * 78;
      ctx.fillStyle = '#0f2233';
      ctx.fillRect(480, y - 34, 480, 56);
      ctx.strokeStyle = COLOR + '66';
      ctx.lineWidth = 2;
      ctx.strokeRect(480, y - 34, 480, 56);
      ctx.fillStyle = COLOR;
      ctx.font = 'bold 21px monospace';
      ctx.fillText('>', 496, y);
      ctx.fillStyle = '#c8dcec';
      ctx.font = '20px monospace';
      ctx.fillText(p, 524, y);
    });
  },

  // ---------- vista 3: impacto ----------

  vistaImpacto: function () {
    const ctx = this.ctx, COLOR = '#ffd27d';
    this.cabecera('EL RESULTADO EN TU NEGOCIO', COLOR,
      'Lo que cambia cuando decides con datos y no con intuicion.');
    this.IMPACTOS.forEach(([num, texto, color], i) => {
      const x = 82 + i * 300;
      ctx.fillStyle = '#0f2233';
      ctx.fillRect(x, 160, 260, 170);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, 160, 260, 170);
      ctx.textAlign = 'center';
      ctx.font = 'bold 56px monospace';
      ctx.fillStyle = color;
      ctx.fillText(num, x + 130, 250);
      ctx.font = '21px monospace';
      ctx.fillStyle = '#c8dcec';
      ctx.fillText(texto, x + 130, 296);
    });
    // barras creciendo: la historia del negocio que evoluciona
    const bases = [42, 55, 63, 78, 92, 110];
    bases.forEach((b, i) => {
      const h = b * (1 + Math.sin(this.t * 1.6 + i) * 0.04);
      ctx.fillStyle = i === bases.length - 1 ? COLOR : '#1990b8';
      ctx.fillRect(300 + i * 78, 520 - h, 48, h);
    });
    this.ctx.textAlign = 'center';
    this.ctx.font = 'bold 23px monospace';
    this.ctx.fillStyle = '#c8dcec';
    this.ctx.fillText('Pregunta por tus 30 minutos de asesoria gratuita', 512, 555);
  },

  // iconos geométricos por etapa (sin emojis: renderizado idéntico en todo hardware)
  glifo: function (ctx, i, x, y, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3.5;
    if (i === 0) {
      // base de datos: cilindro
      ctx.beginPath(); ctx.ellipse(x, y - 18, 22, 8, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 22, y - 18); ctx.lineTo(x - 22, y + 16);
      ctx.ellipse(x, y + 16, 22, 8, 0, Math.PI, 0, true);
      ctx.lineTo(x + 22, y - 18);
      ctx.stroke();
    } else if (i === 1) {
      // embudo
      ctx.beginPath();
      ctx.moveTo(x - 24, y - 20); ctx.lineTo(x + 24, y - 20);
      ctx.lineTo(x + 6, y + 4); ctx.lineTo(x + 6, y + 24);
      ctx.lineTo(x - 6, y + 24); ctx.lineTo(x - 6, y + 4);
      ctx.closePath(); ctx.stroke();
    } else if (i === 2) {
      // átomo: núcleo + órbitas
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x, y, 26, 11, 0.6, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, 26, 11, -0.6, 0, Math.PI * 2); ctx.stroke();
    } else {
      // barras crecientes
      ctx.fillRect(x - 22, y + 6, 11, 14);
      ctx.fillRect(x - 5, y - 6, 11, 26);
      ctx.fillRect(x + 12, y - 20, 11, 40);
    }
  }
});
