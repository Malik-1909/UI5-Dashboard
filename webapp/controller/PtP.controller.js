sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/controls/Popover"
], function (Controller, VizPopover) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.PtP", {
        onAfterRendering: function () {
            var aChartIds = ["ptpFunnelChart", "ptpCapacityChart", "ptpOutputChart"];
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
