# UI5 VizFrame KPI Dashboard

SAPUI5-Web-App zur Visualisierung von Kennzahlen und Diagrammen entlang von **fünf End-to-End-Geschäftsprozessen** (L2C, S2P, R2R, RtR, D2O). Zusätzlich gibt es einen **KI-Assistenten** (Navigation, FAQ zu Prozessen und App).

## Was die App macht

- **Startseite** mit fünf Prozesskacheln und Mini-Charts.
- **Detailseiten** je Prozess: Beschreibung, KPI-Tabelle, mehrere **sap.viz**-Diagramme.
- **Datenmodell `sales`** (überall `JSONModel`):
  - **Lokal** (`npm run start`): Das Mock-Bundle wird gelesen, `SapDataLoader` holt die Sandbox-Daten; **erst danach** wird `sales` gesetzt und der Router gestartet (Busy auf der Component), damit Tabellen und Charts nicht erst Demo- und dann Live-Daten rendern (kein Layout-Sprung). Schlägt eine API fehl oder liefert sie nichts, bleibt der Mock-Fallback für diesen Teil aktiv.
  - **GitHub Pages** (`*.github.io`): Es wird **nur** das statische Bundle geladen; **kein** Aufruf von SAP oder Chat-Backend (siehe unten).
- **Hinweise in der UI**: MessageStrip und Panel-Überschriften zeigen, ob Daten von der **SAP API** oder vom **Mock** stammen (lokal nach erfolgreichem Merge).
- **KI-Chat**:
  - **Lokal**: `POST /api/chat` über Custom Middleware (**Groq**, Key in `.env`). Optional `MOCK_MODE=true` ohne externe KI.
  - **GitHub Pages**: **StaticChatMock** – regelbasierte Offline-Antworten, keine Groq-Anbindung.

## Datenquellen (lokal, mit `SAP_API_KEY`)

| Prozess | API / Quelle (Kurz) |
|--------|----------------------|
| **L2C** | S/4 OData `API_SALES_ORDER_SRV` – Vertrieb / Aufträge |
| **S2P** | `API_PURCHASEORDER_PROCESS_SRV` – Einkauf; im Sandbox-Header **keine Nettobeträge** → Diagramme/KPIs nutzen u. a. **Beleganzahl** je Organisation |
| **R2R** | `API_JOURNALENTRYITEMBASIC_SRV` mit Filter `CompanyCode eq '1010'`; Felder z. B. `LedgerFiscalYear`, Betrag, Soll/Haben-Logik |
| **RtR** | SuccessFactors OData v2 `User` |
| **D2O** | `API_MATERIAL_DOCUMENT_SRV` + `API_MATERIAL_STOCK_SRV` (Produktionsaufträge sind in der Sandbox oft **403**) |

Proxy und Keys: siehe `middleware/chat-proxy` – Routen `/api/chat` und `/api/sap/*` → u. a. `sandbox.api.sap.com` mit Header `APIKey`.

## Technologie-Stack

- SAPUI5 **1.120** (XML-Views, JS-Controller), **sap.viz**, **sap.ui.layout**, **themelib_sap_horizon**
- **`JSONModel` `sales`** – gesetzt in `webapp/Component.js` (nicht mehr im Manifest als OData deklariert)
- **`webapp/utils/SapDataLoader.js`** – fetch der Sandbox-URLs unter `/api/sap/...`, Transformation in die bestehenden Entity-Set-Strukturen der Mock-JSONs
- **UI5 Tooling**, Fiori-Tools-Proxy, optional **FE Mock Server** (`@sap-ux/ui5-middleware-fe-mockserver`) unter `/sap/opu/odata/sap/KPI_SERVICE/` (nur noch für lokales Testen der Mock-Metadaten; die App bindet `sales` ausschließlich über `JSONModel` in der Component)
- **Custom Middleware** `middleware/chat-proxy` (Paket `ui5-middleware-chat-proxy`): Chat + SAP-Proxy

## Projektstruktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `webapp/Component.js` | `sales` als JSONModel; lokal: SAP-Merge vor erstem `setModel` + Router; auf `*.github.io` sofort Mock; MessageToasts bei Fehlern |
| `webapp/utils/BurgerMenuHelper.js` | Gemeinsames Burger-Menü (Navigation + KI) für Main und Unterseiten |
| `webapp/controller/BaseController.js` | Burger-Menü, Chat öffnen; Main erbt davon |
| `webapp/utils/SapDataLoader.js` | Laden und Aggregieren der SAP-Sandbox-Daten |
| `webapp/utils/StaticChatMock.js` | Offline-Chat auf GitHub Pages |
| `middleware/chat-proxy/` | Groq, Mock-Modus, **SAP-Sandbox-Proxy** |
| `webapp/localService/data/` | Demo-JSON pro Entity-Set |
| `webapp/localService/static-mock-bundle.json` | Build-Artefakt (per `bundle-static-mock.js`, steht in `.gitignore`) |
| `scripts/bundle-static-mock.js` | Bündelt `data/*.json` vor `ui5 build` / `start` |
| `scripts/prepare-ghpages.js` | `dist/index.html` für GitHub Pages (CDN 1.120, `base`, SPA-404) |
| `.env` / `.env.example` | `GROQ_API_KEY`, `SAP_API_KEY`, optional `MOCK_MODE` |

## Lokale Entwicklung

**Voraussetzungen:** Node.js (LTS) und npm.

```bash
npm install
npm run start
```

Vor dem Start wird `static-mock-bundle.json` erzeugt (falls noch nicht vorhanden). Die App nutzt den Dev-Server inkl. Middleware.

### Umgebungsvariablen (`.env`)

1. `.env.example` nach `.env` kopieren (`.env` nicht committen).
2. **Groq** (optional, für KI): `GROQ_API_KEY` von [Groq Console](https://console.groq.com).
3. **SAP Sandbox** (optional, für Live-Daten): `SAP_API_KEY` von [SAP API Business Hub](https://api.sap.com) → Settings → Show API Key.
4. Nur simulierte Chat-Antworten lokal: `MOCK_MODE=true`.
5. Nach Änderungen an `.env` den Server neu starten.

Ohne `SAP_API_KEY` bleiben die Prozessseiten bei den Demo-Daten aus dem Bundle (weiterhin funktionsfähige Diagramme).

## Build und Deployment

```bash
npm run build          # bundle-static-mock + ui5 build → dist/
npm run start:full     # Build + statische Preview mit UI5-CDN
npm run deploy         # Build + prepare-ghpages + gh-pages
npm run deploy:zip     # ZIP-Artefakt
```

**GitHub Pages:** Statisches Hosting – **keine** SAP-Live-Daten, **kein** Groq; Bundle + StaticChatMock. Für Produktion mit echten Systemen: **SAP BTP** (HTML5 App Repo, Destinations) und ein **Backend** für den Chat (Keys serverseitig).

**CI:** `.github/workflows/deploy.yml` mit `workflow_dispatch` (Pages-Environment im Repo konfigurieren).

## Roadmap / BTP

Für **SAP Build Work Zone / Fiori Launchpad / BTP** ersetzt man typischerweise `/api/sap/*` durch **Destinations** und OData- oder HTTP-Clients mit BTP-Auth; den Chat bindet man an einen **geschützten** Endpunkt (z. B. kleine CAP- oder Node-App). Die UI5-Oberfläche kann größtenteils unverändert bleiben, die **Datenanbindung** wird angepasst.
