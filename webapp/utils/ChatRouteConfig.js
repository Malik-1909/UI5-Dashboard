sap.ui.define([], function () {
    "use strict";

    var mContextKeys = {
        "":      ["RtrHeadcountFunnel", "R2RByAccountType", "S2POrdersByMonth", "D2OOutputTrend", "L2CConversionFunnel"],
        main:    ["RtrHeadcountFunnel", "R2RByAccountType", "S2POrdersByMonth", "D2OOutputTrend", "L2CConversionFunnel"],
        r2r:     ["R2RKpiTable", "R2RByAccountType", "R2RProcessFunnel", "R2RCloseCycle", "R2RJournalEntries"],
        rtr:     ["RtrKpiTable", "RtrHeadcountFunnel", "RtrByDepartment", "RtrAttritionTrend"],
        s2p:     ["S2PKpiTable", "S2POrdersByMonth", "S2PProcessFunnel", "S2PSpendByCategory", "S2PInvoiceCycle"],
        d2o:     ["D2OKpiTable", "D2OOutputTrend", "D2OProcessFunnel", "D2OCapacityUtil"],
        l2c:     ["L2CKpiTable", "L2CConversionFunnel", "L2CRevenueByStage", "L2CDSO", "L2COrdersByMonth"],
        project: []
    };

    var mRouteI18nKeys = {
        "":      "nav.startseite",
        main:    "nav.startseite",
        r2r:     "process.r2r",
        rtr:     "process.rtr",
        s2p:     "process.s2p",
        d2o:     "process.d2o",
        l2c:     "process.l2c",
        project: "process.project"
    };

    function normalizeRoute(sRoute) {
        return ((sRoute || "main").split("/")[0] || "main").trim() || "main";
    }

    function getContextModelKeys(sRoute) {
        var sNormalizedRoute = normalizeRoute(sRoute);
        return mContextKeys[sNormalizedRoute] || mContextKeys.main;
    }

    function getRouteLabel(sRoute, oBundle) {
        var sNormalizedRoute = normalizeRoute(sRoute);
        var sKey = mRouteI18nKeys[sNormalizedRoute];
        if (sKey && oBundle && oBundle.getText) {
            return oBundle.getText(sKey);
        }
        return sNormalizedRoute;
    }

    return {
        normalizeRoute: normalizeRoute,
        getContextModelKeys: getContextModelKeys,
        getRouteLabel: getRouteLabel
    };
});
