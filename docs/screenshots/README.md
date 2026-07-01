# Screenshots

Vorschau-Bilder für die README.

| Datei | Inhalt |
|-------|--------|
| `main-dashboard.png` | Startseite mit Prozesskacheln |
| `l2c-detail.png` | Lead-to-Cash Detailseite (KPI + Diagramme) |

## Neu erzeugen

```bash
npm run screenshots
```

Startet den Dev-Server automatisch, erzeugt die PNGs und beendet den Server wieder.

Alternativ (Server läuft bereits):

```bash
npx ui5 serve --port 8090
npm run screenshots:only
```
