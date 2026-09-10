'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/plazos.js');

test('meses de fecha a fecha; sin día equivalente, último día del mes (art. 30.4)', () => {
  assert.equal(P.sumarMeses('2026-01-31', 1), '2026-02-28');
  assert.equal(P.sumarMeses('2028-01-31', 1), '2028-02-29');
  assert.equal(P.sumarMeses('2026-03-31', 3), '2026-06-30');
});

test('vencimiento en sábado seguido de festivo nacional se prorroga al primer hábil (art. 30.5)', () => {
  const r = P.vencimiento('2026-09-10', 1, 'meses');
  assert.equal(r.venceSinProrroga, '2026-10-10');
  assert.equal(r.vence, '2026-10-13');
  assert.equal(r.prorrogado, true);
});

test('días hábiles cruzando Navidad y Reyes, con aviso por el calendario provisional de 2027', () => {
  const r = P.vencimiento('2026-12-24', 10, 'habiles');
  assert.equal(r.vence, '2027-01-12');
  assert.equal(r.prorrogado, false);
  assert.ok(r.aviso);
});

test('los festivos autonómicos cuentan si se indica la comunidad', () => {
  assert.equal(P.esInhabil('2026-09-11', 'cataluna'), true);
  assert.equal(P.esInhabil('2026-09-11'), false);
  assert.equal(P.sumarHabiles('2026-09-08', 3, 'cataluna'), '2026-09-14');
  assert.equal(P.sumarHabiles('2026-09-08', 3), '2026-09-11');
});

test('plazo de resolución de un trámite y sentido del silencio', () => {
  const nie = P.plazoResolucion('nie', '2026-12-03');
  assert.equal(nie.venceSinProrroga, '2026-12-08');
  assert.equal(nie.vence, '2026-12-09');
  assert.equal(nie.silencio, 'negativo');

  const rep = P.plazoResolucion('recurso-reposicion', '2026-11-02', 'andalucia');
  assert.equal(rep.vence, '2026-12-02');
  assert.equal(rep.silencio, 'negativo');
});

test('datos completos y coherentes', () => {
  assert.equal(P.comunidades().length, 19);
  assert.equal(P.tramites.length, 32);
  for (const t of P.tramites) {
    assert.ok(['meses', 'habiles', 'naturales'].includes(t.unidad), t.slug);
    assert.ok(['positivo', 'negativo', 'indeterminado'].includes(t.silencio), t.slug);
    assert.ok(t.norma.length > 3, t.slug);
  }
  for (const d of P.diasInhabiles('madrid')) assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
});

test('errores claros ante entradas no válidas', () => {
  assert.throws(() => P.sumarMeses('2026-02-30', 1), TypeError);
  assert.throws(() => P.esInhabil('2026-01-01', 'narnia'), RangeError);
  assert.throws(() => P.vencimiento('2026-01-01', 1, 'semanas'), RangeError);
  assert.throws(() => P.tramite('no-existe'), RangeError);
});
