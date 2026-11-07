import { resolveTranslation, SUPPORTED_LANGUAGES } from "../src/i18n";
import { mkdir, copyFile, rm, readFile, writeFile } from "node:fs/promises";
import { dirname, posix } from "node:path";

// Publish only the public declaration graph, alongside all data attribution.
const declarations = {
	"api/native": "native",
	"api/dev": "dev",
	types: "types",
	"core/service-consent": "core/service-consent",
	"core/csp": "core/csp",
	"i18n/locale": "i18n/locale",
};
for (const [name, publishedName] of Object.entries(declarations)) {
	const declaration = await readFile(`dist/types/src/${name}.d.ts`, "utf8");
	// Published ESM declarations must resolve with both NodeNext and bundlers.
	await mkdir(dirname(`dist/${publishedName}.d.ts`), { recursive: true });
	await writeFile(
		`dist/${publishedName}.d.ts`,
		declaration.replace(
			/(from ["'])(\.\.?\/[^"']+)(["'])/g,
			(_, before, path, after) => {
				const source = posix.join(posix.dirname(name), path);
				const target = declarations[source as keyof typeof declarations] ?? source;
				const relative = posix.relative(posix.dirname(publishedName), target);
				const specifier = relative.startsWith(".") ? relative : `./${relative}`;
				return `${before}${specifier.endsWith(".js") ? specifier : specifier + ".js"}${after}`;
			},
		),
	);
}
await rm("dist/types", { recursive: true });
await mkdir("dist/licenses", { recursive: true });
await copyFile("plugin/NOTICE", "dist/NOTICE");
for (const file of [
	"third-party-web-MIT.txt",
	"open-cookie-database-Apache-2.0.txt",
]) {
	await copyFile(`plugin/licenses/${file}`, `dist/licenses/${file}`);
}

// PHP shortcodes consume a generated copy of the same dictionary, never a second manual registry.
await writeFile("plugin/includes/translations.json", JSON.stringify(Object.fromEntries(SUPPORTED_LANGUAGES.map(lang => [lang, resolveTranslation(lang)]))));
