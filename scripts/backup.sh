#!/bin/bash
# ════════════════════════════════════════════════════════════════════════════
# backup.sh — Sauvegarde automatique de la base PostgreSQL
# Application : ID'EES Suivi Parcours
#
# Usage :
#   ./backup.sh                   → sauvegarde immédiate
#   crontab -e → 0 2 * * * /opt/idees/scripts/backup.sh
#                                  → chaque nuit à 2h00
#
# Prérequis :
#   - PostgreSQL client (pg_dump) installé sur le serveur
#   - Variables ci-dessous correctement remplies
#   - Dossier BACKUP_DIR existant et accessible en écriture
# ════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── CONFIGURATION — À ADAPTER À VOTRE ENVIRONNEMENT ─────────────────────────
DB_HOST="localhost"               # Adresse du serveur PostgreSQL
DB_PORT="5432"                    # Port PostgreSQL (5432 par défaut)
DB_NAME="postgres"                # Nom de la base de données
DB_USER="postgres"                # Utilisateur PostgreSQL
# DB_PASSWORD : définir dans ~/.pgpass ou PGPASSWORD (ne pas mettre ici)

BACKUP_DIR="/opt/idees/backups"   # Dossier de destination des sauvegardes
RETENTION_DAYS=30                 # Nombre de jours de rétention locale
LOG_FILE="/opt/idees/logs/backup.log"  # Fichier de log

# Notification par email en cas d'erreur (laisser vide pour désactiver)
ALERT_EMAIL=""                    # ex : admin@idees.fr
# ─────────────────────────────────────────────────────────────────────────────

# ── Horodatage ────────────────────────────────────────────────────────────────
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_LABEL=$(date +"%Y-%m-%d")
BACKUP_FILE="${BACKUP_DIR}/idees_suivi_${TIMESTAMP}.sql.gz"

# ── Créer les dossiers si nécessaire ─────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"
mkdir -p "$(dirname "${LOG_FILE}")"

# ── Fonction de log ───────────────────────────────────────────────────────────
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# ── Fonction d'alerte email ───────────────────────────────────────────────────
send_alert() {
  if [ -n "${ALERT_EMAIL}" ]; then
    echo "$1" | mail -s "[ALERTE] Sauvegarde ID'EES échouée - ${DATE_LABEL}" "${ALERT_EMAIL}" || true
  fi
}

# ── Début de la sauvegarde ────────────────────────────────────────────────────
log "════════════════════════════════════════"
log "Démarrage sauvegarde : ${DB_NAME}@${DB_HOST}"
log "Destination : ${BACKUP_FILE}"

# ── Exécution pg_dump ─────────────────────────────────────────────────────────
if pg_dump \
     --host="${DB_HOST}" \
     --port="${DB_PORT}" \
     --username="${DB_USER}" \
     --dbname="${DB_NAME}" \
     --format=plain \
     --no-password \
     --verbose \
  | gzip -9 > "${BACKUP_FILE}" 2>>"${LOG_FILE}"; then

  BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
  log "✅ Sauvegarde réussie — Taille : ${BACKUP_SIZE}"

else
  log "❌ ERREUR : pg_dump a échoué"
  send_alert "La sauvegarde de la base '${DB_NAME}' du ${DATE_LABEL} a échoué. Vérifiez ${LOG_FILE}."
  exit 1
fi

# ── Vérification de l'intégrité (fichier non vide) ───────────────────────────
if [ ! -s "${BACKUP_FILE}" ]; then
  log "❌ ERREUR : le fichier de sauvegarde est vide"
  send_alert "La sauvegarde du ${DATE_LABEL} a produit un fichier vide. Vérifiez ${LOG_FILE}."
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# ── Nettoyage des anciennes sauvegardes ───────────────────────────────────────
log "Nettoyage des sauvegardes de plus de ${RETENTION_DAYS} jours…"
NB_DELETED=$(find "${BACKUP_DIR}" -name "idees_suivi_*.sql.gz" -mtime +${RETENTION_DAYS} -print | wc -l)
find "${BACKUP_DIR}" -name "idees_suivi_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
log "  → ${NB_DELETED} ancienne(s) sauvegarde(s) supprimée(s)"

# ── Résumé des sauvegardes conservées ────────────────────────────────────────
NB_BACKUPS=$(find "${BACKUP_DIR}" -name "idees_suivi_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "Sauvegardes conservées : ${NB_BACKUPS} fichier(s) — Total : ${TOTAL_SIZE}"

log "════════════════════════════════════════"
log "Sauvegarde terminée avec succès."

exit 0

# ════════════════════════════════════════════════════════════════════════════
# INSTRUCTIONS D'INSTALLATION
# ════════════════════════════════════════════════════════════════════════════
#
# 1. Copier ce script sur le serveur :
#    scp scripts/backup.sh admin@votre-serveur:/opt/idees/scripts/backup.sh
#
# 2. Rendre exécutable :
#    chmod +x /opt/idees/scripts/backup.sh
#
# 3. Configurer le mot de passe PostgreSQL sans le mettre dans ce fichier :
#    echo "localhost:5432:postgres:postgres:MOT_DE_PASSE" >> ~/.pgpass
#    chmod 600 ~/.pgpass
#
# 4. Tester manuellement :
#    /opt/idees/scripts/backup.sh
#
# 5. Programmer l'exécution automatique chaque nuit à 2h00 :
#    crontab -e
#    → ajouter la ligne :
#    0 2 * * * /opt/idees/scripts/backup.sh >> /opt/idees/logs/backup-cron.log 2>&1
#
# 6. Pour RESTAURER une sauvegarde :
#    gunzip -c /opt/idees/backups/idees_suivi_2026-05-02_02-00-00.sql.gz \
#      | psql --host=localhost --username=postgres --dbname=postgres
#
# ════════════════════════════════════════════════════════════════════════════
