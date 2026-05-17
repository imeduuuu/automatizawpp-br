#!/bin/bash
LOG=/var/log/automatizawpp-followups.log
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "[$TIMESTAMP] Ejecutando follow-ups..." >> $LOG
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/followups/run -H 'Content-Type: application/json')
if [ "$HTTP_CODE" = "200" ]; then
  echo "[$TIMESTAMP] ✅ Follow-ups ejecutados exitosamente (HTTP $HTTP_CODE)" >> $LOG
else
  echo "[$TIMESTAMP] ❌ Error al ejecutar follow-ups (HTTP $HTTP_CODE)" >> $LOG
fi
