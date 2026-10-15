import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/app/_components/marketing-header";

export default function StartPage() {
  return <main className="marketing-site"><MarketingHeader/><section className="catalog-intro"><p className="eyebrow">(A) START YOUR STOREFRONT</p><h1>A few clear steps<br/><em>to your own shop.</em></h1><p>Create your workspace, add your products and business details, then publish when you are ready. Your 30-day trial begins at first publication.</p><Link className="button hero-button" href="/sign-up">Create your workspace <ArrowRight size={15}/></Link></section><section className="start-checklist"><article><span>01</span><div><h2>Choose a starting point</h2><p>Pick from 14 original storefront layouts.</p><Link href="/templates">Browse templates ↗</Link></div><Check size={18}/></article><article><span>02</span><div><h2>Set up your workspace</h2><p>Create a secure account and add the details needed for your shop.</p><Link href="/sign-up">Create account ↗</Link></div><Check size={18}/></article><article><span>03</span><div><h2>Prepare and publish</h2><p>Add products, choose payment methods, and publish only when ready.</p><Link href="/help">Read setup notes ↗</Link></div><Check size={18}/></article></section><MarketingFooter/></main>;
}
