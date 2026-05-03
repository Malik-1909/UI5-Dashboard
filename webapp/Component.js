sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "ui5/vizframe/app/utils/SapDataLoader"
], function (UIComponent, JSONModel, SapDataLoader) {
    "use strict";

    return UIComponent.extend("ui5.vizframe.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this._initSalesModel();
            this.getRouter().initialize();
        },

        _isGitHubPagesHost: function () {
            var h = typeof window !== "undefined" && window.location && window.location.hostname;
            return !!h && /\.github\.io$/i.test(h);
        },

        isRunningOnGitHubPages: function () {
            return this._isGitHubPagesHost();
        },

        /**
         * Ersetzt das OData-Modell aus dem Manifest durch ein JSONModel:
         *  1. Sofort mit Mock-Bundle-Daten (UI funktioniert direkt)
         *  2. Async: echte SAP Sandbox-Daten obendrauf laden
         *     → nur die Entity Sets, für die Daten ankommen, werden überschrieben
         *     → alles andere bleibt Mock-Fallback
         */
        _initSalesModel: function () {
            var oThis = this;
            var sBundleUrl = sap.ui.require.toUrl("ui5/vizframe/app/localService/static-mock-bundle.json");

            var oModel = new JSONModel();
            oModel.loadData(sBundleUrl, null, false);
            var oBaseData = oModel.getData() || {};
            oThis.setModel(oModel, "sales");

            if (oThis._isGitHubPagesHost()) {
                return;
            }

            SapDataLoader.loadAll()
                .then(function (result) {
                    var nLoaded = Object.keys(result.sources).reduce(function (s, k) { return s + result.sources[k]; }, 0);
                    if (!nLoaded) {
                        console.info("[SapDataLoader] Keine Daten – Mock-Daten bleiben aktiv.");
                        return;
                    }
                    var oMerged = Object.assign({}, oBaseData, result.data);
                    oModel.setData(oMerged);
                    console.info("[SapDataLoader] Echte SAP-Daten geladen:", JSON.stringify(result.sources));
                })
                .catch(function (err) {
                    console.warn("[SapDataLoader] Fehler – Mock-Fallback:", err && err.message);
                });
        }
    });
});
