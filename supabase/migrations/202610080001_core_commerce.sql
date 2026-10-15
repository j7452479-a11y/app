-- Commerce OS core: tenant isolation is enforced in PostgreSQL, not just in UI code.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','manager','staff');
create type public.plan_code as enum ('basic','plus','pro');
create type public.subscription_state as enum ('trialing','active','past_due','suspended','cancelled','expired');
create type public.order_state as enum ('pending','confirmed','processing','fulfilled','cancelled','refunded');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);
create table public.memberships (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (organization_id,user_id)
);
create index memberships_user_idx on public.memberships(user_id,organization_id);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  display_name text not null,
  description text not null default '',
  template text not null default 'atelier' check (template in ('atelier','market','studio','pantry','flora','objects')),
  currency char(3) not null default 'INR',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan public.plan_code not null default 'basic',
  state public.subscription_state not null default 'trialing',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  payment_failed_at timestamptz,
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (length(name) between 1 and 160),
  description text not null default '',
  price_paise bigint not null check (price_paise >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id)
);
create index products_store_status on public.products(organization_id,status);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_number bigint generated always as identity,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null default '{}'::jsonb,
  state public.order_state not null default 'pending',
  currency char(3) not null default 'INR',
  subtotal_paise bigint not null default 0 check (subtotal_paise >= 0),
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,order_number)
);
create index orders_store_created on public.orders(organization_id,created_at desc);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity between 1 and 100),
  unit_price_paise bigint not null check (unit_price_paise >= 0),
  unique (order_id,product_id)
);
create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.is_org_member(org_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.memberships m where m.organization_id = org_id and m.user_id = (select auth.uid()))
$$;
create function public.has_org_role(org_id uuid, allowed public.member_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.memberships m where m.organization_id = org_id and m.user_id = (select auth.uid()) and m.role = any(allowed))
$$;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.has_org_role(uuid,public.member_role[]) from public;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid,public.member_role[]) to authenticated;

-- Signup creates a personal org, store, and a 30-day trial. Store trial begins only on publish.
create function public.bootstrap_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare org_id uuid; base_slug text; chosen_slug text;
begin
  base_slug := trim(both '-' from regexp_replace(lower(coalesce(new.raw_user_meta_data->>'business_name','My Store')), '[^a-z0-9]+', '-', 'g'));
  if length(base_slug) < 2 then base_slug := 'my-store'; end if;
  chosen_slug := left(base_slug, 70) || '-' || substr(replace(new.id::text,'-',''),1,6);
  insert into public.organizations(name,slug) values (coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Store'),chosen_slug) returning id into org_id;
  insert into public.memberships(organization_id,user_id,role) values (org_id,new.id,'owner');
  insert into public.stores(organization_id,display_name) values (org_id,coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Store'));
  insert into public.subscriptions(organization_id) values (org_id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.bootstrap_new_user();

create function public.start_trial_on_publish() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.published_at is null and new.published_at is not null then
    update public.subscriptions set trial_started_at = now(), trial_ends_at = now() + interval '30 days', updated_at=now()
      where organization_id = new.organization_id and state = 'trialing' and trial_started_at is null;
  end if;
  return new;
end $$;
create trigger store_publish_starts_trial before update of published_at on public.stores for each row execute function public.start_trial_on_publish();

create function public.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare org uuid; entity text; entity_key text;
begin
  org := coalesce(new.organization_id,old.organization_id);
  entity := tg_table_name;
  entity_key := coalesce(new.id::text,old.id::text);
  insert into public.audit_events(organization_id,actor_user_id,action,entity_type,entity_id)
  values(org,(select auth.uid()),lower(tg_op),entity,entity_key);
  if tg_op = 'DELETE' then return old; else return new; end if;
end $$;
create trigger products_audit after insert or update or delete on public.products for each row execute function public.audit_row_change();
create trigger orders_audit after insert or update or delete on public.orders for each row execute function public.audit_row_change();

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.stores enable row level security;
alter table public.subscriptions enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_events enable row level security;

revoke all on public.organizations,public.memberships,public.stores,public.subscriptions,public.products,public.orders,public.order_items,public.audit_events from anon,authenticated;
grant select on public.organizations,public.memberships,public.stores,public.subscriptions,public.products,public.orders,public.order_items,public.audit_events to authenticated;
grant insert,update,delete on public.products to authenticated;
grant update on public.stores to authenticated;
grant update on public.orders to authenticated;
grant usage,select on all sequences in schema public to authenticated;
grant select on public.organizations to anon;
grant select (id,organization_id,name,description,price_paise,image_url,status,created_at,updated_at) on public.products to anon;
grant select (organization_id,display_name,description,template,currency,published_at) on public.stores to anon;

create policy "members read their organizations" on public.organizations for select to authenticated using(public.is_org_member(id));
create policy "public resolves published store slugs" on public.organizations for select to anon using(exists(select 1 from public.stores s where s.organization_id=organizations.id and s.published_at is not null));
create policy "members see membership list" on public.memberships for select to authenticated using(public.is_org_member(organization_id));
create policy "members read stores" on public.stores for select to authenticated using(public.is_org_member(organization_id));
create policy "owners update stores" on public.stores for update to authenticated using(public.has_org_role(organization_id,array['owner','admin']::public.member_role[])) with check(public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));
create policy "members read subscriptions" on public.subscriptions for select to authenticated using(public.is_org_member(organization_id));
create policy "members read products" on public.products for select to authenticated using(public.is_org_member(organization_id));
create policy "public sees published products of published stores" on public.products for select to anon using(status='published' and exists(select 1 from public.stores s where s.organization_id=products.organization_id and s.published_at is not null));
create policy "public reads published stores only" on public.stores for select to anon using(published_at is not null);
create policy "editors manage products" on public.products for all to authenticated using(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[])) with check(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[]));
create policy "members read orders" on public.orders for select to authenticated using(public.is_org_member(organization_id));
create policy "staff update orders" on public.orders for update to authenticated using(public.has_org_role(organization_id,array['owner','admin','manager','staff']::public.member_role[])) with check(public.has_org_role(organization_id,array['owner','admin','manager','staff']::public.member_role[]));
create policy "members read order items" on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_items.order_id and public.is_org_member(o.organization_id)));
create policy "members read audit events" on public.audit_events for select to authenticated using(public.is_org_member(organization_id));

-- Safer order lifecycle: clients may not alter total, payment, tenant, or customer fields directly.
revoke update on public.orders from authenticated;
grant update(state) on public.orders to authenticated;
-- Public order creation must go through a payment-provider-backed checkout RPC added with the provider adapter.

-- Creates a safely-priced pending order and atomically reserves stock. This is not a payment capture:
-- configure a provider adapter + verified webhook before representing orders as paid.
create function public.create_checkout_order(
  store_slug text, customer_name text, customer_email text, customer_phone text,
  shipping_address jsonb, items jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare org uuid; cur char(3); order_id uuid; item jsonb; p public.products%rowtype; qty int; total bigint := 0;
begin
  if length(trim(customer_name)) not between 2 and 120 or length(trim(customer_email)) not between 5 and 254 then
    raise exception 'Customer details are invalid';
  end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then raise exception 'Cart is invalid'; end if;
  select o.id,s.currency into org,cur from public.organizations o join public.stores s on s.organization_id=o.id
    where o.slug=store_slug and s.published_at is not null for share of o,s;
  if org is null then raise exception 'Store is unavailable'; end if;
  if not exists(select 1 from public.subscriptions sub where sub.organization_id=org and sub.state in ('trialing','active')) then
    raise exception 'Store is not accepting orders';
  end if;
  insert into public.orders(organization_id,customer_name,customer_email,customer_phone,shipping_address,currency)
    values(org,trim(customer_name),lower(trim(customer_email)),nullif(trim(customer_phone),''),coalesce(shipping_address,'{}'::jsonb),cur) returning id into order_id;
  for item in select value from jsonb_array_elements(items) loop
    qty := (item->>'quantity')::int;
    if qty not between 1 and 20 then raise exception 'Quantity is invalid'; end if;
    update public.products set stock=stock-qty,updated_at=now()
      where id=(item->>'product_id')::uuid and organization_id=org and status='published' and stock>=qty
      returning * into p;
    if not found then raise exception 'A product is unavailable or out of stock'; end if;
    total := total + p.price_paise * qty;
    insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_paise)
      values(order_id,p.id,p.name,qty,p.price_paise);
  end loop;
  update public.orders set subtotal_paise=total where id=order_id;
  return jsonb_build_object('order_id',order_id,'order_number',(select order_number from public.orders where id=order_id),'total_paise',total,'payment_status','not_started');
end $$;
revoke all on function public.create_checkout_order(text,text,text,text,jsonb,jsonb) from public;
grant execute on function public.create_checkout_order(text,text,text,text,jsonb,jsonb) to anon,authenticated;

