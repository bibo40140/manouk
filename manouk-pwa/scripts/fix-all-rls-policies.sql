-- Script pour corriger toutes les RLS policies
-- ACCÈS TOTAL: Tous les utilisateurs authentifiés voient toutes les données

-- ============================================
-- 1. DROP toutes les anciennes policies
-- ============================================

-- Companies
DROP POLICY IF EXISTS "Users can view their companies" ON companies;
DROP POLICY IF EXISTS "Users can insert their companies" ON companies;
DROP POLICY IF EXISTS "Users can update their companies" ON companies;
DROP POLICY IF EXISTS "Users can delete their companies" ON companies;

-- Raw Materials
DROP POLICY IF EXISTS "Users can view raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can view raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can insert raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can insert raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can update raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can update raw_materials" ON raw_materials;
DROP POLICY IF EXISTS "Users can delete raw_materials via company" ON raw_materials;
DROP POLICY IF EXISTS "Users can delete raw_materials" ON raw_materials;

-- Products
DROP POLICY IF EXISTS "Users can view products via company" ON products;
DROP POLICY IF EXISTS "Users can view products" ON products;
DROP POLICY IF EXISTS "Users can insert products via company" ON products;
DROP POLICY IF EXISTS "Users can insert products" ON products;
DROP POLICY IF EXISTS "Users can update products via company" ON products;
DROP POLICY IF EXISTS "Users can update products" ON products;
DROP POLICY IF EXISTS "Users can delete products via company" ON products;
DROP POLICY IF EXISTS "Users can delete products" ON products;

-- Product Materials
DROP POLICY IF EXISTS "Users can view product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can view product_materials" ON product_materials;
DROP POLICY IF EXISTS "Users can insert product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can insert product_materials" ON product_materials;
DROP POLICY IF EXISTS "Users can update product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can update product_materials" ON product_materials;
DROP POLICY IF EXISTS "Users can delete product_materials via product" ON product_materials;
DROP POLICY IF EXISTS "Users can delete product_materials" ON product_materials;

-- Product Company Splits
DROP POLICY IF EXISTS "Users can view product_company_splits" ON product_company_splits;
DROP POLICY IF EXISTS "Users can insert product_company_splits" ON product_company_splits;
DROP POLICY IF EXISTS "Users can update product_company_splits" ON product_company_splits;
DROP POLICY IF EXISTS "Users can delete product_company_splits" ON product_company_splits;

-- Customers
DROP POLICY IF EXISTS "Users can view customers via company" ON customers;
DROP POLICY IF EXISTS "Users can view customers" ON customers;
DROP POLICY IF EXISTS "Users can insert customers via company" ON customers;
DROP POLICY IF EXISTS "Users can insert customers" ON customers;
DROP POLICY IF EXISTS "Users can update customers via company" ON customers;
DROP POLICY IF EXISTS "Users can update customers" ON customers;
DROP POLICY IF EXISTS "Users can delete customers via company" ON customers;
DROP POLICY IF EXISTS "Users can delete customers" ON customers;

-- Invoices
DROP POLICY IF EXISTS "Users can view invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can view invoices" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can insert invoices" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can update invoices" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices via company" ON invoices;
DROP POLICY IF EXISTS "Users can delete invoices" ON invoices;

-- Purchases
DROP POLICY IF EXISTS "Users can view purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can view purchases" ON purchases;
DROP POLICY IF EXISTS "Users can insert purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can insert purchases" ON purchases;
DROP POLICY IF EXISTS "Users can update purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can update purchases" ON purchases;
DROP POLICY IF EXISTS "Users can delete purchases via company" ON purchases;
DROP POLICY IF EXISTS "Users can delete purchases" ON purchases;

-- Fixed Costs
DROP POLICY IF EXISTS "Users can view fixed_costs via company" ON fixed_costs;
DROP POLICY IF EXISTS "Users can view fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can insert fixed_costs via company" ON fixed_costs;
DROP POLICY IF EXISTS "Users can insert fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can update fixed_costs via company" ON fixed_costs;
DROP POLICY IF EXISTS "Users can update fixed_costs" ON fixed_costs;
DROP POLICY IF EXISTS "Users can delete fixed_costs via company" ON fixed_costs;
DROP POLICY IF EXISTS "Users can delete fixed_costs" ON fixed_costs;

-- ============================================
-- 2. CREATE nouvelles policies - ACCÈS TOTAL
-- ============================================

-- Companies
CREATE POLICY "Users can view companies" ON companies
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update companies" ON companies
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete companies" ON companies
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Raw Materials
CREATE POLICY "Users can view raw_materials" ON raw_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert raw_materials" ON raw_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update raw_materials" ON raw_materials
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete raw_materials" ON raw_materials
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Products
CREATE POLICY "Users can view products" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert products" ON products
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update products" ON products
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete products" ON products
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Product Materials
CREATE POLICY "Users can view product_materials" ON product_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert product_materials" ON product_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update product_materials" ON product_materials
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete product_materials" ON product_materials
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Product Company Splits
CREATE POLICY "Users can view product_company_splits" ON product_company_splits
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert product_company_splits" ON product_company_splits
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update product_company_splits" ON product_company_splits
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete product_company_splits" ON product_company_splits
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Customers
CREATE POLICY "Users can view customers" ON customers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update customers" ON customers
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete customers" ON customers
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Invoices
CREATE POLICY "Users can view invoices" ON invoices
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update invoices" ON invoices
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete invoices" ON invoices
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Purchases
CREATE POLICY "Users can view purchases" ON purchases
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update purchases" ON purchases
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete purchases" ON purchases
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Fixed Costs
CREATE POLICY "Users can view fixed_costs" ON fixed_costs
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert fixed_costs" ON fixed_costs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update fixed_costs" ON fixed_costs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete fixed_costs" ON fixed_costs
  FOR DELETE USING (auth.uid() IS NOT NULL);
