import { useEffect, useState } from "preact/hooks";
import type { LocalizedContent } from "../../../../src/types";
import { Card } from "@/shared/ui/card";
import { Field } from "@/shared/ui/field";
import { api } from "@/shared/hooks/use-api";
import { CustomTexts } from "./custom-texts";

type Props = { value: string; onChange: (value: string) => void; locale: string; onLocale: (locale: string) => void };
export function LocaleEditor({ value, onChange, locale, onLocale }: Props) {
 const [catalog, setCatalog] = useState<{ id: string; name: string }[]>([]);
 const [error, setError] = useState("");
 useEffect(() => {
  api<{catalog: {id: string; name: string}[]}>("/disclosures").then(data => setCatalog(data.catalog)).catch(() => setError("Service names could not be loaded. Reload settings to retry."));
 }, []);
 let locales: Record<string, LocalizedContent> = {};
 try { locales = JSON.parse(value || "{}"); } catch { return <p role="alert">Language settings contain invalid JSON. Reload settings.</p>; }
 const current = locales[locale] || {};
 const update = (patch: Partial<LocalizedContent>) => onChange(JSON.stringify({ ...locales, [locale]: { ...current, ...patch } }));
 // Dot keys are accepted here and expanded server-side into the same runtime schema.
 const texts = current.customTexts as Record<string, string> || {};
 const providers = [...new Map([...catalog, ...Object.keys(current.serviceDisclosures || {}).map(id => ({id, name:id}))].map(item => [item.id, item])).values()];
 return <Card title="Language versions" description="Auto uses the current WPML / Polylang page language, then WordPress. Empty translations fall back to shared content. Save using Save Settings below.">
  <div class="cb-form-stack">
   <Field type="text" label="Editing language code" description="Examples: pl, en, de, fr-ca. This also changes the live preview." value={locale} onChange={value => onLocale(value.toLowerCase().replace(/_/g, "-"))} />
   <Field type="text" label="Controller name in this language" value={current.controller?.name || ""} onChange={name => update({controller: {name}})} />
   <Field type="text" label="Purposes in this language" value={current.purposes || ""} onChange={purposes => update({purposes})} />
   <Field type="url" label="Privacy policy in this language" value={current.privacyPolicyUrl || ""} onChange={privacyPolicyUrl => update({privacyPolicyUrl})} />
   <Field type="url" label="Cookie policy in this language" value={current.cookiePolicyUrl || ""} onChange={cookiePolicyUrl => update({cookiePolicyUrl})} />
   <details><summary>Banner, preferences and blocker texts</summary><CustomTexts lang={locale} texts={texts} onChange={(key, text) => {const next = {...texts}; if(text) next[key] = text; else delete next[key]; update({customTexts:next});}} /></details>
   <details><summary>Service descriptions and retention</summary>
    {error && <p role="alert">{error}</p>}
    {providers.map(provider => <fieldset class="cb-text-group" key={provider.id}><legend>{provider.name}</legend>
     {([['name','Display name'],['description','Purpose / description'],['retention','Retention'],['privacyUrl','Provider privacy URL']] as const).map(([key,label]) => <Field key={key} type={key === 'privacyUrl' ? 'url' : 'text'} label={label} value={current.serviceDisclosures?.[provider.id]?.[key] || ''} onChange={text => {const entry = {...current.serviceDisclosures?.[provider.id]}; if(text) entry[key] = text; else delete entry[key]; update({serviceDisclosures:{...current.serviceDisclosures,[provider.id]:entry}});}} />)}
    </fieldset>)}
   </details>
  </div>
 </Card>;
}
