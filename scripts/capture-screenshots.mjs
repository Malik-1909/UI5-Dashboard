/**
 * Captures README screenshots from a running UI5 dev server.
 *
 * Usage:
 *   npm run screenshots              # startet Dev-Server automatisch
 *   npm run screenshots:only         # nur Capture (Server muss laufen)
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = process.env.SCREENSHOT_PORT || "8090";
const BASE = process.env.SCREENSHOT_BASE || `http://127.0.0.1:${PORT}/index.html`;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "docs", "screenshots");
const WITH_SERVER = process.argv.includes("--with-server");

async function waitForServer(url, timeoutMs = 120000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
            if (res.ok) {
                return;
            }
        } catch (_) {
            /* retry */
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Dev-Server antwortet nicht unter ${url}`);
}

async function assertServerRunning() {
    try {
        await waitForServer(BASE, 3000);
    } catch (_) {
        console.error(`
Screenshots fehlgeschlagen: Kein Dev-Server auf Port ${PORT}.

Option A (empfohlen):
  npm run screenshots

Option B (zwei Terminals):
  Terminal 1: npx ui5 serve --port ${PORT}
  Terminal 2: npm run screenshots:only
`);
        process.exit(1);
    }
}

function startDevServer() {
    return new Promise((resolve, reject) => {
        // Kein --open: UI5 würde sonst "false" als Pfad öffnen → localhost:8090/false
        const child = spawn("npx", ["ui5", "serve", "--port", PORT], {
            cwd: ROOT,
            stdio: ["ignore", "pipe", "pipe"],
            env: process.env
        });

        let resolved = false;
        const onReady = () => {
            if (!resolved) {
                resolved = true;
                resolve(child);
            }
        };

        const onOutput = (buf) => {
            if (buf.toString().includes("Server started")) {
                onReady();
            }
        };

        child.stdout.on("data", onOutput);
        child.stderr.on("data", onOutput);
        child.on("error", reject);
        child.on("exit", (code) => {
            if (!resolved) {
                reject(new Error(`ui5 serve beendet mit Code ${code}`));
            }
        });

        waitForServer(BASE).then(onReady).catch(reject);
    });
}

async function runCapture() {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.setDefaultTimeout(120000);
    await mkdir(OUT, { recursive: true });

    await page.goto(BASE, { waitUntil: "load", timeout: 60000 });
    await page.waitForFunction(() => {
        const el = document.querySelector('[id*="tileRtR"]') || document.querySelector('[id*="mainPage"]');
        return el && el.offsetHeight > 0;
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT, "main-dashboard.png"), fullPage: true });
    console.log("Saved main-dashboard.png");

    try {
        const detailPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        detailPage.setDefaultTimeout(120000);
        await detailPage.goto(`${BASE}#/l2c`, { waitUntil: "load", timeout: 60000 });
        await detailPage.waitForFunction(() => !!document.querySelector("#l2cKpiTable"));
        await detailPage.waitForTimeout(2000);
        await detailPage.screenshot({ path: path.join(OUT, "l2c-detail.png"), fullPage: true });
        console.log("Saved l2c-detail.png");
        await detailPage.close();
    } catch (err) {
        console.warn("Hinweis: l2c-detail.png konnte nicht erzeugt werden:", err.message);
        console.warn("Startseiten-Screenshot ist vorhanden. L2C ggf. manuell oder mit laufendem Server erneut versuchen.");
    }

    await browser.close();
    console.log("Done.");
}

let serverProcess = null;

try {
    if (WITH_SERVER) {
        console.log(`Starte ui5 serve auf Port ${PORT} …`);
        serverProcess = await startDevServer();
        console.log("Dev-Server bereit.");
    } else {
        await assertServerRunning();
    }

    await runCapture();
} finally {
    if (serverProcess && !serverProcess.killed) {
        serverProcess.kill("SIGTERM");
    }
}
