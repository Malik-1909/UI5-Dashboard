sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/BusyIndicator",
    "ui5/vizframe/app/utils/SapDataLoader",
    "ui5/vizframe/app/utils/BtpHealthMonitor"
], function (UIComponent, JSONModel, MessageToast, BusyIndicator, SapDataLoader, BtpHealthMonitor) {
    "use strict";

    return UIComponent.extend("ui5.vizframe.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            if (this._isGitHubPagesHost()) {
                this._initSalesModelStaticHost();
                this._initBtpHealthMonitor();
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
        _initBtpHealthMonitor: function () {
            var oModel = new JSONModel();
            this.setModel(oModel, "btpHealth");
            BtpHealthMonitor.start(oModel);
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

            BusyIndicator.show(0);

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
                    BusyIndicator.hide();
                });
        }
    });
});
