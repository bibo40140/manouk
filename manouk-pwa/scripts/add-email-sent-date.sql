-- Ajoute la colonne email_sent_date à la table invoices pour stocker la date d'envoi
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS email_sent_date DATE;