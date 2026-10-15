import { MarketingFooter, MarketingHeader } from "@/app/_components/marketing-header";
import { TemplateCatalog } from "@/app/_components/template-catalog";

export default function TemplatesPage() {
  return <main className="marketing-site"><MarketingHeader/><section className="catalog-intro"><p className="eyebrow">(A) THE STOREFRONT SHELF</p><h1>Find a look that<br/><em>fits how you sell.</em></h1><p>Fourteen original starting points, shaped around the way different businesses serve their customers. Search, filter, and preview the direction before setting up your shop.</p></section><TemplateCatalog/><MarketingFooter/></main>;
}
