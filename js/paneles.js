/*
 * paneles.js — componente panel-echarts: un gráfico ECharts vivo como textura 3D.
 * Uso: <a-plane panel-echarts="tipo: ventas"></a-plane>
 * Tipos: ventas | calor | kpi | prediccion
 */
(function () {
  const FUENTE = 'monospace';
  const AZUL = '#4dd8ff', VERDE = '#7dffb0', FONDO = '#0a1420';
  const EJE = { axisLabel: { color: '#3a6a8a', fontSize: 20, fontFamily: FUENTE },
                splitLine: { lineStyle: { color: '#122436' } } };

  function titulo(texto, sub) {
    return {
      text: texto, subtext: sub || '',
      left: 24, top: 14,
      textStyle: { color: AZUL, fontSize: 32, fontFamily: FUENTE },
      subtextStyle: { color: VERDE, fontSize: 46, fontWeight: 'bold', fontFamily: FUENTE }
    };
  }

  // Cada tipo define: crear(chart) -> estado, y actualizar(chart, estado); intervalo en ms
  const TIPOS = {

    ventas: {
      intervalo: 300,
      crear: function (chart) {
        const estado = { serie: Datos.serie(40, 20, 90), kpi: 128400 };
        chart.setOption({
          backgroundColor: FONDO, animation: false,
          title: titulo('VENTAS EN TIEMPO REAL', '$128.400'),
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
        Datos.avanzar(estado.serie, 10, 95, 8);
        estado.kpi += Math.floor(Math.random() * 900);
        chart.setOption({
          title: { subtext: '$' + estado.kpi.toLocaleString('es-CO') },
          series: [{ data: estado.serie }]
        });
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
      crear: function (chart) {
        const barras = Datos.proyeccion(10);
        chart.setOption({
          backgroundColor: FONDO,
          title: titulo('PREDICCIÓN DE CRECIMIENTO'),
          grid: { left: 80, right: 40, top: 120, bottom: 60 },
          xAxis: { type: 'category', axisLabel: EJE.axisLabel,
                   data: ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10'] },
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
        return {};
      },
      actualizar: function (chart) {
        const barras = Datos.proyeccion(10);
        // la transición animada de ECharts hace crecer las barras: efecto "vivo"
        chart.setOption({ series: [{ data: barras },
                                   { data: barras.map((v) => v + 8) }] });
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

      this.el.addEventListener('loaded', () => {
        const mesh = this.el.getObject3D('mesh');
        this.textura = new THREE.CanvasTexture(this.canvas);
        this.textura.anisotropy = 8; // legibilidad al mirar los paneles en ángulo
        mesh.material.map = this.textura;
        mesh.material.needsUpdate = true;
      });

      this.datosIntervalo = setInterval(() => def.actualizar(this.chart, estado), def.intervalo);
      // ponytail: refresco de textura a 10 fps, suficiente y amable con el Quest
      this.texturaIntervalo = setInterval(() => {
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
