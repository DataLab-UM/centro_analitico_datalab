/*
 * terminal-codigo — monitor con código escribiéndose "en vivo" (canvas -> textura).
 * Mismo patrón que panel-echarts; texto nítido en VR, loop infinito, cero assets.
 * ponytail: si se necesita un MP4 para otro motor, se exporta grabando este canvas.
 */
(function () {
  // guiones: cada línea con su color; 'pausa' = ms extra al terminar la línea
  const CIAN = '#4dd8ff', VERDE = '#7dffb0', GRIS = '#5a7a94', BLANCO = '#c8dcec', AMBAR = '#ffd27d';

  const GUIONES = [
    [
      { t: '# pipeline de ventas — entrenamiento del modelo', c: GRIS },
      { t: 'import pandas as pd', c: CIAN },
      { t: 'from sklearn.ensemble import RandomForestRegressor', c: CIAN },
      { t: '', c: BLANCO },
      { t: 'datos = pd.read_sql("SELECT * FROM ventas", conexion)', c: BLANCO },
      { t: 'datos["mes"] = datos.fecha.dt.month', c: BLANCO },
      { t: 'X, y = preparar_variables(datos)', c: BLANCO },
      { t: '', c: BLANCO },
      { t: 'modelo = RandomForestRegressor(n_estimators=300)', c: BLANCO },
      { t: 'modelo.fit(X_train, y_train)', c: BLANCO, pausa: 900 },
      { t: '>>> entrenando....................... ok (12.4s)', c: AMBAR, instantanea: true, pausa: 600 },
      { t: 'print(f"Precisión: {modelo.score(X_test, y_test):.2%}")', c: BLANCO, pausa: 700 },
      { t: '>>> Precisión: 94.31%', c: VERDE, instantanea: true, pausa: 800 },
      { t: '✓ modelo desplegado a producción', c: VERDE, instantanea: true, pausa: 2600 }
    ],
    [
      { t: '# API del dashboard — métricas en tiempo real', c: GRIS },
      { t: 'from fastapi import FastAPI', c: CIAN },
      { t: 'app = FastAPI(title="Centro Analítico")', c: BLANCO },
      { t: '', c: BLANCO },
      { t: '@app.get("/kpi/ventas")', c: AMBAR },
      { t: 'def ventas_en_vivo():', c: BLANCO },
      { t: '    df = ultimas_transacciones(minutos=5)', c: BLANCO },
      { t: '    return {', c: BLANCO },
      { t: '        "total": df.monto.sum(),', c: BLANCO },
      { t: '        "clientes": df.cliente_id.nunique(),', c: BLANCO },
      { t: '        "tendencia": calcular_tendencia(df)', c: BLANCO },
      { t: '    }', c: BLANCO, pausa: 900 },
      { t: '>>> uvicorn corriendo en :8080', c: AMBAR, instantanea: true, pausa: 500 },
      { t: '>>> 200 GET /kpi/ventas  4ms', c: VERDE, instantanea: true, pausa: 400 },
      { t: '>>> 200 GET /kpi/ventas  3ms', c: VERDE, instantanea: true, pausa: 2600 }
    ]
  ];

  const ANCHO = 1024, ALTO = 640, LINEA_ALTO = 34, MARGEN = 28, BARRA = 46;
  const MAX_LINEAS = Math.floor((ALTO - BARRA - MARGEN) / LINEA_ALTO);

  AFRAME.registerComponent('terminal-codigo', {
    init: function () {
      this.canvas = document.createElement('canvas');
      this.canvas.width = ANCHO;
      this.canvas.height = ALTO;
      this.ctx = this.canvas.getContext('2d');

      this.guion = 0;       // cuál script va
      this.linea = 0;       // línea actual dentro del script
      this.col = 0;         // caracteres ya escritos de la línea actual
      this.hechas = [];     // líneas completadas visibles
      this.esperaHasta = 0; // timestamp de fin de pausa

      this.el.addEventListener('loaded', () => {
        const mesh = this.el.getObject3D('mesh');
        this.textura = new THREE.CanvasTexture(this.canvas);
        this.textura.anisotropy = 8;
        mesh.material.map = this.textura;
        mesh.material.needsUpdate = true;
      });

      this.intervalo = setInterval(() => this.paso(), 50); // 20 fps
    },

    remove: function () { clearInterval(this.intervalo); },

    paso: function () {
      const ahora = performance.now();
      if (ahora >= this.esperaHasta) this.avanzar(ahora);
      this.dibujar(ahora);
      if (this.textura) this.textura.needsUpdate = true;
    },

    avanzar: function (ahora) {
      const script = GUIONES[this.guion];
      const linea = script[this.linea];

      if (linea.instantanea) this.col = linea.t.length;
      else this.col += 1 + Math.floor(Math.random() * 2); // 20-60 chars/s, ritmo humano

      if (this.col >= linea.t.length) {
        this.hechas.push(linea);
        if (this.hechas.length > MAX_LINEAS - 1) this.hechas.shift(); // scroll
        this.esperaHasta = ahora + 120 + (linea.pausa || 0);
        this.col = 0;
        this.linea++;
        if (this.linea >= script.length) {      // fin del script: siguiente y limpiar
          this.linea = 0;
          this.guion = (this.guion + 1) % GUIONES.length;
          this.hechas = [];
          this.esperaHasta = ahora + 800;
        }
      }
    },

    dibujar: function (ahora) {
      const c = this.ctx;
      // fondo + barra de título estilo editor
      c.fillStyle = '#08111c';
      c.fillRect(0, 0, ANCHO, ALTO);
      c.fillStyle = '#0e1e30';
      c.fillRect(0, 0, ANCHO, BARRA);
      ['#ff6b6b', '#ffd27d', '#7dffb0'].forEach((color, i) => {
        c.fillStyle = color;
        c.beginPath();
        c.arc(30 + i * 34, BARRA / 2, 8, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = '#5a7a94';
      c.font = '22px monospace';
      c.fillText('~/centro-analitico — python', 130, BARRA / 2 + 8);

      // líneas completadas
      c.font = '24px monospace';
      let y = BARRA + MARGEN + 10;
      this.hechas.forEach((l) => {
        c.fillStyle = l.c;
        c.fillText(l.t, MARGEN, y);
        y += LINEA_ALTO;
      });

      // línea en curso + cursor parpadeante
      const script = GUIONES[this.guion];
      const linea = script[this.linea];
      if (linea) {
        c.fillStyle = linea.c;
        const parcial = linea.t.slice(0, this.col);
        c.fillText(parcial, MARGEN, y);
        if (Math.floor(ahora / 450) % 2 === 0) {
          c.fillStyle = '#4dd8ff';
          c.fillRect(MARGEN + c.measureText(parcial).width + 4, y - 20, 13, 26);
        }
      }
    }
  });
})();
