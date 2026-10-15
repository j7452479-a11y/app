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
