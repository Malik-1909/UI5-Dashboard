sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/viz/ui5/controls/Popover"
], function (BaseController, VizPopover) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.RtR", {
        onAfterRendering: function () {
            var aChartIds = ["rtrFunnelChart", "rtrDepartmentChart", "rtrAttritionChart"];
            aChartIds.forEach(function (sId) {
                var oVizFrame = this.byId(sId);
                if (oVizFrame) {
                    var oPopover = new VizPopover({});
                    oPopover.connect(oVizFrame.getVizUid());
                }
            }.bind(this));
        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
