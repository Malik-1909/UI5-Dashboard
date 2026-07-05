# BTP Keep-Alive Log

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
