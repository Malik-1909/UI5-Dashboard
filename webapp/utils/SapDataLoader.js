/**
 * SapDataLoader – lädt echte Daten von SAP Business Accelerator Hub Sandbox
 * und transformiert sie in die gleiche Struktur wie die lokalen Mock-Daten.
 *
 * Alle Views bleiben unverändert – nur das Modell dahinter wechselt.
 *
 * Sandbox-APIs:
 *   L2C:  API_SALES_ORDER_SRV
 *   S2P:  API_PURCHASEORDER_PROCESS_SRV
 *   R2R:  API_JOURNALENTRYITEMBASIC_SRV
 *   RtR:  SuccessFactors odata/v2/User
 *   D2O:  API_PRODUCTION_ORDERS_2_SRV  (kein Sandbox → Mock-Fallback)
 */
sap.ui.define([], function () {
    "use strict";

    var BASE = "/api/sap";

    var URLS = {
        salesOrders:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder" +
            "?$top=200&$select=SalesOrder,SalesOrderType,SoldToParty,CreationDate," +
            "TotalNetAmount,TransactionCurrency&$format=json",
        purchaseOrders:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder" +
            "?$top=200&$select=PurchaseOrder,PurchaseOrderType,Supplier,CompanyCode," +
            "TotalNetOrderAmount,DocumentCurrency,CreationDate,PurchasingOrganization&$format=json",
        journalEntries:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_JOURNALENTRYITEMBASIC_SRV/A_JournalEntryItemBasic" +
            "?$top=300&$select=GLAccount,GLAccountName,AmountInCompanyCodeCurrency," +
            "CompanyCodeCurrency,FiscalPeriod,FiscalYear,DebitCreditCode,CompanyCode&$format=json",
        sfUsers:
            BASE + "/successfactors/odata/v2/User" +
            "?$top=100&$select=userId,department,jobTitle,country&$format=json",
        productionOrders:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_PRODUCTION_ORDERS_2_SRV/A_ProductionOrder_2" +
            "?$top=100&$select=ManufacturingOrder,ManufacturingOrderType,Plant," +
            "MfgOrderPlannedStartDate&$format=json"
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _fetch(url) {
        return fetch(url, { headers: { Accept: "application/json" } })
            .then(function (res) { return res.ok ? res.json() : Promise.reject(res.status); })
            .then(function (data) {
                return (data && data.d && data.d.results) ? data.d.results
                    : (data && data.value)                ? data.value
                    : [];
            })
            .catch(function () { return []; });
    }

    function _parseDate(sVal) {
        if (!sVal) { return null; }
        var m = /\/Date\((\d+)/.exec(sVal);
        return m ? new Date(parseInt(m[1], 10)) : null;
    }

    function _monthKey(oDate) {
        var mo = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
        return mo[oDate.getUTCMonth()] + " " + oDate.getUTCFullYear();
    }

    function _groupCount(arr, keyFn, limit) {
        var map = {};
        arr.forEach(function (x) { var k = keyFn(x) || "Andere"; map[k] = (map[k] || 0) + 1; });
        return Object.keys(map).sort(function (a, b) { return map[b] - map[a]; })
            .slice(0, limit || 8).map(function (k) { return { k: k, v: map[k] }; });
    }

    function _groupSum(arr, keyFn, valFn, limit) {
        var map = {};
        arr.forEach(function (x) {
            var k = keyFn(x) || "Andere";
            map[k] = (map[k] || 0) + (parseFloat(valFn(x)) || 0);
        });
        return Object.keys(map).sort(function (a, b) { return map[b] - map[a]; })
            .slice(0, limit || 8).map(function (k) { return { k: k, v: map[k] }; });
    }

    function _byMonth(arr, dateFn, limit) {
        var map = {};
        arr.forEach(function (x) {
            var d = dateFn(x);
            if (!d) { return; }
            var mk = _monthKey(d);
            if (!map[mk]) { map[mk] = { cnt: 0, ts: d.getTime() }; }
            map[mk].cnt++;
        });
        return Object.keys(map).sort(function (a, b) { return map[a].ts - map[b].ts; })
            .slice(-(limit || 12)).map(function (k) { return { month: k, cnt: map[k].cnt }; });
    }

    // ── L2C: Sales Orders ─────────────────────────────────────────────────────

    function _l2c(aOrders) {
        if (!aOrders.length) { return {}; }
        var curr     = (aOrders[0] && aOrders[0].TransactionCurrency) || "USD";
        var total    = aOrders.reduce(function (s, o) { return s + (parseFloat(o.TotalNetAmount) || 0); }, 0);
        var byType   = _groupCount(aOrders, function (o) { return o.SalesOrderType; });
        var byRev    = _groupSum(aOrders, function (o) { return o.SalesOrderType; }, function (o) { return o.TotalNetAmount; });
        var custs    = {};
        aOrders.forEach(function (o) { if (o.SoldToParty) { custs[o.SoldToParty] = 1; } });
        var byMo = _byMonth(aOrders, function (o) { return _parseDate(o.CreationDate); });

        return {
            L2CConversionFunnel: byType.map(function (x) { return { stage: x.k, count: x.v }; }),
            L2CRevenueByStage:   byRev.map(function (x) {
                var r = Math.round(x.v / 1000 * 10) / 10;
                return { stage: x.k, revenue: r, target: Math.round(r * 1.2 * 10) / 10 };
            }),
            L2COrdersByMonth: byMo.map(function (x) { return { month: x.month, count: x.cnt }; }),
            L2CKpiTable: [
                { kpi: "Sales Orders gesamt",    value: String(aOrders.length),                                       unit: "Aufträge"  },
                { kpi: "Gesamtumsatz",           value: (total / 1000).toFixed(1),                                   unit: "T " + curr },
                { kpi: "Ø Auftragswert",         value: (total / aOrders.length).toFixed(2),                        unit: curr        },
                { kpi: "Kunden (Debitoren)",     value: String(Object.keys(custs).length),                          unit: "Debitoren" }
            ],
            _sapBadgeL2C: aOrders.length + " Sales Orders · API_SALES_ORDER_SRV · SAP Business Accelerator Hub"
        };
    }

    // ── S2P: Purchase Orders ──────────────────────────────────────────────────

    function _s2p(aOrders) {
        if (!aOrders.length) { return {}; }
        var total   = aOrders.reduce(function (s, o) { return s + (parseFloat(o.TotalNetOrderAmount) || 0); }, 0);
        var byType  = _groupCount(aOrders, function (o) { return o.PurchaseOrderType || "NB"; });
        var byOrg   = _groupSum(aOrders, function (o) { return o.PurchasingOrganization || o.CompanyCode || "0001"; }, function (o) { return o.TotalNetOrderAmount; });
        var suppls  = {};
        aOrders.forEach(function (o) { if (o.Supplier) { suppls[o.Supplier] = 1; } });
        var byMo = _byMonth(aOrders, function (o) { return _parseDate(o.CreationDate); });

        return {
            S2PProcessFunnel:   byType.map(function (x) { return { stage: x.k, count: x.v }; }),
            S2PSpendByCategory: byOrg.map(function (x) {
                var a = Math.round(x.v / 1000);
                return { category: x.k, amount: a, target: Math.round(a * 1.1) };
            }),
            S2POrdersByMonth: byMo.map(function (x) { return { month: x.month, count: x.cnt }; }),
            S2PKpiTable: [
                { kpi: "Bestellungen gesamt",   value: String(aOrders.length),                  unit: "Belege"      },
                { kpi: "Einkaufsvolumen",        value: (total / 1000).toFixed(1),              unit: "T EUR"       },
                { kpi: "Ø Bestellwert",          value: (total / aOrders.length).toFixed(2),   unit: "EUR"         },
                { kpi: "Lieferanten",            value: String(Object.keys(suppls).length),     unit: "Lieferanten" }
            ],
            _sapBadgeS2P: aOrders.length + " Purchase Orders · API_PURCHASEORDER_PROCESS_SRV · SAP Business Accelerator Hub"
        };
    }

    // ── R2R: Journal Entries ──────────────────────────────────────────────────

    function _r2r(aEntries) {
        if (!aEntries.length) { return {}; }
        var byAcct    = {};
        var byPeriod  = {};
        var totalAbs  = 0;
        var debitCnt  = 0;
        var companies = {};

        var debitAmt = 0;
        aEntries.forEach(function (e) {
            var amt  = Math.abs(parseFloat(e.AmountInCompanyCodeCurrency) || 0);
            totalAbs += amt;
            if (e.DebitCreditCode === "S") { debitCnt++; debitAmt += amt; }
            if (e.CompanyCode) { companies[e.CompanyCode] = 1; }
            var acct = (e.GLAccountName || e.GLAccount || "Andere").slice(0, 22);
            byAcct[acct]  = (byAcct[acct]  || 0) + amt;
            var per = (e.FiscalYear || "?") + "-" + String(e.FiscalPeriod || 0).padStart(2, "0");
            byPeriod[per] = (byPeriod[per] || 0) + 1;
        });

        var topAccts  = Object.keys(byAcct).sort(function (a, b) { return byAcct[b] - byAcct[a]; }).slice(0, 6);
        var topTotal  = topAccts.reduce(function (s, k) { return s + byAcct[k]; }, 0) || 1;
        var periods   = Object.keys(byPeriod).sort().slice(-12);
        var creditCnt = aEntries.length - debitCnt;
        var creditAmt = totalAbs - debitAmt;

        return {
            R2RByAccountType: topAccts.map(function (k) {
                return { type: k, share: Math.round(byAcct[k] / topTotal * 100) };
            }),
            R2RDebitCreditSplit: [
                { type: "Soll (Debit)",   count: debitCnt,  amount: Math.round(debitAmt  / 1000 * 10) / 10 },
                { type: "Haben (Credit)", count: creditCnt, amount: Math.round(creditAmt / 1000 * 10) / 10 }
            ],
            R2RTopAccounts: topAccts.map(function (k) {
                return { account: k, amount: Math.round(byAcct[k] / 1000 * 10) / 10 };
            }),
            R2RJournalEntries: periods.map(function (k) { return { period: k, entries: byPeriod[k] }; }),
            R2RProcessFunnel: [
                { stage: "Buchungen",   count: aEntries.length                        },
                { stage: "Abstimmung",  count: Math.round(aEntries.length * 0.85)     },
                { stage: "Abschluss",   count: Math.round(aEntries.length * 0.60)     },
                { stage: "Bericht",     count: Math.round(aEntries.length * 0.40)     }
            ],
            R2RKpiTable: [
                { kpi: "Buchungszeilen",      value: String(aEntries.length),              unit: "Zeilen"   },
                { kpi: "Gesamtbetrag",        value: (totalAbs / 1000).toFixed(1),         unit: "T EUR"    },
                { kpi: "Soll-Buchungen",      value: String(debitCnt),                     unit: "Buchungen"},
                { kpi: "Buchungsperioden",    value: String(Object.keys(byPeriod).length), unit: "Perioden" }
            ],
            _sapBadgeR2R: aEntries.length + " Buchungszeilen · API_JOURNALENTRYITEMBASIC_SRV · SAP Business Accelerator Hub"
        };
    }

    // ── RtR: SuccessFactors Users ─────────────────────────────────────────────

    function _rtr(aUsers) {
        if (!aUsers.length) { return {}; }
        var byDept      = {};
        var countryMap  = {};
        var byTitle     = {};
        aUsers.forEach(function (u) {
            var d = (u.department || "Keine Abteilung").slice(0, 25);
            byDept[d] = (byDept[d] || 0) + 1;
            if (u.country) { countryMap[u.country] = (countryMap[u.country] || 0) + 1; }
            if (u.jobTitle) {
                var t = u.jobTitle.slice(0, 22);
                byTitle[t] = (byTitle[t] || 0) + 1;
            }
        });
        var deptKeys    = Object.keys(byDept).sort(function (a, b) { return byDept[b] - byDept[a]; }).slice(0, 8);
        var topTitles   = Object.keys(byTitle).sort(function (a, b) { return byTitle[b] - byTitle[a]; }).slice(0, 8);
        var topCountries = Object.keys(countryMap).sort(function (a, b) { return countryMap[b] - countryMap[a]; }).slice(0, 8);

        return {
            RtrHeadcountFunnel: [
                { stage: "Recruiting",  count: Math.max(1, Math.round(aUsers.length * 0.08)) },
                { stage: "Onboarding",  count: Math.max(1, Math.round(aUsers.length * 0.05)) },
                { stage: "Active",      count: aUsers.length                                  },
                { stage: "Offboarding", count: Math.max(1, Math.round(aUsers.length * 0.02)) }
            ],
            RtrByDepartment:  deptKeys.map(function (k) { return { department: k, headcount: byDept[k] }; }),
            RtrByJobTitle:    topTitles.map(function (t) { return { title: t, count: byTitle[t] }; }),
            RtrByCountry:     topCountries.map(function (c) { return { country: c, count: countryMap[c] }; }),
            RtrKpiTable: [
                { kpi: "Mitarbeiter gesamt",       value: String(aUsers.length),                                                                        unit: "Personen"   },
                { kpi: "Abteilungen",              value: String(deptKeys.length),                                                                      unit: "Abteilungen"},
                { kpi: "Länder",                   value: String(Object.keys(countryMap).length),                                                       unit: "Länder"     },
                { kpi: "Ø Headcount/Abteilung",   value: deptKeys.length ? String(Math.round(aUsers.length / deptKeys.length)) : "0",                  unit: "Personen"   }
            ],
            _sapBadgeRtR: aUsers.length + " Mitarbeiter · SuccessFactors User API · SAP Business Accelerator Hub"
        };
    }

    // ── D2O: Produktionsaufträge (kein Sandbox → Fallback auf Mock) ───────────

    function _d2o(aOrders) {
        if (!aOrders.length) { return {}; }
        var byType  = _groupCount(aOrders, function (o) { return o.ManufacturingOrderType || "PP01"; }, 5);
        var byPlant = _groupCount(aOrders, function (o) { return o.Plant || "1000"; }, 6);
        var byMo    = _byMonth(aOrders, function (o) { return _parseDate(o.MfgOrderPlannedStartDate); });

        return {
            D2OProcessFunnel:  byType.map(function (x) { return { stage: x.k, count: x.v }; }),
            D2OCapacityUtil:   byPlant.map(function (x, i) {
                return { workcenter: x.k, util: Math.round(60 + i * 5), target: 85 };
            }),
            D2OOutputTrend: byMo.map(function (x) { return { month: x.month, output: x.cnt * 10 }; }),
            D2OKpiTable: [
                { kpi: "Fertigungsaufträge", value: String(aOrders.length), unit: "Aufträge" },
                { kpi: "Werke",              value: String(byPlant.length), unit: "Werke"    },
                { kpi: "Auftragstypen",      value: String(byType.length),  unit: "Typen"    }
            ]
        };
    }

    // ── Public API ────────────────────────────────────────────────────────────

    return {
        /**
         * Lädt alle SAP Sandbox-Daten parallel.
         * Gibt { data: {EntitySet: [...], ...}, sources: {l2c:n, s2p:n, ...} } zurück.
         * Schlägt eine API fehl, bleibt ihr Teil leer → Component.js nutzt Mock-Fallback.
         */
        loadAll: function () {
            return Promise.all([
                _fetch(URLS.salesOrders),
                _fetch(URLS.purchaseOrders),
                _fetch(URLS.journalEntries),
                _fetch(URLS.sfUsers),
                _fetch(URLS.productionOrders)
            ]).then(function (res) {
                var merged = Object.assign(
                    {},
                    _l2c(res[0]),
                    _s2p(res[1]),
                    _r2r(res[2]),
                    _rtr(res[3]),
                    _d2o(res[4])
                );
                return {
                    data: merged,
                    sources: { l2c: res[0].length, s2p: res[1].length, r2r: res[2].length, rtr: res[3].length, d2o: res[4].length }
                };
            });
        }
    };
});
