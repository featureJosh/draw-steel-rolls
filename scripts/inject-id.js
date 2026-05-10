import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

// __dirname workaround for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const pkg = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
);
const filePath = resolve(__dirname, "../dist/module.json");

let moduleJson = readFileSync(filePath, "utf8");

moduleJson = moduleJson.replace(/ID_PLACEHOLDER/g, pkg.name);

writeFileSync(filePath, moduleJson);

console.log(`Replaced ID_PLACEHOLDER with "${pkg.name}"`);
