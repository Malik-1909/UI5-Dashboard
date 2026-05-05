sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "ui5/vizframe/app/utils/VizFramePopoverHelper"
], function (BaseController, JSONModel, VizFramePopoverHelper) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.S2P", {
        onInit: function () {
            this.getView().setModel(new JSONModel({ title: "Source to Pay" }), "proc");
        },

        onAfterRendering: function () {
            VizFramePopoverHelper.connectPopovers(this, ["s2pFunnelChart", "s2pSpendChart", "s2pOrdersTrendChart"]);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
