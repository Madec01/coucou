# Eurêka — un jeu d'expériences

> Tu es le nouveau chercheur d'une station posée sur un monde lointain, dont les lois ne sont pas tout
> à fait les nôtres. On te confie des questions ; tu montes une expérience, tu prédis ce qui va se
> passer, tu lances, tu regardes, tu corriges. Chaque expérience terminée écrit une page du Carnet, et
> chaque page révèle un peu mieux les lois de ce monde.

Jeu de prédiction et de découverte, jouable dans un navigateur, en français. Le concept complet est
dans `docs/CONCEPT_EUREKA.md`.

## État du jeu

**Première tranche jouable** (25 septembre 2026) : le chapitre 1, « La chute », en cinq expériences.

1. **Dans le bécher** — une bille dévale une rampe ; on place le bécher là où l'on pense qu'elle retombera (prédiction *pointer*).
2. **Le chrono** — on chiffre le temps de chute depuis 4 m à ±0,05 s (prédiction *chiffrer*).
3. **Deux billes** — lourde ou légère, laquelle arrive en premier ? (prédiction *choisir*).
4. **La rouge et la bleue** — même question, deux couleurs. Elles n'arrivent pas ensemble. C'est la première fissure.
5. **La loi de la couleur** — mesurer la pesanteur de chaque couleur à 5 % près, en assemblant la formule au tableau noir par blocs (prédiction *mesurer*).

Chaque expérience a un budget de lancements. Le Carnet se remplit de ce que le joueur a mesuré, jamais
de ce que le jeu sait. La progression est gardée dans le navigateur.

Ce qui n'y est pas encore : les sons, le ressort, les étoiles « sobre » et « vite », le chapitre 2, le
service worker. Voir `FEUILLE_DE_ROUTE.md`.

## Un second prototype dans ce dépôt : Touche !

Le dossier `touche/` contient un jeu de pêche au téléphone, posé ici le temps de le tester sur un vrai
appareil : on lance d'un geste, on ferre d'un coup de poignet, on fatigue le poisson en inclinant et en
pompant. Voir `touche/README.md`. Il a vocation à vivre dans son propre dépôt.

## Jouer

Le jeu est un site statique : aucune installation, aucune compilation, aucune dépendance.

- **En ligne** : servez le dépôt tel quel. GitHub Pages fonctionne directement (tous les chemins sont relatifs, `index.html` à la racine).
- **En local** : depuis la racine du dépôt, lancez un serveur statique puis ouvrez l'adresse indiquée.

```bash
python3 -m http.server 8080
# puis http://localhost:8080/
```

## Comment on joue

1. **Le courrier** pose une question, avec un objectif, une tolérance et un budget de lancements.
2. **Le montage** : on règle les pièces (hauteur de lâcher, position du bécher, couleur de la bille). Le bécher se glisse aussi directement sur la paillasse.
3. **Le tableau noir** : on écrit ce que l'on attend — un endroit, un nombre, un choix, ou une formule à blocs évaluée sur les mesures.
4. **Lancer** : l'expérience se joue ; pause, ralenti ×¼ (la caméra rapide) et saut à la fin. Le chrono s'arrête au premier contact avec le sol, la courbe de hauteur se trace dans la marge.
5. **La lecture** compare prédit et mesuré. Réussi : une page s'ajoute au Carnet et l'expérience suivante s'ouvre. Raté : on corrige, la trajectoire précédente reste en fantôme.

## Vérifier

```bash
tools/suite.sh court     # tests Node (moteur, expériences) + test de fumée navigateur (le chapitre entier)
tools/suite.sh complet   # pareil, plus une capture de chaque expérience dans docs/releve/
```

Le moteur est déterministe : même montage, même trace. C'est ce qui rend la prédiction honnête et les
tests rejouables sans navigateur.
