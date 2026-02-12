-- ================================
-- FORCE FIX RLS - Solution radicale
-- À exécuter dans Supabase SQL Editor
-- ================================

BEGIN;

-- 1. DÉSACTIVER TEMPORAIREMENT RLS (pour nettoyer)
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES ANCIENNES POLITIQUES
DROP POLICY IF EXISTS "Users can view invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices via company" ON invoices;
DROP POLICY IF EXISTS invoices_select_authorized ON invoices;
DROP POLICY IF EXISTS invoices_insert_authorized ON invoices;
DROP POLICY IF EXISTS invoices_update_authorized ON invoices;
DROP POLICY IF EXISTS invoices_delete_authorized ON invoices;
DROP POLICY IF EXISTS invoices_modify_authorized ON invoices;

DROP POLICY IF EXISTS "Users can view invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can insert invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can update invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can delete invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_select_authorized ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_insert_authorized ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_update_authorized ON invoice_lines;
DROP POLICY IF EXISTS invoice_lines_delete_authorized ON invoice_lines;

-- 3. CRÉER LES NOUVELLES POLITIQUES SIMPLIFIÉES
-- ===============================================

-- INVOICES - SELECT
CREATE POLICY "invoices_select"
  ON invoices
  FOR SELECT
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- INVOICES - INSERT
CREATE POLICY "invoices_insert"
  ON invoices
  FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- INVOICES - UPDATE
CREATE POLICY "invoices_update"
  ON invoices
  FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- INVOICES - DELETE
CREATE POLICY "invoices_delete"
  ON invoices
  FOR DELETE
  USING (
    company_id IN (
      SELECT company_id 
      FROM user_companies 
      WHERE user_id = auth.uid()
    )
  );

-- INVOICE_LINES - SELECT
CREATE POLICY "invoice_lines_select"
  ON invoice_lines
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  );

-- INVOICE_LINES - INSERT
CREATE POLICY "invoice_lines_insert"
  ON invoice_lines
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  );

-- INVOICE_LINES - UPDATE
CREATE POLICY "invoice_lines_update"
  ON invoice_lines
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  );

-- INVOICE_LINES - DELETE
CREATE POLICY "invoice_lines_delete"
  ON invoice_lines
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT i.id 
      FROM invoices i
      JOIN user_companies uc ON uc.company_id = i.company_id
      WHERE uc.user_id = auth.uid()
    )
  );

-- 4. RÉACTIVER RLS
-- ================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

-- 5. VÉRIFICATION FINALE
-- =======================
DO $$
DECLARE
  admin_user_id uuid;
  admin_companies_count integer;
BEGIN
  -- Récupérer l'ID de l'admin
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'fabien.hicauber@gmail.com';
  
  -- Compter les associations
  SELECT COUNT(*) INTO admin_companies_count
  FROM user_companies
  WHERE user_id = admin_user_id;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin user_id: %', admin_user_id;
  RAISE NOTICE 'Nombre de sociétés associées: %', admin_companies_count;
  RAISE NOTICE '========================================';
  
  IF admin_companies_count >= 2 THEN
    RAISE NOTICE '✅ CONFIGURATION OK - L''admin est associé à % sociétés', admin_companies_count;
  ELSIF admin_companies_count = 1 THEN
    RAISE WARNING '⚠️  L''admin est associé à UNE SEULE société';
    RAISE WARNING 'Exécutez scripts/setup-split-test.sql pour ajouter les autres';
  ELSE
    RAISE WARNING '❌ ERREUR - L''admin n''est associé à AUCUNE société !';
    RAISE WARNING 'Exécutez scripts/setup-split-test.sql IMMÉDIATEMENT';
  END IF;
END $$;

COMMIT;

-- ================================
-- APRÈS CE SCRIPT
-- ================================
-- 1. Déconnectez-vous de l'application
-- 2. Reconnectez-vous
-- 3. Réessayez de créer une facture
-- 4. Si ça ne marche TOUJOURS pas, envoyez-moi le résultat complet de ce script
