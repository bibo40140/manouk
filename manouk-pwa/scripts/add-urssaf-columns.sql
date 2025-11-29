-- Ajout des colonnes URSSAF à la table invoices
ALTER TABLE invoices 
  ADD COLUMN IF NOT EXISTS urssaf_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS urssaf_declared_date DATE,
  ADD COLUMN IF NOT EXISTS urssaf_paid_date DATE,
  ADD COLUMN IF NOT EXISTS urssaf_paid_amount DECIMAL(10,2) DEFAULT 0;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_invoices_urssaf ON invoices(urssaf_declared_date, urssaf_paid_date);

-- Trigger pour calculer automatiquement l'URSSAF (22% du total)
CREATE OR REPLACE FUNCTION calculate_urssaf()
RETURNS TRIGGER AS $$
BEGIN
  NEW.urssaf_amount := NEW.total * 0.22;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_urssaf ON invoices;
CREATE TRIGGER trigger_calculate_urssaf
  BEFORE INSERT OR UPDATE OF total ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION calculate_urssaf();

-- Commentaires pour documentation
COMMENT ON COLUMN invoices.urssaf_amount IS 'Montant URSSAF calculé (22% du CA)';
COMMENT ON COLUMN invoices.urssaf_declared_date IS 'Date de déclaration URSSAF';
COMMENT ON COLUMN invoices.urssaf_paid_date IS 'Date de paiement URSSAF';
COMMENT ON COLUMN invoices.urssaf_paid_amount IS 'Montant URSSAF payé';

-- Mise à jour des factures existantes pour calculer l'URSSAF
UPDATE invoices SET urssaf_amount = total * 0.22;
