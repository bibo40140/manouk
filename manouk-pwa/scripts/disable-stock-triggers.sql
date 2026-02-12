-- Script pour DÉSACTIVER les triggers automatiques de décompte de stock
-- Car maintenant on gère le décompte manuellement via /api/deduct-stock

-- Désactiver le trigger qui décompte le stock des produits
DROP TRIGGER IF EXISTS trigger_decrement_product_stock ON invoice_lines;

-- Désactiver le trigger qui décompte les matières premières via BOM
DROP TRIGGER IF EXISTS trigger_decrement_materials_from_bom ON invoice_lines;

-- Vérifier que les triggers sont bien supprimés
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname IN ('trigger_decrement_product_stock', 'trigger_decrement_materials_from_bom');

-- Si la requête ci-dessus ne retourne aucune ligne, c'est bon !
