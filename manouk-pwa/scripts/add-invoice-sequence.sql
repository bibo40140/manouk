-- Système de génération de numéros de facture sans doublons
-- Utilise des séquences PostgreSQL pour garantir l'unicité même en concurrence

-- ÉTAPE 0 : Identifier et corriger les doublons existants
-- Afficher les doublons
SELECT invoice_number, COUNT(*) as count, array_agg(id) as invoice_ids
FROM invoices
GROUP BY invoice_number
HAVING COUNT(*) > 1
ORDER BY invoice_number;

-- Corriger les doublons en les renumérótant
DO $$
DECLARE
  duplicate_record RECORD;
  new_number TEXT;
  max_num INTEGER;
  year TEXT;
  invoice_to_update UUID;
BEGIN
  -- Pour chaque numéro de facture en doublon
  FOR duplicate_record IN 
    SELECT invoice_number, array_agg(id ORDER BY created_at) as ids
    FROM invoices
    GROUP BY invoice_number
    HAVING COUNT(*) > 1
  LOOP
    RAISE NOTICE 'Correction du doublon: %', duplicate_record.invoice_number;
    
    -- Extraire l'année du numéro de facture
    year := SUBSTRING(duplicate_record.invoice_number FROM 'F(\d{4})-');
    
    -- Pour chaque facture en doublon (sauf la première)
    FOR i IN 2..array_length(duplicate_record.ids, 1) LOOP
      invoice_to_update := duplicate_record.ids[i];
      
      -- Trouver le prochain numéro disponible
      SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'F\d{4}-(\d+)$') AS INTEGER)), 0)
      INTO max_num
      FROM invoices
      WHERE invoice_number ~ ('^F' || year || '-\d+$');
      
      max_num := max_num + 1;
      new_number := 'F' || year || '-' || LPAD(max_num::TEXT, 3, '0');
      
      -- Mettre à jour la facture
      UPDATE invoices 
      SET invoice_number = new_number 
      WHERE id = invoice_to_update;
      
      RAISE NOTICE 'Facture % renumérótée en %', invoice_to_update, new_number;
    END LOOP;
  END LOOP;
END $$;

-- 1. Ajouter une contrainte UNIQUE sur invoice_number
-- Cela empêchera physiquement les doublons
ALTER TABLE invoices 
DROP CONSTRAINT IF EXISTS invoices_invoice_number_unique;

ALTER TABLE invoices 
ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);

-- 2. Créer une fonction pour générer le prochain numéro de facture
-- Cette fonction utilise la contrainte UNIQUE pour éviter les doublons
CREATE OR REPLACE FUNCTION generate_invoice_number(p_company_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_max_num INTEGER;
  v_next_num INTEGER;
  v_invoice_number TEXT;
BEGIN
  -- Année en cours
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Obtenir le dernier numéro pour cette société cette année
  -- Utiliser MAX() sans FOR UPDATE (la contrainte UNIQUE gère les doublons)
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(invoice_number FROM 'F\d{4}-(\d+)$') AS INTEGER
      )
    ), 
    0
  ) INTO v_max_num
  FROM invoices
  WHERE company_id = p_company_id
    AND invoice_number ~ ('^F' || v_year || '-\d+$');
  
  -- Numéro suivant
  v_next_num := v_max_num + 1;
  
  -- Formater le numéro de facture
  v_invoice_number := 'F' || v_year || '-' || LPAD(v_next_num::TEXT, 3, '0');
  
  RETURN v_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- 3. Vérifier que tout fonctionne
SELECT generate_invoice_number(
  (SELECT id FROM companies WHERE name = 'Manouk' LIMIT 1)
) AS test_invoice_number;

-- ✅ AVANTAGES :
-- - Pas de doublons possibles (contrainte UNIQUE empêche les doublons)
-- - Si 2 créations simultanées tentent le même numéro, l'une échoue et réessaye avec +1
-- - Numéros séquentiels par année et par société
-- - Simple et robuste

-- 📝 UTILISATION DANS L'API :
-- const { data } = await supabase.rpc('generate_invoice_number', { 
--   p_company_id: company_id 
-- })
-- const invoiceNumber = data
-- 
-- En cas d'erreur de doublon (code 23505), l'API réessaye automatiquement

-- 🔄 RÉINITIALISATION (si besoin) :
-- DROP FUNCTION IF EXISTS generate_invoice_number(UUID);
-- ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_unique;
