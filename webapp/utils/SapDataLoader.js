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
 *   D2O:  API_MATERIAL_DOCUMENT_SRV + API_MATERIAL_STOCK_SRV (Sandbox; Prod.-Aufträge 403)
 */
sap.ui.define([], function () {
    "use strict";

    var BASE = "/api/sap";
    var REQUEST_TIMEOUT_MS = 10000;
    var MAX_RETRIES = 2;
    var RETRY_DELAY_MS = 600;

    var URLS = {
        salesOrders:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder" +
            "?$top=120&$select=SalesOrder,SalesOrderType,SoldToParty,CreationDate," +
            "TotalNetAmount,TransactionCurrency&$format=json",
        purchaseOrders:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder" +
            "?$top=120&$select=PurchaseOrder,PurchaseOrderType,Supplier,CompanyCode," +
            "DocumentCurrency,CreationDate,PurchasingOrganization&$format=json",
        journalEntries:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_JOURNALENTRYITEMBASIC_SRV/A_JournalEntryItemBasic" +
            "?$top=180&$filter=CompanyCode%20eq%20'1010'" +
            "&$select=GLAccount,GLAccountName,AmountInCompanyCodeCurrency," +
            "CompanyCodeCurrency,FiscalPeriod,LedgerFiscalYear,ControllingDebitCreditCode,CompanyCode&$format=json",
        sfUsers:
            BASE + "/successfactors/odata/v2/User" +
            "?$top=120&$select=userId,department,jobTitle,country&$format=json",
        materialDocuments:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader" +
            "?$top=120&$select=MaterialDocument,PostingDate,CreationDate," +
            "GoodsMovementCode,InventoryTransactionType&$format=json",
        materialStock:
            BASE + "/s4hanacloud/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod" +
            "?$top=120&$filter=Material%20ne%20''" +
            "&$select=Material,Plant,MatlWrhsStkQtyInMatlBaseUnit,MaterialBaseUnit&$format=json"
    };

    // ── Helpers ───────────────────────────────────────────────────────────────

    function _sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function _extractResults(data) {
        return (data && data.d && data.d.results) ? data.d.results
            : (data && data.value)                ? data.value
            : [];
    }

    function _fetchWithTimeout(url, timeoutMs) {
        if (typeof AbortController === "undefined") {
            return fetch(url, { headers: { Accept: "application/json" } });
        }
        var controller = new AbortController();
        var timer = setTimeout(function () { controller.abort(); }, timeoutMs);
        return fetch(url, {
            headers: { Accept: "application/json" },
            signal: controller.signal
        }).finally(function () {
            clearTimeout(timer);
        });
    }

    function _fetch(url) {
        var attempt = 0;

        function run() {
            attempt++;
            return _fetchWithTimeout(url, REQUEST_TIMEOUT_MS)
                .then(function (res) {
                    if (!res.ok) {
                        return res.text().then(function (txt) {
                            throw { kind: "http", status: res.status, body: txt || "" };
                        });
                    }
                    return res.json().then(function (data) {
                        return { rows: _extractResults(data), error: "", attempts: attempt };
                    });
                })
                .catch(function (err) {
                    var retryable = !err || err.name === "AbortError" ||
                        (err.kind === "http" && err.status >= 500 && err.status !== 502 && err.status !== 503) ||
                        (err.kind === "http" && err.status === 429);
                    if (retryable && attempt <= MAX_RETRIES) {
                        return _sleep(RETRY_DELAY_MS * attempt).then(run);
                    }
                    var code = (err && err.kind === "http") ? ("HTTP " + err.status)
                        : (err && err.name === "AbortError") ? "Timeout"
                        : "Network";
                    return { rows: [], error: code, attempts: attempt };
                });
        }

        return run();
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
        var byType  = _groupCount(aOrders, function (o) { return o.PurchaseOrderType || "NB"; });
        // Header enthält im Sandbox keine Beträge → Beleganzahl je Einkaufsorganisation
        var byOrg   = _groupCount(aOrders, function (o) { return o.PurchasingOrganization || o.CompanyCode || "—"; });
        var suppls  = {};
        aOrders.forEach(function (o) { if (o.Supplier) { suppls[o.Supplier] = 1; } });
        var byMo = _byMonth(aOrders, function (o) { return _parseDate(o.CreationDate); });
        var nOrg  = byOrg.length;
        var avgPo = nOrg ? (aOrders.length / nOrg).toFixed(1) : "0";

        return {
            S2PProcessFunnel:   byType.map(function (x) { return { stage: x.k, count: x.v }; }),
            S2PSpendByCategory: byOrg.map(function (x) {
                return { category: x.k, amount: x.v, target: Math.max(1, Math.round(x.v * 1.1)) };
            }),
            S2POrdersByMonth: byMo.map(function (x) { return { month: x.month, count: x.cnt }; }),
            S2PKpiTable: [
                { kpi: "Bestellungen gesamt",        value: String(aOrders.length),              unit: "Belege"           },
                { kpi: "Einkaufsorganisationen",     value: String(nOrg),                        unit: "Org."             },
                { kpi: "Ø Belege je Organisation",   value: avgPo,                               unit: "Belege/Org."      },
                { kpi: "Lieferanten",                value: String(Object.keys(suppls).length), unit: "Lieferanten"      }
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
            var rawAmt = parseFloat(e.AmountInCompanyCodeCurrency) || 0;
            var amt    = Math.abs(rawAmt);
            totalAbs += amt;
            // ControllingDebitCreditCode ist im Sandbox oft leer → Vorzeichen als Fallback
            var isDebit = rawAmt < 0 || e.ControllingDebitCreditCode === "S";
            if (isDebit) { debitCnt++; debitAmt += amt; }
            if (e.CompanyCode) { companies[e.CompanyCode] = 1; }
            var acct = (e.GLAccountName || e.GLAccount || "Andere").slice(0, 22);
            byAcct[acct]  = (byAcct[acct]  || 0) + amt;
            var per = (e.LedgerFiscalYear || "?") + "-" + String(e.FiscalPeriod || 0).padStart(2, "0");
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
                { type: "Soll (Debit)",   count: debitCnt,  amount: Math.round(debitAmt  / 1e6 * 10) / 10 },
                { type: "Haben (Credit)", count: creditCnt, amount: Math.round(creditAmt / 1e6 * 10) / 10 }
            ],
            R2RTopAccounts: topAccts.map(function (k) {
                return { account: k, amount: Math.round(byAcct[k] / 1e6 * 10) / 10 };
            }),
            R2RJournalEntries: periods.map(function (k) { return { period: k, entries: byPeriod[k] }; }),
            R2RProcessFunnel: [
                { stage: "Buchungen",   count: aEntries.length                        },
                { stage: "Abstimmung",  count: Math.round(aEntries.length * 0.85)     },
                { stage: "Abschluss",   count: Math.round(aEntries.length * 0.60)     },
                { stage: "Bericht",     count: Math.round(aEntries.length * 0.40)     }
            ],
            R2RKpiTable: [
                { kpi: "Buchungszeilen",      value: String(aEntries.length),              unit: "Zeilen"    },
                { kpi: "Gesamtbetrag",        value: (totalAbs / 1e6).toFixed(0),          unit: "Mio. EUR"  },
                { kpi: "Soll-Buchungen",      value: String(debitCnt),                     unit: "Buchungen" },
                { kpi: "Buchungsperioden",    value: String(Object.keys(byPeriod).length), unit: "Perioden"  }
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
            var d = u.department;
            if (d && d !== "N/A" && d !== "n/a") {
                d = d.slice(0, 25);
                byDept[d] = (byDept[d] || 0) + 1;
            }
            if (u.country) { countryMap[u.country] = (countryMap[u.country] || 0) + 1; }
            if (u.jobTitle) {
                var t = u.jobTitle.slice(0, 22);
                byTitle[t] = (byTitle[t] || 0) + 1;
            }
        });
        var deptKeys     = Object.keys(byDept).sort(function (a, b) { return byDept[b] - byDept[a]; }).slice(0, 8);
        var topTitles    = Object.keys(byTitle).sort(function (a, b) { return byTitle[b] - byTitle[a]; }).slice(0, 8);
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

    // ── D2O: Warenbewegungen + Lager (Prod.-Aufträge in Sandbox oft 403) ─────

    function _d2o(aDocs, aStock) {
        if (!aDocs.length && !aStock.length) { return {}; }

        var byMove = _groupCount(aDocs, function (d) {
            var g = d.InventoryTransactionType || d.GoodsMovementCode;
            return g ? String(g) : "Sonstige";
        }, 8);
        var funnel = byMove.map(function (x) { return { stage: x.k, count: x.v }; });
        if (!funnel.length && aStock.length) {
            funnel = [{ stage: "Lagerbestand (Zeilen)", count: aStock.length }];
        }
        var byMo = _byMonth(aDocs, function (d) { return _parseDate(d.PostingDate) || _parseDate(d.CreationDate); });

        var plantQty = {};
        aStock.forEach(function (s) {
            var pl = s.Plant || "—";
            plantQty[pl] = (plantQty[pl] || 0) + (parseFloat(s.MatlWrhsStkQtyInMatlBaseUnit) || 0);
        });
        var plantKeys = Object.keys(plantQty).sort(function (a, b) { return plantQty[b] - plantQty[a]; }).slice(0, 8);
        var maxQ      = plantKeys.reduce(function (m, k) { return Math.max(m, plantQty[k]); }, 1) || 1;

        var mats = {};
        aStock.forEach(function (s) { if (s.Material) { mats[s.Material] = 1; } });

        var nDoc = aDocs.length;
        var badgeParts = [];
        if (nDoc) { badgeParts.push(nDoc + " Warenbewegungen"); }
        if (aStock.length) { badgeParts.push(aStock.length + " Lagerzeilen"); }
        var sBadge = badgeParts.join(" · ") + " · API_MATERIAL_DOCUMENT_SRV / API_MATERIAL_STOCK_SRV · SAP Business Accelerator Hub";

        return {
            D2OProcessFunnel: funnel,
            D2OCapacityUtil:  plantKeys.map(function (k) {
                var u = Math.min(98, Math.round(plantQty[k] / maxQ * 100));
                return { workcenter: "Werk " + k, util: u, target: 85 };
            }),
            D2OOutputTrend:   byMo.map(function (x) { return { month: x.month, output: x.cnt }; }),
            D2OKpiTable: [
                { kpi: "Warenbewegungsbelege", value: String(nDoc),                        unit: "Belege"     },
                { kpi: "Werke (mit Bestand)",  value: String(plantKeys.length),             unit: "Werke"      },
                { kpi: "Materialien (Lager)",  value: String(Object.keys(mats).length),     unit: "Materialien"},
                { kpi: "Lagerzeilen",          value: String(aStock.length),                unit: "Zeilen"     }
            ],
            _sapBadgeD2O: sBadge
        };
    }

    // ── Public API ────────────────────────────────────────────────────────────

    return {
        /**
         * Lädt SAP Sandbox-Daten gestaffelt mit Retry/Timeout.
         * Gibt { data: {EntitySet: [...], ...}, sources: {l2c:n, s2p:n, ...}, failures: {...} } zurück.
         * Schlägt eine API fehl, bleibt ihr Teil leer → Component.js nutzt Mock-Fallback.
         */
        loadAll: function () {
            var endpoints = [
                { key: "l2c", url: URLS.salesOrders },
                { key: "s2p", url: URLS.purchaseOrders },
                { key: "r2r", url: URLS.journalEntries },
                { key: "rtr", url: URLS.sfUsers },
                { key: "d2oDocs", url: URLS.materialDocuments },
                { key: "d2oStock", url: URLS.materialStock }
            ];

            return Promise.all(endpoints.map(function (endpoint) {
                return _fetch(endpoint.url).then(function (result) {
                    return { key: endpoint.key, result: result };
                });
            })).then(function (aResponses) {
                var state = { results: {}, failures: {} };
                aResponses.forEach(function (entry) {
                    state.results[entry.key] = entry.result.rows;
                    if (entry.result.error) {
                        state.failures[entry.key] = entry.result.error + " (Versuche: " + entry.result.attempts + ")";
                    }
                });
                return state;
            }).then(function (state) {
                var res = state.results;
                var merged = Object.assign(
                    {},
                    _l2c(res.l2c || []),
                    _s2p(res.s2p || []),
                    _r2r(res.r2r || []),
                    _rtr(res.rtr || []),
                    _d2o(res.d2oDocs || [], res.d2oStock || [])
                );
                return {
                    data: merged,
                    sources: {
                        l2c: (res.l2c || []).length,
                        s2p: (res.s2p || []).length,
                        r2r: (res.r2r || []).length,
                        rtr: (res.rtr || []).length,
                        d2o: (res.d2oDocs || []).length + (res.d2oStock || []).length
                    },
                    failures: state.failures
                };
            });
        }
    };
});
