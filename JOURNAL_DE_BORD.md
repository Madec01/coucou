# Journal de bord — Eurêka

Une ligne par changement notable : « ce qui n'allait pas | ce qui a été fait ».

| # | Date | Ce qui n'allait pas | Ce qui a été fait |
|---|---|---|---|
| 1 | 2026-09-25 | L'idée (un chercheur, des expériences à terminer) n'avait ni boucle ni raison de relancer | Concept posé dans `docs/CONCEPT_EUREKA.md` : prédire avant de lancer, lois décalées à découvrir, coût par lancement, première tranche jouable et six décisions à prendre |
| 2 | 2026-09-25 | Quatre questions du concept restaient ouvertes | Tranchées par le commanditaire : lois décalées, station lointaine, vue de côté, nom Eurêka ; documents renommés |
| 3 | 2026-09-25 | Le concept n'était qu'un document : impossible de juger si la boucle « prédire, lancer, lire » est amusante | Première tranche jouable : moteur 2D déterministe (`src/moteur.js`), lois cachées (`src/lois.js`), cinq expériences du chapitre « La chute », tableau noir à quatre modes dont la formule à blocs, Carnet en `localStorage`, rendu sur canvas avec les sprites CC0 de Kenney ; tests Node et test de fumée navigateur qui joue le chapitre entier (`tools/suite.sh court`) |
| 4 | 2026-09-25 | Le bécher (0,9 m de large, 0,8 m de haut) interceptait la bille par sa paroi gauche quand on le plaçait au point de chute : la prédiction « pointer » était injouable | Bécher élargi à 1,2 m et abaissé à 0,45 m : placé au point de chute, il attrape la bille ; le test `experiences.test.js` le vérifie |
| 5 | 2026-09-25 | L'attribut `hidden` était écrasé par les règles `display: flex` : les commandes de lecture restaient visibles après un lancement | `[hidden] { display: none !important; }` dans les deux feuilles de style |
| 6 | 2026-09-25 | Le commanditaire voulait essayer une pêche au geste : lancer, ferrer et fatiguer le poisson avec le téléphone | Prototype Touche ! dans `touche/` : gestes lus sur le gyroscope et l'accéléromètre (pics, pompage, suivi), échauffement qui règle le seuil, combat à tension et énergie, sept espèces, carnet ; secours au toucher et au clavier ; tests Node et fumée navigateur avec capteurs simulés |
