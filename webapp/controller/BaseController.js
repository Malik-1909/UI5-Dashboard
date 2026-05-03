sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "ui5/vizframe/app/utils/BurgerMenuHelper",
    "ui5/vizframe/app/controller/ChatHelper"
], function (Controller, BurgerMenuHelper, ChatHelper) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.BaseController", {

        onOpenChatbot: function () {
            ChatHelper.openFrom(this);
        },

        onBurgerPress: function (oEvent) {
            var oButton = oEvent.getSource();
            var sCtrlName = this.getMetadata().getName();
            var bIsMain   = sCtrlName === "ui5.vizframe.app.controller.Main";
            if (!this._oBurgerPopover) {
                this._oBurgerPopover = BurgerMenuHelper.createBurgerPopover(this, !bIsMain);
                this.getView().addDependent(this._oBurgerPopover);
            }
            this._oBurgerPopover.openBy(oButton);
        }
    });
});
