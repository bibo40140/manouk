-- Augmenter la précision du champ unit_cost à 4 décimales
-- Permet de stocker des valeurs comme 0.0044€

-- Modifier la table raw_materials
ALTER TABLE raw_materials 
ALTER COLUMN unit_cost TYPE DECIMAL(10,4);

-- Modifier la table purchases (si elle existe)
ALTER TABLE purchases 
ALTER COLUMN unit_cost TYPE DECIMAL(10,4);

-- Vérification
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns
WHERE table_name IN ('raw_materials', 'purchases')
AND column_name = 'unit_cost';
