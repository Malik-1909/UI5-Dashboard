# Deployment

## Deployment-Matrix

| Ziel | Befehl | SAP-Daten | KI | Hinweis |
|------|--------|-----------|-----|---------|
| GitHub Pages | `npm run deploy` | Mock | StaticChatMock | Öffentliche Demo (Standard) |
| GitHub Pages (legacy) | `npm run deploy:gh-pages-branch` | Mock | StaticChatMock | Nur optional/fallback |
| BTP Staticfile (interim) | `npm run deploy:zip` | Mock* | Nein* | Nur Frontend – siehe unten |
| BTP mit Backend (Node) | `cf push -f manifest-node.yml` | SAP via GitHub-Cache† | Groq | API-Keys als CF Env Vars |

\* Ohne Backend versucht die App `/api/sap/*` und `/api/chat` – Antworten scheitern, Mock-Fallback greift.

† BTP-Trial erreicht die SAP-Sandbox nicht direkt; die App liest einen stündlich per GitHub Action befüllten Cache. Details unten unter „SAP-Daten auf BTP“.

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

## SAP BTP – Node-Backend (Live-Daten + KI)

Ziel: dieselbe Funktion wie lokal (`npm run start`).

1. **Node-App** auf CF deployen:

```bash
cf login -a https://api.cf.us10-001.hana.ondemand.com
cf target -o <ORG> -s <SPACE>
npm run build:cf
cf push -f manifest-node.yml
```

2. **API-Keys serverseitig setzen** (nicht im Frontend, nicht im Manifest):

```bash
cf set-env ui5-app-node GROQ_API_KEY "<groq-key>"
cf set-env ui5-app-node SAP_API_KEY "<sap-key>"
cf restage ui5-app-node
```

3. Optionaler Check:

```bash
cf logs ui5-app-node --recent
```

4. GitHub Pages bleibt unverändert als Demo-Fallback

Die UI5-Oberfläche bleibt unverändert; nur das Hosting-Backend wird ergänzt.

---

## BTP Trial Keep-Alive (GitHub Actions)

**Problem:** Im BTP Trial werden Apps automatisch gestoppt (typisch nachts). Ein einfacher URL-Ping reicht nicht – die App hat 0 Instanzen und muss per `cf start` neu gestartet werden.

**Lösung:** Workflow `.github/workflows/btp-keepalive.yml` prüft **stündlich** `/health`, startet `ui5-app-node` nur bei Ausfall und protokolliert das Ergebnis in der **GitHub Actions Job Summary**. Auf GitHub Pages zeigt die App einen Hinweis, wenn die Live-Demo offline ist.

### Log prüfen

1. GitHub → Actions → **BTP Trial Keep-Alive** → letzter Run → **Summary**
2. Bei `action: cf_start_failed` → Secrets prüfen oder manuell `cf start ui5-app-node`

### Secrets (GitHub → Settings → Secrets → Actions)

| Secret | Pflicht | Beschreibung |
|--------|---------|--------------|
| `CF_API` | ja | z. B. `https://api.cf.us10-001.hana.ondemand.com` |
| `CF_USERNAME` | ja | BTP-Login |
| `CF_PASSWORD` | ja | BTP-Passwort |
| `CF_ORG` | nein | Default `94fccd54trial` |
| `CF_SPACE` | nein | Default `dev` |
| `CF_APP` | nein | Default `ui5-app-node` |
| `CF_APP_URL` | nein | Health-URL, Default `…/health` |

### Hinweis zur Nutzung

- Für **Portfolio-/Demo-Zwecke** im Trial ein pragmatischer Workaround ohne Pay-as-you-go.
- Kein Ersatz für produktiven Betrieb (kein SLA, Trial max. 90 Tage).
- Keys nur als GitHub Secrets – nie im Repo committen.

---

## SAP-Daten auf BTP (Cache über GitHub Actions)

**Problem:** Der BTP-Trial-Egress erreicht `sandbox.api.sap.com` (IP `157.133.171.110`) **nicht** – der TCP-Connect läuft in ein Timeout. Allgemeiner Internetzugang aus dem Container funktioniert (z. B. Groq/KI). Es ist eine Netzwerk-/Routing-Einschränkung im Trial, kein Code- oder Key-Fehler.

**Lösung:** Ein GitHub-Runner (freier Internetzugang) holt die SAP-Daten und legt sie als JSON ab; die BTP-App liest den Cache statt der Sandbox.

```
Workflow sap-cache.yml (stündlich)
  └─ scripts/fetch-sap-cache.mjs holt 6 SAP-Endpoints mit SAP_API_KEY
  └─ schreibt sap-cache/sap-cache.json
  └─ published auf Branch sap-cache-data

BTP: server.js  →  GET /api/sap-cache
  └─ holt raw.githubusercontent.com/.../sap-cache-data/sap-cache.json (erreichbar)
  └─ In-Memory-Cache 10 Min, stale-while-error

Browser: SapDataLoader
  └─ auf *.cfapps.* → /api/sap-cache (Cache), sonst → direkt Sandbox (lokal)
```

- **Lokal** (`npm run start`): unverändert direkter Sandbox-Zugriff (real-time).
- **BTP**: Daten stündlich frisch; bei Cache-Ausfall greift der Mock-Fallback.
- **API-Key** bleibt serverseitig im GitHub Secret – nie im Browser oder im JSON.

### Secret

| Secret | Pflicht | Beschreibung |
|--------|---------|--------------|
| `SAP_API_KEY` | ja | API-Key von https://api.sap.com (Settings → Show API Key) |

### Aktivieren

1. Secret `SAP_API_KEY` in GitHub → Settings → Secrets → Actions anlegen.
2. Workflow einmalig manuell starten: Actions → **SAP Data Cache** → **Run workflow** (erzeugt den Branch `sap-cache-data`).
3. BTP neu deployen (`npm run build:cf && cf push -f manifest-node.yml`).
4. Prüfen: `curl …/api/sap-cache` liefert JSON; Detailseiten-Badges zeigen „SAP API“.

Optionale Env-Var auf BTP: `SAP_CACHE_URL` überschreibt die Standard-Cache-URL.
