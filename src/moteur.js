// Moteur physique 2D de la paillasse : des billes (cercles) et des parois (segments).
//
// Il est DÉTERMINISTE : même monde, même trace, au bit près. C'est ce qui rend la
// prédiction honnête et les tests rejouables sans navigateur. Pas de Math.random,
// pas d'horloge, un pas de temps fixe.
//
// Unités : mètres, secondes, kilogrammes. L'axe y monte (0 = le sol de la paillasse).
// Le rendu fait la conversion vers les pixels ; le moteur n'en sait rien.

import { gravite as graviteParDefaut } from './lois.js';

export const PAS = 1 / 240;          // pas d'intégration (s)
export const IMAGES_PAR_SECONDE = 60; // cadence de la trace rejouable
const PAS_PAR_IMAGE = Math.round(1 / PAS / IMAGES_PAR_SECONDE);

const SEUIL_REBOND = 0.35;   // sous cette vitesse normale (m/s), on ne rebondit plus
const VITESSE_SOMMEIL = 0.03; // sous cette vitesse (m/s)…
const DUREE_SOMMEIL = 0.4;    // …pendant ce temps (s), la bille s'endort

/**
 * Simule un monde et renvoie sa trace.
 *
 * monde = {
 *   corps:    [{ id, x, y, r, m, couleur, vx, vy, restitution, frottement }],
 *   segments: [{ id, x1, y1, x2, y2, restitution, frottement, sol }],
 *   zones:    [{ id, x, y, w, h }],           // rectangles capteurs (coin bas-gauche)
 *   dureeMax: 10,                              // s
 *   gravite:  (corps) => g                     // optionnel, sinon les lois du jeu
 * }
 *
 * trace = {
 *   images:     [{ t, corps: [{ x, y, vx, vy, angle }] }],   // à 60 Hz
 *   evenements: [{ t, type, corps, ... }],
 *   duree,      // s
 *   fin: 'repos' | 'temps'
 * }
 */
export function simuler(monde) {
  const g = monde.gravite || graviteParDefaut;
  const corps = monde.corps.map((c) => ({
    id: c.id, x: c.x, y: c.y, r: c.r, m: c.m || 1, couleur: c.couleur || 'gris',
    vx: c.vx || 0, vy: c.vy || 0, angle: 0,
    restitution: c.restitution === undefined ? 0.3 : c.restitution,
    frottement: c.frottement === undefined ? 0.05 : c.frottement,
    dort: false, immobileDepuis: 0, touche: new Set(), dansZone: new Set(),
  }));
  const segments = monde.segments.map((s) => ({
    restitution: 0.3, frottement: 0.05, sol: false, ...s,
    dx: s.x2 - s.x1, dy: s.y2 - s.y1,
  }));
  for (const s of segments) s.l2 = s.dx * s.dx + s.dy * s.dy;
  const zones = monde.zones || [];
  const dureeMax = monde.dureeMax || 10;

  const images = [];
  const evenements = [];
  let t = 0;
  let pas = 0;
  let fin = 'temps';

  const photographier = () => images.push({
    t: arrondir(t),
    corps: corps.map((c) => ({ x: c.x, y: c.y, vx: c.vx, vy: c.vy, angle: c.angle })),
  });
  photographier();

  while (t < dureeMax) {
    for (const c of corps) {
      if (c.dort) continue;
      // Intégration semi-implicite : la vitesse d'abord, la position ensuite.
      c.vy -= g(c) * PAS;
      c.x += c.vx * PAS;
      c.y += c.vy * PAS;
      c.angle += (c.vx / c.r) * PAS;

      for (const s of segments) {
        const contact = collision(c, s);
        if (!contact) continue;
        if (!c.touche.has(s.id)) {
          c.touche.add(s.id);
          evenements.push({ t: arrondir(t + PAS), type: 'contact', corps: c.id, segment: s.id, sol: !!s.sol });
        }
      }
      for (const z of zones) {
        const dedans = c.x >= z.x && c.x <= z.x + z.w && c.y >= z.y && c.y <= z.y + z.h;
        if (dedans && !c.dansZone.has(z.id)) {
          c.dansZone.add(z.id);
          evenements.push({ t: arrondir(t + PAS), type: 'zone', corps: c.id, zone: z.id });
        } else if (!dedans && c.dansZone.has(z.id)) {
          c.dansZone.delete(z.id);
        }
      }
      // Sommeil : une bille quasi immobile un certain temps s'arrête pour de bon.
      const v = Math.hypot(c.vx, c.vy);
      if (v < VITESSE_SOMMEIL && c.touche.size > 0) {
        c.immobileDepuis += PAS;
        if (c.immobileDepuis >= DUREE_SOMMEIL) {
          c.dort = true; c.vx = 0; c.vy = 0;
          evenements.push({ t: arrondir(t + PAS), type: 'repos', corps: c.id, x: c.x, y: c.y });
        }
      } else {
        c.immobileDepuis = 0;
      }
    }
    t += PAS;
    pas += 1;
    if (pas % PAS_PAR_IMAGE === 0) photographier();
    if (corps.every((c) => c.dort)) { fin = 'repos'; break; }
  }
  if (pas % PAS_PAR_IMAGE !== 0) photographier();

  return {
    images, evenements, duree: arrondir(t), fin,
    corps: corps.map((c) => ({ id: c.id, x: c.x, y: c.y, dort: c.dort, zones: [...c.dansZone] })),
  };
}

/** Résout la collision d'un cercle avec un segment ; renvoie vrai s'il y a eu contact. */
function collision(c, s) {
  // Point du segment le plus proche du centre.
  let u = ((c.x - s.x1) * s.dx + (c.y - s.y1) * s.dy) / s.l2;
  if (u < 0) u = 0; else if (u > 1) u = 1;
  const px = s.x1 + u * s.dx;
  const py = s.y1 + u * s.dy;
  let nx = c.x - px;
  let ny = c.y - py;
  const d = Math.hypot(nx, ny);
  if (d >= c.r) return false;
  if (d < 1e-9) {
    // Centre exactement sur le segment : on pousse du côté de la normale gauche.
    const l = Math.sqrt(s.l2);
    nx = -s.dy / l; ny = s.dx / l;
  } else {
    nx /= d; ny /= d;
  }
  // Sortie de l'interpénétration.
  c.x += nx * (c.r - d);
  c.y += ny * (c.r - d);
  // Réponse en vitesse.
  const vn = c.vx * nx + c.vy * ny;
  if (vn >= 0) return true;
  const e = -vn < SEUIL_REBOND ? 0 : Math.min(c.restitution, s.restitution);
  const j = -(1 + e) * vn;
  c.vx += j * nx;
  c.vy += j * ny;
  // Frottement de Coulomb sur la composante tangentielle.
  const mu = Math.max(c.frottement, s.frottement);
  let tx = c.vx - (c.vx * nx + c.vy * ny) * nx;
  let ty = c.vy - (c.vx * nx + c.vy * ny) * ny;
  const vt = Math.hypot(tx, ty);
  if (vt > 1e-9) {
    const jt = Math.min(mu * j, vt);
    tx /= vt; ty /= vt;
    c.vx -= tx * jt;
    c.vy -= ty * jt;
  }
  return true;
}

function arrondir(t) { return Math.round(t * 1e6) / 1e6; }

/** Premier événement d'un type donné pour un corps ; undefined s'il n'y en a pas. */
export function premier(trace, type, corpsId, filtre) {
  return trace.evenements.find((e) => e.type === type && e.corps === corpsId && (!filtre || filtre(e)));
}

/** Temps du premier contact d'un corps avec un segment « sol ». */
export function tempsDeChute(trace, corpsId) {
  const e = premier(trace, 'contact', corpsId, (ev) => ev.sol);
  return e ? e.t : undefined;
}
