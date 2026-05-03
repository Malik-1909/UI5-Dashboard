#!/usr/bin/env node
"use strict";

/**
 * Bündelt webapp/localService/data/*.json zu einer JSONModel-Datei für statisches Hosting (GitHub Pages).
 */
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "webapp", "localService", "data");
const outFile = path.join(__dirname, "..", "webapp", "localService", "static-mock-bundle.json");

const bundle = {};
for (const file of fs.readdirSync(dataDir).filter((f) => f.endsWith(".json"))) {
    const key = file.replace(/\.json$/i, "");
    bundle[key] = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
}
fs.writeFileSync(outFile, JSON.stringify(bundle));
console.log("static-mock-bundle.json: " + Object.keys(bundle).length + " entity sets");
