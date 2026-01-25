-- Script de diagnostic pour vérifier la configuration RLS de Sophie

-- 1. Vérifier l'utilisateur Sophie et sa société
SELECT 
  u.email,
  c.name as company_name,
  uc.role,
  uc.user_id,
  uc.company_id
FROM auth.users u
JOIN user_companies uc ON uc.user_id = u.id
JOIN companies c ON c.id = uc.company_id
WHERE u.email LIKE '%sophie%';

-- 2. Vérifier toutes les associations user_companies
SELECT 
  u.email,
  c.name as company_name,
  uc.role
FROM auth.users u
JOIN user_companies uc ON uc.user_id = u.id
JOIN companies c ON c.id = uc.company_id
ORDER BY u.email, c.name;

-- 3. Vérifier les sociétés existantes
SELECT id, name, code FROM companies ORDER BY name;

-- 4. Vérifier les factures et leur société
SELECT 
  invoice_number,
  date,
  total,
  c.name as company_name
FROM invoices i
JOIN companies c ON c.id = i.company_id
ORDER BY date DESC
LIMIT 10;

-- 5. Vérifier les frais fixes et leur société
SELECT 
  fc.name as cost_name,
  fc.amount,
  c.name as company_name
FROM fixed_costs fc
JOIN companies c ON c.id = fc.company_id
ORDER BY c.name;

-- 6. Vérifier les policies actives
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('invoices', 'fixed_costs', 'companies')
ORDER BY tablename, policyname;
