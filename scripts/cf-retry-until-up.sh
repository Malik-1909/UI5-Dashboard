#!/usr/bin/env bash
# Retry-Loop: versucht ui5-app-node neu zu starten, bis eine Instanz gesund ist.
# Grund: SAP BTP Trial findet zeitweise keine freie Cell ("no compatible cell with
# placement tag trial"). Der Loop pollt Status + Health-URL und meldet, sobald oben.
set -u

APP="ui5-app-node"
URL="https://ui5-app-node.cfapps.us10-001.hana.ondemand.com/health"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-30}"
SLEEP_BETWEEN="${SLEEP_BETWEEN:-120}"

ts() { date "+%Y-%m-%d %H:%M:%S %Z"; }

echo "[$(ts)] START Retry-Loop für $APP (max $MAX_ATTEMPTS Versuche, $SLEEP_BETWEEN s Pause)"

for i in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "----------------------------------------------------------------"
    echo "[$(ts)] Versuch $i/$MAX_ATTEMPTS"

    # 1) Erst prüfen ob sie evtl. schon (wieder) oben ist -> spart einen Restart
    code=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$URL" || echo "000")
    echo "[$(ts)] Health-Check $URL -> HTTP $code"
    if [ "$code" = "200" ]; then
        echo "[$(ts)] === APP IST OBEN (HTTP 200) nach Versuch $i ==="
        cf app "$APP" 2>&1 | grep -E '^#0|instances:' || true
        echo "APP_IS_UP"
        exit 0
    fi

    # 2) Restart versuchen (blockiert bis Erfolg oder CF-Timeout ~5 min bei fehlender Cell)
    echo "[$(ts)] Starte 'cf restart $APP' ..."
    if cf restart "$APP" >/tmp/cf_restart_attempt.log 2>&1; then
        echo "[$(ts)] cf restart meldet Erfolg — verifiziere per Health-Check"
        code=$(curl -s -o /dev/null -w '%{http_code}' -m 15 "$URL" || echo "000")
        echo "[$(ts)] Health-Check nach Restart -> HTTP $code"
        if [ "$code" = "200" ]; then
            echo "[$(ts)] === APP IST OBEN (HTTP 200) nach Versuch $i ==="
            echo "APP_IS_UP"
            exit 0
        fi
    else
        # Zeige nur die relevante Fehlerursache, nicht das ganze Rauschen
        reason=$(grep -m1 -E "no compatible cell|Timed out|CRASHED|FAILED|Error" /tmp/cf_restart_attempt.log | head -1)
        echo "[$(ts)] cf restart fehlgeschlagen: ${reason:-unbekannt}"
    fi

    if [ "$i" -lt "$MAX_ATTEMPTS" ]; then
        echo "[$(ts)] Warte ${SLEEP_BETWEEN}s bis zum nächsten Versuch ..."
        sleep "$SLEEP_BETWEEN"
    fi
done

echo "[$(ts)] === AUFGEGEBEN nach $MAX_ATTEMPTS Versuchen — App weiterhin down (keine Trial-Cell). ==="
echo "APP_STILL_DOWN"
exit 1
