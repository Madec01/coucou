// Test de fumée navigateur : charge tout le jeu dans Chromium et joue le chapitre entier,
// les cinq expériences, en vérifiant qu'aucune erreur de console n'apparaît et que le
// Carnet reçoit une page par expérience.
// Usage : node tests/gate.js [url]   (par défaut http://localhost:8765/)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:8765/';
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1400, height: 900 } });
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.goto(url);
  await page.waitForFunction(() => window.eureka && window.eureka.etat.exp);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.eureka && window.eureka.etat.exp && window.eureka.etat.exp.id === 'becher');

  const lancerJusquAuBout = async () => {
    await page.click('#lancer');
    await page.waitForSelector('#lecture-controles:not([hidden])');
    await page.click('#lecture-fin');
    await page.waitForSelector('#resultat:not([hidden])');
  };
  const attendre = (id) => page.waitForFunction((i) => window.eureka.etat.exp.id === i, id);
  const pagesCarnet = () => page.$$eval('#carnet .page', (p) => p.length);

  // 1. Le bécher : raté avec la valeur par défaut, réussi au point de chute lu dans la lecture.
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.rate');
  const xChute = await page.$eval('#resultat td', (td) => parseFloat(td.textContent.replace(',', '.')));
  if (!(xChute > 3 && xChute < 9)) throw new Error(`point de chute absurde : ${xChute}`);
  await page.click('#resultat .secondaire');
  await page.$eval('input[data-reglage="becherX"]', (i, x) => {
    i.value = String(Math.round(x * 20) / 20);
    i.dispatchEvent(new Event('input', { bubbles: true }));
  }, xChute);
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.reussi');
  if (await pagesCarnet() !== 1) throw new Error('Carnet : la page 1 manque');
  await page.click('#resultat .principal');

  // 2. Le chrono : une mesure d'abord, puis la prédiction juste.
  await attendre('chrono');
  await page.fill('#tableau-chiffre', '1');
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.rate');
  const t = await page.$$eval('#resultat td', (tds) => parseFloat(tds[1].textContent.replace(',', '.')));
  await page.click('#resultat .secondaire');
  await page.fill('#tableau-chiffre', t.toFixed(2));
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.reussi');
  await page.click('#resultat .principal');

  // 3. Deux billes : ensemble.
  await attendre('masses');
  await page.click('#tableau .pastille.ensemble');
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.reussi');
  await page.click('#resultat .principal');

  // 4. La rouge et la bleue : « ensemble » est faux, « rouge » est juste.
  await attendre('couleurs');
  await page.click('#tableau .pastille.ensemble');
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.rate');
  await page.click('#resultat .secondaire');
  await page.click('#tableau .pastille.rouge');
  await lancerJusquAuBout();
  await page.waitForSelector('#resultat.reussi');
  await page.click('#resultat .principal');

  // 5. La loi : mesurer la rouge, assembler 2 × h ÷ t², reporter ; puis la bleue ; publier.
  await attendre('loi');
  const bloc = async (j) => { await page.click(`#tableau .bloc:text-is("${j}")`); };
  for (const [couleur, champ] of [['rouge', 'g de la rouge'], ['bleu', 'g de la bleue']]) {
    await page.click(`#montage .pastille.${couleur}`);
    await lancerJusquAuBout();
    await page.waitForSelector('#resultat.mesure');
    if (couleur === 'rouge') for (const j of ['2', '×', 'h', '÷', 't', '²']) await bloc(j);
    await page.click(`#tableau .formule .actions button:text-is("→ ${champ}")`);
    if (couleur === 'rouge') await page.click('#resultat .secondaire');
  }
  await page.click('#publier');
  await page.waitForSelector('#resultat.reussi');
  if (await pagesCarnet() !== 5) throw new Error(`Carnet : ${await pagesCarnet()} page(s) au lieu de 5`);

  if (process.env.CAPTURE) await page.screenshot({ path: process.env.CAPTURE, fullPage: true });
  await navigateur.close();
  if (erreurs.length) { console.error('Erreurs de console :\n' + erreurs.join('\n')); process.exit(1); }
  console.log('gate : les cinq expériences jouées, cinq pages au Carnet, aucune erreur de console.');
})().catch((e) => { console.error(e); process.exit(1); });
