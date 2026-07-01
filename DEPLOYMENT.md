# Deployment

## Deployment-Matrix

| Ziel | Befehl | SAP-Daten | KI | Hinweis |
|------|--------|-----------|-----|---------|
| GitHub Pages | `npm run deploy` | Mock | StaticChatMock | Öffentliche Demo (Standard) |
| GitHub Pages (legacy) | `npm run deploy:gh-pages-branch` | Mock | StaticChatMock | Nur optional/fallback |
| BTP Staticfile (interim) | `npm run deploy:zip` | Mock* | Nein* | Nur Frontend – siehe unten |
| BTP mit Backend (geplant) | – | Sandbox | Groq | Node-App auf CF – nächster Schritt |

\* Ohne Backend versucht die App `/api/sap/*` und `/api/chat` – Antworten scheitern, Mock-Fallback greift.

---

## GitHub Pages

```bash
npm run deploy
```

Alternativ manuell in GitHub Actions: Repository → Actions → „Deploy to GitHub Pages“ → `workflow_dispatch`.

### Voraussetzungen für `npm run deploy`

- `GITHUB_TOKEN` oder `GH_TOKEN` ist lokal gesetzt.
- Empfohlen: Personal access token (classic) mit Scopes `repo` und `workflow`.

Beispiel:

```bash
export GITHUB_TOKEN="<token>"
npm run deploy
```

### Mini-Checkliste

1. `npm run deploy`
2. Actions-Run ist `success`
3. Live-Seite mit Hard Refresh prüfen (`Cmd+Shift+R`)

### Troubleshooting

- **`Missing token`** → Token als `GITHUB_TOKEN`/`GH_TOKEN` setzen.
- **`403 Resource not accessible by personal access token`** → Scopes `repo` + `workflow` prüfen, danach Token neu exportieren.
- **Deploy success, aber alte Inhalte** → Hard Refresh/Inkognito + kurze CDN-Verzögerung beachten.

Vorbereitung in `scripts/prepare-ghpages.js`: UI5 **1.120** vom CDN, `base href`, SPA-404, `.nojekyll`.

---

## SAP BTP (Cloud Foundry) – Staticfile (interim)

Aktuell nur das **statische Frontend** – für Live-Daten und KI folgt ein Node-Backend (siehe Roadmap in README).

### Voraussetzungen

- SAP BTP Subaccount mit Cloud Foundry
- CF CLI: `cf login`

### ZIP erstellen

```bash
npm run deploy:zip
```

Erzeugt `ui5-vizframe-app.zip` (~44 Dateien, UI5 vom CDN **1.120**).

### Im BTP Deploy-Dialog

1. **File location:** `ui5-vizframe-app.zip`
2. **Manifest location:** `manifest.yml` (Projektroot)
3. **Deploy**

### Benötigte Dateien

| Datei | Zweck |
|-------|-------|
| `ui5-vizframe-app.zip` | Inhalt von `dist/` im ZIP-Root |
| `manifest.yml` | CF Staticfile Buildpack, 256M RAM |

### Troubleshooting

- **404 auf Routen:** `Staticfile` enthält `pushstate: enabled`
- **Weißer Bildschirm:** ZIP-Root muss `index.html` enthalten (nicht `dist/` als Ordner)
- **Falsche ZIP:** Nur `dist/`-Inhalt zippen, nicht `node_modules`

---

## SAP BTP – Vollständiges Setup (geplant)

Ziel: dieselbe Funktion wie lokal (`npm run start`).

1. **Node/Express-App** auf CF – statisches `dist/` + Routen `/api/sap/*` und `/api/chat`
2. **Umgebungsvariablen** auf CF: `GROQ_API_KEY`, `SAP_API_KEY`
3. **Buildpack:** `nodejs_buildpack` statt `staticfile_buildpack`
4. GitHub Pages unverändert als Demo-Fallback

Die UI5-Oberfläche bleibt unverändert; nur das Hosting-Backend wird ergänzt.
