// Test de fumée navigateur de Touche ! : charge le jeu dans Chromium et le joue deux fois,
// une fois avec des capteurs simulés (on dispatche de vrais événements devicemotion), une
// fois au clavier. Vérifie qu'on va d'un lancer à une prise sans erreur de console.
// Usage : node touche/tests/gate.js [url]   (par défaut http://localhost:8765/touche/)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

(async () => {
  const url = process.argv[2] || 'http://localhost:8765/touche/';
  const navigateur = await chromium.launch();
  const page = await navigateur.newPage({ viewport: { width: 420, height: 800 }, isMobile: true, hasTouch: true });
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });

  // Des capteurs simulés : un bruit de fond régulier, plus des gestes à la demande.
  await page.addInitScript(() => {
    window.__capteurs = { rot: 0, acc: 0, beta: 0, gamma: 0 };
    setInterval(() => {
      const c = window.__capteurs;
      window.dispatchEvent(new DeviceMotionEvent('devicemotion', {
        rotationRate: { alpha: c.rot, beta: 0, gamma: 0 },
        acceleration: { x: 0, y: c.acc, z: 0 },
        interval: 16,
      }));
      window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { beta: c.beta, gamma: c.gamma, alpha: 0 }));
    }, 16);
  });
  const geste = async (champ, valeur, duree = 60) => {
    await page.evaluate(([c, v]) => { window.__capteurs[c] = v; }, [champ, valeur]);
    await page.waitForTimeout(duree);
    await page.evaluate((c) => { window.__capteurs[c] = 0; }, champ);
    await page.waitForTimeout(80);
  };
  const etatPartie = () => page.evaluate(() => window.touche.etat.partie.etat);
  const attendreEtat = (e, delai = 15000) => page.waitForFunction((x) => window.touche.etat.partie.etat === x, e, { timeout: delai });

  await page.goto(url);
  await page.waitForFunction(() => window.touche);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForFunction(() => window.touche);

  // --- Partie 1 : aux capteurs.
  await page.click('#prendre');
  await page.waitForSelector('[data-ecran="calibrage"]:not([hidden])', { timeout: 10000 });
  for (let i = 0; i < 3; i++) { await geste('rot', 700); await page.waitForTimeout(400); }
  await page.waitForFunction(() => window.touche.etat.ecran === 'jeu', null, { timeout: 5000 });
  const mode = await page.evaluate(() => window.touche.etat.mode);
  if (mode !== 'capteurs') throw new Error(`mode ${mode} au lieu de capteurs`);
  await geste('acc', 20);
  await attendreEtat('vol', 3000);
  await attendreEtat('attente');
  await page.evaluate(() => window.touche.etat.partie.forcerTouche());
  await attendreEtat('touche', 3000);
  await geste('rot', 700);
  await attendreEtat('combat', 3000);
  // Le combat : on suit les rushs, on pompe au repos, jusqu'à la prise.
  for (let i = 0; i < 400; i++) {
    const p = await page.evaluate(() => { const f = window.touche.etat.partie.poisson; return f && { phase: f.phase, direction: f.direction }; });
    const e = await etatPartie();
    if (e !== 'combat') break;
    if (p.phase === 'rush') {
      await page.evaluate((g) => { window.__capteurs.gamma = g; }, p.direction * 30);
      await page.waitForTimeout(100);
    } else {
      await page.evaluate(() => { window.__capteurs.gamma = 0; });
      await geste('beta', 50, 120);
      await page.waitForTimeout(150);
    }
  }
  const fin1 = await etatPartie();
  if (fin1 !== 'prise') throw new Error(`partie aux capteurs finie en « ${fin1} » au lieu de « prise »`);
  await page.waitForSelector('#bilan.prise');
  const prises = await page.$$eval('#carnet li', (l) => l.length);
  if (prises !== 1) throw new Error(`carnet : ${prises} espèce(s) au lieu de 1`);
  if (process.env.CAPTURE) await page.screenshot({ path: process.env.CAPTURE });

  // --- Partie 2 : au clavier (on repasse en secours).
  await page.evaluate(() => { window.touche.etat.mode = 'secours'; window.touche.reprendre(); });
  await page.keyboard.down('Space'); await page.waitForTimeout(900); await page.keyboard.up('Space');
  await attendreEtat('vol', 3000);
  await attendreEtat('attente');
  await page.evaluate(() => window.touche.etat.partie.forcerTouche());
  await attendreEtat('touche', 3000);
  await page.keyboard.press('Space');
  await attendreEtat('combat', 3000);
  for (let i = 0; i < 400; i++) {
    const p = await page.evaluate(() => { const f = window.touche.etat.partie.poisson; return f && { phase: f.phase, direction: f.direction }; });
    const e = await etatPartie();
    if (e !== 'combat') break;
    if (p.phase === 'rush') {
      await page.evaluate((d) => window.touche.etat.partie.suivre(d), p.direction);
      await page.waitForTimeout(100);
    } else {
      await page.evaluate(() => window.touche.etat.partie.suivre(0));
      await page.keyboard.press('ArrowUp');
      await page.waitForTimeout(250);
    }
  }
  const fin2 = await etatPartie();
  if (fin2 !== 'prise') throw new Error(`partie au clavier finie en « ${fin2} » au lieu de « prise »`);

  await navigateur.close();
  if (erreurs.length) { console.error('Erreurs de console :\n' + erreurs.join('\n')); process.exit(1); }
  console.log('gate touche : une prise aux capteurs simulés, une prise au clavier, aucune erreur de console.');
})().catch((e) => { console.error(e); process.exit(1); });
