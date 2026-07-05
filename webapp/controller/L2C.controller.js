sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "ui5/vizframe/app/utils/VizFramePopoverHelper"
], function (BaseController, VizFramePopoverHelper) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.L2C", {
        onInit: function () {
            this.initProcTitle("process.l2c");
        },

        onAfterRendering: function () {
            VizFramePopoverHelper.connectPopovers(this, ["l2cFunnelChart", "l2cRevenueChart", "l2cOrdersTrendChart"]);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
