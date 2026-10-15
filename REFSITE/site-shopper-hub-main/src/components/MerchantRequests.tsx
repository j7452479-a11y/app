import { useState } from "react";
import { Plus, ArrowLeft, Check, Clock, FileText } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
type Request = { id: number; title: string; detail: string; channel?: string | undefined; change?: string; status: string };
const allowances = { Basic: { campaigns: 0, revisions: 1 }, Plus: { campaigns: 4, revisions: 3 }, Pro: { campaigns: 10, revisions: 5 } };
export function MerchantRequests({ kind }: { kind: "campaigns" | "revisions" }) {
 const campaign = kind === "campaigns";
 const [plan,setPlan] = useState<keyof typeof allowances>("Plus");
 const [requests,setRequests] = useState<Request[]>([]);
 const [creating,setCreating] = useState(false);
 const [selected,setSelected] = useState<Request>();
 const [title,setTitle] = useState(""); const [detail,setDetail] = useState(""); const [change,setChange] = useState(""); const [channel,setChannel] = useState("Social");
 const limit=allowances[plan][kind]; const remaining=Math.max(0,limit-requests.length);
 return <DashboardShell title={campaign ? "Campaigns" : "Revisions"} intro={campaign ? "Marketing requests for your platform team." : "Design change requests for your storefront."}>
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5"><div className="flex items-center gap-3"><label className="text-sm text-muted-foreground" htmlFor="request-plan">Preview plan</label><select id="request-plan" value={plan} onChange={e=>setPlan(e.target.value as keyof typeof allowances)} className="field w-32">{Object.keys(allowances).map(p=><option key={p}>{p}</option>)}</select></div><Button disabled={!remaining || creating} onClick={()=>{setCreating(true);setSelected(undefined);}}><Plus/>{campaign ? "Request campaign" : "Request revision"}</Button></div>
  <div className="grid gap-5 border-b border-border py-6 sm:grid-cols-3"><div><p className="label-mono text-subtle">{campaign ? "Monthly allowance" : "Total allowance"}</p><p className="mt-2 text-3xl font-bold">{limit}</p></div><div><p className="label-mono text-subtle">Requests made</p><p className="mt-2 text-3xl font-bold">{requests.length}</p></div><div><p className="label-mono text-subtle">Remaining</p><p className="mt-2 text-3xl font-bold text-accent">{remaining}</p></div></div>
  {!remaining && <p role="status" className="mt-5 border-l-2 border-accent bg-accent-soft p-4 text-sm text-accent">{limit===0 ? "Campaign requests are available on Plus and Pro." : "Your preview allowance has been used."}</p>}
  {creating ? <form className="mt-6 max-w-2xl space-y-5" onSubmit={e=>{e.preventDefault();if(!remaining)return;setRequests(prev=>[{id:Date.now(),title,detail,change,channel:campaign?channel:undefined,status:"Preview draft"},...prev]);setCreating(false);setTitle("");setDetail("");setChange("");}}>
    <h2 className="text-xl font-bold">{campaign?"New campaign request":"New revision request"}</h2>
    <label className="block text-sm font-medium">{campaign?"Title":"Short summary"}<input required maxLength={120} value={title} onChange={e=>setTitle(e.target.value)} className="field mt-2"/></label>
    {campaign && <label className="block text-sm font-medium">Channel<select value={channel} onChange={e=>setChannel(e.target.value)} className="field mt-2">{["Social","Search","Display","Other"].map(c=><option key={c}>{c}</option>)}</select></label>}
    <label className="block text-sm font-medium">{campaign?"Creative brief":"Detailed explanation"}<textarea required rows={5} value={detail} onChange={e=>setDetail(e.target.value)} className="field mt-2"/></label>
    {!campaign && <label className="block text-sm font-medium">Desired change<textarea required rows={3} value={change} onChange={e=>setChange(e.target.value)} className="field mt-2"/></label>}
    <div className="flex gap-3"><Button type="submit" disabled={!remaining}><Check/>Save preview request</Button><Button variant="outline" type="button" onClick={()=>setCreating(false)}>Cancel</Button></div>
  </form> : selected ? <div className="mt-6"><Button variant="ghost" onClick={()=>setSelected(undefined)}><ArrowLeft/>All requests</Button><h2 className="mt-4 text-2xl font-bold">{selected.title}</h2><p className="mt-2 text-sm text-accent">{selected.channel ?? "Design revision"} · {selected.status}</p><h3 className="mt-6 font-semibold">{campaign?"Creative brief":"Explanation"}</h3><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{selected.detail}</p>{selected.change && <><h3 className="mt-6 font-semibold">Desired change</h3><p className="mt-2 whitespace-pre-wrap text-muted-foreground">{selected.change}</p></>}</div> : requests.length ? <div className="mt-6"><h2 className="mb-3 text-lg font-bold">Your requests</h2>{requests.map(r=><div key={r.id} className="flex items-center justify-between gap-4 border-b border-border py-4"><div className="min-w-0"><p className="break-words font-medium">{r.title}</p><p className="mt-1 text-sm text-muted-foreground">{r.channel ?? "Design revision"} · <Clock className="inline size-3"/> {r.status}</p></div><Button variant="outline" size="sm" onClick={()=>setSelected(r)}>View</Button></div>)}</div> : <div className="py-14 text-center"><FileText className="mx-auto size-9 text-subtle"/><h2 className="mt-4 text-xl font-bold">{campaign?"Your next campaign starts here":"Make room for your next idea"}</h2><p className="mt-2 text-sm text-muted-foreground">No {kind} requested yet.</p></div>}
  <p className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">Frontend preview · requests are not sent to the platform team and reset when you leave this page.</p>
 </DashboardShell>;
}
