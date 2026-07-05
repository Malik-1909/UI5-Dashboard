sap.ui.define([], function () {
    "use strict";

    /** Entspricht der MOCK_MODE-Logik in middleware/chat-proxy (nur Regex → Antwort). */
    var MOCK_RESPONSES = [
        { test: /\b(start|startseite|home|hauptseite|zurück)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"main\"}" },
        { test: /\b(r2r|record.to.report|buchung)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"r2r\"}" },
        { test: /\b(rtr|recruit.to.retire|rekrutierung)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"rtr\"}" },
        { test: /\b(s2p|source.to.pay|beschaffung|einkauf)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"s2p\"}" },
        { test: /\b(d2o|design.to.operate|betrieb)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"d2o\"}" },
        { test: /\b(l2c|lead.to.cash|vertrieb)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"l2c\"}" },
        { test: /\b(projekt|project|über das|about)\b/i,
            reply: "{\"action\":\"navigate\",\"route\":\"project\"}" },
        { test: /\b(hallo|hi|hey|moin|guten\s*(morgen|tag|abend))\b/i,
            reply: "Hallo! Ich bin dein KI-Assistent für dieses Dashboard.\n\nIch helfe bei den Prozessen (R2R, RtR, S2P, D2O, L2C), den Kacheln und KPIs. Wobei darf ich helfen?" },
        { test: /\b(kachel|kackel|tile|oben links|oben rechts|mitte oben|links oben|rechts oben)\b/i,
            reply: "Die Startseite hat 5 Prozesskacheln in 2 Reihen:<br><br><strong>Reihe 1 (oben, je 1/3):</strong><br>• Links: <strong>Rekrutierung bis Ruhestand (RtR)</strong> – Balkendiagramm<br>• Mitte: <strong>Buchung bis Abschluss (R2R)</strong> – Kreisdiagramm<br>• Rechts: <strong>Beschaffung bis Zahlung (S2P)</strong> – Donut-Diagramm<br><br><strong>Reihe 2 (unten, je 1/2):</strong><br>• Links: <strong>Design bis Betrieb (D2O)</strong> – Liniendiagramm<br>• Rechts: <strong>Lead bis Zahlungseingang (L2C)</strong> – Balkendiagramm<br><br>Klick auf eine Kachel für die Detailseite!" },
        { test: /\b(was ist|erkl|bedeutet).*(r2r|record|buchung)\b/i,
            reply: "<strong>Buchung bis Abschluss (R2R)</strong> ist der Finanz-Abschlussprozess:\nBuchungen → Abstimmung → Abschluss → Bericht.\n\nKPIs: Abschlussqualität, Buchungsvolumen, Fehlerquote." },
        { test: /\b(was ist|erkl|bedeutet).*(rtr|recruit|rekrutierung)\b/i,
            reply: "<strong>Rekrutierung bis Ruhestand (RtR)</strong> umfasst alle HR-Prozesse:\nRekrutierung → Einarbeitung → Entwicklung → Vergütung.\n\nKPIs: Time-to-Hire, Fluktuationsrate, Mitarbeiterzahl." },
        { test: /\b(was ist|erkl|bedeutet).*(s2p|source|einkauf|beschaffung)\b/i,
            reply: "<strong>Beschaffung bis Zahlung (S2P)</strong> ist der Einkaufsprozess:\nBedarf → Lieferant → Bestellung → Rechnung.\n\nKPIs: Einkaufsvolumen, Lieferantenperformance, Durchlaufzeit." },
        { test: /\b(was ist|erkl|bedeutet).*(d2o|design|produk|betrieb)\b/i,
            reply: "<strong>Design bis Betrieb (D2O)</strong> umfasst den Produktentstehungsprozess:\nKonstruktion → Produktion → Qualität → Betrieb.\n\nKPIs: Time-to-Market, OEE, Ausschussrate." },
        { test: /\b(was ist|erkl|bedeutet).*(l2c|lead|cash|vertrieb|zahlungseingang)\b/i,
            reply: "<strong>Lead bis Zahlungseingang (L2C)</strong> ist der Vertriebsprozess:\nInteressent → Angebot → Auftrag → Zahlung.\n\nKPIs: Conversion Rate, Umsatz, DSO." },
        { test: /\b(kpi|kennzahl|daten|zahlen|metr)\b/i,
            reply: "Auf <strong>GitHub Pages</strong> kommen die Diagramme aus den gleichen <strong>Demo-JSON-Dateien</strong> wie lokal im Mock – ohne echtes SAP-Backend." },
        { test: /\bwas\s+kannst\s+du\s+alles\b/i,
            reply: "Ich erkläre die App und die Geschäftsprozesse, beantworte Fragen zu Kacheln und KPIs und wechsle die Seite, wenn du es ausdrücklich möchtest (z. B. „Gehe zur Startseite“ / „Navigiere zu L2C“).\n\n(Hinweis: Auf GitHub Pages läuft nur die Offline-Simulation – keine echte KI.)" },
        { test: /\b(hilfe|help|was kannst|was kannst du|was kann|fähigkeit)\b/i,
            reply: "Ich erkläre die App und die Geschäftsprozesse, beantworte Fragen zu Kacheln und KPIs und wechsle die Seite, wenn du es ausdrücklich möchtest (z. B. „Gehe zur Startseite“ / „Navigiere zu L2C“).\n\n(Hinweis: Auf GitHub Pages läuft nur die Offline-Simulation – keine echte KI.)" }
    ];

    /** Wie im chat-proxy: Off-Topic im Offline-Mock abfangen. */
    var CHAT_OFF_TOPIC = /\b(wetter|fu(ß|ss)ball|bundesliga|champions|handball|tennis|basketball|hockey|formel\s*1|olymp|wm\s+20|em\s+20|sportler|politik|bundestag|bundeskanzler|kanzler|wahl|partei|präsident|horoskop|bitcoin|krypto|aktien|netflix|film|serie|musikcharts|rezept|dating)\b/i;

    var SCOPE_DECLINE =
        "Dazu kann ich hier nichts sagen – ich unterstütze nur bei <strong>dieser App</strong> und den <strong>dargestellten Prozessen</strong>.";

    function getReply(sText) {
        var s = (sText || "").trim();
        for (var i = 0; i < MOCK_RESPONSES.length; i++) {
            if (MOCK_RESPONSES[i].test.test(s)) {
                return MOCK_RESPONSES[i].reply;
            }
        }
        if (CHAT_OFF_TOPIC.test(s)) {
            return SCOPE_DECLINE;
        }
        return "Auf GitHub Pages ist kein Chat-Backend verfügbar. Lokal mit <code>npm run start</code> und API-Key antwortet die echte KI.\n\n" +
            "Offline gilt: nur diese App und die Prozesse im Dashboard. Schreib <strong>Hilfe</strong> für eine Kurzübersicht.";
    }

    return { getReply: getReply };
});
