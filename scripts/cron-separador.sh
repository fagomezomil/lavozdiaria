#!/usr/bin/env bash
# Cron del separador del feed IG/FB - 2x/dia, corre DESPUES del carrusel.
# Dispara el systemd service quenoticia-separador.service que corre el script
# standalone build-separador.ts en su propio cgroup (oneshot, memoria aislada).
#
# El script chequea cuantos carruseles se publicaron desde el ultimo separador.
# Si < 9 → no-op. Si >= 9 → genera 3 placas + publica 3 posts Buffer separados.
#
# Como 2 carruseles/dia → el separador dispara cada ~4.5 dias.
set -euo pipefail

LOG_FILE="/var/log/quenoticia/social.log"

ts() { date -Is; }

echo "$(ts) === cron-separador start ===" >> "$LOG_FILE"

if sudo systemctl start quenoticia-separador.service; then
  echo "$(ts) OK: quenoticia-separador.service started" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: sudo systemctl start failed" >> "$LOG_FILE"
fi

echo "$(ts) === cron-separador end ===" >> "$LOG_FILE"