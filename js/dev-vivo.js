/*
 * dev-vivo.js — dev-vivo: la pantalla gigante de la oficina Plataformas Web.
 * Split de desarrollo en vivo: a la izquierda un editor teclea el código
 * real del proyecto; a la derecha el producto se construye etapa por etapa,
 * en sincronía, desde el lienzo vacío hasta quedar EN PRODUCCION.
 * Los botones 3D emiten 'proyecto' con web | tienda | vr para cambiar
 * de proyecto (el ciclo arranca de cero). Ciclo: ~36s de build + 9s de
 * resultado terminado, y repite.
 */
AFRAME.registerComponent('dev-vivo', {
  schema: { proyecto: { default: 'web' } },

  init: function () {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 640;
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.t = 0;
    this.inicio = 0;
    this.proyecto = this.data.proyecto;

    // colores de sintaxis
    const TAG = '#4dd8ff', STR = '#ffd27d', KW = '#b48cff', FN = '#5fd87a',
          TXT = '#c8dcec', COM = '#8aa4b8';

    this.PROYECTOS = {
      web: {
        titulo: 'PLATAFORMA WEB PRO', color: TAG, archivo: 'app.tsx',
        cierre: 'De un archivo vacio a tu plataforma en produccion',
        codigo: [
          [COM, '// plataforma web - tuempresa.com'],
          [TAG, '<nav class="barra-superior">'],
          [TXT, '  <img src="logo.svg"/> TuEmpresa'],
          [TXT, '  Inicio | Reportes | Equipo'],
          [TAG, '</nav>'],
          [TAG, '<aside class="menu-lateral">'],
          [TXT, '  Ventas - Inventario - Clientes'],
          [TAG, '</aside>'],
          [TAG, '<section class="kpis">'],
          [FN, '  <Kpi titulo="Ventas" valor="$138M"/>'],
          [FN, '  <Kpi titulo="Clientes" valor="+1.240"/>'],
          [FN, '  <Kpi titulo="Uptime" valor="99.9%"/>'],
          [TAG, '</section>'],
          [FN, '<Grafico tipo="linea" fuente={api.ventas}/>'],
          [FN, '<Grafico tipo="dona" fuente={api.canales}/>'],
          [KW, 'const datos = await fetch("/api/ventas")'],
          [FN, 'renderizar(datos, { enVivo: true })'],
          [COM, '// pruebas automaticas: 24/24 pasaron'],
          [FN, 'desplegar("produccion")'],
          [STR, '>> en linea: https://app.tuempresa.com']
        ]
      },
      tienda: {
        titulo: 'E-COMMERCE', color: FN, archivo: 'tienda.tsx',
        cierre: 'Tu tienda lista para vender desde el primer dia',
        codigo: [
          [COM, '// tienda en linea - tutienda.com'],
          [TAG, '<header class="tienda">'],
          [TXT, '  <Logo/> <Buscador/> <Carrito/>'],
          [TAG, '</header>'],
          [TAG, '<main class="catalogo">'],
          [KW, '  {productos.map((p) =>'],
          [FN, '    <Producto foto={p.foto}'],
          [FN, '      precio={p.precio}'],
          [FN, '      stock={p.stock}/>)}'],
          [TAG, '</main>'],
          [FN, '<BotonComprar al={agregarAlCarrito}/>'],
          [KW, 'const pago = pasarela.segura({'],
          [TXT, '  tarjetas: true, pse: true })'],
          [FN, 'facturar.automatico(pedido)'],
          [FN, 'inventario.descontar(pedido)'],
          [COM, '// venta de prueba...'],
          [STR, '>> PAGO APROBADO - pedido #0001'],
          [FN, 'desplegar("produccion")'],
          [STR, '>> en linea: https://tutienda.com']
        ]
      },
      vr: {
        titulo: 'ENTORNO INMERSIVO', color: KW, archivo: 'mundo.html',
        cierre: 'Un mundo virtual propio, directo en el navegador',
        codigo: [
          [COM, '<!-- entorno VR - WebXR -->'],
          [TAG, '<a-scene>'],
          [FN, '  <a-sky src="oficina-360.jpg"/>'],
          [FN, '  <a-plane piso-grid ancho="20"/>'],
          [TAG, '  <a-entity tablero-ventas'],
          [TXT, '    posicion="-3 2 -4"/>'],
          [TAG, '  <a-entity tablero-clientes'],
          [TXT, '    posicion="3 2 -4"/>'],
          [FN, '  <robot-guia nombre="DATO"'],
          [STR, '    saludo="Hola! Soy tu guia."/>'],
          [FN, '  <portal destino="oficina-bi"/>'],
          [FN, '  <cursor mirada fuse="1.5s"/>'],
          [TAG, '</a-scene>'],
          [COM, '<!-- probado en Quest 3: 72 fps -->'],
          [FN, 'publicar("recorrido-vr")'],
          [STR, '>> listo: entra con tus gafas']
        ]
      }
    };

    this.el.addEventListener('proyecto', (e) => {
      if (!this.PROYECTOS[e.detail.dato]) return;
      this.proyecto = e.detail.dato;
      this.inicio = this.t;               // el build arranca de cero
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

    // ponytail: 10 fps, amable con el Quest; y sin visitante cerca no redibuja
    this.posMundo = new THREE.Vector3();
    this.intervalo = setInterval(() => {
      this.t += 0.1;
      const rig = document.querySelector('#rig');
      if (rig) {
        this.el.object3D.getWorldPosition(this.posMundo);
        if (rig.object3D.position.distanceTo(this.posMundo) > 30) return;
      }
      this.dibujar();
      if (!this.textura) aplicarTextura();
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
    const P = this.PROYECTOS[this.proyecto];
    const DUR = 45, BUILD = 36;
    const fase = (this.t - this.inicio) % DUR;
    const p = Math.min(1, fase / BUILD);

    ctx.fillStyle = '#0a1420';
    ctx.fillRect(0, 0, 1024, 640);

    // cabecera
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = P.color;
    ctx.fillText('DESARROLLO EN VIVO: ' + P.titulo, 512, 44);
    ctx.font = '19px monospace';
    ctx.fillStyle = '#8aa4b8';
    ctx.fillText('a la izquierda el codigo, a la derecha tu proyecto tomando forma', 512, 76);

    this.editor(P, p);
    this.preview(P, p);

    // pie
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText(P.cierre, 512, 616);
  },

  // ---------- editor: el código se teclea en vivo ----------

  editor: function (P, p) {
    const ctx = this.ctx;
    const X = 40, Y = 96, W = 460, H = 480;
    this.caja(X, Y, W, H, 12, '#0c1420', '#28506e', 1.5);
    // pestaña del archivo
    this.caja(X + 14, Y + 10, 150, 30, 8, '#16324a');
    ctx.fillStyle = '#5fd87a';
    ctx.beginPath(); ctx.arc(X + 34, Y + 25, 4, 0, Math.PI * 2); ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = '15px monospace';
    ctx.fillStyle = '#c8dcec';
    ctx.fillText(P.archivo, X + 48, Y + 30);

    // cuántos caracteres van escritos
    const total = P.codigo.reduce((s, l) => s + l[1].length + 1, 0);
    const escritos = Math.floor(p * total);

    // líneas visibles (scroll automático)
    const lineas = [];
    let usados = 0;
    for (let i = 0; i < P.codigo.length; i++) {
      const [color, texto] = P.codigo[i];
      if (usados + texto.length + 1 <= escritos) {
        lineas.push([i, color, texto, true]);
        usados += texto.length + 1;
      } else {
        const parcial = Math.max(0, escritos - usados);
        if (parcial > 0) lineas.push([i, color, texto.slice(0, parcial), false]);
        break;
      }
    }
    const MAX = 16;
    const visibles = lineas.slice(-MAX);
    ctx.font = '16px monospace';
    visibles.forEach(([num, color, texto, completa], fila) => {
      const y = Y + 74 + fila * 25;
      ctx.fillStyle = '#3a5a74';
      ctx.textAlign = 'right';
      ctx.fillText(String(num + 1), X + 40, y);
      ctx.textAlign = 'left';
      ctx.fillStyle = color;
      ctx.fillText(texto, X + 56, y);
      // cursor parpadeando en la última línea
      if (fila === visibles.length - 1 && !completa && Math.floor(this.t * 4) % 2 === 0) {
        ctx.fillStyle = '#e8f0f6';
        ctx.fillRect(X + 58 + texto.length * 9.6, y - 14, 9, 18);
      }
    });

    // barra de estado del editor
    this.caja(X, Y + H - 34, W, 34, { lowerLeft: 12, lowerRight: 12 }, '#16324a');
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = p >= 1 ? '#5fd87a' : '#8aa4b8';
    ctx.textAlign = 'left';
    ctx.fillText(p >= 1 ? 'listo - sin errores' : 'escribiendo codigo...', X + 16, Y + H - 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = P.color;
    ctx.fillText(Math.floor(p * 100) + '%', X + W - 16, Y + H - 12);
    // barra de progreso
    ctx.fillStyle = '#1e3d52';
    ctx.fillRect(X + 170, Y + H - 22, 180, 8);
    ctx.fillStyle = P.color;
    ctx.fillRect(X + 170, Y + H - 22, 180 * p, 8);
  },

  // ---------- preview: el producto se construye etapa por etapa ----------

  preview: function (P, p) {
    const ctx = this.ctx;
    const X = 524, Y = 96, W = 460, H = 480;
    this.caja(X, Y, W, H, 12, '#0f2233', '#28506e', 1.5);
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(X, Y, W, H, 12); else ctx.rect(X, Y, W, H);
    ctx.clip();

    if (this.proyecto === 'web') this.previewWeb(X, Y, W, H, p);
    else if (this.proyecto === 'tienda') this.previewTienda(X, Y, W, H, p);
    else this.previewVR(X, Y, W, H, p);

    // sello final
    if (p >= 1) {
      this.caja(X + W / 2 - 150, Y + H - 56, 300, 40, 10, 'rgba(95,216,122,0.16)', '#5fd87a', 2);
      ctx.textAlign = 'center';
      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#5fd87a';
      ctx.fillText(this.proyecto === 'vr' ? 'LISTO - ENTRA CON TUS GAFAS' : 'EN PRODUCCION', 512 + 250 - 238, Y + H - 30);
    }
    ctx.restore();
  },

  previewWeb: function (X, Y, W, H, p) {
    const ctx = this.ctx;
    // barra del navegador
    if (p > 0.03) {
      this.caja(X + 12, Y + 12, W - 24, 30, 8, '#0a1420');
      ctx.font = '13px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.textAlign = 'left';
      ctx.fillText(p >= 1 ? 'https://app.tuempresa.com' : 'localhost:3000 (vista previa)', X + 26, Y + 31);
    }
    // nav superior
    if (p > 0.1) {
      this.caja(X + 12, Y + 50, W - 24, 36, 6, '#16324a');
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#4dd8ff';
      ctx.fillText('TuEmpresa', X + 26, Y + 74);
      if (p > 0.17) {
        ctx.font = '13px monospace';
        ctx.fillStyle = '#8aa4b8';
        ctx.fillText('Inicio   Reportes   Equipo', X + 150, Y + 74);
      }
    }
    // menu lateral
    if (p > 0.26) {
      this.caja(X + 12, Y + 94, 108, H - 160, 6, '#0c1b2b');
      ['Ventas', 'Inventario', 'Clientes'].forEach((s, i) => {
        ctx.font = (i === 0 ? 'bold ' : '') + '13px monospace';
        ctx.fillStyle = i === 0 ? '#4dd8ff' : '#8aa4b8';
        ctx.fillText(s, X + 26, Y + 126 + i * 30);
      });
    }
    // KPIs entrando de a uno
    const KPIS = [['$138M', 'ventas'], ['+1.240', 'clientes'], ['99.9%', 'uptime']];
    KPIS.forEach(([v, l], i) => {
      if (p > 0.36 + i * 0.08) {
        const bx = X + 132 + i * 108;
        this.caja(bx, Y + 96, 100, 58, 8, '#13293d', '#4dd8ff44', 1.5);
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = '#4dd8ff';
        // en vivo, los números laten
        const vivo = p >= 1 && i === 0 ? '$' + (138 + Math.floor(this.t) % 5) + 'M' : v;
        ctx.fillText(vivo, bx + 50, Y + 124);
        ctx.font = '12px monospace';
        ctx.fillStyle = '#8aa4b8';
        ctx.fillText(l, bx + 50, Y + 144);
      }
    });
    // gráfico de línea dibujándose
    if (p > 0.62) {
      const gx = X + 132, gy = Y + 168, gw = 324, gh = 150;
      this.caja(gx, gy, gw, gh, 8, '#0c1b2b', '#1e3d52', 1);
      const frac = Math.min(1, (p - 0.62) / 0.22);
      const n = Math.max(2, Math.floor(frac * 14));
      ctx.strokeStyle = '#4dd8ff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = gx + 14 + i * (gw - 28) / 13;
        const y = gy + gh - 20 - Math.abs(Math.sin(i * 0.8 + (p >= 1 ? this.t : 2))) * (gh - 52);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // dona
    if (p > 0.86) {
      const cx = X + 200, cy = Y + 384;
      const frac = Math.min(1, (p - 0.86) / 0.12);
      ctx.lineWidth = 16;
      ctx.strokeStyle = '#1e3d52';
      ctx.beginPath(); ctx.arc(cx, cy, 38, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = '#5fd87a';
      ctx.beginPath(); ctx.arc(cx, cy, 38, -Math.PI / 2, -Math.PI / 2 + frac * 0.62 * Math.PI * 2); ctx.stroke();
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#e8f0f6';
      ctx.textAlign = 'center';
      ctx.fillText('62%', cx, cy + 5);
      ctx.font = '12px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText('canal digital', cx + 130, cy + 5);
    }
  },

  previewTienda: function (X, Y, W, H, p) {
    const ctx = this.ctx;
    if (p > 0.06) {
      this.caja(X + 12, Y + 12, W - 24, 38, 8, '#16324a');
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#5fd87a';
      ctx.textAlign = 'left';
      ctx.fillText('tutienda.com', X + 26, Y + 37);
      if (p > 0.14) {
        this.caja(X + 160, Y + 19, 180, 24, 12, '#0a1420');
        ctx.font = '12px monospace';
        ctx.fillStyle = '#8aa4b8';
        ctx.fillText('buscar productos...', X + 172, Y + 36);
      }
      if (p > 0.2) {
        ctx.strokeStyle = '#c8dcec'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        const cx = X + W - 44, cy = Y + 26;
        ctx.beginPath();
        ctx.moveTo(cx - 9, cy - 4); ctx.lineTo(cx - 4, cy - 4);
        ctx.lineTo(cx, cy + 6); ctx.lineTo(cx + 10, cy + 6); ctx.lineTo(cx + 13, cy - 2);
        ctx.stroke();
      }
    }
    // productos apareciendo
    const PROD = [['Silla', '$420.000', '#4dd8ff', 0], ['Audifonos', '$310.000', '#b48cff', 1], ['Teclado', '$260.000', '#ffd27d', 2]];
    PROD.forEach(([nom, precio, col, i]) => {
      if (p > 0.3 + i * 0.1) {
        const bx = X + 20 + i * 146, by = Y + 66;
        this.caja(bx, by, 134, 176, 10, '#13293d', '#28506e', 1.5);
        this.caja(bx + 10, by + 10, 114, 78, 6, '#0c1b2b');
        // icono simple
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round';
        const ix = bx + 67, iy = by + 48;
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(ix - 12, iy - 18); ctx.lineTo(ix - 12, iy + 4); ctx.lineTo(ix + 12, iy + 4);
          ctx.moveTo(ix - 12, iy + 4); ctx.lineTo(ix - 12, iy + 20);
          ctx.moveTo(ix + 9, iy + 4); ctx.lineTo(ix + 9, iy + 20);
          ctx.stroke();
        } else if (i === 1) {
          ctx.beginPath(); ctx.arc(ix, iy, 14, Math.PI, 0); ctx.stroke();
          ctx.fillStyle = col;
          ctx.fillRect(ix - 19, iy - 2, 7, 14);
          ctx.fillRect(ix + 12, iy - 2, 7, 14);
        } else {
          ctx.strokeRect(ix - 18, iy - 8, 36, 20);
        }
        if (p > 0.55 + i * 0.04) {
          ctx.textAlign = 'center';
          ctx.font = '13px monospace';
          ctx.fillStyle = '#e8f0f6';
          ctx.fillText(nom, bx + 67, by + 110);
          ctx.font = 'bold 14px monospace';
          ctx.fillStyle = col;
          ctx.fillText(precio, bx + 67, by + 132);
        }
        if (p > 0.72) {
          this.caja(bx + 22, by + 144, 90, 22, 11, col + '22', col, 1.5);
          ctx.font = 'bold 11px monospace';
          ctx.fillStyle = col;
          ctx.fillText('COMPRAR', bx + 67, by + 159);
        }
      }
    });
    // checkout de prueba
    if (p > 0.86) {
      this.caja(X + 60, Y + 268, W - 120, 130, 12, '#0c1b2b', '#5fd87a', 2);
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#c8dcec';
      ctx.fillText('venta de prueba', X + W / 2, Y + 296);
      ctx.font = '13px monospace';
      ctx.fillStyle = '#8aa4b8';
      ctx.fillText('Silla ergonomica x1 ... $420.000', X + W / 2, Y + 322);
      const ok = p >= 0.96;
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = ok ? '#5fd87a' : '#ffd27d';
      ctx.fillText(ok ? 'PAGO APROBADO - factura enviada' :
                   'procesando pago' + '.'.repeat(1 + Math.floor(this.t * 3) % 3), X + W / 2, Y + 356);
    }
  },

  previewVR: function (X, Y, W, H, p) {
    const ctx = this.ctx;
    const vpx = X + W / 2 + (p >= 1 ? Math.sin(this.t * 0.7) * 16 : 0);
    const vpy = Y + 200;
    // cielo 360
    if (p > 0.08) {
      const g = ctx.createLinearGradient(0, Y, 0, Y + H);
      g.addColorStop(0, '#050d16');
      g.addColorStop(1, '#0d2236');
      ctx.fillStyle = g;
      ctx.fillRect(X, Y, W, H);
    }
    // piso en perspectiva (las líneas "se tienden" con el progreso)
    if (p > 0.24) {
      const frac = Math.min(1, (p - 0.24) / 0.2);
      ctx.strokeStyle = 'rgba(180,140,255,0.35)';
      ctx.lineWidth = 1.5;
      const rayos = Math.floor(frac * 13);
      for (let i = 0; i < rayos; i++) {
        const k = i - 6;
        ctx.beginPath();
        ctx.moveTo(vpx + k * 22, vpy);
        ctx.lineTo(vpx + k * 170, Y + H);
        ctx.stroke();
      }
      for (let n = 0, y = vpy + 6; y < Y + H && n < frac * 7; n++, y = vpy + 6 * Math.pow(1.7, n)) {
        ctx.beginPath(); ctx.moveTo(X, y); ctx.lineTo(X + W, y); ctx.stroke();
      }
    }
    // tableros laterales
    if (p > 0.5) {
      [[-1, '#4dd8ff'], [1, '#5fd87a']].forEach(([lado, col]) => {
        const xC = vpx + lado * 190, xL = vpx + lado * 105;
        ctx.fillStyle = 'rgba(15,34,51,0.95)';
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xC, vpy - 66); ctx.lineTo(xL, vpy - 40);
        ctx.lineTo(xL, vpy + 32); ctx.lineTo(xC, vpy + 58);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col;
        for (let i = 0; i < 3; i++) {
          const h = 12 + ((i * 29 + Math.floor(this.t * 3) * 7) % 26);
          ctx.fillRect(Math.min(xC, xL) + 22 + i * 20, vpy + 14 - h, 12, h);
        }
      });
    }
    // DATO, el robot guía (cápsula con ojos)
    if (p > 0.68) {
      const rx = vpx - 40, ry = vpy + 44;
      ctx.fillStyle = '#eef4f8';
      ctx.beginPath(); ctx.ellipse(rx, ry, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx, ry - 24, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#0a1420';
      ctx.beginPath(); ctx.ellipse(rx, ry - 24, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#5fd87a';
      ctx.beginPath(); ctx.arc(rx - 3, ry - 25, 1.8, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(rx + 3, ry - 25, 1.8, 0, Math.PI * 2); ctx.fill();
      if (p > 0.78) {
        this.caja(rx + 22, ry - 58, 132, 30, 8, 'rgba(19,52,69,0.95)', '#5fd87a', 1.5);
        ctx.textAlign = 'left';
        ctx.font = '12px monospace';
        ctx.fillStyle = '#e8f0f6';
        ctx.fillText('Hola! Soy tu guia.', rx + 32, ry - 38);
      }
    }
    // portal al fondo
    if (p > 0.84) {
      ctx.strokeStyle = '#b48cff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(vpx + 60, vpy - 6, 26, 44, 0, 0, Math.PI * 2); ctx.stroke();
      const g2 = ctx.createRadialGradient(vpx + 60, vpy - 6, 2, vpx + 60, vpy - 6, 26);
      g2.addColorStop(0, '#b48cff66');
      g2.addColorStop(1, '#b48cff00');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.ellipse(vpx + 60, vpy - 6, 26, 44, 0, 0, Math.PI * 2); ctx.fill();
    }
    // cursor de mirada cuando ya está vivo
    if (p >= 1) {
      ctx.strokeStyle = '#ffffffaa';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(X + W / 2, vpy + 4, 6 + Math.sin(this.t * 3) * 1.5, 0, Math.PI * 2); ctx.stroke();
    }
  }
});
