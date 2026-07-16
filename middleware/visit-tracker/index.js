/**
 * UI5 Custom Middleware + Express handler
 *   POST /api/track → minimales Referral-Event (nur ref-Kürzel + Zeitpunkt)
 *
 * Persistenz:
 *   - Supabase (wenn SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY gesetzt): dauerhafter
 *     Insert in Tabelle "visits" → überlebt App-Neustarts (Keep-Alive), Auswertung per SQL.
 *   - Lokal ohne Supabase: logs/visits.jsonl (gitignored).
 *   - Immer zusätzlich: stdout (cf logs).
 *
 * Datensparsam: keine IP, keine Session-ID, keine Routen, keine Verweildauer.
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.resolve(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "visits.jsonl");
const REF_MAX_LEN = 64;

const SUPABASE_URL = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_TABLE = process.env.SUPABASE_VISITS_TABLE || "visits";
const SUPABASE_TIMEOUT_MS = 5000;

function sanitizeRef(ref) {
    if (typeof ref !== "string") {
        return "";
    }
    return ref.trim().slice(0, REF_MAX_LEN).replace(/[^a-zA-Z0-9._-]/g, "");
}

function buildEntry(payload) {
    return {
        ts: new Date().toISOString(),
        ref: sanitizeRef(payload && payload.ref)
    };
}

function logToConsoleAndFile(entry) {
    const line = JSON.stringify(entry);
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

async function insertSupabase(entry) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);
    try {
        const res = await fetch(SUPABASE_URL + "/rest/v1/" + SUPABASE_TABLE, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: SUPABASE_KEY,
                Authorization: "Bearer " + SUPABASE_KEY,
                Prefer: "return=minimal"
            },
            body: JSON.stringify({ ref: entry.ref, ts: entry.ts }),
            signal: controller.signal
        });
        if (!res.ok) {
            const text = await res.text().catch(() => "");
            console.warn("[visit-track] Supabase HTTP " + res.status + " " + text);
        }
    } catch (err) {
        console.warn("[visit-track] Supabase-Insert fehlgeschlagen:", err.message);
    } finally {
        clearTimeout(timer);
    }
}

async function recordTrack(payload) {
    if (!payload || typeof payload !== "object") {
        return false;
    }
    const entry = buildEntry(payload);
    logToConsoleAndFile(entry);
    await insertSupabase(entry);
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

async function expressHandler(req, res) {
    try {
        await recordTrack(req.body || {});
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
            await recordTrack(payload);
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
module.exports.buildEntry = buildEntry;
module.exports.recordTrack = recordTrack;
module.exports.sanitizeRef = sanitizeRef;
