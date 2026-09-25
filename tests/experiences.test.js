// Les expériences : chacune se joue en Node, juge comme prévu, et la fissure de la
// quatrième est bien là.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPERIENCES, experience, reglagesParDefaut, jouer } from '../src/experiences.js';
import { LOIS } from '../src/lois.js';
import { evaluer } from '../src/formule.js';

test('cinq expériences, numérotées dans l’ordre, chacune avec lettre, budget et prédiction', () => {
  assert.equal(EXPERIENCES.length, 5);
  EXPERIENCES.forEach((e, i) => {
    assert.equal(e.numero, i + 1);
    assert.ok(e.lettre.texte.length > 40 && e.lettre.de && e.lettre.objectif);
    assert.ok(e.budget >= 1);
    assert.ok(['pointer', 'chiffre', 'choix', 'mesures'].includes(e.prediction.type));
    assert.equal(typeof e.carnet, 'function');
  });
});

test('1. le bécher bien placé attrape la bille ; mal placé, non', () => {
  const e = experience('becher');
  const r = reglagesParDefaut(e);
  const rate = e.juger(r, r.becherX, jouer(e, r));
  assert.equal(rate.reussi, false);
  const xChute = parseFloat(rate.mesures['Premier contact avec le sol'].replace(',', '.'));
  const r2 = { becherX: Math.round(xChute * 20) / 20 };
  const ok = e.juger(r2, r2.becherX, jouer(e, r2));
  assert.equal(ok.reussi, true, ok.message);
});

test('2. le chrono : juste à ±0,05 s, faux au-delà, et hors sujet si la hauteur n’est pas 4 m', () => {
  const e = experience('chrono');
  const r = reglagesParDefaut(e);
  const tr = jouer(e, r);
  const t = Math.sqrt(8 / LOIS.gravite.gris);
  assert.equal(e.juger(r, t, tr).reussi, true);
  assert.equal(e.juger(r, t + 0.04, tr).reussi, true);
  assert.equal(e.juger(r, t + 0.08, tr).reussi, false);
  const r3 = { hauteur: 3 };
  const j = e.juger(r3, t, jouer(e, r3));
  assert.equal(j.reussi, false);
  assert.ok(j.grandeurs.t < t, 'la mesure depuis 3 m est plus courte');
});

test('3. lourde et légère arrivent ensemble', () => {
  const e = experience('masses');
  const r = reglagesParDefaut(e);
  const tr = jouer(e, r);
  assert.equal(e.juger(r, 'ensemble', tr).reussi, true);
  assert.equal(e.juger(r, 'lourde', tr).reussi, false);
});

test('4. la fissure : la rouge arrive avant la bleue, et « ensemble » est faux', () => {
  const e = experience('couleurs');
  const r = reglagesParDefaut(e);
  const tr = jouer(e, r);
  assert.equal(e.juger(r, 'ensemble', tr).reussi, false);
  assert.equal(e.juger(r, 'rouge', tr).reussi, true);
});

test('5. mesurer puis calculer au tableau donne g à 5 % près, et la réponse est jugée contre les lois', () => {
  const e = experience('loi');
  const valeurs = {};
  for (const couleur of ['rouge', 'bleu']) {
    const r = { couleur, hauteur: 4 };
    const m = e.juger(r, null, jouer(e, r));
    assert.equal(m.mesure, true);
    const g = evaluer(['2', '×', 'h', '÷', 't', '²'], e.grandeurs(r, m.grandeurs));
    assert.ok(g.valeur !== undefined, g.erreur);
    assert.ok(Math.abs(g.valeur - LOIS.gravite[couleur]) / LOIS.gravite[couleur] < 0.02, `${couleur} : ${g.valeur}`);
    valeurs[couleur] = Math.round(g.valeur * 100) / 100;
  }
  assert.equal(e.jugerReponse(valeurs, LOIS).reussi, true);
  assert.equal(e.jugerReponse({ rouge: valeurs.rouge, bleu: valeurs.bleu * 1.2 }, LOIS).reussi, false);
  assert.equal(e.jugerReponse({}, LOIS).reussi, false);
});

test('le tableau noir : priorités, carré, parenthèses, erreurs en français', () => {
  assert.equal(evaluer(['2', '+', '3', '×', '4'], {}).valeur, 14);
  assert.equal(evaluer(['(', '2', '+', '3', ')', '×', '4'], {}).valeur, 20);
  assert.equal(evaluer(['t', '²'], { t: 3 }).valeur, 9);
  assert.equal(evaluer(['h', '÷', '0'], { h: 1 }).erreur, 'Division par zéro.');
  assert.match(evaluer(['t'], { t: undefined }).erreur, /mesuré/);
  assert.match(evaluer([], {}).erreur, /vide/);
});
