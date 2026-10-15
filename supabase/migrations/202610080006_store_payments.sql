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
