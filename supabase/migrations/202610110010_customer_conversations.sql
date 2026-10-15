-- Private order-scoped customer conversations. Customer access is by a random capability token,
-- while merchants access messages through organization membership and RLS.
alter table public.orders add column customer_chat_token_hash text;

create table public.customer_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  sender text not null check (sender in ('customer','merchant')),
  body text not null default '' check (length(body) <= 4000),
  attachment_path text,
  attachment_kind text check (attachment_kind in ('image','audio')),
  created_at timestamptz not null default now(),
  constraint customer_messages_content check (length(body) > 0 or attachment_path is not null)
);
create index customer_messages_order_created on public.customer_messages(order_id,created_at);
alter table public.customer_messages enable row level security;
revoke all on public.customer_messages from anon,authenticated;
grant select,insert on public.customer_messages to authenticated;
create policy "merchant reads own customer messages" on public.customer_messages for select to authenticated using (public.is_org_member(organization_id));
create policy "merchant replies to own customers" on public.customer_messages for insert to authenticated with check (sender='merchant' and public.has_org_role(organization_id,array['owner','admin','manager','staff']::public.member_role[]));
grant all on public.customer_messages to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('customer-chat','customer-chat',false,8388608,array['image/jpeg','image/png','image/webp','image/gif','audio/webm','audio/ogg','audio/mp4','audio/mpeg'])
on conflict(id) do nothing;
create policy "merchant reads own chat media" on storage.objects for select to authenticated using (
  bucket_id='customer-chat' and exists (
    select 1 from public.customer_messages m where m.attachment_path=name and public.is_org_member(m.organization_id)
  )
);
grant select on public.orders to service_role;
