"use client";
import Link from "next/link";
import { useActionState } from "react";
import { updatePassword } from "@/app/actions";
import type { ActionState } from "@/app/actions";
export default function ResetPassword(){const[state,action,pending]=useActionState(updatePassword,{} as ActionState);return <main className="auth-wrap"><section className="auth-card"><Link className="brand" href="/"><span className="brand-mark">c.</span>Commerce OS</Link><h1>Choose a new password.</h1><p>Use at least 10 characters you have not used before.</p><form action={action}><div className="field"><label>New password</label><input name="password" type="password" autoComplete="new-password" minLength={10} required/></div><div className="field"><label>Confirm password</label><input name="confirm_password" type="password" autoComplete="new-password" minLength={10} required/></div>{state.error&&<div role="alert" className="notice error">{state.error}</div>}<button className="button" style={{width:"100%"}} disabled={pending}>{pending?"Updating…":"Update password"}</button></form></section></main>}
