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
  - Schwebender Button unten rechts; zusätzlich **KI** in der Kopfzeile und Eintrag **KI Assistent** im Burger-Menü.
  - Antworten über eine **UI5-Server-Middleware** (`POST /api/chat`) – API-Keys bleiben auf dem Server, nicht im Browser.
  - Standardmäßig **Groq** (OpenAI-kompatibles API, kostenloser Tier) mit Modell `llama-3.3-70b-versatile`. Optional **Demo-Modus** ohne API (`MOCK_MODE=true`).
- **OData V2** als Datenmodell; **lokale Mock-Daten** unter `webapp/localService/` für Entwicklung und Tests.

## Technologie-Stack

- SAPUI5 **1.120** (Freestyle, XML-Views, JavaScript-Controller)
- **sap.viz** (VizFrame) für Diagramme
- **sap.ui.layout** (u. a. CSSGrid für die Startkacheln)
- **OData V2** (`sap.ui.model.odata.v2.ODataModel`)
- **UI5 Tooling** (`@ui5/cli`), Mock-Server (`@sap-ux/ui5-middleware-fe-mockserver`), Fiori-Tools-Proxy für UI5-Ressourcen
- **Custom Middleware** `middleware/chat-proxy`: Chat-Backend für lokales `ui5 serve`
- Theming: **themelib_sap_horizon**

## Projektstruktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `webapp/manifest.json` | App-ID, Routing, OData-Modell, Libraries |
| `webapp/view/` | XML-Views (Startseite, Prozesse, Projekt) |
| `webapp/controller/` | Controller inkl. `App.controller.js` (Chat, FAB), `BaseController`, `ChatHelper` |
| `webapp/fragment/Chatbot.fragment.xml` | Chat-Popover (Nachrichten, Composer) |
| `middleware/chat-proxy/` | npm-Paket für UI5 Custom Middleware (Groq / Mock) |
| `webapp/localService/` | OData-Metadaten und Mock-Daten |
| `webapp/css/style.css` | Layout, Responsivität, Chat-Styling |
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
3. Nur simulierte Antworten (ohne Key oder bewusst offline):
   ```bash
   MOCK_MODE=true
   ```
4. Server nach Änderungen an `.env` neu starten (`Ctrl+C`, dann `npm run start`).

Die Middleware liest `.env` aus dem Projektstamm automatisch ein.

## Build und Deployment

```bash
npm run build          # Produktions-Build nach dist/
npm run start:full     # Build + Preview mit gehosteter UI5-URL
npm run deploy         # GitHub Pages (siehe Skripte)
npm run deploy:zip     # ZIP-Artefakt
```

**Hinweis:** Der KI-Chat (`/api/chat`) läuft nur im **UI5 Tooling Dev-Server** (Middleware). Für ein reines Static-Hosting (z. B. nur `dist/` auf GitHub Pages) ist kein Chat-Backend dabei – dafür bräuchte man einen separaten API-Endpunkt.

## Datenquellen

Im Manifest ist OData unter `/sap/opu/odata/sap/KPI_SERVICE/` konfiguriert. Lokal greift der **FE Mock Server** auf `webapp/localService/metadata.xml` und die JSON-Daten unter `webapp/localService/data/` zu.
