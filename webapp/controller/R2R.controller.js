sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/viz/ui5/controls/Popover"
], function (BaseController, VizPopover) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.R2R", {
        onAfterRendering: function () {
            var aChartIds = ["r2rFunnelChart", "r2rEntriesChart", "r2rCloseChart"];
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
