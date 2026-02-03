-- Vérifier les associations actuelles de Fabien
SELECT 
  u.id as user_id,
  u.email,
  uc.company_id,
  c.code,
  c.name
FROM auth.users u
LEFT JOIN user_companies uc ON uc.user_id = u.id
LEFT JOIN companies c ON c.id = uc.company_id
WHERE u.email = 'fabien.hicauber@gmail.com';

-- Récupérer l'ID de Fabien et les IDs des sociétés
SELECT id, email FROM auth.users WHERE email = 'fabien.hicauber@gmail.com';
SELECT id, code, name FROM companies;

-- Associer Fabien à TOUTES les sociétés (remplacer USER_ID par l'ID de Fabien)
-- Exemple : INSERT INTO user_companies (user_id, company_id) 
-- SELECT 'USER_ID', id FROM companies WHERE id NOT IN (SELECT company_id FROM user_companies WHERE user_id = 'USER_ID');

-- OU solution plus simple : donner tous les droits à l'admin via une policy spéciale
-- Supprimer les policies actuelles UPDATE
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON companies;

-- Créer une nouvelle policy UPDATE qui autorise l'admin OU les users associés
CREATE POLICY "enable_update_for_user_companies" 
ON companies FOR UPDATE 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'fabien.hicauber@gmail.com'
  OR
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'fabien.hicauber@gmail.com'
  OR
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Faire pareil pour les autres opérations
DROP POLICY IF EXISTS "enable_read_for_user_companies" ON companies;
CREATE POLICY "enable_read_for_user_companies" 
ON companies FOR SELECT 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'fabien.hicauber@gmail.com'
  OR
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "enable_delete_for_user_companies" ON companies;
CREATE POLICY "enable_delete_for_user_companies" 
ON companies FOR DELETE 
USING (
  (SELECT email FROM auth.users WHERE id = auth.uid()) = 'fabien.hicauber@gmail.com'
  OR
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Vérifier les policies finales
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd, policyname;
