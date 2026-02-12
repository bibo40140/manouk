-- Créer un utilisateur de test pour Bibizi

-- ÉTAPE 1 : Créer l'utilisateur dans auth.users
-- ⚠️ IMPORTANT : Vous devez créer le compte via l'interface de l'app d'abord !
-- Allez sur http://localhost:3000/login → "Pas encore de compte ?"
-- Email : bibizi.test.2026@gmail.com
-- Mot de passe : TestBibizi2026!

-- ÉTAPE 2 : Associer l'utilisateur à la société Bibizi
-- Exécutez ce script APRÈS avoir créé le compte via l'interface

-- Vérifier que l'utilisateur existe
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'bibizi.test.2026@gmail.com';

-- Associer l'utilisateur à Bibizi
INSERT INTO user_companies (user_id, company_id)
SELECT 
  u.id,
  c.id
FROM auth.users u
CROSS JOIN companies c
WHERE u.email = 'bibizi.test.2026@gmail.com'
  AND c.name = 'Bibizi'
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Vérification : Afficher les associations
SELECT 
  u.email,
  c.name as company_name,
  c.siret,
  uc.created_at as association_date
FROM user_companies uc
JOIN auth.users u ON u.id = uc.user_id
JOIN companies c ON c.id = uc.company_id
WHERE u.email = 'bibizi.test.2026@gmail.com';

-- ✅ Résultat attendu :
-- email                        | company_name | siret           | association_date
-- ---------------------------- | ------------ | --------------- | ----------------
-- bibizi.test.2026@gmail.com   | Bibizi       | 83152257800028  | 2026-02-12...

-- 🎯 POUR TESTER :
-- 1. Déconnectez-vous de l'app
-- 2. Connectez-vous avec :
--    Email : bibizi.test.2026@gmail.com
--    Mot de passe : TestBibizi2026!
-- 3. Vous devez voir UNIQUEMENT les données Bibizi
-- 4. Les factures et achats Manouk ne doivent PAS être visibles
