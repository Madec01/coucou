// Les sons : quelques bruits d'interface et d'impact de Kenney (CC0), joués par clones
// pour pouvoir se chevaucher. Le navigateur n'accorde le son qu'après un premier geste.

const FICHIERS = {
  plouf: 'assets/audio/plouf.ogg',
  ferrage: 'assets/audio/ferrage.ogg',
  touche: 'assets/audio/touche.ogg',
  prise: 'assets/audio/prise.ogg',
  casse: 'assets/audio/casse.ogg',
  tic: 'assets/audio/tic.ogg',
  moulinet: 'assets/audio/moulinet.ogg',
};

export class Sons {
  constructor() {
    this.elements = {};
    this.actif = true;
    for (const [nom, src] of Object.entries(FICHIERS)) {
      const a = new Audio(src);
      a.preload = 'auto';
      this.elements[nom] = a;
    }
  }
  jouer(nom, volume = 0.8) {
    if (!this.actif) return;
    const a = this.elements[nom];
    if (!a) return;
    try {
      const c = a.cloneNode();
      c.volume = volume;
      const p = c.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) { /* le navigateur refuse : silence */ }
  }
}
