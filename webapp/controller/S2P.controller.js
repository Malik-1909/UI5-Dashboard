sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "ui5/vizframe/app/utils/VizFramePopoverHelper"
], function (BaseController, VizFramePopoverHelper) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.S2P", {
        onInit: function () {
            this.initProcTitle("process.s2p");
        },

        onAfterRendering: function () {
            VizFramePopoverHelper.connectPopovers(this, ["s2pFunnelChart", "s2pSpendChart", "s2pOrdersTrendChart"]);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
