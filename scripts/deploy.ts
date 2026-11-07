import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

type Command = readonly [string, ...string[]];

export function deploymentPlan(version: string, plugin: string, readme: string): Command[] {
	const header = plugin.match(/^\s*\*\s*Version:\s*(\S+)/m)?.[1];
	const constant = plugin.match(/define\(\s*['"]COOKIE4_VERSION['"]\s*,\s*['"]([^'"]+)['"]/i)?.[1];
	const stable = readme.match(/^Stable tag:\s*(\S+)/m)?.[1];
	if (!version || [header, constant, stable].some((value) => value !== version)) {
		throw new Error("Ustaw tę samą wersję w package.json, nagłówku i COOKIE4_VERSION pluginu oraz Stable tag w plugin/readme.txt.");
	}
	return [
		["bun", "run", "build"],
		["bun", "run", "test"],
		["bun", "run", "test:package"],
		["npm", "whoami"],
		["gh", "auth", "status"],
		["ghdeploy", "--release", `plugin/builds/cookie-banner-wp-${version}.zip`],
		["npm", "publish", "--access", "public"],
	];
}

export function runDeployment(commands: Command[], execute: (command: Command) => void): void {
	for (const command of commands) execute(command);
}

function execute(command: Command, root: string): void {
	const [program, ...args] = command;
	const result = spawnSync(program, args, { cwd: root, stdio: "inherit", shell: false });
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`Nie powiodło się: ${command.join(" ")}. Dalsze etapy nie zostały uruchomione.`);
}

function verifyGithubArchive(root: string, version: string, repositoryUrl: string): void {
	const repo = new URL(repositoryUrl.replace(/^git\+/, "")).pathname.replace(/^\//, "").replace(/\.git$/, "");
	const archive = `cookie-banner-wp-${version}.zip`;
	const directory = mkdtempSync(join(tmpdir(), "cookie-banner-release-"));
	try {
		execute(["gh", "release", "download", `v${version}`, "--repo", repo, "--pattern", archive, "--dir", directory], root);
		if (!readFileSync(join(directory, archive)).equals(readFileSync(join(root, "plugin/builds", archive)))) {
			throw new Error("ZIP z GitHub Release różni się od lokalnego buildu. Publikacja npm zatrzymana.");
		}
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
	try {
		const { version, repository } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
		const commands = deploymentPlan(
			version,
			readFileSync(resolve(root, "plugin/cookie-banner-wp.php"), "utf8"),
			readFileSync(resolve(root, "plugin/readme.txt"), "utf8"),
		);
		const dryRun = process.argv.includes("--dry-run");
		if (dryRun) console.log("Plan wdrożenia — bez budowania i publikowania:");
		runDeployment(commands, ([program, ...args]) => {
			console.log(`$ ${[program, ...args].join(" ")}`);
			if (!dryRun) execute([program, ...args], root);
			if (program === "ghdeploy") {
				if (dryRun) console.log("→ weryfikacja ZIP-a z GitHub Release przed publikacją npm");
				else verifyGithubArchive(root, version, repository.url);
			}
		});
		if (!dryRun) console.log("GitHub Release gotowy; paczka wysłana do npm. Sprawdź ewentualne zatwierdzenie w Staged Packages.");
	} catch (error) {
		console.error(error instanceof Error ? error.message : error);
		process.exitCode = 1;
	}
}
