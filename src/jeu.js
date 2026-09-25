// Eurêka — l'orchestration : le courrier, le montage, le tableau noir, le lancement,
// la lecture, le Carnet. Un seul état, une seule fonction de rendu des panneaux.

import { EXPERIENCES, experience, reglagesParDefaut, jouer } from './experiences.js';
import { LOIS } from './lois.js';
import { evaluer, nombre, BLOCS } from './formule.js';
import { Rendu, chargerImages } from './rendu.js';
import { IMAGES_PAR_SECONDE } from './moteur.js';

const CLE_SAUVEGARDE = 'eureka.progression.v1';

const $ = (s) => document.querySelector(s);

const etat = {
  exp: null,
  reglages: {},
  prediction: null,          // pointer: nombre ; chiffre: nombre ; choix: id ; mesures: { rouge, bleu }
  jetons: [],                // la formule du tableau noir
  grandeurs: {},             // h, t… mesurés au dernier lancement
  lancements: 0,
  trace: null,
  lecture: null,             // { t, vitesse, pause, fini }
  fantome: null,             // trajectoire du lancement précédent
  resultat: null,
  progression: charger(),
};

let rendu;
let monde;

// ---------------------------------------------------------------- sauvegarde

function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    if (brut) return JSON.parse(brut);
  } catch (e) { /* stockage indisponible : on joue sans mémoire */ }
  return { faites: {}, carnet: [] };
}

function sauver() {
  try { localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat.progression)); } catch (e) { /* idem */ }
}

function estDebloquee(exp) {
  const i = EXPERIENCES.indexOf(exp);
  return i === 0 || !!etat.progression.faites[EXPERIENCES[i - 1].id];
}

// ---------------------------------------------------------------- expérience

function choisir(id) {
  const exp = experience(id);
  if (!exp || !estDebloquee(exp)) return;
  etat.exp = exp;
  etat.reglages = reglagesParDefaut(exp);
  etat.prediction = exp.prediction.type === 'pointer' ? etat.reglages[exp.prediction.reglage] : exp.prediction.type === 'mesures' ? {} : null;
  etat.jetons = [];
  etat.grandeurs = {};
  etat.lancements = 0;
  etat.trace = null;
  etat.lecture = null;
  etat.fantome = null;
  etat.resultat = null;
  reconstruire();
  afficherTout();
}

function reconstruire() {
  monde = etat.exp.monde(etat.reglages);
}

function afficherTout() {
  afficherNavigation();
  afficherCourrier();
  afficherMontage();
  afficherTableau();
  afficherBudget();
  afficherResultat();
  afficherCarnet();
  dessiner();
}

// ---------------------------------------------------------------- panneaux

function afficherNavigation() {
  const nav = $('#experiences');
  nav.innerHTML = '';
  for (const exp of EXPERIENCES) {
    const b = document.createElement('button');
    const faite = etat.progression.faites[exp.id];
    const ouverte = estDebloquee(exp);
    b.className = 'exp' + (exp === etat.exp ? ' active' : '') + (faite ? ' faite' : '') + (ouverte ? '' : ' fermee');
    b.disabled = !ouverte;
    b.innerHTML = `<span class="num">${exp.numero}</span><span class="nom">${exp.titre}</span>${faite ? '<img class="ico" src="assets/img/ui/checkmark.png" alt="terminée">' : ouverte ? '' : '<img class="ico" src="assets/img/ui/locked.png" alt="verrouillée">'}`;
    b.addEventListener('click', () => choisir(exp.id));
    nav.appendChild(b);
  }
}

function afficherCourrier() {
  const { lettre } = etat.exp;
  $('#courrier').innerHTML = `
    <h2>Expérience ${etat.exp.numero} — ${etat.exp.titre}</h2>
    <p class="de">De : ${lettre.de}</p>
    <p class="texte">${lettre.texte}</p>
    <p class="objectif"><img src="assets/img/ui/target.png" alt=""> ${lettre.objectif}</p>`;
}

function afficherMontage() {
  const s = $('#montage');
  s.innerHTML = '<h2><img src="assets/img/ui/wrench.png" alt=""> Montage</h2>';
  for (const g of etat.exp.reglages) {
    const ligne = document.createElement('label');
    ligne.className = 'reglage';
    if (g.type === 'plage') {
      ligne.innerHTML = `<span class="libelle">${g.libelle}</span>
        <input type="range" min="${g.min}" max="${g.max}" step="${g.pas}" value="${etat.reglages[g.id]}" data-reglage="${g.id}">
        <output>${nombre(etat.reglages[g.id], 2)} ${g.unite}</output>`;
      const input = ligne.querySelector('input');
      input.addEventListener('input', () => {
        etat.reglages[g.id] = parseFloat(input.value);
        ligne.querySelector('output').textContent = `${nombre(etat.reglages[g.id], 2)} ${g.unite}`;
        if (etat.exp.prediction.type === 'pointer' && etat.exp.prediction.reglage === g.id) etat.prediction = etat.reglages[g.id];
        reconstruire();
        dessiner();
        afficherLancer();
      });
    } else if (g.type === 'choix') {
      ligne.innerHTML = `<span class="libelle">${g.libelle}</span><span class="choix"></span>`;
      const c = ligne.querySelector('.choix');
      for (const o of g.options) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = o.libelle;
        b.className = 'pastille ' + o.id + (etat.reglages[g.id] === o.id ? ' active' : '');
        b.addEventListener('click', () => {
          etat.reglages[g.id] = o.id;
          reconstruire();
          afficherMontage();
          dessiner();
        });
        c.appendChild(b);
      }
    }
    s.appendChild(ligne);
  }
  if (etat.exp.reglages.some((g) => g.deplacable)) {
    const p = document.createElement('p');
    p.className = 'aide';
    p.textContent = 'Tu peux aussi glisser le bécher directement sur la paillasse.';
    s.appendChild(p);
  }
}

function afficherTableau() {
  const s = $('#tableau');
  const p = etat.exp.prediction;
  s.innerHTML = `<h2>Tableau noir</h2><p class="consigne">${p.libelle}</p>`;
  if (p.type === 'pointer') {
    const out = document.createElement('p');
    out.className = 'valeur';
    out.id = 'tableau-pointer';
    out.textContent = `Bécher à ${nombre(etat.prediction, 2)} m`;
    s.appendChild(out);
  } else if (p.type === 'chiffre') {
    const ligne = document.createElement('label');
    ligne.className = 'saisie';
    ligne.innerHTML = `<input type="number" inputmode="decimal" step="0.01" min="0" placeholder="0,00" id="tableau-chiffre"> <span>${p.unite}</span>`;
    const input = ligne.querySelector('input');
    if (etat.prediction !== null) input.value = etat.prediction;
    input.addEventListener('input', () => {
      const v = parseFloat(String(input.value).replace(',', '.'));
      etat.prediction = Number.isFinite(v) ? v : null;
      afficherLancer();
    });
    s.appendChild(ligne);
  } else if (p.type === 'choix') {
    const c = document.createElement('div');
    c.className = 'choix';
    for (const o of p.options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = o.libelle;
      b.className = 'pastille ' + o.id + (etat.prediction === o.id ? ' active' : '');
      b.addEventListener('click', () => { etat.prediction = o.id; afficherTableau(); afficherLancer(); });
      c.appendChild(b);
    }
    s.appendChild(c);
  } else if (p.type === 'mesures') {
    afficherFormule(s);
    const champs = document.createElement('div');
    champs.className = 'champs';
    for (const c of p.champs) {
      const ligne = document.createElement('label');
      ligne.className = 'saisie';
      ligne.innerHTML = `<span class="libelle">${c.libelle}</span><input type="number" inputmode="decimal" step="0.01" min="0" placeholder="0,00" data-champ="${c.id}"> <span>${p.unite}</span>`;
      const input = ligne.querySelector('input');
      if (etat.prediction[c.id] !== undefined) input.value = etat.prediction[c.id];
      input.addEventListener('input', () => {
        const v = parseFloat(String(input.value).replace(',', '.'));
        if (Number.isFinite(v)) etat.prediction[c.id] = v; else delete etat.prediction[c.id];
        afficherLancer();
      });
      champs.appendChild(ligne);
    }
    s.appendChild(champs);
    const publier = document.createElement('button');
    publier.id = 'publier';
    publier.className = 'principal';
    publier.textContent = 'Publier les deux valeurs';
    publier.addEventListener('click', publierReponse);
    s.appendChild(publier);
  }
  afficherLancer();
}

/** Le tableau noir à blocs : on assemble une formule, elle s'évalue sur les mesures. */
function afficherFormule(s) {
  const bloc = document.createElement('div');
  bloc.className = 'formule';
  const g = etat.exp.grandeurs ? etat.exp.grandeurs(etat.reglages, etat.grandeurs) : {};
  const ev = evaluer(etat.jetons, g);
  bloc.innerHTML = `
    <p class="mesures-dispo">Mesuré : h = <b>${nombre(g.h, 1)} m</b>, t = <b>${g.t === undefined ? '— (lance une bille)' : nombre(g.t, 3) + ' s'}</b></p>
    <div class="ardoise" id="ardoise">${etat.jetons.length ? etat.jetons.map((j) => `<span class="jeton">${j}</span>`).join('') : '<span class="vide">Assemble ta formule avec les blocs.</span>'}
      <span class="egal">= ${ev.valeur !== undefined ? nombre(ev.valeur, 2) : '?'}</span></div>
    <div class="blocs"></div>
    <p class="erreur">${ev.erreur && etat.jetons.length ? ev.erreur : ''}</p>
    <div class="actions"></div>`;
  const blocs = bloc.querySelector('.blocs');
  const ajouter = (j, classe) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bloc ' + classe; b.textContent = j;
    b.addEventListener('click', () => { etat.jetons.push(j); afficherTableau(); });
    blocs.appendChild(b);
  };
  BLOCS.grandeurs.filter((j) => j in g).forEach((j) => ajouter(j, 'grandeur'));
  BLOCS.nombres.forEach((j) => ajouter(j, 'nombre'));
  BLOCS.operateurs.forEach((j) => ajouter(j, 'operateur'));
  const effacer = document.createElement('button');
  effacer.type = 'button'; effacer.className = 'bloc effacer'; effacer.textContent = '⌫';
  effacer.title = 'Effacer le dernier bloc';
  effacer.addEventListener('click', () => { etat.jetons.pop(); afficherTableau(); });
  blocs.appendChild(effacer);
  const actions = bloc.querySelector('.actions');
  if (ev.valeur !== undefined) {
    for (const c of etat.exp.prediction.champs) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'secondaire';
      b.textContent = `→ ${c.libelle}`;
      b.addEventListener('click', () => { etat.prediction[c.id] = Math.round(ev.valeur * 100) / 100; afficherTableau(); });
      actions.appendChild(b);
    }
  }
  s.appendChild(bloc);
}

function predictionPrete() {
  const p = etat.exp.prediction;
  if (p.type === 'pointer') return true;
  if (p.type === 'chiffre') return Number.isFinite(etat.prediction);
  if (p.type === 'choix') return !!etat.prediction;
  if (p.type === 'mesures') return true; // ici un lancement est une mesure, sans prédiction
  return false;
}

function budgetEpuise() { return etat.lancements >= etat.exp.budget; }

function afficherLancer() {
  const b = $('#lancer');
  const enLecture = etat.lecture && !etat.lecture.fini;
  b.disabled = enLecture || !predictionPrete() || budgetEpuise() || !!etat.progression.faites[etat.exp.id] && etat.resultat && etat.resultat.reussi;
  b.textContent = budgetEpuise() ? 'Budget épuisé' : etat.exp.prediction.type === 'mesures' ? 'Lancer (mesurer)' : 'Lancer';
  const pub = $('#publier');
  if (pub) {
    const p = etat.exp.prediction;
    pub.disabled = enLecture || budgetEpuise() || !p.champs.every((c) => Number.isFinite(etat.prediction[c.id]));
  }
}

function afficherBudget() {
  const restant = etat.exp.budget - etat.lancements;
  $('#budget').innerHTML = `Lancements : <b>${restant}</b> / ${etat.exp.budget}`;
  $('#budget').className = restant <= 1 ? 'alerte' : '';
}

function afficherResultat() {
  const s = $('#resultat');
  const r = etat.resultat;
  if (!r) { s.hidden = true; s.innerHTML = ''; return; }
  s.hidden = false;
  const lignes = Object.entries(r.mesures || {}).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  const titre = r.reussi ? 'Expérience terminée' : r.mesure ? 'Mesure' : 'Lecture';
  const classe = r.reussi ? 'reussi' : r.mesure ? 'mesure' : 'rate';
  s.className = 'panneau resultat ' + classe;
  s.innerHTML = `<h2>${titre}</h2><p class="message">${r.message}</p><table>${lignes}</table><div class="actions"></div>`;
  const actions = s.querySelector('.actions');
  const suivante = EXPERIENCES[EXPERIENCES.indexOf(etat.exp) + 1];
  if (r.reussi) {
    const infos = document.createElement('p');
    infos.className = 'bilan';
    infos.innerHTML = `${etat.lancements} lancement${etat.lancements > 1 ? 's' : ''}${r.premierCoup ? ' — <b>du premier coup</b>' : ''}. Une page s’ajoute au Carnet.`;
    s.insertBefore(infos, actions);
    if (suivante) {
      const b = document.createElement('button');
      b.className = 'principal';
      b.textContent = `Expérience suivante : ${suivante.titre}`;
      b.addEventListener('click', () => choisir(suivante.id));
      actions.appendChild(b);
    } else {
      const p = document.createElement('p');
      p.innerHTML = 'Le chapitre 1 est terminé. La suite s’écrit dans <b>FEUILLE_DE_ROUTE.md</b>.';
      actions.appendChild(p);
    }
  } else if (budgetEpuise()) {
    const b = document.createElement('button');
    b.className = 'principal';
    b.textContent = 'Recommencer l’expérience';
    b.addEventListener('click', () => choisir(etat.exp.id));
    actions.appendChild(b);
  } else {
    const b = document.createElement('button');
    b.className = 'secondaire';
    b.textContent = r.mesure ? 'Nouvelle mesure' : 'Corriger et relancer';
    b.addEventListener('click', () => { etat.resultat = null; etat.lecture = null; afficherResultat(); afficherLancer(); dessiner(); });
    actions.appendChild(b);
  }
}

function afficherCarnet() {
  const s = $('#carnet');
  const pages = etat.progression.carnet;
  s.innerHTML = `<h2>Carnet de laboratoire <small>${pages.length} page${pages.length > 1 ? 's' : ''}</small></h2>`;
  if (!pages.length) {
    s.innerHTML += '<p class="vide">Rien encore. Chaque expérience terminée écrit une page ici — avec tes mesures, pas celles du jeu.</p>';
    return;
  }
  for (const p of [...pages].reverse()) {
    const art = document.createElement('article');
    art.className = 'page';
    art.innerHTML = `<h3>${p.numero}. ${p.titre}</h3><p>${p.texte}</p><p class="meta">${p.date} — ${p.lancements} lancement${p.lancements > 1 ? 's' : ''}${p.premierCoup ? ', du premier coup' : ''}</p>`;
    s.appendChild(art);
  }
}

// ---------------------------------------------------------------- lancement

function lancer() {
  if (!predictionPrete() || budgetEpuise()) return;
  etat.lancements += 1;
  const p = etat.exp.prediction;
  const prediction = p.type === 'pointer' ? etat.reglages[p.reglage] : etat.prediction;
  reconstruire();
  etat.trace = jouer(etat.exp, etat.reglages);
  etat.resultat = null;
  etat.lecture = { t: 0, vitesse: 1, pause: false, fini: false, prediction, derniere: performance.now() };
  afficherBudget();
  afficherLancer();
  afficherResultat();
  $('#lecture-controles').hidden = false;
  requestAnimationFrame(boucle);
}

function boucle(maintenant) {
  const l = etat.lecture;
  if (!l || l.fini) return;
  const dt = Math.min(0.1, (maintenant - l.derniere) / 1000);
  l.derniere = maintenant;
  if (!l.pause) l.t += dt * l.vitesse;
  if (l.t >= etat.trace.duree) { l.t = etat.trace.duree; terminerLecture(); return; }
  dessiner();
  requestAnimationFrame(boucle);
}

function terminerLecture() {
  const l = etat.lecture;
  l.fini = true;
  $('#lecture-controles').hidden = true;
  const exp = etat.exp;
  const r = exp.juger(etat.reglages, l.prediction, etat.trace);
  if (r.grandeurs) Object.assign(etat.grandeurs, r.grandeurs);
  // Le fantôme : la trajectoire du premier corps, pour comparer au prochain lancement.
  etat.fantome = etat.trace.images.map((i) => ({ x: i.corps[0].x, y: i.corps[0].y }));
  conclure(r);
}

function publierReponse() {
  if (budgetEpuise()) return;
  const r = etat.exp.jugerReponse(etat.prediction, LOIS);
  if (!r.reussi) etat.lancements += 1;
  afficherBudget();
  conclure(r);
}

function conclure(r) {
  r.premierCoup = etat.lancements === 1;
  etat.resultat = r;
  if (r.reussi && !etat.progression.faites[etat.exp.id]) {
    const page = {
      id: etat.exp.id, numero: etat.exp.numero, titre: etat.exp.titre,
      texte: etat.exp.carnet(r), date: new Date().toLocaleDateString('fr-FR'),
      lancements: etat.lancements, premierCoup: r.premierCoup,
    };
    etat.progression.faites[etat.exp.id] = { lancements: etat.lancements, premierCoup: r.premierCoup };
    etat.progression.carnet.push(page);
    sauver();
    afficherNavigation();
    afficherCarnet();
  }
  afficherResultat();
  afficherLancer();
  if (etat.exp.prediction.type === 'mesures') afficherTableau();
  dessiner();
}

// ---------------------------------------------------------------- dessin

function imageCourante() {
  if (!etat.trace || !etat.lecture) return null;
  const i = Math.min(etat.trace.images.length - 1, Math.floor(etat.lecture.t * IMAGES_PAR_SECONDE));
  return etat.trace.images[i];
}

function dessiner() {
  if (!rendu || !monde) return;
  const options = {};
  const image = imageCourante();
  if (image) {
    options.image = image;
    const idx = etat.trace.images.indexOf(image);
    options.trainee = etat.trace.images.slice(Math.max(0, idx - 24), idx + 1).map((i) => ({ x: i.corps[0].x, y: i.corps[0].y }));
    if (monde.chrono) {
      const ci = monde.corps.findIndex((c) => c.id === monde.chrono);
      const contact = etat.trace.evenements.find((e) => e.type === 'contact' && e.corps === monde.chrono && e.sol);
      const tc = contact ? contact.t : etat.trace.duree;
      options.chrono = { t: Math.min(etat.lecture.t, tc), fige: etat.lecture.t >= tc };
      const jusqu = etat.trace.images.slice(0, idx + 1).filter((i) => i.t <= tc + 0.05);
      options.courbe = {
        points: jusqu.map((i) => ({ t: i.t, h: Math.max(0, i.corps[ci].y - monde.corps[ci].r) })),
        tMax: Math.max(0.5, tc * 1.05), hMax: Math.max(1, monde.corps[ci].y),
      };
    }
  } else if (etat.fantome) {
    options.fantome = etat.fantome;
  }
  rendu.dessiner(monde, options);
}

// ---------------------------------------------------------------- pointeur

function installerPointeur(canvas) {
  let glisse = null;
  canvas.addEventListener('pointerdown', (ev) => {
    const g = etat.exp && etat.exp.reglages.find((r) => r.deplacable);
    if (!g || (etat.lecture && !etat.lecture.fini)) return;
    const m = rendu.versMetres(ev);
    const d = monde.dessins.find((x) => x.type === 'becher');
    if (d && Math.abs(m.x - d.x) < d.largeur && m.y < d.hauteur + 0.5) {
      glisse = { reglage: g, decalage: d.x - m.x };
      canvas.setPointerCapture(ev.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!glisse) return;
    const m = rendu.versMetres(ev);
    const g = glisse.reglage;
    let v = Math.round((m.x + glisse.decalage) / g.pas) * g.pas;
    v = Math.max(g.min, Math.min(g.max, v));
    etat.reglages[g.id] = v;
    if (etat.exp.prediction.type === 'pointer') etat.prediction = v;
    const input = document.querySelector(`input[data-reglage="${g.id}"]`);
    if (input) { input.value = v; input.parentElement.querySelector('output').textContent = `${nombre(v, 2)} ${g.unite}`; }
    const out = $('#tableau-pointer');
    if (out) out.textContent = `Bécher à ${nombre(v, 2)} m`;
    reconstruire();
    dessiner();
  });
  const fin = () => { glisse = null; };
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
}

// ---------------------------------------------------------------- lecture

function installerLecture() {
  $('#lecture-pause').addEventListener('click', () => {
    if (!etat.lecture) return;
    etat.lecture.pause = !etat.lecture.pause;
    $('#lecture-pause').classList.toggle('active', etat.lecture.pause);
  });
  $('#lecture-ralenti').addEventListener('click', () => {
    if (!etat.lecture) return;
    etat.lecture.vitesse = etat.lecture.vitesse === 1 ? 0.25 : 1;
    $('#lecture-ralenti').classList.toggle('active', etat.lecture.vitesse !== 1);
  });
  $('#lecture-fin').addEventListener('click', () => {
    if (!etat.lecture || etat.lecture.fini) return;
    etat.lecture.t = etat.trace.duree;
    terminerLecture();
  });
}

// ---------------------------------------------------------------- démarrage

export async function demarrer() {
  const canvas = $('#scene');
  const images = await chargerImages();
  rendu = new Rendu(canvas, images);
  installerPointeur(canvas);
  installerLecture();
  $('#lancer').addEventListener('click', lancer);
  $('#effacer-progression').addEventListener('click', () => {
    if (!confirm('Effacer le Carnet et recommencer le chapitre ?')) return;
    etat.progression = { faites: {}, carnet: [] };
    sauver();
    choisir(EXPERIENCES[0].id);
  });
  // On reprend à la première expérience non terminée.
  const premiere = EXPERIENCES.find((e) => !etat.progression.faites[e.id]) || EXPERIENCES[EXPERIENCES.length - 1];
  choisir(premiere.id);
  window.eureka = { etat, choisir, lancer, EXPERIENCES }; // pour les tests navigateur
}

demarrer();
