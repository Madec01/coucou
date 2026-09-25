# Touche ! — la pêche au téléphone

> Un lac, une canne, ton téléphone. On lance d'un geste, on ferre d'un coup de poignet, on fatigue
> le poisson en suivant ses rushs.

Jeu de pêche au geste, jouable dans un navigateur, en français. Site statique : aucune installation,
aucune compilation, aucune dépendance. GitHub Pages sert le dépôt tel quel (`index.html` à la racine).

## État du jeu

**Prototype jouable** (25 septembre 2026) : un poste de pêche, sept espèces, le lancer, la touche, le
ferrage et le combat au geste, le carnet de pêche. Reste à régler les seuils sur de vrais téléphones
(voir `FEUILLE_DE_ROUTE.md`).

## Jouer

- **En ligne** : servez le dépôt tel quel. Les capteurs exigent HTTPS ; GitHub Pages convient.
- **En local** : depuis la racine du dépôt, lancez un serveur statique puis ouvrez l'adresse indiquée.

```bash
python3 -m http.server 8080
# puis http://localhost:8080/
```

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
- `src/lac.js` — le lac sur canvas : rive et poissons de Kenney, particules pour le plouf et les
  bulles, ronds dans l'eau, ligne qui pend ou qui tire.
- `src/touche.js` — écrans, entrées de secours, HUD, carnet.

## Vérifier

```bash
tools/suite.sh court     # tests Node (gestes, partie, poissons) + fumée navigateur (une prise aux capteurs simulés, une au clavier)
tools/suite.sh complet   # pareil, plus les captures des moments clés dans docs/releve/
```

Le test de fumée dispatche de vrais événements `devicemotion` dans Chromium : le chemin des capteurs
est testé sans téléphone. Ce qui ne se teste pas d'ici, c'est la sensation en main.
