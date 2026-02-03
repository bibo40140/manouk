-- Vérifier les policies actuelles sur companies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'companies';

-- Supprimer les anciennes policies sur companies
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their companies" ON companies;
DROP POLICY IF EXISTS "enable_read_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_delete_for_user_companies" ON companies;

-- Créer les nouvelles policies basées sur user_companies
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

-- Vérifier que les policies sont bien créées
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'companies';
