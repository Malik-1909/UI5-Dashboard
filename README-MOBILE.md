# Cursor auf dem Handy – Cloud Agents

Diese Anleitung beschreibt, wie du **Cursor** vom Smartphone aus nutzt und dabei **Cloud Agents** einsetzt. Cloud Agents sind autonome KI-Agenten, die in isolierten VMs in der Cloud arbeiten – nicht auf deinem Laptop oder Handy.

## Was ist Cursor Mobile?

Cursor bietet zwei Wege, Agenten vom Handy aus zu starten und zu verfolgen:

| Option | Plattform | Beschreibung |
|--------|-----------|--------------|
| **Cursor for iOS** | Native iOS-App (Public Beta) | Vollwertige mobile Oberfläche; Agenten starten wie am Desktop |
| **Web / PWA** | [cursor.com/agents](https://cursor.com/agents) | Im Browser nutzbar; auf iOS und Android als App auf dem Home Screen installierbar |

**Kernidee:** Du musst nicht am Laptop bleiben. Vom Handy aus kannst du **Cloud Agents** starten und verfolgen oder lokale Agenten per **Remote Control** steuern.

### iOS-App (Public Beta)

- Verfügbar auf allen **Paid Plans** (Pro, Pro Plus, Ultra, Teams)
- Push-Benachrichtigungen und **Live Activities** auf dem Sperrbildschirm
- Pull Requests direkt aus der App reviewen und mergen
- Voice Input, Slash Commands und Modellauswahl wie am Desktop
- Download: [cursor.com/download](https://cursor.com/download)

### Android

Es gibt **keine native Android-App**. Stattdessen nutzt du die Web-Oberfläche unter [cursor.com/agents](https://cursor.com/agents) oder installierst sie als **PWA** (Progressive Web App).

## Was sind Cloud Agents?

Cloud Agents nutzen dieselbe Agent-Logik wie lokale Agenten, laufen aber in **isolierten VMs in der Cloud** mit einer vollständigen Entwicklungsumgebung.

```
Handy → Cursor Mobile / Web → Cloud Agent → VM (Repo, Dependencies, Tests)
                                      ↓
                              Branch + merge-ready PR + Artifacts
```

### Ablauf

1. **Aufgabe beschreiben** – optional mit Bildern oder zusätzlichem Kontext
2. **Agent klont das Repo** und arbeitet auf einem separaten Branch
3. **Autonome Arbeit** – Code schreiben, bauen, testen, ggf. Browser/Desktop nutzen
4. **Pull Request** mit **Artifacts** (Screenshots, Videos, Logs)
5. **Benachrichtigung** per Push, Slack, E-Mail oder Web
6. **Review und Merge** – auch direkt vom Handy

### Warum Cloud statt lokal auf dem Handy?

- Der Laptop kann zugeklappt werden – der Agent läuft weiter
- Mehrere Agenten **parallel**, ohne lokale Ressourcen zu belasten
- Der Agent kann Software **selbst testen** und iterieren
- Verfügbar überall: Web, Desktop, Mobile (iOS + PWA), Slack, GitHub, API

> **Hinweis:** Früher hießen Cloud Agents **Background Agents**. Die Bezeichnung wurde in **Cloud Agents** umbenannt.

## Voraussetzungen

Bevor du Cloud Agents vom Handy starten kannst:

- **Paid Plan** (Pro, Pro Plus, Ultra oder Teams)
- **Git-Integration** – ein Admin muss GitHub, GitLab, Bitbucket oder Azure DevOps verbinden
- **Schreibzugriff** auf das Repository (und ggf. abhängige Repos)
- **Kein Legacy Privacy Mode** – Cloud Agents funktionieren damit nicht
- Beim ersten Start: **Spend Limit** für API-basierte Abrechnung festlegen

## Cloud Agents vom Handy starten

### Option A: Native iOS-App

1. App installieren ([cursor.com/download](https://cursor.com/download) → „Try mobile agent“ / App Store)
2. Mit deinem Cursor-Account anmelden (Paid Plan)
3. **Repository wählen** und Agent starten – wie am Desktop
4. Modell wählen, Prompt eingeben (auch per Voice oder Slash Commands)
5. App verlassen – du erhältst **Push-Benachrichtigungen** und **Live Activities**

### Option B: Web / PWA (iOS und Android)

1. [cursor.com/agents](https://cursor.com/agents) im Browser öffnen
2. Anmelden und Git-Anbieter verbinden
3. Repository und Branch wählen, Prompt senden
4. **Als App installieren:**
   - **iOS (Safari):** Teilen → „Zum Home-Bildschirm“
   - **Android (Chrome):** Menü → „App installieren“

### Option C: Weitere Startpunkte

Cloud Agents lassen sich auch von anderen Kanälen aus starten:

| Kanal | So startest du |
|-------|----------------|
| **Cursor Desktop** | „Cloud“ im Dropdown unter dem Agent-Eingabefeld wählen |
| **Slack** | `@cursor` mit Aufgabenbeschreibung |
| **GitHub / Bitbucket** | `@cursor` in einem PR oder Issue kommentieren |
| **Linear** | `@cursor` Befehl |
| **API** | Programmatisch über die Cursor API |

## Remote Control (lokale Agenten vom Handy)

Neben Cloud Agents kannst du auch **lokale Agenten** auf deinem Rechner vom iPhone aus steuern:

- Der Agent läuft auf **deinem Computer**, du gibst Anweisungen vom Handy
- Dein Rechner muss erreichbar bleiben (Einstellung „Computer wach halten“)
- Auf **Teams/Enterprise:** Admin muss Remote Control im Dashboard aktivieren

## Handoff: Lokal ↔ Cloud

Du kannst Arbeit zwischen lokaler und Cloud-Umgebung verschieben:

- **Plan an Cloud senden** oder einen laufenden Agent in die Cloud verschieben
- **Cloud-Session zurück auf den Desktop** holen, um lokal zu testen, bevor du mergst

## Wichtige Features

| Feature | Beschreibung |
|---------|--------------|
| **Artifacts** | Screenshots, Videos und Logs zum Review der Änderungen |
| **Remote Desktop** | Agent-Desktop übernehmen und Software selbst testen |
| **Parallel Agents** | Mehrere Agenten gleichzeitig in verschiedenen Repos |
| **MCP-Server** | Zugriff auf externe Tools (Datenbanken, APIs, Drittanbieter) |
| **Multi-Repo** | Aufgaben über Frontend, Backend und Shared Libraries hinweg |
| **PR-Merge** | Pull Requests direkt aus der Mobile-App mergen |
| **Max Mode** | Cloud Agents laufen immer im Max Mode (kein Toggle) |

## Einschränkungen

- **Legacy Privacy Mode** blockiert Cloud Agents vollständig
- **Keine native Android-App** – nur Web/PWA
- **Keine iPad-App** (geplant)
- **User-level Hooks** (`~/.cursor/hooks.json`) laufen in Cloud-VMs nicht
- **IDE-spezifische Hooks** (Tab, workspaceOpen) laufen in der Cloud nicht
- Repo-Liste in der iOS-App aktualisiert sich ggf. nicht sofort nach neuen Repos
- Abrechnung erfolgt über **API Pricing** – Spend Limit beachten

## Umgebung konfigurieren

Cloud Agents sind nur so gut wie ihre Entwicklungsumgebung. Konfiguration über:

- **Agent-led Setup** – der Agent richtet die Umgebung selbst ein
- **Snapshot** – gespeicherte Umgebung wiederverwenden
- **Dockerfile** in `.cursor/environment.json`

Secrets und Umgebungsvariablen: [cursor.com/dashboard/cloud-agents](https://cursor.com/dashboard/cloud-agents)

## Nützliche Links

| Ressource | URL |
|-----------|-----|
| Cloud Agents (Web) | [cursor.com/agents](https://cursor.com/agents) |
| Dokumentation | [cursor.com/docs/cloud-agent](https://cursor.com/docs/cloud-agent) |
| Setup | [cursor.com/docs/cloud-agent/setup](https://cursor.com/docs/cloud-agent/setup) |
| Capabilities | [cursor.com/docs/cloud-agent/capabilities](https://cursor.com/docs/cloud-agent/capabilities) |
| Security | [cursor.com/docs/cloud-agent/security](https://cursor.com/docs/cloud-agent/security) |
| Pricing | [cursor.com/docs/account/pricing](https://cursor.com/docs/account/pricing) |
| Download (iOS) | [cursor.com/download](https://cursor.com/download) |
| Onboarding | [cursor.com/onboard](https://cursor.com/onboard) |

## Kurzfassung

**Cursor Mobile** = native **iOS-App** + **Web/PWA** auf Android. **Cloud Agents** = autonome Agenten in der Cloud, die du vom Handy startest, reviewest und mergst – ohne vollen IDE-Editor auf dem Smartphone. Der größte Mehrwert liegt in **always-on Cloud Agents**, **Artifacts** zum Review und dem **Handoff** zwischen lokaler und Cloud-Umgebung.
