// Le rendu du lac sur un canvas en portrait. Les images viennent de Kenney (rive, poissons,
// particules) ; le code compose, anime, teinte et trace la ligne — il ne dessine pas d'image.

export const L = 540;
export const H = 960;
const HORIZON = 400;

const SOURCES = {
  rive: 'assets/img/decor/rive.png',
  nuage1: 'assets/img/decor/cloud1.png',
  nuage2: 'assets/img/decor/cloud3.png',
  soleil: 'assets/img/decor/sun.png',
  canne: 'assets/img/decor/canne.png',
  flotteur: 'assets/img/fx/flotteur.png',
  goutte: 'assets/img/fx/goutte.png',
  rond: 'assets/img/fx/rond.png',
  halo: 'assets/img/fx/halo.png',
  eau: 'assets/img/poissons/fishTile_088.png',
  rocher: 'assets/img/poissons/fishTile_082.png',
};
const TUILES = ['072', '073', '074', '075', '076', '077', '078', '079', '080', '081', '100', '101', '102', '103'];

export function chargerImages() {
  const images = {};
  const sources = { ...SOURCES };
  for (const t of TUILES) sources[`fishTile_${t}`] = `assets/img/poissons/fishTile_${t}.png`;
  return Promise.all(Object.entries(sources).map(([nom, src]) => new Promise((ok) => {
    const img = new Image();
    img.onload = () => { images[nom] = img; ok(); };
    img.onerror = () => { images[nom] = null; ok(); };
    img.src = src;
  }))).then(() => images);
}

/** Position à l'écran d'un point du lac à `d` mètres du bord, pour une portée max donnée. */
export function projeter(d, porteeMax, x = 0) {
  const u = Math.max(0, Math.min(1, d / porteeMax));
  const y = H - 90 - (H - 90 - HORIZON - 24) * Math.pow(u, 0.75);
  const echelle = 1 - 0.65 * u;
  return { x: L / 2 + x * echelle, y, echelle };
}

export class Rendu {
  constructor(canvas, images) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.images = images;
    this.particules = [];
    this.ronds = [];
    this.teintes = {};
    this.temps = 0;
  }

  flotteurTeinte() {
    if (this.teintes.flotteur) return this.teintes.flotteur;
    const src = this.images.flotteur;
    if (!src) return null;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.filter = 'sepia(1) saturate(14) hue-rotate(-55deg) brightness(0.85) contrast(1.3)';
    g.drawImage(src, 0, 0);
    this.teintes.flotteur = c;
    return c;
  }

  /** Une ombre de poisson : le sprite assombri et bleui, pour le voir sous l'eau. */
  ombre(tuile) {
    const cle = 'ombre-' + tuile;
    if (this.teintes[cle]) return this.teintes[cle];
    const src = this.images[tuile];
    if (!src) return null;
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const g = c.getContext('2d');
    g.filter = 'brightness(0.35) saturate(0.4) sepia(0.3) hue-rotate(170deg)';
    g.drawImage(src, 0, 0);
    this.teintes[cle] = c;
    return c;
  }

  plouf(x, y, force = 1) {
    for (let i = 0; i < 14 * force; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const v = 120 + Math.random() * 220 * force;
      this.particules.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 0.6 + Math.random() * 0.4, taille: 6 + Math.random() * 10 });
    }
    this.ronds.push({ x, y, r: 6, vie: 1.2, echelle: 1 });
  }

  rond(x, y, echelle = 1) { this.ronds.push({ x, y, r: 4, vie: 1.0, echelle }); }

  /**
   * scene = { etat, porteeMax, flotteur: { d, x, plongee, agitation }, vol: { u, depart, arrivee }, poisson: { d, x, tuile, direction, alpha }, tensionVisuelle }
   */
  dessiner(scene, dt) {
    this.temps += dt;
    const { ctx, images } = this;
    ctx.clearRect(0, 0, L, H);
    this.ciel();
    this.eau();
    if (scene.poisson) this.poisson(scene);
    this.rondsEtParticules(dt);
    if (scene.flotteur) this.flotteur(scene);
    this.canneEtLigne(scene);
  }

  ciel() {
    const { ctx, images } = this;
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, '#5fb8ec');
    g.addColorStop(1, '#cfeeff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, L, HORIZON);
    if (images.soleil) ctx.drawImage(images.soleil, L - 150, 40, 90, 90);
    if (images.nuage1) ctx.drawImage(images.nuage1, ((this.temps * 8) % (L + 300)) - 300, 60, 200, 70);
    if (images.nuage2) ctx.drawImage(images.nuage2, ((this.temps * 5 + 250) % (L + 300)) - 300, 140, 160, 56);
    if (images.rive) {
      // La rive : la forêt du fond de Kenney, cadrée pour que ses arbres bordent l'horizon.
      ctx.drawImage(images.rive, 0, 400, 1024, 415, 0, HORIZON - 208, L, 208);
    }
  }

  eau() {
    const { ctx, images } = this;
    const g = ctx.createLinearGradient(0, HORIZON, 0, H);
    g.addColorStop(0, '#8ed3f0');
    g.addColorStop(0.35, '#4aa3d4');
    g.addColorStop(1, '#1d5f8e');
    ctx.fillStyle = g;
    ctx.fillRect(0, HORIZON, L, H - HORIZON);
    // La ligne d'eau : les tuiles d'eau du pack, en frise sur l'horizon.
    if (images.eau) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      for (let x = 0; x < L; x += 40) ctx.drawImage(images.eau, x, HORIZON - 6, 40, 40);
      ctx.restore();
    }
    // Reflets : des bandes claires qui glissent lentement.
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 9; i++) {
      const y = HORIZON + 30 + i * 58 + Math.sin(this.temps * 0.8 + i) * 6;
      const l = 120 + i * 30;
      const x = ((this.temps * (10 + i * 3) + i * 90) % (L + l)) - l;
      ctx.fillRect(x, y, l, 3 + i * 0.6);
    }
    ctx.restore();
    // La berge, tout en bas : une bande sombre et deux rochers.
    const berge = ctx.createLinearGradient(0, H - 70, 0, H);
    berge.addColorStop(0, 'rgba(40,60,40,0)');
    berge.addColorStop(1, 'rgba(30,45,30,0.9)');
    ctx.fillStyle = berge;
    ctx.fillRect(0, H - 70, L, 70);
    if (images.rocher) { ctx.drawImage(images.rocher, 30, H - 64, 64, 64); ctx.drawImage(images.rocher, L - 120, H - 58, 56, 56); }
  }

  flotteur(scene) {
    const { ctx } = this;
    const f = scene.flotteur;
    let p, echelle;
    if (scene.vol) {
      // Une cloche entre le bout de la canne et le point d'arrivée.
      const u = scene.vol.u;
      const a = scene.vol.depart, b = scene.vol.arrivee;
      p = { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u - Math.sin(u * Math.PI) * 260 };
      echelle = 1 - 0.5 * u;
    } else {
      const pr = projeter(f.d, scene.porteeMax, f.x);
      const bob = Math.sin(this.temps * 2.2) * 2.5 * pr.echelle;
      const agit = f.agitation ? Math.sin(this.temps * 40) * 4 : 0;
      p = { x: pr.x + agit, y: pr.y + bob + (f.plongee || 0) * 18 * pr.echelle };
      echelle = pr.echelle;
    }
    this.positionFlotteur = p;
    const img = this.flotteurTeinte();
    const t = 30 * echelle;
    ctx.save();
    if (f.plongee) ctx.globalAlpha = 0.6;
    if (img) ctx.drawImage(img, p.x - t / 2, p.y - t / 2, t, t);
    // Le petit reflet blanc du flotteur.
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(p.x, p.y + t * 0.55, t * 0.5, t * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  poisson(scene) {
    const { ctx } = this;
    const q = scene.poisson;
    const pr = projeter(q.d, scene.porteeMax, q.x);
    const img = this.ombre(q.tuile);
    if (!img) return;
    const t = 110 * pr.echelle * q.taille;
    ctx.save();
    ctx.globalAlpha = q.alpha;
    ctx.translate(pr.x, pr.y + 26 * pr.echelle);
    if (q.direction < 0) ctx.scale(-1, 1);
    ctx.drawImage(img, -t / 2, -t / 2, t, t);
    ctx.restore();
    if (Math.random() < 0.15) {
      this.particules.push({ x: pr.x + (Math.random() - 0.5) * t * 0.6, y: pr.y + 20, vx: 0, vy: -30, vie: 0.8, taille: 4 + Math.random() * 4, bulle: true });
    }
  }

  rondsEtParticules(dt) {
    const { ctx, images } = this;
    for (const r of this.ronds) {
      r.vie -= dt;
      r.r += 60 * dt * r.echelle;
      if (images.rond) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, r.vie) * 0.5;
        ctx.drawImage(images.rond, r.x - r.r, r.y - r.r * 0.35, r.r * 2, r.r * 0.7);
        ctx.restore();
      }
    }
    this.ronds = this.ronds.filter((r) => r.vie > 0);
    for (const p of this.particules) {
      p.vie -= dt;
      if (!p.bulle) p.vy += 500 * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (images.goutte) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.vie)) * 0.8;
        ctx.drawImage(images.goutte, p.x - p.taille / 2, p.y - p.taille / 2, p.taille, p.taille);
        ctx.restore();
      }
    }
    this.particules = this.particules.filter((p) => p.vie > 0);
  }

  canneEtLigne(scene) {
    const { ctx, images } = this;
    const tension = scene.tensionVisuelle || 0;
    // La canne : une planche de bois debout, en bas à droite, qui plie avec la tension.
    const base = { x: L - 60, y: H + 10 };
    const angle = -Math.PI / 2 + 0.35 + tension * 0.35 * (scene.etat === 'combat' ? 1 : 0.2);
    const longueur = 330;
    const bout = { x: base.x + Math.cos(angle) * longueur, y: base.y + Math.sin(angle) * longueur };
    if (images.canne) {
      ctx.save();
      ctx.translate(base.x, base.y);
      ctx.rotate(angle);
      ctx.drawImage(images.canne, 0, -9, longueur, 18);
      ctx.restore();
    }
    this.boutDeCanne = bout;
    const cible = this.positionFlotteur;
    if (cible && scene.flotteur) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${0.35 + tension * 0.5})`;
      ctx.lineWidth = 1.5 + tension;
      ctx.beginPath();
      ctx.moveTo(bout.x, bout.y);
      // Une ligne qui pend un peu quand elle est molle, droite quand elle tire.
      const mx = (bout.x + cible.x) / 2, my = (bout.y + cible.y) / 2 + (1 - tension) * 40;
      ctx.quadraticCurveTo(mx, my, cible.x, cible.y);
      ctx.stroke();
      ctx.restore();
    }
  }
}
