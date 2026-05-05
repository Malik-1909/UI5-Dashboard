import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

export function loadUi5Module(entryFilePath, options = {}) {
  const cache = new Map();
  const idToPath = options.idToPath || {};
  const globals = options.globals || {};

  function loadFile(filePath) {
    const absPath = path.resolve(filePath);
    if (cache.has(absPath)) {
      return cache.get(absPath);
    }

    const source = fs.readFileSync(absPath, "utf8");
    let exported;
    const localSap = {
      ui: {
        define(deps, factory) {
          const resolvedDeps = (deps || []).map((id) => {
            const depPath = idToPath[id];
            if (!depPath) {
              throw new Error(`Missing dependency mapping for UI5 module: ${id}`);
            }
            return loadFile(depPath);
          });
          exported = factory(...resolvedDeps);
        }
      }
    };

    const sandbox = {
      sap: localSap,
      console,
      ...globals
    };
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox, { filename: absPath });
    cache.set(absPath, exported);
    return exported;
  }

  return loadFile(entryFilePath);
}
