import type { ConsentState, ScriptDef } from "../types";

const injectedUrls = new Set<string>();
const injectedInline = new Set<string>();

function injectScript(def: ScriptDef): void {
	if (def.src) {
		if (injectedUrls.has(def.src)) return;
		injectedUrls.add(def.src);
		const el = document.createElement("script");
		el.src = def.src;
		if (def.async) el.async = true;
		document.head.appendChild(el);
	}
	if (def.inline && !injectedInline.has(def.inline)) {
		injectedInline.add(def.inline);
		const el = document.createElement("script");
		el.textContent = def.inline;
		document.head.appendChild(el);
	}
}

export function injectGrantedScripts(
	state: ConsentState,
	scripts?: { analytics?: ScriptDef[]; marketing?: ScriptDef[] },
): void {
	if (!scripts) return;
	if (state.analytics && scripts.analytics) {
		for (const script of scripts.analytics) {
			if (state.services?.[script.service]) injectScript(script);
		}
	}
	if (state.marketing && scripts.marketing) {
		for (const script of scripts.marketing) {
			if (state.services?.[script.service]) injectScript(script);
		}
	}
}
