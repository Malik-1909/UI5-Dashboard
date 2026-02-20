@echo off
REM Erstellt die Deployment-ZIP für SAP BTP
REM Nur dist-Inhalt, KEIN node_modules

cd /d "%~dp0\.."

echo Build wird ausgeführt...
call npm run build

echo Staticfile wird in dist erstellt...
echo pushstate: enabled > dist\Staticfile

echo ZIP wird erstellt (nur dist-Inhalt)...
cd dist
powershell Compress-Archive -Path * -DestinationPath ..\ui5-vizframe-app.zip -Force
cd ..

echo Fertig: ui5-vizframe-app.zip
echo.
echo Im SAP BTP Deploy-Dialog:
echo - File location: ui5-vizframe-app.zip
echo - Manifest location: manifest.yml
pause
