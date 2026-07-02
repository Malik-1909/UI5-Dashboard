#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI fehlt. Installiere es oder setze Secrets manuell in GitHub:"
  echo "https://github.com/Malik-1909/UI5-Dashboard/settings/secrets/actions"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Bitte zuerst: gh auth login"
  exit 1
fi

CF_API="${CF_API:-https://api.cf.us10-001.hana.ondemand.com}"
CF_USERNAME="${CF_USERNAME:-}"
CF_PASSWORD="${CF_PASSWORD:-}"

if [ -z "$CF_USERNAME" ]; then
  read -r -p "BTP Login (E-Mail): " CF_USERNAME
fi

if [ -z "$CF_PASSWORD" ]; then
  read -r -s -p "BTP Passwort: " CF_PASSWORD
  echo
fi

gh secret set CF_API --body "$CF_API"
gh secret set CF_USERNAME --body "$CF_USERNAME"
gh secret set CF_PASSWORD --body "$CF_PASSWORD"
gh secret set CF_ORG --body "${CF_ORG:-94fccd54trial}"
gh secret set CF_SPACE --body "${CF_SPACE:-dev}"
gh secret set CF_APP --body "${CF_APP:-ui5-app-node}"
gh secret set CF_APP_URL --body "${CF_APP_URL:-https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/health}"

echo "GitHub Secrets gesetzt. Test: npm run btp:keepalive"
