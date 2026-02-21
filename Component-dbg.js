sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("ui5.vizframe.app.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            var oData = {
                monthlyRevenue: [
                    { month: "Jan", revenue: 63 },
                    { month: "Feb", revenue: 71 },
                    { month: "Mrz", revenue: 58 },
                    { month: "Apr", revenue: 84 },
                    { month: "Mai", revenue: 76 },
                    { month: "Jun", revenue: 92 }
                ],
                regionRevenue: [
                    { region: "DACH", revenue: 240, target: 220 },
                    { region: "Nordics", revenue: 185, target: 200 },
                    { region: "UK", revenue: 160, target: 150 },
                    { region: "France", revenue: 130, target: 140 },
                    { region: "Iberia", revenue: 95, target: 110 },
                    { region: "Italy", revenue: 115, target: 105 }
                ],
                productShare: [
                    { product: "Cloud ERP", share: 35 },
                    { product: "Analytics", share: 22 },
                    { product: "CX Suite", share: 18 },
                    { product: "SuccessFactors", share: 15 },
                    { product: "Ariba", share: 10 }
                ],
                quarterlyProfit: [
                    { quarter: "Q1 24", profit: 12.4, cost: 8.2 },
                    { quarter: "Q2 24", profit: 14.1, cost: 9.0 },
                    { quarter: "Q3 24", profit: 11.8, cost: 8.8 },
                    { quarter: "Q4 24", profit: 16.5, cost: 10.1 },
                    { quarter: "Q1 25", profit: 15.2, cost: 9.5 },
                    { quarter: "Q2 25", profit: 17.8, cost: 10.8 }
                ],
                employeeSatisfaction: [
                    { department: "Engineering", score: 4.2 },
                    { department: "Sales", score: 3.8 },
                    { department: "Marketing", score: 4.5 },
                    { department: "Support", score: 3.6 },
                    { department: "HR", score: 4.1 },
                    { department: "Finance", score: 3.9 }
                ],
                ticketVolume: [
                    { month: "Jan", critical: 12, high: 34, medium: 67, low: 89 },
                    { month: "Feb", critical: 8, high: 28, medium: 54, low: 78 },
                    { month: "Mrz", critical: 15, high: 41, medium: 72, low: 95 },
                    { month: "Apr", critical: 6, high: 22, medium: 48, low: 65 },
                    { month: "Mai", critical: 10, high: 30, medium: 58, low: 82 },
                    { month: "Jun", critical: 4, high: 18, medium: 42, low: 60 }
                ],
                budgetAllocation: [
                    { category: "Personal", amount: 420 },
                    { category: "Infrastruktur", amount: 180 },
                    { category: "Marketing", amount: 95 },
                    { category: "F&E", amount: 250 },
                    { category: "Vertrieb", amount: 140 },
                    { category: "Sonstiges", amount: 65 }
                ],
                conversionFunnel: [
                    { stage: "Besucher", count: 10000 },
                    { stage: "Leads", count: 3200 },
                    { stage: "Qualifiziert", count: 1400 },
                    { stage: "Angebot", count: 680 },
                    { stage: "Abschluss", count: 320 }
                ],
                weeklyOrders: [
                    { week: "KW 1", orders: 142, returns: 8 },
                    { week: "KW 2", orders: 158, returns: 12 },
                    { week: "KW 3", orders: 135, returns: 6 },
                    { week: "KW 4", orders: 172, returns: 15 },
                    { week: "KW 5", orders: 189, returns: 10 },
                    { week: "KW 6", orders: 164, returns: 9 },
                    { week: "KW 7", orders: 198, returns: 14 },
                    { week: "KW 8", orders: 210, returns: 11 }
                ],
                customerSegments: [
                    { segment: "Enterprise", revenue: 380, customers: 45 },
                    { segment: "Mid-Market", revenue: 260, customers: 180 },
                    { segment: "SMB", revenue: 150, customers: 520 },
                    { segment: "Startup", revenue: 60, customers: 340 }
                ],
                o2cProcessFunnel: [
                    { stage: "Auftrag", count: 1250 },
                    { stage: "Kommissionierung", count: 1180 },
                    { stage: "Lieferung", count: 1090 },
                    { stage: "Rechnung", count: 1050 },
                    { stage: "Zahlung", count: 980 }
                ],
                o2cRevenueByStage: [
                    { stage: "Auftrag", revenue: 420, target: 400 },
                    { stage: "Lieferung", revenue: 385, target: 380 },
                    { stage: "Rechnung", revenue: 372, target: 370 },
                    { stage: "Zahlung", revenue: 348, target: 350 }
                ],
                o2cDSO: [
                    { month: "Jan", days: 42 },
                    { month: "Feb", days: 38 },
                    { month: "Mrz", days: 45 },
                    { month: "Apr", days: 39 },
                    { month: "Mai", days: 36 },
                    { month: "Jun", days: 35 }
                ],
                p2pProcessFunnel: [
                    { stage: "Bedarfsmeldung", count: 890 },
                    { stage: "Bestellung", count: 820 },
                    { stage: "Wareneingang", count: 780 },
                    { stage: "Rechnungsprüfung", count: 745 },
                    { stage: "Zahlung", count: 710 }
                ],
                p2pSpendByCategory: [
                    { category: "Rohstoffe", amount: 320, target: 300 },
                    { category: "Betriebsstoffe", amount: 95, target: 90 },
                    { category: "Dienstleistungen", amount: 180, target: 200 },
                    { category: "Investitionen", amount: 120, target: 110 }
                ],
                p2pInvoiceCycle: [
                    { month: "Jan", days: 18 },
                    { month: "Feb", days: 15 },
                    { month: "Mrz", days: 22 },
                    { month: "Apr", days: 16 },
                    { month: "Mai", days: 14 },
                    { month: "Jun", days: 12 }
                ],
                r2rProcessFunnel: [
                    { stage: "Buchung", count: 4500 },
                    { stage: "Kontenabstimmung", count: 4200 },
                    { stage: "Periodenabschluss", count: 6 },
                    { stage: "Konsolidierung", count: 4 },
                    { stage: "Reporting", count: 12 }
                ],
                r2rByAccountType: [
                    { type: "Debitoren", share: 28 },
                    { type: "Kreditoren", share: 22 },
                    { type: "Sachkonten", share: 35 },
                    { type: "Bank", share: 12 },
                    { type: "Anlagen", share: 3 }
                ],
                r2rJournalEntries: [
                    { period: "Jan", entries: 1250 },
                    { period: "Feb", entries: 1180 },
                    { period: "Mrz", entries: 1420 },
                    { period: "Apr", entries: 1100 },
                    { period: "Mai", entries: 1350 },
                    { period: "Jun", entries: 1280 }
                ],
                r2rCloseCycle: [
                    { month: "Jan", days: 8 },
                    { month: "Feb", days: 6 },
                    { month: "Mrz", days: 12 },
                    { month: "Apr", days: 7 },
                    { month: "Mai", days: 5 },
                    { month: "Jun", days: 6 }
                ],
                ptpProcessFunnel: [
                    { stage: "Bedarfsplanung", count: 450 },
                    { stage: "Produktionsplanung", count: 420 },
                    { stage: "Materialbereitstellung", count: 395 },
                    { stage: "Fertigung", count: 365 },
                    { stage: "Qualitätsprüfung", count: 340 }
                ],
                ptpCapacityUtil: [
                    { workcenter: "Montage 1", util: 85, target: 80 },
                    { workcenter: "Montage 2", util: 72, target: 80 },
                    { workcenter: "Lackierung", util: 90, target: 85 },
                    { workcenter: "Verpackung", util: 78, target: 75 }
                ],
                ptpOutput: [
                    { month: "Jan", output: 320 },
                    { month: "Feb", output: 285 },
                    { month: "Mrz", output: 350 },
                    { month: "Apr", output: 310 },
                    { month: "Mai", output: 365 },
                    { month: "Jun", output: 340 }
                ]
            };

            var oModel = new JSONModel(oData);
            this.setModel(oModel, "sales");

            this.getRouter().initialize();
        }
    });
});
