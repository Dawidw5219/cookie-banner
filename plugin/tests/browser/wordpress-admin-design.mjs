import { browserTestOutputDirectory } from "../../../tests/browser-output.mjs";
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { checkAdminContrast } from '../fixtures/check-admin-contrast.mjs';
import { cookies, trackers, services } from '../fixtures/admin-design.mjs';


const base = process.env.WORDPRESS_TEST_URL || 'http://127.0.0.1:9403';
const session = JSON.parse(await fs.readFile(process.env.WORDPRESS_ADMIN_SESSION || '/tmp/cb-admin-test-session.json', 'utf8'));
const dir = browserTestOutputDirectory + "/screenshots/admin-reviewed";
const sections = [['overview','Overview'], ['appearance','Banner & texts'], ['services','Services'], ['cookies','Cookies & scan'], ['integration','WordPress integration'], ['diagnostics','Diagnostics']];
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const checks = [];
try {
 const context = await browser.newContext({ viewport: {width:1440,height:1100}, reducedMotion:'reduce', permissions:['clipboard-read','clipboard-write'] });
 await context.addCookies(session.cookies);
 const page = await context.newPage();
 const errors = [];
 let previewRequests = 0;
 page.on('request', request => { if (new URL(request.url()).pathname.endsWith('/assets/cookie-banner.js')) previewRequests += 1; });
 page.on('pageerror', error => errors.push(error.stack));
 let empty = false;
 let servicesError = false;
 let failPreview = false;
 await page.route('**/*', async route => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.origin !== base) return route.abort();
  if (failPreview && url.pathname.endsWith('/assets/cookie-banner.js')) return route.abort();
  const apiPath = url.pathname.split('/cookie4/v1')[1];
  if (!apiPath) return route.continue();
  if (request.method() !== 'GET') return route.fulfill({status:500,json:{message:'Design test: writes are disabled.'}});
  if (apiPath === '/cookies') return route.fulfill({json:{cookies:empty?[]:cookies,last_scan:empty?'':'2026-11-06 12:00:00',scan_active:false,audit_active:false}});
  if (apiPath === '/trackers') return route.fulfill({json:{trackers:empty?[]:trackers}});
  if (apiPath === '/services') return route.fulfill(servicesError ? {status:503,json:{message:'Could not load services. Please try again.'}} : {json:{services:empty?[]:services}});
  return route.continue();
 });
 const root = page.locator('#cookie-banner-admin');
 const nav = page.getByRole('navigation',{name:'Cookie Banner sections'});
 let loadCount = 0;
 async function load(section='overview') {
  await page.goto(`${base}/wp-admin/options-general.php?page=cookie-banner-wp&design_case=${++loadCount}#${section}`, {waitUntil:'domcontentloaded'});
  await nav.waitFor();
  await page.waitForFunction(() => [...document.querySelectorAll('.cb-stat-value')].every(el => el.textContent !== '—'));
 }
 async function go(id, name) {
  await nav.getByRole('button',{name,exact:true}).click();
  await page.waitForFunction(id => location.hash === '#'+id, id);
  assert.equal(await nav.getByRole('button',{name,exact:true}).getAttribute('aria-current'),'page');
  const active = await nav.getByRole('button',{name,exact:true}).evaluate(el => ({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));
  assert.deepEqual(active,{color:'rgb(255, 255, 255)',background:'rgb(17, 24, 39)'});
 }
 async function settlePreview() {
  const iframe = root.locator('iframe');
  if (!(await iframe.count()) || !(await iframe.isVisible())) return;
  await iframe.scrollIntoViewIfNeeded();
  await page.frameLocator('iframe[title="Isolated cookie banner preview"]').getByRole('button',{name:/^Odrzuć wszystkie$|^Reject all$/}).waitFor({timeout:30000});
  await root.locator('.cb-preview-stage[aria-busy="false"]').waitFor();
 }
 async function capture(name) {
  await settlePreview();
  if (name === 'mobile-appearance') {
   // Chromium omits offscreen iframe paint in full-page captures. Capture the actual
   // visible preview and editor separately instead of presenting a blank screenshot.
   await root.locator('.cb-preview-card').screenshot({path:`${dir}/mobile-preview.png`,animations:'disabled'});
   await root.locator('.cb-appearance-layout > div').first().screenshot({path:`${dir}/mobile-appearance.png`,animations:'disabled'});
   return;
  }
  await page.evaluate(() => scrollTo(0,0));
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.screenshot({path:`${dir}/${name}.png`,fullPage:!(await page.locator('dialog[open]').count()),animations:'disabled'});
 }
 async function checkLayout(label) {
  assert.deepEqual(await page.evaluate(checkAdminContrast),[],label+': rendered text contrast');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${label}: document overflow`);
  const badControls = await root.locator('input:not([type]),input[type="text"],input[type="url"],select,textarea').evaluateAll(elements => elements.filter(el => el.getClientRects().length).flatMap(el => {
   const style = getComputedStyle(el);
   return style.borderRadius !== '8px' || style.fontSize !== '14px' || parseFloat(style.height)<48 ? [{tag:el.tagName,label:el.getAttribute('aria-label'),height:style.height,font:style.fontSize,radius:style.borderRadius}] : [];
  }));
  assert.deepEqual(badControls,[], label+': control design');
  const badHeadings = await root.locator('.cb-card-header h2').evaluateAll(elements => elements.filter(el => el.getClientRects().length).filter(el => getComputedStyle(el).fontSize !== '18px' || getComputedStyle(el).fontWeight !== '600').map(el=>el.textContent));
  assert.deepEqual(badHeadings,[],label+': card heading design');
 }
 await fs.mkdir(dir,{recursive:true});
 await load();
 await page.waitForFunction(() => document.querySelector('.cb-stat-value')?.textContent === '5');
 for (const [id,name] of sections) {
  await go(id,name);
  if(id==='services') await page.getByRole('heading',{name:'Appointment calendar',exact:false}).first().waitFor();
  if(id==='cookies') await page.getByRole('region',{name:'Detected cookie entries'}).waitFor();
  if(id==='diagnostics') {
   await page.getByRole('button',{name:'Check frontend headers',exact:true}).click();
   await page.getByText('✓ Default-deny CSP',{exact:true}).waitFor();
   await page.getByText('Response headers',{exact:true}).click();
  }
  await checkLayout('desktop '+id);
  await capture(id);
  console.log('Captured desktop '+id);
  checks.push('Desktop '+name+' reviewed with populated data');
 }
 assert.equal(previewRequests,1,'The initial preview configuration must load only once.');
 checks.push('Initial preview script loads once; current update acknowledgement is awaited');
 // Exercise table filters, including a legitimate empty result.
 await go('cookies','Cookies & scan');
 const category = page.getByLabel('Filter by category',{exact:true});
 await category.selectOption('Security');
 await page.getByText('No entries match these filters.',{exact:true}).waitFor();
 await capture('cookies-filter-empty');
 await category.selectOption('');
 await page.getByRole('button',{name:'Import JSON',exact:true}).click();
 // The hidden file input is filled directly to avoid an operating-system file dialog.
 const file = root.locator('input[type="file"]');
 await file.setInputFiles({name:'design-cookies.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({cookies:[...cookies,{...cookies[0],name:'new_preference'}]}))});
 const dialog = page.getByRole('dialog',{name:'Import Cookies'});
 await dialog.waitFor();
 assert.equal(await dialog.getByRole('button',{name:'Import 6',exact:true}).count(),1);
 await dialog.getByRole('checkbox',{name:'Import new_preference',exact:true}).uncheck();
 await dialog.getByRole('button',{name:'Import 5',exact:true}).waitFor();
 await capture('import');
 await page.setViewportSize({width:390,height:844});
 await checkLayout('mobile import');
 await capture('mobile-import');
 await dialog.getByRole('button',{name:'Import 5',exact:true}).click();
 await dialog.getByRole('alert').waitFor();
 await checkLayout('import error');
 await dialog.press('Escape');
 assert.equal(await dialog.count(),0);
 checks.push('Import: selection, native modal focus, Escape and responsive footer');
 await page.setViewportSize({width:1440,height:1100});
 await go('integration','WordPress integration');
 await page.getByRole('button',{name:'Copy Cookie Policy Table',exact:true}).click();
 assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),'[cookie_policy_table]');
 checks.push('Shortcode copy works');
 await go('appearance','Banner & texts');
 const toggle = page.getByRole('switch').first();
 const checked = await toggle.isChecked();
 await toggle.focus(); await toggle.press('Space'); assert.equal(await toggle.isChecked(),!checked);
 await toggle.press('Space'); assert.equal(await toggle.isChecked(),checked);
 const trigger = root.locator('.cb-color-trigger').first();
 await trigger.click();
 const picker = page.getByRole('dialog',{name:/^Choose /});
 const hex = picker.getByRole('textbox',{name:'HEX color'});
 await hex.fill('#abc'); await hex.press('Enter'); assert.equal(await hex.inputValue(),'#aabbcc');
 await hex.fill('invalid'); await picker.getByRole('button',{name:'Done',exact:true}).click();
 await picker.getByRole('alert').waitFor();
 await capture('color-picker-invalid');
 await hex.fill('#111827'); await hex.press('Enter');
 await capture('color-picker');
 const previewAccept = page.frameLocator('iframe[title="Isolated cookie banner preview"]').getByRole('button',{name:/^Zaakceptuj wszystkie$|^Accept all$/});
 assert.equal(await previewAccept.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(17, 24, 39)');
 await hex.press('Escape');
 assert.equal(await trigger.evaluate(el=>document.activeElement===el),true);
 await page.getByLabel('Language',{exact:true}).selectOption('custom');
 await root.locator('.cb-text-group').first().waitFor();
 await checkLayout('custom texts');
 await capture('custom-texts');
 checks.push('Appearance: switch keyboard, valid/invalid HEX, focus return, custom text fields and current preview color');
 // Reload discards the temporary UI draft before capturing the six clean mobile tabs.
 await load();
 await page.setViewportSize({width:390,height:844});
 for (const [id,name] of sections) {
  await go(id,name);
  await checkLayout('mobile '+id);
  await capture('mobile-'+id);
  console.log('Captured mobile '+id);
  checks.push('Mobile '+name+' reviewed');
 }
 for (const width of [320,768,1024]) {
  await page.setViewportSize({width,height:900});
  for (const [id,name] of sections) {await go(id,name); await checkLayout(width+' '+id);}
 }
 checks.push('All six tabs fit 320, 390, 768, 1024 and 1440px');
 await page.setViewportSize({width:1440,height:1100});
 failPreview=true;
 await load('appearance');
 await page.getByText('The preview could not be loaded.',{exact:true}).waitFor({timeout:20000});
 // Capture the error without waiting for the intentionally blocked iframe to load.
 await page.screenshot({path:`${dir}/preview-error.png`,fullPage:true,animations:'disabled'});
 failPreview=false;
 await page.getByRole('button',{name:'Retry preview',exact:true}).click();
 await settlePreview();
 checks.push('Preview load error is visible and Retry recovers the sandboxed banner');
 // Empty and failed API states are rendered without changing the WordPress database.
 empty=true;
 await page.setViewportSize({width:1440,height:1100});
 await load('cookies');
 await page.getByText('No cookies detected yet',{exact:true}).waitFor();
 await capture('cookies-empty');
 await go('services','Services');
 await page.getByText('Your scanner and built-in catalog are ready',{exact:true}).waitFor();
 await capture('services-empty');
 servicesError=true;
 await load('services');
 await page.getByRole('alert').filter({hasText:'Could not load services.'}).waitFor();
 await capture('services-error');
 assert.equal(await page.getByRole('button',{name:'Add service',exact:true}).isDisabled(),true);
 assert.equal(await page.getByText('Your scanner and built-in catalog are ready',{exact:true}).count(),0);
 servicesError=false;
 await page.getByRole('button',{name:'Reload saved services',exact:true}).click();
 await page.getByText('Your scanner and built-in catalog are ready',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'Add service',exact:true}).isDisabled(),false);
 checks.push('Empty scanner, empty services and service load error reviewed');
 assert.deepEqual(errors,[]);
 await fs.writeFile(browserTestOutputDirectory + "/admin-design-results.json",JSON.stringify({environment:base,fixture:'plugin/tests/fixtures/admin-design.mjs',note:'Real WordPress styles and compiled plugin assets; browser-only data fixtures. No database writes.',checks,jsErrors:errors},null,2)+'\n');
 console.log(checks.join('\n'));
} finally {await browser.close();}
