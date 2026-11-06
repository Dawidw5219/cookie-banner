import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base = process.env.WORDPRESS_TEST_URL || 'http://127.0.0.1:9403';
const session = JSON.parse(await fs.readFile(process.env.WORDPRESS_ADMIN_SESSION || '/tmp/cb-admin-test-session.json', 'utf8'));
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const dir = 'docs/screenshots/admin-controls';
try {
 const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
 await context.addCookies(session.cookies);
 const page = await context.newPage();
 const errors = [];
 page.on('pageerror', error => errors.push(error.stack));
 await page.route('**/*', route => new URL(route.request().url()).origin === base ? route.continue() : route.abort());
 await page.goto(base + '/wp-admin/options-general.php?page=cookie-banner-wp', { waitUntil: 'domcontentloaded' });
 const nav = page.getByRole('navigation', { name: 'Cookie Banner sections' });
 await nav.waitFor();
 await page.waitForFunction(() => [...document.querySelectorAll('.cb-stat-value')].every(el => el.textContent !== '—'));
 assert.equal(await page.locator('#cookie-banner-admin h1').evaluate(el => getComputedStyle(el).fontSize), '30px');
 await fs.mkdir(dir, { recursive: true });
 for (const [id, name] of [['overview','Overview'], ['appearance','Banner & texts'], ['services','Services'], ['cookies','Cookies & scan'], ['integration','WordPress integration'], ['diagnostics','Diagnostics']]) {
  await nav.getByRole('button', { name, exact: true }).click();
  const controls = await page.locator('#cookie-banner-admin input:not([type]), #cookie-banner-admin input[type="text"], #cookie-banner-admin input[type="url"], #cookie-banner-admin select, #cookie-banner-admin textarea').evaluateAll(elements => elements.map(el => { const s = getComputedStyle(el); return { radius:s.borderRadius, color:s.color, background:s.backgroundColor }; }));
  for (const control of controls) assert.deepEqual(control, { radius:'8px', color:'rgb(17, 24, 39)', background:'rgb(255, 255, 255)' });
  if (id === 'appearance') {
   await page.frameLocator('iframe[title="Isolated cookie banner preview"]').getByRole('button', {name:/^Odrzuć wszystkie$|^Reject all$/}).waitFor({timeout:60000});
   const toggle = page.getByRole('switch').first();
   const checked = await toggle.isChecked();
   await toggle.focus(); await toggle.press('Space'); assert.equal(await toggle.isChecked(), !checked);
   await toggle.press('Space'); assert.equal(await toggle.isChecked(), checked);
   const trigger = page.locator('.cb-color-trigger').first();
   const original = await trigger.textContent();
   await trigger.click();
   const dialog = page.getByRole('dialog', { name: /^Choose / });
   await dialog.getByRole('button', { name: /to #2563eb$/ }).click();
   assert.match(await trigger.textContent(), /#2563eb/);
   const hex = dialog.getByRole('textbox', { name: 'HEX color' });
   await hex.fill('#abc'); await hex.press('Enter'); assert.equal(await hex.inputValue(), '#aabbcc');
   await hex.fill('invalid'); await dialog.getByRole('button', { name: 'Done', exact: true }).click();
   await dialog.getByRole('alert').waitFor(); assert.match(await trigger.textContent(), /#aabbcc/);
   await hex.press('Escape'); assert.equal(await dialog.count(), 0); assert.equal(await trigger.evaluate(el => document.activeElement === el), true);
   await trigger.click();
   await dialog.getByRole('textbox', { name: 'HEX color' }).fill('#2563eb');
   await dialog.getByRole('textbox', { name: 'HEX color' }).press('Enter');
   await page.screenshot({ path: dir + '/color-picker.png', fullPage: true });
   await page.getByRole('dialog', { name: /^Choose / }).press('Escape');
   console.log('Picker: palette, HEX normalization, invalid value, Escape and focus passed; original ' + original.trim());
  }
  if (id === 'cookies') {
   const colors = await page.getByRole('link', { name:'Open Site in Scan Mode' }).evaluate(el => ({color:getComputedStyle(el).color, background:getComputedStyle(el).backgroundColor}));
   assert.deepEqual(colors, { color:'rgb(255, 255, 255)', background:'rgb(17, 24, 39)' });
  }
  if (id === 'integration') {
   const code = await page.locator('.cb-admin-code').evaluateAll(elements => elements.map(el => ({color:getComputedStyle(el).color, background:getComputedStyle(el).backgroundColor})));
   assert.equal(code.length, 3);
   for (const colors of code) assert.deepEqual(colors, {color:'rgb(17, 24, 39)', background:'rgb(243, 244, 246)'});
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: dir + '/' + id + '.png', fullPage:true });
  console.log(name + ': controls and screenshot passed');
 }
 await page.setViewportSize({width:390,height:844});
 await nav.getByRole('button', { name:'Banner & texts', exact:true }).click();
 await page.locator('.cb-color-trigger').first().click();
 const box = await page.getByRole('dialog', { name:/^Choose / }).boundingBox();
 assert.ok(box.x >= 0 && box.x + box.width <= 390);
 await page.frameLocator('iframe[title="Isolated cookie banner preview"]').getByRole('button', {name:/^Odrzuć wszystkie$|^Reject all$/}).waitFor({timeout:60000});
 await page.screenshot({path:dir+'/mobile-picker.png',fullPage:true});
 assert.deepEqual(errors, []);
 for (const name of ['Overview', 'Banner & texts', 'Services', 'Cookies & scan', 'WordPress integration', 'Diagnostics']) {
  await nav.getByRole('button', { name, exact:true }).click();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), name + ': mobile horizontal overflow');
 }
 console.log('Switch keyboard behavior, all mobile tabs, picker bounds and JS errors passed. No settings saved.');
} finally { await browser.close(); }
