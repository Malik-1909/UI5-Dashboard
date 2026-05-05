import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { loadUi5Module } from "./helpers/ui5ModuleLoader.mjs";

const root = "/Users/MalikPrivat/Desktop/UI5";
const routeConfigPath = path.join(root, "webapp/utils/ChatRouteConfig.js");
const contextBuilderPath = path.join(root, "webapp/utils/ChatContextBuilder.js");

const ChatContextBuilder = loadUi5Module(contextBuilderPath, {
  idToPath: {
    "ui5/vizframe/app/utils/ChatRouteConfig": routeConfigPath
  },
  globals: {
    window: {
      location: { hash: "#/r2r" }
    }
  }
});

test("Chat context includes current page label and relevant KPI slice", () => {
  const salesData = {
    R2RKpiTable: [{ kpi: "Close Cycle", value: 4 }],
    R2RByAccountType: [{ type: "Assets", share: 35 }],
    S2PKpiTable: [{ kpi: "ShouldNotAppear", value: 999 }]
  };
  const component = {
    getModel(name) {
      if (name !== "sales") {
        return null;
      }
      return {
        getData() {
          return salesData;
        }
      };
    }
  };

  const context = ChatContextBuilder.buildContext(component, "#/r2r");
  assert.match(context, /Aktuell angezeigte Seite: Record to Report/);
  assert.match(context, /KPI-Daten aus der App/);
  assert.match(context, /R2RKpiTable/);
  assert.doesNotMatch(context, /S2PKpiTable/);
});
