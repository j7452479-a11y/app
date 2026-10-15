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
