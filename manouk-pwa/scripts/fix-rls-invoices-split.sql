-- ================================
-- FIX RLS POUR LE SPLIT DE FACTURES
-- À exécuter dans Supabase SQL Editor
-- ================================

-- Ce script corrige les politiques RLS pour permettre :
-- 1. À l'admin de créer des factures multi-sociétés
-- 2. Aux utilisateurs associés via user_companies de voir leurs factures

BEGIN;

-- 1. SUPPRIMER LES ANCIENNES POLITIQUES BASÉES SUR companies.user_id
-- ====================================================================
DROP POLICY IF EXISTS "Users can view invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices via company" ON invoices;

DROP POLICY IF EXISTS "Users can view invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can insert invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can update invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can delete invoice_lines via invoice" ON invoice_lines;


-- 2. CRÉER LES NOUVELLES POLITIQUES BASÉES SUR user_companies
-- ==============================================================

-- INVOICES
-- --------
DROP POLICY IF EXISTS invoices_select_authorized ON invoices;
CREATE POLICY invoices_select_authorized
  ON invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  );

DROP POLICY IF EXISTS invoices_insert_authorized ON invoices;
CREATE POLICY invoices_insert_authorized
  ON invoices
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  );

DROP POLICY IF EXISTS invoices_update_authorized ON invoices;
CREATE POLICY invoices_update_authorized
  ON invoices
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  );

DROP POLICY IF EXISTS invoices_delete_authorized ON invoices;
CREATE POLICY invoices_delete_authorized
  ON invoices
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = invoices.company_id
    )
  );


-- INVOICE_LINES
-- -------------
DROP POLICY IF EXISTS invoice_lines_select_authorized ON invoice_lines;
CREATE POLICY invoice_lines_select_authorized
  ON invoice_lines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE i.id = invoice_lines.invoice_id
        AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS invoice_lines_insert_authorized ON invoice_lines;
CREATE POLICY invoice_lines_insert_authorized
  ON invoice_lines
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE i.id = invoice_lines.invoice_id
        AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS invoice_lines_update_authorized ON invoice_lines;
CREATE POLICY invoice_lines_update_authorized
  ON invoice_lines
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE i.id = invoice_lines.invoice_id
        AND uc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS invoice_lines_delete_authorized ON invoice_lines;
CREATE POLICY invoice_lines_delete_authorized
  ON invoice_lines
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE i.id = invoice_lines.invoice_id
        AND uc.user_id = auth.uid()
    )
  );


-- 3. VÉRIFIER QUE RLS EST ACTIVÉ
-- ================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;


-- 4. POLITIQUE POUR user_companies (si pas déjà créée)
-- ======================================================
DROP POLICY IF EXISTS user_companies_select_self ON user_companies;
CREATE POLICY user_companies_select_self
  ON user_companies
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_companies_modify_self ON user_companies;
CREATE POLICY user_companies_modify_self
  ON user_companies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 5. POLITIQUE COMPANIES (lecture via user_companies)
-- =====================================================
DROP POLICY IF EXISTS companies_select_authorized ON companies;
CREATE POLICY companies_select_authorized
  ON companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_companies uc
      WHERE uc.user_id = auth.uid()
        AND uc.company_id = companies.id
    )
  );


-- 6. VÉRIFICATION
-- ================
-- Vérifier que l'admin est bien associé aux sociétés
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count
  FROM user_companies uc
  JOIN auth.users u ON uc.user_id = u.id
  WHERE u.email = 'fabien.hicauber@gmail.com';
  
  RAISE NOTICE 'Nombre d''associations pour fabien.hicauber@gmail.com: %', admin_count;
  
  IF admin_count = 0 THEN
    RAISE WARNING 'ATTENTION: fabien.hicauber@gmail.com n''est associé à aucune société !';
    RAISE WARNING 'Exécutez le SQL d''association dans RECAPITULATIF_SPLIT.md';
  END IF;
END $$;

COMMIT;

-- ================================
-- RÉSULTAT ATTENDU
-- ================================
-- ✅ All policies dropped/created successfully
-- ✅ Notice: "Nombre d'associations pour fabien.hicauber@gmail.com: 2"
--
-- Si vous voyez "0", exécutez d'abord :
/*
INSERT INTO user_companies (user_id, company_id)
SELECT u.id, c.id
FROM auth.users u
CROSS JOIN companies c
WHERE u.email = 'fabien.hicauber@gmail.com'
  AND c.name IN ('Manouk', 'Bibizi')
ON CONFLICT DO NOTHING;
*/
