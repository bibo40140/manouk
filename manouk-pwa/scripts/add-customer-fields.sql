-- Ajouter des champs supplémentaires pour les clients

-- Ajouter les colonnes s'il n'existent pas déjà
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS vat_number TEXT;

-- Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;
