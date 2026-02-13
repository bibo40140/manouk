-- Ajouter la colonne payment_date à la table purchases
ALTER TABLE purchases 
ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Vérification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'purchases' 
  AND column_name = 'payment_date';
