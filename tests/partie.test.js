import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Partie, DUREE_VOL, FENETRE_FERRAGE, PORTEE_MIN, PORTEE_MAX } from '../src/partie.js';
import { tirerPoisson, ESPECES, poids, espece } from '../src/poissons.js';

// Un aléa déterministe pour les tests.
function aleaFixe(graine = 1) {
  let s = graine;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

const types = (p) => p.purger().map((e) => e.type);

test('lancer, vol, plouf, attente, touche, raté si on ne ferre pas', () => {
  const p = new Partie({ alea: aleaFixe(3) });
  assert.equal(p.lancer(0.5), true);
  assert.equal(p.portee, (PORTEE_MIN + PORTEE_MAX) / 2);
  assert.equal(p.lancer(0.5), false, 'on ne relance pas en vol');
  p.avancer(DUREE_VOL + 0.01);
  assert.equal(p.etat, 'attente');
  for (let i = 0; i < 200 && p.etat === 'attente'; i++) p.avancer(0.05);
  assert.equal(p.etat, 'touche');
  p.avancer(FENETRE_FERRAGE + 0.01);
  assert.equal(p.etat, 'rate');
  const t = types(p);
  assert.ok(t.includes('lancer') && t.includes('plouf') && t.includes('touche') && t.includes('rate'));
  assert.equal(p.reprendre(), true);
  assert.equal(p.etat, 'pret');
});

test('ferrer trop tôt repousse la touche', () => {
  const p = new Partie({ alea: aleaFixe(5) });
  p.lancer(0.3); p.avancer(DUREE_VOL + 0.01);
  const avant = p.delaiTouche;
  assert.equal(p.ferrer(), false);
  assert.ok(p.delaiTouche > avant);
  assert.ok(types(p).includes('trop-tot'));
});

test('un combat suivi et pompé au bon moment finit par une prise', () => {
  const p = new Partie({ alea: aleaFixe(7) });
  p.lancer(0.8); p.avancer(DUREE_VOL + 0.01); p.forcerTouche(); p.avancer(0.05);
  assert.equal(p.etat, 'touche');
  assert.equal(p.ferrer(), true);
  assert.equal(p.etat, 'combat');
  let pas = 0;
  while (p.etat === 'combat' && pas < 4000) {
    const f = p.poisson;
    p.suivre(f.phase === 'rush' ? f.direction : 0);
    if (f.phase === 'repos' && pas % 12 === 0) p.pomper();
    p.avancer(0.05);
    pas++;
  }
  assert.equal(p.etat, 'prise', `état ${p.etat} après ${pas} pas, tension ${p.poisson.tension}`);
  assert.ok(p.poisson.taille > 0 && p.poisson.poids > 0);
});

test('tirer contre le poisson pendant ses rushs casse la ligne', () => {
  const p = new Partie({ alea: aleaFixe(11) });
  p.lancer(1); p.avancer(DUREE_VOL + 0.01); p.forcerTouche(); p.avancer(0.05); p.ferrer();
  let pas = 0;
  while (p.etat === 'combat' && pas < 4000) {
    const f = p.poisson;
    p.suivre(f.phase === 'rush' ? -f.direction : 0);
    if (f.phase === 'rush') p.pomper();
    p.avancer(0.05);
    pas++;
  }
  assert.equal(p.etat, 'casse');
});

test('ne rien faire du tout laisse la ligne molle : le poisson se décroche', () => {
  const p = new Partie({ alea: aleaFixe(2) });
  p.lancer(0.6); p.avancer(DUREE_VOL + 0.01); p.forcerTouche(); p.avancer(0.05); p.ferrer();
  let pas = 0;
  while (p.etat === 'combat' && pas < 6000) { p.avancer(0.05); pas++; }
  assert.equal(p.etat, 'decroche');
});

test('les poissons : près du bord les petits, au large les gros et les rares', () => {
  const alea = aleaFixe(42);
  const pres = new Set(), loin = new Set();
  for (let i = 0; i < 300; i++) { pres.add(tirerPoisson(0.05, alea).espece); loin.add(tirerPoisson(0.95, alea).espece); }
  assert.ok(pres.has('gardon') && !pres.has('rouge'));
  assert.ok(loin.has('rouge') && !loin.has('gardon'));
  for (const e of ESPECES) assert.ok(poids(e, e.taille[1]) > poids(e, e.taille[0]));
  assert.equal(espece('globe').nom, 'Globe');
});
