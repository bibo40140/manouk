-- Test des RLS policies pour Sophie
-- Ce script vérifie si les policies fonctionnent correctement

-- 1. Vérifier qu'il ne reste que les nouvelles policies (pas de doublons)
SELECT 
  tablename,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('invoices', 'fixed_costs', 'purchases', 'raw_materials', 'products', 'customers')
GROUP BY tablename
ORDER BY tablename;

-- 2. Vérifier les policies exactes sur invoices
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename = 'invoices'
ORDER BY policyname;

-- 3. Vérifier user_companies pour Sophie
SELECT 
  u.id as user_id,
  u.email,
  uc.company_id,
  c.name as company_name,
  uc.role
FROM auth.users u
LEFT JOIN user_companies uc ON uc.user_id = u.id
LEFT JOIN companies c ON c.id = uc.company_id
WHERE u.email = 'sophiefree40@gmail.com';

-- 4. Vérifier toutes les factures avec leur société
SELECT 
  i.id,
  i.invoice_number,
  i.date,
  i.total,
  c.name as company_name,
  c.id as company_id
FROM invoices i
JOIN companies c ON c.id = i.company_id
ORDER BY i.date DESC;

-- 5. Test : Combien de factures Sophie DEVRAIT voir ?
-- (Factures de la société Manouk uniquement)
SELECT 
  COUNT(*) as factures_manouk,
  SUM(total) as total_ca_manouk
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE c.name = 'manouk';

-- 6. Vérifier s'il y a des policies en conflit
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND (
    policyname LIKE '%Users can%'
    OR policyname LIKE '%authorized%'
  )
ORDER BY tablename, policyname;
