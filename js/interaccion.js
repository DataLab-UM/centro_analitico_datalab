/*
 * interaccion.js — comportamiento e instalación física de los tableros.
 *
 * panel-interactivo: el tablero reacciona al apuntarlo (crece suave).
 *   Solo hover, sin click: el fuse del cursor dispararía "clics" al leer
 *   el gráfico >1.5s; zoom con gatillo llegará con laser-controls en el Quest.
 *
 * montaje-panel: convierte el tablero flotante en una instalación:
 *   bisel oscuro + halo de luz + poste al piso + base. Se pone en el
 *   wrapper del panel; `alto` = altura del centro del tablero.
 *
 * tarjeta: card del design system (templates/oficina-ia.html) llevada al VR:
 *   halo de acento + borde #1e3d52 + superficie #133445 + cabecera con
 *   título y punto de estado pulsante + divisor, y poste al piso opcional.
 *   El contenido se declara como hijos del entity (z >= 0.01 para quedar
 *   encima de la superficie).
 *
 * fichas-agentes: rejilla 2x2 de fichas de agente (avatar con inicial,
 *   nombre, rol y chip de estado), como las agent-cards del template.
 */
AFRAME.registerComponent('panel-interactivo', {
  init: function () {
    const el = this.el;
    el.classList.add('apuntable');
    el.addEventListener('mouseenter', () => {
      el.setAttribute('animation__hover',
        'property: scale; to: 1.14 1.14 1.14; dur: 200; easing: easeOutQuad');
    });
    el.addEventListener('mouseleave', () => {
      el.setAttribute('animation__hover',
        'property: scale; to: 1 1 1; dur: 200; easing: easeOutQuad');
    });
  }
});

AFRAME.registerComponent('montaje-panel', {
  schema: {
    alto: { default: 1.95 },     // altura del centro del tablero
    ancho: { default: 2.6 },
    altura: { default: 1.46 }    // alto del tablero
  },

  init: function () {
    const el = this.el;
    const d = this.data;

    // bisel: caja oscura detrás del tablero
    const bisel = document.createElement('a-box');
    bisel.setAttribute('width', d.ancho + 0.14);
    bisel.setAttribute('height', d.altura + 0.14);
    bisel.setAttribute('depth', 0.06);
    bisel.setAttribute('position', '0 ' + d.alto + ' -0.045');
    bisel.setAttribute('color', '#0a1420');
    el.appendChild(bisel);

    // halo de luz de marca alrededor
    const halo = document.createElement('a-plane');
    halo.setAttribute('width', d.ancho + 0.26);
    halo.setAttribute('height', d.altura + 0.26);
    halo.setAttribute('position', '0 ' + d.alto + ' -0.09');
    halo.setAttribute('color', '#5fd87a');
    halo.setAttribute('material', 'shader: flat; transparent: true; opacity: 0.16');
    el.appendChild(halo);

    // poste al piso + base
    const altoPoste = d.alto - d.altura / 2;
    const poste = document.createElement('a-cylinder');
    poste.setAttribute('radius', 0.035);
    poste.setAttribute('height', altoPoste);
    poste.setAttribute('position', '0 ' + (altoPoste / 2) + ' -0.06');
    poste.setAttribute('color', '#133445');
    el.appendChild(poste);

    const base = document.createElement('a-cylinder');
    base.setAttribute('radius', 0.3);
    base.setAttribute('height', 0.05);
    base.setAttribute('position', '0 0.025 -0.06');
    base.setAttribute('color', '#133445');
    el.appendChild(base);
  }
});

AFRAME.registerComponent('tarjeta', {
  schema: {
    titulo: { default: '' },
    ancho: { default: 3 },
    alto: { default: 1.6 },
    centroY: { default: 1.9 },       // altura del centro de la tarjeta
    acento: { default: '#5fd87a' },
    colorTitulo: { default: '#8aa4b8' },
    poste: { default: false }
  },

  init: function () {
    const el = this.el;
    const d = this.data;
    const y = d.centroY;
    const top = y + d.alto / 2;
    const crear = (tag, attrs) => {
      const n = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      el.appendChild(n);
      return n;
    };

    // halo de acento + borde + superficie
    crear('a-plane', {
      width: d.ancho + 0.2, height: d.alto + 0.2, position: '0 ' + y + ' -0.035',
      color: d.acento, material: 'shader: flat; transparent: true; opacity: 0.1'
    });
    crear('a-plane', {
      width: d.ancho + 0.05, height: d.alto + 0.05, position: '0 ' + y + ' -0.02',
      color: '#1e3d52', material: 'shader: flat'
    });
    crear('a-plane', {
      width: d.ancho, height: d.alto, position: '0 ' + y + ' -0.01',
      color: '#133445', material: 'shader: flat'
    });

    // cabecera: título + punto de estado pulsante + divisor
    crear('a-text', {
      font: 'assets/fonts/Roboto-msdf.json', value: d.titulo, align: 'left',
      color: d.colorTitulo, width: d.ancho * 0.85, 'wrap-count': 40,
      position: (-d.ancho / 2 + 0.14) + ' ' + (top - 0.15) + ' 0'
    });
    crear('a-circle', {
      radius: 0.035, color: d.acento,
      position: (d.ancho / 2 - 0.16) + ' ' + (top - 0.15) + ' 0',
      material: 'shader: flat; transparent: true',
      animation: 'property: components.material.material.opacity; from: 1; to: 0.3; dir: alternate; loop: true; dur: 1000'
    });
    crear('a-plane', {
      width: d.ancho - 0.24, height: 0.012, color: '#1e3d52',
      position: '0 ' + (top - 0.3) + ' 0', material: 'shader: flat'
    });

    // instalación al piso
    if (d.poste) {
      const altoPoste = y - d.alto / 2;
      crear('a-cylinder', {
        radius: 0.035, height: altoPoste, color: '#133445',
        position: '0 ' + (altoPoste / 2) + ' -0.06'
      });
      crear('a-cylinder', {
        radius: 0.3, height: 0.05, color: '#133445', position: '0 0.025 -0.06'
      });
    }
  }
});

AFRAME.registerComponent('fichas-agentes', {
  schema: {
    lista: { default: '' },          // Nombre:Rol:estado|Nombre:Rol:estado|...
    acento: { default: '#b48cff' },
    fila: { default: false },        // true: 4 en fila (consola); false: rejilla 2x2
    objetivo: { default: '' },       // si se define, la ficha es clickeable y
    evento: { default: '' }          // emite este evento con su índice
  },

  init: function () {
    const FUENTE = 'assets/fonts/Roboto-msdf.json';
    const COLOR_ESTADO = {
      'activo': '#5fd87a',
      'procesando': '#4dd8ff',
      'en espera': '#8aa4b8'
    };
    const POSICIONES = this.data.fila
      ? [[-2.13, 0], [-0.71, 0], [0.71, 0], [2.13, 0]]
      : [[-0.7, 0.44], [0.7, 0.44], [-0.7, -0.44], [0.7, -0.44]];

    this.data.lista.split('|').map(s => s.trim()).filter(Boolean).forEach((def, i) => {
      const [nombre, rol, estado] = def.split(':').map(s => s.trim());
      const color = COLOR_ESTADO[estado] || '#8aa4b8';
      const [x, yF] = POSICIONES[i % POSICIONES.length];
      const ficha = document.createElement('a-entity');
      ficha.setAttribute('position', x + ' ' + yF + ' 0');
      this.el.appendChild(ficha);

      const crear = (tag, attrs) => {
        const n = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
        ficha.appendChild(n);
        return n;
      };

      const fondo = crear('a-plane', { width: 1.3, height: 0.78, color: '#0a1420', material: 'shader: flat' });
      if (this.data.objetivo && this.data.evento) {
        fondo.classList.add('clickable');
        ficha.addEventListener('mouseenter', () => {
          ficha.setAttribute('animation__hover',
            'property: scale; to: 1.1 1.1 1.1; dur: 160; easing: easeOutQuad');
          fondo.setAttribute('color', '#13293d');
        });
        ficha.addEventListener('mouseleave', () => {
          ficha.setAttribute('animation__hover',
            'property: scale; to: 1 1 1; dur: 160; easing: easeOutQuad');
          fondo.setAttribute('color', '#0a1420');
        });
        ficha.addEventListener('click', () => {
          const objetivo = document.querySelector(this.data.objetivo);
          if (objetivo) objetivo.emit(this.data.evento, { dato: String(i) });
          fondo.setAttribute('color', '#1d4a63');
          setTimeout(() => fondo.setAttribute('color', '#0a1420'), 300);
        });
      }
      // avatar: circulo de acento con la inicial del agente
      crear('a-circle', {
        radius: 0.1, color: this.data.acento, position: '0 0.22 0.005',
        material: 'shader: flat; transparent: true; opacity: 0.25'
      });
      crear('a-text', {
        font: FUENTE, value: nombre.charAt(0), align: 'center',
        color: this.data.acento, width: 1.4, position: '0 0.22 0.01'
      });
      crear('a-text', {
        font: FUENTE, value: nombre, align: 'center',
        color: '#e8f0f6', width: 1.5, position: '0 0.03 0.01'
      });
      crear('a-text', {
        font: FUENTE, value: rol, align: 'center',
        color: '#8aa4b8', width: 1.0, 'wrap-count': 24, position: '0 -0.1 0.01'
      });
      // chip de estado
      crear('a-plane', {
        width: 0.56, height: 0.13, color: color, position: '0 -0.26 0.005',
        material: 'shader: flat; transparent: true; opacity: 0.16'
      });
      crear('a-text', {
        font: FUENTE, value: estado, align: 'center',
        color: color, width: 0.95, position: '0 -0.26 0.01'
      });
    });
  }
});
