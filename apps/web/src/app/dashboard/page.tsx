import Link from "next/link";
import { ArrowRight, CircleAlert, Clock3, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";
import { AppShell } from "@/app/_components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { inr, date } from "@/lib/format";

export default async function Dashboard(){
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
  const {data:membership}=await supabase.from("memberships").select("organization_id").eq("user_id",user!.id).limit(1).maybeSingle();
  const org=membership?.organization_id;
  const [storeQ,subQ,productQ,orderQ,paidQ]=await Promise.all([
    supabase.from("stores").select("display_name,published_at").eq("organization_id",org!).maybeSingle(),
    supabase.from("subscriptions").select("plan,state,trial_ends_at,current_period_ends_at,payment_failed_at").eq("organization_id",org!).maybeSingle(),
    supabase.from("products").select("id",{count:"exact",head:true}).eq("organization_id",org!),
    supabase.from("orders").select("id,order_number,customer_name,state,subtotal_paise,created_at").eq("organization_id",org!).order("created_at",{ascending:false}).limit(5),
    supabase.from("orders").select("subtotal_paise").eq("organization_id",org!).in("state",["confirmed","processing","fulfilled"])
  ]);
  const store=storeQ.data,sub=subQ.data;const revenue=(paidQ.data||[]).reduce((sum,row)=>sum+Number(row.subtotal_paise),0);
  const isSuspended=sub?.state==="suspended"||sub?.state==="expired"||sub?.state==="cancelled";
  return <AppShell active="/dashboard"><div className="page"><div className="page-head"><div><div className="eyebrow">Your business at a glance</div><h1>Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {store?.display_name||"there"}.</h1><p className="subhead">Here’s what’s happening with your shop today.</p></div><Link className="button" href="/products">Add a product <ArrowRight size={15}/></Link></div>
    {sub?.state==="past_due"&&<div className="notice warn"><CircleAlert size={15} style={{verticalAlign:"middle",marginRight:6}}/>Payment needs attention. Your dashboard is in read-only mode until payment is resolved. <Link href="/billing" style={{fontWeight:700,textDecoration:"underline"}}>Review billing</Link></div>}
    {isSuspended&&<div className="notice error"><CircleAlert size={15} style={{verticalAlign:"middle",marginRight:6}}/>Store functions are suspended. Review your account status and contact support to restore service.</div>}
    {!store?.published_at&&<div className="notice">Your storefront is still private. Publish it when it is ready to go live — your 30-day trial starts at publication. <Link href="/settings" style={{fontWeight:700,textDecoration:"underline"}}>Review storefront settings</Link></div>}
    <div className="grid stats">{[["Store status",store?.published_at?"Live":"Private",store?.published_at?"Customers can visit your shop":"Only you can see it"],["Products",String(productQ.count??0),"Across your catalogue"],["Orders",String(orderQ.data?.length??0),"Recent orders shown below"],["Confirmed sales",inr(revenue/100),"Confirmed, processing & fulfilled"]].map(([label,value,note])=><article className="card" key={label}><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></article>)}</div>
    <section className="card section-card"><div className="section-title"><h2>Recent orders</h2><Link className="button secondary small" href="/orders">All orders <ArrowRight size={13}/></Link></div>{orderQ.data?.length?<div className="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr></thead><tbody>{orderQ.data.map(o=><tr key={o.id}><td>#{o.order_number}</td><td>{o.customer_name}</td><td>{date(o.created_at)}</td><td><span className={`badge ${o.state==="pending"?"warn":""}`}>{o.state}</span></td><td className="mono">{inr(Number(o.subtotal_paise)/100)}</td></tr>)}</tbody></table></div>:<div className="empty"><ShoppingBag size={24} style={{marginBottom:10,color:"#87938a"}}/><strong>No orders yet</strong>Your published store is ready to welcome its first customer.</div>}</section>
    <div className="grid" style={{gridTemplateColumns:"1fr 1fr",marginTop:18}}><article className="card"><div className="eyebrow"><Clock3 size={13} style={{verticalAlign:"middle"}}/> Plan status</div><h3 style={{fontSize:20,textTransform:"capitalize"}}>{sub?.plan||"Basic"} · {sub?.state||"trialing"}</h3><p className="subhead" style={{fontSize:12}}>{sub?.trial_ends_at?`Trial ends ${date(sub.trial_ends_at)}.`:"Publish your store to begin your 30-day trial."} Billing and renewal information.</p><Link href="/billing" className="button secondary small">Manage plan</Link></article><article className="card"><div className="eyebrow"><Sparkles size={13} style={{verticalAlign:"middle"}}/> Growth tools</div><h3 style={{fontSize:20}}>Help, when you need it.</h3><p className="subhead" style={{fontSize:12}}>Campaign and AI tools depend on your plan and approved provider connections. AI never changes your live store without your review.</p><Link href="/assistant" className="button secondary small">Explore AI support</Link></article></div>
    <div style={{marginTop:20,display:"flex",gap:16,fontSize:11,color:"#77827b"}}><span><PackageCheck size={13} style={{verticalAlign:"middle"}}/> Stock-aware checkout</span><span>Tenant-isolated workspace</span><span>Audit trail enabled</span></div>
    </div></AppShell>;
}
