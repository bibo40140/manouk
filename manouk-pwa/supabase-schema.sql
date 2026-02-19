-- SCHÉMA DATABASE SUPABASE pour Manouk PWA
-- Multi-tenant avec Row Level Security

-- 1. Companies (sociétés multi-tenant)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  address TEXT,
  siret TEXT,
  legal_notice TEXT,
  logo_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers (clients)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Suppliers (fournisseurs)
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Raw Materials (matières premières)
CREATE TABLE raw_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'unité',
  unit_cost DECIMAL(10,2) DEFAULT 0,
  stock DECIMAL(10,2) DEFAULT 0,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Products (produits)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price DECIMAL(10,2) DEFAULT 0,
  stock INTEGER DEFAULT 0,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Product Materials (BOM - nomenclature)
CREATE TABLE product_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, raw_material_id)
);

-- 7. Invoices (factures)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL,
  date DATE NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  total DECIMAL(10,2) DEFAULT 0,
  paid DECIMAL(10,2) DEFAULT 0,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Deliveries (livraisons)
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  invoiced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 9. Delivery Productions (lignes de livraison)
CREATE TABLE delivery_productions (
  delivery_id UUID NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  production_id UUID NOT NULL REFERENCES productions(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (delivery_id, production_id)
);

-- 10. Invoice Lines (lignes de facture)
CREATE TABLE invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Payments (paiements sur factures)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Purchases (achats de matières premières)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  raw_material_id UUID REFERENCES raw_materials(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  paid BOOLEAN DEFAULT FALSE,
  paid_date DATE,
  delivered BOOLEAN DEFAULT FALSE,
  delivered_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. URSSAF Declarations
CREATE TABLE urssaf_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  declared_date DATE,
  paid_date DATE,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Email Settings (paramètres SMTP)
CREATE TABLE email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_secure BOOLEAN DEFAULT TRUE,
  smtp_user TEXT,
  smtp_pass_encrypted TEXT, -- À chiffrer côté serveur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
-- Activer RLS sur toutes les tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE urssaf_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_settings ENABLE ROW LEVEL SECURITY;

-- Policies: un user ne voit que ses propres données
CREATE POLICY "Users can view own companies" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own companies" ON companies
  FOR DELETE USING (auth.uid() = user_id);

-- Customers: via company_id
CREATE POLICY "Users can view customers via company" ON customers
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert customers via company" ON customers
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update customers via company" ON customers
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete customers via company" ON customers
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Suppliers: via company_id
CREATE POLICY "Users can view suppliers via company" ON suppliers
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert suppliers via company" ON suppliers
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update suppliers via company" ON suppliers
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete suppliers via company" ON suppliers
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Raw Materials: via company_id
CREATE POLICY "Users can view raw_materials via company" ON raw_materials
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert raw_materials via company" ON raw_materials
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update raw_materials via company" ON raw_materials
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete raw_materials via company" ON raw_materials
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Products: via company_id
CREATE POLICY "Users can view products via company" ON products
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert products via company" ON products
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update products via company" ON products
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete products via company" ON products
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Product Materials: via product_id
CREATE POLICY "Users can view product_materials via product" ON product_materials
  FOR SELECT USING (product_id IN (SELECT id FROM products WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert product_materials via product" ON product_materials
  FOR INSERT WITH CHECK (product_id IN (SELECT id FROM products WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can update product_materials via product" ON product_materials
  FOR UPDATE USING (product_id IN (SELECT id FROM products WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete product_materials via product" ON product_materials
  FOR DELETE USING (product_id IN (SELECT id FROM products WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Invoices: via company_id
CREATE POLICY "Users can view invoices via company" ON invoices
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert invoices via company" ON invoices
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update invoices via company" ON invoices
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete invoices via company" ON invoices
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Invoice Lines: via invoice_id
CREATE POLICY "Users can view invoice_lines via invoice" ON invoice_lines
  FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert invoice_lines via invoice" ON invoice_lines
  FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can update invoice_lines via invoice" ON invoice_lines
  FOR UPDATE USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete invoice_lines via invoice" ON invoice_lines
  FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Payments: via invoice_id
CREATE POLICY "Users can view payments via invoice" ON payments
  FOR SELECT USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can insert payments via invoice" ON payments
  FOR INSERT WITH CHECK (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can update payments via invoice" ON payments
  FOR UPDATE USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

CREATE POLICY "Users can delete payments via invoice" ON payments
  FOR DELETE USING (invoice_id IN (SELECT id FROM invoices WHERE company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())));

-- Purchases: via company_id
CREATE POLICY "Users can view purchases via company" ON purchases
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert purchases via company" ON purchases
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update purchases via company" ON purchases
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete purchases via company" ON purchases
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- URSSAF Declarations: via company_id
CREATE POLICY "Users can view urssaf via company" ON urssaf_declarations
  FOR SELECT USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert urssaf via company" ON urssaf_declarations
  FOR INSERT WITH CHECK (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can update urssaf via company" ON urssaf_declarations
  FOR UPDATE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete urssaf via company" ON urssaf_declarations
  FOR DELETE USING (company_id IN (SELECT id FROM companies WHERE user_id = auth.uid()));

-- Email Settings: via user_id
CREATE POLICY "Users can view own email_settings" ON email_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email_settings" ON email_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email_settings" ON email_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own email_settings" ON email_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes pour performance
CREATE INDEX idx_companies_user ON companies(user_id);
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_raw_materials_company ON raw_materials(company_id);
CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_date ON invoices(date);
CREATE INDEX idx_purchases_company ON purchases(company_id);
CREATE INDEX idx_purchases_date ON purchases(date);
