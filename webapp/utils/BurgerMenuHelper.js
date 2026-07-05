/**
 * Einheitliches Burger-Menü (Popover + Navigation) für Main und Unterseiten.
 */
sap.ui.define([
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/ui/core/CustomData",
    "ui5/vizframe/app/controller/ChatHelper"
], function (Popover, List, StandardListItem, CustomData, ChatHelper) {
    "use strict";

    var aMenuDefs = [
        { route: "main",    i18nKey: "nav.startseite" },
        { route: "__chat__", i18nKey: "chat.assistant", icon: "sap-icon://message-popup" },
        { route: "r2r",     i18nKey: "process.r2r" },
        { route: "rtr",     i18nKey: "process.rtr" },
        { route: "s2p",     i18nKey: "process.s2p" },
        { route: "d2o",     i18nKey: "process.d2o" },
        { route: "l2c",     i18nKey: "process.l2c" },
        { route: "project", i18nKey: "process.project" }
    ];

    /**
     * @param {sap.ui.core.mvc.Controller} oController Controller mit getView() und getOwnerComponent()
     * @param {boolean} bIncludeStartseite true = erster Eintrag „Startseite“ (Unterseiten), false = Main
     * @returns {sap.m.Popover}
     */
    function createBurgerPopover(oController, bIncludeStartseite) {
        var that = oController;
        var oBundle = oController.getOwnerComponent().getModel("i18n").getResourceBundle();
        var aItems = [];

        aMenuDefs.forEach(function (oDef) {
            if (oDef.route === "main" && !bIncludeStartseite) {
                return;
            }
            var mItem = {
                title: oBundle.getText(oDef.i18nKey),
                type: "Navigation",
                customData: [new CustomData({ key: "navRoute", value: oDef.route })]
            };
            if (oDef.icon) {
                mItem.icon = oDef.icon;
            }
            aItems.push(new StandardListItem(mItem));
        });

        var oList = new List({
            items: aItems,
            itemPress: function (oEv) {
                var oItem = oEv.getParameter("listItem");
                var sRoute = null;
                oItem.getCustomData().forEach(function (oData) {
                    if (oData.getKey() === "navRoute") {
                        sRoute = oData.getValue();
                    }
                });
                if (that._oBurgerPopover) { that._oBurgerPopover.close(); }
                if (sRoute === "__chat__") {
                    ChatHelper.openFrom(that);
                    return;
                }
                if (sRoute) {
                    that.getOwnerComponent().getRouter().navTo(sRoute);
                }
            }
        });

        return new Popover({
            title:               oBundle.getText("nav.menu"),
            placement:           "Bottom",
            contentMinWidth:     "220px",
            horizontalScrolling: false,
            verticalScrolling:   true,
            content:             [oList]
        });
    }

    return { createBurgerPopover: createBurgerPopover };
});
