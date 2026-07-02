# BTP Keep-Alive Log

Die GitHub Action **BTP Trial Keep-Alive** schreibt hier stündlich einen Eintrag nach `btp-keepalive.jsonl`.

## Format (JSON Lines)

Jede Zeile ist ein JSON-Objekt:

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

## Ansehen

- Datei im Repo: `logs/btp-keepalive.jsonl`
- GitHub Actions → **BTP Trial Keep-Alive** → Job Summary (lesbare Kurzfassung)

Es werden maximal **500** Einträge behalten.
