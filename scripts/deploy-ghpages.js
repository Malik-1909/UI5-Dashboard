#!/usr/bin/env node
"use strict";

const path = require("path");
const ghpages = require("gh-pages");

const distDir = path.join(__dirname, "..", "dist");

ghpages.publish(distDir, { dotfiles: true, src: ["**/*", ".nojekyll"] }, function (err) {
  if (err) {
    console.error("Deploy fehlgeschlagen:", err);
    process.exit(1);
  }
  console.log("Deploy abgeschlossen.");
});
