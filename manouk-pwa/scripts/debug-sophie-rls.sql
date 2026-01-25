-- Test RLS en tant que Sophie
-- Cette requête simule ce que Sophie devrait voir

-- 1. Récupérer l'ID de Sophie
SELECT id, email FROM auth.users WHERE email = 'sophiefree40@gmail.com';

-- 2. Vérifier les associations de Sophie dans user_companies
SELECT 
  uc.user_id,
  uc.company_id,
  c.name as company_name,
  uc.role
FROM user_companies uc
JOIN companies c ON c.id = uc.company_id
JOIN auth.users u ON u.id = uc.user_id
WHERE u.email = 'sophiefree40@gmail.com';

-- 3. Vérifier TOUTES les factures et leur société
SELECT 
  i.invoice_number,
  i.date,
  i.total,
  c.name as company_name,
  c.id as company_id
FROM invoices i
JOIN companies c ON c.id = i.company_id
ORDER BY i.date DESC;

-- 4. Test manuel de la policy RLS pour Sophie
-- Remplace <SOPHIE_USER_ID> par l'ID obtenu dans la requête #1
-- Cette requête simule ce que la RLS devrait retourner
SELECT 
  i.*,
  c.name as company_name
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE EXISTS (
  SELECT 1 FROM user_companies uc
  WHERE uc.user_id = '<SOPHIE_USER_ID>' -- REMPLACER ICI
    AND uc.company_id = i.company_id
);

-- 5. Vérifier s'il y a des doublons dans user_companies
SELECT 
  u.email,
  COUNT(*) as nb_companies,
  string_agg(c.name, ', ') as companies
FROM user_companies uc
JOIN auth.users u ON u.id = uc.user_id
JOIN companies c ON c.id = uc.company_id
GROUP BY u.email
HAVING COUNT(*) > 1;
