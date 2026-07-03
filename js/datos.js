/*
 * datos.js — simulador de datos "en vivo" para todos los paneles.
 * Sin backend: series que caminan con ruido y siempre se ven verosímiles.
 */
window.Datos = {
  // serie que arranca en un rango y camina con ruido acotado
  serie: function (n, min, max) {
    const base = min + (max - min) * 0.5;
    return Array.from({ length: n }, () => base + (Math.random() - 0.5) * (max - min) * 0.4);
  },

  // avanza la serie un paso (muta y devuelve el nuevo valor)
  avanzar: function (serie, min, max, paso) {
    const ultimo = serie[serie.length - 1];
    const nuevo = Math.max(min, Math.min(max, ultimo + (Math.random() - 0.48) * paso));
    serie.push(nuevo);
    serie.shift();
    return nuevo;
  },

  // matriz [hora, dia, valor] para el mapa de calor (12 horas x 7 dias)
  matrizCalor: function () {
    const datos = [];
    for (let h = 0; h < 12; h++) {
      for (let d = 0; d < 7; d++) {
        // pico al mediodia entre semana, flojo el fin de semana
        const pico = 100 - Math.abs(h - 5) * 12 - (d >= 5 ? 35 : 0);
        datos.push([h, d, Math.max(5, Math.round(pico + Math.random() * 25 - 12))]);
      }
    }
    return datos;
  },

  // muta ~n celdas al azar de la matriz de calor
  mutarCalor: function (datos, n) {
    for (let i = 0; i < n; i++) {
      const celda = datos[Math.floor(Math.random() * datos.length)];
      celda[2] = Math.max(5, Math.min(100, celda[2] + Math.round((Math.random() - 0.5) * 30)));
    }
    return datos;
  },

  // barras de proyeccion: tendencia creciente con ruido (mensaje: "tu empresa crece")
  proyeccion: function (n) {
    return Array.from({ length: n }, (_, i) =>
      Math.round(40 + i * 6 + Math.random() * 18));
  }
};
