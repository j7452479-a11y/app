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

-- Operational extensions: billing receipts, owned domains, campaign requests and AI audit metadata.
create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hostname text not null unique,
  verification_token text not null default encode(gen_random_bytes(24),'hex'),
  verified_at timestamptz,
  status text not null default 'pending' check(status in ('pending','verified','disabled')),
  created_at timestamptz not null default now()
);
create table public.ad_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check(length(title) between 2 and 120),
  brief text not null check(length(brief) between 10 and 4000),
  channel text not null default 'social' check(channel in ('social','search','display','other')),
  status text not null default 'requested' check(status in ('requested','in_progress','review','delivered','cancelled')),
  period_start date not null default date_trunc('month',now())::date,
  created_at timestamptz not null default now()
);
create table public.ai_usage (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  feature text not null check(feature in ('basic_chat','pro_support')),
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.provider_webhook_events (
  provider text not null,
  event_id text not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  primary key(provider,event_id)
);

alter table public.custom_domains enable row level security;
alter table public.ad_requests enable row level security;
alter table public.ai_usage enable row level security;
alter table public.provider_webhook_events enable row level security;
revoke all on public.custom_domains,public.ad_requests,public.ai_usage,public.provider_webhook_events from anon,authenticated;
grant select,insert,update,delete on public.custom_domains,public.ad_requests to authenticated;
grant select on public.ai_usage to authenticated;
grant usage,select on sequence public.ai_usage_id_seq to authenticated;
create policy "members view domains" on public.custom_domains for select to authenticated using(public.is_org_member(organization_id));
create policy "owners manage domains" on public.custom_domains for all to authenticated using(public.has_org_role(organization_id,array['owner','admin']::public.member_role[])) with check(public.has_org_role(organization_id,array['owner','admin']::public.member_role[]));
create policy "members read campaigns" on public.ad_requests for select to authenticated using(public.is_org_member(organization_id));
create policy "managers manage campaigns" on public.ad_requests for all to authenticated using(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[])) with check(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[]));
create policy "members view usage metadata" on public.ai_usage for select to authenticated using(public.is_org_member(organization_id));

-- Existing stock reservation is reversed if a merchant cancels before fulfilment.
create function public.restore_stock_on_cancel() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if old.state <> 'cancelled' and new.state = 'cancelled' then
    update public.products p set stock=p.stock+i.quantity,updated_at=now()
      from public.order_items i where i.order_id=new.id and i.product_id=p.id and p.organization_id=new.organization_id;
  end if;
  return new;
end $$;
create trigger order_cancel_restores_stock after update of state on public.orders for each row execute function public.restore_stock_on_cancel();

-- Failed subscriptions immediately lock merchant tools. Checkout ends after three days;
-- storefront resolution ends after ten days. A renewal event restores both.
create or replace function public.create_checkout_order(
  store_slug text, customer_name text, customer_email text, customer_phone text,
  shipping_address jsonb, items jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare org uuid; cur char(3); order_id uuid; item jsonb; p public.products%rowtype; qty int; total bigint := 0; sub public.subscriptions%rowtype;
begin
  if length(trim(customer_name)) not between 2 and 120 or length(trim(customer_email)) not between 5 and 254 then raise exception 'Customer details are invalid'; end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) not between 1 and 50 then raise exception 'Cart is invalid'; end if;
  select o.id,s.currency into org,cur from public.organizations o join public.stores s on s.organization_id=o.id where o.slug=store_slug and s.published_at is not null for share of o,s;
  if org is null then raise exception 'Store is unavailable'; end if;
  select * into sub from public.subscriptions where organization_id=org;
  if sub.state not in ('trialing','active') and not (sub.state='past_due' and sub.payment_failed_at > now()-interval '3 days') then raise exception 'Store is not accepting orders'; end if;
  insert into public.orders(organization_id,customer_name,customer_email,customer_phone,shipping_address,currency)
    values(org,trim(customer_name),lower(trim(customer_email)),nullif(trim(customer_phone),''),coalesce(shipping_address,'{}'::jsonb),cur) returning id into order_id;
  for item in select value from jsonb_array_elements(items) loop
    qty := (item->>'quantity')::int; if qty not between 1 and 20 then raise exception 'Quantity is invalid'; end if;
    update public.products set stock=stock-qty,updated_at=now() where id=(item->>'product_id')::uuid and organization_id=org and status='published' and stock>=qty returning * into p;
    if not found then raise exception 'A product is unavailable or out of stock'; end if;
    total := total+p.price_paise*qty;
    insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_paise) values(order_id,p.id,p.name,qty,p.price_paise);
  end loop;
  update public.orders set subtotal_paise=total where id=order_id;
  return jsonb_build_object('order_id',order_id,'order_number',(select order_number from public.orders where id=order_id),'total_paise',total,'payment_status','not_started');
end $$;
alter table public.products add column is_in_stock boolean generated always as (stock > 0) stored;
grant select (id,organization_id,name,description,price_paise,image_url,status,is_in_stock) on public.products to anon;

create function public.is_storefront_available(store_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(
    select 1 from public.organizations o
    join public.stores s on s.organization_id=o.id
    join public.subscriptions sub on sub.organization_id=o.id
    where o.slug=store_slug and s.published_at is not null
      and (sub.state in ('trialing','active') or (sub.state='past_due' and sub.payment_failed_at>now()-interval '10 days'))
  )
$$;
revoke all on function public.is_storefront_available(text) from public;
grant execute on function public.is_storefront_available(text) to anon,authenticated;
alter table public.subscriptions add column pending_plan public.plan_code;
grant all on public.provider_webhook_events to service_role;
grant update on public.subscriptions to service_role;
grant insert on public.ai_usage to service_role;
revoke update,delete on public.ad_requests from authenticated;
grant update(title,brief,channel) on public.ad_requests to authenticated;
revoke update,delete on public.custom_domains from authenticated;

create function public.org_workspace_unlocked(org_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.subscriptions s where s.organization_id=org_id and (
    s.state='active' or (s.state='trialing' and (s.trial_started_at is null or s.trial_ends_at>now()))
  ))
$$;
revoke all on function public.org_workspace_unlocked(uuid) from public;
grant execute on function public.org_workspace_unlocked(uuid) to authenticated;

drop policy "editors manage products" on public.products;
create policy "editors manage products with current entitlement" on public.products for all to authenticated
  using(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[]) and public.org_workspace_unlocked(organization_id))
  with check(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[]) and public.org_workspace_unlocked(organization_id));
drop policy "staff update orders" on public.orders;
create policy "staff update orders with current entitlement" on public.orders for update to authenticated
  using(public.has_org_role(organization_id,array['owner','admin','manager','staff']::public.member_role[]) and public.org_workspace_unlocked(organization_id))
  with check(public.has_org_role(organization_id,array['owner','admin','manager','staff']::public.member_role[]) and public.org_workspace_unlocked(organization_id));
drop policy "owners update stores" on public.stores;
create policy "owners update stores with current entitlement" on public.stores for update to authenticated
  using(public.has_org_role(organization_id,array['owner','admin']::public.member_role[]) and public.org_workspace_unlocked(organization_id))
  with check(public.has_org_role(organization_id,array['owner','admin']::public.member_role[]) and public.org_workspace_unlocked(organization_id));
drop policy "managers manage campaigns" on public.ad_requests;
create policy "managers manage campaigns with current entitlement" on public.ad_requests for all to authenticated
  using(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[]) and public.org_workspace_unlocked(organization_id))
  with check(public.has_org_role(organization_id,array['owner','admin','manager']::public.member_role[]) and public.org_workspace_unlocked(organization_id));

create function public.enforce_ad_request_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.plan_code; lim int;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||date_trunc('month',now())::date::text,0));
  select plan into p from public.subscriptions where organization_id=new.organization_id and public.org_workspace_unlocked(organization_id);
  if p is null then raise exception 'An active plan is required'; end if;
  lim:=case p when 'plus' then 4 when 'pro' then 10 else 0 end;
  if lim=0 then raise exception 'Campaign requests are not included in this plan'; end if;
  if (select count(*) from public.ad_requests where organization_id=new.organization_id and period_start=date_trunc('month',now())::date and status<>'cancelled')>=lim then raise exception 'Monthly campaign request limit reached'; end if;
  new.period_start:=date_trunc('month',now())::date;
  return new;
end $$;
create trigger enforce_ad_request_quota_before_insert before insert on public.ad_requests for each row execute function public.enforce_ad_request_quota();

create function public.enforce_ai_usage_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare p public.plan_code; cap int;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||new.feature||date_trunc('day',now())::date::text,0));
  select plan into p from public.subscriptions where organization_id=new.organization_id and public.org_workspace_unlocked(organization_id);
  if p is null or (p='basic' and new.feature<>'basic_chat') or (p='plus' and new.feature<>'basic_chat') or (p='pro' and new.feature<>'pro_support') then raise exception 'Assistant entitlement is unavailable'; end if;
  cap:=case when p='pro' then 100 else 30 end;
  if (select count(*) from public.ai_usage where organization_id=new.organization_id and created_at>=date_trunc('day',now()) and feature=new.feature)>=cap then raise exception 'Daily assistant usage limit reached'; end if;
  return new;
end $$;
create trigger enforce_ai_usage_quota_before_insert before insert on public.ai_usage for each row execute function public.enforce_ai_usage_quota();

create or replace function public.create_checkout_order(store_slug text,customer_name text,customer_email text,customer_phone text,shipping_address jsonb,items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare org uuid; cur char(3); order_id uuid; item jsonb; p public.products%rowtype; qty int; total bigint:=0; sub public.subscriptions%rowtype;
begin
  if length(trim(customer_name)) not between 2 and 120 or length(trim(customer_email)) not between 5 and 254 then raise exception 'Customer details are invalid'; end if;
  if jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 50 then raise exception 'Cart is invalid'; end if;
  select o.id,s.currency into org,cur from public.organizations o join public.stores s on s.organization_id=o.id where o.slug=store_slug and s.published_at is not null for share of o,s;
  if org is null then raise exception 'Store is unavailable'; end if;
  select * into sub from public.subscriptions where organization_id=org;
  if not (sub.state='active' or (sub.state='trialing' and (sub.trial_started_at is null or sub.trial_ends_at>now())) or (sub.state='past_due' and sub.payment_failed_at>now()-interval '3 days')) then raise exception 'Store is not accepting orders'; end if;
  insert into public.orders(organization_id,customer_name,customer_email,customer_phone,shipping_address,currency) values(org,trim(customer_name),lower(trim(customer_email)),nullif(trim(customer_phone),''),coalesce(shipping_address,'{}'::jsonb),cur) returning id into order_id;
  for item in select value from jsonb_array_elements(items) loop
    qty:=(item->>'quantity')::int;if qty not between 1 and 20 then raise exception 'Quantity is invalid';end if;
    update public.products set stock=stock-qty,updated_at=now() where id=(item->>'product_id')::uuid and organization_id=org and status='published' and stock>=qty returning * into p;
    if not found then raise exception 'A product is unavailable or out of stock';end if;
    total:=total+p.price_paise*qty;insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_paise) values(order_id,p.id,p.name,qty,p.price_paise);
  end loop;
  update public.orders set subtotal_paise=total where id=order_id;
  return jsonb_build_object('order_id',order_id,'order_number',(select order_number from public.orders where id=order_id),'total_paise',total,'payment_status','not_started');
end $$;

create or replace function public.is_storefront_available(store_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.organizations o join public.stores s on s.organization_id=o.id join public.subscriptions sub on sub.organization_id=o.id where o.slug=store_slug and s.published_at is not null and (
    sub.state='active' or (sub.state='trialing' and (sub.trial_started_at is null or sub.trial_ends_at>now())) or (sub.state='past_due' and sub.payment_failed_at>now()-interval '10 days')
  ))
$$;
alter table public.subscriptions add column revisions_used integer not null default 0 check(revisions_used>=0);
create table public.site_revision_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  summary text not null check(length(summary) between 5 and 140),
  details text not null check(length(details) between 10 and 3000),
  status text not null default 'submitted' check(status in ('submitted','in_progress','delivered','declined')),
  created_at timestamptz not null default now()
);
alter table public.site_revision_requests enable row level security;
revoke all on public.site_revision_requests from anon,authenticated;
grant select on public.site_revision_requests to authenticated;
grant all on public.site_revision_requests to service_role;
create policy "members read their revision requests" on public.site_revision_requests for select to authenticated using(public.is_org_member(organization_id));

create function public.request_site_revision(request_summary text,request_details text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare org uuid; p public.plan_code; used int; lim int; new_id uuid;
begin
  select organization_id into org from public.memberships where user_id=(select auth.uid()) and role in ('owner','admin') order by created_at limit 1;
  if org is null or not public.org_workspace_unlocked(org) then raise exception 'Workspace access is not active'; end if;
  if length(trim(request_summary)) not between 5 and 140 or length(trim(request_details)) not between 10 and 3000 then raise exception 'Revision request is invalid'; end if;
  perform pg_advisory_xact_lock(hashtextextended(org::text||'revision',0));
  select plan,revisions_used into p,used from public.subscriptions where organization_id=org for update;
  lim:=case p when 'basic' then 1 when 'plus' then 3 when 'pro' then 5 end;
  if used>=lim then raise exception 'The revision allowance for this plan has been used'; end if;
  insert into public.site_revision_requests(organization_id,requested_by,summary,details) values(org,(select auth.uid()),trim(request_summary),trim(request_details)) returning id into new_id;
  update public.subscriptions set revisions_used=revisions_used+1 where organization_id=org;
  return jsonb_build_object('id',new_id,'used',used+1,'limit',lim);
end $$;
revoke all on function public.request_site_revision(text,text) from public;
grant execute on function public.request_site_revision(text,text) to authenticated;
alter table public.stores add column cod_enabled boolean not null default true;
grant select(organization_id,display_name,description,template,currency,published_at,cod_enabled) on public.stores to anon;
alter table public.orders add column payment_method text not null default 'cod' check(payment_method in ('cod','razorpay'));
alter table public.orders add column payment_status text not null default 'pending' check(payment_status in ('pending','paid','failed','refunded'));
alter table public.orders add column provider_order_id text;
alter table public.orders add column expires_at timestamptz;
create unique index orders_provider_order_id_unique on public.orders(provider_order_id) where provider_order_id is not null;

create table public.store_payment_profiles(
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  provider text not null default 'razorpay' check(provider='razorpay'),
  key_id text not null,
  key_secret_ciphertext text not null,
  webhook_secret_ciphertext text,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.store_payment_profiles enable row level security;
revoke all on public.store_payment_profiles from anon,authenticated;
grant all on public.store_payment_profiles to service_role;

drop function public.create_checkout_order(text,text,text,text,jsonb,jsonb);
create function public.create_checkout_order(store_slug text,customer_name text,customer_email text,customer_phone text,shipping_address jsonb,items jsonb,payment_method text default 'cod')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare org uuid; cur char(3); order_id uuid; item jsonb; p public.products%rowtype; qty int; total bigint:=0; sub public.subscriptions%rowtype; cod_ok boolean;
begin
  if length(trim(customer_name)) not between 2 and 120 or length(trim(customer_email)) not between 5 and 254 then raise exception 'Customer details are invalid'; end if;
  if jsonb_typeof(items)<>'array' or jsonb_array_length(items) not between 1 and 50 then raise exception 'Cart is invalid'; end if;
  if payment_method not in ('cod','razorpay') then raise exception 'Payment method is invalid'; end if;
  select o.id,s.currency,s.cod_enabled into org,cur,cod_ok from public.organizations o join public.stores s on s.organization_id=o.id where o.slug=store_slug and s.published_at is not null for share of o,s;
  if org is null then raise exception 'Store is unavailable'; end if;
  select * into sub from public.subscriptions where organization_id=org;
  if not (sub.state='active' or (sub.state='trialing' and (sub.trial_started_at is null or sub.trial_ends_at>now())) or (sub.state='past_due' and sub.payment_failed_at>now()-interval '3 days')) then raise exception 'Store is not accepting orders'; end if;
  if payment_method='cod' and not cod_ok then raise exception 'Cash on delivery is not enabled'; end if;
  if payment_method='razorpay' and not exists(select 1 from public.store_payment_profiles pr where pr.organization_id=org and pr.enabled) then raise exception 'Online payment is not enabled'; end if;
  insert into public.orders(organization_id,customer_name,customer_email,customer_phone,shipping_address,currency,payment_method,payment_status,expires_at)
    values(org,trim(customer_name),lower(trim(customer_email)),nullif(trim(customer_phone),''),coalesce(shipping_address,'{}'::jsonb),cur,payment_method,'pending',case when payment_method='razorpay' then now()+interval '20 minutes' else null end) returning id into order_id;
  for item in select value from jsonb_array_elements(items) loop
    qty:=(item->>'quantity')::int;if qty not between 1 and 20 then raise exception 'Quantity is invalid';end if;
    update public.products set stock=stock-qty,updated_at=now() where id=(item->>'product_id')::uuid and organization_id=org and status='published' and stock>=qty returning * into p;
    if not found then raise exception 'A product is unavailable or out of stock';end if;
    total:=total+p.price_paise*qty;insert into public.order_items(order_id,product_id,product_name,quantity,unit_price_paise) values(order_id,p.id,p.name,qty,p.price_paise);
  end loop;
  update public.orders set subtotal_paise=total where id=order_id;
  return jsonb_build_object('order_id',order_id,'order_number',(select order_number from public.orders where id=order_id),'total_paise',total,'payment_method',payment_method);
end $$;
revoke all on function public.create_checkout_order(text,text,text,text,jsonb,jsonb,text) from public;
grant execute on function public.create_checkout_order(text,text,text,text,jsonb,jsonb,text) to anon,authenticated;

create function public.expire_pending_payment_orders() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  update public.orders set state='cancelled',payment_status='failed',updated_at=now() where state='pending' and payment_method='razorpay' and expires_at<now();
  get diagnostics n=row_count;return n;
end $$;
revoke all on function public.expire_pending_payment_orders() from public;
grant execute on function public.expire_pending_payment_orders() to anon,authenticated;
create function public.enforce_order_transition() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.state=old.state then return new; end if;
  if old.state='pending' and new.state not in ('confirmed','cancelled') then raise exception 'Order must be confirmed before fulfilment'; end if;
  if old.state='confirmed' and new.state not in ('processing','cancelled','refunded') then raise exception 'Invalid order status transition'; end if;
  if old.state='processing' and new.state not in ('fulfilled','cancelled','refunded') then raise exception 'Invalid order status transition'; end if;
  if old.state='fulfilled' and new.state<>'refunded' then raise exception 'Fulfilled orders can only be refunded'; end if;
  if old.state in ('cancelled','refunded') then raise exception 'Closed orders cannot be reopened'; end if;
  if new.state='cancelled' and old.payment_method='razorpay' and old.payment_status='paid' and new.payment_status<>'refunded' then raise exception 'Refund the captured online payment before cancelling'; end if;
  if new.payment_method='razorpay' and new.state in ('confirmed','processing','fulfilled') and new.payment_status<>'paid' then raise exception 'Payment must be confirmed before fulfilment'; end if;
  if new.state='refunded' and new.payment_status<>'refunded' then raise exception 'Provider refund must be confirmed first'; end if;
  return new;
end $$;
create trigger enforce_order_transition_before_update before update of state on public.orders for each row execute function public.enforce_order_transition();
create or replace function public.bootstrap_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare org_id uuid; base_slug text; chosen_slug text; chosen_template text;
begin
  base_slug:=trim(both '-' from regexp_replace(lower(coalesce(new.raw_user_meta_data->>'business_name','My Store')),'[^a-z0-9]+','-','g'));
  if length(base_slug)<2 then base_slug:='my-store';end if;
  chosen_slug:=left(base_slug,70)||'-'||substr(replace(new.id::text,'-',''),1,6);
  chosen_template:=new.raw_user_meta_data->>'template';
  if chosen_template not in ('essential','fashion','beauty','electronics','home','grocery','food','artisan','luxury','local','b2b','subscription','services','marketplace') or chosen_template is null then chosen_template:='essential';end if;
  insert into public.organizations(name,slug) values(coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Store'),chosen_slug) returning id into org_id;
  insert into public.memberships(organization_id,user_id,role) values(org_id,new.id,'owner');
  insert into public.stores(organization_id,display_name,template) values(org_id,coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Store'),chosen_template);
  insert into public.subscriptions(organization_id) values(org_id);
  return new;
end $$;
alter table public.stores drop constraint if exists stores_template_check;
update public.stores set template=case template
  when 'atelier' then 'artisan'
  when 'market' then 'marketplace'
  when 'studio' then 'essential'
  when 'pantry' then 'grocery'
  when 'flora' then 'beauty'
  when 'objects' then 'home'
  else 'essential'
end;
alter table public.stores add constraint stores_template_check check (
  template in (
    'essential','fashion','beauty','electronics','home','grocery','food',
    'artisan','luxury','local','b2b','subscription','services','marketplace'
  )
);

create or replace function public.bootstrap_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare org_id uuid; base_slug text; chosen_slug text; chosen_template text;
begin
  base_slug:=trim(both '-' from regexp_replace(lower(coalesce(new.raw_user_meta_data->>'business_name','My Store')),'[^a-z0-9]+','-','g'));
  if length(base_slug)<2 then base_slug:='my-store';end if;
  chosen_slug:=left(base_slug,70)||'-'||substr(replace(new.id::text,'-',''),1,6);
  chosen_template:=new.raw_user_meta_data->>'template';
  if chosen_template not in ('essential','fashion','beauty','electronics','home','grocery','food','artisan','luxury','local','b2b','subscription','services','marketplace') or chosen_template is null then chosen_template:='essential';end if;
  insert into public.organizations(name,slug) values(coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Store'),chosen_slug) returning id into org_id;
  insert into public.memberships(organization_id,user_id,role) values(org_id,new.id,'owner');
  insert into public.stores(organization_id,display_name,template) values(org_id,coalesce(nullif(new.raw_user_meta_data->>'business_name',''),'My Store'),chosen_template);
  insert into public.subscriptions(organization_id) values(org_id);
  return new;
end $$;
