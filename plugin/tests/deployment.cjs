const assert = require("node:assert/strict");
const { svn, upload } = require("../tools/deployment.cjs");
const original = { ...process.env };
try {
	process.env.SVN_USERNAME = "test-user";
	process.env.SVN_PASSWORD = 'secret" $(touch /tmp/should-not-run) `id`';
	let calls = [];
	const capture = (cmd, args, options) => {
		calls.push({ cmd, args, options });
		return { status: 0 };
	};
	svn(
		["checkout", "https://example.invalid/trunk", "folder with spaces"],
		{},
		capture,
	);
	assert.equal(calls[0].cmd, "svn");
	assert.equal(calls[0].args.includes("--password-from-stdin"), true);
	assert.equal(calls[0].args.includes("--trust-server-cert"), false);
	assert.equal(JSON.stringify(calls[0].args).includes("secret"), false);
	assert.equal(calls[0].options.env.SVN_PASSWORD, undefined);
	assert.equal(calls[0].options.input, process.env.SVN_PASSWORD + "\n");
	assert.equal(calls[0].options.shell, false);
	assert.equal(calls[0].args.includes("folder with spaces"), true);
	assert.throws(() => svn(["info"], {}, () => ({ status: 1 })), /failed/);
	process.env.SVN_PASSWORD = "line1\nline2";
	assert.throws(() => svn(["info"], {}, capture), /single-line/);
	for (const name of ["SSH_HOST", "SSH_USER", "SSH_WP_PLUGINS_FOLDER_PATH"])
		delete process.env[name];
	process.env.FTP_HOST = "ftp.example.invalid";
	assert.throws(
		() => upload(".", "cookie-banner-wp", capture),
		/plaintext FTP is unsupported/,
	);
	Object.assign(process.env, {
		SSH_HOST: "example.invalid",
		SSH_USER: "deploy",
		SSH_PORT: "22",
		SSH_WP_PLUGINS_FOLDER_PATH: "/var/www/wp-content/plugins",
	});
	upload(".", "cookie-banner-wp", capture);
	const secure = calls.at(-1);
	assert.equal(secure.cmd, "rsync");
	assert.equal(secure.options.shell, false);
	assert.match(
		secure.args[secure.args.indexOf("-e") + 1],
		/StrictHostKeyChecking=yes/,
	);
	assert.match(secure.args[secure.args.indexOf("-e") + 1], /BatchMode=yes/);
	assert.equal(
		secure.args.at(-1),
		"deploy@example.invalid:/var/www/wp-content/plugins/cookie-banner-wp/",
	);
	process.env.SSH_PORT = "22 -o StrictHostKeyChecking=no";
	assert.throws(() => upload(".", "cookie-banner-wp", capture), /Configure/);
	process.env.SSH_PORT = "22";
	process.env.SSH_HOST = "-oProxyCommand=evil";
	assert.throws(() => upload(".", "cookie-banner-wp", capture), /Configure/);
	console.log(
		"PASS SVN secret-free argv, literal stdin, certificate checks, SSH-only deployment and unsafe configuration rejection",
	);
} finally {
	process.env = original;
}
