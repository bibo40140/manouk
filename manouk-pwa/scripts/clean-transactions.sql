-- Script de nettoyage des transactions pour mise en production
-- Conserve: produits, sociétés, matières premières, clients, fournisseurs
-- Supprime: factures, achats, alertes stock
-- Remet à zéro: stocks des matières premières et produits

-- 1. Supprimer toutes les alertes de stock
DELETE FROM stock_alerts;

-- 2. Supprimer toutes les factures (et les lignes de facture via CASCADE)
DELETE FROM invoices;

-- 3. Supprimer tous les achats
DELETE FROM purchases;

-- 4. Remettre à zéro les stocks des matières premières
UPDATE raw_materials SET stock = 0;

-- 5. Remettre à zéro les stocks des produits
UPDATE products SET stock = 0;

-- Vérification des suppressions
SELECT 'Factures restantes:' as check_type, COUNT(*) as count FROM invoices
UNION ALL
SELECT 'Achats restants:', COUNT(*) FROM purchases
UNION ALL
SELECT 'Alertes stock restantes:', COUNT(*) FROM stock_alerts
UNION ALL
SELECT 'Matières premières (conservées):', COUNT(*) FROM raw_materials
UNION ALL
SELECT 'Produits (conservés):', COUNT(*) FROM products
UNION ALL
SELECT 'Clients (conservés):', COUNT(*) FROM customers
UNION ALL
SELECT 'Fournisseurs (conservés):', COUNT(*) FROM suppliers
UNION ALL
SELECT 'Sociétés (conservées):', COUNT(*) FROM companies;
