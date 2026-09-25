// Les lois de ce monde. Elles sont cohérentes mais décalées des nôtres, et le joueur
// ne les lit jamais : il les mesure. Ce fichier est la seule source de vérité du moteur.
//
// Chapitre 1, « La chute » : la pesanteur dépend de la couleur de l'objet.

export const LOIS = Object.freeze({
  // Pesanteur (m/s²) selon la couleur. Le gris est la « vraie » pesanteur de la planète.
  gravite: Object.freeze({ gris: 6.2, rouge: 8.4, bleu: 4.7 }),
});

export const COULEURS = Object.freeze(Object.keys(LOIS.gravite));

/** Pesanteur qui s'applique à un corps, selon sa couleur. */
export function gravite(corps) {
  const g = LOIS.gravite[corps.couleur];
  return g === undefined ? LOIS.gravite.gris : g;
}
