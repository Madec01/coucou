// Photographie chaque expérience : le montage, puis la fin d'un lancement.
// Usage : node tools/capture.js <dossier> [url]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const dossier = process.argv[2] || 'docs/releve';
  const url = process.argv[3] || 'http://localhost:8765/';
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto(url);
  await page.waitForFunction(() => window.eureka && window.eureka.etat.exp);
  // On débloque tout pour photographier, sans toucher au vrai Carnet.
  await page.evaluate(() => {
    const p = { faites: {}, carnet: [] };
    for (const e of window.eureka.EXPERIENCES) p.faites[e.id] = { lancements: 1, premierCoup: true };
    localStorage.setItem('eureka.progression.v1', JSON.stringify(p));
  });
  await page.reload();
  await page.waitForFunction(() => window.eureka && window.eureka.etat.exp);
  const ids = await page.evaluate(() => window.eureka.EXPERIENCES.map((e) => e.id));
  for (const id of ids) {
    await page.evaluate((i) => window.eureka.choisir(i), id);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dossier, `${id}-montage.png`) });
    await page.evaluate(() => {
      const e = window.eureka.etat;
      if (e.exp.prediction.type === 'chiffre') e.prediction = 1;
      if (e.exp.prediction.type === 'choix') e.prediction = e.exp.prediction.options[0].id;
      window.eureka.lancer();
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(dossier, `${id}-vol.png`) });
    await page.click('#lecture-fin');
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(dossier, `${id}-lecture.png`), fullPage: true });
  }
  await page.evaluate(() => localStorage.removeItem('eureka.progression.v1'));
  await navigateur.close();
  console.log(`captures dans ${dossier}/`);
})().catch((e) => { console.error(e); process.exit(1); });
