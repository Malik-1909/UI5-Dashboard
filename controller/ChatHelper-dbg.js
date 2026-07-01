sap.ui.define([], function () {
    "use strict";

    /**
     * Öffnet den KI-Chat (App-Controller) – von Unterseiten aus aufrufbar.
     */
    function openFrom(oController) {
        if (!oController || !oController.getOwnerComponent) { return; }
        var oComp = oController.getOwnerComponent();
        var oRoot = oComp.getRootControl();
        if (!oRoot) { return; }
        var oAppCtrl = oRoot.getController();
        if (oAppCtrl && typeof oAppCtrl.openChatFromNavigation === "function") {
            oAppCtrl.openChatFromNavigation();
        }
    }

    return { openFrom: openFrom };
});
