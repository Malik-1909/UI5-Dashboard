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
                ]
            };

            var oModel = new JSONModel(oData);
            this.setModel(oModel, "sales");

            this.getRouter().initialize();
        }
    });
});
