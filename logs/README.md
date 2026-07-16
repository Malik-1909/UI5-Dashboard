# Logs

## Besucher-Tracking (Referral)

Minimal und datensparsam: `POST /api/track` speichert pro geöffnetem Link **nur** den
Zeitpunkt und das selbst vergebene Kürzel aus `?ref=…`. **Keine** Cookies, IP-Adressen,
Session-IDs, Routen oder Verweildauer. Ohne `ref` im Link wird nichts erfasst.

**Persistenz:**

- **BTP / Produktiv:** Insert nach **Supabase** (Tabelle `visits`), sofern `SUPABASE_URL`
  und `SUPABASE_SERVICE_ROLE_KEY` gesetzt sind → überlebt App-Neustarts (Keep-Alive).
- **Lokal ohne Supabase:** `logs/visits.jsonl` (gitignored).
- **Immer zusätzlich:** stdout → `cf logs ui5-app-node --recent`.

### Bewerbungs-Links

Gleiche BTP-URL, pro Kanal/Firma ein eigener Slug (muss `?ref=` **vor** einem `#` stehen):

```
https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/?ref=sap-jul26
```

Der Slug muss nirgends vorab registriert werden – er wird aus der URL gelesen und gespeichert.
Erlaubte Zeichen: `a–z A–Z 0–9 . _ -` (max. 64), Rest wird serverseitig entfernt.

### Format (JSON pro Zeile / Tabellenzeile)

```json
{"ts":"2026-07-16T19:30:00.000Z","ref":"sap-jul26"}
```

| Feld | Bedeutung |
|------|-----------|
| `ts` | Zeitstempel (UTC) |
| `ref` | Slug aus `?ref=…` (Kanal-/Firmen-Zuordnung) |

### Auswertung

**Supabase (dauerhaft, empfohlen)** – im SQL Editor:

```sql
select ref, count(*) as opens, min(ts) as first_open, max(ts) as last_open
from visits
group by ref
order by opens desc;
```

**Lokal:** `tail -f logs/visits.jsonl`

**BTP-Puffer (kurzlebig):** `cf logs ui5-app-node --recent | grep visit-track`

### Test lokal

1. Dev-Server neu starten (`npm run start`)
2. App öffnen mit Slug, z. B. `http://localhost:8080/index.html?ref=test-slug`
3. Log prüfen: `tail -f logs/visits.jsonl`

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
