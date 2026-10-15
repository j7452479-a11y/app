"use client";
import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/actions";
import type { ActionState } from "@/app/actions";
export default function ForgotPassword(){const[state,action,pending]=useActionState(requestPasswordReset,{} as ActionState);return <main className="auth-wrap"><section className="auth-card"><Link className="brand" href="/"><span className="brand-mark">c.</span>Commerce OS</Link><h1>Reset your password.</h1><p>We’ll send a secure reset link if the account exists.</p><form action={action}><div className="field"><label>Email address</label><input name="email" type="email" autoComplete="email" required/></div>{state.error&&<div role="alert" className="notice error">{state.error}</div>}{state.message&&<div role="status" className="notice">{state.message}</div>}<button className="button" style={{width:"100%"}} disabled={pending}>{pending?"Sending…":"Send reset link"}</button></form><p style={{marginTop:20}}><Link href="/sign-in" style={{color:"#27664b",fontWeight:700}}>Back to sign in</Link></p></section></main>}
