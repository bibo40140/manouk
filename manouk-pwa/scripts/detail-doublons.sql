-- Voir TOUS les détails des doublons pour comprendre
SELECT 
  i.invoice_number,
  i.id,
  i.date,
  i.total,
  i.paid,
  c.name as company_name,
  cust.name as customer_name,
  i.created_at,
  i.urssaf_amount
FROM invoices i
JOIN companies c ON c.id = i.company_id
LEFT JOIN customers cust ON cust.id = i.customer_id
WHERE i.invoice_number IN (
  SELECT invoice_number 
  FROM invoices 
  GROUP BY invoice_number 
  HAVING COUNT(*) > 1
)
ORDER BY i.invoice_number, i.total DESC, i.created_at;

-- Compter combien de factures au total par société
SELECT 
  c.name as company_name,
  COUNT(*) as total_invoices,
  COUNT(DISTINCT i.invoice_number) as unique_invoice_numbers
FROM invoices i
JOIN companies c ON c.id = i.company_id
GROUP BY c.name;
