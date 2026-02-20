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
                                new StandardListItem({ title: "O2C (Order-to-Cash)", type: "Navigation" }),
                                new StandardListItem({ title: "P2P (Procure-to-Pay)", type: "Navigation" }),
                                new StandardListItem({ title: "R2R (Record-to-Report)", type: "Navigation" }),
                                new StandardListItem({ title: "PtP (Plan-to-Produce)", type: "Navigation" })
                            ],
                            itemPress: function (oEvent) {
                                var oItem = oEvent.getParameter("listItem");
                                var oList = oEvent.getSource();
                                var iIndex = oList.indexOfItem(oItem);
                                var aRoutes = ["o2c", "p2p", "r2r", "ptp"];
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

        onSapLink: function () {
            window.open("https://www.sap.com", "_blank");
        }
    });
});
