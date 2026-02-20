sap.ui.define([
    "ui5/vizframe/app/controller/BaseController"
], function (BaseController) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.Project", {
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("main");
        }
    });
});
