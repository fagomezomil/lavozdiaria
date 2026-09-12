#!/usr/bin/env bash
# Cron de agenda cultural - 3x/semana (dom/mar/jue 06:00 ART)
# Corre los 4 scrapers (turismo_tucuman, entradanet alberdi/cultura, aspx mercedes_sosa)
# con --days 30 (solo próximos 30 días), después insert_events con dedup inter-fuente.
# SMT excluido (home rota, 0 eventos descubiertos). Reactivar cuando se arregle.
# Log: /var/log/scraper/agenda.log
set -uo pipefail

SCRAPER_DIR="/opt/scraper"
PYTHON="${SCRAPER_DIR}/.venv/bin/python"
LOG_FILE="/var/log/scraper/agenda.log"

ts() { date -Is; }

echo "$(ts) === cron-agenda start ===" >> "$LOG_FILE"

cd "$SCRAPER_DIR"

# 1. Scrapear 4 fuentes (solo próximos 30 días)
echo "$(ts) Scrapeando turismo_tucuman..." >> "$LOG_FILE"
if timeout 120 "${PYTHON}" -m agenda.turismo_tucuman --days 30 >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK turismo_tucuman" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) WARN turismo_tucuman exit ${rc}" >> "$LOG_FILE"
fi

echo "$(ts) Scrapeando entradanet alberdi..." >> "$LOG_FILE"
if timeout 120 "${PYTHON}" -m agenda.entradanet --site alberdi --days 30 >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK entradanet alberdi" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) WARN entradanet alberdi exit ${rc}" >> "$LOG_FILE"
fi

echo "$(ts) Scrapeando entradanet cultura..." >> "$LOG_FILE"
if timeout 120 "${PYTHON}" -m agenda.entradanet --site cultura --days 30 >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK entradanet cultura" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) WARN entradanet cultura exit ${rc}" >> "$LOG_FILE"
fi

echo "$(ts) Scrapeando mercedes_sosa..." >> "$LOG_FILE"
if timeout 180 "${PYTHON}" -m agenda.aspx_sites --site mercedes_sosa --days 30 >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK mercedes_sosa" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) WARN mercedes_sosa exit ${rc}" >> "$LOG_FILE"
fi

# 2. Upsert a Supabase con dedup inter-fuente (mercedes_sosa prioridad)
echo "$(ts) Insertando eventos..." >> "$LOG_FILE"
if timeout 120 "${PYTHON}" -m agenda.insert_events >> "$LOG_FILE" 2>&1; then
  echo "$(ts) OK insert_events" >> "$LOG_FILE"
else
  rc=$?
  echo "$(ts) WARN insert_events exit ${rc}" >> "$LOG_FILE"
fi

echo "$(ts) === cron-agenda end ===" >> "$LOG_FILE"