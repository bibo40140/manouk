-- Table de répartition des montants à facturer par société pour chaque produit
create table if not exists product_company_splits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  amount numeric not null default 0
);

-- Index pour accélérer les recherches
create index if not exists idx_product_company on product_company_splits(product_id, company_id);
