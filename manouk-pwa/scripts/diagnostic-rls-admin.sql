-- ================================
-- DIAGNOSTIC RLS ADMIN
-- À exécuter dans Supabase SQL Editor
-- ================================

-- 1. Vérifier l'ID de l'utilisateur admin
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'fabien.hicauber@gmail.com';

-- 2. Vérifier les associations user_companies pour l'admin
SELECT 
  uc.user_id,
  u.email,
  uc.company_id,
  c.name as company_name
FROM user_companies uc
JOIN auth.users u ON uc.user_id = u.id
JOIN companies c ON uc.company_id = c.id
WHERE u.email = 'fabien.hicauber@gmail.com';

-- 3. Vérifier les sociétés existantes
SELECT 
  id,
  name,
  code
FROM companies
ORDER BY name;

-- 4. Tester manuellement si l'admin peut insérer une facture
-- (Remplacer USER_ID et COMPANY_ID par les valeurs réelles ci-dessus)
DO $$
DECLARE
  admin_user_id uuid;
  manouk_company_id uuid;
  can_insert boolean;
BEGIN
  -- Récupérer l'ID de l'admin
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = 'fabien.hicauber@gmail.com';
  
  -- Récupérer l'ID de Manouk
  SELECT id INTO manouk_company_id 
  FROM companies 
  WHERE name = 'Manouk';
  
  -- Tester si l'association existe
  SELECT EXISTS (
    SELECT 1 FROM user_companies uc
    WHERE uc.user_id = admin_user_id
      AND uc.company_id = manouk_company_id
  ) INTO can_insert;
  
  RAISE NOTICE 'Admin user_id: %', admin_user_id;
  RAISE NOTICE 'Manouk company_id: %', manouk_company_id;
  RAISE NOTICE 'Association existe: %', can_insert;
  
  IF can_insert THEN
    RAISE NOTICE '✅ L''admin PEUT créer des factures pour Manouk';
  ELSE
    RAISE WARNING '❌ L''admin NE PEUT PAS créer des factures pour Manouk';
    RAISE WARNING 'Exécutez scripts/setup-split-test.sql pour corriger';
  END IF;
END $$;

-- 5. Lister toutes les politiques RLS sur invoices
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invoices';

-- 6. Vérifier que RLS est activé
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('invoices', 'invoice_lines', 'user_companies')
  AND schemaname = 'public';
