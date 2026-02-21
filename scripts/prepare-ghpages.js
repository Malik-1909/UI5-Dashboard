#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const distDir = path.join(__dirname, "..", "dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  console.error("Fehler: dist/index.html nicht gefunden. Führe zuerst 'npm run build' aus.");
  process.exit(1);
}

// Repo-Namen aus git remote ermitteln
let repoName = "UI5";
try {
  const remote = execSync("git remote get-url origin", { encoding: "utf8" }).trim();
  const match = remote.match(/\/([^/]+?)(?:\.git)?$/);
  if (match) repoName = match[1];
} catch (e) {
  console.warn("Hinweis: Git-Remote nicht gefunden, verwende Repo-Name 'UI5'.");
}

const basePath = "/" + repoName + "/";

let html = fs.readFileSync(indexPath, "utf8");

// UI5 von CDN laden
html = html.replace(
  'src="resources/sap-ui-core.js"',
  'src="https://ui5.sap.com/1.132.1/resources/sap-ui-core.js"'
);

// base href und resourceroots für GitHub Pages
html = html.replace('<base href="/">', '<base href="' + basePath + '">');
html = html.replace(
  'data-sap-ui-resourceroots=\'{ "ui5.vizframe.app": "/" }\'',
  'data-sap-ui-resourceroots=\'{ "ui5.vizframe.app": "' + basePath.slice(0, -1) + '" }\''
);

fs.writeFileSync(indexPath, html);

// 404.html für SPA-Routing (Routen wie /project, /o2c)
fs.writeFileSync(path.join(distDir, "404.html"), html);

// .nojekyll – deaktiviert Jekyll, damit .js-Dateien nicht verarbeitet werden (verhindert 500-Fehler)
fs.writeFileSync(path.join(distDir, ".nojekyll"), "");

console.log("GitHub Pages vorbereitet (base: " + basePath + ")");
