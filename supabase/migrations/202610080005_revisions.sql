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
