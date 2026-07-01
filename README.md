# UI5 VizFrame KPI Dashboard

SAPUI5-Web-App zur Visualisierung von Kennzahlen und Diagrammen entlang von **fünf End-to-End-Geschäftsprozessen** (L2C, S2P, R2R, RtR, D2O). Zusätzlich gibt es einen **KI-Assistenten** (Navigation, FAQ zu Prozessen und App).

**Live-Demo:** [GitHub Pages](https://malik-1909.github.io/UI5-Dashboard/) · **Quellcode:** [github.com/Malik-1909/UI5-Dashboard](https://github.com/Malik-1909/UI5-Dashboard)

## Screenshots

| Startseite | Prozess-Detail (L2C) |
|------------|----------------------|
| ![Startseite mit Prozesskacheln](docs/screenshots/main-dashboard.png) | ![Lead to Cash Detailseite](docs/screenshots/l2c-detail.png) |

## Was die App macht

- **Startseite** mit fünf Prozesskacheln und Mini-Charts.
- **Detailseiten** je Prozess: KPI-Tabelle und mehrere **sap.viz**-Diagramme (ohne Textwände – Prozessinfos auf der Projektseite).
- **Datenmodell `sales`** (überall `JSONModel`):
  - **Lokal** (`npm run start`): Mock-Bundle + optional SAP-Sandbox via `SapDataLoader`; Router startet erst nach dem Merge (kein Layout-Sprung).
  - **GitHub Pages** (`*.github.io`): nur statisches Mock-Bundle; kein SAP- oder Chat-Backend.
- **Hinweise in der UI**: MessageStrip und Panel-Titel zeigen **SAP API** vs. **Mock**.
- **KI-Chat**:
  - **Lokal**: `POST /api/chat` über Middleware (**Groq**, Key in `.env`).
  - **GitHub Pages**: **StaticChatMock** – regelbasierte Offline-Antworten.

## Deployment-Matrix

| Umgebung | SAP-Daten | KI-Assistent | Backend nötig |
|----------|-----------|--------------|---------------|
| **Lokal** (`npm run start`) | Sandbox (mit `SAP_API_KEY`) oder Mock | Groq (mit `GROQ_API_KEY`) oder Mock | UI5 Dev-Server + Middleware |
| **GitHub Pages** | Mock only | StaticChatMock | Nein (statisch) |
| **BTP (geplant)** | Sandbox via Proxy | Groq via Proxy | Ja – Node-Backend auf CF |

Details zu GitHub Pages: `npm run deploy` · BTP-Vorbereitung: siehe [DEPLOYMENT.md](DEPLOYMENT.md) · Vollständiges BTP-Setup (Live-Daten + KI) folgt als nächster Schritt.

## Datenquellen (lokal, mit `SAP_API_KEY`)

| Prozess | API / Quelle (Kurz) |
|--------|----------------------|
| **L2C** | S/4 OData `API_SALES_ORDER_SRV` – Vertrieb / Aufträge |
| **S2P** | `API_PURCHASEORDER_PROCESS_SRV` – Einkauf; im Sandbox-Header **keine Nettobeträge** → u. a. **Beleganzahl** je Organisation |
| **R2R** | `API_JOURNALENTRYITEMBASIC_SRV` mit Filter `CompanyCode eq '1010'` |
| **RtR** | SuccessFactors OData v2 `User` |
| **D2O** | `API_MATERIAL_DOCUMENT_SRV` + `API_MATERIAL_STOCK_SRV` (Produktionsaufträge oft **403**) |

Proxy und Keys: `middleware/chat-proxy` – Routen `/api/chat` und `/api/sap/*` → `sandbox.api.sap.com`.

## Technologie-Stack

- SAPUI5 **1.120** (XML-Views, JS-Controller), **sap.viz**, **sap.ui.layout**, **themelib_sap_horizon**
- **`JSONModel` `sales`** – gesetzt in `webapp/Component.js`
- **`webapp/utils/SapDataLoader.js`** – Sandbox-Fetch unter `/api/sap/...`, Transformation in Mock-Strukturen
- **Custom Middleware** `middleware/chat-proxy`: Chat + SAP-Proxy

## Projektstruktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `webapp/` | **Aktive App** – Component, Views, Manifest, Styles |
| `webapp/Component.js` | `sales` als JSONModel; GitHub Pages → Mock; sonst SAP-Merge |
| `webapp/utils/SapDataLoader.js` | SAP-Sandbox laden und aggregieren |
| `middleware/chat-proxy/` | Groq-Chat, SAP-Sandbox-Proxy |
| `scripts/prepare-ghpages.js` | GitHub-Pages-Vorbereitung (CDN 1.120, SPA-404) |
| `.env` / `.env.example` | `GROQ_API_KEY`, `SAP_API_KEY`, optional `MOCK_MODE` |

Entwicklung und Build laufen über **`webapp/`** + Root-`ui5.yaml` / `package.json`.

## Lokale Entwicklung

**Voraussetzungen:** Node.js (LTS) und npm.

```bash
npm install
npm run start
```

### Umgebungsvariablen (`.env`)

1. `.env.example` nach `.env` kopieren.
2. **Groq** (optional): `GROQ_API_KEY` von [Groq Console](https://console.groq.com).
3. **SAP Sandbox** (optional): `SAP_API_KEY` von [SAP API Business Hub](https://api.sap.com).
4. Nur simulierte Chat-Antworten: `MOCK_MODE=true`.

### SCSS-Workflow

Quellen: `webapp/styles/**/*.scss` → generiert `webapp/css/style.css` (nicht manuell editieren).

| Befehl | Zweck |
|--------|--------|
| `npm start` | SCSS + Mock-Bundle + `ui5 serve` |
| `npm run build` | SCSS + Mock-Bundle + `ui5 build` → `dist/` |
| `npm run scss:watch` | Live-Kompilierung (zweites Terminal) |

## Build und Deployment

```bash
npm run build          # → dist/
npm run deploy         # startet den GitHub-Pages-Workflow (manuell)
npm run deploy:gh-pages-branch  # optional: klassischer gh-pages-Branch Deploy
npm run deploy:zip     # ZIP für BTP Staticfile (interim)
npm run test           # Lightweight Smoke-Tests
npm run screenshots    # README-Screenshots (startet Dev-Server automatisch)
```

**GitHub Pages:** Statisch – Mock + StaticChatMock. Deploy wird manuell per `npm run deploy` (Workflow `workflow_dispatch`) gestartet.

**CI:** `.github/workflows/deploy.yml`

## Roadmap / BTP

Nächster Schritt: **Node-Backend auf Cloud Foundry** (Logik aus `middleware/chat-proxy`) – damit auf BTP dieselbe Funktion wie lokal: SAP-Sandbox-Daten + KI-Assistent, Keys serverseitig. GitHub Pages bleibt Demo-Fallback.

Langfristig optional: HTML5 Application Repository, Destinations zu produktiven Systemen, SAP Build Work Zone.
