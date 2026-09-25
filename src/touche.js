// Touche ! — l'orchestration : les écrans, les capteurs (ou le toucher et le clavier en
// secours), la partie, le rendu, le carnet de pêche.

import { Partie, PORTEE_MAX, FENETRE_FERRAGE, DUREE_VOL } from './partie.js';
import { Interprete, Calibrage } from './gestes.js';
import { Capteurs, vibrer } from './capteurs.js';
import { Sons } from './sons.js';
import { Rendu, chargerImages, projeter, L, H } from './lac.js';
import { espece } from './poissons.js';

const CLE_CARNET = 'touche.carnet.v1';
const CLE_SEUIL = 'touche.seuil.v1';
const $ = (s) => document.querySelector(s);

const etat = {
  mode: null,           // 'capteurs' | 'secours'
  ecran: 'accueil',
  partie: new Partie(),
  interprete: new Interprete(),
  calibrage: new Calibrage(3),
  capteurs: new Capteurs(),
  sons: new Sons(),
  rendu: null,
  carnet: charger(),
  vol: null,
  flotteur: { d: 0, x: 0, plongee: 0, agitation: false },
  poissonVisuel: null,
  derniereImage: 0,
  message: '',
  messageJusqua: 0,
  charge: null,         // secours : appui maintenu pour lancer
};

// ---------------------------------------------------------------- carnet

function charger() {
  try { const b = localStorage.getItem(CLE_CARNET); if (b) return JSON.parse(b); } catch (e) { /* rien */ }
  return { prises: [], records: {} };
}
function sauver() { try { localStorage.setItem(CLE_CARNET, JSON.stringify(etat.carnet)); } catch (e) { /* rien */ } }

function noter(poisson) {
  const prise = { espece: poisson.espece, nom: poisson.nom, taille: poisson.taille, poids: poisson.poids, date: new Date().toISOString() };
  etat.carnet.prises.push(prise);
  const r = etat.carnet.records[poisson.espece];
  const record = !r || poisson.taille > r.taille;
  if (record) etat.carnet.records[poisson.espece] = { taille: poisson.taille, poids: poisson.poids };
  sauver();
  afficherCarnet();
  return record;
}

function afficherCarnet() {
  const c = etat.carnet;
  const s = $('#carnet');
  const n = c.prises.length;
  s.innerHTML = `<h2>Carnet de pêche <small>${n} prise${n > 1 ? 's' : ''}</small></h2>`;
  const ids = Object.keys(c.records);
  if (!ids.length) { s.innerHTML += '<p class="vide">Rien encore. Chaque poisson ramené s’inscrit ici, avec son record.</p>'; return; }
  const ul = document.createElement('ul');
  for (const id of ids) {
    const e = espece(id); const r = c.records[id];
    const li = document.createElement('li');
    li.innerHTML = `<img src="assets/img/poissons/${e.tuiles[0]}.png" alt=""><span>${e.nom}</span><b>${r.taille} cm · ${fr(r.poids, 1)} kg</b>`;
    ul.appendChild(li);
  }
  s.appendChild(ul);
}

function fr(v, d = 1) { return Number(v).toFixed(d).replace('.', ','); }

// ---------------------------------------------------------------- écrans

function montrer(ecran) {
  etat.ecran = ecran;
  for (const e of document.querySelectorAll('[data-ecran]')) e.hidden = e.dataset.ecran !== ecran;
}

function dire(texte, duree = 2.5) {
  etat.message = texte;
  etat.messageJusqua = performance.now() + duree * 1000;
  $('#message').textContent = texte;
  $('#message').classList.add('visible');
}

function consigne(texte) { $('#consigne').textContent = texte; }

async function prendreLaCanne() {
  $('#prendre').disabled = true;
  $('#prendre').textContent = 'Un instant…';
  const r = await etat.capteurs.demander();
  if (r === 'ok') {
    etat.mode = 'capteurs';
    etat.capteurs.abonner(recevoirEchantillon);
    const seuil = Number(localStorage.getItem(CLE_SEUIL) || 0);
    if (seuil > 0) {
      etat.interprete.reglerSeuilFerrage(seuil);
      commencer();
    } else {
      montrer('calibrage');
      $('#calibrage-compte').textContent = '0 / 3';
    }
  } else {
    etat.mode = 'secours';
    $('#mode').textContent = r === 'refuse'
      ? 'Capteurs refusés : on joue au toucher (ou au clavier).'
      : 'Pas de capteurs ici : on joue au toucher (ou au clavier).';
    commencer();
  }
}

function commencer() {
  montrer('jeu');
  $('#mode').hidden = etat.mode !== 'secours';
  etat.partie.reprendre();
  etat.partie.etat = 'pret';
  consigneSelonEtat();
  afficherCarnet();
}

function consigneSelonEtat() {
  const p = etat.partie;
  const c = etat.mode === 'capteurs';
  switch (p.etat) {
    case 'pret': consigne(c ? 'Balance le téléphone vers l’avant pour lancer.' : 'Maintiens le doigt (ou Espace) pour charger, relâche pour lancer.'); break;
    case 'vol': consigne('…'); break;
    case 'attente': consigne('Attends. Regarde le flotteur.'); break;
    case 'touche': consigne(c ? 'FERRE ! Un coup de poignet !' : 'FERRE ! Tape l’écran (ou Espace) !'); break;
    case 'combat': consigne(c ? 'Incline vers où il part. Quand il se calme, lève puis rabaisse pour pomper.' : 'Glisse vers où il part. Quand il se calme, glisse vers le haut (ou ↑) pour pomper.'); break;
    default: consigne(''); break;
  }
}

// ---------------------------------------------------------------- entrées : capteurs

function recevoirEchantillon(e) {
  const gestes = etat.interprete.alimenter(e);
  for (const g of gestes) {
    if (etat.ecran === 'calibrage') {
      if (g.type === 'ferrer') {
        etat.calibrage.ajouter(g.pic);
        etat.sons.jouer('tic');
        vibrer(30);
        $('#calibrage-compte').textContent = `${etat.calibrage.pics.length} / 3`;
        if (etat.calibrage.fait) {
          const seuil = etat.calibrage.seuil();
          etat.interprete.reglerSeuilFerrage(seuil);
          try { localStorage.setItem(CLE_SEUIL, String(seuil)); } catch (err) { /* rien */ }
          $('#calibrage-seuil').textContent = `Seuil réglé : ${seuil} °/s.`;
          setTimeout(commencer, 900);
        }
      }
      continue;
    }
    if (etat.ecran !== 'jeu') continue;
    appliquerGeste(g);
  }
}

function appliquerGeste(g) {
  const p = etat.partie;
  if (g.type === 'lancer' && p.etat === 'pret') lancer(g.puissance);
  else if (g.type === 'ferrer') ferrer();
  else if (g.type === 'pomper' && p.etat === 'combat') p.pomper();
  else if (g.type === 'suivi') p.suivre(g.valeur);
}

// ---------------------------------------------------------------- entrées : secours

function installerSecours(canvas) {
  let appui = null;
  canvas.addEventListener('pointerdown', (ev) => {
    if (etat.ecran !== 'jeu') return;
    appui = { x: ev.clientX, y: ev.clientY, t: performance.now(), pompe: false };
    if (etat.partie.etat === 'pret' && etat.mode === 'secours') etat.charge = { depuis: performance.now() };
    canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!appui) return;
    const dx = ev.clientX - appui.x, dy = ev.clientY - appui.y;
    const p = etat.partie;
    if (p.etat === 'combat') {
      p.suivre(dx / 120);
      if (dy < -80 && !appui.pompe) { appui.pompe = true; p.pomper(); }
    }
  });
  const fin = (ev) => {
    if (!appui) return;
    const duree = performance.now() - appui.t;
    const p = etat.partie;
    if (p.etat === 'pret' && etat.charge) {
      lancer(Math.min(1, (performance.now() - etat.charge.depuis) / 1500));
    } else if ((p.etat === 'touche' || p.etat === 'attente') && duree < 300) {
      ferrer();
    } else if (['prise', 'casse', 'rate', 'decroche'].includes(p.etat) && duree < 300) {
      reprendre();
    }
    if (p.etat === 'combat') p.suivre(0);
    etat.charge = null;
    appui = null;
  };
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);

  window.addEventListener('keydown', (ev) => {
    if (etat.ecran !== 'jeu' || ev.repeat) return;
    const p = etat.partie;
    if (ev.code === 'Space') {
      ev.preventDefault();
      if (p.etat === 'pret') etat.charge = etat.charge || { depuis: performance.now() };
      else if (p.etat === 'touche' || p.etat === 'attente') ferrer();
      else if (p.etat === 'combat') p.pomper();
      else reprendre();
    }
    if (ev.code === 'ArrowUp' && p.etat === 'combat') p.pomper();
    if (ev.code === 'ArrowLeft') p.suivre(-1);
    if (ev.code === 'ArrowRight') p.suivre(1);
  });
  window.addEventListener('keyup', (ev) => {
    const p = etat.partie;
    if (ev.code === 'Space' && p.etat === 'pret' && etat.charge) {
      lancer(Math.min(1, (performance.now() - etat.charge.depuis) / 1500));
      etat.charge = null;
    }
    if (ev.code === 'ArrowLeft' || ev.code === 'ArrowRight') p.suivre(0);
  });
}

// ---------------------------------------------------------------- actions

function lancer(puissance) {
  const p = etat.partie;
  if (!p.lancer(puissance)) return;
  etat.sons.jouer('moulinet', 0.5);
  const depart = etat.rendu.boutDeCanne || { x: L - 100, y: H - 300 };
  const x = (Math.random() - 0.5) * 160;
  etat.flotteur = { d: p.portee, x, plongee: 0, agitation: false };
  etat.vol = { u: 0, depart, arrivee: projeter(p.portee, PORTEE_MAX, x) };
  consigneSelonEtat();
}

function ferrer() {
  const p = etat.partie;
  const avant = p.etat;
  const ok = p.ferrer();
  if (ok) {
    etat.sons.jouer('ferrage');
    vibrer([40, 60, 40]);
  } else if (avant === 'attente') {
    dire('Trop tôt ! Il se méfie…', 1.8);
    etat.sons.jouer('tic', 0.4);
  }
}

function reprendre() {
  if (etat.partie.reprendre()) {
    etat.flotteur = null;
    etat.poissonVisuel = null;
    $('#bilan').hidden = true;
    consigneSelonEtat();
  }
}

// ---------------------------------------------------------------- boucle

function boucle(maintenant) {
  const dt = Math.min(0.05, (maintenant - etat.derniereImage) / 1000 || 0.016);
  etat.derniereImage = maintenant;
  const p = etat.partie;
  const rendu = etat.rendu;

  if (etat.ecran === 'jeu') {
    p.avancer(dt);
    for (const e of p.purger()) traiterEvenement(e);
    if (etat.vol) {
      etat.vol.u = Math.min(1, etat.vol.u + dt / DUREE_VOL);
      if (etat.vol.u >= 1) etat.vol = null;
    }
    if (p.etat === 'touche') etat.flotteur.plongee = 1;
    else if (etat.flotteur) etat.flotteur.plongee = Math.max(0, etat.flotteur.plongee - dt * 3);
    if (etat.flotteur) etat.flotteur.agitation = etat.flotteur.agitation && (etat.flotteur.agitationJusqua > maintenant);
    if (p.etat === 'combat') animerPoisson(dt);
    hud(maintenant);
  }
  const scene = {
    etat: p.etat,
    porteeMax: PORTEE_MAX,
    flotteur: etat.flotteur,
    vol: etat.vol,
    poisson: etat.poissonVisuel,
    tensionVisuelle: p.etat === 'combat' ? Math.min(1, p.poisson.tension / 100) : etat.charge ? Math.min(1, (performance.now() - etat.charge.depuis) / 1500) : 0,
  };
  rendu.dessiner(scene, dt);
  requestAnimationFrame(boucle);
}

function animerPoisson(dt) {
  const f = etat.partie.poisson;
  const v = etat.poissonVisuel || (etat.poissonVisuel = { d: f.distance, x: 0, tuile: f.tuiles[0], direction: f.direction, alpha: 0.75, taille: 0.6 + f.taille / 120, cadence: 0 });
  v.d += (f.distance - v.d) * Math.min(1, dt * 3);
  const cibleX = f.phase === 'rush' ? f.direction * 140 : 0;
  v.x += (cibleX - v.x) * Math.min(1, dt * (f.phase === 'rush' ? 2.5 : 1));
  v.direction = f.phase === 'rush' ? f.direction : (v.x > 0 ? -1 : 1);
  v.cadence += dt * (f.phase === 'rush' ? 8 : 3);
  v.tuile = f.tuiles[Math.floor(v.cadence) % 2];
  v.alpha = f.phase === 'rush' ? 0.85 : 0.6;
  // Le flotteur suit le poisson.
  etat.flotteur.d = v.d;
  etat.flotteur.x = v.x * 0.8;
}

function traiterEvenement(e) {
  const p = etat.partie;
  switch (e.type) {
    case 'plouf': {
      const pr = projeter(e.portee, PORTEE_MAX, etat.flotteur.x);
      etat.rendu.plouf(pr.x, pr.y, 0.5 + 0.5 * p.puissance);
      etat.sons.jouer('plouf');
      dire(`${Math.round(e.portee)} m`, 1.2);
      consigneSelonEtat();
      break;
    }
    case 'fremissement':
      etat.flotteur.agitation = true;
      etat.flotteur.agitationJusqua = performance.now() + 350;
      etat.rendu.rond(etat.rendu.positionFlotteur.x, etat.rendu.positionFlotteur.y, 0.5);
      break;
    case 'touche':
      etat.sons.jouer('touche');
      vibrer([80, 40, 80]);
      etat.rendu.rond(etat.rendu.positionFlotteur.x, etat.rendu.positionFlotteur.y, 1);
      dire('TOUCHE !', FENETRE_FERRAGE);
      consigneSelonEtat();
      break;
    case 'rate':
      dire('Parti avec l’appât…', 2.5);
      bilan('Raté', 'Il est parti avec l’appât. Il fallait ferrer dans la seconde.', null);
      break;
    case 'ferre':
      dire('Ferré !', 1);
      consigneSelonEtat();
      break;
    case 'rush':
      etat.sons.jouer('moulinet', 0.4);
      vibrer(30);
      break;
    case 'pompe':
      etat.sons.jouer('tic', 0.6);
      break;
    case 'pompe-contre':
      dire('Pas pendant qu’il tire !', 1);
      break;
    case 'prise': {
      etat.sons.jouer('prise');
      vibrer([60, 40, 60, 40, 120]);
      const record = noter(e.poisson);
      const q = e.poisson;
      bilan('Pris !', `${q.nom}, ${q.taille} cm, ${fr(q.poids, 1)} kg.${record ? ' Nouveau record !' : ''}`, q);
      break;
    }
    case 'casse':
      etat.sons.jouer('casse');
      vibrer(200);
      bilan('Cassé', 'La ligne a cédé. Suis le poisson quand il tire, et pompe seulement quand il se calme.', null);
      break;
    case 'decroche':
      etat.sons.jouer('casse', 0.5);
      bilan('Décroché', 'La ligne est restée molle trop longtemps : il s’est décroché. Pompe quand il se calme.', null);
      break;
    default:
      break;
  }
}

function bilan(titre, texte, poisson) {
  const b = $('#bilan');
  b.hidden = false;
  b.className = 'bilan ' + (poisson ? 'prise' : 'perdu');
  b.innerHTML = `<h2>${titre}</h2>${poisson ? `<img src="assets/img/poissons/${poisson.tuiles[0]}.png" alt="">` : ''}<p>${texte}</p><button id="reprendre" class="principal">Reprendre la canne</button>`;
  $('#reprendre').addEventListener('click', reprendre);
  consigne(etat.mode === 'capteurs' ? 'Touche l’écran pour reprendre la canne.' : 'Tape l’écran (ou Espace) pour reprendre.');
}

function hud(maintenant) {
  const p = etat.partie;
  const combat = p.etat === 'combat';
  $('#hud').hidden = !combat;
  if (combat) {
    const f = p.poisson;
    $('#tension').style.width = `${Math.min(100, f.tension)}%`;
    $('#tension').className = f.tension > 75 ? 'danger' : f.tension > 45 ? 'alerte' : '';
    $('#energie').style.width = `${f.energie}%`;
    $('#distance').textContent = `${Math.max(0, Math.round(f.distance))} m`;
    const fl = $('#fleche');
    fl.textContent = f.phase === 'rush' ? (f.direction < 0 ? '◀ il tire à gauche' : 'il tire à droite ▶') : 'il se calme : pompe !';
    fl.className = f.phase === 'rush' ? 'rush' : 'repos';
    $('#suivi').style.left = `${50 + p.suivi * 40}%`;
  }
  if (etat.message && maintenant > etat.messageJusqua) { etat.message = ''; $('#message').classList.remove('visible'); }
}

// ---------------------------------------------------------------- démarrage

export async function demarrer() {
  const canvas = $('#lac');
  const images = await chargerImages();
  etat.rendu = new Rendu(canvas, images);
  installerSecours(canvas);
  $('#prendre').addEventListener('click', prendreLaCanne);
  $('#recalibrer').addEventListener('click', () => {
    try { localStorage.removeItem(CLE_SEUIL); } catch (e) { /* rien */ }
    etat.calibrage = new Calibrage(3);
    if (etat.mode === 'capteurs') { montrer('calibrage'); $('#calibrage-compte').textContent = '0 / 3'; $('#calibrage-seuil').textContent = ''; }
  });
  afficherCarnet();
  montrer('accueil');
  requestAnimationFrame(boucle);
  window.touche = { etat, lancer, ferrer, reprendre, commencer, appliquerGeste };
}

demarrer();
