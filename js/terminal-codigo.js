/*
 * terminal-codigo — monitor con actividad escribiéndose "en vivo" (canvas -> textura).
 * Uso: <a-plane terminal-codigo="guion: desarrollo|agentes"></a-plane>
 * ponytail: si se necesita un MP4 para otro motor, se exporta grabando este canvas.
 */
(function () {
  const CIAN = '#4dd8ff', VERDE = '#7dffb0', GRIS = '#5a7a94', BLANCO = '#c8dcec', AMBAR = '#ffd27d';

  const GUIONES = {

    desarrollo: {
      titulo: '~/datalab-um — python',
      scripts: [
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
      ]
    },

    agentes: {
      titulo: '~/datalab-um — consola de agentes IA',
      scripts: [
        [
          { t: '# operación de agentes — turno en vivo', c: GRIS },
          { t: 'agente = AgenteVentas(modelo="claude", herramientas=[crm, correo])', c: BLANCO },
          { t: 'agente.activar(horario="24/7")', c: BLANCO, pausa: 800 },
          { t: '>>> [09:12] correo entrante: "necesito cotización urgente"', c: AMBAR, instantanea: true, pausa: 700 },
          { t: '>>> AgenteVentas: analizando intención... cotización', c: CIAN, instantanea: true, pausa: 600 },
          { t: '>>> AgenteVentas: consultando CRM... cliente frecuente ✓', c: CIAN, instantanea: true, pausa: 600 },
          { t: '>>> AgenteVentas: cotización generada y enviada (34s)', c: VERDE, instantanea: true, pausa: 900 },
          { t: '>>> [09:14] 3 tickets clasificados y asignados', c: VERDE, instantanea: true, pausa: 700 },
          { t: '✓ 127 tareas completadas hoy — 0 errores', c: VERDE, instantanea: true, pausa: 2600 }
        ],
        [
          { t: '# entrenamiento de agente de atención al cliente', c: GRIS },
          { t: 'base = conocimiento_empresa.cargar("políticas", "productos")', c: BLANCO },
          { t: 'agente = AgenteSoporte(personalidad="cálida y resolutiva")', c: BLANCO },
          { t: 'agente.entrenar(base)', c: BLANCO, pausa: 900 },
          { t: '>>> probando 50 conversaciones simuladas...', c: AMBAR, instantanea: true, pausa: 800 },
          { t: '>>> satisfacción estimada: 96%', c: VERDE, instantanea: true, pausa: 600 },
          { t: '>>> escalamiento a humano: solo casos complejos ✓', c: CIAN, instantanea: true, pausa: 700 },
          { t: '✓ agente listo para producción', c: VERDE, instantanea: true, pausa: 2600 }
        ],
        [
          { t: '# orden recibida: clasificar bandeja de correos', c: GRIS },
          { t: 'bandeja = correo.sin_leer()', c: BLANCO, pausa: 500 },
          { t: '>>> 48 mensajes sin leer encontrados', c: AMBAR, instantanea: true, pausa: 600 },
          { t: 'agente.clasificar(bandeja, por=["intención", "urgencia"])', c: BLANCO, pausa: 800 },
          { t: '>>> 12 ventas | 9 soporte | 5 urgentes | 22 informativos', c: CIAN, instantanea: true, pausa: 700 },
          { t: '>>> urgentes asignados al equipo humano ✓', c: VERDE, instantanea: true, pausa: 600 },
          { t: '✓ bandeja organizada en 41 segundos', c: VERDE, instantanea: true, pausa: 2600 }
        ]
      ]
    }
  };

  const ANCHO = 1024, ALTO = 640, LINEA_ALTO = 34, MARGEN = 28, BARRA = 46;
  const MAX_LINEAS = Math.floor((ALTO - BARRA - MARGEN) / LINEA_ALTO);

  AFRAME.registerComponent('terminal-codigo', {
    schema: { guion: { default: 'desarrollo' } },

    init: function () {
      this.set = GUIONES[this.data.guion] || GUIONES.desarrollo;

      this.canvas = document.createElement('canvas');
      this.canvas.width = ANCHO;
      this.canvas.height = ALTO;
      this.ctx = this.canvas.getContext('2d');

      this.guion = 0;
      this.linea = 0;
      this.col = 0;
      this.hechas = [];
      this.esperaHasta = 0;

      this.el.addEventListener('loaded', () => {
        const mesh = this.el.getObject3D('mesh');
        this.textura = new THREE.CanvasTexture(this.canvas);
        this.textura.anisotropy = 8;
        mesh.material.map = this.textura;
        mesh.material.needsUpdate = true;
      });

      this.intervalo = setInterval(() => this.paso(), 50); // 20 fps

      // los botones 3D pueden ordenar un guion concreto emitiendo 'ejecutar'
      this.el.addEventListener('ejecutar', (e) => {
        const i = parseInt(e.detail.dato, 10) || 0;
        this.guion = i % this.set.scripts.length;
        this.linea = 0;
        this.col = 0;
        this.hechas = [];
        this.esperaHasta = performance.now() + 400;
      });
    },

    remove: function () { clearInterval(this.intervalo); },

    paso: function () {
      const ahora = performance.now();
      if (ahora >= this.esperaHasta) this.avanzar(ahora);
      this.dibujar(ahora);
      if (this.textura) this.textura.needsUpdate = true;
    },

    avanzar: function (ahora) {
      const script = this.set.scripts[this.guion];
      const linea = script[this.linea];

      if (linea.instantanea) this.col = linea.t.length;
      else this.col += 1 + Math.floor(Math.random() * 2); // ritmo humano

      if (this.col >= linea.t.length) {
        this.hechas.push(linea);
        if (this.hechas.length > MAX_LINEAS - 1) this.hechas.shift(); // scroll
        this.esperaHasta = ahora + 120 + (linea.pausa || 0);
        this.col = 0;
        this.linea++;
        if (this.linea >= script.length) {
          this.linea = 0;
          this.guion = (this.guion + 1) % this.set.scripts.length;
          this.hechas = [];
          this.esperaHasta = ahora + 800;
        }
      }
    },

    dibujar: function (ahora) {
      const c = this.ctx;
      c.fillStyle = '#08111c';
      c.fillRect(0, 0, ANCHO, ALTO);
      c.fillStyle = '#133445';
      c.fillRect(0, 0, ANCHO, BARRA);
      ['#ff6b6b', '#ffd27d', '#7dffb0'].forEach((color, i) => {
        c.fillStyle = color;
        c.beginPath();
        c.arc(30 + i * 34, BARRA / 2, 8, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = '#5a7a94';
      c.font = '22px monospace';
      c.fillText(this.set.titulo, 130, BARRA / 2 + 8);

      c.font = '24px monospace';
      let y = BARRA + MARGEN + 10;
      this.hechas.forEach((l) => {
        c.fillStyle = l.c;
        c.fillText(l.t, MARGEN, y);
        y += LINEA_ALTO;
      });

      const script = this.set.scripts[this.guion];
      const linea = script[this.linea];
      if (linea) {
        c.fillStyle = linea.c;
        const parcial = linea.t.slice(0, this.col);
        c.fillText(parcial, MARGEN, y);
        if (Math.floor(ahora / 450) % 2 === 0) {
          c.fillStyle = '#5fd87a';
          c.fillRect(MARGEN + c.measureText(parcial).width + 4, y - 20, 13, 26);
        }
      }
    }
  });
})();
