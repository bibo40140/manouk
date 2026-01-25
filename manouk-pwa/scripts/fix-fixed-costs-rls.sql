-- Mise à jour des RLS policies pour fixed_costs avec user_companies
-- Compatible avec l'architecture multi-tenant

DROP POLICY IF EXISTS "Users can view their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can view their fixed_costs"
  ON fixed_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can insert their fixed_costs"
  ON fixed_costs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can update their fixed_costs"
  ON fixed_costs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  );

DROP POLICY IF EXISTS "Users can delete their fixed_costs" ON fixed_costs;
CREATE POLICY "Users can delete their fixed_costs"
  ON fixed_costs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  );
