#!/usr/bin/env bash
# Cron de placas de resultados de partidos - cada 15 min en franja de partidos
# (vie/sab/dom 12:00-23:45 + lun 00:00-02:45, ver /etc/cron.d/quenoticia).
# 1. Refresca resultados con futbol.py (incremental hoy+ayer, ~3s).
# 2. Dispara el systemd service quenoticia-partido.service (oneshot, cgroup
#    propio) que corre build-partido.ts: dedupe + render + R2 + Buffer.
#
# Log: /var/log/quenoticia/partido.log (cron) + journalctl (service).
set -uo pipefail

LOG_FILE="/var/log/quenoticia/partido.log"
SCRAPER_DIR="/opt/scraper"
PYTHON="${SCRAPER_DIR}/.venv/bin/python"

ts() { date -Is; }

echo "$(ts) === cron-partido start ===" >> "$LOG_FILE"

# 1. Refrescar resultados (hoy+ayer). Si falla, igual se intenta publicar con
#    lo que haya en DB (puede ser un retry de un partido fallido).
cd "$SCRAPER_DIR"
if timeout 120 "${PYTHON}" futbol.py >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK futbol.py" >> "$LOG_FILE"
else
  echo "$(ts) WARN futbol.py exit $?" >> "$LOG_FILE"
fi

# 2. Publicar pendientes.
if sudo systemctl start quenoticia-partido.service; then
  echo "$(ts) OK: quenoticia-partido.service started" >> "$LOG_FILE"
else
  echo "$(ts) FAIL: sudo systemctl start quenoticia-partido.service failed" >> "$LOG_FILE"
fi

echo "$(ts) === cron-partido end ===" >> "$LOG_FILE"