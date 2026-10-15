import { AppShell } from "@/app/_components/app-shell";
import { replyToCustomer } from "@/app/actions";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Send } from "lucide-react";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase.from("memberships").select("organization_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (!membership) return null;
  const [{ data: messages }] = await Promise.all([
    supabase.from("customer_messages").select("id,order_id,sender,body,attachment_path,attachment_kind,created_at").eq("organization_id", membership.organization_id).order("created_at", { ascending: false }).limit(300),
  ]);
  type CustomerMessage = NonNullable<typeof messages>[number];
  let orderMap = new Map<string, { order_number: number; customer_name: string; customer_email: string; state: string }>();
  let mediaMap = new Map<string, string>();
  if (messages?.length) {
    const ids = [...new Set(messages.map((message) => message.order_id))];
    const { data: orders } = await supabase.from("orders").select("id,order_number,customer_name,customer_email,state").in("id", ids);
    orderMap = new Map((orders || []).map((order) => [order.id, order]));
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) { const admin = createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); const signed = await Promise.all(messages.filter((message) => message.attachment_path).map(async (message) => { const { data } = await admin.storage.from("customer-chat").createSignedUrl(message.attachment_path!, 300); return [message.id, data?.signedUrl || ""] as const; })); mediaMap = new Map(signed); }
  }
  const conversations = new Map<string, CustomerMessage[]>();
  for (const message of messages || []) { const list = conversations.get(message.order_id) || []; list.push(message); conversations.set(message.order_id, list); }
  return <AppShell active="/messages"><div className="page messages-page"><div className="page-head"><div><div className="eyebrow">Customer care</div><h1>Messages</h1><p className="subhead">Talk with customers about their orders. Conversations are private to your store team and the customer’s order link.</p></div></div>{conversations.size ? <div className="conversation-list">{[...conversations.entries()].map(([orderId, orderMessages]) => { const order = orderMap.get(orderId); if (!order) return null; const timeline = [...orderMessages].reverse(); return <article className="conversation-panel" key={orderId}><header><div><strong>{order.customer_name}</strong><span>{order.customer_email} · Order #{order.order_number} · {order.state}</span></div><small>{timeline.length} messages</small></header><div className="conversation-thread">{timeline.map((message) => <div className={`chat-message ${message.sender}`} key={message.id}><p>{message.body}</p>{mediaMap.get(message.id) && (message.attachment_kind === "image" ? <a href={mediaMap.get(message.id)} target="_blank" rel="noreferrer"><img src={mediaMap.get(message.id)} alt="Customer attachment"/></a> : <audio controls src={mediaMap.get(message.id)}/>)}<time>{new Date(message.created_at).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" })}</time></div>)}</div><form className="merchant-reply" action={replyToCustomer}><input type="hidden" name="order_id" value={orderId}/><input name="body" aria-label="Reply to customer" required maxLength={4000} placeholder="Write a reply…"/><button className="button small" aria-label="Send reply"><Send size={14}/> Reply</button></form></article>; })}</div> : <div className="message-empty"><h2>No conversations yet</h2><p>When a customer places an order and sends a message from the order page, the conversation will appear here.</p></div>}</div></AppShell>;
}
