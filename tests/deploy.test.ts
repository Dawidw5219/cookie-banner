import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deploymentPlan, runDeployment } from "../scripts/deploy";

const plugin = " * Version: 2.0.2\ndefine('COOKIE4_VERSION', '2.0.2');";
const readme = "Stable tag: 2.0.2\n";

describe("combined deployment", () => {
	it("builds and checks the package before releasing the same version on GitHub and npm", () => {
		const commands = deploymentPlan("2.0.2", plugin, readme);
		expect(commands.slice(0, 3)).toEqual([["bun", "run", "build"], ["bun", "run", "test"], ["bun", "run", "test:package"]]);
		expect(commands[commands.length - 2]).toEqual(["ghdeploy", "--release", "plugin/builds/cookie-banner-wp-2.0.2.zip"]);
		expect(commands[commands.length - 1]).toEqual(["npm", "publish", "--access", "public"]);
		expect(commands.flat()).not.toContain("--npm");
	});

	it.each([
		["2.0.3", plugin, readme],
		["2.0.2", plugin.replace("COOKIE4_VERSION', '2.0.2", "COOKIE4_VERSION', '2.0.1"), readme],
		["2.0.2", plugin, "Stable tag: 2.0.1"],
	])("rejects mismatched npm and WordPress versions before any command runs", (version, source, stable) => {
		expect(() => deploymentPlan(version, source, stable)).toThrow("tę samą wersję");
	});

	it.each([0, 1, 2, 3, 4, 5])("stops after failure at step %i without publishing to npm", (failedStep) => {
		const commands = deploymentPlan("2.0.2", plugin, readme);
		const executed: unknown[] = [];
		expect(() => runDeployment(commands, (command) => {
			executed.push(command);
			if (executed.length === failedStep + 1) throw new Error("failed");
		})).toThrow("failed");
		expect(executed).toHaveLength(failedStep + 1);
		expect(executed).not.toContainEqual(["npm", "publish", "--access", "public"]);
	});
});

it.each(["success", "build-failure", "missing-archive", "wrong-archive", "dry-run"])(
	"runs the deploy CLI against simulated tools without publishing: %s", (scenario) => {
		const root = mkdtempSync(join(tmpdir(), "cookie-banner-deploy-test-"));
		try {
			for (const directory of ["scripts", "plugin/builds", "bin"]) mkdirSync(join(root, directory), { recursive: true });
			writeFileSync(join(root, "scripts/deploy.ts"), readFileSync(new URL("../scripts/deploy.ts", import.meta.url)));
			writeFileSync(join(root, "package.json"), JSON.stringify({ version: "2.0.2", repository: { url: "https://github.com/example/banner.git" } }));
			writeFileSync(join(root, "plugin/cookie-banner-wp.php"), plugin);
			writeFileSync(join(root, "plugin/readme.txt"), readme);
			writeFileSync(join(root, "plugin/builds/cookie-banner-wp-2.0.2.zip"), "current-build");
			const fakeTool = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const command = path.basename(process.argv[1]);
const args = process.argv.slice(2);
fs.appendFileSync(process.env.DEPLOY_TEST_LOG, JSON.stringify([command, ...args]) + '\\n');
if (process.env.DEPLOY_TEST_SCENARIO === 'build-failure' && command === 'bun') process.exit(1);
if (command === 'gh' && args[0] === 'release' && args[1] === 'download') {
 if (process.env.DEPLOY_TEST_SCENARIO === 'missing-archive') process.exit(1);
 const directory = args[args.indexOf('--dir') + 1];
 fs.writeFileSync(path.join(directory, 'cookie-banner-wp-2.0.2.zip'), process.env.DEPLOY_TEST_SCENARIO === 'wrong-archive' ? 'old-build' : 'current-build');
}
`;
			for (const tool of ["bun", "npm", "gh", "ghdeploy"]) writeFileSync(join(root, "bin", tool), fakeTool, { mode: 0o755 });
			const log = join(root, "commands.jsonl");
			const result = spawnSync(process.execPath, [join(root, "scripts/deploy.ts"), ...(scenario === "dry-run" ? ["--dry-run"] : [])], {
				encoding: "utf8",
				env: { ...process.env, PATH: `${join(root, "bin")}:${process.env.PATH}`, DEPLOY_TEST_LOG: log, DEPLOY_TEST_SCENARIO: scenario },
			});
			if (scenario === "dry-run") {
				expect(result.status, result.stderr).toBe(0);
				expect(() => readFileSync(log)).toThrow();
				return;
			}
			const calls = readFileSync(log, "utf8").trim().split("\n").map((line) => JSON.parse(line));
			expect(result.status, result.stderr).toBe(scenario === "success" ? 0 : 1);
			if (scenario === "success") expect(calls[calls.length - 1]).toEqual(["npm", "publish", "--access", "public"]);
			else expect(calls).not.toContainEqual(["npm", "publish", "--access", "public"]);
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	},
);
