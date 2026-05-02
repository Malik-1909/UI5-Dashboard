sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/viz/ui5/controls/Popover"
], function (BaseController, VizPopover) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.S2P", {
        onAfterRendering: function () {
            var aChartIds = ["s2pFunnelChart", "s2pSpendChart", "s2pInvoiceChart"];
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
