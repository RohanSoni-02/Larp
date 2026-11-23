const { chromium } = require('playwright');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await p.goto('file://' + __dirname + '/index.html');
  await p.evaluate(() => document.fonts.ready);
  for (const t of times) { await p.evaluate(t => render(t), t); await p.screenshot({ path: `${__dirname}/stills2/t${t.toFixed(2)}.png` }); }
  await b.close();
})();
