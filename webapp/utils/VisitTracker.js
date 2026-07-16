/**
 * Minimales, datensparsames Referral-Tracking.
 *
 * Sendet beim Laden EINMAL POST /api/track mit dem ref-Kürzel aus der URL (?ref=...).
 * Bewusst reduziert: kein Cookie, kein sessionStorage, keine Session-ID, keine IP,
 * keine Routen/Verweildauer – nur das selbst vergebene Kürzel; der Zeitpunkt wird
 * serverseitig gesetzt. Nicht aktiv auf GitHub Pages (statisch, kein Backend).
 */
sap.ui.define([], function () {
    "use strict";

    var TRACK_URL = "/api/track";
    var REF_MAX_LEN = 64;

    function isEnabled(hostname) {
        return !!hostname && !/\.github\.io$/i.test(hostname);
    }

    function readRef() {
        try {
            var raw = new URLSearchParams(window.location.search).get("ref") || "";
            return raw.slice(0, REF_MAX_LEN).replace(/[^a-zA-Z0-9._-]/g, "");
        } catch (e) {
            return "";
        }
    }

    function start() {
        if (!isEnabled(window.location.hostname)) {
            return;
        }

        var sRef = readRef();
        if (!sRef) {
            return; // ohne Kürzel gibt es nichts zuzuordnen -> nichts senden
        }

        try {
            fetch(TRACK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ref: sRef }),
                keepalive: true
            }).catch(function () { /* Tracking darf die App nie stören */ });
        } catch (e) { /* still */ }
    }

    return {
        start: start,
        isEnabled: isEnabled
    };
});
