// Les capteurs du téléphone : gyroscope et accéléromètre par `devicemotion`, inclinaison
// par `deviceorientation`. Sur iPhone, il faut demander la permission depuis un toucher.
// On produit des échantillons { t, rotation, acceleration, orientation } pour l'interprète.

export class Capteurs {
  constructor() {
    this.abonnes = [];
    this.orientation = { beta: 0, gamma: 0 };
    this.gravite = null;          // estimation basse fréquence, si l'accélération linéaire manque
    this.recus = 0;
    this.ecoute = false;
  }

  abonner(f) { this.abonnes.push(f); }

  /** Demande l'accès et vérifie qu'il arrive des mesures. Renvoie 'ok', 'refuse' ou 'absent'. */
  async demander(attente = 1500) {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return 'absent';
    for (const Ev of [window.DeviceMotionEvent, window.DeviceOrientationEvent]) {
      if (Ev && typeof Ev.requestPermission === 'function') {
        try {
          const r = await Ev.requestPermission();
          if (r !== 'granted') return 'refuse';
        } catch (e) {
          return 'refuse';
        }
      }
    }
    this.ecouter();
    const depart = this.recus;
    await new Promise((ok) => setTimeout(ok, attente));
    return this.recus > depart ? 'ok' : 'absent';
  }

  ecouter() {
    if (this.ecoute) return;
    this.ecoute = true;
    window.addEventListener('deviceorientation', (e) => {
      if (e.beta === null || e.beta === undefined) return;
      this.orientation = { beta: e.beta, gamma: e.gamma || 0 };
    });
    window.addEventListener('devicemotion', (e) => this.recevoir(e));
  }

  recevoir(e) {
    this.recus += 1;
    const rot = e.rotationRate && e.rotationRate.alpha !== null
      ? { alpha: e.rotationRate.alpha || 0, beta: e.rotationRate.beta || 0, gamma: e.rotationRate.gamma || 0 }
      : { alpha: 0, beta: 0, gamma: 0 };
    let acc = e.acceleration && e.acceleration.x !== null ? e.acceleration : null;
    if (!acc && e.accelerationIncludingGravity && e.accelerationIncludingGravity.x !== null) {
      // Pas d'accélération linéaire : on retire une gravité estimée par filtre passe-bas.
      const g = e.accelerationIncludingGravity;
      if (!this.gravite) this.gravite = { x: g.x, y: g.y, z: g.z };
      const k = 0.1;
      this.gravite = { x: this.gravite.x + k * (g.x - this.gravite.x), y: this.gravite.y + k * (g.y - this.gravite.y), z: this.gravite.z + k * (g.z - this.gravite.z) };
      acc = { x: g.x - this.gravite.x, y: g.y - this.gravite.y, z: g.z - this.gravite.z };
    }
    const echantillon = {
      t: performance.now(),
      rotation: rot,
      acceleration: acc ? { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 } : { x: 0, y: 0, z: 0 },
      orientation: this.orientation,
    };
    for (const f of this.abonnes) f(echantillon);
  }
}

/** Vibration courte, là où le navigateur l'accorde (Android ; pas Safari). */
export function vibrer(motif) {
  try { if (navigator.vibrate) navigator.vibrate(motif); } catch (e) { /* tant pis */ }
}
