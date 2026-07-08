#!/usr/bin/env node
// Holt die SAP-Sandbox-Daten (SAP Business Accelerator Hub) und schreibt sie
// als kombiniertes JSON nach sap-cache/sap-cache.json.
//
// Läuft in GitHub Actions (Runner erreicht sandbox.api.sap.com), NICHT auf BTP
// (dessen Trial-Egress die Sandbox-IP nicht erreichen kann).
//
// Benötigt: Umgebungsvariable SAP_API_KEY (als GitHub Secret hinterlegt).

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAP_API_KEY = process.env.SAP_API_KEY || "";
if (!SAP_API_KEY) {
    console.error("[fetch-sap-cache] FEHLER: SAP_API_KEY ist nicht gesetzt.");
    process.exit(1);
}

const BASE = "https://sandbox.api.sap.com";
const TIMEOUT_MS = 20000;

// Gleiche OData-Queries wie im Browser-Loader (webapp/utils/SapDataLoader.js).
const ENDPOINTS = [
    {
        key: "l2c",
        url: BASE + "/s4hanacloud/sap/opu/odata/sap/API_SALES_ORDER_SRV/A_SalesOrder" +
            "?$top=120&$select=SalesOrder,SalesOrderType,SoldToParty,CreationDate," +
            "TotalNetAmount,TransactionCurrency&$format=json"
    },
    {
        key: "s2p",
        url: BASE + "/s4hanacloud/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/A_PurchaseOrder" +
            "?$top=120&$select=PurchaseOrder,PurchaseOrderType,Supplier,CompanyCode," +
            "DocumentCurrency,CreationDate,PurchasingOrganization&$format=json"
    },
    {
        key: "r2r",
        url: BASE + "/s4hanacloud/sap/opu/odata/sap/API_JOURNALENTRYITEMBASIC_SRV/A_JournalEntryItemBasic" +
            "?$top=180&$filter=CompanyCode%20eq%20'1010'" +
            "&$select=GLAccount,GLAccountName,AmountInCompanyCodeCurrency," +
            "CompanyCodeCurrency,FiscalPeriod,LedgerFiscalYear,ControllingDebitCreditCode,CompanyCode&$format=json"
    },
    {
        key: "rtr",
        url: BASE + "/successfactors/odata/v2/User" +
            "?$top=120&$select=userId,department,jobTitle,country&$format=json"
    },
    {
        key: "d2oDocs",
        url: BASE + "/s4hanacloud/sap/opu/odata/sap/API_MATERIAL_DOCUMENT_SRV/A_MaterialDocumentHeader" +
            "?$top=120&$select=MaterialDocument,PostingDate,CreationDate," +
            "GoodsMovementCode,InventoryTransactionType&$format=json"
    },
    {
        key: "d2oStock",
        url: BASE + "/s4hanacloud/sap/opu/odata/sap/API_MATERIAL_STOCK_SRV/A_MatlStkInAcctMod" +
            "?$top=120&$filter=Material%20ne%20''" +
            "&$select=Material,Plant,MatlWrhsStkQtyInMatlBaseUnit,MaterialBaseUnit&$format=json"
    }
];

function extractRows(json) {
    if (json && json.d && Array.isArray(json.d.results)) { return json.d.results; }
    if (json && Array.isArray(json.value)) { return json.value; }
    return [];
}

async function fetchEndpoint(endpoint) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(endpoint.url, {
            headers: { APIKey: SAP_API_KEY, Accept: "application/json" },
            signal: controller.signal
        });
        if (!res.ok) {
            const body = await res.text();
            return { key: endpoint.key, rows: [], error: "HTTP " + res.status + " " + body.slice(0, 120) };
        }
        const json = await res.json();
        return { key: endpoint.key, rows: extractRows(json), error: "" };
    } catch (err) {
        return { key: endpoint.key, rows: [], error: err.name === "AbortError" ? "Timeout" : (err.message || "Network") };
    } finally {
        clearTimeout(timer);
    }
}

async function main() {
    const results = await Promise.all(ENDPOINTS.map(fetchEndpoint));

    const data = {};
    const sources = {};
    const failures = {};
    for (const r of results) {
        data[r.key] = r.rows;
        sources[r.key] = r.rows.length;
        if (r.error) { failures[r.key] = r.error; }
    }

    const totalRows = Object.values(sources).reduce((s, n) => s + n, 0);
    if (totalRows === 0) {
        console.error("[fetch-sap-cache] FEHLER: 0 Zeilen von allen Endpoints.", JSON.stringify(failures));
        process.exit(2);
    }

    const payload = {
        fetchedAt: new Date().toISOString(),
        sources,
        failures,
        data
    };

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const outDir = resolve(__dirname, "..", "sap-cache");
    const outFile = resolve(outDir, "sap-cache.json");
    await mkdir(outDir, { recursive: true });
    await writeFile(outFile, JSON.stringify(payload), "utf8");

    console.log("[fetch-sap-cache] OK →", outFile);
    console.log("[fetch-sap-cache] sources:", JSON.stringify(sources));
    if (Object.keys(failures).length) {
        console.log("[fetch-sap-cache] failures:", JSON.stringify(failures));
    }
}

main().catch((err) => {
    console.error("[fetch-sap-cache] Unerwarteter Fehler:", err);
    process.exit(3);
});
