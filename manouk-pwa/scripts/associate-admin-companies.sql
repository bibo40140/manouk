-- Solution simple : associer l'admin à toutes les sociétés dans user_companies

-- 1. Récupérer l'ID de Fabien
SELECT id, email FROM auth.users WHERE email = 'fabien.hicauber@gmail.com';

-- 2. Voir les associations actuelles
SELECT 
  u.email,
  c.code,
  c.name
FROM auth.users u
LEFT JOIN user_companies uc ON uc.user_id = u.id
LEFT JOIN companies c ON c.id = uc.company_id
WHERE u.email = 'fabien.hicauber@gmail.com';

-- 3. Associer Fabien à TOUTES les sociétés (à exécuter manuellement après avoir récupéré l'ID)
-- Remplacer 'VOTRE_USER_ID' par l'ID réel de Fabien obtenu à l'étape 1
/*
INSERT INTO user_companies (user_id, company_id)
SELECT 'VOTRE_USER_ID', id 
FROM companies 
WHERE id NOT IN (
  SELECT company_id 
  FROM user_companies 
  WHERE user_id = 'VOTRE_USER_ID'
);
*/

-- 4. Vérifier les nouvelles associations
SELECT 
  u.email,
  COUNT(uc.company_id) as companies_count,
  STRING_AGG(c.code, ', ') as company_codes
FROM auth.users u
LEFT JOIN user_companies uc ON uc.user_id = u.id
LEFT JOIN companies c ON c.id = uc.company_id
WHERE u.email = 'fabien.hicauber@gmail.com'
GROUP BY u.email;

-- 5. Revenir aux policies simples (sans check admin dans auth.users)
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_read_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_delete_for_user_companies" ON companies;

CREATE POLICY "enable_read_for_user_companies" 
ON companies FOR SELECT 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "enable_update_for_user_companies" 
ON companies FOR UPDATE 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "enable_delete_for_user_companies" 
ON companies FOR DELETE 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

-- Vérification finale
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd;
