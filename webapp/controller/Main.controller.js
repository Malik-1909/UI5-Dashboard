sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem"
], function (BaseController, Popover, List, StandardListItem) {
    "use strict";

    return BaseController.extend("ui5.vizframe.app.controller.Main", {

        onProzessePress: function (oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oProzessePopover) {
                var that = this;
                this._oProzessePopover = new Popover({
                    title:               "Prozesse",
                    placement:           "Bottom",
                    contentMinWidth:     "200px",
                    horizontalScrolling: false,
                    verticalScrolling:   true,
                    content: [
                        new List({
                            items: [
                                new StandardListItem({ title: "Record to Report", type: "Navigation" }),
                                new StandardListItem({ title: "Recruit to Retire", type: "Navigation" }),
                                new StandardListItem({ title: "Source to Pay", type: "Navigation" }),
                                new StandardListItem({ title: "Design to Operate", type: "Navigation" }),
                                new StandardListItem({ title: "Lead to Cash", type: "Navigation" })
                            ],
                            itemPress: function (oEv) {
                                var oItem = oEv.getParameter("listItem");
                                var oList = oEv.getSource();
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
