import { mkdir, copyFile, rm } from "node:fs/promises";

// Publish only the public declaration graph, alongside all data attribution.
for (const name of ["native", "types", "service-consent", "csp"]) {
	await copyFile(`dist/types/src/${name}.d.ts`, `dist/${name}.d.ts`);
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
