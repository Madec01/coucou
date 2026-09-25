# Paillasse — concept d'un jeu d'expériences

> Première mise à plat, 25 septembre 2026. Point de départ du commanditaire : « on serait un chercheur
> et on fait des expériences. Le but est de terminer une expérience. On fait les calculs, on ajoute des
> choses et ensuite on lance, on visualise l'expérience, et ainsi de suite. »
>
> Ce document propose de quoi étoffer l'idée : le fantasme, la boucle, ce qui rend le calcul amusant,
> une première tranche jouable, et les décisions à prendre. Rien n'est figé. « Paillasse » est un nom
> de travail.

## 1. Le pitch

Tu es le nouveau chercheur d'un laboratoire posé dans un monde dont les lois ne sont pas tout à fait
les nôtres. On te confie des questions ; tu montes une expérience sur la paillasse, tu prédis ce qui
va se passer, tu lances, tu regardes, tu corriges. Chaque expérience terminée écrit une page de plus
dans le Carnet, et chaque page révèle un peu mieux les lois de ce monde.

Le cœur du plaisir n'est pas de « faire tomber une bille ». C'est **d'annoncer le résultat avant de
l'avoir vu, et d'avoir raison**. Et, quand on a tort, de comprendre pourquoi.

## 2. Ce qui manque à l'idée telle qu'elle est, et comment le combler

L'idée initiale décrit une boucle (préparer → lancer → regarder → recommencer) mais pas encore ce qui
fait vouloir recommencer. Trois ingrédients la complètent :

1. **Une inconnue à percer.** Si le joueur connaît déjà la physique, le calcul est un devoir. Si les
   lois sont légèrement différentes des nôtres et cachées, le calcul devient une enquête : *pourquoi la
   bille rouge tombe-t-elle plus vite que la bleue ?* Le jeu devient un jeu de découverte, comme
   Outer Wilds ou The Witness, mais avec des ressorts et des béchers.
2. **Une prédiction qui engage.** Avant de lancer, le joueur *écrit* ce qu'il attend (un nombre, un
   point d'arrivée, une courbe). Le jeu compare. L'écart, c'est le score. Sans prédiction, lancer ne
   coûte rien et regarder n'apprend rien.
3. **Un coût par lancement.** Chaque essai consomme quelque chose (du temps de laboratoire, du
   crédit). Sinon on lance au hasard jusqu'à ce que ça marche. Avec un coût, on réfléchit d'abord :
   c'est exactement le fantasme du chercheur.

## 3. Les piliers

- **Prédire, puis regarder.** Le lancement est une récompense, jamais un tâtonnement.
- **Les lois se découvrent, elles ne se lisent pas.** Le Carnet se remplit de ce que le joueur a
  mesuré, pas de ce que le jeu lui a dit.
- **L'expérience est belle à regarder.** Ralenti, traînées, graphiques qui se tracent en direct,
  instruments qui bougent. On veut relancer *pour voir*.
- **Aucune bonne réponse imposée.** Plusieurs montages peuvent terminer une expérience ; les
  contraintes (budget, pièces disponibles) départagent.

## 4. La boucle d'une expérience

```
   Question  →  Montage  →  Prédiction  →  Lancement  →  Lecture  →  Carnet
      ↑                                                       │
      └───────────────── on corrige et on relance ────────────┘
```

1. **La question.** Un commanditaire (le directeur, un collègue, une lettre) pose un problème concret :
   « Fais atterrir la bille dans le bécher », « Trouve la période exacte de ce pendule »,
   « Garde la flamme allumée trente secondes ». Deux familles de questions :
   - *obtenir* un résultat (la bille dans le bécher, tolérance 2 cm) ;
   - *mesurer* une grandeur (la constante g de ce monde, à 5 % près).
2. **Le montage.** La paillasse est une scène 2D vue de côté. On y pose des pièces prises dans
   l'inventaire, chacune avec un coût : rampe, ressort, poulie, ventilateur, aimant, bécher, brûleur,
   balance, chronomètre, caméra rapide. Les pièces se règlent (angle de la rampe, tension du ressort,
   masse de la bille). C'est le « on ajoute des choses ».
3. **La prédiction.** Sur le **tableau noir**, le joueur annonce ce qu'il attend. Trois formes, de la
   plus simple à la plus savante, débloquées au fil du jeu :
   - *pointer* : un doigt sur la paillasse (« la bille tombera ici ») ;
   - *chiffrer* : un nombre dans une case (« 1,4 s ») ;
   - *formuler* : assembler une formule à partir de blocs (grandeurs mesurées, opérations, constantes
     du Carnet). Le jeu évalue la formule contre le résultat. C'est le « on fait les calculs », rendu
     tangible : on manipule des briques, on ne tape pas d'équation.
4. **Le lancement.** L'expérience se joue en temps réel, avec ralenti, pause, retour arrière. Les
   instruments posés affichent leurs mesures en direct. Un graphique se trace dans la marge.
5. **La lecture.** Écran de résultat : prédit / mesuré / écart. Si la question est résolue, l'expérience
   est *terminée* et notée (précision, économie de pièces, nombre d'essais). Sinon, on repart au
   montage avec ce qu'on a appris.
6. **Le Carnet.** Chaque expérience terminée y ajoute une page : mesures, courbes, et surtout les
   **lois** que le joueur a validées (une formule qui a tenu trois expériences de suite devient une
   loi, et débloque un bloc réutilisable au tableau noir).

## 5. Les lois d'ailleurs : le vrai moteur du jeu

Proposition : les lois de ce monde sont **cohérentes mais décalées**, et c'est le joueur qui les
découvre chapitre après chapitre.

| Chapitre | Domaine | Ce qui est comme chez nous | Ce qui ne l'est pas (à découvrir) |
|---|---|---|---|
| 1. La chute | Gravité, rampes, rebonds | Les objets tombent, rebondissent | La pesanteur dépend de la *couleur* de l'objet |
| 2. Le balancier | Pendules, ressorts | La période dépend de la longueur | … et de l'heure du jour dans le laboratoire |
| 3. La lumière | Miroirs, prismes | La lumière se réfléchit | Elle *ralentit* dans le verre au point qu'on la voit voyager |
| 4. La chaleur | Brûleurs, glace, vapeur | L'eau bout | Elle bout *plus tôt* quand on la regarde de près (instrument posé) |
| 5. Les fluides | Siphons, vases | L'eau coule vers le bas | L'huile coule vers le *haut* |
| 6. Le souffle | Ventilateurs, voiles | Le vent pousse | Il pousse d'autant plus que l'objet est léger… jusqu'à un seuil |

Chaque décalage est simple à énoncer, difficile à deviner, et **mesurable** avec les instruments du
chapitre. Le premier chapitre peut rester très proche de la physique réelle pour apprendre les gestes ;
le décalage n'y apparaît qu'à l'expérience 4 ou 5, comme une première fissure.

Pourquoi ce choix plutôt que la physique réelle : avec la physique réelle, un joueur adulte sait déjà
que la masse ne change pas la chute, et un enfant a l'impression de faire ses devoirs. Avec des lois
décalées, tout le monde est à égalité, l'étonnement est garanti, et le jeu reste « vrai » dans sa
démarche : observer, mesurer, formuler, vérifier.

## 6. Ce que veut dire « terminer une expérience »

Une expérience est terminée quand la question est résolue dans la tolérance. Elle est ensuite notée
sur trois étoiles :

- **Juste** : la prédiction était dans la tolérance dès le lancement qui a réussi.
- **Sobre** : le montage tient dans le budget de pièces annoncé.
- **Vite** : au plus N lancements.

Les étoiles ne bloquent rien ; elles donnent envie de refaire. Terminer les expériences d'un chapitre
ouvre la **publication** : on rédige la loi du chapitre en assemblant sa formule finale au tableau
noir, le jeu la confronte à toutes les mesures du Carnet, et si elle tient, le chapitre suivant s'ouvre
avec une nouvelle aile du laboratoire.

## 7. Le laboratoire (hub)

- **La paillasse** : là où l'on monte et lance.
- **Le tableau noir** : les prédictions et les formules. Se remplit de blocs à mesure qu'on découvre.
- **Le Carnet** : toutes les pages d'expériences, feuilletables. Mémoire du joueur, jamais du jeu.
- **La réserve** : l'inventaire des pièces, qui s'agrandit avec les chapitres.
- **Le courrier** : les questions arrivent par lettres ; certaines sont optionnelles (défis d'un
  collègue rival, commande d'un mécène pressé qui paie bien mais donne peu de lancements).

## 8. Le ton

Trois pistes, une à choisir :

- **Cabinet de curiosités** (recommandé) : XIXe siècle rêvé, cuivre, bois, encre, cahiers à
  carreaux. Les lettres ont de la tenue, les instruments de la patine. Bien servi par les banques
  libres (papiers, textures, gravures du domaine public).
- **Garage de gamin** : cartons, ruban adhésif, science du samedi. Plus chaleureux, plus proche de
  « on ajoute des choses ».
- **Station lointaine** : un labo posé sur un monde étranger, qui justifie naturellement les lois
  décalées. Plus froid, plus mystérieux.

## 9. Ce que l'on peut faire techniquement, dans les règles de la maison

- HTML / CSS / JS purs, servable par GitHub Pages, comme Cent Saisons.
- Un petit moteur physique 2D écrit à la main (intégration de Verlet, cercles et segments, quelques
  contraintes) suffit pour les chapitres 1, 2 et 6. La lumière (3) est du lancer de rayons 2D, simple.
  Les fluides (5) se font en particules. Rien n'exige de dépendance.
- « Ne jamais dessiner d'image par le code » tient : les pièces viennent de banques libres (Kenney
  a des packs physique et puzzle, OpenGameArt et le domaine public pour les gravures). Le code
  *anime* : traînées, ralenti, graphiques (les graphiques sont des courbes, pas des images).
- Le moteur doit être **déterministe** : même montage, même résultat. C'est ce qui rend la prédiction
  honnête et les tests automatisables (on peut rejouer chaque expérience de référence sans navigateur).

## 10. Première tranche jouable (proposition)

Objectif : vérifier en une semaine de travail que la boucle *prédire → lancer → lire* est amusante,
avant d'investir dans le contenu.

- Une paillasse, une seule vue.
- Sept pièces : rampe (angle réglable), bille (trois couleurs, masse réglable), bécher, ressort,
  planche, chronomètre, caméra rapide (ralenti).
- Cinq expériences du chapitre « La chute » :
  1. *Dans le bécher* : pointer où tombe la bille. Apprend le geste.
  2. *Le chrono* : chiffrer le temps de chute. Apprend la prédiction chiffrée.
  3. *Deux billes* : lâcher deux billes de masses différentes, prédire laquelle arrive en premier.
     Résultat conforme à l'intuition : elles arrivent ensemble.
  4. *La rouge et la bleue* : même expérience, deux couleurs. **Elles n'arrivent pas ensemble.**
     Première fissure. La question est ouverte : « pourquoi ? ».
  5. *La loi de la couleur* : mesurer g pour chaque couleur, assembler la première formule.
- Le tableau noir en mode *pointer* et *chiffrer* ; le mode *formuler* seulement à l'expérience 5,
  avec quatre blocs.
- Un Carnet d'une page par expérience, sans fioriture.
- Aucun son, aucune musique, aucun décor : on juge la boucle, pas l'habillage.

Ce qu'on mesure à la fin de la tranche : est-ce qu'on relance *pour voir* ? Est-ce que la fissure de
l'expérience 4 fait sourire ? Est-ce que le tableau noir est un jeu ou un formulaire ?

## 11. Les décisions à prendre

| # | Question | Recommandation par défaut |
|---|---|---|
| 1 | Lois réelles ou lois décalées ? | Décalées, avec un chapitre 1 presque réel. |
| 2 | Le ton | Cabinet de curiosités. |
| 3 | Vue de côté (2D physique) ou vue de dessus (plus proche d'un plateau) ? | De côté : la chute et le balancier s'y lisent mieux. |
| 4 | Le coût des lancements : budget par expérience, ou temps de laboratoire global ? | Budget par expérience, plus lisible ; le global viendra si un mode « carrière » s'impose. |
| 5 | Où vit le projet : ce dépôt ou un dépôt à part ? | Un dépôt à part, mêmes règles de travail (ce `CLAUDE.md` copié tel quel). |
| 6 | Le nom | « Paillasse » pour travailler ; « Eurêka », « Protocole », « Les lois d'ailleurs » en réserve. |

## 12. Ce que ce document n'est pas

Pas une feuille de route, pas un cahier des charges. C'est la matière à discuter. La prochaine étape
raisonnable est de trancher les décisions 1, 3 et 5, puis de faire la tranche du §10.
