import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/app/_components/marketing-header";

const faqs = [
  ["When does my trial begin?", "Your 30-day trial begins when your storefront is first published. Building the catalogue before publication does not start the trial."],
  ["What is included in each plan?", "Every plan includes core commerce, customer messages and an order-linked chat with image and voice notes. Basic is ₹5,000/month with one revision. Plus is ₹15,000/month with three revisions, up to four managed ad creatives per month, and basic single-turn AI support. Pro is ₹20,000/month with five revisions, up to ten managed ad creatives, an installable store app and customer-facing AI shopping recommendations."],
  ["What does the Pro store app mean?", "A Pro storefront can be installed from a supported browser onto a customer’s phone or desktop for a full-screen app-like experience. It is a PWA, not a pre-built Play Store or App Store listing. Native store distribution requires each business’s developer accounts, signing and store review."],
  ["Can customers pay online?", "The app supports cash on delivery and a Razorpay integration path. Online payments are only available after the platform’s live Razorpay account, keys, webhook, and plan configuration have been validated."],
  ["Can I use my own domain?", "Custom-domain records can be managed in the workspace, but domain provisioning, DNS verification, TLS, and automated publishing still need production provider setup. Don’t point a live domain until those steps are confirmed."],
  ["What happens if a subscription payment fails?", "The merchant dashboard locks after a failed or overdue payment. Storefront restrictions begin after three days of non-payment; after ten days the domain is taken down. Reinstatement depends on the account’s billing state."],
  ["Can I request a different design?", "Included revisions depend on the plan: one for Basic, three for Plus, and five for Pro. Revisions are design/content adjustments to the selected storefront, not unlimited bespoke development."],
];

export default function HelpPage() {
  return <main className="marketing-site"><MarketingHeader/><section className="catalog-intro help-intro"><p className="eyebrow">(A) A FEW CLEAR ANSWERS</p><h1>Good to know<br/><em>before you begin.</em></h1><p>Plain-language notes about setting up and running a Commerce OS storefront.</p></section><section className="help-layout"><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary><span>{String(index + 1).padStart(2,"0")}</span>{question}<b>+</b></summary><p>{answer}</p></details>)}</div><aside className="help-aside"><p className="eyebrow">NEED A HAND?</p><h2>Tell us what you’re trying to build.</h2><p>Start an account to reach the setup flow. Support contact and delivery times will be shown here once a support channel is configured.</p><Link className="button" href="/sign-up">Start setting up <ArrowRight size={14}/></Link></aside></section><MarketingFooter/></main>;
}
