-- Create relation table for multi-company access
create table if not exists public.user_companies (
  user_id uuid not null,
  company_id uuid not null,
  role text default 'member',
  created_at timestamp with time zone default now(),
  primary key (user_id, company_id),
  constraint user_companies_user_fk foreign key (user_id) references auth.users(id) on delete cascade,
  constraint user_companies_company_fk foreign key (company_id) references public.companies(id) on delete cascade
);

-- Ensure column role exists (idempotent)
do $$
begin
  begin
    alter table public.user_companies add column role text default 'member';
  exception when duplicate_column then
    -- column already exists, ignore
    null;
  end;
end$$;

-- RLS enable
alter table public.user_companies enable row level security;

-- Policy: a user can read their own mappings
drop policy if exists user_companies_select_self on public.user_companies;
create policy user_companies_select_self
  on public.user_companies
  for select
  using (auth.uid() = user_id);

-- Optional: insert/update/delete restricted to admin roles; adjust to your needs
-- Here we allow the same user to manage their own mappings (simplified). Consider tightening in production.
drop policy if exists user_companies_modify_self on public.user_companies;
create policy user_companies_modify_self
  on public.user_companies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Companies SELECT policy: allow seeing companies listed in user_companies
drop policy if exists companies_select_authorized on public.companies;
create policy companies_select_authorized
  on public.companies
  for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.user_id = auth.uid()
        and uc.company_id = companies.id
    )
  );

-- Example policies for a table with company_id column (e.g., invoices)
-- Replace public.invoices with each table that has company_id
-- SELECT
drop policy if exists invoices_select_authorized on public.invoices;
create policy invoices_select_authorized
  on public.invoices
  for select
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.user_id = auth.uid()
        and uc.company_id = invoices.company_id
    )
  );

-- INSERT/UPDATE/DELETE (simplified to allow when authorized). Adjust role handling if needed.
drop policy if exists invoices_modify_authorized on public.invoices;
create policy invoices_modify_authorized
  on public.invoices
  for all
  using (
    exists (
      select 1 from public.user_companies uc
      where uc.user_id = auth.uid()
        and uc.company_id = invoices.company_id
    )
  )
  with check (
    exists (
      select 1 from public.user_companies uc
      where uc.user_id = auth.uid()
        and uc.company_id = invoices.company_id
    )
  );

-- Repeat similar policies for customers, products, purchases, etc.
-- customers
drop policy if exists customers_select_authorized on public.customers;
create policy customers_select_authorized on public.customers for select using (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = customers.company_id)
);
drop policy if exists customers_modify_authorized on public.customers;
create policy customers_modify_authorized on public.customers for all using (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = customers.company_id)
) with check (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = customers.company_id)
);

-- products
drop policy if exists products_select_authorized on public.products;
create policy products_select_authorized on public.products for select using (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = products.company_id)
);
drop policy if exists products_modify_authorized on public.products;
create policy products_modify_authorized on public.products for all using (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = products.company_id)
) with check (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = products.company_id)
);

-- purchases
drop policy if exists purchases_select_authorized on public.purchases;
create policy purchases_select_authorized on public.purchases for select using (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = purchases.company_id)
);
drop policy if exists purchases_modify_authorized on public.purchases;
create policy purchases_modify_authorized on public.purchases for all using (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = purchases.company_id)
) with check (
  exists (select 1 from public.user_companies uc where uc.user_id = auth.uid() and uc.company_id = purchases.company_id)
);

-- You may need to drop existing permissive policies before creating these; review current RLS in your schema.
