/*
 * escenas-web.js — escena-web: las 3 pantallas de la oficina Plataformas Web.
 * Cada una es una escena canvas en bucle que muestra el servicio funcionando:
 *   tipo: web       — una app real usandose: dashboard vivo + espejo en celular
 *   tipo: tienda    — un e-commerce vendiendo solo: carrito, pago, contador
 *   tipo: inmersivo — grabacion en primera persona de un recorrido VR:
 *                     piso en perspectiva, paneles 3D, cursor de mirada,
 *                     teletransporte con fundido entre 4 zonas
 * Uso: <a-plane escena-web="tipo: web"></a-plane>  (canvas 1024x640, 10 fps)
 */
AFRAME.registerComponent('escena-web', {
  schema: { tipo: { default: 'web' } },

  init: function () {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.t = 0;

    // estado propio de cada escena
    this.serie = Datos.serie(30, 20, 90);
    this.ventasHoy = 4280000;
    this.ultimasVentas = ['Silla ergonomica - $420.000', 'Audifonos pro - $310.000'];
    this.visitantes = 1240;

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

    this.intervalo = setInterval(() => {
      this.t += 0.1;
      if (Math.floor(this.t * 10) % 3 === 0) Datos.avanzar(this.serie, 15, 95, 7);
      const ctx = this.ctx;
      ctx.fillStyle = '#0a1420';
      ctx.fillRect(0, 0, 1024, 640);
      ({ web: this.escenaApp, tienda: this.escenaTienda, inmersivo: this.escenaInmersivo })
        [this.data.tipo].call(this);
      if (!this.textura) aplicarTextura();
      if (this.textura) this.textura.needsUpdate = true;
    }, 100);
  },

  remove: function () { clearInterval(this.intervalo); },

  // rectángulo redondeado con relleno/borde (el look profesional del template)
  caja: function (x, y, w, h, r, relleno, borde, grosor) {
    const ctx = this.ctx;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 2; ctx.stroke(); }
  },

  // sombra suave debajo de una ventana (profundidad)
  sombra: function (x, y, w, h, r) {
    this.caja(x + 6, y + 8, w, h, r, 'rgba(0,0,0,0.35)');
  },

  cabecera: function (titulo, sub, color) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = color;
    ctx.fillText(titulo, 512, 44);
    ctx.font = '20px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText(sub, 512, 78);
  },

  // ---------- tipo web: una app viva + su espejo en el celular ----------

  escenaApp: function () {
    const ctx = this.ctx, COLOR = '#4dd8ff';
    const VISTAS = [['Ventas', '#4dd8ff'], ['Inventario', '#5fd87a'], ['Clientes', '#b48cff']];
    const idx = Math.floor(this.t / 6) % 3;
    const sub = this.t % 6;
    const [vista, colorV] = VISTAS[idx];
    this.cabecera('PLATAFORMAS WEB', 'una app a tu medida, funcionando en vivo', COLOR);

    // ventana del navegador con sombra y esquinas redondeadas
    this.sombra(56, 104, 690, 460, 14);
    this.caja(56, 104, 690, 460, 14, '#0f2233', '#28506e', 1.5);
    this.caja(56, 104, 690, 44, { upperLeft: 14, upperRight: 14 }, '#16324a');
    ctx.save(); ctx.beginPath(); ctx.rect(56, 104, 690, 44); ctx.clip();
    this.caja(56, 104, 690, 60, 14, '#16324a');
    ctx.restore();
    ['#ff6b6b', '#ffd27d', '#5fd87a'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(86 + i * 26, 126, 7, 0, Math.PI * 2); ctx.fill();
    });
    this.caja(180, 113, 430, 26, 13, '#0a1420');
    ctx.fillStyle = '#8aa4b8';
    ctx.font = '15px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('https://app.tuempresa.com/' + vista.toLowerCase(), 196, 131);

    // barra lateral
    ctx.fillStyle = '#0c1b2b';
    ctx.fillRect(58, 148, 158, 414);
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = COLOR;
    ctx.fillText('TU EMPRESA', 78, 180);
    VISTAS.forEach(([nombre, col], i) => {
      const y = 218 + i * 52;
      if (i === idx) {
        this.caja(66, y - 24, 142, 38, 10, col + '22');
        ctx.fillStyle = col;
        ctx.fillRect(66, y - 24, 4, 38);
      }
      ctx.font = (i === idx ? 'bold ' : '') + '17px monospace';
      ctx.fillStyle = i === idx ? '#e8f0f6' : '#8aa4b8';
      ctx.fillText(nombre, 88, y);
    });

    // KPIs vivos en tarjetas redondeadas
    const KPIS = [
      ['$' + (128 + Math.floor(this.t) % 60) + 'M', 'ventas', '#5fd87a'],
      [(94 + Math.floor(this.t * 2) % 5) + '%', 'a tiempo', COLOR],
      ['+' + (12 + Math.floor(this.t / 2) % 9), 'clientes', '#b48cff']
    ];
    KPIS.forEach(([num, label, col], i) => {
      const x = 240 + i * 168;
      this.caja(x, 168, 152, 74, 12, '#13293d', col + '44', 1.5);
      ctx.textAlign = 'center';
      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = col;
      ctx.fillText(num, x + 76, 204);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText(label, x + 76, 228);
    });

    // área del gráfico con rejilla
    const gx = 240, gy = 262, gw = 484, gh = 262;
    this.caja(gx, gy, gw, gh, 12, '#0c1b2b', '#1e3d52', 1);
    ctx.strokeStyle = 'rgba(30,61,82,0.6)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(gx + 16, gy + (gh / 5) * i);
      ctx.lineTo(gx + gw - 16, gy + (gh / 5) * i);
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = colorV;
    ctx.fillText(vista.toUpperCase() + ' - EN VIVO', gx + 20, gy + 26);

    if (idx === 0) {              // Ventas: línea con degradado bajo la curva
      const puntos = this.serie.map((v, i) => [
        gx + 24 + (i / (this.serie.length - 1)) * (gw - 48),
        gy + gh - 24 - (v / 100) * (gh - 80)
      ]);
      const grad = ctx.createLinearGradient(0, gy, 0, gy + gh);
      grad.addColorStop(0, colorV + '55');
      grad.addColorStop(1, colorV + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(puntos[0][0], gy + gh - 16);
      puntos.forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.lineTo(puntos[puntos.length - 1][0], gy + gh - 16);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = colorV; ctx.lineWidth = 3;
      ctx.beginPath();
      puntos.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      // punto vivo al final
      const [ux, uy] = puntos[puntos.length - 1];
      ctx.fillStyle = '#e8f0f6';
      ctx.beginPath(); ctx.arc(ux, uy, 5, 0, Math.PI * 2); ctx.fill();
    } else if (idx === 1) {       // Inventario: barras redondeadas
      for (let i = 0; i < 8; i++) {
        const h = 44 + ((i * 53 + Math.floor(this.t * 2) * 17) % (gh - 120));
        this.caja(gx + 36 + i * 56, gy + gh - 20 - h, 36, h, 6,
                  i % 2 ? colorV : '#1990b8');
      }
    } else {                      // Clientes: dona con etiqueta
      const cx2 = gx + gw / 2, cy2 = gy + gh / 2 + 10;
      const fr = 0.55 + Math.sin(this.t) * 0.1;
      ctx.lineWidth = 30; ctx.lineCap = 'round';
      ctx.strokeStyle = '#1e3d52';
      ctx.beginPath(); ctx.arc(cx2, cy2, 80, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = colorV;
      ctx.beginPath(); ctx.arc(cx2, cy2, 80, -Math.PI / 2, -Math.PI / 2 + fr * Math.PI * 2); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = 'bold 34px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(Math.floor(fr * 100) + '%', cx2, cy2 + 6);
      ctx.font = '15px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText('recurrentes', cx2, cy2 + 34);
    }

    // cursor animado que va a la siguiente sección
    let cxr = 470, cyr = 400;
    if (sub > 4.4) {
      const p = (sub - 4.4) / 1.6;
      const destinoY = 212 + ((idx + 1) % 3) * 52;
      cxr = 470 + (130 - 470) * p;
      cyr = 400 + (destinoY - 400) * p;
    }
    ctx.fillStyle = '#e8f0f6';
    ctx.strokeStyle = '#0a1420';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cxr, cyr); ctx.lineTo(cxr + 13, cyr + 15); ctx.lineTo(cxr + 6, cyr + 15);
    ctx.lineTo(cxr + 9, cyr + 24); ctx.lineTo(cxr + 5, cyr + 25); ctx.lineTo(cxr + 2, cyr + 16);
    ctx.lineTo(cxr - 3, cyr + 20);
    ctx.closePath(); ctx.fill(); ctx.stroke();

    // celular espejo con sombra
    this.sombra(790, 128, 180, 364, 26);
    this.caja(790, 128, 180, 364, 26, '#0f2233', COLOR, 3);
    this.caja(848, 140, 64, 10, 5, '#13293d');
    ctx.fillStyle = colorV;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(vista, 880, 186);
    ctx.font = 'bold 30px monospace';
    ctx.fillText(KPIS[0][0], 880, 228);
    for (let i = 0; i < 5; i++) {
      const h = 24 + ((i * 37 + Math.floor(this.t * 2) * 11) % 90);
      this.caja(812 + i * 30, 400 - h, 20, h, 4, colorV);
    }
    ctx.font = '14px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('la misma app,', 880, 442);
    ctx.fillText('en tu bolsillo', 880, 464);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText('Del navegador al celular, con tus datos en tiempo real', 512, 610);
  },

  // ---------- tipo tienda: el e-commerce vendiendo solo ----------

  escenaTienda: function () {
    const ctx = this.ctx, COLOR = '#5fd87a';
    const PRODUCTOS = [
      ['Silla ergonomica', 420000, '#4dd8ff'],
      ['Audifonos pro', 310000, '#b48cff'],
      ['Teclado mecanico', 260000, '#ffd27d']
    ];
    const idx = Math.floor(this.t / 4) % 3;
    const sub = this.t % 4;
    const [nombre, precio, colorP] = PRODUCTOS[idx];
    this.cabecera('E-COMMERCE Y PORTALES', 'tu tienda vendiendo sola, 24/7', COLOR);

    // vitrina con sombra
    this.sombra(56, 104, 610, 460, 14);
    this.caja(56, 104, 610, 460, 14, '#0f2233', '#28506e', 1.5);
    ctx.font = 'bold 19px monospace';
    ctx.fillStyle = '#e8f0f6';
    ctx.textAlign = 'left';
    ctx.fillText('tutienda.com', 82, 140);
    ctx.fillStyle = COLOR;
    ctx.fillText('.', 82 + 12 * 12, 140);

    // carrito
    const carX = 616, carY = 132;
    ctx.strokeStyle = sub > 2.1 && sub < 2.5 ? COLOR : '#8aa4b8';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(carX - 18, carY - 10); ctx.lineTo(carX - 10, carY - 10);
    ctx.lineTo(carX - 4, carY + 8); ctx.lineTo(carX + 14, carY + 8);
    ctx.lineTo(carX + 18, carY - 4);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(carX - 2, carY + 16, 3.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(carX + 11, carY + 16, 3.5, 0, Math.PI * 2); ctx.stroke();
    // contador del carrito
    ctx.fillStyle = COLOR;
    ctx.beginPath(); ctx.arc(carX + 16, carY - 12, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a1420';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(1 + Math.floor(this.t / 4) % 9), carX + 16, carY - 7);

    PRODUCTOS.forEach(([nom, pre, col], i) => {
      const x = 88 + i * 190, y = 168;
      const activo = i === idx && sub < 2.1;
      this.caja(x, y, 168, 230, 12, activo ? '#1d4a63' : '#13293d',
                activo ? col : '#28506e', activo ? 2.5 : 1.5);
      this.caja(x + 12, y + 12, 144, 104, 8, '#0c1b2b');
      this.productoIcono(i, x + 84, y + 62, col);
      ctx.textAlign = 'center';
      ctx.font = '14px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.fillText(nom, x + 84, y + 140);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#ffd27d';
      ctx.fillText('***** (' + (120 + i * 37) + ')', x + 84, y + 162);
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = col;
      ctx.fillText('$' + pre.toLocaleString('es-CO'), x + 84, y + 188);
      // botón comprar
      const comprado = i === idx && sub >= 1 && sub < 2.3;
      this.caja(x + 24, y + 198, 120, 24, 12, comprado ? col : col + '22', col, 1.5);
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = comprado ? '#0a1420' : col;
      ctx.fillText(comprado ? 'AGREGADO' : 'COMPRAR', x + 84, y + 215);
    });

    // el producto vuela al carrito
    if (sub >= 1.2 && sub < 2.3) {
      const p = (sub - 1.2) / 1.1;
      const x0 = 172 + idx * 190, y0 = 240;
      const x = x0 + (carX - x0) * p;
      const y = y0 + (carY - y0) * p - Math.sin(p * Math.PI) * 70;
      ctx.globalAlpha = 1 - p * 0.4;
      this.productoIcono(idx, x, y, colorP);
      ctx.globalAlpha = 1;
    }

    // barra de pago
    if (sub >= 2.3) {
      const ok = sub >= 3.1;
      this.caja(88, 424, 546, 54, 12, ok ? 'rgba(95,216,122,0.15)' : '#13293d',
                ok ? COLOR : '#3a5a74', 2);
      ctx.textAlign = 'center';
      ctx.font = 'bold 19px monospace';
      ctx.fillStyle = ok ? COLOR : '#8aa4b8';
      ctx.fillText(ok ? 'PAGO APROBADO - pedido #' + (2810 + Math.floor(this.t / 4)) +
                        ' en camino' : 'procesando pago seguro' + '.'.repeat(1 + Math.floor(sub * 3) % 3),
                   360, 458);
      if (ok && this.ultimoRegistro !== Math.floor(this.t / 4)) {
        this.ultimoRegistro = Math.floor(this.t / 4);
        this.ventasHoy += precio;
        this.ultimasVentas.unshift(nombre + ' - $' + precio.toLocaleString('es-CO'));
        this.ultimasVentas = this.ultimasVentas.slice(0, 4);
      }
    }

    // panel de ventas del día
    this.sombra(700, 104, 268, 460, 14);
    this.caja(700, 104, 268, 460, 14, '#0f2233', '#4dd8ff55', 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 19px monospace';
    ctx.fillStyle = '#4dd8ff';
    ctx.fillText('VENTAS DE HOY', 834, 146);
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = '#e8f0f6';
    ctx.fillText('$' + (this.ventasHoy / 1000000).toFixed(2) + 'M', 834, 194);
    this.caja(770, 210, 128, 28, 14, 'rgba(95,216,122,0.14)');
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = COLOR;
    ctx.fillText((38 + Math.floor(this.t / 4)) + ' pedidos', 834, 229);
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('ultimas ventas:', 722, 278);
    this.ultimasVentas.forEach((v, i) => {
      ctx.font = '14px monospace';
      ctx.fillStyle = i === 0 ? COLOR : '#c8dcec';
      ctx.fillText('> ' + v, 722, 308 + i * 30);
    });
    ctx.textAlign = 'center';
    ctx.font = '14px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('inventario y facturas', 834, 484);
    ctx.fillText('se actualizan solos', 834, 506);

    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText('Cada venta actualiza inventario, factura y dashboard', 512, 610);
  },

  productoIcono: function (idx, x, y, color) {
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    if (idx === 0) {              // silla
      ctx.beginPath();
      ctx.moveTo(x - 20, y - 28); ctx.lineTo(x - 20, y + 6); ctx.lineTo(x + 20, y + 6);
      ctx.moveTo(x - 20, y + 6); ctx.lineTo(x - 20, y + 30);
      ctx.moveTo(x + 16, y + 6); ctx.lineTo(x + 16, y + 30);
      ctx.stroke();
    } else if (idx === 1) {       // audifonos
      ctx.beginPath(); ctx.arc(x, y - 2, 24, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = color;
      ctx.fillRect(x - 30, y - 4, 10, 22);
      ctx.fillRect(x + 20, y - 4, 10, 22);
    } else {                      // teclado
      ctx.strokeRect(x - 28, y - 12, 56, 30);
      ctx.fillStyle = color;
      for (let f = 0; f < 2; f++)
        for (let col = 0; col < 5; col++)
          ctx.fillRect(x - 22 + col * 10, y - 6 + f * 10, 6, 6);
    }
  },

  // ---------- tipo inmersivo: recorrido VR en primera persona ----------

  escenaInmersivo: function () {
    const ctx = this.ctx;
    const ZONAS = [
      { nombre: 'LOBBY DATALAB', color: '#5fd87a',
        dato: 'Bienvenido! Mira un portal para entrar' },
      { nombre: 'BUSINESS INTELLIGENCE', color: '#4dd8ff',
        dato: 'VENTAS HOY: $138M  (+12%)' },
      { nombre: 'AGENTES DE IA', color: '#b48cff',
        dato: 'Alpha ejecuto tu orden en 2.4s' },
      { nombre: 'PANORAMA DE CRECIMIENTO', color: '#ffd27d',
        dato: 'Proyeccion: +23% este año' }
    ];
    const DUR = 6;
    const idx = Math.floor(this.t / DUR) % 4;
    const sub = this.t % DUR;
    const z = ZONAS[idx];
    this.cabecera('ENTORNOS INMERSIVOS', 'grabacion real de un recorrido construido por DataLab', '#b48cff');

    // ---- viewport del visor ----
    const VX = 72, VY = 96, VW = 880, VH = 452;
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(VX, VY, VW, VH, 22); else ctx.rect(VX, VY, VW, VH);
    ctx.clip();

    // cielo con gradiente por zona
    const cielo = ctx.createLinearGradient(0, VY, 0, VY + VH);
    if (idx === 3) {              // atardecer del panorama
      cielo.addColorStop(0, '#1a1030');
      cielo.addColorStop(0.55, '#5a2a44');
      cielo.addColorStop(0.75, '#c96b3a');
      cielo.addColorStop(1, '#12060f');
    } else {
      cielo.addColorStop(0, '#050d16');
      cielo.addColorStop(1, '#0d2236');
    }
    ctx.fillStyle = cielo;
    ctx.fillRect(VX, VY, VW, VH);

    // vaivén de cabeza: el punto de fuga se mece
    const sway = Math.sin(this.t * 0.7) * 30;
    const vpx = 512 + sway, vpy = VY + 210;

    // piso en perspectiva (rejilla que huye al punto de fuga)
    ctx.strokeStyle = z.color + '38';
    ctx.lineWidth = 1.5;
    for (let i = -7; i <= 7; i++) {
      ctx.beginPath();
      ctx.moveTo(vpx + i * 30, vpy);
      ctx.lineTo(vpx + i * 240, VY + VH);
      ctx.stroke();
    }
    for (let n = 0, y = vpy + 7; y < VY + VH; n++, y = vpy + 7 * Math.pow(1.65, n)) {
      ctx.globalAlpha = Math.min(1, 0.25 + n * 0.12);
      ctx.beginPath();
      ctx.moveTo(VX, y); ctx.lineTo(VX + VW, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    // brillo del horizonte
    const halo = ctx.createRadialGradient(vpx, vpy, 10, vpx, vpy, 260);
    halo.addColorStop(0, z.color + '30');
    halo.addColorStop(1, z.color + '00');
    ctx.fillStyle = halo;
    ctx.fillRect(VX, VY, VW, VH);

    // ---- contenido 3D de cada zona ----
    if (idx === 0) this.zonaLobby(vpx, vpy, z.color);
    else if (idx === 1) this.zonaBI(vpx, vpy, sub);
    else if (idx === 2) this.zonaIA(vpx, vpy);
    else this.zonaCiudad(vpx, vpy, VY, VH);

    // ---- cursor de mirada con fuse (como el recorrido real) ----
    const cx2 = 512, cy2 = VY + 216;
    if (sub >= 2 && sub < 3.6) {              // fijando la mirada: anillo que se llena
      const p = (sub - 2) / 1.6;
      ctx.strokeStyle = '#ffffff55';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx2, cy2, 16, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = z.color;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx2, cy2, 16, -Math.PI / 2, -Math.PI / 2 + p * Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(cx2, cy2, 7, 0, Math.PI * 2); ctx.stroke();
    }
    // al completar el fuse: el dato de la zona aparece como tooltip
    if (sub >= 3.6 && sub < DUR - 0.6) {
      const w = 24 + z.dato.length * 12;
      this.caja(cx2 - w / 2, cy2 - 74, w, 44, 10, 'rgba(10,20,32,0.92)', z.color, 2);
      ctx.textAlign = 'center';
      ctx.font = 'bold 19px monospace';
      ctx.fillStyle = z.color;
      ctx.fillText(z.dato, cx2, cy2 - 46);
    }

    // ---- HUD del visor ----
    this.caja(VX + 18, VY + 16, 30 + z.nombre.length * 12, 34, 10, 'rgba(10,20,32,0.85)', z.color, 1.5);
    ctx.textAlign = 'left';
    ctx.font = 'bold 17px monospace';
    ctx.fillStyle = z.color;
    ctx.fillText(z.nombre, VX + 34, VY + 39);
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = '#5fd87a';
    ctx.fillText((70 + Math.floor(this.t * 3) % 4) + ' FPS - WebXR', VX + VW - 26, VY + 38);
    // minimapa: 4 zonas, la actual encendida
    ZONAS.forEach((zz, i) => {
      ctx.fillStyle = i === idx ? zz.color : '#3a5a74';
      ctx.beginPath();
      ctx.arc(VX + VW / 2 - 45 + i * 30, VY + VH - 26, i === idx ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // teletransporte: fundido a negro entre zonas
    let velo = 0;
    if (sub > DUR - 0.5) velo = (sub - (DUR - 0.5)) / 0.5;
    else if (sub < 0.5) velo = 1 - sub / 0.5;
    if (velo > 0) {
      ctx.fillStyle = 'rgba(0,0,0,' + velo.toFixed(2) + ')';
      ctx.fillRect(VX, VY, VW, VH);
    }
    ctx.restore();

    // marco del visor
    this.caja(VX, VY, VW, VH, 22, null, '#b48cff', 3);

    ctx.textAlign = 'center';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText('Si puedes imaginarlo, podemos construirlo en VR', 512, 610);
  },

  // panel en perspectiva: trapecio con cara hacia el centro
  panel3d: function (xCerca, xLejos, yCentro, altoCerca, altoLejos, color) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15,34,51,0.92)';
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xCerca, yCentro - altoCerca / 2);
    ctx.lineTo(xLejos, yCentro - altoLejos / 2);
    ctx.lineTo(xLejos, yCentro + altoLejos / 2);
    ctx.lineTo(xCerca, yCentro + altoCerca / 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  },

  zonaLobby: function (vpx, vpy, color) {
    const ctx = this.ctx;
    // 4 portales en perspectiva, dos por lado
    [[-1, 0], [-1, 1], [1, 0], [1, 1]].forEach(([lado, fila]) => {
      const xC = vpx + lado * (330 - fila * 130);
      const xL = vpx + lado * (200 - fila * 90);
      const yC = vpy + 26;
      this.panel3d(xC, xL, yC, 190 - fila * 60, 110 - fila * 34, color);
      // resplandor interior del portal
      const g = ctx.createLinearGradient(Math.min(xC, xL), 0, Math.max(xC, xL), 0);
      g.addColorStop(0, color + '44');
      g.addColorStop(1, color + '0c');
      ctx.fillStyle = g;
      const w = (xL - xC) * 0.72, h = (170 - fila * 55);
      ctx.fillRect(Math.min(xC + w * 0.14, xC), yC - h / 2, w, h);
    });
    // letrero de bienvenida flotando al fondo
    this.caja(vpx - 120, vpy - 118, 240, 44, 8, 'rgba(19,52,69,0.95)', color, 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = color;
    ctx.fillText('BIENVENIDO A DATALAB', vpx, vpy - 90);
  },

  zonaBI: function (vpx, vpy, sub) {
    const ctx = this.ctx;
    const enfocado = sub >= 3.6;
    // dos tableros laterales + uno central
    this.panel3d(vpx - 350, vpx - 190, vpy + 10, 210, 120, '#4dd8ff');
    this.panel3d(vpx + 350, vpx + 190, vpy + 10, 210, 120, '#4dd8ff');
    // mini graficos dentro de los laterales
    ctx.fillStyle = '#4dd8ff';
    for (let i = 0; i < 4; i++) {
      const h = 18 + ((i * 31 + Math.floor(this.t * 3) * 9) % 46);
      ctx.fillRect(vpx - 320 + i * 30, vpy + 62 - h, 18, h);
      ctx.fillRect(vpx + 222 + i * 30, vpy + 62 - h, 18, h);
    }
    // tablero central (el que se mira): crece al enfocarlo
    const esc = enfocado ? 1.12 : 1;
    const w = 190 * esc, h = 120 * esc;
    this.caja(vpx - w / 2, vpy - 40 - h / 2, w, h, 8, 'rgba(15,34,51,0.95)',
              enfocado ? '#7dffb0' : '#4dd8ff', enfocado ? 3.5 : 2.5);
    ctx.strokeStyle = '#7dffb0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const x = vpx - w / 2 + 14 + i * (w - 28) / 11;
      const y = vpy - 40 + 18 - Math.abs(Math.sin(i * 0.9 + this.t * 1.4)) * 34;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#4dd8ff';
    ctx.fillText('VENTAS EN TIEMPO REAL', vpx, vpy - 40 - h / 2 + 18);
  },

  zonaIA: function (vpx, vpy) {
    const ctx = this.ctx;
    // orbe central de energia (la IA)
    const R = 46 + Math.sin(this.t * 2.4) * 5;
    const g = ctx.createRadialGradient(vpx, vpy - 26, 4, vpx, vpy - 26, R + 26);
    g.addColorStop(0, '#e8ddff');
    g.addColorStop(0.4, '#b48cff');
    g.addColorStop(1, '#b48cff00');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(vpx, vpy - 26, R + 26, 0, Math.PI * 2); ctx.fill();
    // anillos orbitando
    ctx.strokeStyle = '#b48cffaa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(vpx, vpy - 26, R + 34, (R + 34) * 0.32, this.t * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    // consolas laterales
    this.panel3d(vpx - 340, vpx - 180, vpy + 16, 200, 116, '#b48cff');
    this.panel3d(vpx + 340, vpx + 180, vpy + 16, 200, 116, '#b48cff');
    ctx.textAlign = 'left';
    ctx.font = '12px monospace';
    ['> atender cotizacion', '  buscando en RAG...', '  respuesta enviada'].forEach((l, i) => {
      ctx.fillStyle = i === 0 ? '#5fd87a' : '#c8dcec';
      ctx.fillText(l, vpx - 330, vpy - 16 + i * 22);
    });
    ['[Alpha]  activo', '[Beta]   activo', '[Gamma]  procesando'].forEach((l, i) => {
      ctx.fillStyle = '#c8dcec';
      ctx.fillText(l, vpx + 210, vpy - 16 + i * 22);
    });
  },

  zonaCiudad: function (vpx, vpy, VY, VH) {
    const ctx = this.ctx;
    // skyline al horizonte
    ctx.fillStyle = '#141021';
    for (let i = 0; i < 12; i++) {
      const w = 34 + (i * 23) % 40;
      const h = 46 + (i * 61) % 110;
      const x = vpx - 380 + i * 64;
      ctx.fillRect(x, vpy - h, w, h);
      // ventanas encendidas
      ctx.fillStyle = '#ffd27d';
      for (let v = 0; v < 4; v++) {
        if ((i * 7 + v * 13 + Math.floor(this.t)) % 3 === 0) {
          ctx.fillRect(x + 6 + (v % 2) * 14, vpy - h + 10 + Math.floor(v / 2) * 22, 6, 8);
        }
      }
      ctx.fillStyle = '#141021';
    }
    // rios de datos: curvas de luz cruzando la ciudad
    for (let r = 0; r < 3; r++) {
      ctx.strokeStyle = 'rgba(77,216,255,' + (0.5 - r * 0.12) + ')';
      ctx.lineWidth = 3 - r * 0.7;
      ctx.beginPath();
      for (let x = -420; x <= 420; x += 24) {
        const y = vpy - 60 - r * 26 + Math.sin(x * 0.011 + this.t * (1.1 + r * 0.3)) * 22;
        if (x === -420) ctx.moveTo(vpx + x, y); else ctx.lineTo(vpx + x, y);
      }
      ctx.stroke();
    }
    // barras de crecimiento en el piso, como la linea de tiempo real
    [[-120, 46, '#3a5a74'], [0, 84, '#1990b8'], [120, 128, '#2ec98a']].forEach(([dx, h, col]) => {
      const x = vpx + dx;
      this.caja(x - 22, vpy + 88 - h, 44, h, 5, col);
    });
    ctx.textAlign = 'center';
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = '#ffd27d';
    ctx.fillText('HOY -> CON DATOS -> EVOLUCIONADA', vpx, vpy + 116);
  }
});
