import { resolveTranslation, SUPPORTED_LANGUAGES } from "../src/i18n";
import { mkdir, copyFile, rm, readFile, writeFile } from "node:fs/promises";

// Publish only the public declaration graph, alongside all data attribution.
for (const name of ["native", "types", "service-consent", "csp", "locale"]) {
	const declaration = await readFile(`dist/types/src/${name}.d.ts`, "utf8");
	// Published ESM declarations must resolve with both NodeNext and bundlers.
	await writeFile(
		`dist/${name}.d.ts`,
		declaration.replace(
			/(from ["'])(\.\/[^"']+)(["'])/g,
			(_, before, path, after) =>
				`${before}${path.endsWith(".js") ? path : path + ".js"}${after}`,
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
