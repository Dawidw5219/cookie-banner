import ts from "typescript";

// Pin reviewed upstream snapshots; changing these refs is an explicit update.
const thirdPartyRef = "a631d7a773c9338a20446ba0d106fabc0f87b732";
const cookiesRef = "0836a3181f4f271642c5f3b93c08d9a96f9da315";
const root = new URL("../", import.meta.url);
async function download(url: string) {
	const response = await fetch(url);
	if (!response.ok)
		throw new Error(`Download failed: ${response.status} ${url}`);
	return response.text();
}
// Parse upstream's JS data without executing downloaded code.
function literal(node: ts.Node): unknown {
	if (ts.isStringLiteral(node)) return node.text;
	if (ts.isNumericLiteral(node)) return Number(node.text);
	if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
	if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
	if (node.kind === ts.SyntaxKind.NullKeyword) return null;
	if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
	if (ts.isObjectLiteralExpression(node))
		return Object.fromEntries(
			node.properties
				.filter(
					(property) =>
						ts.isPropertyAssignment(property) &&
						["name", "category", "domains"].includes(property.name.getText()),
				)
				.map((property) => {
					if (!ts.isPropertyAssignment(property))
						throw new Error("Unexpected upstream property");
					return [
						property.name.getText().replace(/^['"]|['"]$/g, ""),
						literal(property.initializer),
					];
				}),
		);
	throw new Error(`Unexpected upstream expression: ${node.kind}`);
}
const source = await download(
	`https://raw.githubusercontent.com/patrickhulce/third-party-web/${thirdPartyRef}/data/entities.js`,
);
const ast = ts.createSourceFile(
	"entities.js",
	source,
	ts.ScriptTarget.Latest,
	true,
	ts.ScriptKind.JS,
);
const statement = ast.statements[0];
if (
	!statement ||
	!ts.isExpressionStatement(statement) ||
	!ts.isBinaryExpression(statement.expression)
)
	throw new Error("Invalid upstream entity file");
const entities = literal(statement.expression.right) as {
	name: string;
	category: string;
	domains: string[];
}[];
if (
	entities.length < 500 ||
	entities.some((entity) => !entity.name || !Array.isArray(entity.domains))
)
	throw new Error("Invalid entity database");
const database = entities
	.filter((entity) => entity.domains.length > 0)
	.map((entity) => ({
		id: `tp-${entity.name
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "")}`,
		name: entity.name,
		category: entity.category || "other",
		domains: entity.domains,
	}));
if (new Set(database.map((entity) => entity.id)).size !== database.length)
	throw new Error("Duplicate entity IDs");
const cookies = JSON.parse(
	await download(
		`https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/${cookiesRef}/open-cookie-database.json`,
	),
);
if (Object.keys(cookies).length < 50)
	throw new Error("Invalid cookie database");
await Bun.write(
	new URL("plugin/includes/service-database.json", root),
	JSON.stringify(database) + "\n",
);
await Bun.write(
	new URL("plugin/includes/cookie-database.json", root),
	JSON.stringify(cookies, null, 4) + "\n",
);
await Bun.write(
	new URL("plugin/includes/database-sources.json", root),
	JSON.stringify(
		{ thirdPartyWeb: thirdPartyRef, openCookieDatabase: cookiesRef },
		null,
		2,
	) + "\n",
);
console.log(
	`Imported ${database.length} providers / ${database.reduce((n, item) => n + item.domains.length, 0)} domain patterns and ${Object.values(cookies).flat().length} cookies.`,
);
