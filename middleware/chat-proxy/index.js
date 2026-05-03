/**
 * UI5 Custom Middleware
 *   POST /api/chat   → Groq KI-API (kostenlos, Key: https://console.groq.com)
 *   GET  /api/sap/*  → SAP Business Accelerator Hub Sandbox
 *                      (Key: https://api.sap.com → Settings → Show API Key)
 *
 * .env im Projektstamm:
 *   GROQ_API_KEY=gsk_...
 *   SAP_API_KEY=...
 *   MOCK_MODE=true  (optional, Chat-Simulation ohne Groq-Key)
 */

const fs   = require("fs");
const path = require("path");

// Lädt .env aus dem Projektstamm
function loadDotEnv() {
    try {
        const lines = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf8").split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) { continue; }
            const eqIdx = trimmed.indexOf("=");
            if (eqIdx < 1) { continue; }
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (key && !(key in process.env)) { process.env[key] = val; }
        }
    } catch (_) { /* .env nicht vorhanden */ }
}
loadDotEnv();

const GROQ_URL        = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL      = "llama-3.3-70b-versatile";
const SAP_SANDBOX     = "https://sandbox.api.sap.com";
const SAP_API_PREFIX  = "/api/sap";

const SYSTEM_PROMPT = `Du bist ein intelligenter Dashboard-Assistent für eine SAPUI5 Business-Intelligence-Anwendung.

LAYOUT DER STARTSEITE (Kacheln):
  Zeile 1 (je 1/3 Breite, von links nach rechts):
    1. LINKS:  Recruit to Retire (RtR) – Balkendiagramm – Rekrutierungsstufen
    2. MITTE:  Record to Report (R2R)  – Kreisdiagramm  – Kontenklassen-Anteile
    3. RECHTS: Source to Pay (S2P)     – Donut-Diagramm – Ausgabenkategorien
  Zeile 2 (je 50% Breite, von links nach rechts):
    4. LINKS:  Design to Operate (D2O) – Liniendiagramm – Output-Trend
    5. RECHTS: Lead to Cash (L2C)      – Balkendiagramm – Conversion-Funnel

TECHNIK: SAPUI5 1.120, sap.viz VizFrame, OData v2, SAP Horizon Theme.

SAP-GESCHÄFTSPROZESSE:
  • Record to Report (R2R) – Buchung bis Finanzabschluss
  • Recruit to Retire (RtR) – HR: Einstellung bis Ruhestand
  • Source to Pay (S2P) – Einkauf & Lieferantenmanagement
  • Design to Operate (D2O) – Produktentwicklung & Fertigung
  • Lead to Cash (L2C) – Vertrieb & Umsatzrealisierung

REGELN:
1. Antworte immer auf Deutsch, knapp und präzise.
2. Wenn der Benutzer zu einer Seite navigieren möchte, antworte NUR mit diesem JSON – kein anderer Text:
   {"action":"navigate","route":"<routeName>"}
   Gültige Routen: main, r2r, rtr, s2p, d2o, l2c, project
3. Beantworte Fragen zum Layout anhand der obigen Kachelreihenfolge.
4. Formatiere mit einfachem HTML: <strong>, <em>, <br> – kein CSS, keine anderen Tags.`;

// ── Mock-Antworten (wenn MOCK_MODE=true oder kein Key) ─────────────────────
const MOCK_RESPONSES = [
  { test: /\b(start|startseite|home|hauptseite|zurück)\b/i,
    reply: '{"action":"navigate","route":"main"}' },
  { test: /\b(r2r|record.to.report)\b/i,
    reply: '{"action":"navigate","route":"r2r"}' },
  { test: /\b(rtr|recruit.to.retire)\b/i,
    reply: '{"action":"navigate","route":"rtr"}' },
  { test: /\b(s2p|source.to.pay)\b/i,
    reply: '{"action":"navigate","route":"s2p"}' },
  { test: /\b(d2o|design.to.operate)\b/i,
    reply: '{"action":"navigate","route":"d2o"}' },
  { test: /\b(l2c|lead.to.cash)\b/i,
    reply: '{"action":"navigate","route":"l2c"}' },
  { test: /\b(projekt|project|über das|about)\b/i,
    reply: '{"action":"navigate","route":"project"}' },
  { test: /\b(hallo|hi|hey|moin|guten\s*(morgen|tag|abend))\b/i,
    reply: "Hallo! 👋 Ich bin dein KI-Assistent für dieses SAP-Dashboard.\n\nIch kann:\n• Geschäftsprozesse erklären (R2R, RtR, S2P, D2O, L2C)\n• Zu Seiten navigieren – sag einfach \"Zeige R2R\"\n• KPI-Fragen beantworten\n\nWas möchtest du wissen?" },
  { test: /\b(kachel|kackel|tile|oben links|oben rechts|mitte oben|links oben|rechts oben)\b/i,
    reply: "Die Startseite hat 5 Prozesskacheln in 2 Reihen:<br><br><strong>Reihe 1 (oben, je 1/3):</strong><br>• Links: <strong>Recruit to Retire (RtR)</strong> – Balkendiagramm<br>• Mitte: <strong>Record to Report (R2R)</strong> – Kreisdiagramm<br>• Rechts: <strong>Source to Pay (S2P)</strong> – Donut-Diagramm<br><br><strong>Reihe 2 (unten, je 1/2):</strong><br>• Links: <strong>Design to Operate (D2O)</strong> – Liniendiagramm<br>• Rechts: <strong>Lead to Cash (L2C)</strong> – Balkendiagramm<br><br>Klick auf eine Kachel für die Detailseite!" },
  { test: /\b(was ist|erkl|bedeutet).*(r2r|record)\b/i,
    reply: "<strong>Record to Report (R2R)</strong> ist der Finanz-Abschlussprozess:\nBuchungen → Abstimmung → Abschluss → Bericht.\n\nKPIs: Abschlussqualität, Buchungsvolumen, Fehlerquote." },
  { test: /\b(was ist|erkl|bedeutet).*(rtr|recruit)\b/i,
    reply: "<strong>Recruit to Retire (RtR)</strong> umfasst alle HR-Prozesse:\nRecruiting → Onboarding → Entwicklung → Abrechnung.\n\nKPIs: Time-to-Hire, Fluktuationsrate, Headcount." },
  { test: /\b(was ist|erkl|bedeutet).*(s2p|source|einkauf)\b/i,
    reply: "<strong>Source to Pay (S2P)</strong> ist der Einkaufsprozess:\nBedarf → Lieferant → Bestellung → Rechnung.\n\nKPIs: Einkaufsvolumen, Lieferantenperformance, Durchlaufzeit." },
  { test: /\b(was ist|erkl|bedeutet).*(d2o|design|produk)\b/i,
    reply: "<strong>Design to Operate (D2O)</strong> umfasst den Produktentstehungsprozess:\nDesign → Produktion → Qualität → Betrieb.\n\nKPIs: Time-to-Market, OEE, Ausschussrate." },
  { test: /\b(was ist|erkl|bedeutet).*(l2c|lead|cash|vertrieb)\b/i,
    reply: "<strong>Lead to Cash (L2C)</strong> ist der Vertriebsprozess:\nLead → Angebot → Auftrag → Zahlung.\n\nKPIs: Conversion Rate, Umsatz, DSO." },
  { test: /\b(kpi|kennzahl|daten|zahlen|metr)\b/i,
    reply: "Die KPI-Daten kommen im lokalen Modus aus dem <strong>OData-Mock-Service</strong>. Im Produktivbetrieb aus SAP BW oder S/4HANA." },
  { test: /\b(hilfe|help|was kannst|fähigkeit)\b/i,
    reply: "Ich kann helfen mit:\n\n<strong>Navigation:</strong> \"Zeige R2R\"\n<strong>Prozesse:</strong> \"Was ist Lead to Cash?\"\n<strong>App-Fragen:</strong> \"Was machen die Kacheln?\"\n<strong>KPIs:</strong> \"Welche KPIs gibt es?\"" },
];

// ── Middleware export ────────────────────────────────────────────────────────
module.exports = function () {
    const apiKey    = process.env.GROQ_API_KEY || "";
    const sapKey    = process.env.SAP_API_KEY  || "";
    const mockMode  = process.env.MOCK_MODE === "true" || !apiKey;

    if (mockMode) {
        console.log("[chat-proxy] MOCK_MODE aktiv (Demo-Modus ohne Groq-Key).");
    } else {
        console.log(`[chat-proxy] Groq bereit – Modell: ${GROQ_MODEL}`);
    }
    if (sapKey) {
        console.log("[sap-proxy]  SAP Sandbox bereit – /api/sap/* → sandbox.api.sap.com");
    } else {
        console.log("[sap-proxy]  Kein SAP_API_KEY – /api/sap/* antwortet mit 503.");
    }

    return async function chatProxy(req, res, next) {
        // ── SAP Sandbox Proxy ──────────────────────────────────────────────
        if (req.url.startsWith(SAP_API_PREFIX)) {
            return await handleSapProxy(req, res, sapKey);
        }

        if (req.method !== "POST" || req.url !== "/api/chat") { return next(); }

        let raw = "";
        for await (const chunk of req) raw += chunk;

        try {
            const { messages = [], context = "" } = JSON.parse(raw);
            const userText = messages[messages.length - 1]?.text || "";

            const reply = mockMode
                ? getMockReply(userText)
                : await callGroq(messages, context, apiKey);

            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ reply }));
        } catch (err) {
            console.error("[chat-proxy] Fehler:", err.message.slice(0, 150));
            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            // Send as reply (not error) so the controller shows it in the chat
            res.end(JSON.stringify({ reply: "Die KI ist momentan nicht erreichbar. Bitte versuche es erneut." }));
        }
    };
};

// ── SAP Sandbox Proxy ─────────────────────────────────────────────────────────
async function handleSapProxy(req, res, sapKey) {
    if (!sapKey) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "SAP_API_KEY nicht gesetzt – bitte in .env eintragen." }));
        return;
    }

    const targetPath = req.url.slice(SAP_API_PREFIX.length);
    const targetUrl  = SAP_SANDBOX + targetPath;

    try {
        const sapRes = await fetch(targetUrl, {
            method:  req.method,
            headers: {
                "APIKey":  sapKey,
                "Accept":  req.headers["accept"]       || "application/json",
                "DataServiceVersion": "2.0",
                "MaxDataServiceVersion": "2.0",
            },
        });

        const body        = await sapRes.text();
        const contentType = sapRes.headers.get("content-type") || "application/json";
        res.writeHead(sapRes.status, {
            "Content-Type":  contentType,
            "Cache-Control": "no-cache",
        });
        res.end(body);
    } catch (err) {
        console.error("[sap-proxy] Fehler:", err.message);
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "SAP Sandbox nicht erreichbar: " + err.message }));
    }
}

// ── Groq API call ────────────────────────────────────────────────────────────
async function callGroq(messages, context, apiKey) {
    const systemText = context
        ? `${SYSTEM_PROMPT}\n\nAktueller Kontext: ${context}`
        : SYSTEM_PROMPT;

    // Convert to OpenAI-compatible format
    const chatMessages = [
        { role: "system", content: systemText },
        ...messages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text,
        })),
    ];

    const response = await fetch(GROQ_URL, {
        method:  "POST",
        headers: {
            "Content-Type":  "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model:       GROQ_MODEL,
            messages:    chatMessages,
            max_tokens:  512,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq ${response.status}: ${text.slice(0, 200)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? "Keine Antwort erhalten.";
}

// ── Mock fallback ────────────────────────────────────────────────────────────
function getMockReply(text) {
    for (const { test, reply } of MOCK_RESPONSES) {
        if (test.test(text)) return reply;
    }
    return "Im Demo-Modus beantworte ich vordefinierte Themen.\n\nVersuche: \"Was ist R2R?\", \"Zeige L2C\", \"Was machen die Kacheln?\" oder \"Hilfe\".";
}
