import Link from "next/link";
import { signIn } from "@/app/actions";
import { AuthForm } from "@/app/_components/auth-form";
export default function SignIn(){return <main className="auth-wrap"><section className="auth-card"><Link className="brand" href="/"><span className="brand-mark">c.</span>Commerce OS</Link><h1>Good to have you back.</h1><p>Sign in to your private business workspace.</p><AuthForm action={signIn}/><div className="login-row" style={{marginTop:14}}><span>Forgot your password?</span><Link href="/forgot-password" style={{color:"#27664b",fontWeight:700}}>Reset it →</Link></div><div className="login-row" style={{marginTop:14}}><span>New to Commerce OS?</span><Link href="/sign-up" style={{color:"#27664b",fontWeight:700}}>Create your workspace →</Link></div></section></main>}
