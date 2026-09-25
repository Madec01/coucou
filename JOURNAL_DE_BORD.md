# Journal de bord — Touche !

Une ligne par changement notable : « ce qui n'allait pas | ce qui a été fait ».

| # | Date | Ce qui n'allait pas | Ce qui a été fait |
|---|---|---|---|
| 1 | 2026-09-25 | Le dépôt hébergeait Eurêka, un jeu d'expériences (concept et première tranche) ; le commanditaire voulait une pêche au geste | Prototype Touche ! : gestes lus sur le gyroscope et l'accéléromètre (pics, pompage, suivi), échauffement qui règle le seuil, combat à tension et énergie, sept espèces, carnet ; secours au toucher et au clavier ; tests Node et fumée navigateur avec capteurs simulés |
| 2 | 2026-09-25 | L'attribut `hidden` était écrasé par les règles `display: flex` | `[hidden] { display: none !important; }` |
| 3 | 2026-09-25 | Touche ! vivait dans un sous-dossier et le commanditaire ne le trouvait pas | Eurêka retiré (il reste dans l'historique, commit `a96014d` et avant), Touche ! remonté à la racine, documents réécrits |
| 4 | 2026-09-25 | Sur le téléphone du commanditaire, la page de Touche ! chargeait la feuille de style et les scripts d'Eurêka restés en cache (mêmes noms `css/style.css`, `src/jeu.js`, `src/rendu.js` à la même adresse) : page trop large, canvas noir, bouton mort | Fichiers renommés (`css/touche.css`, `src/touche.js`, `src/lac.js`) et versionnés dans la page ; les deux demandes de permission iOS partent dans le même geste ; sons aussi en mp3 pour Safari |
