#!/usr/bin/env bash
# Cron de fixture de fútbol - 2x/semana (lunes + viernes)
# Scrapea JSON export de matchesio (Liga Profesional Argentina 2026),
# upsert a Supabase sports_matches.
# Log: /var/log/scraper/futbol.log
set -uo pipefail

SCRAPER_DIR="/opt/scraper"
PYTHON="${SCRAPER_DIR}/.venv/bin/python"
LOG_FILE="/var/log/scraper/futbol.log"

ts() { date -Is; }

echo "$(ts) === cron-futbol start ===" >> "$LOG_FILE"

cd "$SCRAPER_DIR"

echo "$(ts) Scrapeando fixture Liga Profesional..." >> "$LOG_FILE"
if timeout 120 "${PYTHON}" futbol.py >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK futbol" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) WARN futbol exit ${rc}" >> "$LOG_FILE"
fi

echo "$(ts) === cron-futbol end ===" >> "$LOG_FILE"