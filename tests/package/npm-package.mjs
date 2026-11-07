import { execFileSync } from "node:child_process";
import { mkdtemp, mkdir, writeFile, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../../", import.meta.url));
const temp = await mkdtemp(join(tmpdir(), "cookie-banner-npm-"));
try {
	const [pack] = JSON.parse(
		execFileSync(
			"npm",
			["pack", "--ignore-scripts", "--pack-destination", temp, "--json"],
			{ cwd: root, encoding: "utf8" },
		),
	);
	execFileSync("tar", ["-xzf", join(temp, pack.filename), "-C", temp]);
	await mkdir(join(temp, "node_modules/@app4you"), { recursive: true });
	await symlink(
		join(temp, "package"),
		join(temp, "node_modules/@app4you/cookie-banner"),
		"dir",
	);
	await symlink(
		join(root, "node_modules/preact"),
		join(temp, "node_modules/preact"),
		"dir",
	);
	const source = `import {getDetectedServices, resolveLocalizedConfig, blockedContentProps, consentCspHeaders, getConsentReceipt, type ConsentReceipt, type BannerConfig} from '@app4you/cookie-banner/native';
const config: BannerConfig = {mode:'standalone',lang:'pl',noticeVersion:'qa-1',controller:{name:'QA controller'},purposes:'QA video',privacyPolicyUrl:'/privacy'};
const receipt: ConsentReceipt|null=getConsentReceipt();
if(resolveLocalizedConfig({...config,lang:'de-DE',localizations:{de:{purposes:'Zweck'}}}).purposes!=='Zweck')throw new Error('SSR locale resolution failed');
if(resolveLocalizedConfig(config).buttonStyle!=='standard')throw new Error('Standard style must be default');
if(resolveLocalizedConfig({...config,buttonStyle:'equal'}).buttonStyle!=='equal')throw new Error('Equal style override failed');
if(resolveLocalizedConfig({...config,buttonStyle:'standard'}).buttonStyle!=='standard')throw new Error('Standard style override failed');
if(getDetectedServices().length!==0)throw new Error('SSR invented detected services');
if(receipt!==null)throw new Error('SSR invented browser consent');
if('src' in blockedContentProps('qa','https://optional.test/embed'))throw new Error('Unsafe SSR props');
if(!consentCspHeaders({noticeVersion:config.noticeVersion,services:{}},'')['Content-Security-Policy'].includes("default-src 'none'"))throw new Error('Missing CSP');`;
	const consumer = join(temp, "consumer.mts");
	await writeFile(consumer, source);
	const tsc = join(root, "node_modules/.bin/tsc");
	for (const [module, resolution] of [
		["NodeNext", "NodeNext"],
		["ESNext", "Bundler"],
	]) {
		execFileSync(
			tsc,
			[
				"--noEmit",
				"--strict",
				"--module",
				module,
				"--moduleResolution",
				resolution,
				"--target",
				"ES2022",
				"--lib",
				"ES2022,DOM",
				consumer,
			],
			{ stdio: "pipe" },
		);
	}
	execFileSync(process.execPath, [consumer], { stdio: "pipe" });
	console.log(
		`PASS packed ${pack.name}@${pack.version}: NodeNext + Bundler declarations, SSR import, inert props, denied CSP (${pack.entryCount} packaged files)`,
	);
} finally {
	await rm(temp, { recursive: true, force: true });
}
