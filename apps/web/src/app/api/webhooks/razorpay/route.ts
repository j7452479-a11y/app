import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const runtime="nodejs";
export async function POST(request:Request){
  const secret=process.env.RAZORPAY_WEBHOOK_SECRET,url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!secret||!url||!key)return NextResponse.json({error:"Webhook is not configured"},{status:503});
  const raw=await request.text();if(raw.length>1_000_000)return NextResponse.json({error:"Payload too large"},{status:413});
  const signature=request.headers.get("x-razorpay-signature")||"",eventId=request.headers.get("x-razorpay-event-id")||"";
  const expected=createHmac("sha256",secret).update(raw).digest("hex");
  const left=Buffer.from(signature),right=Buffer.from(expected);
  if(!eventId||left.length!==right.length||!timingSafeEqual(left,right))return NextResponse.json({error:"Invalid signature"},{status:401});
  let payload:{event?:string;payload?:{subscription?:{entity?:{id?:string;status?:string;current_end?:number;notes?:{plan?:string}}}}};
  try{payload=JSON.parse(raw);}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
  const client=createSupabaseClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error:insertError}=await client.from("provider_webhook_events").insert({provider:"razorpay",event_id:eventId,event_type:payload.event||"unknown"});
  if(insertError?.code==="23505")return NextResponse.json({received:true,duplicate:true});
  if(insertError)return NextResponse.json({error:"Could not register provider event"},{status:500});
  const entity=payload.payload?.subscription?.entity;
  if(entity?.id){
    const states:Record<string,string>={"subscription.authenticated":"active","subscription.activated":"active","subscription.charged":"active","subscription.pending":"past_due","subscription.halted":"past_due","subscription.resumed":"active","subscription.cancelled":"cancelled","subscription.completed":"cancelled"};
    const state=states[payload.event||""];
    if(state){const now=new Date().toISOString();const period=entity.current_end?new Date(entity.current_end*1000).toISOString():null;
      const patch:{state:string;payment_failed_at:string|null;current_period_ends_at:string|null;updated_at:string;plan?:string;pending_plan?:null;revisions_used?:number}={state,payment_failed_at:state==="past_due"||state==="suspended"?now:null,current_period_ends_at:period,updated_at:now};
      if(state==="active"){
        const {data:current}=await client.from("subscriptions").select("pending_plan,plan").eq("provider","razorpay").eq("provider_subscription_id",entity.id).maybeSingle();
        const effectivePlan=entity.notes?.plan||current?.pending_plan;
        if(["basic","plus","pro"].includes(effectivePlan||"")){patch.plan=effectivePlan;patch.pending_plan=null;if(effectivePlan!==current?.plan)patch.revisions_used=0;}
      }
      const {error}=await client.from("subscriptions").update(patch).eq("provider","razorpay").eq("provider_subscription_id",entity.id);
      if(error){await client.from("provider_webhook_events").delete().eq("provider","razorpay").eq("event_id",eventId);return NextResponse.json({error:"Could not apply provider event"},{status:500});}
    }
  }
  return NextResponse.json({received:true});
}
