sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("ui5.vizframe.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            if (this._isGitHubPagesHost()) {
                this._installStaticSalesModel();
            }
            this.getRouter().initialize();
        },

        /** GitHub Pages: kein OData-Mock, kein /api/chat – nur statische Dateien. */
        _isGitHubPagesHost: function () {
            var h = typeof window !== "undefined" && window.location && window.location.hostname;
            return !!h && /\.github\.io$/i.test(h);
        },

        isRunningOnGitHubPages: function () {
            return this._isGitHubPagesHost();
        },

        _installStaticSalesModel: function () {
            var oOld = this.getModel("sales");
            if (oOld) {
                oOld.destroy();
            }
            var oJson = new JSONModel();
            var sUrl = sap.ui.require.toUrl("ui5/vizframe/app/localService/static-mock-bundle.json");
            oJson.loadData(sUrl, {}, false);
            this.setModel(oJson, "sales");
        }
    });
});
