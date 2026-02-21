sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem"
], function (Controller, Popover, List, StandardListItem) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.BaseController", {
        onBurgerPress: function (oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oBurgerPopover) {
                var that = this;
                this._oBurgerPopover = new Popover({
                    title: "Menü",
                    placement: "Bottom",
                    contentMinWidth: "220px",
                    content: [
                        new List({
                            items: [
                                new StandardListItem({ title: "Startseite", type: "Navigation" }),
                                new StandardListItem({ title: "O2C (Order-to-Cash)", type: "Navigation" }),
                                new StandardListItem({ title: "P2P (Procure-to-Pay)", type: "Navigation" }),
                                new StandardListItem({ title: "R2R (Record-to-Report)", type: "Navigation" }),
                                new StandardListItem({ title: "PtP (Plan-to-Produce)", type: "Navigation" }),
                                new StandardListItem({ title: "Über dieses Projekt", type: "Navigation" })
                            ],
                            itemPress: function (oEvent) {
                                var oItem = oEvent.getParameter("listItem");
                                var sTitle = oItem.getTitle();
                                var mRouteMap = {
                                    "Startseite": "main",
                                    "O2C (Order-to-Cash)": "o2c",
                                    "P2P (Procure-to-Pay)": "p2p",
                                    "R2R (Record-to-Report)": "r2r",
                                    "PtP (Plan-to-Produce)": "ptp",
                                    "Über dieses Projekt": "project"
                                };
                                if (that._oBurgerPopover) { that._oBurgerPopover.close(); }
                                var sRoute = mRouteMap[sTitle];
                                if (sRoute) {
                                    that.getOwnerComponent().getRouter().navTo(sRoute);
                                }
                            }
                        })
                    ]
                });
                this.getView().addDependent(this._oBurgerPopover);
            }
            this._oBurgerPopover.openBy(oButton);
        }
    });
});
