-- Solution complète : donner tous les droits à l'admin
-- Cette solution crée une table admins et modifie toutes les RLS policies

-- 1. Créer une table pour identifier les admins
CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Désactiver RLS sur admins (table de config)
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 2. Ajouter Fabien comme admin
-- Récupérer d'abord son ID
DO $$
DECLARE
  fabien_id UUID;
BEGIN
  SELECT id INTO fabien_id FROM auth.users WHERE email = 'fabien.hicauber@gmail.com';
  
  IF fabien_id IS NOT NULL THEN
    INSERT INTO public.admins (user_id, email)
    VALUES (fabien_id, 'fabien.hicauber@gmail.com')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Admin ajouté: %', fabien_id;
  ELSE
    RAISE NOTICE 'Utilisateur fabien.hicauber@gmail.com non trouvé';
  END IF;
END $$;

-- 3. Créer une fonction helper pour vérifier si un user est admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Mettre à jour les policies de companies
DROP POLICY IF EXISTS "enable_read_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON companies;
DROP POLICY IF EXISTS "enable_delete_for_user_companies" ON companies;

CREATE POLICY "enable_read_for_user_companies" 
ON companies FOR SELECT 
USING (
  is_admin() 
  OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "enable_insert_for_user_companies" 
ON companies FOR INSERT 
WITH CHECK (is_admin());

CREATE POLICY "enable_update_for_user_companies" 
ON companies FOR UPDATE 
USING (
  is_admin() 
  OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  is_admin() 
  OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

CREATE POLICY "enable_delete_for_user_companies" 
ON companies FOR DELETE 
USING (
  is_admin() 
  OR id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- 5. Appliquer le même principe pour toutes les autres tables critiques
-- Customers
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON customers;
CREATE POLICY "enable_update_for_user_companies" 
ON customers FOR UPDATE 
USING (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON customers;
CREATE POLICY "enable_insert_for_user_companies" 
ON customers FOR INSERT 
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- Suppliers
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON suppliers;
CREATE POLICY "enable_update_for_user_companies" 
ON suppliers FOR UPDATE 
USING (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON suppliers;
CREATE POLICY "enable_insert_for_user_companies" 
ON suppliers FOR INSERT 
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- Raw materials
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON raw_materials;
CREATE POLICY "enable_update_for_user_companies" 
ON raw_materials FOR UPDATE 
USING (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON raw_materials;
CREATE POLICY "enable_insert_for_user_companies" 
ON raw_materials FOR INSERT 
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- Products
DROP POLICY IF EXISTS "enable_update_for_user_companies" ON products;
CREATE POLICY "enable_update_for_user_companies" 
ON products FOR UPDATE 
USING (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
)
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "enable_insert_for_user_companies" ON products;
CREATE POLICY "enable_insert_for_user_companies" 
ON products FOR INSERT 
WITH CHECK (
  is_admin() 
  OR company_id IN (SELECT company_id FROM user_companies WHERE user_id = auth.uid())
);

-- Vérifications
SELECT 'Admins:' as info, COUNT(*)::TEXT as value FROM admins
UNION ALL
SELECT 'Admin email:', email FROM admins;

SELECT 'Companies policies:' as info, COUNT(*)::TEXT as value FROM pg_policies WHERE tablename = 'companies';
