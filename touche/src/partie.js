// Une partie de pêche : la machine à états et les règles du combat. Pure : on lui donne
// le temps qui passe et un tirage aléatoire, elle rend des événements à afficher.
//
// États : pret → vol → attente → touche → combat → prise | casse | decroche
//                                   ↘ rate (on n'a pas ferré à temps) → pret
// Trois façons de perdre le poisson : la ligne casse (tension à 100), la ligne reste
// molle trop longtemps (il se décroche), on ne ferre pas dans la fenêtre.

import { tirerPoisson } from './poissons.js';

export const PORTEE_MIN = 8;   // m, un lancer mou
export const PORTEE_MAX = 48;  // m, un lancer parfait
export const FENETRE_FERRAGE = 0.8; // s pour ferrer après la touche
export const DUREE_VOL = 1.1;       // s de vol du flotteur

export class Partie {
  constructor({ alea = Math.random } = {}) {
    this.alea = alea;
    this.etat = 'pret';
    this.t = 0;
    this.evenements = [];
    this.portee = 0;
    this.poisson = null;
    this.suivi = 0;
    this.prises = 0;
  }

  emettre(type, extra = {}) { this.evenements.push({ type, t: this.t, ...extra }); }
  /** Vide et renvoie les événements accumulés depuis le dernier appel. */
  purger() { const e = this.evenements; this.evenements = []; return e; }

  // ---------------------------------------------------------------- actions

  lancer(puissance) {
    if (this.etat !== 'pret') return false;
    this.puissance = Math.max(0, Math.min(1, puissance));
    this.portee = PORTEE_MIN + (PORTEE_MAX - PORTEE_MIN) * this.puissance;
    this.etat = 'vol';
    this.chrono = 0;
    this.emettre('lancer', { puissance: this.puissance, portee: this.portee });
    return true;
  }

  ferrer() {
    if (this.etat === 'touche') {
      this.poisson = tirerPoisson(this.puissance, this.alea);
      Object.assign(this.poisson, {
        energie: 100, distance: this.portee, tension: 30,
        phase: 'repos', resteDePhase: 1.2 + this.alea(), direction: this.alea() < 0.5 ? -1 : 1, mou: 0,
      });
      this.etat = 'combat';
      this.emettre('ferre', { poisson: this.poisson });
      return true;
    }
    if (this.etat === 'attente') {
      // Trop tôt : le poisson se méfie, la touche est repoussée.
      this.delaiTouche += 2 + 2 * this.alea();
      this.emettre('trop-tot');
      return false;
    }
    return false;
  }

  pomper() {
    if (this.etat !== 'combat') return false;
    const p = this.poisson;
    if (p.phase === 'rush') {
      // Pomper pendant un rush, c'est tirer contre le poisson : la tension bondit.
      p.tension += 22;
      p.energie -= 2;
      this.emettre('pompe-contre');
    } else {
      p.distance -= 3 + 2 * (1 - p.energie / 100);
      p.energie -= 8;
      p.tension += 8;
      this.emettre('pompe', { distance: p.distance });
    }
    this.verifierCombat();
    return true;
  }

  suivre(valeur) { this.suivi = Math.max(-1, Math.min(1, valeur)); }

  /** Pour les tests et l'aide : abrège l'attente. */
  forcerTouche() { if (this.etat === 'attente') this.delaiTouche = 0; }

  // ---------------------------------------------------------------- temps

  avancer(dt) {
    this.t += dt;
    switch (this.etat) {
      case 'vol':
        this.chrono += dt;
        if (this.chrono >= DUREE_VOL) {
          this.etat = 'attente';
          this.chrono = 0;
          this.delaiTouche = 2 + 5 * this.alea();
          this.prochainFremissement = 1 + 3 * this.alea();
          this.emettre('plouf', { portee: this.portee });
        }
        break;
      case 'attente':
        this.chrono += dt;
        this.prochainFremissement -= dt;
        if (this.prochainFremissement <= 0 && this.chrono < this.delaiTouche - 0.6) {
          this.prochainFremissement = 1.5 + 3 * this.alea();
          this.emettre('fremissement');
        }
        if (this.chrono >= this.delaiTouche) {
          this.etat = 'touche';
          this.chrono = 0;
          this.emettre('touche');
        }
        break;
      case 'touche':
        this.chrono += dt;
        if (this.chrono >= FENETRE_FERRAGE) {
          this.etat = 'rate';
          this.emettre('rate');
        }
        break;
      case 'combat':
        this.combattre(dt);
        break;
      default:
        break;
    }
  }

  combattre(dt) {
    const p = this.poisson;
    p.resteDePhase -= dt;
    if (p.resteDePhase <= 0) {
      if (p.phase === 'rush' || p.energie <= 0) {
        p.phase = 'repos';
        p.resteDePhase = 1.5 + 1.5 * this.alea();
        this.emettre('repos');
      } else {
        p.phase = 'rush';
        p.direction = this.alea() < 0.5 ? -1 : 1;
        p.resteDePhase = (1.2 + 1.8 * this.alea()) * (0.6 + 0.4 * p.vigueur);
        this.emettre('rush', { direction: p.direction });
      }
    }
    if (p.phase === 'rush') {
      const alignement = this.suivi * p.direction; // 1 = on suit le poisson, -1 = on tire contre
      const force = (0.5 + 0.5 * p.vigueur) * (0.4 + 0.6 * p.energie / 100);
      let dTension = 16 * force * (1 - 0.85 * Math.max(0, alignement));
      if (alignement < 0) dTension += 14 * -alignement * force;
      p.tension += dTension * dt;
      p.energie -= 5 * dt * Math.max(0.2, alignement);
      p.distance += 1.5 * force * dt; // il reprend un peu de fil
    } else {
      p.tension -= 12 * dt;
      p.energie -= 1 * dt;
    }
    p.tension = Math.max(0, p.tension);
    // Ligne molle : si la tension reste à zéro, l'hameçon finit par se décrocher.
    p.mou = p.tension <= 0 ? p.mou + dt : 0;
    p.energie = Math.max(0, p.energie);
    this.verifierCombat();
  }

  verifierCombat() {
    const p = this.poisson;
    if (p.tension >= 100) {
      this.etat = 'casse';
      this.emettre('casse', { poisson: p });
    } else if (p.mou >= 3) {
      this.etat = 'decroche';
      this.emettre('decroche', { poisson: p });
    } else if (p.distance <= 0) {
      p.distance = 0;
      this.etat = 'prise';
      this.prises += 1;
      this.emettre('prise', { poisson: p });
    }
  }

  /** Après une prise, une casse ou un raté : on reprend la canne. */
  reprendre() {
    if (!['prise', 'casse', 'rate', 'decroche'].includes(this.etat)) return false;
    this.etat = 'pret';
    this.poisson = null;
    this.suivi = 0;
    this.emettre('pret');
    return true;
  }
}
