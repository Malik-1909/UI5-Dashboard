sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "ui5/vizframe/app/utils/VizFramePopoverHelper"
], function (BaseController, VizFramePopoverHelper) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.RtR", {
        onAfterRendering: function () {
            VizFramePopoverHelper.connectPopovers(this, ["rtrFunnelChart", "rtrDepartmentChart", "rtrJobTitleChart"]);
        },

        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
