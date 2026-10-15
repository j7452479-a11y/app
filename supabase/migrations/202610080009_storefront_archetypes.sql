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
