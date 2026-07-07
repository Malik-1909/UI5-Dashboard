sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "ui5/vizframe/app/utils/BurgerMenuHelper",
    "ui5/vizframe/app/controller/ChatHelper"
], function (Controller, JSONModel, BurgerMenuHelper, ChatHelper) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.BaseController", {

        getI18nText: function (sKey, aArgs) {
            var oModel = this.getOwnerComponent() && this.getOwnerComponent().getModel("i18n");
            var oBundle = oModel && oModel.getResourceBundle();
            return oBundle ? oBundle.getText(sKey, aArgs) : sKey;
        },

        initProcTitle: function (sI18nKey) {
            this.getView().setModel(new JSONModel({ title: this.getI18nText(sI18nKey) }), "proc");
        },

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
            if (this._oBurgerPopover.isOpen()) {
                this._oBurgerPopover.close();
            } else {
                this._oBurgerPopover.openBy(oButton);
            }
        }
    });
});
