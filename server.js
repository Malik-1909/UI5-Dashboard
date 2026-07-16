const fs = require("fs");
const path = require("path");
const express = require("express");
const createChatProxy = require("ui5-middleware-chat-proxy");
const visitTracker = require("./middleware/visit-tracker");

const app = express();
const port = Number(process.env.PORT) || 8080;

const distDir = path.resolve(__dirname, "dist");
const indexFile = path.join(distDir, "index.html");
const chatProxy = createChatProxy();

app.disable("x-powered-by");

app.get("/health", (_req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json({ status: "ok" });
});

// SAP-Daten kommen aus einem stündlich per GitHub Action erzeugten Cache.
// Grund: Der BTP-Trial-Egress erreicht sandbox.api.sap.com nicht direkt
// (TCP-Connect-Timeout auf 157.133.171.110). raw.githubusercontent.com ist erreichbar.
const SAP_CACHE_URL = process.env.SAP_CACHE_URL ||
    "https://raw.githubusercontent.com/Malik-1909/UI5-Dashboard/sap-cache-data/sap-cache.json";
const SAP_CACHE_TTL_MS = 10 * 60 * 1000;
let sapCache = { at: 0, body: null };

app.get("/api/sap-cache", async (_req, res) => {
    res.set("Cache-Control", "public, max-age=300");

    if (sapCache.body && (Date.now() - sapCache.at) < SAP_CACHE_TTL_MS) {
        res.type("application/json").send(sapCache.body);
        return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
        const r = await fetch(SAP_CACHE_URL, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
            cache: "no-store"
        });
        if (!r.ok) { throw new Error("cache source HTTP " + r.status); }
        const body = await r.text();
        sapCache = { at: Date.now(), body };
        res.type("application/json").send(body);
    } catch (err) {
        console.error("[sap-cache] Fehler:", err.message);
        if (sapCache.body) {
            res.type("application/json").send(sapCache.body); // stale-while-error
            return;
        }
        res.status(502).json({ error: "SAP-Cache nicht erreichbar: " + err.message });
    } finally {
        clearTimeout(timer);
    }
});

app.post("/api/track", express.json({ limit: "4kb" }), visitTracker.expressHandler);

app.use((req, res, next) => chatProxy(req, res, next));

// App-Shell-Dateien (HTML, Manifest, i18n, Preload) ändern sich bei jedem Deploy,
// tragen aber keinen Hash im Namen. Ohne Revalidierung sehen wiederkehrende Besucher
// bis zu maxAge lang die alte Version. Daher: immer revalidieren (ETag → 304),
// nur echte statische Assets dürfen länger gecacht werden.
const REVALIDATE = "no-cache";
const SHELL_FILE = /(index\.html|manifest\.json|Component-preload\.js|\.properties)$/i;

app.use(express.static(distDir, {
    index: false,
    maxAge: "1h",
    setHeaders: (res, filePath) => {
        if (SHELL_FILE.test(filePath)) {
            res.set("Cache-Control", REVALIDATE);
        }
    }
}));

app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }
    res.set("Cache-Control", REVALIDATE);
    return res.sendFile(indexFile);
});

if (!fs.existsSync(indexFile)) {
    console.error("[server] dist/index.html fehlt. Bitte zuerst `npm run build:cf` ausführen.");
    process.exit(1);
}

app.listen(port, () => {
    console.log(`[server] UI5 app + API proxy listening on port ${port}`);
});
