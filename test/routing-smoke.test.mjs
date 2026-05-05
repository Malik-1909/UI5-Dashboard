import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const manifestPath = "/Users/MalikPrivat/Desktop/UI5/webapp/manifest.json";

test("Manifest routing defines all core process routes", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const routing = manifest?.["sap.ui5"]?.routing;
  assert.ok(routing, "sap.ui5.routing missing");

  const routeNames = new Set((routing.routes || []).map((r) => r.name));
  ["main", "project", "r2r", "rtr", "s2p", "d2o", "l2c"].forEach((name) => {
    assert.ok(routeNames.has(name), `missing route: ${name}`);
  });
});

test("Manifest targets map to expected process views", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const targets = manifest?.["sap.ui5"]?.routing?.targets || {};
  assert.equal(targets.r2r?.viewName, "R2R");
  assert.equal(targets.s2p?.viewName, "S2P");
  assert.equal(targets.main?.viewName, "Main");
});
