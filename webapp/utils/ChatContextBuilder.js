sap.ui.define([
    "ui5/vizframe/app/utils/ChatRouteConfig"
], function (ChatRouteConfig) {
    "use strict";

    function buildContext(oComponent, sHashOrRoute) {
        try {
            var sSource = sHashOrRoute || (window.location.hash || "");
            var sRaw = sSource.replace(/^#/, "").replace(/^\//, "") || "main";
            var sRoute = ChatRouteConfig.normalizeRoute(sRaw);
            var oBundle = oComponent && oComponent.getModel("i18n") && oComponent.getModel("i18n").getResourceBundle();
            var sPage = ChatRouteConfig.getRouteLabel(sRoute, oBundle);
            var aParts = ["Aktuell angezeigte Seite: " + sPage];

            var oSales = oComponent && oComponent.getModel("sales");
            if (oSales && typeof oSales.getData === "function") {
                var oData = oSales.getData();
                if (oData && typeof oData === "object") {
                    var aKeys = ChatRouteConfig.getContextModelKeys(sRoute);
                    var oSlice = {};
                    var i;
                    for (i = 0; i < aKeys.length; i++) {
                        var sKey = aKeys[i];
                        if (oData[sKey] != null) {
                            oSlice[sKey] = oData[sKey];
                        }
                    }
                    if (Object.keys(oSlice).length) {
                        var sJson = JSON.stringify(oSlice);
                        var nMaxLength = 14000;
                        if (sJson.length > nMaxLength) {
                            sJson = sJson.slice(0, nMaxLength) + "…(gekürzt)";
                        }
                        aParts.push("");
                        aParts.push("KPI-Daten aus der App (Mock oder Live, wie im Diagramm – für Zahlenfragen diese Werte verwenden):");
                        aParts.push(sJson);
                    }
                }
            }

            return aParts.join("\n");
        } catch (e) {
            return "";
        }
    }

    return {
        buildContext: buildContext
    };
});
