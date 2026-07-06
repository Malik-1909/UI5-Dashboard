# Logs

## Besucher-Tracking (`visits.jsonl`)

Lokal schreibt `POST /api/track` Einträge nach `logs/visits.jsonl` (gitignored).
Auf **BTP** landen dieselben Zeilen in **stdout** → `cf logs ui5-app-node --recent`.

### Test lokal

1. Dev-Server neu starten (`npm run start`)
2. App öffnen mit Slug, z. B. `http://localhost:8080/index.html?ref=test-slug`
3. Eine Seite anklicken (z. B. Projekt)
4. Log prüfen:

```bash
tail -f logs/visits.jsonl
```

### Bewerbungs-Links

Gleiche BTP-URL, pro Bewerbung eigener Slug:

```
https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/?ref=sap-jul26
```

Der Slug muss nirgends vorab registriert werden – er wird aus der URL gelesen und mitgeloggt.

### Format (JSON pro Zeile)

```json
{"ts":"2026-07-06T19:30:00.000Z","event":"session_start","ref":"sap-jul26"}
{"ts":"2026-07-06T19:30:05.000Z","event":"page_view","ref":"sap-jul26","route":"project"}
{"ts":"2026-07-06T19:33:00.000Z","event":"session_end","ref":"sap-jul26","durationSec":175}
```

| Feld | Bedeutung |
|------|-----------|
| `ts` | Zeitstempel (UTC) |
| `event` | `session_start`, `page_view`, `session_end` |
| `ref` | Slug aus `?ref=…` (Bewerbungs-Zuordnung) |
| `route` | Nur bei `page_view` – UI5-Route (`main`, `project`, …) |
| `durationSec` | Nur bei `session_end` – Verweildauer in Sekunden |

Neuesten Eintrag ansehen: `tail -1 logs/visits.jsonl`

### Logs auf BTP lesen

```bash
cf logs ui5-app-node --recent | grep visit-track
```

---

## BTP Keep-Alive Log

Die GitHub Action **BTP Trial Keep-Alive** protokolliert jeden stündlichen Check in der **Job Summary** des Workflow-Laufs (nicht mehr als Git-Commit im Repo).

## Ansehen

GitHub → **Actions** → **BTP Trial Keep-Alive** → Lauf öffnen → **Summary**

## Format (JSON)

```json
{"ts":"2026-07-02T20:00:00Z","initial":"up","final":"up","action":"none","healthUrl":"https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/health","workflowRun":"https://github.com/..."}
```

| Feld | Bedeutung |
|------|-----------|
| `ts` | Zeitstempel (UTC) |
| `initial` | Status beim Check: `up` oder `down` |
| `final` | Status nach ggf. Restart: `up` oder `down` |
| `action` | `none`, `cf_start` oder `cf_start_failed` |
| `healthUrl` | Geprüfte Health-URL |
| `workflowRun` | Link zum GitHub-Actions-Lauf |
