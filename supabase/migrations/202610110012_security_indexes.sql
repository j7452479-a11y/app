-- Tighten API execution grants and add indexes for tenant foreign keys.
revoke all on function public.audit_row_change() from public, anon, authenticated;
revoke all on function public.bootstrap_new_user() from public, anon, authenticated;
revoke all on function public.broadcast_org_activity() from public, anon, authenticated;
revoke all on function public.consume_customer_chat_rate_limit(text) from public, anon, authenticated;
revoke all on function public.create_checkout_order(text,text,text,text,jsonb,jsonb,text) from public, anon, authenticated;
revoke all on function public.enforce_ad_request_quota() from public, anon, authenticated;
revoke all on function public.enforce_ai_usage_quota() from public, anon, authenticated;
revoke all on function public.expire_pending_payment_orders() from public, anon, authenticated;
revoke all on function public.has_org_role(uuid,public.member_role[]) from public, anon, authenticated;
revoke all on function public.is_org_member(uuid) from public, anon, authenticated;
revoke all on function public.is_storefront_available(text) from public, anon, authenticated;
revoke all on function public.org_workspace_unlocked(uuid) from public, anon, authenticated;
revoke all on function public.request_site_revision(text,text) from public, anon, authenticated;
revoke all on function public.resolve_custom_domain(text) from public, anon, authenticated;
revoke all on function public.restore_stock_on_cancel() from public, anon, authenticated;
revoke all on function public.start_trial_on_publish() from public, anon, authenticated;

grant execute on function public.create_checkout_order(text,text,text,text,jsonb,jsonb,text) to anon, authenticated;
grant execute on function public.is_storefront_available(text) to anon, authenticated;
grant execute on function public.resolve_custom_domain(text) to anon, authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_org_role(uuid,public.member_role[]) to authenticated;
grant execute on function public.request_site_revision(text,text) to authenticated;

create index if not exists ad_requests_organization_id_idx on public.ad_requests(organization_id);
create index if not exists ai_usage_organization_id_idx on public.ai_usage(organization_id);
create index if not exists ai_usage_user_id_idx on public.ai_usage(user_id);
create index if not exists audit_events_actor_user_id_idx on public.audit_events(actor_user_id);
create index if not exists audit_events_organization_id_idx on public.audit_events(organization_id);
create index if not exists custom_domains_organization_id_idx on public.custom_domains(organization_id);
create index if not exists customer_messages_organization_id_idx on public.customer_messages(organization_id);
create index if not exists order_items_product_id_idx on public.order_items(product_id);
create index if not exists site_revision_requests_organization_id_idx on public.site_revision_requests(organization_id);
create index if not exists site_revision_requests_requested_by_idx on public.site_revision_requests(requested_by);
