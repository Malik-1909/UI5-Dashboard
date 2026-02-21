sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/viz/ui5/controls/Popover"
], function (BaseController, VizPopover) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.O2C", {
        onAfterRendering: function () {
            var aChartIds = ["o2cFunnelChart", "o2cRevenueChart", "o2cDSOChart"];
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
