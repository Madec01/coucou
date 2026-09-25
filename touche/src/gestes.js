// Les gestes : on lit un flux d'échantillons de capteurs (rotation en °/s, accélération
// en m/s², inclinaison en °) et on en tire des événements nets : un coup de poignet, un
// lancer, un pompage. Tout est pur : pas de DOM, pas d'horloge, on rejoue en Node.

/** Norme d'un vecteur { x, y, z } ou { alpha, beta, gamma }. */
export function norme(v) {
  if (!v) return 0;
  const a = v.x ?? v.alpha ?? 0, b = v.y ?? v.beta ?? 0, c = v.z ?? v.gamma ?? 0;
  return Math.sqrt(a * a + b * b + c * c);
}

/**
 * Détecteur de pic : une grandeur dépasse un seuil, atteint un sommet, puis redescend
 * sous la moitié du seuil. On émet alors le sommet. Un temps de repos évite les doublons.
 */
export class DetecteurPic {
  constructor({ seuil = 250, repos = 400 } = {}) {
    this.seuil = seuil;
    this.repos = repos;
    this.enCours = false;
    this.sommet = 0;
    this.tSommet = 0;
    this.dernier = -Infinity;
  }
  /** Renvoie { pic, t } quand un pic vient de se terminer, sinon null. */
  alimenter(valeur, t) {
    if (!this.enCours) {
      if (valeur >= this.seuil && t - this.dernier >= this.repos) {
        this.enCours = true; this.sommet = valeur; this.tSommet = t;
      }
      return null;
    }
    if (valeur > this.sommet) { this.sommet = valeur; this.tSommet = t; }
    if (valeur < this.seuil * 0.5) {
      this.enCours = false;
      this.dernier = t;
      return { pic: this.sommet, t: this.tSommet };
    }
    return null;
  }
}

/**
 * Pompage : on lève le téléphone (inclinaison vers soi au-dessus de `haut`), puis on le
 * rabaisse (sous `bas`). Un aller-retour = un pompage. `beta` est l'inclinaison avant-arrière.
 */
export class DetecteurPompage {
  constructor({ haut = 40, bas = 15 } = {}) {
    this.haut = haut; this.bas = bas; this.leve = false;
  }
  alimenter(beta) {
    if (!this.leve && beta >= this.haut) { this.leve = true; return false; }
    if (this.leve && beta <= this.bas) { this.leve = false; return true; }
    return false;
  }
}

/** Le suivi : l'inclinaison latérale (gamma, en °) ramenée entre -1 et 1. */
export function suivi(gamma, amplitude = 30) {
  return Math.max(-1, Math.min(1, gamma / amplitude));
}

/** La puissance d'un lancer d'après le pic d'accélération (m/s², sans la gravité). */
export function puissanceLancer(pic, min = 6, max = 26) {
  return Math.max(0, Math.min(1, (pic - min) / (max - min)));
}

/**
 * Le calibrage : trois coups de poignet, on garde la médiane, le seuil de ferrage en
 * vaut un peu moins de la moitié — assez bas pour qu'un vrai coup passe toujours,
 * assez haut pour qu'un tremblement ne passe jamais.
 */
export class Calibrage {
  constructor(nombre = 3) { this.nombre = nombre; this.pics = []; }
  ajouter(pic) { this.pics.push(pic); return this.pics.length >= this.nombre; }
  get fait() { return this.pics.length >= this.nombre; }
  seuil() {
    const tri = [...this.pics].sort((a, b) => a - b);
    const mediane = tri[Math.floor(tri.length / 2)] || 400;
    return Math.max(150, Math.round(mediane * 0.45));
  }
}

/**
 * L'interprète : reçoit des échantillons et produit des gestes.
 * echantillon = { t (ms), rotation: {alpha,beta,gamma} °/s, acceleration: {x,y,z} m/s², orientation: {beta, gamma} ° }
 * Renvoie une liste d'événements : { type: 'ferrer' | 'lancer' | 'pomper' | 'suivi', ... }
 */
export class Interprete {
  constructor({ seuilFerrage = 250, seuilLancer = 7 } = {}) {
    this.ferrage = new DetecteurPic({ seuil: seuilFerrage, repos: 350 });
    this.lancer = new DetecteurPic({ seuil: seuilLancer, repos: 800 });
    this.pompage = new DetecteurPompage();
    this.suivi = 0;
  }
  reglerSeuilFerrage(s) { this.ferrage.seuil = s; }
  alimenter(e) {
    const sortie = [];
    const r = this.ferrage.alimenter(norme(e.rotation), e.t);
    if (r) sortie.push({ type: 'ferrer', pic: r.pic, t: r.t });
    const l = this.lancer.alimenter(norme(e.acceleration), e.t);
    if (l) sortie.push({ type: 'lancer', pic: l.pic, puissance: puissanceLancer(l.pic), t: l.t });
    if (e.orientation) {
      if (this.pompage.alimenter(e.orientation.beta)) sortie.push({ type: 'pomper', t: e.t });
      const s = suivi(e.orientation.gamma);
      if (s !== this.suivi) { this.suivi = s; sortie.push({ type: 'suivi', valeur: s, t: e.t }); }
    }
    return sortie;
  }
}
