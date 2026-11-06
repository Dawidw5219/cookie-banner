import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { cookies } from './fixtures/admin-design.mjs';

const base = process.env.WORDPRESS_TEST_URL || 'http://127.0.0.1:9403';
const session = JSON.parse(await fs.readFile(process.env.WORDPRESS_ADMIN_SESSION || '/tmp/cb-admin-test-session.json', 'utf8'));
const dir = 'docs/screenshots/admin-layout';
const browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
 const context = await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
 await context.addCookies(session.cookies);
 const page = await context.newPage();
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.origin!==base) return route.abort();
  if(url.pathname.endsWith('/cookie4/v1/cookies') && route.request().method()==='GET') return route.fulfill({json:{cookies,last_scan:'2026-11-06 12:00:00',scan_active:false,audit_active:false}});
  return route.continue();
 });
 await fs.mkdir(dir,{recursive:true});
 await page.goto(base+'/wp-admin/options-general.php?page=cookie-banner-wp#appearance',{waitUntil:'domcontentloaded'});
 const nav=page.getByRole('navigation',{name:'Cookie Banner sections'});
 await nav.waitFor();
 for(const width of [1440,1280,1024,768,390,320,1440]) {
  await page.setViewportSize({width,height:1100});
  await nav.getByRole('button',{name:'Banner & texts',exact:true}).click();
  await page.locator('.cb-preview-stage[aria-busy="false"]').waitFor();
  const iframe=page.locator('.cb-preview-stage iframe');
  await iframe.scrollIntoViewIfNeeded();
  const expected=await iframe.evaluate(el=>el.clientWidth);
  const frame=page.frames().find(frame=>frame.url().includes('cookie4_preview'));
  await frame.waitForFunction(expected=>Math.abs(innerWidth-expected)<1,expected);
  const geometry=await iframe.evaluate(el=>({iframe:el.getBoundingClientRect().width,stage:el.parentElement.getBoundingClientRect().width}));
  assert.ok(Math.abs(geometry.iframe-geometry.stage)<1,`${width}px: iframe must fill its stage`);
  assert.ok(Math.abs(await frame.evaluate(()=>document.body.getBoundingClientRect().width)-expected)<1,`${width}px: preview body must fill iframe`);
  const barButtons = frame.getByRole('button',{name:/^Odrzuć wszystkie$|^Zaakceptuj wszystkie$|^Ustawienia zaawansowane$/});
  const buttonStyles=await barButtons.evaluateAll(elements=>elements.map(el=>({height:el.getBoundingClientRect().height,font:getComputedStyle(el).fontSize})));
  assert.equal(buttonStyles.length,3);
  assert.ok(buttonStyles.every(style=>style.height===40 && style.font===buttonStyles[0].font),'Banner actions must share height and typography');
  await frame.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  if([1440,390].includes(width)) await page.locator('.cb-preview-card').screenshot({path:`${dir}/preview-${width}.png`,animations:'disabled'});
  const navigation=await nav.evaluate(el=>{
   const buttons=[...el.querySelectorAll('button')].map(button=>button.getBoundingClientRect());
   const style=getComputedStyle(el);
   return {width:el.getBoundingClientRect().width,oneRow:buttons.every(button=>Math.abs(button.y-buttons[0].y)<1),content:buttons.reduce((sum,button)=>sum+button.width,0)+parseFloat(style.gap)*(buttons.length-1)+parseFloat(style.paddingLeft)+parseFloat(style.paddingRight)+2};
  });
  if(navigation.oneRow) assert.ok(Math.abs(navigation.width-navigation.content)<2,`${width}px: unused navigation width`);
  if([1440,390].includes(width)) await nav.screenshot({path:`${dir}/navigation-${width}.png`,animations:'disabled'});
  await nav.getByRole('button',{name:'Cookies & scan',exact:true}).click();
  const last=page.locator('.cb-scanner-stats .cb-stat-card').last().locator('.cb-stat-value');
  await page.getByText('06.11.26 12:00:00',{exact:true}).waitFor();
  assert.equal(await last.getAttribute('title'),'2026-11-06 12:00:00');
  const text=await last.evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);return {lines:range.getClientRects().length,textWidth:range.getBoundingClientRect().width,width:el.clientWidth,height:el.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(el).lineHeight)}});
  assert.equal(text.lines,1,`${width}px: date must occupy one line`);
  assert.ok(text.textWidth<=text.width,`${width}px: date must not overflow`);
  assert.ok(text.height<=text.lineHeight+1);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: page overflow`);
  if([1440,390].includes(width)) await page.locator('.cb-scanner-stats').screenshot({path:`${dir}/stats-${width}.png`,animations:'disabled'});
  console.log(`PASS ${width}px: full-width iframe and contents, compact navigation, single-line last scan`);
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
