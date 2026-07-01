/**
 * Einheitliches Burger-Menü (Popover + Navigation) für Main und Unterseiten.
 */
sap.ui.define([
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem",
    "ui5/vizframe/app/controller/ChatHelper"
], function (Popover, List, StandardListItem, ChatHelper) {
    "use strict";

    /**
     * @param {sap.ui.core.mvc.Controller} oController Controller mit getView() und getOwnerComponent()
     * @param {boolean} bIncludeStartseite true = erster Eintrag „Startseite“ (Unterseiten), false = Main
     * @returns {sap.m.Popover}
     */
    function createBurgerPopover(oController, bIncludeStartseite) {
        var that = oController;
        var aItems = [];
        if (bIncludeStartseite) {
            aItems.push(new StandardListItem({ title: "Startseite", type: "Navigation" }));
        }
        aItems.push(
            new StandardListItem({ title: "KI Assistent", icon: "sap-icon://message-popup", type: "Navigation" }),
            new StandardListItem({ title: "Record to Report", type: "Navigation" }),
            new StandardListItem({ title: "Recruit to Retire", type: "Navigation" }),
            new StandardListItem({ title: "Source to Pay", type: "Navigation" }),
            new StandardListItem({ title: "Design to Operate", type: "Navigation" }),
            new StandardListItem({ title: "Lead to Cash", type: "Navigation" }),
            new StandardListItem({ title: "Über dieses Projekt", type: "Navigation" })
        );

        var oList = new List({
            items: aItems,
            itemPress: function (oEv) {
                var oItem = oEv.getParameter("listItem");
                var sTitle = oItem.getTitle();
                if (sTitle === "KI Assistent") {
                    if (that._oBurgerPopover) { that._oBurgerPopover.close(); }
                    ChatHelper.openFrom(that);
                    return;
                }
                var mRouteMap = {
                    "Startseite": "main",
                    "Record to Report": "r2r",
                    "Recruit to Retire": "rtr",
                    "Source to Pay": "s2p",
                    "Design to Operate": "d2o",
                    "Lead to Cash": "l2c",
                    "Über dieses Projekt": "project"
                };
                if (that._oBurgerPopover) { that._oBurgerPopover.close(); }
                var sRoute = mRouteMap[sTitle];
                if (sRoute) {
                    that.getOwnerComponent().getRouter().navTo(sRoute);
                }
            }
        });

        return new Popover({
            title:               "Menü",
            placement:           "Bottom",
            contentMinWidth:     "220px",
            horizontalScrolling: false,
            verticalScrolling:   true,
            content:             [oList]
        });
    }

    return { createBurgerPopover: createBurgerPopover };
});
