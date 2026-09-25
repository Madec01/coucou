# Touche ! — la pêche au téléphone

> Un lac, une canne, ton téléphone. On lance d'un geste, on ferre d'un coup de poignet, on fatigue
> le poisson en suivant ses rushs.

Prototype jouable, posé dans le dépôt d'Eurêka le temps de le tester. Site statique : ouvrir `touche/`
tel quel (GitHub Pages : `…/coucou/touche/`).

## Comment on joue

1. **Prendre la canne.** Sur iPhone, le navigateur demande l'accès au mouvement (obligatoire depuis
   iOS 13, et seulement en HTTPS). Sur Android, rien à demander.
2. **L'échauffement** : trois coups de poignet. Le jeu mesure ta main et règle son seuil de ferrage
   dessus (la médiane des trois pics, un peu moins de la moitié). Le seuil est gardé ; « Refaire
   l'échauffement » le remet à zéro.
3. **Lancer** : balance le téléphone vers l'avant. Le pic d'accélération fait la distance (8 à 48 m).
   Plus loin, les poissons sont plus gros et plus rares.
4. **Attendre** : le flotteur frémit parfois pour rien. Ferrer sur un frémissement effraie le poisson
   et repousse la touche.
5. **Touche !** : le flotteur plonge, le téléphone vibre (Android), le son sonne. Tu as 0,8 s pour
   **ferrer** d'un coup de poignet.
6. **Le combat** : quand le poisson tire à gauche ou à droite, **incline le téléphone du même côté**
   pour le suivre, sinon la tension monte et la ligne casse. Quand il se calme, **lève puis rabaisse**
   le téléphone pour pomper : chaque pompage le ramène et le fatigue. Pomper pendant qu'il tire fait
   bondir la tension. Laisser la ligne molle trop longtemps le décroche.
7. **Pris !** : espèce, taille, poids, record par espèce dans le carnet (gardé dans le navigateur).

Sans capteurs (ordinateur, permission refusée) : maintenir le doigt ou Espace pour charger le lancer,
taper ou Espace pour ferrer, glisser ou flèches pour suivre, glisser vers le haut ou ↑ pour pomper.

## Ce qu'il y a dedans

- `src/gestes.js` — détecteur de pics (ferrage, lancer), détecteur de pompage, calibrage, interprète.
  Pur, testé en Node.
- `src/partie.js` — la machine à états et les règles du combat (tension, énergie, distance). Pure.
- `src/poissons.js` — sept espèces du pack poissons de Kenney, portée, taille, poids.
- `src/capteurs.js` — `devicemotion` et `deviceorientation`, permission iOS, gravité retirée par
  filtre si le navigateur ne donne pas l'accélération linéaire.
- `src/rendu.js` — le lac sur canvas : rive et poissons de Kenney, particules pour le plouf et les
  bulles, ronds dans l'eau, ligne qui pend ou qui tire.
- `src/jeu.js` — écrans, entrées de secours, HUD, carnet.
- `tests/` — tests Node des gestes et de la partie ; `tests/gate.js` joue une prise avec des capteurs
  simulés (de vrais événements `devicemotion` dispatchés) puis une prise au clavier.

## Ce qui reste à vérifier sur un vrai téléphone

- Le seuil de lancer (7 m/s² pour déclencher, 26 pour la portée maximale) : réglé à l'estime, à
  mesurer sur deux ou trois téléphones.
- Le geste de pompage (lever au-dessus de 40°, rabaisser sous 15°) : à sentir en main.
- La tenue du téléphone en paysage : le jeu suppose le portrait.
