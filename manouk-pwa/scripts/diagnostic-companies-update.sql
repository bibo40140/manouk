-- Script de diagnostic pour vérifier les permissions sur companies

-- 1. Vérifier les associations user_companies pour Fabien
SELECT 
  u.email,
  c.id as company_id,
  c.code,
  c.name
FROM auth.users u
LEFT JOIN user_companies uc ON uc.user_id = u.id
LEFT JOIN companies c ON c.id = uc.company_id
WHERE u.email = 'fabien.hicauber@gmail.com';

-- 2. Tester un UPDATE direct (remplacer COMPANY_ID par l'ID de Manouk)
-- UPDATE companies SET phone = '0123456789' WHERE id = 'COMPANY_ID';

-- 3. Vérifier les policies UPDATE sur companies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'companies' 
  AND cmd = 'UPDATE';

-- 4. Afficher toutes les sociétés avec leurs données actuelles
SELECT id, code, name, email, phone, siret, vat_number, website, address, legal_notice
FROM companies
ORDER BY name;
