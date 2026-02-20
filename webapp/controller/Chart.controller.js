sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/viz/ui5/controls/Popover"
], function (Controller, Popover) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.Chart", {
        onAfterRendering: function () {
            var aChartIds = [
                "chartBar", "chartDonut", "chartGroupedBar", "chartLine",
                "chartHBar", "chartStacked", "chartPie", "chartFunnel",
                "chartCombi", "chartSegments"
            ];
            var that = this;
            aChartIds.forEach(function (sId) {
                var oVizFrame = that.byId(sId);
                if (oVizFrame) {
                    var oPopover = new Popover({});
                    oPopover.connect(oVizFrame.getVizUid());
                }
            });
        }
    });
});
