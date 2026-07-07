sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "ui5/vizframe/app/utils/SapDataLoader",
    "ui5/vizframe/app/utils/BtpHealthMonitor",
    "ui5/vizframe/app/utils/VisitTracker"
], function (UIComponent, JSONModel, MessageToast, SapDataLoader, BtpHealthMonitor, VisitTracker) {
    "use strict";

    return UIComponent.extend("ui5.vizframe.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this._initBtpHealthModel();
            if (this._isGitHubPagesHost()) {
                this._initSalesModelStaticHost();
                BtpHealthMonitor.start(this.getModel("btpHealth"));
            } else {
                this._initSalesModelAfterSandbox();
            }
            this.getRouter().initialize();
            VisitTracker.start(this);
        },

        _isGitHubPagesHost: function () {
            var h = typeof window !== "undefined" && window.location && window.location.hostname;
            return !!h && /\.github\.io$/i.test(h);
        },

        isRunningOnGitHubPages: function () {
            return this._isGitHubPagesHost();
        },

        /**
         * btpHealth-Modell immer anlegen (lokal: Hinweis aus). Monitoring nur auf GitHub Pages.
         */
        _initBtpHealthModel: function () {
            this.setModel(new JSONModel({
                status: "local",
                visible: false,
                liveUrl: "https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/"
            }), "btpHealth");
        },

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
            var oBundle = this.getModel("i18n") && this.getModel("i18n").getResourceBundle();
            var sBundleUrl = sap.ui.require.toUrl("ui5/vizframe/app/localService/static-mock-bundle.json");
            var oModel = new JSONModel();
            oModel.loadData(sBundleUrl, null, false);
            var oBaseData = oModel.getData() || {};
            this.setModel(oModel, "sales");

            // Mock-Daten sind bereits sichtbar – Live-Laden im Hintergrund, ohne UI zu blockieren.
            return SapDataLoader.loadAll()
                .then(function (result) {
                    var nLoaded = Object.keys(result.sources).reduce(function (s, k) { return s + result.sources[k]; }, 0);
                    var mFailures = result.failures || {};
                    var aFailureKeys = Object.keys(mFailures);
                    var mNames = {
                        l2c: "L2C",
                        s2p: "S2P",
                        r2r: "R2R",
                        rtr: "RtR",
                        d2oDocs: "D2O",
                        d2oStock: "D2O"
                    };
                    if (aFailureKeys.length && oBundle) {
                        var aLabels = [];
                        aFailureKeys.forEach(function (k) {
                            var lbl = mNames[k] || k;
                            if (aLabels.indexOf(lbl) < 0) { aLabels.push(lbl); }
                        });
                        console.warn("[SapDataLoader] Teilweise Live-Ausfälle:", JSON.stringify(mFailures));
                        MessageToast.show(
                            oBundle.getText("toast.livePartialFail", [aLabels.join(", ")]),
                            { duration: 7000 }
                        );
                    }
                    if (!nLoaded) {
                        console.info("[SapDataLoader] Keine Daten – Mock-Daten bleiben aktiv.");
                        if (!oThis._sapDataNoticeShown && oBundle) {
                            oThis._sapDataNoticeShown = true;
                            MessageToast.show(
                                oBundle.getText("toast.sapNoData"),
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
                    if (oBundle) {
                        MessageToast.show(
                            oBundle.getText("toast.liveLoadFail"),
                            { duration: 5000 }
                        );
                    }
                })
                .finally(function () {
                    oThis.setModel(oModel, "sales");
                });
        }
    });
});
