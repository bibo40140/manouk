-- 🔍 DIAGNOSTIC DES ALERTES DE STOCK

-- 1️⃣ Est-ce que la table stock_alerts existe ?
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'stock_alerts'
) AS table_exists;

-- 2️⃣ Y a-t-il des alertes dans la table ?
SELECT 
  COUNT(*) as total_alertes,
  COUNT(*) FILTER (WHERE email_sent = true) as alertes_envoyees,
  COUNT(*) FILTER (WHERE email_sent = false) as alertes_en_attente
FROM stock_alerts;

-- 3️⃣ Voir le schéma actuel de la table stock_alerts
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stock_alerts'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3bis️⃣ Voir les dernières alertes créées (si la table existe)
SELECT *
FROM stock_alerts
ORDER BY created_at DESC
LIMIT 5;

-- 4️⃣ Est-ce que le trigger existe ?
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'trigger_stock_alert_email';

-- 5️⃣ Est-ce que la fonction trigger existe ?
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'send_stock_alert_email'
AND routine_schema = 'public';

-- 6️⃣ Vérifier l'email de la company
SELECT 
  id,
  name,
  email
FROM companies
ORDER BY created_at DESC
LIMIT 3;

-- 7️⃣ Matières premières sous le seuil actuellement
SELECT 
  id,
  name,
  stock,
  alert_threshold,
  CASE 
    WHEN stock < alert_threshold THEN '⚠️ SOUS SEUIL'
    ELSE '✅ OK'
  END as statut
FROM raw_materials
WHERE stock < alert_threshold
ORDER BY stock ASC;
