-- Table pour enregistrer les productions de produits finis
CREATE TABLE IF NOT EXISTS productions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index pour retrouver les productions par produit et date
CREATE INDEX IF NOT EXISTS idx_productions_product ON productions(product_id);
CREATE INDEX IF NOT EXISTS idx_productions_date ON productions(production_date);

-- RLS policies
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

-- Lecture : tous les utilisateurs authentifiés
CREATE POLICY "Allow read for authenticated users"
  ON productions FOR SELECT
  TO authenticated
  USING (true);

-- Insertion : tous les utilisateurs authentifiés
CREATE POLICY "Allow insert for authenticated users"
  ON productions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Suppression : tous les utilisateurs authentifiés
CREATE POLICY "Allow delete for authenticated users"
  ON productions FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE productions IS 'Enregistre les productions de produits finis';
