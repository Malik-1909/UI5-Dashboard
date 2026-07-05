sap.ui.define([
    "ui5/vizframe/app/controller/BaseController",
    "sap/m/Popover",
    "sap/m/List",
    "sap/m/StandardListItem",
    "sap/ui/core/CustomData"
], function (BaseController, Popover, List, StandardListItem, CustomData) {
    "use strict";

    var aProcessRoutes = ["r2r", "rtr", "s2p", "d2o", "l2c"];
    var aProcessI18nKeys = [
        "process.r2r",
        "process.rtr",
        "process.s2p",
        "process.d2o",
        "process.l2c"
    ];

    return BaseController.extend("ui5.vizframe.app.controller.Main", {

        onProzessePress: function (oEvent) {
            var oButton = oEvent.getSource();
            if (!this._oProzessePopover) {
                var that = this;
                var oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var aItems = aProcessI18nKeys.map(function (sKey, iIndex) {
                    return new StandardListItem({
                        title: oBundle.getText(sKey),
                        type: "Navigation",
                        customData: [new CustomData({ key: "navRoute", value: aProcessRoutes[iIndex] })]
                    });
                });
                this._oProzessePopover = new Popover({
                    title:               oBundle.getText("nav.processes"),
                    placement:           "Bottom",
                    contentMinWidth:     "200px",
                    horizontalScrolling: false,
                    verticalScrolling:   true,
                    content: [
                        new List({
                            items: aItems,
                            itemPress: function (oEv) {
                                var oItem = oEv.getParameter("listItem");
                                var sRoute = null;
                                oItem.getCustomData().forEach(function (oData) {
                                    if (oData.getKey() === "navRoute") {
                                        sRoute = oData.getValue();
                                    }
                                });
                                if (that._oProzessePopover) { that._oProzessePopover.close(); }
                                if (sRoute) {
                                    that.getOwnerComponent().getRouter().navTo(sRoute);
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

        onBtpHealthStripClose: function () {
            var oModel = this.getView().getModel("btpHealth");
            if (oModel) {
                oModel.setProperty("/visible", false);
            }
        },

        onBtpHealthLinkPress: function () {
            var oModel = this.getView().getModel("btpHealth");
            var sUrl = (oModel && oModel.getProperty("/liveUrl")) ||
                "https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/";
            window.open(sUrl, "_blank", "noopener,noreferrer");
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
