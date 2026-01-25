-- Nettoyage et correction des policies manquantes

-- ========== PAYMENTS ==========
DROP POLICY IF EXISTS "Users can view payments via invoice" ON payments;
DROP POLICY IF EXISTS "Users can insert payments via invoice" ON payments;
DROP POLICY IF EXISTS "Users can update payments via invoice" ON payments;
DROP POLICY IF EXISTS "Users can delete payments via invoice" ON payments;

CREATE POLICY "payments_select_authorized"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN invoices i ON i.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND i.id = payments.invoice_id
    )
  );

CREATE POLICY "payments_modify_authorized"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN invoices i ON i.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND i.id = payments.invoice_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN invoices i ON i.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND i.id = payments.invoice_id
    )
  );

-- ========== STOCK_ALERTS ==========
DROP POLICY IF EXISTS "Users can view stock alerts" ON stock_alerts;
DROP POLICY IF EXISTS "Users can update stock alerts" ON stock_alerts;
DROP POLICY IF EXISTS "System can insert stock alerts" ON stock_alerts;

CREATE POLICY "stock_alerts_select_authorized"
  ON stock_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = stock_alerts.company_id
    )
  );

-- Permettre au système (triggers) d'insérer des alertes
CREATE POLICY "stock_alerts_insert_system"
  ON stock_alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "stock_alerts_modify_authorized"
  ON stock_alerts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = stock_alerts.company_id
    )
  );

CREATE POLICY "stock_alerts_delete_authorized"
  ON stock_alerts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = stock_alerts.company_id
    )
  );

-- ========== URSSAF_DECLARATIONS ==========
DROP POLICY IF EXISTS "Users can view urssaf via company" ON urssaf_declarations;
DROP POLICY IF EXISTS "Users can insert urssaf via company" ON urssaf_declarations;
DROP POLICY IF EXISTS "Users can update urssaf via company" ON urssaf_declarations;
DROP POLICY IF EXISTS "Users can delete urssaf via company" ON urssaf_declarations;

CREATE POLICY "urssaf_select_authorized"
  ON urssaf_declarations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = urssaf_declarations.company_id
    )
  );

CREATE POLICY "urssaf_modify_authorized"
  ON urssaf_declarations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = urssaf_declarations.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = urssaf_declarations.company_id
    )
  );

-- ========== PRODUCT_COMPANY_SPLITS ==========
DROP POLICY IF EXISTS "Users can view product_company_splits" ON product_company_splits;
DROP POLICY IF EXISTS "Users can insert product_company_splits" ON product_company_splits;
DROP POLICY IF EXISTS "Users can update product_company_splits" ON product_company_splits;
DROP POLICY IF EXISTS "Users can delete product_company_splits" ON product_company_splits;

CREATE POLICY "product_company_splits_select_authorized"
  ON product_company_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = product_company_splits.company_id
    )
  );

CREATE POLICY "product_company_splits_modify_authorized"
  ON product_company_splits FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = product_company_splits.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = product_company_splits.company_id
    )
  );

-- Vérification finale
SELECT 
  'Policies restantes avec "Users can":' as info,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public'
  AND policyname LIKE '%Users can%';
