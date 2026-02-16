import fs from "node:fs";
import path from "node:path";

const DEFAULT_ORIGIN = "http://localhost:5173";
const projectRoot = process.cwd();

function parseEnvFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return {};
	}

	const content = fs.readFileSync(filePath, "utf8");
	const env = {};

	for (const rawLine of content.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith("#")) {
			continue;
		}

		const equalsIndex = line.indexOf("=");
		if (equalsIndex === -1) {
			continue;
		}

		const key = line.slice(0, equalsIndex).trim();
		let value = line.slice(equalsIndex + 1).trim();

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1);
		}

		env[key] = value;
	}

	return env;
}

function escapeForRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceUrlPattern(filePath, escapedOrigin) {
	const fullPath = path.resolve(projectRoot, filePath);
	console.log(`---------- File: ${filePath} ----------`);

	if (!fs.existsSync(fullPath)) {
		console.log(`Skipped: file not found (${filePath})`);
		console.log("---------------------------------");
		return;
	}

	const content = fs.readFileSync(fullPath, "utf8");
	const updated = content.replace(/%%URLPATTERN%%/g, escapedOrigin);

	if (updated !== content) {
		fs.writeFileSync(fullPath, updated, "utf8");
		console.log(`Replaced URL pattern in: ${filePath}`);
	} else {
		console.log(`No %%URLPATTERN%% placeholder found in: ${filePath}`);
	}

	console.log("---------------------------------");
}

const envFromFile = parseEnvFile(path.resolve(projectRoot, ".env"));
const origin = process.env.ORIGIN || envFromFile.ORIGIN || DEFAULT_ORIGIN;

if (!process.env.ORIGIN && !envFromFile.ORIGIN) {
	console.log(
		`Warning: ORIGIN not set. Falling back to ${DEFAULT_ORIGIN} for SW domain substitution.`,
	);
}

console.log(`Domain set to: ${origin}`);
const escapedOrigin = escapeForRegex(origin);
console.log(`Escaped Origin: ${escapedOrigin}`);

replaceUrlPattern("build/client/service-worker.js", escapedOrigin);
replaceUrlPattern(".svelte-kit/output/client/service-worker.js", escapedOrigin);
replaceUrlPattern("build/client/service-worker.js.map", escapedOrigin);
replaceUrlPattern(".svelte-kit/output/client/service-worker.js.map", escapedOrigin);
