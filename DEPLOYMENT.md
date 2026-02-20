# Deployment auf SAP BTP (Cloud Foundry)

## Voraussetzungen

- SAP BTP Subaccount mit Cloud Foundry
- CF CLI installiert (`cf --version`)
- Eingeloggt: `cf login` (API-Endpunkt, E-Mail, Passwort)

---

## ZIP für SAP BTP Deploy-Dialog erstellen

**Wichtig:** Die ZIP enthält nur ~44 Dateien (unter dem CF-Limit von 5000). UI5 wird zur Laufzeit vom CDN geladen.

### Ein Befehl (empfohlen)

```bash
npm run deploy:zip
```

Erzeugt `ui5-vizframe-app.zip` im Projektroot.

### Manuell

```bash
npm run build
sed -i '' 's|src="resources/sap-ui-core.js"|src="https://ui5.sap.com/1.130.0/resources/sap-ui-core.js"|g' dist/index.html
echo "pushstate: enabled" > dist/Staticfile
cd dist && zip -r ../ui5-vizframe-app.zip . && cd ..
```

### Im SAP BTP Deploy-Dialog

1. **File location:** `ui5-vizframe-app.zip` auswählen
2. **Manifest location:** `manifest.yml` auswählen (im Projektroot)
3. **Deploy** klicken

---

## Benötigte Dateien

| Datei | Zweck |
|-------|-------|
| **ui5-vizframe-app.zip** | Enthält den Inhalt von `dist/` im ZIP-Root (index.html, Component.js, etc.). UI5 wird vom CDN geladen. |
| **manifest.yml** | CF-Konfiguration (App-Name, Buildpack, Memory) |

---

## Troubleshooting

- **Deployment schlägt fehl:** „View Details“ im Fehlerdialog prüfen – oft fehlt Memory (256M eingestellt) oder der Buildpack wird nicht erkannt
- **Falsche ZIP:** Wenn du das ganze Projekt (inkl. node_modules) zippst, entstehen 100.000+ Dateien – das führt zu Fehlern. Immer nur `dist/`-Inhalt verwenden
- **404 auf Routen:** Die `Staticfile` in der ZIP enthält `pushstate: enabled` für SPA-Routing
- **Weißer Bildschirm:** Die ZIP muss `index.html` im Root haben (Inhalt von dist/, nicht dist/ als Ordner). Manifest `path: .` verwenden. Prüfe in der Browser-Konsole (F12) auf Fehler (z.B. 404 für Component.js oder CORS bei CDN-Load)
