// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { resolveLocalizedConfig, normalizeLocale, mergeTexts } from "./locale";
import { resolveTranslation } from "./i18n";
import { getService } from "./service-catalog";
import { hasServiceDisclosure } from "./disclosure";
import { createContentPlaceholder } from "./content-placeholder";
import type { BannerConfig } from "./types";
const base: BannerConfig = { mode:"standalone", lang:"auto", controller:{name:"Controller"}, purposes:"Base purpose", noticeVersion:"1", privacyPolicyUrl:"/privacy", serviceDisclosures:{youtube:{description:"Base video",privacyUrl:"https://google.com/privacy",retention:"Session",cleanup:{cookies:["tracker"]}}} };
afterEach(() => {document.documentElement.lang=""; delete window.__cookieConsent;});
describe("page language and localized content", () => {
 it("normalizes regional WordPress locales and Norwegian aliases", () => {
  expect(normalizeLocale("FR_ca")).toBe("fr-ca");
  expect(normalizeLocale("nb_NO")).toBe("no-no");
  expect(resolveTranslation("de_DE").overlay.title).toBe(resolveTranslation("de").overlay.title);
 });
 it("uses document language, language fallback and exact regional fields without losing cleanup", () => {
  document.documentElement.lang="fr-CA";
  const result=resolveLocalizedConfig({...base,localizations:{fr:{purposes:"But",customTexts:{overlay:{title:"Titre",description:"Texte"}},serviceDisclosures:{youtube:{description:"Vidéo"}}},"fr_CA":{privacyPolicyUrl:"/ca/confidentialite",customTexts:{"overlay.title":"Titre canadien"},serviceDisclosures:{youtube:{retention:"Session canadienne"}}}}});
  expect(result.lang).toBe("fr-ca"); expect(result.purposes).toBe("But"); expect(result.privacyPolicyUrl).toBe("/ca/confidentialite");
  expect(result.customTexts).toEqual({overlay:{title:"Titre canadien",description:"Texte"}});
  expect(result.serviceDisclosures?.youtube).toMatchObject({description:"Vidéo",retention:"Session canadienne",cleanup:{cookies:["tracker"]}});
 });
 it("falls back for empty translations and unknown built-in languages while allowing custom UI", () => {
  const cfg=resolveLocalizedConfig({...base,lang:"uk-UA",localizations:{uk:{purposes:"",customTexts:{overlay:{title:"Приватність"}}}}});
  expect(cfg.purposes).toBe(base.purposes);
  expect(resolveTranslation(cfg.lang,cfg.customTexts).overlay.title).toBe("Приватність");
  expect(resolveTranslation("unknown").content.allowPlay).toBe(resolveTranslation("en").content.allowPlay);
 });
 it("does not let override dot paths pollute prototypes", () => {
  mergeTexts({},JSON.parse('{"__proto__.polluted":"yes","constructor.prototype.polluted":"yes"}'));
  expect(({} as Record<string,string>).polluted).toBeUndefined();
 });
 it("does not turn a retention-only translation into a reviewed provider purpose", () => {
  window.__cookieConsent=resolveLocalizedConfig({...base,serviceDisclosures:{},lang:"de",localizations:{de:{serviceDisclosures:{youtube:{retention:"Eine Sitzung"}}}}});
  expect(hasServiceDisclosure(getService("youtube"))).toBe(false);
 });
 it("defaults to strict buttons in the shared npm configuration", () => {
  expect(resolveLocalizedConfig(base).buttonStyle).toBe("equal");
  expect(resolveLocalizedConfig({...base,buttonStyle:"standard"}).buttonStyle).toBe("standard");
 });
 it.each(["en","pl","de","fr","es","it","nl","da","no","sv"])("renders video, iframe and custom blocker text in %s",lang=>{
  const copy=resolveTranslation(lang);
  window.__cookieConsent={...base,lang};
  const service={id:"youtube",name:"YouTube",description:"Video",privacyUrl:"https://google.com/privacy",retention:"Session"};
  const video=createContentPlaceholder(service,"youtube",lang,()=>{});
  expect(video.textContent).toContain(copy.content.videoTitle);
  expect(video.querySelector("button")?.textContent).toBe(copy.content.allowPlay);
  expect(video.querySelector("summary")?.textContent).toBe(copy.content.privacyDetails);
  const iframe=createContentPlaceholder(undefined,"external-demo",lang,()=>{});
  expect(iframe.textContent).toContain(copy.content.external);
  expect(iframe.textContent).toContain(copy.disclosure.unavailable);
  window.__cookieConsent.customTexts={content:{allowPlay:"Custom consent"}};
  expect(createContentPlaceholder(service,"youtube",lang,()=>{}).querySelector("button")?.textContent).toBe("Custom consent");
 });
});
