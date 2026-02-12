-- Script pour réinitialiser tous les stocks à 100
-- À exécuter dans l'éditeur SQL de Supabase

-- Réinitialiser le stock des matières premières
UPDATE raw_materials 
SET stock = 100;

-- Réinitialiser le stock des produits finis
UPDATE products 
SET stock = 100;

-- Vérifier les résultats
SELECT 'Matières premières' as type, name, stock 
FROM raw_materials 
ORDER BY name;

SELECT 'Produits finis' as type, name, stock 
FROM products 
ORDER BY name;
