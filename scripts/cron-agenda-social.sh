#!/usr/bin/env bash
# Cron de las stories de agenda - 2x/dia (mediodia y tarde).
# Dispara el systemd service quenoticia-agenda.service (mediodia, todos los
# eventos de hoy) o quenoticia-agenda-tarde.service (17:15, solo eventos
# >= 17:00 con dedupe del mediodia). Ambos corren build-agenda.ts en su propio
# cgroup (oneshot, memoria aislada).
#
# Uso: cron-agenda-social.sh [tarde]
#   sin args → mediodia (service quenoticia-agenda.service)
#   "tarde"  → service quenoticia-agenda-tarde.service (AGENDA_MIN_HOUR=17)
set -euo pipefail

LOG_FILE="/var/log/quenoticia/agenda-social.log"

MODO="${1:-mediodia}"
case "$MODO" in
  mediodia) SERVICE="quenoticia-agenda.service" ;;
  tarde)    SERVICE="quenoticia-agenda-tarde.service" ;;
  *) echo "uso: cron-agenda-social.sh [mediodia|tarde]"; exit 1 ;;
esac

ts() { date -Is; }

echo "$(ts) === cron-agenda-social ($MODO) start ===" >> "$LOG_FILE"

if sudo systemctl start "$SERVICE"; then
  echo "$(ts) OK: $SERVICE started" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: sudo systemctl start $SERVICE failed" >> "$LOG_FILE"
fi

echo "$(ts) === cron-agenda-social ($MODO) end ===" >> "$LOG_FILE"