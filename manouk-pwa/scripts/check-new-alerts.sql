-- Vérifier si de nouvelles alertes ont été créées
SELECT 
  id,
  item_name,
  current_stock,
  alert_threshold,
  email_sent,
  created_at
FROM stock_alerts
ORDER BY created_at DESC
LIMIT 10;
