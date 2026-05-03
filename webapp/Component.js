sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "ui5/vizframe/app/utils/SapDataLoader"
], function (UIComponent, JSONModel, MessageToast, BusyIndicator, SapDataLoader) {
    "use strict";

    return UIComponent.extend("ui5.vizframe.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            if (this._isGitHubPagesHost()) {
                this._initSalesModelStaticHost();
                this.getRouter().initialize();
            } else {
                var oThis = this;
                this._initSalesModelAfterSandbox().then(function () {
                    oThis.getRouter().initialize();
                });
            }
        },

        _isGitHubPagesHost: function () {
            var h = typeof window !== "undefined" && window.location && window.location.hostname;
            return !!h && /\.github\.io$/i.test(h);
        },

        isRunningOnGitHubPages: function () {
            return this._isGitHubPagesHost();
        },

        /**
         * GitHub Pages: nur statisches Mock-Bundle, kein SAP-Proxy – Modell sofort, Router direkt.
         */
        _initSalesModelStaticHost: function () {
            var sBundleUrl = sap.ui.require.toUrl("ui5/vizframe/app/localService/static-mock-bundle.json");
            var oModel = new JSONModel();
            oModel.loadData(sBundleUrl, null, false);
            this.setModel(oModel, "sales");
        },

        /**
         * Lokal: erst Sandbox-Daten (parallel zum Lesen des Mock-Bundles), dann einmalig
         * setModel + Router – vermeidet Mock-zuerst und anschließendes setData (Layout-Sprung).
         */
        _initSalesModelAfterSandbox: function () {
            var oThis = this;
            var sBundleUrl = sap.ui.require.toUrl("ui5/vizframe/app/localService/static-mock-bundle.json");
            var oModel = new JSONModel();
            oModel.loadData(sBundleUrl, null, false);
            var oBaseData = oModel.getData() || {};

            BusyIndicator.show(0);

            return SapDataLoader.loadAll()
                .then(function (result) {
                    var nLoaded = Object.keys(result.sources).reduce(function (s, k) { return s + result.sources[k]; }, 0);
                    if (!nLoaded) {
                        console.info("[SapDataLoader] Keine Daten – Mock-Daten bleiben aktiv.");
                        if (!oThis._sapDataNoticeShown) {
                            oThis._sapDataNoticeShown = true;
                            MessageToast.show(
                                "SAP-Sandbox liefert keine Daten (z. B. kein API-Key). Es werden Demo-Daten angezeigt.",
                                { duration: 4500 }
                            );
                        }
                        return;
                    }
                    oModel.setData(Object.assign({}, oBaseData, result.data));
                    console.info("[SapDataLoader] Echte SAP-Daten geladen:", JSON.stringify(result.sources));
                })
                .catch(function (err) {
                    console.warn("[SapDataLoader] Fehler – Mock-Fallback:", err && err.message);
                    MessageToast.show(
                        "Live-Daten konnten nicht geladen werden. Demo-Daten bleiben aktiv.",
                        { duration: 5000 }
                    );
                })
                .finally(function () {
                    oThis.setModel(oModel, "sales");
                    BusyIndicator.hide();
                });
        }
    });
});
