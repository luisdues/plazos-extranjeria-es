/*!
 * plazos-extranjeria-es
 * Cómputo de plazos administrativos en España según el art. 30 de la Ley 39/2015,
 * con el calendario oficial de días inhábiles y los plazos de resolución y el
 * sentido del silencio de los trámites de extranjería.
 *
 * Versión interactiva: https://esextranjeria.es/calculadora-plazos
 * Licencia MIT.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../data/dias-inhabiles.json'),
      require('../data/tramites-plazos-silencio.json')
    );
  } else {
    // En navegador: definir antes window.PLAZOS_DIAS_INHABILES y window.PLAZOS_TRAMITES
    // con el contenido de los dos ficheros de data/.
    root.PlazosExtranjeria = factory(root.PLAZOS_DIAS_INHABILES, root.PLAZOS_TRAMITES);
  }
}(typeof self !== 'undefined' ? self : this, function (INHABILES, TRAMITES) {
  'use strict';

  var DIA = 86400000;

  // Todas las fechas se manejan como 'AAAA-MM-DD' y se calculan en UTC,
  // para que el cambio de hora no desplace ningún día.
  function leer(fecha) {
    var p = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
    if (!p) throw new TypeError('Fecha no válida, se espera AAAA-MM-DD: ' + fecha);
    var d = new Date(Date.UTC(+p[1], +p[2] - 1, +p[3]));
    if (d.getUTCMonth() !== +p[2] - 1) throw new TypeError('La fecha no existe: ' + fecha);
    return d;
  }
  function escribir(d) {
    return d.toISOString().slice(0, 10);
  }

  function comunidades() {
    return Object.keys(INHABILES.ccaa);
  }

  // Días inhábiles distintos de sábados y domingos: los nacionales y, si se indica,
  // los de la comunidad autónoma (art. 30.7). No incluye los festivos locales.
  function diasInhabiles(ccaa) {
    var dias = INHABILES.nacional['2026'].concat(INHABILES.nacional['2027_provisional']);
    if (ccaa) {
      var c = INHABILES.ccaa[ccaa];
      if (!c) throw new RangeError('Comunidad desconocida: ' + ccaa + '. Valores admitidos: ' + comunidades().join(', '));
      dias = dias.concat(c.dias);
    }
    return dias.slice().sort();
  }

  function conjunto(ccaa) {
    var s = {};
    diasInhabiles(ccaa).forEach(function (d) { s[d] = true; });
    return s;
  }
  function inhabil(d, s) {
    var w = d.getUTCDay();
    return w === 0 || w === 6 || s[escribir(d)] === true;
  }

  // Sábados, domingos y festivos del calendario oficial son inhábiles (art. 30.2).
  function esInhabil(fecha, ccaa) {
    return inhabil(leer(fecha), conjunto(ccaa));
  }

  // Si el último día es inhábil, el plazo se prorroga al primer hábil siguiente (art. 30.5).
  function primerHabil(fecha, ccaa) {
    var s = conjunto(ccaa), d = leer(fecha);
    while (inhabil(d, s)) d = new Date(d.getTime() + DIA);
    return escribir(d);
  }

  // Plazos por meses: de fecha a fecha, desde el día siguiente a la notificación o
  // publicación. Si en el mes de vencimiento no hay día equivalente, el plazo
  // expira el último día del mes (art. 30.4).
  function sumarMeses(fecha, n) {
    var d = leer(fecha), y = d.getUTCFullYear(), m = d.getUTCMonth() + n, dia = d.getUTCDate();
    var r = new Date(Date.UTC(y, m, dia));
    if (r.getUTCDate() !== dia) r = new Date(Date.UTC(y, m + 1, 0));
    return escribir(r);
  }

  // Plazos por días hábiles: empiezan a contar el día siguiente y se saltan
  // sábados, domingos y festivos (arts. 30.2 y 30.3).
  function sumarHabiles(fecha, n, ccaa) {
    var s = conjunto(ccaa), d = leer(fecha), contados = 0;
    while (contados < n) {
      d = new Date(d.getTime() + DIA);
      if (!inhabil(d, s)) contados++;
    }
    return escribir(d);
  }

  // Plazos por días naturales (art. 30.2, cuando la norma lo dice expresamente).
  function sumarNaturales(fecha, n) {
    return escribir(new Date(leer(fecha).getTime() + n * DIA));
  }

  /**
   * Último día de un plazo contado desde `fecha` (notificación, publicación o presentación).
   * @param {string} fecha 'AAAA-MM-DD'
   * @param {number} cantidad
   * @param {'meses'|'habiles'|'naturales'} unidad
   * @param {string} [ccaa] clave de comunidad autónoma (ver comunidades())
   * @returns {{vence: string, venceSinProrroga: string, prorrogado: boolean, aviso?: string}}
   */
  function vencimiento(fecha, cantidad, unidad, ccaa) {
    var natural;
    if (unidad === 'meses') natural = sumarMeses(fecha, cantidad);
    else if (unidad === 'habiles') natural = sumarHabiles(fecha, cantidad, ccaa);
    else if (unidad === 'naturales') natural = sumarNaturales(fecha, cantidad);
    else throw new RangeError('Unidad no admitida: ' + unidad + " (usa 'meses', 'habiles' o 'naturales')");
    var vence = primerHabil(natural, ccaa);
    var r = { vence: vence, venceSinProrroga: natural, prorrogado: vence !== natural };
    if (+vence.slice(0, 4) > INHABILES.anio_confirmado || +fecha.slice(0, 4) > INHABILES.anio_confirmado) {
      r.aviso = 'El calendario de ' + (INHABILES.anio_confirmado + 1) +
        ' es provisional: solo incluye festivos nacionales fijos y Viernes Santo.';
    }
    return r;
  }

  function tramite(slug) {
    for (var i = 0; i < TRAMITES.tramites.length; i++) {
      if (TRAMITES.tramites[i].slug === slug) return TRAMITES.tramites[i];
    }
    throw new RangeError('Trámite desconocido: ' + slug);
  }

  /**
   * Fecha en que vence el plazo máximo de la Administración para resolver y notificar
   * un trámite, y qué efecto tiene el silencio a partir de entonces.
   * Recuerda: el plazo se suspende mientras dura un requerimiento de subsanación
   * (art. 22.1.a Ley 39/2015); esta función no puede saberlo.
   */
  function plazoResolucion(slug, fechaPresentacion, ccaa) {
    var t = tramite(slug);
    var v = vencimiento(fechaPresentacion, t.cantidad, t.unidad, ccaa);
    v.tramite = t.tramite;
    v.plazo = t.plazo;
    v.silencio = t.silencio;
    v.norma = t.norma;
    return v;
  }

  return {
    comunidades: comunidades,
    diasInhabiles: diasInhabiles,
    esInhabil: esInhabil,
    primerHabil: primerHabil,
    sumarMeses: sumarMeses,
    sumarHabiles: sumarHabiles,
    sumarNaturales: sumarNaturales,
    vencimiento: vencimiento,
    tramites: TRAMITES.tramites,
    tramite: tramite,
    plazoResolucion: plazoResolucion
  };
}));
