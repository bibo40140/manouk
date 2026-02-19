-- Table pour enregistrer les livraisons
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  invoiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Lien entre une livraison et les productions livrees (production entiere)
CREATE TABLE IF NOT EXISTS delivery_productions (
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (delivery_id, production_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_productions_unique_production
  ON delivery_productions(production_id);

CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivery_date);

-- Lien optionnel entre une ligne de facture et une livraison
ALTER TABLE invoice_lines
  ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL;

-- RLS policies
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_productions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for authenticated users" ON deliveries;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON deliveries;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON deliveries;

CREATE POLICY "Allow read for authenticated users"
  ON deliveries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON deliveries FOR DELETE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow read for authenticated users" ON delivery_productions;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON delivery_productions;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON delivery_productions;

CREATE POLICY "Allow read for authenticated users"
  ON delivery_productions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON delivery_productions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow delete for authenticated users"
  ON delivery_productions FOR DELETE
  TO authenticated
  USING (true);

COMMENT ON TABLE deliveries IS 'Enregistre les livraisons de productions';
COMMENT ON TABLE delivery_productions IS 'Lien entre livraisons et productions';
