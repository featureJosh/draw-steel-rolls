import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
);

const repository = process.env.RELEASE_REPOSITORY || process.env.GITHUB_REPOSITORY;
const tag = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME;

if (!repository) {
    throw new Error("Set RELEASE_REPOSITORY or GITHUB_REPOSITORY.");
}

if (!tag) {
    throw new Error("Set RELEASE_TAG or GITHUB_REF_NAME.");
}

const version = tag.replace(/^v/, "");
const filePath = resolve(__dirname, "../dist/module.json");
const manifest = JSON.parse(readFileSync(filePath, "utf8"));
const zipName = `${pkg.name}-${tag}.zip`;
const releaseBaseUrl = `https://github.com/${repository}/releases`;

manifest.id = manifest.id || pkg.name;
manifest.name = manifest.name || pkg.name;
manifest.version = version;
manifest.url = `https://github.com/${repository}`;
manifest.manifest = `${releaseBaseUrl}/latest/download/module.json`;
manifest.download = `${releaseBaseUrl}/download/${tag}/${zipName}`;
manifest.readme = `https://github.com/${repository}#readme`;
manifest.changelog = `https://github.com/${repository}/blob/main/CHANGELOG.md`;

writeFileSync(filePath, `${JSON.stringify(manifest, null, 4)}\n`);

console.log(`Prepared ${filePath} for ${tag}`);
