-- Ajouter colonne alert_threshold dans raw_materials
ALTER TABLE raw_materials 
ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(10,2);

-- Ajouter colonne alert_threshold dans products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS alert_threshold INTEGER;

-- Commenter les colonnes
COMMENT ON COLUMN raw_materials.alert_threshold IS 'Seuil d''alerte pour envoyer une notification quand le stock est faible';
COMMENT ON COLUMN products.alert_threshold IS 'Seuil d''alerte pour envoyer une notification quand le stock est faible';
