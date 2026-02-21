sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.App", {
        onPress: function () {
            MessageToast.show("Hallo UI5!");
            this.byId("helloButton").setText("Geklickt!");
        },

        onSapLink: function () {
            window.open("https://www.sap.com", "_blank");
        }
    });
});
