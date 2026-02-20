sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/controls/Popover"
], function (Controller, VizPopover) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.O2C", {
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
        },
        onSapLink: function () {
            window.open("https://www.sap.com", "_blank");
        }
    });
});
