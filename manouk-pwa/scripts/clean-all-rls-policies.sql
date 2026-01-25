-- ============================================================================
-- NETTOYAGE COMPLET DES ANCIENNES RLS POLICIES
-- Supprime toutes les anciennes policies avant d'appliquer les nouvelles
-- ============================================================================

-- COMPANIES - Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Users can view own companies" ON companies;
DROP POLICY IF EXISTS "Users can insert own companies" ON companies;
DROP POLICY IF EXISTS "Users can update own companies" ON companies;
DROP POLICY IF EXISTS "Users can delete own companies" ON companies;
DROP POLICY IF EXISTS "Users can view companies" ON companies;
DROP POLICY IF EXISTS "Users can insert companies" ON companies;
DROP POLICY IF EXISTS "Users can update companies" ON companies;
DROP POLICY IF EXISTS "Users can delete companies" ON companies;
DROP POLICY IF EXISTS "companies_select_authorized" ON companies;
DROP POLICY IF EXISTS "companies_insert_authorized" ON companies;
DROP POLICY IF EXISTS "companies_update_authorized" ON companies;
DROP POLICY IF EXISTS "companies_delete_authorized" ON companies;

-- CUSTOMERS
DROP POLICY IF EXISTS "Users can view customers via company" ON customers;
DROP POLICY IF EXISTS "Users can insert customers via company" ON customers;
DROP POLICY IF EXISTS "Users can update customers via company" ON customers;
DROP POLICY IF EXISTS "Users can delete customers via company" ON customers;
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;
DROP POLICY IF EXISTS "customers_select_authorized" ON customers;
DROP POLICY IF EXISTS "customers_modify_authorized" ON customers;

-- SUPPLIERS
DROP POLICY IF EXISTS "Users can view suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers via company" ON suppliers;
DROP POLICY IF EXISTS "Users can view suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can insert suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can update suppliers" ON suppliers;
DROP POLICY IF EXISTS "Users can delete suppliers" ON suppliers;
DROP POLICY IF EXISTS "suppliers_select_authorized" ON suppliers;
DROP POLICY IF EXISTS "suppliers_modify_authorized" ON suppliers;

-- RAW MATERIALS
DROP POLICY IF EXISTS "Users can view raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can insert raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can update raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can delete raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can view raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can insert raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can update raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can delete raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "raw_materials_select_authorized" ON raw_materials;
DROP POLICY IF EXISTS "raw_materials_modify_authorized" ON raw_materials;

-- PRODUCTS
DROP POLICY IF EXISTS "Users can view products via company" ON products;
DROP POLICY IF EXISTS "Users can insert products via company" ON products;
DROP POLICY IF EXISTS "Users can update products via company" ON products;
DROP POLICY IF EXISTS "Users can delete products via company" ON products;
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;
DROP POLICY IF EXISTS "products_select_authorized" ON products;
DROP POLICY IF EXISTS "products_modify_authorized" ON products;

-- PRODUCT MATERIALS
DROP POLICY IF EXISTS "Users can view product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can insert product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can update product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can delete product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can view product_materials" ON product_materials;
DROP POLICY IF EXISTS "Users can insert product_materials" ON product_materials;
DROP POLICY IF EXISTS "Users can update product_materials" ON product_materials;
DROP POLICY IF EXISTS "Users can delete product_materials" ON product_materials;
DROP POLICY IF EXISTS "product_materials_select_authorized" ON product_materials;
DROP POLICY IF EXISTS "product_materials_modify_authorized" ON product_materials;

-- INVOICES
DROP POLICY IF EXISTS "Users can view invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;
DROP POLICY IF EXISTS "invoices_select_authorized" ON invoices;
DROP POLICY IF EXISTS "invoices_modify_authorized" ON invoices;

-- INVOICE LINES
DROP POLICY IF EXISTS "Users can view invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can insert invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can update invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can delete invoice_lines via invoice" ON invoice_lines;
DROP POLICY IF EXISTS "Users can view invoice_lines" ON invoice_lines;
DROP POLICY IF EXISTS "Users can insert invoice_lines" ON invoice_lines;
DROP POLICY IF EXISTS "Users can update invoice_lines" ON invoice_lines;
DROP POLICY IF EXISTS "Users can delete invoice_lines" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_select_authorized" ON invoice_lines;
DROP POLICY IF EXISTS "invoice_lines_modify_authorized" ON invoice_lines;

-- PURCHASES
DROP POLICY IF EXISTS "Users can view purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can insert purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can update purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can delete purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can view purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update purchases" ON purchases;
DROP POLICY IF EXISTS "Users can delete purchases" ON purchases;
DROP POLICY IF EXISTS "purchases_select_authorized" ON purchases;
DROP POLICY IF EXISTS "purchases_modify_authorized" ON purchases;

-- FIXED COSTS
DROP POLICY IF EXISTS "Users can view their fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can insert their fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can update their fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can delete their fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can view fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can insert fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can update fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can delete fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_select_authorized" ON fixed_costs;
DROP POLICY IF EXISTS "fixed_costs_modify_authorized" ON fixed_costs;

-- EMAIL SETTINGS
DROP POLICY IF EXISTS "Users can view own email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert own email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update own email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can delete own email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can view email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can insert email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can update email_settings" ON email_settings;
DROP POLICY IF EXISTS "Users can delete email_settings" ON email_settings;
DROP POLICY IF EXISTS "email_settings_select_authorized" ON email_settings;
DROP POLICY IF EXISTS "email_settings_modify_authorized" ON email_settings;

-- Vérification
SELECT 
  'Policies restantes après nettoyage:' as info,
  COUNT(*) as count
FROM pg_policies 
WHERE schemaname = 'public';
