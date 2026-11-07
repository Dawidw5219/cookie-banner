import { browserTestOutputDirectory } from "../browser-output.mjs";
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';


const output = new URL(browserTestOutputDirectory + "/screenshots/consent-redesign/", import.meta.url);
await mkdir(output, { recursive: true });
const config = {
 lang: 'pl', variant: 'modal', noticeVersion: 'design-demo-1',
 controller: { name: 'Studio' },
 purposes: 'Korzystamy z opcjonalnych usług, aby udostępniać filmy i treści interaktywne.',
 privacyPolicyUrl: '/privacy',
 serviceDisclosures: { youtube: { description: 'Wyświetlanie filmów YouTube na Twoje żądanie.', privacyUrl: 'https://policies.google.com/privacy', retention: 'Według ustawień konta i polityki dostawcy' } },
 services: [{ id: 'map-demo', name: 'Mapa interaktywna', description: 'Wyświetlanie mapy na Twoje żądanie.', privacyUrl: 'https://example.com/privacy', retention: 'Czas sesji', urls: ['https://maps.example.com/'] }],
};
const server = createServer(async (req, res) => {
 try {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.endsWith('.js') && !url.pathname.includes('..')) {
   res.setHeader('Content-Type', 'application/javascript');
   res.end(await readFile(new URL('../../dist' + url.pathname, import.meta.url)));
   return;
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="pl"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}body{margin:0;background:#faf9f6;color:#253a32;font-family:system-ui,sans-serif}header{border-bottom:1px solid #dce2dc;padding:24px 6%;font-size:18px;font-weight:650}main{max-width:1080px;margin:auto;padding:50px 24px}h1{font-size:clamp(28px,4vw,44px);letter-spacing:-1.5px;line-height:1.15;margin:12px 0 18px}p{line-height:1.6}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:2px}.grid{display:grid;grid-template-columns:1.3fr 1fr;gap:24px;margin-top:36px}.embed{min-width:0}h2{font-size:16px;font-weight:550;margin-bottom:14px}iframe{border:0}iframe[hidden]{display:none!important}@media(max-width:600px){main{padding:30px 18px}.grid{grid-template-columns:1fr}}
  </style><header>Studio / inspiracje</header><main><span class="eyebrow">Materiały i miejsca</span><h1>Wszystko zaczyna się<br>od dobrej inspiracji.</h1><p>Obejrzyj materiał i poznaj miejsce, w którym powstał.</p><div class="grid"><div class="embed"><h2>Film z naszej pracowni</h2><iframe hidden data-cb-service="youtube" data-cb-src="https://www.youtube.com/embed/demo" title="YouTube"></iframe></div><div class="embed"><h2>Znajdź nas na mapie</h2><iframe hidden data-cb-service="map-demo" data-cb-src="https://maps.example.com/demo" title="Mapa"></iframe></div></div></main><script type="module">import{initializeConsent}from'/native.js';await initializeConsent(${JSON.stringify(config)});</script></html>`);
 } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
 for (const width of [320, 390, 1440]) {
  const context = await browser.newContext({ viewport: { width, height: 1000 } });
  const page = await context.newPage();
  const external = [];
  await context.route('**/*', route => {
   if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
   external.push(route.request().url());
   return route.abort();
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole('button', { name: 'Odrzuć wszystkie', exact: true }).waitFor();
  // Keep the first layer free from fixture identities and duplicated purpose copy.
  assert.equal(await page.getByText(config.controller.name, { exact: true }).count(), 0);
  assert.equal(await page.getByText(config.purposes, { exact: true }).count(), 0);
  await page.screenshot({ path: fileURLToPath(new URL(`popup-${width}.png`, output)), fullPage: true });
  await page.getByRole('button', { name: 'Ustawienia zaawansowane', exact: true }).click();
  await page.locator(".cb-notice-details > summary").click();
  await page.getByText(config.controller.name, { exact: true }).waitFor();
  await page.getByText(config.purposes, { exact: true }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL(`preferences-${width}.png`, output)), fullPage: true });
  await page.getByRole('button', { name: 'Odrzuć wszystkie', exact: true }).click();
  await page.locator('.cb-content-placeholder').first().waitFor();
  await page.screenshot({ path: fileURLToPath(new URL(`blockers-${width}.png`, output)), fullPage: true });
  await page.locator('.cb-content-placeholder summary').first().click();
  assert.equal(await page.locator('.cb-content-placeholder details').first().evaluate(el => el.open), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
  for (const box of await page.locator('.cb-content-placeholder').all()) {
   assert.equal(await box.evaluate(el => el.scrollWidth > el.clientWidth + 1), false, 'Placeholder text fits');
  }
  if (external.length) throw new Error('Unexpected external requests: ' + external.join(', '));
  console.log(`Captured popup and blockers at ${width}px; no external requests`);
  await context.close();
 }
} finally {
 await browser.close();
 await new Promise(resolve => server.close(resolve));
}
