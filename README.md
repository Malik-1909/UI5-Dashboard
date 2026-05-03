# UI5 VizFrame KPI Dashboard

SAPUI5-Web-App zur Visualisierung von KPI-Daten entlang zentraler End-to-End-Geschäftsprozesse. Die Anwendung zeigt Kennzahlen als interaktive VizFrame-Diagramme und bietet einen **KI-Assistenten**, der Fragen zur App und zu den Prozessen beantwortet und bei Bedarf zur richtigen Seite navigiert.

## Was die App macht

- **Dashboard-Startseite** mit fünf klickbaren Prozesskacheln und eingebetteten Mini-Charts.
- **Fünf Geschäftsprozesse** mit jeweils eigener Detailseite:
  - Record to Report (R2R)
  - Recruit to Retire (RtR)
  - Source to Pay (S2P)
  - Design to Operate (D2O)
  - Lead to Cash (L2C)
- **Navigation**: Kacheln, Desktop-Menü „Prozesse“, Burger-Menü (Mobile), Seite **Über dieses Projekt**.
- **KI-Assistent** (Chat):
  - Schwebender Button unten rechts; **KI Assistent** in der Kopfzeile (Desktop-Fragment) und Eintrag im Burger-Menü.
  - **Lokal** (`npm run start`): Antworten über **UI5 Custom Middleware** `POST /api/chat` – API-Keys bleiben auf dem Server, nicht im Browser.
  - Standardmäßig **Groq** (OpenAI-kompatibles API, kostenloser Tier) mit Modell `llama-3.3-70b-versatile`. Optional **Demo-Modus** ohne API (`MOCK_MODE=true` in `.env`).
  - **GitHub Pages** (`*.github.io`): kein Backend – KPIs aus gebündelten Demo-JSONs; der Chat nutzt eine **Offline-Simulation** (`StaticChatMock`, gleiche Navigations-Regex-Idee wie im Server-Mock).
- **OData V2** als Datenmodell **lokal**; **Mock-Daten** unter `webapp/localService/`. Für statische Builds wird vor `ui5 build` ein **Bundle** `webapp/localService/static-mock-bundle.json` erzeugt und auf GitHub Pages als `JSONModel` unter dem Namen `sales` geladen.

## Technologie-Stack

- SAPUI5 **1.120** (Freestyle, XML-Views, JavaScript-Controller) – `ui5.yaml` / Fiori-Tools-Proxy auf dieselbe Version
- **sap.viz** (VizFrame) für Diagramme
- **sap.ui.layout** (u. a. CSSGrid für die Startkacheln)
- **OData V2** (`sap.ui.model.odata.v2.ODataModel`) lokal; **JSONModel** aus Bundle nur auf GitHub Pages
- **UI5 Tooling** (`@ui5/cli`), Mock-Server (`@sap-ux/ui5-middleware-fe-mockserver`), Fiori-Tools-Proxy für UI5-Ressourcen
- **Custom Middleware** `middleware/chat-proxy` (Paketname `ui5-middleware-chat-proxy`): Chat-Backend für lokales `ui5 serve`
- Theming: **themelib_sap_horizon**

## Projektstruktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `webapp/manifest.json` | App-ID, Routing, OData-Modell, Libraries |
| `webapp/Component.js` | Router; auf `*.github.io` Austausch des `sales`-Modells gegen JSON aus dem statischen Bundle |
| `webapp/view/` | XML-Views (Startseite, Prozesse, Projekt) |
| `webapp/controller/` | Controller inkl. `App.controller.js` (Chat, FAB), `BaseController`, `ChatHelper` |
| `webapp/fragment/Chatbot.fragment.xml` | Chat-Popover (Nachrichten, Composer) |
| `webapp/fragment/HeaderKiButton.fragment.xml` | Desktop-Button „KI Assistent“ in der Kopfzeile |
| `webapp/utils/StaticChatMock.js` | Offline-Antworten für den Chat auf GitHub Pages |
| `middleware/chat-proxy/` | npm-Paket für UI5 Custom Middleware (Groq / Mock) |
| `webapp/localService/` | OData-Metadaten, Mock-JSON unter `data/`, Build-Artefakt `static-mock-bundle.json` |
| `scripts/bundle-static-mock.js` | Bündelt `data/*.json` zu `static-mock-bundle.json` (wird von `npm run build` aufgerufen) |
| `scripts/prepare-ghpages.js` | Passt `dist/index.html` für GitHub Pages an (CDN, `base`, `resourceroots`, `404.html`, `.nojekyll`) |
| `webapp/css/style.css` | Layout, Responsivität, Chat-Styling |
| `.github/workflows/deploy.yml` | Optional: manueller Deploy zu GitHub Pages (Build + Artifact) |
| `.env` / `.env.example` | Lokale Konfiguration (nicht committen: `.env` in `.gitignore`) |

## Lokale Entwicklung

**Voraussetzungen:** Node.js (empfohlen: aktuelle LTS) und npm.

```bash
npm install
npm run start
```

Die App öffnet sich mit `index.html`; der Dev-Server stellt Mock-OData und die Chat-API bereit.

### KI-Chat konfigurieren

1. Kopiere `.env.example` nach `.env` (liegt in `.gitignore`).
2. Für echte KI-Antworten: API-Key von [Groq Console](https://console.groq.com) erstellen und setzen:
   ```bash
   GROQ_API_KEY=gsk_...
   ```
3. Nur simulierte Antworten lokal (ohne Key oder bewusst offline):
   ```bash
   MOCK_MODE=true
   ```
4. Server nach Änderungen an `.env` neu starten (`Ctrl+C`, dann `npm run start`).

Die Middleware liest `.env` aus dem Projektstamm automatisch ein.

## Build und Deployment

```bash
npm run build          # bundle-static-mock + ui5 build → dist/
npm run start:full     # Build + Preview mit gehosteter UI5-URL
npm run deploy         # Build + prepare-ghpages + gh-pages (Branch `gh-pages`)
npm run deploy:zip     # ZIP-Artefakt
```

**Build:** `npm run build` führt zuerst `scripts/bundle-static-mock.js` aus (alle `webapp/localService/data/*.json` → `static-mock-bundle.json`), danach `ui5 build --clean-dest`.

**GitHub Pages (`scripts/prepare-ghpages.js`):** UI5 wird von `https://ui5.sap.com/1.120.0/` geladen; `base href` und `resourceroots` richten sich nach dem **Git-Remote** (Repo-Name, z. B. `/UI5/`). Es werden `404.html` (SPA-Fallback) und `.nojekyll` geschrieben.

**Chat und Daten auf statischem Hosting:** Ohne Node-Server gibt es **kein** `/api/chat`. Auf `*.github.io` ersetzt die `Component` das OData-`sales`-Modell durch das **JSON-Bundle**; der Chat antwortet über **StaticChatMock**. Für echte KI weiterhin lokal deployen oder einen eigenen API-Endpunkt anbinden.

**CI:** In `.github/workflows/deploy.yml` ist ein manueller Workflow (**workflow_dispatch**) definiert: Build, `prepare-ghpages.js`, Upload zu GitHub Pages (benötigt eingerichtetes Pages-Environment im Repository).

## Datenquellen

Im Manifest ist OData unter `/sap/opu/odata/sap/KPI_SERVICE/` konfiguriert. Lokal greift der **FE Mock Server** auf `webapp/localService/metadata.xml` und die JSON-Daten unter `webapp/localService/data/` zu. Im Produktions-Build liegen dieselben Demo-Daten zusätzlich in `static-mock-bundle.json` für reines Static-Hosting.
