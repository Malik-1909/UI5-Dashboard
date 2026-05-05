import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { loadUi5Module } from "./helpers/ui5ModuleLoader.mjs";

const root = "/Users/MalikPrivat/Desktop/UI5";
const routeConfigPath = path.join(root, "webapp/utils/ChatRouteConfig.js");
const navigationGuardPath = path.join(root, "webapp/utils/ChatNavigationGuard.js");

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
  assert.match(implicit.hintText, /Gehe zu|Navigiere zu/i);
});

test("Chat navigation guard allows explicit navigation command", () => {
  const explicit = ChatNavigationGuard.tryNavigateFromReply({
    reply: JSON.stringify({ action: "navigate", route: "s2p" }),
    lastUserMessage: "Navigiere zu S2P"
  });
  assert.equal(explicit.handled, true);
  assert.equal(explicit.shouldNavigate, true);
  assert.equal(explicit.route, "s2p");
  assert.equal(explicit.label, "Source to Pay");
});
