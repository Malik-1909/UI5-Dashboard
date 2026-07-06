import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { buildEntry, recordTrack } = require(path.join(root, "middleware/visit-tracker/index.js"));

describe("visit-tracker", () => {
    it("sanitizes ref and builds log entry", () => {
        const req = {
            headers: {
                "user-agent": "TestAgent",
                referer: "https://example.com"
            },
            socket: { remoteAddress: "127.0.0.1" }
        };

        const entry = buildEntry(req, {
            event: "page_view",
            ref: "sap-jul26!!!",
            route: "project",
            sessionId: "s_abc"
        });

        assert.equal(entry.event, "page_view");
        assert.equal(entry.ref, "sap-jul26");
        assert.equal(entry.route, "project");
        assert.equal(entry.sessionId, undefined);
        assert.equal(entry.ip, undefined);
    });

    it("rejects unknown events via fallback", () => {
        const entry = buildEntry({}, { event: "hack", ref: "x", route: "main" });
        assert.equal(entry.event, "page_view");
    });

    it("recordTrack returns false for invalid payload", () => {
        assert.equal(recordTrack({}, null), false);
        assert.equal(recordTrack({}, "nope"), false);
    });
});
