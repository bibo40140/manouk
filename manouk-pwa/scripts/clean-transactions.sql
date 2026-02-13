-- Script de nettoyage des transactions pour mise en production
-- Conserve: produits, sociétés, matières premières, clients, fournisseurs, BOM, settings
-- Supprime: factures, achats, alertes stock, déclarations URSSAF, coûts fixes
-- Remet à zéro: stocks des matières premières et produits

-- 1. Supprimer toutes les alertes de stock
DELETE FROM stock_alerts;

-- 2. Supprimer toutes les productions
DELETE FROM productions;

-- 3. Supprimer toutes les lignes de facture (en premier à cause des clés étrangères)
DELETE FROM invoice_lines;

-- 4. Supprimer tous les paiements
DELETE FROM payments;

-- 5. Supprimer toutes les déclarations URSSAF
DELETE FROM urssaf_declarations;

-- 6. Supprimer toutes les factures
DELETE FROM invoices;

-- 7. Supprimer tous les achats
DELETE FROM purchases;

-- 8. Supprimer les coûts fixes (si tu veux les recréer)
DELETE FROM fixed_costs;

-- 9. Remettre à zéro les stocks des matières premières
UPDATE raw_materials SET stock = 0;

-- 10. Remettre à zéro les stocks des produits
UPDATE products SET stock = 0;

-- 11. Remettre à zéro les alertes de stock (seuils) - optionnel
-- UPDATE raw_materials SET alert_threshold = NULL;
-- UPDATE products SET alert_threshold = NULL;

-- Vérification des suppressions
SELECT 'Factures restantes:' as check_type, COUNT(*) as count FROM invoices
UNION ALL
SELECT 'Lignes facture restantes:', COUNT(*) FROM invoice_lines
UNION ALL
SELECT 'Paiements restants:', COUNT(*) FROM payments
UNION ALL
SELECT 'Achats restants:', COUNT(*) FROM purchases
UNION ALL
SELECT 'Productions restantes:', COUNT(*) FROM productions
UNION ALL
SELECT 'Alertes stock restantes:', COUNT(*) FROM stock_alerts
UNION ALL
SELECT 'URSSAF restantes:', COUNT(*) FROM urssaf_declarations
UNION ALL
SELECT 'Coûts fixes restants:', COUNT(*) FROM fixed_costs
UNION ALL
SELECT '--- DONNÉES CONSERVÉES ---:', 0
UNION ALL
SELECT 'Matières premières (conservées):', COUNT(*) FROM raw_materials
UNION ALL
SELECT 'Produits (conservés):', COUNT(*) FROM products
UNION ALL
SELECT 'Clients (conservés):', COUNT(*) FROM customers
UNION ALL
SELECT 'Fournisseurs (conservés):', COUNT(*) FROM suppliers
UNION ALL
SELECT 'Sociétés (conservées):', COUNT(*) FROM companies
UNION ALL
SELECT 'BOM (conservés):', COUNT(*) FROM product_materials;

-- ✅ RÉSULTAT ATTENDU :
-- Toutes les transactions = 0
-- Toutes les données de structure = conservées
-- Stocks = 0 (prêt pour la production)
