// Les expériences du chapitre 1, « La chute ». Chacune décrit :
//  - la lettre (la question, qui l'envoie, la tolérance, le budget de lancements) ;
//  - le montage : les réglages laissés au joueur ;
//  - la prédiction attendue au tableau noir (pointer, chiffrer, choisir, mesurer) ;
//  - comment construire le monde à simuler, et comment juger le résultat ;
//  - ce que le Carnet retient quand l'expérience est terminée.
//
// Tout est pur : aucune référence au DOM, pour que les tests rejouent les expériences.

import { simuler, tempsDeChute } from './moteur.js';
import { nombre } from './formule.js';

const R = 0.25;             // rayon d'une bille (m)
const LARGEUR = 10;         // largeur de la paillasse (m)
const HAUTEUR = 6;          // hauteur visible (m)

function parois() {
  return [
    { id: 'sol', x1: 0, y1: 0, x2: LARGEUR, y2: 0, sol: true, frottement: 0.08 },
    { id: 'mur-gauche', x1: 0, y1: 0, x2: 0, y2: HAUTEUR },
    { id: 'mur-droit', x1: LARGEUR, y1: 0, x2: LARGEUR, y2: HAUTEUR },
  ];
}

/** Un bécher posé sur le sol : deux parois de verre et une zone capteur entre elles. */
function becher(x, largeur = 1.2, hauteur = 0.45) {
  const e = 0.06;
  return {
    segments: [
      { id: 'becher-g', x1: x - largeur / 2, y1: 0, x2: x - largeur / 2, y2: hauteur, restitution: 0.2 },
      { id: 'becher-d', x1: x + largeur / 2, y1: 0, x2: x + largeur / 2, y2: hauteur, restitution: 0.2 },
    ],
    zone: { id: 'becher', x: x - largeur / 2 + e, y: 0, w: largeur - 2 * e, h: hauteur },
    dessin: { type: 'becher', x, largeur, hauteur },
  };
}

function bille(id, x, hauteurBas, couleur = 'gris', m = 1) {
  return { id, x, y: hauteurBas + R, r: R, couleur, m };
}

function delta(a, b) { return Math.abs(a - b); }

export const EXPERIENCES = [
  {
    id: 'becher',
    numero: 1,
    titre: 'Dans le bécher',
    lettre: {
      de: 'La directrice de station',
      texte: 'Bienvenue à bord. Avant les grandes questions, un geste simple : une bille grise dévale la rampe et saute. Place le bécher là où tu penses qu’elle retombera. Pas de calcul, juste ton œil. Tu as trois essais.',
      objectif: 'La bille finit dans le bécher.',
    },
    budget: 3,
    reglages: [
      { id: 'becherX', libelle: 'Position du bécher', type: 'plage', min: 4, max: 9.4, pas: 0.05, valeur: 6.5, unite: 'm', deplacable: true },
    ],
    prediction: { type: 'pointer', reglage: 'becherX', libelle: 'Où la bille va-t-elle retomber ? Glisse le bécher (ou le curseur).' },
    monde(r) {
      const b = becher(r.becherX);
      return {
        corps: [bille('bille', 1.27, 3.42)],
        segments: [...parois(), { id: 'rampe', x1: 1, y1: 3.2, x2: 3.2, y2: 1.4 }, ...b.segments],
        zones: [b.zone],
        dessins: [{ type: 'rampe', x1: 1, y1: 3.2, x2: 3.2, y2: 1.4 }, b.dessin],
        dureeMax: 8,
      };
    },
    juger(r, p, trace) {
      const fin = trace.corps.find((c) => c.id === 'bille');
      const reussi = fin.dort && fin.zones.includes('becher');
      const contact = trace.evenements.find((e) => e.type === 'contact' && e.corps === 'bille' && e.sol);
      const image = contact && trace.images.find((i) => i.t >= contact.t);
      const xChute = image ? image.corps[0].x : fin.x;
      return {
        reussi,
        mesures: { 'Premier contact avec le sol': `${nombre(xChute)} m`, 'Bécher placé à': `${nombre(r.becherX)} m` },
        message: reussi ? 'Dans le mille : la bille est dans le bécher.' : `Raté : la bille a touché le sol à ${nombre(xChute)} m, le bécher était à ${nombre(r.becherX)} m.`,
      };
    },
    carnet: (etat) => `La bille lâchée en haut de la rampe retombe toujours au même endroit : ${etat.mesures['Premier contact avec le sol']}. Un lancement se répète à l’identique — c’est la première chose que cette station m’apprend.`,
  },
  {
    id: 'chrono',
    numero: 2,
    titre: 'Le chrono',
    lettre: {
      de: 'La directrice de station',
      texte: 'Maintenant on chiffre. Une bille grise est lâchée de 4 mètres. Combien de temps met-elle à toucher le sol ? Le chronomètre part au lâcher. Règle la hauteur comme tu veux pour mesurer, puis écris ta prédiction au tableau. Je veux le temps à un vingtième de seconde près.',
      objectif: 'Prédire le temps de chute depuis 4 m à ±0,05 s.',
    },
    budget: 3,
    reglages: [
      { id: 'hauteur', libelle: 'Hauteur de lâcher', type: 'plage', min: 1, max: 5, pas: 0.1, valeur: 4, unite: 'm' },
    ],
    prediction: { type: 'chiffre', libelle: 'Temps de chute depuis 4 m', unite: 's', tolerance: 0.05, decimales: 2 },
    grandeurs: (r, mesures) => ({ h: r.hauteur, t: mesures.t }),
    monde(r) {
      return {
        corps: [bille('bille', 5, r.hauteur)],
        segments: parois(),
        zones: [],
        dessins: [{ type: 'lacher', x: 5, y: r.hauteur }],
        chrono: 'bille',
        dureeMax: 6,
      };
    },
    juger(r, p, trace) {
      const t = tempsDeChute(trace, 'bille');
      const mesures = { 'Hauteur': `${nombre(r.hauteur, 1)} m`, 'Temps de chute': `${nombre(t, 3)} s` };
      if (Math.abs(r.hauteur - 4) > 1e-9) {
        return { reussi: false, mesures, grandeurs: { t }, message: `Mesure faite depuis ${nombre(r.hauteur, 1)} m : ${nombre(t, 2)} s. La question porte sur 4 m.` };
      }
      const ecart = delta(p, t);
      const reussi = ecart <= 0.05;
      return {
        reussi, mesures, grandeurs: { t },
        message: reussi ? `Juste : tu avais dit ${nombre(p)} s, la bille a mis ${nombre(t)} s.` : `Écart de ${nombre(ecart)} s : tu avais dit ${nombre(p)} s, la bille a mis ${nombre(t)} s.`,
      };
    },
    carnet: (etat) => `Depuis 4 m, une bille grise touche le sol en ${etat.mesures['Temps de chute']}. Ce n’est pas ce qu’elle mettrait sur Terre — ici, tout tombe plus lentement.`,
  },
  {
    id: 'masses',
    numero: 3,
    titre: 'Deux billes',
    lettre: {
      de: 'Ilan, paillasse voisine',
      texte: 'Petit pari entre collègues. Deux billes grises, même hauteur, mais l’une pèse trois fois l’autre. Laquelle touche le sol en premier ? Dis-le avant de lâcher. Tu as deux essais, mais un chercheur n’en a besoin que d’un.',
      objectif: 'Prédire laquelle arrive en premier.',
    },
    budget: 2,
    reglages: [
      { id: 'hauteur', libelle: 'Hauteur de lâcher', type: 'plage', min: 1, max: 5, pas: 0.1, valeur: 4, unite: 'm' },
    ],
    prediction: {
      type: 'choix', libelle: 'Qui touche le sol en premier ?',
      options: [{ id: 'lourde', libelle: 'La lourde (3 kg)' }, { id: 'legere', libelle: 'La légère (1 kg)' }, { id: 'ensemble', libelle: 'Les deux ensemble' }],
    },
    monde(r) {
      return {
        corps: [bille('lourde', 3.5, r.hauteur, 'gris', 3), bille('legere', 6.5, r.hauteur, 'gris', 1)],
        segments: parois(),
        zones: [],
        dessins: [{ type: 'lacher', x: 3.5, y: r.hauteur, etiquette: '3 kg' }, { type: 'lacher', x: 6.5, y: r.hauteur, etiquette: '1 kg' }],
        chrono: 'lourde',
        dureeMax: 6,
      };
    },
    juger(r, p, trace) {
      const tl = tempsDeChute(trace, 'lourde');
      const tg = tempsDeChute(trace, 'legere');
      const verdict = delta(tl, tg) < 0.02 ? 'ensemble' : (tl < tg ? 'lourde' : 'legere');
      const reussi = p === verdict;
      const mesures = { 'Lourde (3 kg)': `${nombre(tl, 3)} s`, 'Légère (1 kg)': `${nombre(tg, 3)} s` };
      return {
        reussi, mesures, verdict,
        message: reussi ? 'Bien vu : elles touchent le sol ensemble. Le poids ne change rien.' : 'Regarde le chrono : elles ont touché le sol au même instant. Le poids ne change rien.',
      };
    },
    carnet: () => 'Lourde ou légère, deux billes grises lâchées ensemble touchent le sol ensemble. Ilan me doit un café.',
  },
  {
    id: 'couleurs',
    numero: 4,
    titre: 'La rouge et la bleue',
    lettre: {
      de: 'Ilan, paillasse voisine',
      texte: 'Revanche. Même montage, même hauteur, même masse — mais une bille rouge et une bille bleue, du stock de la station. Laquelle arrive en premier ? Facile, non ?',
      objectif: 'Prédire laquelle arrive en premier.',
    },
    budget: 2,
    reglages: [
      { id: 'hauteur', libelle: 'Hauteur de lâcher', type: 'plage', min: 1, max: 5, pas: 0.1, valeur: 4, unite: 'm' },
    ],
    prediction: {
      type: 'choix', libelle: 'Qui touche le sol en premier ?',
      options: [{ id: 'rouge', libelle: 'La rouge' }, { id: 'bleue', libelle: 'La bleue' }, { id: 'ensemble', libelle: 'Les deux ensemble' }],
    },
    monde(r) {
      return {
        corps: [bille('rouge', 3.5, r.hauteur, 'rouge'), bille('bleue', 6.5, r.hauteur, 'bleu')],
        segments: parois(),
        zones: [],
        dessins: [{ type: 'lacher', x: 3.5, y: r.hauteur }, { type: 'lacher', x: 6.5, y: r.hauteur }],
        chrono: 'rouge',
        dureeMax: 6,
      };
    },
    juger(r, p, trace) {
      const tr = tempsDeChute(trace, 'rouge');
      const tb = tempsDeChute(trace, 'bleue');
      const verdict = delta(tr, tb) < 0.02 ? 'ensemble' : (tr < tb ? 'rouge' : 'bleue');
      const reussi = p === verdict;
      const mesures = { 'Rouge': `${nombre(tr, 3)} s`, 'Bleue': `${nombre(tb, 3)} s` };
      return {
        reussi, mesures, verdict,
        message: reussi ? 'Tu avais raison — et ce n’est pas normal. Regarde encore le chrono.' : `Ce n’est pas normal : la rouge a touché le sol à ${nombre(tr)} s, la bleue à ${nombre(tb)} s. Même hauteur, même masse. Pourquoi ?`,
      };
    },
    carnet: (etat) => `Une bille rouge et une bille bleue, même masse, même hauteur : la rouge touche le sol en ${etat.mesures['Rouge']}, la bleue en ${etat.mesures['Bleue']}. Ce n’est pas une erreur de mesure. Ici, la couleur compte. Pourquoi ?`,
  },
  {
    id: 'loi',
    numero: 5,
    titre: 'La loi de la couleur',
    lettre: {
      de: 'La directrice de station',
      texte: 'Ilan m’a montré votre chrono. Si la couleur change la chute, alors chaque couleur a sa pesanteur. Mesure-la : lâche des billes, lis le chrono, et calcule au tableau (une chute libre suit h = ½·g·t², donc g = 2·h ÷ t²). Donne-moi g pour la rouge et pour la bleue, à 5 % près. Six lancements de budget ; chaque réponse fausse en coûte un.',
      objectif: 'Mesurer la pesanteur de la rouge et de la bleue à 5 % près.',
    },
    budget: 6,
    reglages: [
      { id: 'couleur', libelle: 'Couleur de la bille', type: 'choix', options: [{ id: 'rouge', libelle: 'Rouge' }, { id: 'bleu', libelle: 'Bleue' }, { id: 'gris', libelle: 'Grise' }], valeur: 'rouge' },
      { id: 'hauteur', libelle: 'Hauteur de lâcher', type: 'plage', min: 1, max: 5, pas: 0.1, valeur: 4, unite: 'm' },
    ],
    prediction: {
      type: 'mesures', libelle: 'Les pesanteurs mesurées', tolerance: 0.05, unite: 'm/s²', decimales: 2,
      champs: [{ id: 'rouge', libelle: 'g de la rouge' }, { id: 'bleu', libelle: 'g de la bleue' }],
      formule: true,
    },
    grandeurs: (r, mesures) => ({ h: r.hauteur, t: mesures.t }),
    monde(r) {
      return {
        corps: [bille('bille', 5, r.hauteur, r.couleur)],
        segments: parois(),
        zones: [],
        dessins: [{ type: 'lacher', x: 5, y: r.hauteur }],
        chrono: 'bille',
        dureeMax: 6,
      };
    },
    // Ici, un lancement est une mesure : il ne juge rien, il renseigne.
    juger(r, p, trace) {
      const t = tempsDeChute(trace, 'bille');
      return {
        reussi: false, mesure: true, grandeurs: { t },
        mesures: { 'Couleur': r.couleur === 'bleu' ? 'bleue' : r.couleur, 'Hauteur': `${nombre(r.hauteur, 1)} m`, 'Temps de chute': `${nombre(t, 3)} s` },
        message: `Mesure : la ${r.couleur === 'bleu' ? 'bleue' : r.couleur} tombe de ${nombre(r.hauteur, 1)} m en ${nombre(t, 3)} s. Au tableau : g = 2 × h ÷ t².`,
      };
    },
    // La réponse est jugée contre les lois, jamais contre un lancement.
    jugerReponse(p, lois) {
      const details = {};
      let reussi = true;
      for (const c of ['rouge', 'bleu']) {
        const vrai = lois.gravite[c];
        const ok = p[c] !== undefined && Math.abs(p[c] - vrai) <= 0.05 * vrai;
        details[c] = ok;
        if (!ok) reussi = false;
      }
      const mesures = { 'g de la rouge (ta valeur)': `${nombre(p.rouge)} m/s²`, 'g de la bleue (ta valeur)': `${nombre(p.bleu)} m/s²` };
      return {
        reussi, mesures, details,
        message: reussi ? 'Publié. Deux pesanteurs, deux couleurs : c’est la première loi de ce monde.' : `Ce n’est pas assez précis (${details.rouge ? 'la bleue' : details.bleu ? 'la rouge' : 'les deux'}). Remesure et recalcule.`,
      };
    },
    carnet: (etat) => `LOI N° 1 — La pesanteur dépend de la couleur. Mesuré : rouge ${etat.mesures['g de la rouge (ta valeur)']}, bleue ${etat.mesures['g de la bleue (ta valeur)']}. La grise, elle, tombe entre les deux. Reste à savoir pourquoi — et ce que voient les billes que nous ne voyons pas.`,
  },
];

export function experience(id) { return EXPERIENCES.find((e) => e.id === id); }

/** Valeurs par défaut des réglages d'une expérience. */
export function reglagesParDefaut(exp) {
  const r = {};
  for (const g of exp.reglages) r[g.id] = g.valeur;
  return r;
}

/** Joue une expérience avec des réglages et renvoie la trace. */
export function jouer(exp, reglages) {
  return simuler(exp.monde(reglages));
}
