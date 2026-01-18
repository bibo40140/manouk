-- Vérifier les matières premières dans la base
SELECT 
  id, 
  name, 
  unit_cost, 
  stock, 
  company_id,
  created_at
FROM raw_materials
ORDER BY name;

-- Vérifier les policies actuelles sur raw_materials
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
WHERE tablename = 'raw_materials';
