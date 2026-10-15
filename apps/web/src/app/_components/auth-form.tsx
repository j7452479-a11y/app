"use client";
import { useActionState } from "react";
import type { ActionState } from "@/app/actions";

export function AuthForm({ action, signup=false,template="atelier" }: { action:(state:ActionState,form:FormData)=>Promise<ActionState>; signup?:boolean;template?:string }) {
  const [state,formAction,pending]=useActionState(action,{});
  return <form action={formAction}>{signup&&<input type="hidden" name="template" value={template}/>}
    {signup&&<div className="field"><label htmlFor="business">Business name</label><input id="business" name="business" required minLength={2} maxLength={120} autoComplete="organization" placeholder="e.g. Cedar & Salt"/></div>}
    <div className="field"><label htmlFor="email">Email address</label><input id="email" name="email" type="email" required autoComplete="email" placeholder="you@business.com"/></div>
    <div className="field"><label htmlFor="password">Password</label><input id="password" name="password" type="password" required minLength={signup?10:8} autoComplete={signup?"new-password":"current-password"} placeholder={signup?"At least 10 characters":"Your password"}/></div>
    {state.error&&<div role="alert" className="notice error">{state.error}</div>}{state.message&&<div role="status" className="notice">{state.message}</div>}
    <button className="button" style={{width:"100%"}} disabled={pending}>{pending?"Please wait…":signup?"Create your workspace":"Sign in"}</button>
  </form>;
}

export function ProductForm({ action }:{action:(state:ActionState,form:FormData)=>Promise<ActionState>}){
  const [state,formAction,pending]=useActionState(action,{});
  return <form action={formAction}>
    <div className="form-grid"><div className="field"><label>Product name</label><input name="name" required maxLength={160} placeholder="Hand-thrown breakfast bowl"/></div><div className="field"><label>Price (₹)</label><input name="price" type="number" min="0" step="0.01" required placeholder="850"/></div><div className="field"><label>Stock on hand</label><input name="stock" type="number" min="0" step="1" required defaultValue="0"/></div><div className="field"><label>Image URL (optional)</label><input name="image_url" type="url" placeholder="https://…"/></div><div className="field span-two"><label>Description</label><textarea name="description" maxLength={4000} placeholder="Materials, dimensions, care instructions…"/></div><div className="field span-two"><label>Visibility</label><select name="status"><option value="draft">Save as draft</option><option value="published">Publish to storefront</option></select></div></div>
    {state.error&&<div role="alert" className="notice error">{state.error}</div>}{state.message&&<div role="status" className="notice">{state.message}</div>}
    <button className="button" disabled={pending}>{pending?"Saving…":"Save product"}</button>
  </form>;
}
