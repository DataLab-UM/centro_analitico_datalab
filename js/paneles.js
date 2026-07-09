/*
 * paneles.js — componente panel-echarts: un gráfico ECharts vivo como textura 3D.
 * Uso: <a-plane panel-echarts="tipo: ventas"></a-plane>
 * Tipos BI:       ventas | calor | kpi | prediccion | embudo | canales
 * Tipos agentes:  acciones | horas | estado-agentes | calidad
 * Tipos panorama: impacto-ia | adopcion | retorno
 */
(function () {
  const FUENTE = 'monospace';
  const AZUL = '#4dd8ff', MARCA = '#5fd87a', VERDE = '#7dffb0', FONDO = '#0a1420';
  const EJE = { axisLabel: { color: '#3a6a8a', fontSize: 20, fontFamily: FUENTE },
                splitLine: { lineStyle: { color: '#122436' } } };

  function titulo(texto, sub) {
    return {
      text: texto, subtext: sub || '',
      left: 24, top: 14,
      textStyle: { color: MARCA, fontSize: 32, fontFamily: FUENTE },
      subtextStyle: { color: VERDE, fontSize: 46, fontWeight: 'bold', fontFamily: FUENTE }
    };
  }

  // Cada tipo define: crear(chart) -> estado, y actualizar(chart, estado); intervalo en ms
  const TIPOS = {

    ventas: {
      intervalo: 300,
      // rangos filtrables desde los botones 3D bajo el tablero; cada uno con
      // su propia forma de curva para que el cambio se VEA al filtrar
      RANGOS: {
        hoy:    { etiqueta: 'hoy',         escala: 1,   min: 15, max: 95, paso: 10 },
        semana: { etiqueta: 'esta semana', escala: 6.4, min: 40, max: 75, paso: 3 },
        mes:    { etiqueta: 'este mes',    escala: 27,  min: 10, max: 95, paso: 4, tendencia: true }
      },
      generar: function (estado) {
        const r = this.RANGOS[estado.rango];
        if (r.tendencia) {
          // mes: curva claramente ascendente (mensaje: el negocio crece)
          return Array.from({ length: 40 }, (_, i) =>
            Math.min(95, 15 + i * 1.6 + Math.random() * 12));
        }
        return Datos.serie(40, r.min, r.max);
      },
      crear: function (chart) {
        const estado = { serie: Datos.serie(40, 20, 90), kpi: 128400, rango: 'hoy' };
        chart.setOption({
          backgroundColor: FONDO, animation: false,
          title: titulo('VENTAS EN TIEMPO REAL', '$128.400 hoy'),
          grid: { left: 80, right: 40, top: 160, bottom: 50 },
          xAxis: { type: 'category', show: false,
                   data: estado.serie.map((_, i) => i) },
          yAxis: Object.assign({ type: 'value', min: 0, max: 100 }, EJE),
          series: [{ type: 'line', data: estado.serie, smooth: true, symbol: 'none',
                     lineStyle: { color: AZUL, width: 4 },
                     areaStyle: { color: 'rgba(77,216,255,0.15)' } }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        const r = this.RANGOS[estado.rango];
        Datos.avanzar(estado.serie, r.min, r.max, r.paso);
        estado.kpi += Math.floor(Math.random() * 900);
        chart.setOption({
          title: { subtext: '$' + Math.round(estado.kpi * r.escala).toLocaleString('es-CO') +
                            ' ' + r.etiqueta },
          series: [{ data: estado.serie }]
        });
      },
      filtrar: function (chart, estado, rango) {
        if (!this.RANGOS[rango]) return;
        estado.rango = rango;
        estado.serie = this.generar(estado); // curva nueva: el cambio se ve al instante
        this.actualizar(chart, estado);
      }
    },

    calor: {
      intervalo: 800,
      crear: function (chart) {
        const estado = { datos: Datos.matrizCalor() };
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('ACTIVIDAD DE CLIENTES'),
          grid: { left: 80, right: 40, top: 120, bottom: 60 },
          xAxis: { type: 'category', data: ['8h','9h','10h','11h','12h','13h','14h','15h','16h','17h','18h','19h'],
                   axisLabel: EJE.axisLabel },
          yAxis: { type: 'category', data: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
                   axisLabel: EJE.axisLabel },
          visualMap: { show: false, min: 0, max: 100,
                       inRange: { color: ['#0a1e30', '#0e5a7a', '#19b8d8', VERDE] } },
          series: [{ type: 'heatmap', data: estado.datos,
                     itemStyle: { borderColor: FONDO, borderWidth: 2 } }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        Datos.mutarCalor(estado.datos, 14);
        chart.setOption({ series: [{ data: estado.datos }] });
      }
    },

    kpi: {
      intervalo: 2500,
      crear: function (chart) {
        function medidor(centro, nombre, valor) {
          return {
            type: 'gauge', center: centro, radius: '58%',
            min: 0, max: 100, startAngle: 210, endAngle: -30,
            progress: { show: true, width: 16, itemStyle: { color: AZUL } },
            axisLine: { lineStyle: { width: 16, color: [[1, '#12283c']] } },
            axisTick: { show: false }, splitLine: { show: false },
            axisLabel: { show: false }, pointer: { show: false },
            title: { color: AZUL, fontSize: 24, fontFamily: FUENTE, offsetCenter: [0, '78%'] },
            detail: { color: VERDE, fontSize: 52, fontFamily: FUENTE,
                      fontWeight: 'bold', formatter: '{value}%', offsetCenter: [0, '5%'] },
            data: [{ value: valor, name: nombre }]
          };
        }
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('SALUD OPERATIVA'),
          series: [ medidor(['28%', '62%'], 'Eficiencia', 72),
                    medidor(['72%', '62%'], 'Disponibilidad', 94) ]
        });
        return {};
      },
      actualizar: function (chart) {
        chart.setOption({ series: [
          { data: [{ value: 60 + Math.round(Math.random() * 35), name: 'Eficiencia' }] },
          { data: [{ value: 88 + Math.round(Math.random() * 11), name: 'Disponibilidad' }] }
        ] });
      }
    },

    prediccion: {
      intervalo: 4000,
      // rangos filtrables desde los botones 3D de la oficina
      RANGOS: {
        semanas: { ejes: ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10'], escala: 1 },
        meses:   { ejes: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'], escala: 1.6 },
        anios:   { ejes: ['2022','2023','2024','2025','2026'], escala: 3.2 }
      },
      generar: function (estado) {
        const r = this.RANGOS[estado.rango];
        return Datos.proyeccion(r.ejes.length).map((v) => Math.round(v * r.escala));
      },
      crear: function (chart) {
        const estado = { rango: 'semanas' };
        const barras = this.generar(estado);
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('PREDICCIÓN DE CRECIMIENTO'),
          grid: { left: 80, right: 40, top: 120, bottom: 60 },
          xAxis: { type: 'category', axisLabel: EJE.axisLabel,
                   data: this.RANGOS[estado.rango].ejes },
          yAxis: Object.assign({ type: 'value' }, EJE),
          series: [
            { type: 'bar', data: barras, barWidth: '55%',
              itemStyle: { color: {
                type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [{ offset: 0, color: VERDE }, { offset: 1, color: '#0e5a7a' }]
              } } },
            { type: 'line', data: barras.map((v) => v + 8), smooth: true, symbol: 'none',
              lineStyle: { color: AZUL, width: 3, type: 'dashed' } }
          ]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        const barras = this.generar(estado);
        // la transición animada de ECharts hace crecer las barras: efecto "vivo"
        chart.setOption({ series: [{ data: barras },
                                   { data: barras.map((v) => v + 8) }] });
      },
      filtrar: function (chart, estado, rango) {
        if (!this.RANGOS[rango]) return;
        estado.rango = rango;
        const barras = this.generar(estado);
        chart.setOption({
          xAxis: { data: this.RANGOS[rango].ejes },
          series: [{ data: barras }, { data: barras.map((v) => v + 8) }]
        });
      }
    },

    embudo: {
      intervalo: 3200,
      ETAPAS: [
        ['Visitantes',   '#0e5a7a'],
        ['Interesados',  '#1990b8'],
        ['Cotizaciones', AZUL],
        ['Ventas',       MARCA]
      ],
      datos: function (base) {
        // valores con ruido pero siempre decrecientes (es un embudo)
        const vals = base.map((v) => Math.round(v * (0.88 + Math.random() * 0.24)));
        for (let i = 1; i < vals.length; i++) vals[i] = Math.min(vals[i], vals[i - 1] - 15);
        return vals.map((v, i) => ({
          value: Math.max(20, v), name: this.ETAPAS[i][0],
          itemStyle: { color: this.ETAPAS[i][1] }
        }));
      },
      crear: function (chart) {
        const estado = { base: [1000, 620, 340, 180] };
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('EMBUDO DE CONVERSION'),
          series: [{
            type: 'funnel', left: 100, right: 80, top: 130, bottom: 40,
            min: 0, max: 1000, gap: 8, minSize: '12%',
            label: { color: '#c8dcec', fontSize: 24, fontFamily: FUENTE,
                     formatter: '{b}  {c}' },
            labelLine: { lineStyle: { color: '#3a6a8a' } },
            itemStyle: { borderWidth: 0 },
            data: this.datos(estado.base)
          }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        chart.setOption({ series: [{ data: this.datos(estado.base) }] });
      }
    },

    canales: {
      intervalo: 2800,
      CANALES: [
        ['E-commerce',     AZUL],
        ['Tienda fisica',  MARCA],
        ['WhatsApp',       VERDE],
        ['Distribuidores', '#b48cff']
      ],
      datos: function (vals) {
        return vals.map((v, i) => ({
          value: v, name: this.CANALES[i][0],
          itemStyle: { color: this.CANALES[i][1] }
        }));
      },
      crear: function (chart) {
        const estado = { vals: [38, 27, 21, 14] };
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('VENTAS POR CANAL'),
          legend: { orient: 'vertical', right: 30, top: 'middle',
                    itemWidth: 22, itemHeight: 22,
                    textStyle: { color: '#c8dcec', fontSize: 24, fontFamily: FUENTE } },
          series: [{
            type: 'pie', radius: ['42%', '68%'], center: ['34%', '58%'],
            label: { show: false },
            itemStyle: { borderColor: FONDO, borderWidth: 4 },
            data: this.datos(estado.vals)
          }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        estado.vals = estado.vals.map((v) => Math.max(6, v + Math.round((Math.random() - 0.5) * 5)));
        chart.setOption({ series: [{ data: this.datos(estado.vals) }] });
      }
    },

    // -------- tableros de la oficina Agentes de IA --------

    acciones: {
      intervalo: 1800,
      AGENTES: [['Alpha', '#4dd8ff'], ['Beta', MARCA], ['Gamma', '#b48cff'], ['Delta', '#ffd27d']],
      RANGOS: {
        hoy:    { etiqueta: 'hoy',         base: [412, 807, 356, 198] },
        semana: { etiqueta: 'esta semana', base: [2650, 5180, 2280, 1240] },
        mes:    { etiqueta: 'este mes',    base: [11400, 22100, 9800, 5300] }
      },
      datos: function (estado) {
        const r = this.RANGOS[estado.rango];
        return r.base.map((v, i) => ({
          value: v + Math.floor(Math.random() * v * 0.06),
          itemStyle: { color: this.AGENTES[i][1] }
        }));
      },
      crear: function (chart) {
        const estado = { rango: 'hoy' };
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('ACCIONES DE LOS AGENTES', 'hoy'),
          grid: { left: 150, right: 60, top: 130, bottom: 40 },
          xAxis: Object.assign({ type: 'value' }, EJE),
          yAxis: { type: 'category', inverse: true,
                   data: this.AGENTES.map((a) => a[0]),
                   axisLabel: { color: '#c8dcec', fontSize: 24, fontFamily: FUENTE } },
          series: [{ type: 'bar', barWidth: '55%',
                     label: { show: true, position: 'right', color: '#c8dcec',
                              fontSize: 20, fontFamily: FUENTE },
                     data: this.datos(estado) }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        chart.setOption({ series: [{ data: this.datos(estado) }] });
      },
      filtrar: function (chart, estado, rango) {
        if (!this.RANGOS[rango]) return;
        estado.rango = rango;
        chart.setOption({ title: { subtext: this.RANGOS[rango].etiqueta } });
        this.actualizar(chart, estado);
      }
    },

    horas: {
      intervalo: 900,
      crear: function (chart) {
        // curva acumulada del mes: siempre sube (horas humanas recuperadas)
        const estado = { serie: Array.from({ length: 30 }, (_, i) => i * 9 + Math.random() * 8),
                         total: 312 };
        chart.setOption({
          backgroundColor: FONDO, animation: false,
          title: titulo('HORAS OPTIMIZADAS', '312 h este mes'),
          grid: { left: 90, right: 40, top: 160, bottom: 50 },
          xAxis: { type: 'category', show: false, data: estado.serie.map((_, i) => i) },
          yAxis: Object.assign({ type: 'value' }, EJE),
          series: [{ type: 'line', data: estado.serie, smooth: true, symbol: 'none',
                     lineStyle: { color: VERDE, width: 4 },
                     areaStyle: { color: 'rgba(125,255,176,0.16)' } }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        estado.total += Math.random() * 0.15;
        const ultimo = estado.serie[estado.serie.length - 1];
        estado.serie.push(ultimo + 6 + Math.random() * 8);
        estado.serie.shift();
        chart.setOption({
          title: { subtext: Math.floor(estado.total) + ' h este mes' },
          series: [{ data: estado.serie }]
        });
      }
    },

    'estado-agentes': {
      intervalo: 2600,
      ESTADOS: [
        ['Atendiendo clientes', '#4dd8ff'],
        ['Procesando datos',    MARCA],
        ['Entrenandose',        '#b48cff'],
        ['En espera',           '#3a5a74']
      ],
      datos: function (vals) {
        return vals.map((v, i) => ({
          value: v, name: this.ESTADOS[i][0],
          itemStyle: { color: this.ESTADOS[i][1] }
        }));
      },
      crear: function (chart) {
        const estado = { vals: [34, 31, 20, 15] };
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('EN QUE ESTAN AHORA', '4 agentes en linea'),
          legend: { orient: 'vertical', right: 24, top: 'middle',
                    itemWidth: 22, itemHeight: 22,
                    textStyle: { color: '#c8dcec', fontSize: 22, fontFamily: FUENTE } },
          series: [{
            type: 'pie', radius: ['42%', '68%'], center: ['32%', '58%'],
            label: { show: false },
            itemStyle: { borderColor: FONDO, borderWidth: 4 },
            data: this.datos(estado.vals)
          }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        estado.vals = estado.vals.map((v) => Math.max(5, v + Math.round((Math.random() - 0.5) * 6)));
        chart.setOption({ series: [{ data: this.datos(estado.vals) }] });
      }
    },

    calidad: {
      intervalo: 2500,
      crear: function (chart) {
        function medidor(centro, nombre, valor, color) {
          return {
            type: 'gauge', center: centro, radius: '58%',
            min: 0, max: 100, startAngle: 210, endAngle: -30,
            progress: { show: true, width: 16, itemStyle: { color: color } },
            axisLine: { lineStyle: { width: 16, color: [[1, '#12283c']] } },
            axisTick: { show: false }, splitLine: { show: false },
            axisLabel: { show: false }, pointer: { show: false },
            title: { color: color, fontSize: 22, fontFamily: FUENTE, offsetCenter: [0, '78%'] },
            detail: { color: VERDE, fontSize: 52, fontFamily: FUENTE,
                      fontWeight: 'bold', formatter: '{value}%', offsetCenter: [0, '5%'] },
            data: [{ value: valor, name: nombre }]
          };
        }
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('CALIDAD DEL TRABAJO'),
          series: [ medidor(['28%', '62%'], 'Satisfaccion', 94, AZUL),
                    medidor(['72%', '62%'], 'Resueltas solas', 78, '#b48cff') ]
        });
        return {};
      },
      actualizar: function (chart) {
        chart.setOption({ series: [
          { data: [{ value: 90 + Math.round(Math.random() * 8), name: 'Satisfaccion' }] },
          { data: [{ value: 72 + Math.round(Math.random() * 12), name: 'Resueltas solas' }] }
        ] });
      }
    },

    // -------- tableros del Panorama: por que importan la IA y los datos --------

    'impacto-ia': {
      intervalo: 2600,
      METRICAS: ['Producir', 'Decidir', 'Acertar'],
      crear: function (chart) {
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('EL SALTO CON IA', 'indice: sin IA = 100'),
          legend: { top: 110, right: 40,
                    textStyle: { color: '#c8dcec', fontSize: 22, fontFamily: FUENTE } },
          grid: { left: 150, right: 90, top: 160, bottom: 30 },
          xAxis: Object.assign({ type: 'value', max: 450 }, EJE),
          yAxis: { type: 'category', inverse: true, data: this.METRICAS,
                   axisLabel: { color: '#c8dcec', fontSize: 20, fontFamily: FUENTE } },
          series: [
            { name: 'Sin IA', type: 'bar', barWidth: '28%', data: [100, 100, 100],
              itemStyle: { color: '#3a5a74' } },
            { name: 'Con IA', type: 'bar', barWidth: '28%', data: [142, 380, 168],
              label: { show: true, position: 'right', color: VERDE,
                       fontSize: 20, fontFamily: FUENTE },
              itemStyle: { color: MARCA } }
          ]
        });
        return {};
      },
      actualizar: function (chart) {
        chart.setOption({ series: [{}, { data: [
          140 + Math.round(Math.random() * 6),
          375 + Math.round(Math.random() * 12),
          165 + Math.round(Math.random() * 6)
        ] }] });
      }
    },

    adopcion: {
      intervalo: 1200,
      crear: function (chart) {
        const ANIOS = ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
        const estado = { base: [18, 23, 31, 38, 47, 55, 63, 70, 76] };
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('EMPRESAS QUE DECIDEN CON DATOS', '76% y subiendo'),
          grid: { left: 90, right: 50, top: 150, bottom: 60 },
          xAxis: { type: 'category', data: ANIOS, axisLabel: EJE.axisLabel },
          yAxis: Object.assign({ type: 'value', min: 0, max: 100,
                                 axisLabel: Object.assign({}, EJE.axisLabel,
                                                          { formatter: '{value}%' }) },
                               { splitLine: EJE.splitLine }),
          series: [{ type: 'line', data: estado.base, smooth: true,
                     symbol: 'circle', symbolSize: 10,
                     lineStyle: { color: AZUL, width: 4 },
                     itemStyle: { color: VERDE },
                     areaStyle: { color: 'rgba(77,216,255,0.14)' } }]
        });
        return estado;
      },
      actualizar: function (chart, estado) {
        const datos = estado.base.map((v, i) =>
          i === estado.base.length - 1 ? v + Math.round(Math.random() * 3) : v);
        chart.setOption({
          title: { subtext: datos[datos.length - 1] + '% y subiendo' },
          series: [{ data: datos }]
        });
      }
    },

    retorno: {
      intervalo: 2400,
      crear: function (chart) {
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('RETORNO DE INVERTIR EN DATOS'),
          series: [{
            type: 'gauge', center: ['50%', '62%'], radius: '72%',
            min: 0, max: 10, startAngle: 210, endAngle: -30,
            progress: { show: true, width: 20, itemStyle: { color: '#ffd27d' } },
            axisLine: { lineStyle: { width: 20, color: [[1, '#12283c']] } },
            axisTick: { show: false }, splitLine: { show: false },
            axisLabel: { show: false }, pointer: { show: false },
            title: { color: '#ffd27d', fontSize: 26, fontFamily: FUENTE,
                     offsetCenter: [0, '76%'] },
            detail: { color: VERDE, fontSize: 62, fontFamily: FUENTE,
                      fontWeight: 'bold', formatter: (v) => '$' + v.toFixed(1),
                      offsetCenter: [0, '2%'] },
            data: [{ value: 8.3, name: 'por cada $1 invertido' }]
          }]
        });
        return {};
      },
      actualizar: function (chart) {
        chart.setOption({ series: [{
          data: [{ value: 7.9 + Math.random() * 0.8, name: 'por cada $1 invertido' }]
        }] });
      }
    }
  };

  AFRAME.registerComponent('panel-echarts', {
    schema: { tipo: { default: 'ventas' } },

    init: function () {
      const def = TIPOS[this.data.tipo];
      if (!def) { console.error('panel-echarts: tipo desconocido', this.data.tipo); return; }

      this.canvas = document.createElement('canvas');
      this.chart = echarts.init(this.canvas, null,
        { renderer: 'canvas', width: 1024, height: 576 });
      const estado = def.crear(this.chart);

      // los botones 3D pueden filtrar este panel emitiendo 'filtro'
      this.el.addEventListener('filtro', (e) => {
        if (def.filtrar) def.filtrar(this.chart, estado, e.detail.dato);
      });

      // aplicar la textura sin depender del orden de 'loaded' (evita paneles blancos)
      const aplicarTextura = () => {
        const mesh = this.el.getObject3D('mesh');
        if (!mesh || this.textura) return;
        this.textura = new THREE.CanvasTexture(this.canvas);
        this.textura.anisotropy = 8; // legibilidad al mirar los paneles en ángulo
        mesh.material.map = this.textura;
        mesh.material.needsUpdate = true;
      };
      if (this.el.hasLoaded) aplicarTextura();
      else this.el.addEventListener('loaded', aplicarTextura);

      this.datosIntervalo = setInterval(() => def.actualizar(this.chart, estado), def.intervalo);
      // ponytail: refresco de textura a 10 fps, suficiente y amable con el Quest
      this.texturaIntervalo = setInterval(() => {
        if (!this.textura) aplicarTextura(); // rescate si 'loaded' nunca llegó
        if (this.textura) this.textura.needsUpdate = true;
      }, 100);
    },

    remove: function () {
      clearInterval(this.datosIntervalo);
      clearInterval(this.texturaIntervalo);
      if (this.chart) this.chart.dispose();
    }
  });
})();
