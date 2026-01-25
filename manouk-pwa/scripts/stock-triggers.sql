-- =====================================================
-- TRIGGERS POUR GESTION AUTOMATIQUE DES STOCKS
-- =====================================================

-- 1. Fonction pour incrémenter le stock lors d'un achat
CREATE OR REPLACE FUNCTION increment_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Augmenter le stock de la matière première
  UPDATE raw_materials
  SET stock = stock + NEW.quantity
  WHERE id = NEW.raw_material_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Après insertion d'un achat
DROP TRIGGER IF EXISTS trigger_increment_stock_on_purchase ON purchases;
CREATE TRIGGER trigger_increment_stock_on_purchase
  AFTER INSERT ON purchases
  FOR EACH ROW
  EXECUTE FUNCTION increment_stock_on_purchase();


-- 2. Fonction pour décrémenter le stock des produits lors d'une vente
CREATE OR REPLACE FUNCTION decrement_product_stock_on_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- Diminuer le stock du produit
  UPDATE products
  SET stock = stock - NEW.quantity
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Après insertion d'une ligne de facture
DROP TRIGGER IF EXISTS trigger_decrement_product_stock ON invoice_lines;
CREATE TRIGGER trigger_decrement_product_stock
  AFTER INSERT ON invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION decrement_product_stock_on_invoice();


-- 3. Fonction pour décrémenter les matières premières via BOM (nomenclature)
CREATE OR REPLACE FUNCTION decrement_materials_from_bom()
RETURNS TRIGGER AS $$
DECLARE
  mat RECORD;
BEGIN
  -- Pour chaque matière première dans la nomenclature du produit
  FOR mat IN 
    SELECT pm.raw_material_id, pm.quantity 
    FROM product_materials pm
    WHERE pm.product_id = NEW.product_id
  LOOP
    -- Diminuer le stock de la matière première
    UPDATE raw_materials
    SET stock = stock - (mat.quantity * NEW.quantity)
    WHERE id = mat.raw_material_id;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Après insertion d'une ligne de facture (pour matières premières)
DROP TRIGGER IF EXISTS trigger_decrement_materials_from_bom ON invoice_lines;
CREATE TRIGGER trigger_decrement_materials_from_bom
  AFTER INSERT ON invoice_lines
  FOR EACH ROW
  EXECUTE FUNCTION decrement_materials_from_bom();


-- 4. Fonction pour vérifier les alertes stock et enregistrer dans une table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL, -- 'product' ou 'raw_material'
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  current_stock DECIMAL(10,2) NOT NULL,
  alert_threshold DECIMAL(10,2) NOT NULL,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email_sent BOOLEAN DEFAULT FALSE
);

-- Index pour retrouver les alertes rapidement
CREATE INDEX IF NOT EXISTS idx_stock_alerts_email_sent ON stock_alerts(email_sent);

-- Fonction pour créer une alerte quand stock faible (matières premières)
CREATE OR REPLACE FUNCTION check_raw_material_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le stock passe en dessous du seuil et qu'une alerte n'existe pas déjà
  IF NEW.stock <= NEW.alert_threshold AND NEW.alert_threshold IS NOT NULL THEN
    -- Créer une alerte non envoyée
    INSERT INTO stock_alerts (item_type, item_id, item_name, current_stock, alert_threshold, company_id, email_sent)
    SELECT 'raw_material', NEW.id, NEW.name, NEW.stock, NEW.alert_threshold, NEW.company_id, FALSE
    WHERE NOT EXISTS (
      SELECT 1 FROM stock_alerts 
      WHERE item_id = NEW.id 
        AND item_type = 'raw_material' 
        AND email_sent = FALSE 
        AND created_at > NOW() - INTERVAL '24 hours'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Après mise à jour du stock d'une matière première
DROP TRIGGER IF EXISTS trigger_check_raw_material_alert ON raw_materials;
CREATE TRIGGER trigger_check_raw_material_alert
  AFTER UPDATE OF stock ON raw_materials
  FOR EACH ROW
  EXECUTE FUNCTION check_raw_material_alert();

-- Fonction pour créer une alerte quand stock faible (produits)
CREATE OR REPLACE FUNCTION check_product_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le stock passe en dessous du seuil et qu'une alerte n'existe pas déjà
  IF NEW.stock <= NEW.alert_threshold AND NEW.alert_threshold IS NOT NULL THEN
    -- Créer une alerte non envoyée
    INSERT INTO stock_alerts (item_type, item_id, item_name, current_stock, alert_threshold, company_id, email_sent)
    SELECT 'product', NEW.id, NEW.name, NEW.stock, NEW.alert_threshold, NEW.company_id, FALSE
    WHERE NOT EXISTS (
      SELECT 1 FROM stock_alerts 
      WHERE item_id = NEW.id 
        AND item_type = 'product' 
        AND email_sent = FALSE 
        AND created_at > NOW() - INTERVAL '24 hours'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger : Après mise à jour du stock d'un produit
DROP TRIGGER IF EXISTS trigger_check_product_alert ON products;
CREATE TRIGGER trigger_check_product_alert
  AFTER UPDATE OF stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION check_product_alert();

-- RLS pour stock_alerts
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view stock alerts" ON stock_alerts;
CREATE POLICY "Users can view stock alerts" ON stock_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = stock_alerts.company_id
    )
  );

DROP POLICY IF EXISTS "System can insert stock alerts" ON stock_alerts;
CREATE POLICY "System can insert stock alerts" ON stock_alerts
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update stock alerts" ON stock_alerts;
CREATE POLICY "Users can update stock alerts" ON stock_alerts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
      AND uc.company_id = stock_alerts.company_id
    )
  );

-- Commentaires
COMMENT ON TABLE stock_alerts IS 'Table pour stocker les alertes de stock faible à traiter';
COMMENT ON COLUMN stock_alerts.email_sent IS 'Indique si l''email d''alerte a été envoyé';
