sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem"
], function (Controller, Popover, List, StandardListItem) {
    "use strict";

    return Controller.extend("ui5.vizframe.app.controller.Main", {
        onProzessePress: function (oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oProzessePopover) {
                var that = this;
                this._oProzessePopover = new Popover({
                    title: "Prozesse",
                    placement: "Bottom",
                    contentMinWidth: "200px",
                    content: [
                        new List({
                            items: [
                                new StandardListItem({ title: "Record to Report", type: "Navigation" }),
                                new StandardListItem({ title: "Recruit to Retire", type: "Navigation" }),
                                new StandardListItem({ title: "Source to Pay", type: "Navigation" }),
                                new StandardListItem({ title: "Design to Operate", type: "Navigation" }),
                                new StandardListItem({ title: "Lead to Cash", type: "Navigation" })
                            ],
                            itemPress: function (oEvent) {
                                var oItem = oEvent.getParameter("listItem");
                                var oList = oEvent.getSource();
                                var iIndex = oList.indexOfItem(oItem);
                                var aRoutes = ["r2r", "rtr", "s2p", "d2o", "l2c"];
                                if (that._oProzessePopover) { that._oProzessePopover.close(); }
                                if (iIndex >= 0 && iIndex < aRoutes.length) {
                                    that.getOwnerComponent().getRouter().navTo(aRoutes[iIndex]);
                                }
                            }
                        })
                    ]
                });
                this.getView().addDependent(this._oProzessePopover);
            }
            this._oProzessePopover.openBy(oButton);
        },
        onNavToProject: function () {
            this.getOwnerComponent().getRouter().navTo("project");
        },

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
                                new StandardListItem({ title: "Record to Report", type: "Navigation" }),
                                new StandardListItem({ title: "Recruit to Retire", type: "Navigation" }),
                                new StandardListItem({ title: "Source to Pay", type: "Navigation" }),
                                new StandardListItem({ title: "Design to Operate", type: "Navigation" }),
                                new StandardListItem({ title: "Lead to Cash", type: "Navigation" }),
                                new StandardListItem({ title: "Über dieses Projekt", type: "Navigation" })
                            ],
                            itemPress: function (oEvent) {
                                var oItem = oEvent.getParameter("listItem");
                                var sTitle = oItem.getTitle();
                                var mRouteMap = {
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
                        })
                    ]
                });
                this.getView().addDependent(this._oBurgerPopover);
            }
            this._oBurgerPopover.openBy(oButton);
        },

        onTilePress: function (oEvent) {
            var oTile = oEvent.getSource();
            var sId = oTile.getId();
            var mRouteMap = { "tileR2R": "r2r", "tileRtR": "rtr", "tileS2P": "s2p", "tileD2O": "d2o", "tileL2C": "l2c" };
            for (var key in mRouteMap) {
                if (sId.indexOf(key) >= 0) {
                    this.getOwnerComponent().getRouter().navTo(mRouteMap[key]);
                    return;
                }
            }
        }
    });
});
