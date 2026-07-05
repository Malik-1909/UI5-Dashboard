sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "ui5/vizframe/app/utils/VizFramePopoverHelper"
], function (BaseController, VizFramePopoverHelper) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.R2R", {
        onInit: function () {
            this.initProcTitle("process.r2r");
        },

        onAfterRendering: function () {
            VizFramePopoverHelper.connectPopovers(this, ["r2rFunnelChart", "r2rEntriesChart", "r2rDebitCreditChart"]);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
