-- Production runtime jobs and public custom-domain resolution.
create extension if not exists pg_cron;

alter table public.custom_domains
  add column dns_record_type text,
  add column dns_record_name text,
  add column dns_record_value text,
  add column dns_target_type text,
  add column dns_target_name text,
  add column dns_target_value text;

alter table public.orders add constraint orders_organization_id_id_unique unique (organization_id, id);
alter table public.customer_messages
  add constraint customer_messages_order_tenant_fk
  foreign key (organization_id, order_id)
  references public.orders (organization_id, id)
  on delete cascade;
drop policy "merchant replies to own customers" on public.customer_messages;
create policy "merchant replies to own customers" on public.customer_messages for insert to authenticated
  with check (
    sender = 'merchant'
    and public.has_org_role(organization_id,array['owner','admin','manager','staff']::public.member_role[])
    and exists (
      select 1 from public.orders o
      where o.id = customer_messages.order_id
        and o.organization_id = customer_messages.organization_id
    )
  );

-- Expired payment reservations are released without waiting for the next shopper checkout.
revoke all on function public.expire_pending_payment_orders() from public, anon, authenticated;
grant execute on function public.expire_pending_payment_orders() to service_role;

-- Middleware can resolve only an active, verified host to its public store slug.
create or replace function public.resolve_custom_domain(hostname text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select o.slug
  from public.custom_domains d
  join public.organizations o on o.id = d.organization_id
  join public.stores s on s.organization_id = o.id
  join public.subscriptions sub on sub.organization_id = o.id
  where lower(d.hostname) = lower(trim($1))
    and d.status = 'verified'
    and s.published_at is not null
    and (
      sub.state = 'active'
      or (sub.state = 'trialing' and (sub.trial_started_at is null or sub.trial_ends_at > now()))
      or (sub.state = 'past_due' and sub.payment_failed_at > now() - interval '10 days')
    )
  limit 1
$$;
revoke all on function public.resolve_custom_domain(text) from public;
grant execute on function public.resolve_custom_domain(text) to anon, authenticated;

-- Keep public chat links from being used to flood a merchant inbox.
create table if not exists public.customer_chat_rate_limits (
  order_id uuid not null references public.orders(id) on delete cascade,
  minute_bucket timestamptz not null,
  message_count integer not null check (message_count between 1 and 20),
  primary key (order_id, minute_bucket)
);
alter table public.customer_chat_rate_limits enable row level security;
revoke all on public.customer_chat_rate_limits from public, anon, authenticated;
grant all on public.customer_chat_rate_limits to service_role;

create or replace function public.consume_customer_chat_rate_limit(chat_token_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order uuid;
  bucket timestamptz := date_trunc('minute', clock_timestamp());
  current_count integer;
begin
  select o.id into target_order
  from public.orders o
  where o.customer_chat_token_hash = chat_token_hash;
  if target_order is null then return false; end if;

  insert into public.customer_chat_rate_limits as current_limit(order_id, minute_bucket, message_count)
  values (target_order, bucket, 1)
  on conflict (order_id, minute_bucket) do update
    set message_count = current_limit.message_count + 1
    where current_limit.message_count < 20
  returning message_count into current_count;

  return current_count is not null;
end
$$;
revoke all on function public.consume_customer_chat_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_customer_chat_rate_limit(text) to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'commerceos-expire-pending-payments') then
    perform cron.schedule(
      'commerceos-expire-pending-payments',
      '*/5 * * * *',
      'select public.expire_pending_payment_orders();'
    );
  end if;
  if not exists (select 1 from cron.job where jobname = 'commerceos-prune-chat-rate-limits') then
    perform cron.schedule(
      'commerceos-prune-chat-rate-limits',
      '17 3 * * *',
      'delete from public.customer_chat_rate_limits where minute_bucket < now() - interval ''2 days'''
    );
  end if;
end
$$;
