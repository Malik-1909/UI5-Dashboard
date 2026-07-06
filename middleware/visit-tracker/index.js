/**
 * UI5 Custom Middleware + Express handler
 *   POST /api/track → Besucher-Events (ref-Slug, Route, Session)
 *
 * Lokal: logs/visits.jsonl (gitignored)
 * BTP/CF: stdout → cf logs ui5-app-node --recent
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "visits.jsonl");
const ALLOWED_EVENTS = new Set(["session_start", "page_view", "session_end"]);
const REF_MAX_LEN = 64;

function sanitizeRef(ref) {
    if (typeof ref !== "string") {
        return "";
    }
    return ref.trim().slice(0, REF_MAX_LEN).replace(/[^a-zA-Z0-9._-]/g, "");
}

function sanitizeRoute(route) {
    if (typeof route !== "string") {
        return "";
    }
    return route.trim().slice(0, 32).replace(/[^a-zA-Z0-9._-]/g, "");
}

function buildEntry(_req, payload) {
    const event = ALLOWED_EVENTS.has(payload.event) ? payload.event : "page_view";
    const entry = {
        event,
        ref: sanitizeRef(payload.ref)
    };

    if (event === "page_view") {
        entry.route = sanitizeRoute(payload.route);
    }

    if (event === "session_end" && typeof payload.durationSec === "number" && payload.durationSec >= 0) {
        entry.durationSec = Math.min(Math.round(payload.durationSec), 86400);
    }

    return entry;
}

function logVisit(entry) {
    const line = JSON.stringify(Object.assign({ ts: new Date().toISOString() }, entry));
    console.log("[visit-track] " + line);

    if (process.env.NODE_ENV === "production") {
        return;
    }

    try {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        fs.appendFileSync(LOG_FILE, line + "\n");
    } catch (err) {
        console.warn("[visit-track] Log-Datei nicht schreibbar:", err.message);
    }
}

function recordTrack(req, payload) {
    if (!payload || typeof payload !== "object") {
        return false;
    }
    logVisit(buildEntry(req, payload));
    return true;
}

async function readJsonBody(req) {
    let raw = "";
    for await (const chunk of req) {
        raw += chunk;
    }
    if (!raw) {
        return {};
    }
    return JSON.parse(raw);
}

function expressHandler(req, res) {
    try {
        recordTrack(req, req.body || {});
        res.status(204).end();
    } catch (err) {
        console.warn("[visit-track] Ungültiger Request:", err.message);
        res.status(400).json({ error: "invalid payload" });
    }
}

module.exports = function () {
    return async function visitTracker(req, res, next) {
        const url = req.url || "";
        if (req.method !== "POST" || (url !== "/api/track" && !url.startsWith("/api/track?"))) {
            return next();
        }

        try {
            const payload = await readJsonBody(req);
            recordTrack(req, payload);
            res.writeHead(204);
            res.end();
        } catch (err) {
            console.warn("[visit-track] Ungültiger Request:", err.message);
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "invalid payload" }));
        }
    };
};

module.exports.expressHandler = expressHandler;
module.exports.logVisit = logVisit;
module.exports.buildEntry = buildEntry;
module.exports.recordTrack = recordTrack;
