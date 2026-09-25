// Le rendu de la paillasse sur un canvas : sprites Kenney (jamais d'image dessinée par
// le code), dégradés pour la lumière, traînées et particules pour le mouvement.
//
// Le moteur parle en mètres, y vers le haut ; ici on convertit en pixels, y vers le bas.

const ECHELLE = 100;           // pixels par mètre
const LARGEUR_M = 10;
const HAUTEUR_M = 6;
export const LARGEUR_PX = LARGEUR_M * ECHELLE;
export const HAUTEUR_PX = HAUTEUR_M * ECHELLE;

const FILTRES = {
  gris: 'none',
  rouge: 'sepia(1) saturate(14) hue-rotate(-55deg) brightness(0.8) contrast(1.3)',
  bleu: 'sepia(1) saturate(30) hue-rotate(180deg) brightness(0.7) contrast(1.2)',
};

const SOURCES = {
  bille: 'assets/img/pieces/bille.png',
  planche: 'assets/img/pieces/planche.png',
  verre: 'assets/img/pieces/verre.png',
  metal: 'assets/img/pieces/metal.png',
  panneau: 'assets/img/ui/panneau_metal.png',
  plaque: 'assets/img/ui/plaque_metal.png',
  cible: 'assets/img/ui/target.png',
};

export function chargerImages(base = '') {
  const images = {};
  return Promise.all(Object.entries(SOURCES).map(([nom, src]) => new Promise((ok) => {
    const img = new Image();
    img.onload = () => { images[nom] = img; ok(); };
    img.onerror = () => { images[nom] = null; ok(); };
    img.src = base + src;
  }))).then(() => images);
}

const px = (x) => x * ECHELLE;
const py = (y) => HAUTEUR_PX - y * ECHELLE;

export class Rendu {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.images = images;
    this.teintes = {};
  }

  /** Une bille recolorée une fois pour toutes (le filtre canvas coûte cher à chaque image). */
  bille(couleur) {
    if (this.teintes[couleur]) return this.teintes[couleur];
    const src = this.images.bille;
    if (!src) return null;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.filter = FILTRES[couleur] || 'none';
    g.drawImage(src, 0, 0);
    this.teintes[couleur] = c;
    return c;
  }

  /**
   * Dessine la scène.
   * options = { image (état des corps), monde, chrono: { t, fige }, fantome: [points], trainee: [points], cible }
   */
  dessiner(monde, options = {}) {
    const { ctx } = this;
    ctx.clearRect(0, 0, LARGEUR_PX, HAUTEUR_PX);
    this.fond();
    this.sol();
    for (const d of monde.dessins || []) this.piece(d);
    if (options.fantome && options.fantome.length > 1) this.trajet(options.fantome, 'rgba(255,255,255,0.25)', [6, 8]);
    if (options.trainee && options.trainee.length > 1) this.trainee(options.trainee);
    const etat = options.image ? options.image.corps : monde.corps.map((c) => ({ x: c.x, y: c.y, angle: 0 }));
    monde.corps.forEach((c, i) => this.corps(c, etat[i]));
    for (const d of monde.dessins || []) if (d.etiquette) this.etiquette(d);
    if (options.chrono) this.chrono(options.chrono);
    if (options.courbe) this.courbe(options.courbe);
  }

  fond() {
    const { ctx } = this;
    // Le hublot : un ciel étranger, dégradé du violet profond au vert pâle de l'horizon.
    const ciel = ctx.createLinearGradient(0, 0, 0, HAUTEUR_PX);
    ciel.addColorStop(0, '#141a33');
    ciel.addColorStop(0.55, '#26355a');
    ciel.addColorStop(1, '#5a7f86');
    ctx.fillStyle = ciel;
    ctx.fillRect(0, 0, LARGEUR_PX, HAUTEUR_PX);
    // Une lune large et basse, en halo.
    const lune = ctx.createRadialGradient(780, 150, 20, 780, 150, 260);
    lune.addColorStop(0, 'rgba(220,235,255,0.35)');
    lune.addColorStop(0.35, 'rgba(180,210,240,0.12)');
    lune.addColorStop(1, 'rgba(180,210,240,0)');
    ctx.fillStyle = lune;
    ctx.fillRect(0, 0, LARGEUR_PX, HAUTEUR_PX);
    // La lampe de paillasse : une chaleur ambrée qui vient d'en haut à gauche.
    const lampe = ctx.createRadialGradient(150, 0, 10, 150, 0, 700);
    lampe.addColorStop(0, 'rgba(255,200,120,0.25)');
    lampe.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = lampe;
    ctx.fillRect(0, 0, LARGEUR_PX, HAUTEUR_PX);
    // Repères de hauteur, tous les mètres.
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'left';
    for (let m = 1; m < HAUTEUR_M; m++) {
      ctx.beginPath(); ctx.moveTo(0, py(m)); ctx.lineTo(LARGEUR_PX, py(m)); ctx.stroke();
      ctx.fillText(`${m} m`, 6, py(m) - 4);
    }
    ctx.textAlign = 'center';
    for (let m = 1; m < LARGEUR_M; m++) ctx.fillText(`${m}`, px(m), HAUTEUR_PX - 4);
  }

  sol() {
    const { ctx, images } = this;
    const img = images.plaque || images.panneau;
    const h = 0.3 * ECHELLE;
    if (img) {
      const l = 0.5 * ECHELLE;
      for (let x = 0; x < LARGEUR_PX; x += l) ctx.drawImage(img, x, HAUTEUR_PX - h, l, h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, HAUTEUR_PX - h, LARGEUR_PX, h);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, HAUTEUR_PX - h, LARGEUR_PX, 2);
  }

  piece(d) {
    const { ctx, images } = this;
    if (d.type === 'rampe') {
      const img = images.planche;
      const x1 = px(d.x1), y1 = py(d.y1), x2 = px(d.x2), y2 = py(d.y2);
      const l = Math.hypot(x2 - x1, y2 - y1);
      const a = Math.atan2(y2 - y1, x2 - x1);
      const e = 0.22 * ECHELLE;
      ctx.save();
      ctx.translate(x1, y1); ctx.rotate(a);
      if (img) ctx.drawImage(img, -4, 0, l + 8, e); else { ctx.fillStyle = '#8b5a2b'; ctx.fillRect(-4, 0, l + 8, e); }
      ctx.restore();
      // Le pied de la rampe : une planche de bois debout, du sol jusque sous la rampe.
      const pied = images.planche;
      const hp = py(0) - 0.3 * ECHELLE - (y1 + e * 0.5);
      if (pied) {
        ctx.save();
        ctx.translate(x1 + 0.25 * ECHELLE, y1 + e * 0.5);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(pied, 0, -0.1 * ECHELLE, hp, 0.2 * ECHELLE);
        ctx.restore();
      }
    } else if (d.type === 'becher') {
      const img = images.verre;
      const x = px(d.x), l = d.largeur * ECHELLE, h = d.hauteur * ECHELLE, e = 0.1 * ECHELLE;
      ctx.save();
      ctx.globalAlpha = 0.9;
      if (img) {
        ctx.drawImage(img, x - l / 2 - e / 2, py(d.hauteur), e, h);
        ctx.drawImage(img, x + l / 2 - e / 2, py(d.hauteur), e, h);
        ctx.drawImage(img, x - l / 2 - e / 2, py(0) - e * 0.6, l + e, e * 0.6);
      }
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#bfe8ff';
      ctx.fillRect(x - l / 2, py(d.hauteur), l, h);
      ctx.restore();
    } else if (d.type === 'lacher') {
      // La pince de lâcher : une petite plaque de métal au-dessus de la bille.
      const img = images.metal;
      const x = px(d.x), y = py(d.y + 0.5);
      if (img) ctx.drawImage(img, x - 0.2 * ECHELLE, y - 0.3 * ECHELLE, 0.4 * ECHELLE, 0.2 * ECHELLE);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y - 0.3 * ECHELLE); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  etiquette(d) {
    const { ctx } = this;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    const x = px(d.x), y = py(d.y + 0.5) - 0.35 * ECHELLE;
    ctx.fillRect(x - 24, y - 16, 48, 20);
    ctx.fillStyle = '#fff';
    ctx.fillText(d.etiquette, x, y - 1);
  }

  corps(c, e) {
    const { ctx } = this;
    const img = this.bille(c.couleur);
    const r = c.r * ECHELLE;
    const x = px(e.x), y = py(e.y);
    // Ombre portée au sol, qui rétrécit avec la hauteur.
    const h = Math.max(0, e.y - c.r);
    const k = Math.max(0.25, 1 - h / 6);
    ctx.fillStyle = `rgba(0,0,0,${0.25 * k})`;
    ctx.beginPath(); ctx.ellipse(x, py(0) - 2, r * k, r * 0.25 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-e.angle);
    if (img) ctx.drawImage(img, -r, -r, 2 * r, 2 * r);
    else { ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  trajet(points, couleur, tirets) {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2;
    ctx.setLineDash(tirets);
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(px(p.x), py(p.y)) : ctx.moveTo(px(p.x), py(p.y))));
    ctx.stroke();
    ctx.restore();
  }

  /** La traînée : des points qui s'effacent derrière la bille. */
  trainee(points) {
    const { ctx } = this;
    const n = points.length;
    for (let i = 0; i < n; i++) {
      const p = points[i];
      const a = (i / n) * 0.6;
      ctx.fillStyle = `rgba(255,240,200,${a})`;
      ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 2 + 3 * (i / n), 0, Math.PI * 2); ctx.fill();
    }
  }

  chrono({ t, fige }) {
    const { ctx } = this;
    ctx.save();
    ctx.fillStyle = 'rgba(10,14,30,0.75)';
    ctx.fillRect(LARGEUR_PX - 190, 14, 176, 44);
    ctx.strokeStyle = fige ? '#ffd27a' : 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(LARGEUR_PX - 190, 14, 176, 44);
    ctx.fillStyle = fige ? '#ffd27a' : '#e8f0ff';
    ctx.font = '600 24px ui-monospace, Menlo, Consolas, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${t.toFixed(3).replace('.', ',')} s`, LARGEUR_PX - 24, 45);
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('CHRONO', LARGEUR_PX - 182, 30);
    ctx.restore();
  }

  /** Le petit graphique de la marge : la hauteur de la bille au fil du temps. */
  courbe({ points, tMax, hMax }) {
    const { ctx } = this;
    const L = 200, H = 110, X = LARGEUR_PX - L - 14, Y = 70;
    ctx.save();
    ctx.fillStyle = 'rgba(10,14,30,0.7)';
    ctx.fillRect(X, Y, L, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.strokeRect(X, Y, L, H);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('hauteur (m)', X + 6, Y + 14);
    ctx.textAlign = 'right';
    ctx.fillText('temps (s)', X + L - 6, Y + H - 6);
    if (points.length > 1) {
      ctx.strokeStyle = '#ffd27a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const x = X + 8 + (p.t / tMax) * (L - 16);
        const y = Y + H - 8 - (p.h / hMax) * (H - 26);
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
      });
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Coordonnées de scène (mètres) d'un événement pointeur. */
  versMetres(ev) {
    const r = this.canvas.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * LARGEUR_M;
    const y = (1 - (ev.clientY - r.top) / r.height) * HAUTEUR_M;
    return { x, y };
  }
}
