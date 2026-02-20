sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.Project", {
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        },

        onSapLink: function () {
            window.open("https://www.sap.com", "_blank");
        }
    });
});
