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
