// Les espèces du lac. Les images viennent du pack poissons de Kenney (deux poses chacune).
// `portee` dit à quelle distance du bord on les trouve ; `vigueur` la force de leurs rushs.

export const ESPECES = [
  { id: 'gardon', nom: 'Gardon vert', tuiles: ['fishTile_072', 'fishTile_073'], taille: [12, 28], portee: [0, 0.5], vigueur: 0.5, rarete: 1 },
  { id: 'rosette', nom: 'Rosette des roseaux', tuiles: ['fishTile_074', 'fishTile_075'], taille: [10, 22], portee: [0, 0.4], vigueur: 0.4, rarete: 1 },
  { id: 'bleu', nom: 'Bleu du large', tuiles: ['fishTile_076', 'fishTile_077'], taille: [25, 55], portee: [0.4, 1], vigueur: 0.8, rarete: 0.7 },
  { id: 'rouge', nom: 'Rouge de fond', tuiles: ['fishTile_078', 'fishTile_079'], taille: [30, 70], portee: [0.5, 1], vigueur: 1, rarete: 0.5 },
  { id: 'dore', nom: 'Doré', tuiles: ['fishTile_080', 'fishTile_081'], taille: [20, 45], portee: [0.2, 0.8], vigueur: 0.7, rarete: 0.8 },
  { id: 'globe', nom: 'Globe', tuiles: ['fishTile_100', 'fishTile_101'], taille: [15, 35], portee: [0.6, 1], vigueur: 0.6, rarete: 0.25 },
  { id: 'anguille', nom: 'Anguille', tuiles: ['fishTile_102', 'fishTile_103'], taille: [40, 90], portee: [0, 0.6], vigueur: 0.9, rarete: 0.3 },
];

export function espece(id) { return ESPECES.find((e) => e.id === id); }

/** Tire un poisson selon la distance du lancer (0 = au bord, 1 = au plus loin). */
export function tirerPoisson(portee, alea = Math.random) {
  const candidats = ESPECES.filter((e) => portee >= e.portee[0] - 0.1 && portee <= e.portee[1] + 0.1);
  const total = candidats.reduce((s, e) => s + e.rarete, 0);
  let r = alea() * total;
  let choix = candidats[candidats.length - 1];
  for (const e of candidats) { r -= e.rarete; if (r <= 0) { choix = e; break; } }
  // Plus loin, plus gros : la taille est tirée vers le haut de la fourchette.
  const [min, max] = choix.taille;
  const u = alea();
  const taille = Math.round(min + (max - min) * (0.3 * u + 0.7 * u * (0.5 + portee / 2)));
  return {
    espece: choix.id, nom: choix.nom, tuiles: choix.tuiles,
    taille, poids: poids(choix, taille), vigueur: choix.vigueur,
  };
}

/** Poids en kg, d'après la taille (loi cubique, arrondie au dixième). */
export function poids(esp, taille) {
  const k = esp.id === 'anguille' ? 0.004 : esp.id === 'globe' ? 0.03 : 0.018;
  return Math.max(0.1, Math.round(k * Math.pow(taille / 10, 3) * 10) / 10);
}
