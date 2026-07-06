/**
 * Sendet Besucher-Events an POST /api/track (lokal + BTP, nicht GitHub Pages).
 * ref-Slug aus ?ref=… wird in sessionStorage gehalten.
 */
sap.ui.define([], function () {
    "use strict";

    var SESSION_ID_KEY = "ui5_visit_session_id";
    var REF_KEY = "ui5_visit_ref";
    var TRACK_URL = "/api/track";

    function isEnabled(hostname) {
        return !!hostname && !/\.github\.io$/i.test(hostname);
    }

    function readRefFromUrl() {
        try {
            return new URLSearchParams(window.location.search).get("ref") || "";
        } catch (_e) {
            return "";
        }
    }

    function getRef() {
        var stored = sessionStorage.getItem(REF_KEY);
        if (stored) {
            return stored;
        }
        var ref = readRefFromUrl();
        if (ref) {
            sessionStorage.setItem(REF_KEY, ref);
        }
        return ref || "";
    }

    function getSessionId() {
        var id = sessionStorage.getItem(SESSION_ID_KEY);
        if (!id) {
            id = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
            sessionStorage.setItem(SESSION_ID_KEY, id);
        }
        return id;
    }

    function sendPayload(payload) {
        var body = JSON.stringify(Object.assign({
            ref: getRef(),
            sessionId: getSessionId()
        }, payload));

        if (payload.event === "session_end" && typeof navigator.sendBeacon === "function") {
            navigator.sendBeacon(TRACK_URL, new Blob([body], { type: "application/json" }));
            return;
        }

        fetch(TRACK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
            keepalive: true
        }).catch(function () { /* stiller Fehler – Tracking darf App nicht stören */ });
    }

    function track(event, route, extra) {
        sendPayload(Object.assign({
            event: event,
            route: route || ""
        }, extra || {}));
    }

    function start(oComponent) {
        if (!isEnabled(window.location.hostname)) {
            return;
        }

        var iSessionStart = Date.now();

        track("session_start", "");

        var oRouter = oComponent.getRouter();
        oRouter.attachRouteMatched(function (oEvent) {
            track("page_view", oEvent.getParameter("name") || "");
        });

        window.addEventListener("beforeunload", function () {
            track("session_end", "", {
                durationSec: Math.round((Date.now() - iSessionStart) / 1000)
            });
        });
    }

    return {
        start: start,
        isEnabled: isEnabled
    };
});
