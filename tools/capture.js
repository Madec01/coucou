// Photographie Touche ! aux moments clés : accueil, flotteur posé, combat, prise.
// Usage : node tools/capture.js <dossier> [url]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');
(async () => {
  const dossier = process.argv[2] || 'docs/releve';
  const url = process.argv[3] || 'http://localhost:8765/';
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 420, height: 820 }, isMobile: true, hasTouch: true });
  await page.goto(url);
  await page.waitForFunction(() => window.touche);
  await page.screenshot({ path: path.join(dossier, 'touche-accueil.png') });
  await page.evaluate(() => { window.touche.etat.mode = 'secours'; window.touche.commencer(); });
  await page.evaluate(() => window.touche.lancer(0.7));
  await page.waitForFunction(() => window.touche.etat.partie.etat === 'attente');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dossier, 'touche-attente.png') });
  await page.evaluate(() => window.touche.etat.partie.forcerTouche());
  await page.waitForFunction(() => window.touche.etat.partie.etat === 'touche');
  await page.waitForTimeout(150);
  await page.screenshot({ path: path.join(dossier, 'touche-touche.png') });
  await page.evaluate(() => window.touche.ferrer());
  await page.waitForFunction(() => window.touche.etat.partie.poisson && window.touche.etat.partie.poisson.phase === 'rush');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(dossier, 'touche-combat.png') });
  await page.evaluate(() => { const p = window.touche.etat.partie; p.poisson.distance = 0.5; p.poisson.phase = 'repos'; p.pomper(); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dossier, 'touche-prise.png') });
  await b.close();
  console.log(`captures dans ${dossier}/`);
})().catch((e) => { console.error(e); process.exit(1); });
