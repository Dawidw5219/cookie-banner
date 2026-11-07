const { spawnSync } = require("node:child_process");

function svn(args, options = {}, run = spawnSync) {
	const username = process.env.SVN_USERNAME;
	const password = process.env.SVN_PASSWORD;
	if (!username || !password || /[\r\n]/.test(password))
		throw new Error(
			"Set SVN_USERNAME and a single-line SVN_PASSWORD. SVN 1.10+ is required.",
		);
	const env = { ...process.env };
	delete env.SVN_PASSWORD;
	const { capture, ...spawnOptions } = options;
	const result = run(
		"svn",
		[
			...args,
			"--username",
			username,
			"--password-from-stdin",
			"--non-interactive",
			"--no-auth-cache",
		],
		{
			...spawnOptions,
			env,
			input: password + "\n",
			encoding: "utf8",
			stdio: ["pipe", capture ? "pipe" : "inherit", "inherit"],
			shell: false,
		},
	);
	if (result.error || result.status !== 0)
		throw new Error(
			"SVN operation failed; check credentials, certificate and SVN version.",
		);
	return result.stdout || "";
}

function upload(source, pluginName, run = spawnSync) {
	const {
		SSH_HOST: host,
		SSH_USER: user,
		SSH_WP_PLUGINS_FOLDER_PATH: remote,
		SSH_PORT: port = "22",
	} = process.env;
	if (
		!host ||
		!/^[a-zA-Z0-9][a-zA-Z0-9.-]*$/.test(host) ||
		!user ||
		!/^[a-zA-Z0-9_][a-zA-Z0-9_.-]*$/.test(user) ||
		!/^\d{1,5}$/.test(port) ||
		Number(port) < 1 ||
		Number(port) > 65535 ||
		!remote ||
		!/^\/[a-zA-Z0-9_./-]+$/.test(remote) ||
		!/^[a-zA-Z0-9_-]+$/.test(pluginName)
	) {
		throw new Error(
			"Configure SSH_HOST, SSH_USER, SSH_PORT and an absolute SSH_WP_PLUGINS_FOLDER_PATH; plaintext FTP is unsupported.",
		);
	}
	// SSH agent/keys only. Unknown or changed host keys fail closed.
	const result = run(
		"rsync",
		[
			"-az",
			"--exclude=.svn",
			"--exclude=node_modules",
			"--exclude=.env*",
			"--exclude=builds",
			"-e",
			`ssh -p ${port} -o BatchMode=yes -o StrictHostKeyChecking=yes`,
			"--",
			source.replace(/\/$/, "") + "/",
			`${user}@${host}:${remote.replace(/\/$/, "")}/${pluginName}/`,
		],
		{ stdio: "inherit", shell: false },
	);
	if (result.error || result.status !== 0)
		throw new Error(
			"SSH upload failed; verify the host key and SSH agent/key configuration.",
		);
}
module.exports = { svn, upload };
