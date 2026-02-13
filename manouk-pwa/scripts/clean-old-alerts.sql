-- Nettoyer les anciennes alertes de test déjà envoyées
-- À exécuter dans Supabase SQL Editor

DELETE FROM stock_alerts 
WHERE email_sent = TRUE 
  AND created_at < NOW() - INTERVAL '1 day';

-- Afficher le nombre d'alertes restantes
SELECT 
  COUNT(*) as total_alertes,
  COUNT(*) FILTER (WHERE email_sent = true) as envoyees,
  COUNT(*) FILTER (WHERE email_sent = false) as en_attente
FROM stock_alerts;
