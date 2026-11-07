import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const base='http://127.0.0.1:9403';
const session=JSON.parse(await readFile('/tmp/cb-admin-test-session.json','utf8'));
const fixture=JSON.parse(await readFile('/tmp/cb-multilingual-options.json','utf8'));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const context=await browser.newContext({viewport:{width:1440,height:1100}});await context.addCookies(session.cookies);
await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
const page=await context.newPage();let original;
try{
 await page.goto(base+'/wp-admin/options-general.php?page=cookie-banner-wp',{waitUntil:'domcontentloaded',timeout:60000});
 original=await page.evaluate(async()=>{const r=await fetch(window.cookie4Admin.restUrl+'/settings',{headers:{'X-WP-Nonce':window.cookie4Admin.nonce}});return(await r.json()).settings.localizations;});
 await page.getByRole('button',{name:'Banner & texts',exact:true}).click();
 await page.getByLabel('Editing language code',{exact:true}).fill('de');
 await page.getByLabel('Purposes in this language',{exact:true}).fill('Videos nur nach Ihrer Einwilligung.');
 await page.getByText('Banner, preferences and blocker texts',{exact:true}).click();
 await page.getByLabel('Banner title',{exact:true}).fill('Datenschutz im Test');
 await page.getByLabel('content.allowPlay',{exact:true}).fill('Video erlauben');
 const save=page.waitForResponse(r=>r.url().includes('/settings')&&r.request().method()==='PUT');
 await page.getByRole('button',{name:'Save Settings',exact:true}).click();assert.equal((await save).status(),200);
 const preview=page.frameLocator('iframe[title="Isolated cookie banner preview"]');
 await preview.getByRole('heading',{name:'Datenschutz im Test',exact:true}).waitFor();
 const visitor=await browser.newPage();
 await visitor.goto(base+`/?page_id=${fixture.testPages.de}&lang=de`);
 await visitor.getByRole('heading',{name:'Datenschutz im Test',exact:true}).waitFor();
 const cfg=await visitor.evaluate(()=>window.__cookieConsent);
 assert.equal(cfg.purposes,'Videos nur nach Ihrer Einwilligung.');
 assert.equal(await visitor.locator('.cb-content-placeholder button').first().textContent(),'Video erlauben');
 await visitor.close();
 await mkdir(new URL('../../../docs/research/multilingual/',import.meta.url),{recursive:true});
 await writeFile(new URL('../../../docs/research/multilingual/admin-results.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),results:['Real admin locale editor saved a German purpose, title and blocker button; isolated preview and public German page display those exact values; original locale settings restored']},null,2)+'\n');
 console.log('PASS actual locale editor, REST save, translated preview and public page');
}finally{
 if(original!==undefined)await page.evaluate(async original=>{const r=await fetch(window.cookie4Admin.restUrl+'/settings',{method:'PUT',headers:{'Content-Type':'application/json','X-WP-Nonce':window.cookie4Admin.nonce},body:JSON.stringify({localizations:original})});if(!r.ok)throw new Error('Failed to restore locale settings');},original);
 await browser.close();
}
