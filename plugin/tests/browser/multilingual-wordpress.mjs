import assert from 'node:assert/strict';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import {chromium} from 'playwright';
const fixture=JSON.parse(await readFile('/tmp/cb-multilingual-options.json','utf8'));
const base='http://127.0.0.1:9403';
const labels={en:['Reject All','Allow and play'],pl:['Odrzuć wszystkie','Zgadzam się — odtwórz'],de:['Alle ablehnen','Zustimmen und abspielen']};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
try{
 for(const [lang,pageId] of Object.entries(fixture.testPages)){
  const context=await browser.newContext();const page=await context.newPage();page.setDefaultNavigationTimeout(60000);const external=[];const receipts=[];
  await context.route('**/*',route=>{
   if(new URL(route.request().url()).origin===base)return route.continue();external.push(route.request().url());
   return route.fulfill({contentType:route.request().resourceType()==='script'?'application/javascript':'text/html',body:route.request().resourceType()==='script'?'window.playerLoaded=true':'<button onclick="this.textContent=\'Playing\'">Play</button>'});
  });
  page.on('response',r=>{if(r.url().includes('consent-receipts')&&r.request().method()==='POST')receipts.push(r);});
  await page.goto(`${base}/?page_id=${pageId}&lang=${lang}`,{waitUntil:'domcontentloaded'});
  await page.getByRole('heading',{name:`Banner ${lang}`,exact:true}).waitFor();
  const cfg=await page.evaluate(()=>window.__cookieConsent);
  assert.equal(cfg.lang,lang);if(lang==='de')assert.equal(cfg.controller.name,'Verantwortlicher aus Polylang');assert.equal(cfg.purposes,`Purpose ${lang}`);
  assert.equal(new URL(cfg.receiptEndpoint).searchParams.get('cookie4_lang'),lang);
  assert.ok(cfg.privacyPolicyUrl.includes(String(fixture.testPolicies[lang])) || new URL(cfg.privacyPolicyUrl).pathname.includes(lang));
  assert.equal(cfg.serviceDisclosures.youtube.description,`Video ${lang}`);
  assert.deepEqual(external,[]);
  const reject=page.getByRole('button',{name:labels[lang][0],exact:true});
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),reject.click()]);
  assert.deepEqual(external,[]);
  await page.locator('.cb-content-placeholder').first().getByRole('button',{name:labels[lang][1],exact:true}).waitFor();
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),page.locator('.cb-content-placeholder').first().getByRole('button',{name:labels[lang][1],exact:true}).click()]);
  await page.frameLocator('iframe[title="Video"]').getByRole('button',{name:'Play',exact:true}).click();
  await page.frameLocator('iframe[title="Video"]').getByRole('button',{name:'Playing',exact:true}).waitFor();
  await page.waitForTimeout(250);
  assert.ok(receipts.length>=2,'refusal and grant retained');
  for(const response of receipts)assert.equal(response.status(),200,`receipt language ${lang}`);
  if(lang==='en'){
   const count=external.length;
   await page.goto(`${base}/?page_id=${fixture.testPages.pl}&lang=pl`,{waitUntil:'domcontentloaded'});
   await page.getByRole('heading',{name:'Banner pl',exact:true}).waitFor();
   await page.locator('.cb-content-placeholder').first().getByRole('button',{name:labels.pl[1],exact:true}).waitFor();
   assert.equal(external.length,count,'EN grant cannot open a provider before PL consent');
  }
  results.push(`${lang}: actual Polylang 3.9.1 page language, translated policy page and custom disclosures; no pre-consent/refusal requests; consent starts interactive iframe; language-bound receipts accepted`);
  await context.close();
 }
 await mkdir(new URL('../../../docs/research/multilingual/',import.meta.url),{recursive:true});
 await writeFile(new URL('../../../docs/research/multilingual/wordpress-results.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
 console.log(results.join('\n'));
}finally{await browser.close();}
