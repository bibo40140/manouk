-- Créer la table stock_alerts si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS stock_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type TEXT NOT NULL CHECK (item_type IN ('raw_material', 'product')),
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  current_stock DECIMAL(10,4) NOT NULL,
  alert_threshold DECIMAL(10,4) NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_stock_alerts_company ON stock_alerts(company_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_email_sent ON stock_alerts(email_sent);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_created ON stock_alerts(created_at DESC);

-- RLS policies
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Allow read stock_alerts for authenticated users" ON stock_alerts;
DROP POLICY IF EXISTS "Allow insert stock_alerts for authenticated users" ON stock_alerts;
DROP POLICY IF EXISTS "Allow update stock_alerts for authenticated users" ON stock_alerts;
DROP POLICY IF EXISTS "Allow delete stock_alerts for authenticated users" ON stock_alerts;

-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "Allow read stock_alerts for authenticated users"
  ON stock_alerts FOR SELECT
  TO authenticated
  USING (true);

-- Insertion : tous les utilisateurs authentifiés
CREATE POLICY "Allow insert stock_alerts for authenticated users"
  ON stock_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Mise à jour : tous les utilisateurs authentifiés
CREATE POLICY "Allow update stock_alerts for authenticated users"
  ON stock_alerts FOR UPDATE
  TO authenticated
  USING (true);

-- Suppression : tous les utilisateurs authentifiés
CREATE POLICY "Allow delete stock_alerts for authenticated users"
  ON stock_alerts FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE stock_alerts IS 'Alertes de stock bas pour matières premières et produits finis';
