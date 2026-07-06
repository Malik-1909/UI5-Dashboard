import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { loadUi5Module } from "./helpers/ui5ModuleLoader.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const routeConfigPath = path.join(root, "webapp/utils/ChatRouteConfig.js");
const navigationGuardPath = path.join(root, "webapp/utils/ChatNavigationGuard.js");

const mockBundle = {
  getText(key) {
    const labels = {
      "process.s2p": "Source to Pay"
    };
    return labels[key] || key;
  }
};

const ChatNavigationGuard = loadUi5Module(navigationGuardPath, {
  idToPath: {
    "ui5/vizframe/app/utils/ChatRouteConfig": routeConfigPath
  }
});

test("Chat navigation guard requires explicit user navigation command", () => {
  const implicit = ChatNavigationGuard.tryNavigateFromReply({
    reply: JSON.stringify({ action: "navigate", route: "r2r" }),
    lastUserMessage: "Erklaer mir den Prozess"
  });
  assert.equal(implicit.handled, true);
  assert.equal(implicit.shouldNavigate, false);
});

test("Chat navigation guard allows explicit navigation command", () => {
  const explicit = ChatNavigationGuard.tryNavigateFromReply({
    reply: JSON.stringify({ action: "navigate", route: "s2p" }),
    lastUserMessage: "Navigiere zu S2P",
    bundle: mockBundle
  });
  assert.equal(explicit.handled, true);
  assert.equal(explicit.shouldNavigate, true);
  assert.equal(explicit.route, "s2p");
  assert.equal(explicit.label, "Source to Pay");
});
