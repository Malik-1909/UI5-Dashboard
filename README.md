# UI5 VizFrame KPI Dashboard

Dieses Projekt ist eine SAPUI5/OpenUI5 Web-App zur Visualisierung von KPI-Daten entlang zentraler End-to-End-Prozesse.  
Die Anwendung stellt Kennzahlen als interaktive Diagramme dar und bietet eine einfache Navigation von der Startseite in die jeweiligen Prozess-Detailseiten.

## Was das Projekt macht

- Zeigt KPI-Übersichten auf einer Dashboard-Startseite als Kacheln mit eingebetteten VizFrame-Charts.
- Deckt mehrere Geschäftsprozesse ab:
  - Record to Report (R2R)
  - Recruit to Retire (RtR)
  - Source to Pay (S2P)
  - Design to Operate (D2O)
  - Lead to Cash (L2C)
- Ermöglicht Navigation über:
  - klickbare Kacheln
  - Desktop-Menü ("Prozesse")
  - Burger-Menü für kleinere Viewports
- Verwendet OData V2 als Datenmodell und lokale Mock-Daten für Entwicklung/Tests.

## Technologie-Stack

- OpenUI5 / SAPUI5 (min. Version `1.120.0`)
- UI5 Tooling (`@ui5/cli`)
- VizFrame (`sap.viz`) für Diagramme
- OData V2 Modell (`sap.ui.model.odata.v2.ODataModel`)
- Entwicklungs- und Deploy-Skripte über npm

## Projektstruktur (Kurzüberblick)

- `webapp/manifest.json` – App-Metadaten, Routing, Models, Libraries
- `webapp/view/` – XML-Views (Startseite + Prozessseiten)
- `webapp/controller/` – Controller-Logik und Navigation
- `webapp/localService/` – Mock-Service, Metadaten und JSON-Datenquellen
- `webapp/css/style.css` – eigenes Styling

## Lokale Entwicklung

Voraussetzungen:

- Node.js + npm

Installation:

```bash
npm install
```

Entwicklungsserver starten:

```bash
npm run start
```

Die App wird über UI5 Tooling bereitgestellt und startet standardmäßig mit `index.html`.

## Build und Deployment

Produktions-Build:

```bash
npm run build
```

Vollständiger Build mit Hosted-UI5-Core und lokalem Preview-Server:

```bash
npm run start:full
```

Deployment (GitHub Pages):

```bash
npm run deploy
```

ZIP-Artefakt erzeugen:

```bash
npm run deploy:zip
```

## Hinweis zu Datenquellen

Im Manifest ist ein OData-Service (`/sap/opu/odata/sap/KPI_SERVICE/`) konfiguriert.  
Für lokale Entwicklung stehen zusätzlich Mock-Daten unter `webapp/localService/data/` zur Verfügung.
