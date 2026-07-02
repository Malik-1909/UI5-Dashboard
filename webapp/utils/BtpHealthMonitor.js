/**
 * Prüft periodisch die BTP-Live-Demo (/health).
 * Zeigt in der UI einen Hinweis, wenn die Trial-App gestoppt ist.
 */
sap.ui.define([], function () {
    "use strict";

    var HEALTH_URL = "https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/health";
    var LIVE_URL = "https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/";
    var POLL_MS = 60000;
    var REQUEST_TIMEOUT_MS = 8000;

    var iTimer = null;

    function _fetchHealth() {
        if (typeof AbortController !== "undefined") {
            var oController = new AbortController();
            var iTimerId = setTimeout(function () { oController.abort(); }, REQUEST_TIMEOUT_MS);
            return fetch(HEALTH_URL, {
                method: "GET",
                mode: "cors",
                signal: oController.signal
            }).finally(function () {
                clearTimeout(iTimerId);
            });
        }
        return fetch(HEALTH_URL, { method: "GET", mode: "cors" });
    }

    function _applyStatus(oModel, bOnline) {
        oModel.setProperty("/status", bOnline ? "online" : "offline");
        oModel.setProperty("/visible", !bOnline);
        oModel.setProperty("/liveUrl", LIVE_URL);
    }

    function check(oModel) {
        return _fetchHealth()
            .then(function (oRes) {
                _applyStatus(oModel, oRes.ok);
            })
            .catch(function () {
                _applyStatus(oModel, false);
            });
    }

    return {
        start: function (oModel) {
            if (iTimer) {
                clearInterval(iTimer);
            }
            oModel.setData({
                status: "checking",
                visible: false,
                liveUrl: LIVE_URL
            });
            check(oModel);
            iTimer = setInterval(function () {
                check(oModel);
            }, POLL_MS);
        },

        stop: function () {
            if (iTimer) {
                clearInterval(iTimer);
                iTimer = null;
            }
        }
    };
});
