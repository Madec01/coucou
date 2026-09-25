// Les sons : quelques bruits d'interface et d'impact de Kenney (CC0), joués par clones
// pour pouvoir se chevaucher. Le navigateur n'accorde le son qu'après un premier geste.

// Chaque son existe en ogg et en mp3 : Safari ne lit pas l'ogg, on laisse le navigateur choisir.
const NOMS = ['plouf', 'ferrage', 'touche', 'prise', 'casse', 'tic', 'moulinet'];

function extension() {
  try {
    const a = document.createElement('audio');
    if (a.canPlayType('audio/ogg; codecs="vorbis"')) return 'ogg';
  } catch (e) { /* pas d'audio */ }
  return 'mp3';
}

export class Sons {
  constructor() {
    this.elements = {};
    this.actif = true;
    const ext = extension();
    for (const nom of NOMS) {
      const a = new Audio(`assets/audio/${nom}.${ext}`);
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
