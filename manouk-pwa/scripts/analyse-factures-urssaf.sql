-- Analyse des factures pour comprendre le problème URSSAF

-- 1. Toutes les factures avec détails
SELECT 
  i.invoice_number,
  i.date,
  i.total,
  i.urssaf_amount,
  i.urssaf_paid_amount,
  c.name as company_name,
  EXTRACT(YEAR FROM i.date) as year,
  EXTRACT(MONTH FROM i.date) as month,
  CASE 
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 1 AND 3 THEN 'T1'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 4 AND 6 THEN 'T2'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 7 AND 9 THEN 'T3'
    ELSE 'T4'
  END as trimestre
FROM invoices i
JOIN companies c ON c.id = i.company_id
ORDER BY i.date DESC;

-- 2. Factures de Manouk uniquement (ce que Sophie devrait voir)
SELECT 
  i.invoice_number,
  i.date,
  i.total,
  i.urssaf_amount,
  CASE 
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 1 AND 3 THEN 'T1'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 4 AND 6 THEN 'T2'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 7 AND 9 THEN 'T3'
    ELSE 'T4'
  END as trimestre
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE c.name = 'manouk'
  AND EXTRACT(YEAR FROM i.date) = 2026
ORDER BY i.date;

-- 3. Résumé par trimestre 2026 - TOUTES LES SOCIÉTÉS
SELECT 
  CASE 
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 1 AND 3 THEN 'T1'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 4 AND 6 THEN 'T2'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 7 AND 9 THEN 'T3'
    ELSE 'T4'
  END as trimestre,
  COUNT(*) as nb_factures,
  SUM(i.total) as ca_total,
  SUM(i.urssaf_amount) as urssaf_declare,
  string_agg(DISTINCT c.name, ', ') as societes
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE EXTRACT(YEAR FROM i.date) = 2026
GROUP BY trimestre
ORDER BY trimestre;

-- 4. Résumé par trimestre 2026 - MANOUK UNIQUEMENT
SELECT 
  CASE 
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 1 AND 3 THEN 'T1'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 4 AND 6 THEN 'T2'
    WHEN EXTRACT(MONTH FROM i.date) BETWEEN 7 AND 9 THEN 'T3'
    ELSE 'T4'
  END as trimestre,
  COUNT(*) as nb_factures,
  SUM(i.total) as ca_total,
  SUM(i.urssaf_amount) as urssaf_declare
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE c.name = 'manouk'
  AND EXTRACT(YEAR FROM i.date) = 2026
GROUP BY trimestre
ORDER BY trimestre;

-- 5. Total CA par société en 2026
SELECT 
  c.name as company_name,
  COUNT(*) as nb_factures,
  SUM(i.total) as ca_total,
  SUM(i.urssaf_amount) as urssaf_total
FROM invoices i
JOIN companies c ON c.id = i.company_id
WHERE EXTRACT(YEAR FROM i.date) = 2026
GROUP BY c.name
ORDER BY c.name;

-- 6. Vérifier s'il y a des doublons de factures
SELECT 
  invoice_number,
  COUNT(*) as nb_occurrences,
  string_agg(CAST(total AS TEXT), ', ') as montants
FROM invoices
GROUP BY invoice_number
HAVING COUNT(*) > 1;
