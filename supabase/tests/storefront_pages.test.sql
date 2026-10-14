begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'store_pages', 'store pages table exists');
select has_column('public', 'store_pages', 'organization_id', 'store pages are tenant scoped');
select has_column('public', 'store_pages', 'page_type', 'store pages have a page type');
select has_column('public', 'store_pages', 'content', 'store pages keep editable draft content');
select has_column('public', 'store_pages', 'published_content', 'store pages keep a separate published snapshot');
select has_column('public', 'store_pages', 'published_at', 'store pages track publication time');
select has_column('public', 'store_pages', 'revision', 'store pages carry a concurrency revision');
select col_type_is('public', 'store_pages', 'revision', 'uuid', 'store page concurrency tokens are UUIDs');
select col_not_null('public', 'store_pages', 'content', 'draft content is required');
select col_not_null('public', 'store_pages', 'organization_id', 'organization is required');
select col_not_null('public', 'store_pages', 'revision', 'store page revision is required');
select has_column('public', 'products', 'slug', 'products have a persisted slug');
select col_not_null('public', 'products', 'slug', 'product slugs are required');
select has_index('public', 'store_pages', 'store_pages_organization_id_page_type_key', 'one row per organization and page type');
select has_index('public', 'products', 'products_organization_id_slug_key', 'product slugs are unique per organization');

insert into auth.users (id, email) values
  ('20000000-0000-0000-0000-000000000001', 'store-pages-owner@example.test'),
  ('20000001-0000-0000-0000-000000000002', 'store-pages-admin@example.test'),
  ('20000002-0000-0000-0000-000000000003', 'store-pages-manager@example.test'),
  ('20000003-0000-0000-0000-000000000004', 'store-pages-staff@example.test'),
  ('20000004-0000-0000-0000-000000000005', 'store-pages-other@example.test'),
  ('20000005-0000-0000-0000-000000000006', 'store-pages-locked@example.test');

insert into public.organizations (id, name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'Pages Tenant One', 'pages-tenant-one'),
  ('10000000-0000-0000-0000-000000000002', 'Pages Tenant Two', 'pages-tenant-two'),
  ('10000000-0000-0000-0000-000000000003', 'Pages Unavailable', 'pages-unavailable'),
  ('10000000-0000-0000-0000-000000000004', 'Pages Locked', 'pages-locked');

insert into public.memberships (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'owner'),
  ('10000000-0000-0000-0000-000000000001', '20000001-0000-0000-0000-000000000002', 'admin'),
  ('10000000-0000-0000-0000-000000000001', '20000002-0000-0000-0000-000000000003', 'manager'),
  ('10000000-0000-0000-0000-000000000001', '20000003-0000-0000-0000-000000000004', 'staff'),
  ('10000000-0000-0000-0000-000000000002', '20000004-0000-0000-0000-000000000005', 'owner'),
  ('10000000-0000-0000-0000-000000000004', '20000005-0000-0000-0000-000000000006', 'owner');

insert into public.stores (organization_id, display_name, published_at) values
  ('10000000-0000-0000-0000-000000000001', 'Pages Tenant One', now()),
  ('10000000-0000-0000-0000-000000000002', 'Pages Tenant Two', now()),
  ('10000000-0000-0000-0000-000000000003', 'Pages Unavailable', now()),
  ('10000000-0000-0000-0000-000000000004', 'Pages Locked', null);
insert into public.subscriptions (organization_id, state, trial_started_at, trial_ends_at) values
  ('10000000-0000-0000-0000-000000000001', 'active', now(), now() + interval '30 days'),
  ('10000000-0000-0000-0000-000000000002', 'active', now(), now() + interval '30 days'),
  ('10000000-0000-0000-0000-000000000003', 'suspended', now(), now() - interval '1 day'),
  ('10000000-0000-0000-0000-000000000004', 'suspended', now(), now() - interval '1 day');

insert into public.store_pages (organization_id, page_type, content, published_content, published_at) values
  ('10000000-0000-0000-0000-000000000001', 'about', '{"story":"draft version"}', '{"story":"published version"}', now()),
  ('10000000-0000-0000-0000-000000000001', 'faq', '{"items":[]}', null, null),
  ('10000000-0000-0000-0000-000000000002', 'about', '{"story":"other tenant draft"}', '{"story":"other tenant live"}', now()),
  ('10000000-0000-0000-0000-000000000003', 'about', '{"story":"unavailable draft"}', '{"story":"unavailable live"}', now());

select is(
  (select revision is not null from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  true,
  'new store pages receive a UUID concurrency token'
);
insert into public.store_pages (organization_id, page_type, content, revision)
values (
  '10000000-0000-0000-0000-000000000001',
  'contact',
  '{"email":"contact@example.test"}',
  '00000000-0000-0000-0000-000000000000'
);
select isnt(
  (select revision from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'contact'),
  '00000000-0000-0000-0000-000000000000'::uuid,
  'the insert trigger overwrites a caller-supplied revision sentinel'
);
create temporary table store_page_revision_before_update as
select revision from public.store_pages
where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about';
update public.store_pages
set content = content || '{"revision_test":true}'::jsonb
where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about';
select isnt(
  (select revision from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  (select revision from store_page_revision_before_update),
  'every store page update rotates its database-managed UUID token'
);

select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'returns', '{}'::jsonb)$$,
  '23514', null, 'unsupported page types are rejected'
);
select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'about', '{}'::jsonb)$$,
  '23505', null, 'an organization can have only one page of each type'
);

create temporary table legacy_product_slug_fixture (
  id uuid primary key,
  organization_id uuid not null,
  name text not null,
  slug text
);
insert into legacy_product_slug_fixture (id, organization_id, name) values
  ('61234567-89ab-cdef-0123-456789abcdef', '10000000-0000-0000-0000-000000000001', 'Linen Shirt'),
  ('61234567-89ab-cdef-fedc-ba9876543210', '10000000-0000-0000-0000-000000000001', 'Linen Shirt');
update legacy_product_slug_fixture
set slug = public.product_slug_for(name, id);
alter table legacy_product_slug_fixture alter column slug set not null;
alter table legacy_product_slug_fixture add constraint legacy_product_slug_fixture_org_slug_key unique (organization_id, slug);
select is(
  (select count(distinct slug) from legacy_product_slug_fixture),
  2::bigint,
  'legacy backfill produces distinct slugs for duplicate names and UUIDs with the same old prefix'
);

insert into public.products (id, organization_id, name, price_paise, stock, status) values
  ('01234567-89ab-cdef-0123-456789abcdef', '10000000-0000-0000-0000-000000000001', 'Crème Brûlée', 100, 2, 'draft');
insert into public.products (id, organization_id, name, slug, price_paise) values
  ('31234567-89ab-cdef-0123-456789abcdef', '10000000-0000-0000-0000-000000000001', '!!!', '  ', 100);
select is(
  (select slug from public.products where id = '01234567-89ab-cdef-0123-456789abcdef'),
  'creme-brulee-0123456789abcdef0123456789abcdef',
  'generated product slugs match the application normalization and UUID suffix'
);
select is(
  (select slug from public.products where id = '31234567-89ab-cdef-0123-456789abcdef'),
  'product-3123456789abcdef0123456789abcdef',
  'blank slugs and names without ASCII letters use the product fallback'
);
select is(
  public.product_slug_for(repeat('a', 179) || ' ' || repeat('tail', 100), '71234567-89ab-cdef-0123-456789abcdef'::uuid),
  repeat('a', 179) || '-7123456789abcdef0123456789abcdef',
  'long generated slugs truncate at a separator, then trim the trailing hyphen'
);
select is(
  char_length(public.product_slug_for(repeat('a', 179) || ' ' || repeat('tail', 100), '71234567-89ab-cdef-0123-456789abcdef'::uuid)),
  212,
  'long generated slugs remain within the database slug length bound'
);
select ok(
  public.product_slug_for(repeat('a', 179) || ' ' || repeat('tail', 100), '71234567-89ab-cdef-0123-456789abcdef'::uuid)
    ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(public.product_slug_for(repeat('a', 179) || ' ' || repeat('tail', 100), '71234567-89ab-cdef-0123-456789abcdef'::uuid)) <= 2048,
  'long generated slugs satisfy the URL-safe database constraint'
);
insert into public.products (id, organization_id, name, price_paise) values
  ('41234567-89ab-cdef-0123-456789abcdef', '10000000-0000-0000-0000-000000000001', 'Linen Shirt', 100),
  ('41234567-89ab-cdef-fedc-ba9876543210', '10000000-0000-0000-0000-000000000001', 'Linen Shirt', 100);
select is(
  (select slug from public.products where id = '41234567-89ab-cdef-0123-456789abcdef'),
  'linen-shirt-4123456789abcdef0123456789abcdef',
  'new product slugs retain the full UUID for the first colliding-prefix product'
);
select is(
  (select slug from public.products where id = '41234567-89ab-cdef-fedc-ba9876543210'),
  'linen-shirt-4123456789abcdeffedcba9876543210',
  'new product slugs remain unique for duplicate names and colliding eight-character prefixes'
);

insert into public.products (id, organization_id, name, slug, price_paise)
values ('11234567-89ab-cdef-0123-456789abcdef', '10000000-0000-0000-0000-000000000001', 'First custom slug', 'tenant-local-slug', 100);
insert into public.products (id, organization_id, name, slug, price_paise)
values ('21234567-89ab-cdef-0123-456789abcdef', '10000000-0000-0000-0000-000000000002', 'Same slug other tenant', 'tenant-local-slug', 100);
select is(
  (select slug from public.products where id = '11234567-89ab-cdef-0123-456789abcdef'),
  'tenant-local-slug',
  'safe custom product slugs are preserved'
);
select throws_ok(
  $$insert into public.products (organization_id, name, slug, price_paise)
    values ('10000000-0000-0000-0000-000000000001', 'Slash slug', 'linen/shirt', 100)$$,
  '23514', null, 'product slugs cannot contain route separators'
);
select throws_ok(
  $$insert into public.products (organization_id, name, slug, price_paise)
    values ('10000000-0000-0000-0000-000000000001', 'Unsafe slug', 'Linen Shirt', 100)$$,
  '23514', null, 'product slugs must use lowercase URL-safe hyphenated segments'
);
select throws_ok(
  $$insert into public.products (organization_id, name, slug, price_paise)
    values ('10000000-0000-0000-0000-000000000001', 'Duplicate slug', 'tenant-local-slug', 100)$$,
  '23505', null, 'the same slug cannot be used twice within one organization'
);
update public.products set name = 'Renamed product', slug = 'attempted-reassignment'
where id = '01234567-89ab-cdef-0123-456789abcdef';
select is(
  (select slug from public.products where id = '01234567-89ab-cdef-0123-456789abcdef'),
  'creme-brulee-0123456789abcdef0123456789abcdef',
  'renaming a product cannot change its assigned slug'
);

set local role anon;
select is((select count(*) from public.store_pages), 2::bigint, 'anonymous reads include only published pages from available stores');
select is((select count(*) from public.store_pages where published_content is null or published_at is null), 0::bigint, 'anonymous reads exclude draft pages');
select ok(not has_column_privilege('anon', 'public.store_pages', 'content', 'SELECT'), 'anonymous clients cannot select draft content');
select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'contact', '{}'::jsonb)$$,
  '42501', null, 'anonymous clients cannot write pages'
);
reset role;

set local "request.jwt.claim.sub" = '20000000-0000-0000-0000-000000000001';
set local role authenticated;
select is((select count(*) from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001'), 2::bigint, 'members can read their organization drafts and published pages');
select is((select count(*) from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000002'), 0::bigint, 'members cannot read another organization pages');
select lives_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'contact', '{"email":"owner@example.test"}')$$,
  'owners can insert pages while the workspace is unlocked'
);
select lives_ok(
  $$update public.store_pages set content = '{"story":"edited draft"}'::jsonb
    where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'$$,
  'saving draft content is permitted for an owner'
);
select is(
  (select published_content->>'story' from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  'published version',
  'saving a draft leaves the published snapshot unchanged'
);
select lives_ok(
  $$update public.store_pages set published_content = content, published_at = now()
    where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'$$,
  'explicit publish copies draft content into the published snapshot'
);
select is(
  (select published_content->>'story' from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  'edited draft',
  'publishing exposes the copied draft snapshot'
);
select lives_ok(
  $$update public.store_pages set published_at = null
    where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'$$,
  'unpublish hides a page without deleting its draft'
);
select is(
  (select content->>'story' from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  'edited draft',
  'unpublishing preserves the editable draft'
);
select is(
  (select published_content->>'story' from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  'edited draft',
  'unpublishing retains the previous published snapshot'
);
reset role;
set local role anon;
select is(
  (select count(*) from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'),
  0::bigint,
  'anonymous clients cannot read an unpublished snapshot'
);
reset role;
set local role authenticated;
select lives_ok(
  $$delete from public.store_pages where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'contact'$$,
  'owners can delete pages while the workspace is unlocked'
);
reset role;

set local "request.jwt.claim.sub" = '20000001-0000-0000-0000-000000000002';
set local role authenticated;
select lives_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'contact', '{"email":"admin@example.test"}')$$,
  'admins can write pages while the workspace is unlocked'
);
reset role;

set local "request.jwt.claim.sub" = '20000002-0000-0000-0000-000000000003';
set local role authenticated;
select lives_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'shipping_returns', '{"deliveryAreas":"Local area"}')$$,
  'managers can write pages while the workspace is unlocked'
);
reset role;

set local "request.jwt.claim.sub" = '20000003-0000-0000-0000-000000000004';
set local role authenticated;
select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'contact', '{"email":"staff@example.test"}')$$,
  '42501', null, 'staff cannot insert pages'
);
select is((with changed as (
  update public.store_pages set content = '{"story":"staff changed"}'::jsonb
  where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'
  returning 1
) select count(*) from changed), 0::bigint, 'staff cannot update pages');
select is((with removed as (
  delete from public.store_pages
  where organization_id = '10000000-0000-0000-0000-000000000001' and page_type = 'about'
  returning 1
) select count(*) from removed), 0::bigint, 'staff cannot delete pages');
select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000002', 'faq', '{"items":[]}')$$,
  '42501', null, 'staff cannot write another organization pages'
);
reset role;

set local "request.jwt.claim.sub" = '20000004-0000-0000-0000-000000000005';
set local role authenticated;
select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000001', 'contact', '{"email":"other@example.test"}')$$,
  '42501', null, 'a member of another organization cannot write pages'
);
reset role;

set local "request.jwt.claim.sub" = '20000005-0000-0000-0000-000000000006';
set local role authenticated;
select throws_ok(
  $$insert into public.store_pages (organization_id, page_type, content)
    values ('10000000-0000-0000-0000-000000000004', 'about', '{"story":"locked"}')$$,
  '42501', null, 'editors cannot write pages while the workspace is locked'
);
reset role;

select * from finish();
rollback;
