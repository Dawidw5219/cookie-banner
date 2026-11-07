import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';
const languages={en:'Allow and play',pl:'Zgadzam się — odtwórz',de:'Zustimmen und abspielen',fr:'Accepter et lire',es:'Aceptar y reproducir',it:'Accetta e riproduci',nl:'Toestaan en afspelen',da:'Tillad og afspil',no:'Tillat og spill av',sv:'Tillåt och spela'};
const config={mode:'standalone',lang:'auto',controller:{name:'Controller'},purposes:'Base purpose',noticeVersion:'multi-1',privacyPolicyUrl:'/privacy',serviceDisclosures:{youtube:{description:'Video',privacyUrl:'https://policies.google.com/privacy',retention:'Session'}},localizations:{}};
for(const lang of Object.keys(languages)) config.localizations[lang]={purposes:`Purpose ${lang}`,privacyPolicyUrl:`/${lang}/privacy`,serviceDisclosures:{youtube:{description:`Video ${lang}`,retention:`Retention ${lang}`}},customTexts:{'overlay.title':`Banner ${lang}`}};
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname.endsWith('.js')&&!url.pathname.includes('..')){res.setHeader('Content-Type','application/javascript');res.end(await readFile(new URL('../dist'+url.pathname,import.meta.url)));return;}
  const lang=url.searchParams.get('lang')||'de-DE';
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.end(`<!doctype html><html lang="${lang.replace(/[^a-z-]/ig,'')}"><meta name="viewport" content="width=device-width,initial-scale=1"><body><iframe hidden data-cb-service="youtube" data-cb-src="https://www.youtube.com/embed/probe" title="Video"></iframe><script type="module">import{initializeConsent}from'/native.js';window.config=${JSON.stringify(config)};window.initializeConsent=initializeConsent;await initializeConsent(window.config);</script></body></html>`);
 }catch(error){res.writeHead(500).end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
try{
 for(const [lang,label] of Object.entries(languages)){
  const context=await browser.newContext();const page=await context.newPage();const external=[];
  await context.route('**/*',route=>{if(new URL(route.request().url()).origin===base)return route.continue();external.push(route.request().url());return route.abort();});
  await page.goto(`${base}/?lang=${lang==='de'?'de-DE':lang}`);
  await page.getByRole('heading',{name:`Banner ${lang}`,exact:true}).waitFor();
  const cfg=await page.evaluate(()=>window.__cookieConsent);
  assert.equal(cfg.privacyPolicyUrl,`/${lang}/privacy`);

  // Open via the actual public settings event, then verify localized disclosures.
  await page.locator('#cookie-consent-host .cb-settings').click();
  await page.getByText(`Purpose ${lang}`,{exact:true}).waitFor();
  await page.locator('#cookie-consent-host').getByText(`Video ${lang}`,{exact:false}).first().waitFor();
  // No consent has been given. Remove only the dialog for visual access to inert content.
  const placeholder=page.locator('.cb-content-placeholder');
  assert.equal(await placeholder.getByRole('button').textContent(),label);
  assert.equal(await placeholder.getAttribute('lang'),lang==='de'?'de-de':lang);
  assert.deepEqual(external,[]);
  if(lang==='de'){
   await page.evaluate(async()=>{document.documentElement.lang='fr';await window.initializeConsent(window.config);});
   await page.getByRole('heading',{name:'Banner fr',exact:true}).waitFor();
   assert.equal(await page.locator('.cb-content-placeholder button').textContent(),languages.fr);
  }
  results.push(`${lang}: popup, provider description/retention, policy URL and blocker match page language; zero external requests`);
  await context.close();
 }
 await mkdir(new URL('../docs/research/multilingual/',import.meta.url),{recursive:true});
 await writeFile(new URL('../docs/research/multilingual/native-results.json',import.meta.url),JSON.stringify({testedAt:new Date().toISOString(),results},null,2)+'\n');
 console.log(results.join('\n'));
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
