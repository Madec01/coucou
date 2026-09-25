// Le tableau noir : une formule assemblée par blocs, évaluée sur les grandeurs mesurées.
//
// Les blocs sont des jetons : des grandeurs (h, t, m…), des nombres, des opérateurs
// (+ − × ÷), le carré (²) et les parenthèses. On les assemble en cliquant ; ici on
// les évalue avec un petit analyseur à priorité (², puis × ÷, puis + −).

export const BLOCS = Object.freeze({
  grandeurs: ['h', 't', 'm'],
  nombres: ['2', '10'],
  operateurs: ['+', '−', '×', '÷', '²', '(', ')'],
});

/**
 * Évalue une liste de jetons avec un dictionnaire de valeurs.
 * Renvoie { valeur } ou { erreur } (message en français), jamais une exception.
 */
export function evaluer(jetons, valeurs) {
  if (!jetons.length) return { erreur: 'Le tableau est vide.' };
  let i = 0;
  const fini = () => i >= jetons.length;
  const voir = () => jetons[i];

  function facteur() {
    if (fini()) throw new Error('Il manque quelque chose à la fin.');
    const j = jetons[i++];
    let v;
    if (j === '(') {
      v = somme();
      if (voir() !== ')') throw new Error('Une parenthèse n’est pas fermée.');
      i++;
    } else if (j === '−' ) {
      v = -facteur();
    } else if (/^\d+([.,]\d+)?$/.test(j)) {
      v = parseFloat(j.replace(',', '.'));
    } else if (Object.prototype.hasOwnProperty.call(valeurs, j)) {
      v = valeurs[j];
      if (v === undefined || v === null || Number.isNaN(v)) throw new Error(`« ${j} » n’a pas encore été mesuré.`);
    } else {
      throw new Error(`Je ne connais pas « ${j} ».`);
    }
    while (voir() === '²') { i++; v = v * v; }
    return v;
  }
  function produit() {
    let v = facteur();
    while (voir() === '×' || voir() === '÷') {
      const op = jetons[i++];
      const d = facteur();
      if (op === '÷') {
        if (d === 0) throw new Error('Division par zéro.');
        v /= d;
      } else v *= d;
    }
    return v;
  }
  function somme() {
    let v = produit();
    while (voir() === '+' || voir() === '−') {
      const op = jetons[i++];
      const d = produit();
      v = op === '+' ? v + d : v - d;
    }
    return v;
  }
  try {
    const valeur = somme();
    if (!fini()) throw new Error(`Je ne sais pas quoi faire de « ${voir()} ».`);
    if (!Number.isFinite(valeur)) throw new Error('Le résultat n’est pas un nombre.');
    return { valeur };
  } catch (e) {
    return { erreur: e.message };
  }
}

/** Écrit un nombre à la française, avec la virgule et un nombre fixe de décimales. */
export function nombre(v, decimales = 2) {
  if (v === undefined || v === null || Number.isNaN(v)) return '—';
  return v.toFixed(decimales).replace('.', ',');
}
