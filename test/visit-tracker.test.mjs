import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { buildEntry, recordTrack, sanitizeRef } = require(path.join(root, "middleware/visit-tracker/index.js"));

describe("visit-tracker", () => {
    it("builds a minimal entry with sanitized ref and timestamp", () => {
        const entry = buildEntry({ ref: "sap-jul26!!!", route: "project", sessionId: "s_abc" });

        assert.equal(entry.ref, "sap-jul26");
        assert.equal(typeof entry.ts, "string");
        assert.ok(!Number.isNaN(Date.parse(entry.ts)));
        // datensparsam: keine weiteren Felder
        assert.deepEqual(Object.keys(entry).sort(), ["ref", "ts"]);
    });

    it("strips disallowed characters and caps length", () => {
        assert.equal(sanitizeRef("  Deloitte GmbH & Co  "), "DeloitteGmbHCo");
        assert.equal(sanitizeRef("a".repeat(100)).length, 64);
        assert.equal(sanitizeRef(42), "");
    });

    it("recordTrack returns false for invalid payload", async () => {
        assert.equal(await recordTrack(null), false);
        assert.equal(await recordTrack("nope"), false);
    });
});
