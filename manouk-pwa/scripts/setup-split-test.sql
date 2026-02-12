-- ================================
-- CONFIGURATION INITIALE POUR TESTER LE SPLIT DE FACTURES
-- À exécuter dans Supabase SQL Editor
-- ================================

-- 1. ASSOCIER LE COMPTE ADMIN AUX SOCIÉTÉS
-- =========================================
-- D'abord, créer la contrainte unique si elle n'existe pas
ALTER TABLE user_companies DROP CONSTRAINT IF EXISTS user_companies_pkey;
ALTER TABLE user_companies ADD CONSTRAINT user_companies_pkey PRIMARY KEY (user_id, company_id);

-- Ensuite, insérer les associations
INSERT INTO user_companies (user_id, company_id)
SELECT 
  u.id as user_id,
  c.id as company_id
FROM auth.users u
CROSS JOIN companies c
WHERE u.email = 'fabien.hicauber@gmail.com'
  AND c.name IN ('Manouk', 'Bibizi')
  AND NOT EXISTS (
    SELECT 1 FROM user_companies uc 
    WHERE uc.user_id = u.id AND uc.company_id = c.id
  );

-- Vérification : devrait retourner 2 lignes
SELECT 
  u.email,
  c.name as societe
FROM user_companies uc
JOIN auth.users u ON uc.user_id = u.id
JOIN companies c ON uc.company_id = c.id
WHERE u.email = 'fabien.hicauber@gmail.com';


-- 2. EXEMPLE : CONFIGURER LES SPLITS POUR UN PRODUIT
-- ====================================================
-- ATTENTION : Remplacer 'Étui à lunettes' par le nom réel de votre produit !

-- Étape 1 : Supprimer tous les doublons existants dans la table
DELETE FROM product_company_splits a
USING product_company_splits b
WHERE a.id > b.id
  AND a.product_id = b.product_id
  AND a.company_id = b.company_id;

-- Étape 2 : Créer la contrainte unique (maintenant qu'il n'y a plus de doublons)
ALTER TABLE product_company_splits DROP CONSTRAINT IF EXISTS product_company_splits_unique;
ALTER TABLE product_company_splits ADD CONSTRAINT product_company_splits_unique UNIQUE (product_id, company_id);

-- Étape 3 : Supprimer les anciens splits pour "Étui à lunettes" et insérer les nouveaux
DELETE FROM product_company_splits
WHERE product_id IN (SELECT id FROM products WHERE name = 'Étui à lunettes');

INSERT INTO product_company_splits (product_id, company_id, amount)
SELECT 
  p.id as product_id,
  c.id as company_id,
  CASE 
    WHEN c.name = 'Manouk' THEN 3.00
    WHEN c.name = 'Bibizi' THEN 1.00
    ELSE 0
  END as amount
FROM products p
CROSS JOIN companies c
WHERE p.name = 'Étui à lunettes'
  AND c.name IN ('Manouk', 'Bibizi');

-- Vérification
SELECT 
  p.name as produit,
  c.name as societe,
  s.amount as montant
FROM product_company_splits s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id
WHERE p.name = 'Étui à lunettes'
ORDER BY c.name;


-- 3. CRÉER UN PRODUIT DE TEST (SI NÉCESSAIRE)
-- =============================================
-- Décommentez les lignes ci-dessous si vous n'avez pas encore de produit

/*
-- Récupérer l'ID de la société Manouk (pour company_id par défaut)
DO $$
DECLARE
  manouk_id uuid;
BEGIN
  SELECT id INTO manouk_id FROM companies WHERE name = 'Manouk' LIMIT 1;
  
  -- Créer le produit
  INSERT INTO products (name, price, company_id)
  VALUES ('Étui à lunettes', 4.00, manouk_id);
END $$;

-- Puis exécutez l'étape 2 ci-dessus pour configurer les splits
*/


-- 4. VÉRIFIER LA CONFIGURATION GLOBALE
-- ======================================

-- Voir toutes les sociétés
SELECT id, name, code FROM companies ORDER BY name;

-- Voir tous les produits
SELECT id, name, price, company_id FROM products ORDER BY name;

-- Voir tous les splits configurés
SELECT 
  p.name as produit,
  p.price as prix_unitaire,
  c.name as societe,
  s.amount as montant_split,
  ROUND((s.amount / NULLIF(p.price, 0) * 100), 2) as pourcentage
FROM product_company_splits s
JOIN products p ON s.product_id = p.id
JOIN companies c ON s.company_id = c.id
ORDER BY p.name, c.name;

-- Voir les utilisateurs et leurs sociétés
SELECT 
  u.email,
  c.name as societe
FROM user_companies uc
JOIN auth.users u ON uc.user_id = u.id
JOIN companies c ON uc.company_id = c.id
ORDER BY u.email, c.name;


-- 5. CRÉER UN CLIENT DE TEST (OPTIONNEL)
-- ========================================
/*
DO $$
DECLARE
  manouk_id uuid;
BEGIN
  SELECT id INTO manouk_id FROM companies WHERE name = 'Manouk' LIMIT 1;
  
  -- Créer un client de test
  INSERT INTO customers (name, email, company_id)
  VALUES ('Client Test', 'test@example.com', manouk_id)
  ON CONFLICT (email, company_id) DO NOTHING;
END $$;
*/


-- ================================
-- APRÈS AVOIR EXÉCUTÉ CE SCRIPT
-- ================================
-- 1. Allez sur https://manouk.vercel.app/dashboard/invoices
-- 2. Cliquez sur "Nouvelle facture"
-- 3. Sélectionnez le produit "Étui à lunettes"
-- 4. Vérifiez que les splits s'affichent (Manouk 3€ | Bibizi 1€)
-- 5. Créez la facture
-- 6. Vérifiez que 2 factures sont créées (une par société)

-- Pour plus de détails, consultez : GUIDE_TEST_SPLIT_FACTURES.md
