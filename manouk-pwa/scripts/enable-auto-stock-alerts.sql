-- Fonction pour envoyer les alertes de stock par email automatiquement
-- Appelée par un trigger AFTER UPDATE sur raw_materials

CREATE OR REPLACE FUNCTION send_stock_alert_email()
RETURNS TRIGGER AS $$
DECLARE
  company_email TEXT;
  company_name TEXT;
BEGIN
  -- Vérifier si le stock passe sous le seuil
  IF NEW.stock <= NEW.alert_threshold AND NEW.alert_threshold IS NOT NULL THEN
    -- Vérifier qu'on n'a pas déjà envoyé une alerte récemment (dans les 24h)
    IF NOT EXISTS (
      SELECT 1 FROM stock_alerts 
      WHERE item_id = NEW.id 
        AND item_type = 'raw_material' 
        AND email_sent = TRUE 
        AND created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      
      -- Récupérer l'email de la société associée
      SELECT c.email, c.name INTO company_email, company_name
      FROM companies c
      WHERE c.id = NEW.company_id;
      
      -- Créer une alerte en base
      INSERT INTO stock_alerts (
        item_type, 
        item_id, 
        item_name, 
        current_stock, 
        alert_threshold, 
        company_id,
        email_sent
      ) VALUES (
        'raw_material',
        NEW.id,
        NEW.name,
        NEW.stock,
        NEW.alert_threshold,
        NEW.company_id,
        FALSE  -- Sera mis à TRUE par l'API après envoi
      );
      
      -- Note: L'envoi réel de l'email se fait via /api/stock/process-alerts
      -- qui est appelé après chaque vente/production
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_auto_stock_alert ON raw_materials;
CREATE TRIGGER trigger_auto_stock_alert
  AFTER UPDATE OF stock ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION send_stock_alert_email();

COMMENT ON FUNCTION send_stock_alert_email() IS 'Crée automatiquement une alerte quand une matière première passe sous son seuil';
