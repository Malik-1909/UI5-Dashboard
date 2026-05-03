sap.ui.define([], function () {
    "use strict";

    /** Entspricht der MOCK_MODE-Logik in middleware/chat-proxy (nur Regex → Antwort). */
    var MOCK_RESPONSES = [
        { test: /\b(start|startseite|home|hauptseite|zurück)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"main\"}" },
        { test: /\b(r2r|record.to.report)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"r2r\"}" },
        { test: /\b(rtr|recruit.to.retire)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"rtr\"}" },
        { test: /\b(s2p|source.to.pay)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"s2p\"}" },
        { test: /\b(d2o|design.to.operate)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"d2o\"}" },
        { test: /\b(l2c|lead.to.cash)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"l2c\"}" },
        { test: /\b(projekt|project|über das|about)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"project\"}" },
        { test: /\b(hallo|hi|hey|moin|guten\s*(morgen|tag|abend))\b/i,
            reply: "Hallo! Ich bin dein KI-Assistent für dieses SAP-Dashboard.\n\nIch kann:\n• Geschäftsprozesse erklären (R2R, RtR, S2P, D2O, L2C)\n• Zu Seiten navigieren – sag einfach \"Zeige R2R\"\n• KPI-Fragen beantworten\n\nWas möchtest du wissen?" },
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
            reply: "Auf <strong>GitHub Pages</strong> kommen die Diagramme aus den gleichen <strong>Demo-JSON-Dateien</strong> wie lokal im Mock – ohne echtes SAP-Backend." },
        { test: /\bwas\s+kannst\s+du\s+alles\b/i,
            reply: "Ich kann helfen mit:\n\n<strong>Navigation:</strong> \"Zeige R2R\"\n<strong>Prozesse:</strong> \"Was ist Lead to Cash?\"\n<strong>App-Fragen:</strong> \"Was machen die Kacheln?\"\n<strong>KPIs:</strong> \"Welche KPIs gibt es?\"\n\n(Hinweis: Auf GitHub Pages läuft nur diese Offline-Simulation – keine echte KI.)" },
        { test: /\b(hilfe|help|was kannst|was kannst du|was kann|fähigkeit)\b/i,
            reply: "Ich kann helfen mit:\n\n<strong>Navigation:</strong> \"Zeige R2R\"\n<strong>Prozesse:</strong> \"Was ist Lead to Cash?\"\n<strong>App-Fragen:</strong> \"Was machen die Kacheln?\"\n<strong>KPIs:</strong> \"Welche KPIs gibt es?\"\n\n(Hinweis: Auf GitHub Pages läuft nur diese Offline-Simulation – keine echte KI.)" }
    ];

    function getReply(sText) {
        var s = (sText || "").trim();
        for (var i = 0; i < MOCK_RESPONSES.length; i++) {
            if (MOCK_RESPONSES[i].test.test(s)) {
                return MOCK_RESPONSES[i].reply;
            }
        }
        return "Auf GitHub Pages ist kein Chat-Backend verfügbar. Lokal mit <code>npm run start</code> und API-Key antwortet die echte KI.\n\n" +
            "Trotzdem: Probiere <strong>\"Zeige R2R\"</strong>, <strong>\"Was ist L2C?\"</strong> oder <strong>\"Hilfe\"</strong> – Navigation und Kurzantworten funktionieren offline.";
    }

    return { getReply: getReply };
});
