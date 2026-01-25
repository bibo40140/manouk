-- Suppression des factures en doublon
-- Garde uniquement la facture avec le montant le plus élevé pour chaque numéro

-- 1. Voir les doublons avant suppression
SELECT 
  i.invoice_number,
  i.id,
  i.total,
  c.name as company_name,
  i.created_at
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE i.invoice_number IN (
  SELECT invoice_number 
  FROM invoices 
  GROUP BY invoice_number 
  HAVING COUNT(*) > 1
)
ORDER BY i.invoice_number, i.total DESC;

-- 2. Supprimer les doublons (garde la facture avec le total le plus élevé)
DELETE FROM invoices
WHERE id IN (
  SELECT i2.id
  FROM invoices i1
  JOIN invoices i2 ON i1.invoice_number = i2.invoice_number AND i1.id != i2.id
  WHERE i1.total > i2.total
);

-- 3. Vérifier qu'il ne reste plus de doublons
SELECT 
  invoice_number,
  COUNT(*) as nb_occurrences
FROM invoices
GROUP BY invoice_number
HAVING COUNT(*) > 1;

-- 4. Vérifier le nouveau total par société
SELECT 
  c.name as company_name,
  COUNT(*) as nb_factures,
  SUM(i.total) as ca_total
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE EXTRACT(YEAR FROM i.date) = 2026
GROUP BY c.name;
