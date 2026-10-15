create function public.enforce_order_transition() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.state=old.state then return new; end if;
  if old.state='pending' and new.state not in ('confirmed','cancelled') then raise exception 'Order must be confirmed before fulfilment'; end if;
  if old.state='confirmed' and new.state not in ('processing','cancelled','refunded') then raise exception 'Invalid order status transition'; end if;
  if old.state='processing' and new.state not in ('fulfilled','cancelled','refunded') then raise exception 'Invalid order status transition'; end if;
  if old.state='fulfilled' and new.state<>'refunded' then raise exception 'Fulfilled orders can only be refunded'; end if;
  if old.state in ('cancelled','refunded') then raise exception 'Closed orders cannot be reopened'; end if;
  if new.state='cancelled' and old.payment_method='razorpay' and old.payment_status='paid' and new.payment_status<>'refunded' then raise exception 'Refund the captured online payment before cancelling'; end if;
  if new.payment_method='razorpay' and new.state in ('confirmed','processing','fulfilled') and new.payment_status<>'paid' then raise exception 'Payment must be confirmed before fulfilment'; end if;
  if new.state='refunded' and new.payment_status<>'refunded' then raise exception 'Provider refund must be confirmed first'; end if;
  return new;
end $$;
create trigger enforce_order_transition_before_update before update of state on public.orders for each row execute function public.enforce_order_transition();
