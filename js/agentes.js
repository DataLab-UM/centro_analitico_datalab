/*
 * agentes.js — agentes-vivo: la pantalla gigante de la oficina Agentes de IA.
 * Vista principal: los 4 agentes en línea con sus contadores y un ticker.
 * Al seleccionar un agente (evento 'enfocar' desde las fichas del tablero),
 * la pantalla muestra una ESCENA en vivo de su trabajo real, en bucle:
 *   Alpha: un chat con un cliente + la consola de consulta al catalogo.
 *   Beta:  correos entrando y clasificandose en bandejas.
 *   Gamma: la camara reconociendo senas y traduciendolas a texto.
 *   Delta: un documento indexandose y quedando listo para consultas.
 * Sin interacción por VOLVER_TRAS segundos, vuelve sola a la principal.
 */
AFRAME.registerComponent('agentes-vivo', {
  init: function () {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.VOLVER_TRAS = 30;
    this.t = 0;
    this.vista = -1;                    // -1 = principal; 0..3 = un agente
    this.ultimaInteraccion = -Infinity; // ms reales (performance.now)
    this.ticker = 0;

    this.AGENTES = [
      { nombre: 'Alpha', rol: 'Atencion al cliente', color: '#4dd8ff',
        kpi: () => (42 + Math.floor(this.t / 30)) + ' clientes atendidos hoy' },
      { nombre: 'Beta', rol: 'Clasificacion de correos', color: '#5fd87a',
        kpi: () => (807 + Math.floor(this.t / 8)) + ' correos clasificados hoy' },
      { nombre: 'Gamma', rol: 'Vision artificial', color: '#b48cff',
        kpi: () => (2400 + Math.floor(this.t / 4) * 10).toLocaleString('es-CO') + ' frames procesados' },
      { nombre: 'Delta', rol: 'RAG y automatizacion', color: '#ffd27d',
        kpi: () => (156 + Math.floor(this.t / 40)) + ' documentos indexados' }
    ];
    this.TICKER = [
      'Alpha cerro la cotizacion #1429 en 2.4 segundos',
      'Beta clasifico 94 correos en el ultimo minuto',
      'Gamma alcanzo 98% de precision reconociendo señas',
      'Delta indexo el manual de producto sin ayuda',
      '4 agentes en linea - supervisados por humanos'
    ];

    // guion del chat de Alpha: [segundo de inicio, quien, texto]
    this.CHAT_ALPHA = [
      [0.5,  'cliente', 'Hola! Necesito 20 sillas', 'ergonomicas para mi oficina.'],
      [8.0,  'agente',  'Con gusto! 20 sillas quedan', 'en $7.7M con 8% de descuento.'],
      [10.5, 'agente',  'Te acabo de enviar la', 'cotizacion formal al correo.'],
      [13.0, 'cliente', 'Perfecto, muchas gracias!'],
      [15.0, 'agente',  'Un placer! Quedo atento.']
    ];
    this.CONSULTA_ALPHA = [
      [2.0, '> buscar("silla ergonomica")'],
      [3.5, '  catalogo: 3 coincidencias'],
      [5.0, '  precio unitario: $420.000'],
      [6.5, '  volumen 20+: descuento 8%'],
      [7.4, '  total: $7.728.000  [OK]']
    ];
    this.CORREOS_BETA = [
      ['No me llega la factura',   'Contabilidad', '#ffd27d'],
      ['Quiero cotizar 50 unidades', 'Comercial',  '#5fd87a'],
      ['Error al entrar a la app', 'Soporte',      '#4dd8ff'],
      ['GANA UN PREMIO YA!!!',     'Spam',         '#ff6b6b']
    ];
    this.BANDEJAS_BETA = [
      ['Soporte', '#4dd8ff', 214], ['Comercial', '#5fd87a', 189],
      ['Contabilidad', '#ffd27d', 152], ['Spam', '#ff6b6b', 96]
    ];
    // poses de mano para Gamma (señas). Cada dedo: [baseX, baseY,
    // angulos de sus falanges en grados (0 = derecha, -90 = arriba), largos]
    this.SENAS_GAMMA = [
      { nombre: 'GRACIAS', conf: 98,   // mano plana, dedos juntos
        dedos: [
          [-33, -46, [-97, -97, -97], [46, 38, 26]],
          [-11, -50, [-93, -93, -93], [50, 42, 30]],
          [11, -50,  [-87, -87, -87], [48, 40, 28]],
          [33, -46,  [-82, -82, -82], [40, 32, 22]],
          [-54, 6,   [-150, -128],    [42, 30]]        // pulgar
        ] },
      { nombre: 'HOLA', conf: 96,      // mano abierta, dedos separados
        dedos: [
          [-33, -46, [-118, -118, -118], [46, 38, 26]],
          [-11, -50, [-99, -99, -99],    [50, 42, 30]],
          [11, -50,  [-80, -80, -80],    [48, 40, 28]],
          [33, -46,  [-61, -61, -61],    [40, 32, 22]],
          [-54, 6,   [-165, -143],       [44, 32]]
        ] },
      { nombre: 'BIEN', conf: 94,      // puño con el pulgar arriba
        dedos: [
          [-33, -44, [-40, 50, 130], [34, 30, 24]],
          [-11, -48, [-40, 52, 132], [36, 32, 25]],
          [11, -48,  [-42, 52, 132], [35, 31, 24]],
          [33, -44,  [-44, 54, 134], [30, 27, 21]],
          [-44, -26, [-96, -88],     [46, 36]]         // pulgar arriba
        ] }
    ];
    this.QA_DELTA = [
      [10.0, 'alpha', 'Cual es la garantia de la linea premium?'],
      [12.0, 'delta', '24 meses. Fuente: manual, pagina 12.']
    ];

    this.el.addEventListener('enfocar', (e) => {
      this.vista = parseInt(e.detail.dato, 10) || 0;
      this.ultimaInteraccion = performance.now();
      this.inicioEscena = this.t;     // cada seleccion arranca su escena de cero
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

    // ponytail: 10 fps, amable con el Quest
    this.intervalo = setInterval(() => {
      this.t += 0.1;
      if (this.vista >= 0 &&
          performance.now() - this.ultimaInteraccion > this.VOLVER_TRAS * 1000) {
        this.vista = -1;
      }
      const seg = Math.floor(this.t);
      if (seg % 4 === 0 && seg !== this.ultimoTicker) {
        this.ultimoTicker = seg;
        this.ticker = (this.ticker + 1) % this.TICKER.length;
      }
      this.dibujar();
      if (!this.textura) this.aplicarTextura();
      if (this.textura) this.textura.needsUpdate = true;
    }, 100);
  },

  remove: function () { clearInterval(this.intervalo); },

  dibujar: function () {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a1420';
    ctx.fillRect(0, 0, 1024, 640);
    if (this.vista < 0) this.vistaPrincipal();
    else this.vistaAgente(this.vista);
    // ticker inferior
    ctx.fillStyle = '#0f2233';
    ctx.fillRect(0, 574, 1024, 66);
    ctx.fillStyle = '#b48cff';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('> EN VIVO', 30, 615);
    ctx.fillStyle = '#c8dcec';
    ctx.font = '22px monospace';
    ctx.fillText(this.TICKER[this.ticker], 180, 615);
  },

  // ---------- utilidades ----------

  ventana: function (x, y, w, h, titulo, color) {
    const ctx = this.ctx;
    ctx.fillStyle = '#0f2233';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#13293d';
    ctx.fillRect(x, y, w, 36);
    ctx.fillStyle = color;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(titulo, x + 14, y + 24);
  },

  // ---------- vista principal: el equipo de agentes ----------

  vistaPrincipal: function () {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px monospace';
    ctx.fillStyle = '#b48cff';
    ctx.fillText('TU EQUIPO DE AGENTES, TRABAJANDO AHORA', 512, 58);
    ctx.font = '22px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText('Mira un agente en el tablero para ver su trabajo en detalle.', 512, 100);

    this.AGENTES.forEach((a, i) => {
      const x = 145 + i * 245, y = 300;
      const pulso = 1 + Math.sin(this.t * 2 + i * 1.7) * 0.05;
      const R = 62 * pulso;
      ctx.fillStyle = a.color + '22';
      ctx.beginPath(); ctx.arc(x, y, R + 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0f2233';
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = a.color;
      ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
      ctx.font = 'bold 52px monospace';
      ctx.fillStyle = a.color;
      ctx.fillText(a.nombre.charAt(0), x, y + 18);
      // anillo de actividad girando: "esta procesando"
      const ang = this.t * (1.2 + i * 0.25);
      ctx.lineWidth = 5;
      ctx.beginPath(); ctx.arc(x, y, R + 8, ang, ang + 1.1); ctx.stroke();

      ctx.font = 'bold 25px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(a.nombre, x, y + 118);
      ctx.font = '18px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText(a.rol, x, y + 148);
      ctx.font = 'bold 19px monospace';
      ctx.fillStyle = a.color;
      ctx.fillText(a.kpi(), x, y + 186);
    });
  },

  // ---------- vista de un agente: cabecera + su escena en vivo ----------

  vistaAgente: function (idx) {
    const ctx = this.ctx;
    const a = this.AGENTES[idx];
    ctx.textAlign = 'center';
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = a.color;
    ctx.fillText('AGENTE ' + a.nombre.toUpperCase() + ' - ' + a.rol.toUpperCase(), 512, 52);
    ctx.font = 'bold 21px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText(a.kpi(), 512, 88);

    // barrita de regreso automático
    const restante = 1 -
      (performance.now() - this.ultimaInteraccion) / (this.VOLVER_TRAS * 1000);
    ctx.fillStyle = '#1e3d52';
    ctx.fillRect(824, 22, 170, 8);
    ctx.fillStyle = a.color;
    ctx.fillRect(824, 22, Math.max(0, 170 * restante), 8);

    const escenas = [this.escenaAlpha, this.escenaBeta, this.escenaGamma, this.escenaDelta];
    escenas[idx].call(this, this.t - (this.inicioEscena || 0));
  },

  // ---- Alpha: chat con el cliente + consola de consulta al catalogo ----

  escenaAlpha: function (fase) {
    const ctx = this.ctx, COLOR = '#4dd8ff';
    const f = fase % 20;                     // bucle de 20 s
    this.ventana(56, 108, 520, 440, 'CHAT - cliente en linea', COLOR);
    this.ventana(608, 108, 360, 440, 'CONSULTA AL CATALOGO', '#5fd87a');

    // burbujas del chat que van apareciendo
    let y = 176;
    this.CHAT_ALPHA.forEach(([ini, quien, l1, l2]) => {
      if (f < ini) return;
      const esAgente = quien === 'agente';
      const alto = l2 ? 74 : 48;
      const w = 320;
      const x = esAgente ? 560 - w - 16 : 88;
      ctx.fillStyle = esAgente ? 'rgba(77,216,255,0.16)' : '#13293d';
      ctx.fillRect(x, y, w, alto);
      ctx.strokeStyle = esAgente ? COLOR : '#3a5a74';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, w, alto);
      ctx.textAlign = 'left';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = esAgente ? COLOR : '#8aa4b8';
      ctx.fillText(esAgente ? 'ALPHA' : 'CLIENTE', x + 14, y + 20);
      ctx.font = '17px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(l1, x + 14, y + 42);
      if (l2) ctx.fillText(l2, x + 14, y + 64);
      y += alto + 12;
    });
    // "escribiendo..." mientras consulta
    if (f >= 2 && f < 8) {
      ctx.font = 'italic 16px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText('Alpha esta escribiendo' + '.'.repeat(1 + Math.floor(f * 2) % 3), 88, y + 16);
    }
    // caso cerrado
    if (f >= 17) {
      ctx.fillStyle = 'rgba(95,216,122,0.15)';
      ctx.fillRect(88, 486, 456, 44);
      ctx.strokeStyle = '#5fd87a';
      ctx.strokeRect(88, 486, 456, 44);
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#5fd87a';
      ctx.fillText('CASO CERRADO - CLIENTE SATISFECHO *****', 316, 514);
    }

    // consola de consulta (lineas que aparecen mientras el agente "piensa")
    ctx.textAlign = 'left';
    this.CONSULTA_ALPHA.forEach(([ini, linea], i) => {
      if (f < ini) return;
      ctx.font = '17px monospace';
      ctx.fillStyle = linea.trim().startsWith('>') ? '#5fd87a' : '#c8dcec';
      ctx.fillText(linea, 626, 184 + i * 34);
    });
    if (f >= 2 && f < 7.4) {
      // cursor parpadeando en la consola
      if (Math.floor(f * 4) % 2 === 0) {
        ctx.fillStyle = '#5fd87a';
        ctx.fillRect(626, 184 + this.CONSULTA_ALPHA.filter(c => f >= c[0]).length * 34, 12, 20);
      }
    }
  },

  // ---- Beta: correos entrando y clasificandose en bandejas ----

  escenaBeta: function (fase) {
    const ctx = this.ctx, COLOR = '#5fd87a';
    const f = fase % 16;                     // 4 correos x 4 s
    const idx = Math.floor(f / 4);           // correo en proceso
    const sub = f % 4;                       // fase dentro del correo
    this.ventana(56, 108, 400, 440, 'BANDEJA DE ENTRADA', COLOR);
    this.ventana(608, 108, 360, 440, 'BANDEJAS DE SALIDA', '#4dd8ff');

    // correos en la bandeja (el actual resaltado)
    this.CORREOS_BETA.forEach(([asunto, destino, color], i) => {
      const y = 170 + i * 64;
      const actual = i === idx;
      const procesado = i < idx;
      ctx.globalAlpha = procesado ? 0.35 : 1;
      ctx.fillStyle = actual ? '#1d4a63' : '#13293d';
      ctx.fillRect(76, y, 360, 50);
      ctx.strokeStyle = actual ? COLOR : '#3a5a74';
      ctx.lineWidth = actual ? 2.5 : 1.5;
      ctx.strokeRect(76, y, 360, 50);
      ctx.textAlign = 'left';
      ctx.font = (actual ? 'bold ' : '') + '16px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(asunto, 92, y + 30);
      if (procesado) {
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = color;
        ctx.fillText('-> ' + destino, 300, y + 30);
      }
      ctx.globalAlpha = 1;
    });

    // analisis del correo actual (centro)
    const [asunto, destino, colorD] = this.CORREOS_BETA[idx];
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('analizando...', 532, 250);
    // sobre viajando de la bandeja a su destino
    const desde = { x: 456, y: 195 + idx * 64 };
    const hasta = { x: 608, y: 190 + this.BANDEJAS_BETA.findIndex(b => b[0] === destino) * 100 };
    const prog = Math.min(1, Math.max(0, (sub - 1.2) / 2));
    const sx = desde.x + (hasta.x - desde.x) * prog;
    const sy = desde.y + (hasta.y - desde.y) * prog - Math.sin(prog * Math.PI) * 40;
    if (sub > 1.2) {
      ctx.fillStyle = colorD;
      ctx.fillRect(sx - 14, sy - 9, 28, 18);
      ctx.strokeStyle = '#0a1420';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - 14, sy - 9); ctx.lineTo(sx, sy + 2); ctx.lineTo(sx + 14, sy - 9);
      ctx.stroke();
    }
    if (sub > 0.6) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = colorD;
      ctx.fillText('intencion:', 532, 282);
      ctx.fillText(destino.toUpperCase(), 532, 304);
    }

    // bandejas de salida con contadores
    this.BANDEJAS_BETA.forEach(([nombre, color, base], i) => {
      const y = 160 + i * 100;
      const pases = Math.floor(fase / 16);
      let cuenta = base + pases * 1;
      if (this.CORREOS_BETA.slice(0, idx + (sub > 3 ? 1 : 0))
            .some((c, j) => c[1] === nombre && j <= idx)) cuenta += 1;
      const recibiendo = nombre === destino && sub > 3;
      ctx.fillStyle = recibiendo ? '#1d4a63' : '#13293d';
      ctx.fillRect(628, y, 320, 78);
      ctx.strokeStyle = color;
      ctx.lineWidth = recibiendo ? 3 : 1.5;
      ctx.strokeRect(628, y, 320, 78);
      ctx.textAlign = 'left';
      ctx.font = 'bold 19px monospace';
      ctx.fillStyle = color;
      ctx.fillText(nombre, 648, y + 32);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText(cuenta + ' correos hoy', 648, y + 60);
    });
  },

  // ---- Gamma: la camara reconoce senas y las traduce ----

  escenaGamma: function (fase) {
    const ctx = this.ctx, COLOR = '#b48cff';
    const f = fase % 12;                     // 3 senas x 4 s
    const idx = Math.floor(f / 4);
    const sub = f % 4;
    const sena = this.SENAS_GAMMA[idx];
    this.ventana(56, 108, 460, 440, 'CAMARA EN VIVO', COLOR);
    this.ventana(568, 108, 400, 440, 'TRADUCCION A TEXTO', '#5fd87a');

    // mano realista haciendo la seña, con su movimiento propio
    ctx.save();
    let mx = 286, my = 360, rot = 0;
    if (idx === 0) {          // GRACIAS: de la barbilla hacia afuera
      const m = (Math.sin(this.t * 2) + 1) / 2;
      mx += m * 30; my += m * 16; rot = -0.15 + m * 0.25;
    } else if (idx === 1) {   // HOLA: la mano ondea saludando
      rot = Math.sin(this.t * 4) * 0.24;
    } else {                  // BIEN: pulgar arriba con rebote suave
      my += Math.sin(this.t * 3) * 7;
    }
    ctx.translate(mx, my);
    ctx.rotate(rot);
    this.dibujarMano(sena, this.t);
    ctx.restore();

    // barrido de escaneo
    if (sub < 1.5) {
      const sy = 160 + (sub / 1.5) * 370;
      ctx.strokeStyle = 'rgba(95,216,122,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(66, sy); ctx.lineTo(506, sy); ctx.stroke();
    }
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText(sub < 1.5 ? 'capturando...' : (sub < 2.5 ? 'analizando rasgos...' : 'seña reconocida'),
                 286, 526);

    // resultados acumulados
    ctx.textAlign = 'left';
    for (let i = 0; i <= idx; i++) {
      const s = this.SENAS_GAMMA[i];
      const listo = i < idx || sub >= 2.5;
      if (!listo) continue;
      const y = 190 + i * 96;
      ctx.fillStyle = '#13293d';
      ctx.fillRect(588, y, 360, 72);
      ctx.strokeStyle = COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(588, y, 360, 72);
      ctx.font = 'bold 30px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText('"' + s.nombre + '"', 608, y + 34);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#5fd87a';
      ctx.fillText('confianza: ' + s.conf + '%', 608, y + 58);
    }
  },

  // mano con volumen (palma + dedos carnosos) y landmarks de visión artificial.
  // Se dibuja centrada en el origen; el caller posiciona/rota con transform.
  dibujarMano: function (pose, jitterT) {
    const ctx = this.ctx;
    const rad = (g) => g * Math.PI / 180;
    // articulaciones de cada dedo a partir de sus ángulos y largos
    const dedos = pose.dedos.map(([bx, by, angs, largos]) => {
      const pts = [[bx, by]];
      let x = bx, y = by;
      angs.forEach((a, i) => {
        x += Math.cos(rad(a)) * largos[i];
        y += Math.sin(rad(a)) * largos[i];
        pts.push([x, y]);
      });
      return pts;
    });

    const trazarDedos = (grosor, color) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = grosor;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      dedos.forEach((pts) => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      });
    };

    // silueta carnosa: palma + muñeca + dedos gruesos, con luz interior
    ctx.fillStyle = '#31567a';
    ctx.beginPath(); ctx.ellipse(0, 0, 52, 60, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 64, 30, 26, 0, 0, Math.PI * 2); ctx.fill();
    trazarDedos(23, '#31567a');
    trazarDedos(10, '#3e6a94');
    ctx.fillStyle = '#3e6a94';
    ctx.beginPath(); ctx.ellipse(0, 2, 36, 44, 0, 0, Math.PI * 2); ctx.fill();

    // landmarks estilo vision artificial (con vibracion leve de rastreo)
    ctx.strokeStyle = '#b48cff';
    ctx.lineWidth = 2;
    dedos.forEach((pts) => {
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        const jx = x + Math.sin(jitterT * 3 + x) * 1.5;
        const jy = y + Math.cos(jitterT * 2.7 + y) * 1.5;
        if (i) ctx.lineTo(jx, jy); else ctx.moveTo(jx, jy);
      });
      ctx.stroke();
    });
    dedos.forEach((pts) => pts.forEach(([x, y]) => {
      ctx.fillStyle = '#d9c7ff';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }));
    ctx.fillStyle = '#5fd87a';
    ctx.beginPath(); ctx.arc(0, 64, 5, 0, Math.PI * 2); ctx.fill();
  },

  // ---- Delta: indexa un documento y responde consultas ----

  escenaDelta: function (fase) {
    const ctx = this.ctx, COLOR = '#ffd27d';
    const f = fase % 15;
    this.ventana(56, 108, 300, 440, 'DOCUMENTO NUEVO', COLOR);
    this.ventana(608, 108, 360, 440, 'CONSULTAS DE OTROS AGENTES', '#4dd8ff');

    // documento (pagina con lineas)
    ctx.fillStyle = '#e8f0f6';
    ctx.fillRect(116, 180, 180, 230);
    ctx.fillStyle = '#8aa4b8';
    for (let i = 0; i < 8; i++) ctx.fillRect(134, 202 + i * 26, 144 - (i % 3) * 24, 8);
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = '#e8f0f6';
    ctx.fillText('manual_producto.pdf', 206, 446);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('34 paginas', 206, 472);

    // base de conocimiento (cilindro central)
    const bx = 482, by = 330;
    ctx.strokeStyle = COLOR;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(bx, by - 52, 56, 18, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 56, by - 52); ctx.lineTo(bx - 56, by + 44);
    ctx.ellipse(bx, by + 44, 56, 18, 0, Math.PI, 0, true);
    ctx.lineTo(bx + 56, by - 52);
    ctx.stroke();
    const prog = Math.min(1, Math.max(0, (f - 1) / 6));
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = COLOR;
    ctx.fillText(Math.floor(prog * 100) + '%', bx, by + 4);
    ctx.font = '15px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText(prog < 1 ? 'indexando...' : 'listo para consultas', bx, by + 92);
    if (prog >= 1) {
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#5fd87a';
      ctx.fillText('[OK] indexado en 6.2s', bx, by - 92);
    }

    // trozos del documento volando a la base
    if (prog < 1) {
      for (let i = 0; i < 5; i++) {
        const p = (prog * 3 + i * 0.2) % 1;
        const x = 296 + (bx - 56 - 296) * p;
        const y = 300 - Math.sin(p * Math.PI) * 60 + i * 12;
        ctx.fillStyle = 'rgba(255,210,125,' + (1 - p * 0.5) + ')';
        ctx.fillRect(x, y, 18, 12);
      }
    }

    // consultas que llegan cuando el documento ya esta indexado
    ctx.textAlign = 'left';
    this.QA_DELTA.forEach(([ini, quien, texto], i) => {
      if (f < ini) return;
      const esDelta = quien === 'delta';
      const y = 190 + i * 110;
      ctx.fillStyle = esDelta ? 'rgba(255,210,125,0.14)' : '#13293d';
      ctx.fillRect(628, y, 320, 84);
      ctx.strokeStyle = esDelta ? COLOR : '#4dd8ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(628, y, 320, 84);
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = esDelta ? COLOR : '#4dd8ff';
      ctx.fillText(esDelta ? 'DELTA' : 'AGENTE ALPHA', 646, y + 24);
      ctx.font = '16px monospace';
      ctx.fillStyle = '#e8f0f6';
      // partir el texto en dos lineas si es largo
      if (texto.length > 34) {
        const corte = texto.lastIndexOf(' ', 34);
        ctx.fillText(texto.slice(0, corte), 646, y + 50);
        ctx.fillText(texto.slice(corte + 1), 646, y + 72);
      } else {
        ctx.fillText(texto, 646, y + 50);
      }
    });
  }
});
