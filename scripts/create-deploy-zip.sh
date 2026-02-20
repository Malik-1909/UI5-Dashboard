#!/bin/bash
# Erstellt die Deployment-ZIP für SAP BTP
# Nur dist-Inhalt, KEIN node_modules

set -e
cd "$(dirname "$0")/.."

echo "Build wird ausgeführt..."
npm run build

echo "Staticfile wird in dist kopiert..."
echo "pushstate: enabled" > dist/Staticfile

echo "ZIP wird erstellt (nur dist-Inhalt)..."
cd dist
zip -r ../ui5-vizframe-app.zip . -x "*.DS_Store"
cd ..

echo "Fertig: ui5-vizframe-app.zip"
echo "Dateien in ZIP: $(unzip -l ui5-vizframe-app.zip | tail -1)"
