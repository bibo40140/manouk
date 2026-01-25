-- ============================================================================
-- MISE À JOUR COMPLÈTE DES RLS POLICIES POUR UTILISER USER_COMPANIES
-- Ce script remplace toutes les policies qui utilisent companies.user_id
-- par des policies compatibles avec la table user_companies (multi-tenant)
-- ============================================================================

-- ========== COMPANIES ==========
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "companies_select_authorized" ON companies;
CREATE POLICY "companies_select_authorized"
  ON companies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = companies.id
    )
  );

DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "companies_insert_authorized" ON companies;
CREATE POLICY "companies_insert_authorized"
  ON companies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = companies.id
    )
  );

DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "companies_update_authorized" ON companies;
CREATE POLICY "companies_update_authorized"
  ON companies FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = companies.id
    )
  );

DROP POLICY IF EXISTS "Users can delete own companies" ON companies;
DROP POLICY IF EXISTS "companies_delete_authorized" ON companies;
CREATE POLICY "companies_delete_authorized"
  ON companies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = companies.id
    )
  );

-- ========== CUSTOMERS ==========
DROP POLICY IF EXISTS "Users can view customers via company" ON customers;
DROP POLICY IF EXISTS "customers_select_authorized" ON customers;
CREATE POLICY "customers_select_authorized"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = customers.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert customers via company" ON customers;
DROP POLICY IF EXISTS "customers_modify_authorized" ON customers;
CREATE POLICY "customers_modify_authorized"
  ON customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = customers.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = customers.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update customers via company" ON customers;
DROP POLICY IF EXISTS "Users can delete customers via company" ON customers;

-- ========== SUPPLIERS ==========
DROP POLICY IF EXISTS "Users can view suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "suppliers_select_authorized" ON suppliers;
CREATE POLICY "suppliers_select_authorized"
  ON suppliers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = suppliers.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "suppliers_modify_authorized" ON suppliers;
CREATE POLICY "suppliers_modify_authorized"
  ON suppliers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = suppliers.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = suppliers.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers via company" ON suppliers;

-- ========== RAW MATERIALS ==========
DROP POLICY IF EXISTS "Users can view raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "raw_materials_select_authorized" ON raw_materials;
CREATE POLICY "raw_materials_select_authorized"
  ON raw_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = raw_materials.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "raw_materials_modify_authorized" ON raw_materials;
CREATE POLICY "raw_materials_modify_authorized"
  ON raw_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = raw_materials.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = raw_materials.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can delete raw_materials via company" ON raw_materials;

-- ========== PRODUCTS ==========
DROP POLICY IF EXISTS "Users can view products via company" ON products;
DROP POLICY IF EXISTS "products_select_authorized" ON products;
CREATE POLICY "products_select_authorized"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = products.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert products via company" ON products;
DROP POLICY IF EXISTS "products_modify_authorized" ON products;
CREATE POLICY "products_modify_authorized"
  ON products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = products.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = products.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update products via company" ON products;
DROP POLICY IF EXISTS "Users can delete products via company" ON products;

-- ========== PRODUCT MATERIALS ==========
DROP POLICY IF EXISTS "Users can view product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "product_materials_select_authorized" ON product_materials;
CREATE POLICY "product_materials_select_authorized"
  ON product_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN products p ON p.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND p.id = product_materials.product_id
    )
  );

DROP POLICY IF EXISTS "Users can insert product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "product_materials_modify_authorized" ON product_materials;
CREATE POLICY "product_materials_modify_authorized"
  ON product_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN products p ON p.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND p.id = product_materials.product_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN products p ON p.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND p.id = product_materials.product_id
    )
  );

DROP POLICY IF EXISTS "Users can update product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can delete product_materials via product" ON product_materials;

-- ========== INVOICES ==========
DROP POLICY IF EXISTS "Users can view invoices via company" ON invoices;
DROP POLICY IF EXISTS "invoices_select_authorized" ON invoices;
CREATE POLICY "invoices_select_authorized"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert invoices via company" ON invoices;
DROP POLICY IF EXISTS "invoices_modify_authorized" ON invoices;
CREATE POLICY "invoices_modify_authorized"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices via company" ON invoices;

-- ========== INVOICE LINES ==========
DROP POLICY IF EXISTS "Users can view invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_select_authorized" ON invoice_lines;
CREATE POLICY "invoice_lines_select_authorized"
  ON invoice_lines FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN invoices i ON i.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND i.id = invoice_lines.invoice_id
    )
  );

DROP POLICY IF EXISTS "Users can insert invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_modify_authorized" ON invoice_lines;
CREATE POLICY "invoice_lines_modify_authorized"
  ON invoice_lines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN invoices i ON i.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND i.id = invoice_lines.invoice_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      JOIN invoices i ON i.company_id = uc.company_id
      WHERE uc.user_id = auth.uid()
        AND i.id = invoice_lines.invoice_id
    )
  );

DROP POLICY IF EXISTS "Users can update invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can delete invoice_lines via invoice" ON invoice_lines;

-- ========== PURCHASES ==========
DROP POLICY IF EXISTS "Users can view purchases via company" ON purchases;
DROP POLICY IF EXISTS "purchases_select_authorized" ON purchases;
CREATE POLICY "purchases_select_authorized"
  ON purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = purchases.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert purchases via company" ON purchases;
DROP POLICY IF EXISTS "purchases_modify_authorized" ON purchases;
CREATE POLICY "purchases_modify_authorized"
  ON purchases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = purchases.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = purchases.company_id
    )
  );

DROP POLICY IF EXISTS "Users can update purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can delete purchases via company" ON purchases;

-- ========== FIXED COSTS ==========
DROP POLICY IF EXISTS "Users can view their fixed_costs" ON fixed_costs;
CREATE POLICY "fixed_costs_select_authorized"
  ON fixed_costs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  );

DROP POLICY IF EXISTS "Users can insert their fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can update their fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can delete their fixed_costs" ON fixed_costs;
CREATE POLICY "fixed_costs_modify_authorized"
  ON fixed_costs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = fixed_costs.company_id
    )
  );

-- ========== EMAIL SETTINGS ==========
-- Note: email_settings utilise user_id, pas company_id
DROP POLICY IF EXISTS "Users can view own email_settings" ON email_settings;
CREATE POLICY "email_settings_select_authorized"
  ON email_settings FOR SELECT
  USING (auth.uid() = email_settings.user_id);

DROP POLICY IF EXISTS "Users can insert own email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update own email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can delete own email_settings" ON email_settings;
CREATE POLICY "email_settings_modify_authorized"
  ON email_settings FOR ALL
  USING (auth.uid() = email_settings.user_id)
  WITH CHECK (auth.uid() = email_settings.user_id);

-- Vérification finale
SELECT 
  schemaname, 
  tablename, 
  policyname,
  'Politique mise à jour' as status
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
