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

app.post("/api/track", express.json({ limit: "4kb" }), visitTracker.expressHandler);

app.use((req, res, next) => chatProxy(req, res, next));

app.use(express.static(distDir, {
    index: false,
    maxAge: "1h"
}));

app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }
    return res.sendFile(indexFile);
});

if (!fs.existsSync(indexFile)) {
    console.error("[server] dist/index.html fehlt. Bitte zuerst `npm run build:cf` ausführen.");
    process.exit(1);
}

app.listen(port, () => {
    console.log(`[server] UI5 app + API proxy listening on port ${port}`);
});
