// Le moteur : déterminisme, chute libre conforme aux lois, rampe qui envoie la bille
// toujours au même endroit.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simuler, tempsDeChute } from '../src/moteur.js';
import { LOIS } from '../src/lois.js';

const sol = { id: 'sol', x1: 0, y1: 0, x2: 10, y2: 0, sol: true };
const chute = (couleur, h) => ({ corps: [{ id: 'b', x: 5, y: h + 0.25, r: 0.25, couleur }], segments: [sol], dureeMax: 6 });

test('même monde, même trace, au bit près', () => {
  const a = simuler(chute('gris', 4));
  const b = simuler(chute('gris', 4));
  assert.deepEqual(a, b);
});

test('la chute libre suit t = √(2h/g) à 1 % près, pour chaque couleur', () => {
  for (const [couleur, g] of Object.entries(LOIS.gravite)) {
    for (const h of [1, 2.5, 4, 5]) {
      const t = tempsDeChute(simuler(chute(couleur, h)), 'b');
      const attendu = Math.sqrt((2 * h) / g);
      assert.ok(Math.abs(t - attendu) / attendu < 0.01, `${couleur} ${h} m : ${t} au lieu de ${attendu}`);
    }
  }
});

test('la masse ne change rien, la couleur change tout', () => {
  const lourde = simuler({ corps: [{ id: 'b', x: 5, y: 4.25, r: 0.25, couleur: 'gris', m: 3 }], segments: [sol], dureeMax: 6 });
  const legere = simuler({ corps: [{ id: 'b', x: 5, y: 4.25, r: 0.25, couleur: 'gris', m: 1 }], segments: [sol], dureeMax: 6 });
  assert.equal(tempsDeChute(lourde, 'b'), tempsDeChute(legere, 'b'));
  const rouge = tempsDeChute(simuler(chute('rouge', 4)), 'b');
  const bleu = tempsDeChute(simuler(chute('bleu', 4)), 'b');
  const gris = tempsDeChute(simuler(chute('gris', 4)), 'b');
  assert.ok(rouge < gris && gris < bleu, `rouge ${rouge} < gris ${gris} < bleu ${bleu}`);
});

test('une bille finit par s’endormir sur le sol, et la trace s’arrête', () => {
  const tr = simuler(chute('gris', 3));
  assert.equal(tr.fin, 'repos');
  assert.ok(tr.duree < 6);
  const derniere = tr.images[tr.images.length - 1].corps[0];
  assert.ok(Math.abs(derniere.y - 0.25) < 1e-3, `posée au sol : y = ${derniere.y}`);
});

test('la rampe envoie la bille au même endroit à chaque fois, et dans la scène', () => {
  const monde = () => ({
    corps: [{ id: 'b', x: 1.27, y: 3.67, r: 0.25, couleur: 'gris' }],
    segments: [sol, { id: 'rampe', x1: 1, y1: 3.2, x2: 3.2, y2: 1.4 }, { id: 'mg', x1: 0, y1: 0, x2: 0, y2: 6 }, { id: 'md', x1: 10, y1: 0, x2: 10, y2: 6 }],
    dureeMax: 8,
  });
  const a = simuler(monde());
  const b = simuler(monde());
  const contact = (tr) => tr.evenements.find((e) => e.type === 'contact' && e.sol);
  assert.equal(contact(a).t, contact(b).t);
  const x = a.images.find((i) => i.t >= contact(a).t).corps[0].x;
  assert.ok(x > 3.5 && x < 9, `retombe à ${x} m`);
});
