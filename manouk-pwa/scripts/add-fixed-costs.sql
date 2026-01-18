-- Table pour les frais fixes mensuels (loyer, abonnements, etc.)
CREATE TABLE IF NOT EXISTS fixed_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  frequency TEXT DEFAULT 'monthly', -- monthly, quarterly, yearly
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS pour fixed_costs
ALTER TABLE fixed_costs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can view their fixed_costs"
  ON fixed_costs FOR SELECT
  USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'fabien.hicauber@gmail.com'
  );

DROP POLICY IF EXISTS "Users can insert their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can insert their fixed_costs"
  ON fixed_costs FOR INSERT
  WITH CHECK (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'fabien.hicauber@gmail.com'
  );

DROP POLICY IF EXISTS "Users can update their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can update their fixed_costs"
  ON fixed_costs FOR UPDATE
  USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'fabien.hicauber@gmail.com'
  );

DROP POLICY IF EXISTS "Users can delete their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can delete their fixed_costs"
  ON fixed_costs FOR DELETE
  USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
    OR auth.jwt() ->> 'email' = 'fabien.hicauber@gmail.com'
  );
