sap.ui.define([
    "sap/viz/ui5/controls/Popover"
], function (VizPopover) {
    "use strict";

    function connectPopovers(oController, aChartIds) {
        if (!oController || !Array.isArray(aChartIds)) {
            return;
        }
        aChartIds.forEach(function (sId) {
            var oVizFrame = oController.byId(sId);
            if (oVizFrame) {
                var oPopover = new VizPopover({});
                oPopover.connect(oVizFrame.getVizUid());
            }
        });
    }

    return {
        connectPopovers: connectPopovers
    };
});
