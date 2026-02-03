-- Supprimer TOUTES les policies sur companies
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their companies" ON companies;
DROP POLICY IF EXISTS "companies_select_authorized" ON companies;
DROP POLICY IF EXISTS "companies_insert_authorized" ON companies;
DROP POLICY IF EXISTS "companies_update_authorized" ON companies;
DROP POLICY IF EXISTS "companies_delete_authorized" ON companies;
DROP POLICY IF EXISTS "enable_read_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_delete_for_user_companies" ON companies;

-- Vérifier qu'il n'y a plus de policy
SELECT COUNT(*) as remaining_policies FROM pg_policies WHERE tablename = 'companies';

-- Créer uniquement les nouvelles policies basées sur user_companies
CREATE POLICY "enable_read_for_user_companies" 
ON companies FOR SELECT 
USING (
  id IN (
    SELECT company_id 
    FROM user_companies 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "enable_insert_for_user_companies" 
ON companies FOR INSERT 
WITH CHECK (
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

-- Vérification finale : devrait afficher exactement 4 policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'companies'
ORDER BY cmd;
