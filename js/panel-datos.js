/*
 * panel-datos: dibuja un dashboard falso "en vivo" sobre un canvas
 * y lo usa como textura del plano. Esta es la técnica base de todos
 * los paneles del centro analítico (días 4-6 se cambia canvas 2D por ECharts).
 */
AFRAME.registerComponent('panel-datos', {
  init: function () {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 576;
    this.ctx = this.canvas.getContext('2d');

    // serie simulada: camina con ruido, siempre "viva"
    this.serie = Array.from({ length: 40 }, () => 50 + Math.random() * 20);
    this.kpi = 1280;

    this.el.addEventListener('loaded', () => {
      const mesh = this.el.getObject3D('mesh');
      this.textura = new THREE.CanvasTexture(this.canvas);
      mesh.material.map = this.textura;
      mesh.material.needsUpdate = true;
    });

    // ponytail: 10 fps de refresco basta para gráficos y cuida el rendimiento en Quest
    this.intervalo = setInterval(() => this.dibujar(), 100);
  },

  remove: function () { clearInterval(this.intervalo); },

  dibujar: function () {
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;

    // avanza la serie
    const ultimo = this.serie[this.serie.length - 1];
    this.serie.push(Math.max(10, Math.min(95, ultimo + (Math.random() - 0.48) * 8)));
    this.serie.shift();
    this.kpi += Math.floor(Math.random() * 5);

    // fondo
    c.fillStyle = '#0a1420';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#1e3a52';
    c.strokeRect(4, 4, W - 8, H - 8);

    // título y KPI
    c.fillStyle = '#4dd8ff';
    c.font = 'bold 42px monospace';
    c.fillText('VENTAS EN TIEMPO REAL', 40, 70);
    c.fillStyle = '#7dffb0';
    c.font = 'bold 72px monospace';
    c.fillText('$' + this.kpi.toLocaleString('es-CO'), 40, 170);

    // línea de la serie
    const x0 = 40, y0 = 520, ancho = W - 80, alto = 280;
    c.strokeStyle = '#4dd8ff';
    c.lineWidth = 4;
    c.beginPath();
    this.serie.forEach((v, i) => {
      const x = x0 + (i / (this.serie.length - 1)) * ancho;
      const y = y0 - (v / 100) * alto;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    });
    c.stroke();

    // relleno bajo la línea
    c.lineTo(x0 + ancho, y0);
    c.lineTo(x0, y0);
    c.closePath();
    c.fillStyle = 'rgba(77, 216, 255, 0.12)';
    c.fill();

    if (this.textura) this.textura.needsUpdate = true;
  }
});
