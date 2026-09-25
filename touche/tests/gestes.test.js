import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DetecteurPic, DetecteurPompage, Calibrage, Interprete, puissanceLancer, suivi } from '../src/gestes.js';

test('un pic net est détecté une fois, un tremblement jamais', () => {
  const d = new DetecteurPic({ seuil: 250, repos: 300 });
  const sortie = [];
  const signal = [0, 20, 40, 300, 700, 900, 500, 100, 20, 0, 0, 0, 0];
  signal.forEach((v, i) => { const p = d.alimenter(v, i * 16); if (p) sortie.push(p); });
  assert.equal(sortie.length, 1);
  assert.equal(sortie[0].pic, 900);
  const d2 = new DetecteurPic({ seuil: 250 });
  let n = 0;
  for (let i = 0; i < 200; i++) if (d2.alimenter(80 + 60 * Math.sin(i), i * 16)) n++;
  assert.equal(n, 0);
});

test('le temps de repos empêche le doublon d’un même coup', () => {
  const d = new DetecteurPic({ seuil: 250, repos: 400 });
  let n = 0;
  const bosse = [300, 800, 300, 50];
  for (let k = 0; k < 3; k++) bosse.forEach((v, i) => { if (d.alimenter(v, k * 100 + i * 16)) n++; });
  assert.equal(n, 1);
  bosse.forEach((v, i) => { if (d.alimenter(v, 1000 + i * 16)) n++; });
  assert.equal(n, 2);
});

test('un pompage = lever puis rabaisser', () => {
  const d = new DetecteurPompage({ haut: 40, bas: 15 });
  const betas = [0, 10, 30, 45, 60, 50, 30, 10, 0, 45, 5];
  const pompes = betas.map((b) => d.alimenter(b)).filter(Boolean).length;
  assert.equal(pompes, 2);
});

test('le calibrage prend la médiane et garde un plancher', () => {
  const c = new Calibrage(3);
  c.ajouter(900); c.ajouter(400); assert.equal(c.fait, false);
  assert.equal(c.ajouter(700), true);
  assert.equal(c.seuil(), Math.round(700 * 0.45));
  const c2 = new Calibrage(3); c2.ajouter(100); c2.ajouter(120); c2.ajouter(90);
  assert.equal(c2.seuil(), 150);
});

test('la puissance du lancer et le suivi sont bornés', () => {
  assert.equal(puissanceLancer(3), 0);
  assert.equal(puissanceLancer(40), 1);
  assert.ok(puissanceLancer(16) > 0.4 && puissanceLancer(16) < 0.6);
  assert.equal(suivi(90), 1); assert.equal(suivi(-90), -1); assert.equal(suivi(15), 0.5);
});

test('l’interprète : un coup de poignet donne « ferrer », une poussée donne « lancer »', () => {
  const it = new Interprete({ seuilFerrage: 250, seuilLancer: 7 });
  const ev = [];
  const calme = { rotation: { alpha: 0, beta: 0, gamma: 0 }, acceleration: { x: 0, y: 0, z: 0 }, orientation: { beta: 0, gamma: 0 } };
  for (let i = 0; i < 10; i++) ev.push(...it.alimenter({ t: i * 16, ...calme }));
  ev.push(...it.alimenter({ t: 200, ...calme, rotation: { alpha: 0, beta: 600, gamma: 100 } }));
  ev.push(...it.alimenter({ t: 216, ...calme, rotation: { alpha: 0, beta: 900, gamma: 0 } }));
  ev.push(...it.alimenter({ t: 232, ...calme }));
  ev.push(...it.alimenter({ t: 500, ...calme, acceleration: { x: 0, y: 18, z: 4 } }));
  ev.push(...it.alimenter({ t: 516, ...calme }));
  ev.push(...it.alimenter({ t: 600, ...calme, orientation: { beta: 50, gamma: 20 } }));
  ev.push(...it.alimenter({ t: 616, ...calme, orientation: { beta: 5, gamma: 20 } }));
  const types = ev.map((e) => e.type);
  assert.deepEqual(types, ['ferrer', 'lancer', 'suivi', 'pomper']);
  assert.ok(ev[1].puissance > 0.5);
});
