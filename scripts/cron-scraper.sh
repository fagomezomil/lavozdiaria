#!/usr/bin/env bash
# Cron del scraper Python - 11 runs/día (schedule variable, ventana 06:00-01:00)
# Recibe el time slot como argumento ($1) y lo pasa a main.py --time.
# Las cuotas por fuente/sección están definidas en SCHEDULE dict de main.py.
# timeout 600s: las fuentes pueden tardar 2-5min (comunicacionsmt usa Playwright).
set -euo pipefail

SCRAPER_DIR="/opt/scraper"
PYTHON="${SCRAPER_DIR}/.venv/bin/python"
LOG_FILE="/var/log/scraper/scraper.log"

ts() { date -Is; }

TIME_SLOT="${1:-}"

echo "$(ts) === cron-scraper start (slot=${TIME_SLOT:-none}) ===" >> "$LOG_FILE"

if [ -n "$TIME_SLOT" ]; then
  CMD="${PYTHON} ${SCRAPER_DIR}/main.py --once --time ${TIME_SLOT}"
else
  CMD="${PYTHON} ${SCRAPER_DIR}/main.py --once"
fi

if timeout 600 $CMD >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK: scraper completed (slot=${TIME_SLOT:-none})" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) FAIL: scraper exit ${rc} (slot=${TIME_SLOT:-none})" >> "$LOG_FILE"
fi

echo "$(ts) === cron-scraper end ===" >> "$LOG_FILE"
