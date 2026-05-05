sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "ui5/vizframe/app/utils/VizFramePopoverHelper"
], function (BaseController, JSONModel, VizFramePopoverHelper) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.R2R", {
        onInit: function () {
            this.getView().setModel(new JSONModel({ title: "Record to Report" }), "proc");
        },

        onAfterRendering: function () {
            VizFramePopoverHelper.connectPopovers(this, ["r2rFunnelChart", "r2rEntriesChart", "r2rDebitCreditChart"]);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
