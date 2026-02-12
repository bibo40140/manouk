-- ================================
-- DIAGNOSTIC COMPLET + FIX ADMIN ACCÈS TOTAL
-- À exécuter dans Supabase SQL Editor
-- ================================

-- ==========================================
-- PARTIE 1 : DIAGNOSTIC STRUCTURE DES TABLES
-- ==========================================

-- 1. Structure table COMPANIES
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- 2. Structure table USER_COMPANIES
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_companies'
ORDER BY ordinal_position;

-- 3. Structure table INVOICES
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoices'
ORDER BY ordinal_position;

-- 4. Structure table INVOICE_LINES
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'invoice_lines'
ORDER BY ordinal_position;

-- 5. Vérifier les associations user_companies pour l'admin
SELECT 
  uc.user_id,
  u.email,
  uc.company_id,
  c.name as company_name,
  c.code as company_code
FROM user_companies uc
JOIN auth.users u ON uc.user_id = u.id
JOIN companies c ON uc.company_id = c.id
WHERE u.email = 'fabien.hicauber@gmail.com';

-- ==========================================
-- PARTIE 2 : FIX - ACCÈS TOTAL POUR L'ADMIN
-- ==========================================

BEGIN;

-- Désactiver RLS temporairement
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE purchases DISABLE ROW LEVEL SECURITY;

-- Supprimer TOUTES les politiques existantes
DROP POLICY IF EXISTS "Users can view invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices via company" ON invoices;
DROP POLICY IF EXISTS invoices_select_authorized ON invoices;
DROP POLICY IF EXISTS invoices_insert_authorized ON invoices;
DROP POLICY IF EXISTS invoices_update_authorized ON invoices;
DROP POLICY IF EXISTS invoices_delete_authorized ON invoices;
DROP POLICY IF EXISTS invoices_modify_authorized ON invoices;
DROP POLICY IF EXISTS "invoices_select" ON invoices;
DROP POLICY IF EXISTS "invoices_insert" ON invoices;
DROP POLICY IF EXISTS "invoices_update" ON invoices;
DROP POLICY IF EXISTS "invoices_delete" ON invoices;

DROP POLICY IF EXISTS "Users can view invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can insert invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can update invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can delete invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_select_authorized ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_insert_authorized ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_update_authorized ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_delete_authorized ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_select" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_insert" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_update" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_delete" ON invoice_lines;

-- ==========================================
-- NOUVELLE STRATÉGIE : ADMIN BYPASS RLS
-- ==========================================

-- INVOICES : Admin voit tout, users voient via user_companies
CREATE POLICY "invoices_admin_all"
  ON invoices
  FOR ALL
  USING (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- INVOICE_LINES : Admin voit tout, users voient via invoices
CREATE POLICY "invoice_lines_admin_all"
  ON invoice_lines
  FOR ALL
  USING (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  );

-- PAYMENTS : Admin voit tout
CREATE POLICY "payments_admin_all"
  ON payments
  FOR ALL
  USING (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  );

-- CUSTOMERS : Admin voit tout
CREATE POLICY "customers_admin_all"
  ON customers
  FOR ALL
  USING (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- PRODUCTS : Admin voit tout
CREATE POLICY "products_admin_all"
  ON products
  FOR ALL
  USING (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- PURCHASES : Admin voit tout
CREATE POLICY "purchases_admin_all"
  ON purchases
  FOR ALL
  USING (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.email() = 'fabien.hicauber@gmail.com'
    OR
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- Réactiver RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ==========================================
-- PARTIE 3 : VÉRIFICATION FINALE
-- ==========================================

-- Lister toutes les politiques actives sur invoices
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invoices'
  AND schemaname = 'public';

-- Test final : vérifier que l'admin peut théoriquement insérer
DO $$
DECLARE
  admin_email text;
BEGIN
  SELECT email INTO admin_email
  FROM auth.users
  WHERE email = 'fabien.hicauber@gmail.com';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Email admin trouvé: %', admin_email;
  RAISE NOTICE '========================================';
  
  IF admin_email IS NOT NULL THEN
    RAISE NOTICE '✅ L''admin existe et devrait avoir un accès TOTAL via auth.email()';
    RAISE NOTICE 'Politique: auth.email() = ''fabien.hicauber@gmail.com''';
  ELSE
    RAISE WARNING '❌ Admin non trouvé dans auth.users !';
  END IF;
END $$;

-- ==========================================
-- APRÈS CE SCRIPT
-- ==========================================
-- 1. Lisez les résultats de la PARTIE 1 (structures des tables)
-- 2. Vérifiez que "✅ L'admin existe..." s'affiche
-- 3. Déconnectez-vous de l'application
-- 4. Reconnectez-vous
-- 5. Réessayez de créer une facture
-- 6. Si ça échoue ENCORE, envoyez-moi TOUS les résultats de ce script
