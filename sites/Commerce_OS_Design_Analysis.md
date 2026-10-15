# Commerce OS storefront design analysis

This synthesis is based on the 14 genre briefs, their benchmark-site UX notes, the consolidated 700-reference index, and the existing Commerce OS storefront implementation. The reference sites are treated as research for broad interaction patterns—not as assets, copy, identity, or pixel-level designs to reproduce.

## What makes the reference sites appealing

Across the library, the strongest sites reduce uncertainty at the moment it matters: what is being sold, how it differs, whether it is available, what happens after clicking, and how to complete the purchase. Their visual style is not one-size-fits-all. It follows the decision the customer needs to make.

- Search and navigation earn their space when catalogues are broad; editorial composition earns its space when taste, material, or provenance is the product.
- Useful specificity builds trust: ingredients, dimensions, fit, compatibility, delivery windows, production lead times, subscription renewal terms, or service scope.
- The best product pages make selection feel low-risk with variants, comparison, guidance, guarantees, and clear stock signals—not with more decorative badges.
- Fast repeat behavior matters for essentials and grocery; slower discovery and strong visual storytelling matter for fashion, artisan, furniture, and luxury.
- The action is part of the brand: add-to-bag, choose a size, schedule pickup, request a quote, subscribe, or book a conversation are different customer intents and should not be disguised as one generic button.
- Mobile behavior is structural, not a final breakpoint: tap targets, persistent basket context, short forms, and clear next steps must survive a narrow viewport.

## Fourteen design directions

| Archetype | Visual grammar | Customer flow to support | Appeal driver |
|---|---|---|---|
| Essential commerce | Quiet neutrals, clear product grid, visible search | Search/category → product → short checkout | Low effort and low visual noise |
| Fashion atelier | Campaign-led, tall product photography, collection chapters | Collection/lookbook → size/color choice → bag | Identity, styling, and seasonal discovery |
| Beauty studio | Soft color, routine sequence, ingredient callouts | Concern/routine → product → trust and usage details | Reassurance and guided choice |
| Electronics grid | Cool precise palette, spec hierarchy, comparison | Filter/search → compare → compatibility/warranty → buy | Confidence that the item fits the need |
| Home & furniture | Room-scale imagery, material palette, generous spacing | Shop by room → inspect dimensions/material → delivery clarity | Helping customers imagine an object in context |
| Grocery & daily needs | Dense but legible, category rail, persistent basket | Availability → fast add/quantity → delivery area/slot → checkout | Speed, predictability, and easy replenishment |
| Food & restaurant | Appetite-led imagery, menu sections, modifier patterns | Pickup/delivery → menu → options/add-ons → time → order | Making the order feel specific and immediate |
| Artisan market | Tactile, asymmetrical, maker-led editorial | Maker/process story → provenance/lead time → item | Human authorship and meaningful craft |
| Premium luxury | Restrained navigation, serif/sans contrast, wide negative space | Collection → detail → advisor/appointment or purchase | Discretion, rarity, and considered service |
| Local business | Place-first identity, hours/contact, warm utility | Location/hours → local availability → call/message/order | Familiarity and confidence in local fulfillment |
| B2B catalogue | Structured data, clear tables, utilitarian hierarchy | Search/spec → quantity/breaks → quote or account terms | Operational certainty for repeat/procurement buyers |
| Subscription goods | Cadence and savings shown beside one-time purchase | Choose item → compare frequency/terms → manage renewal | Convenience without hidden commitment |
| Professional services | Outcome-led editorial, scope and investment clarity | Service fit → evidence/case study → intake → booking | Reduced risk before a high-consideration inquiry |
| Modern marketplace | Search-dominant header, dense taxonomy, collection modules | Search → filter/sort → compare → quick purchase | Breadth without losing orientation |

## What Commerce OS implements now

The app now offers all 14 as selectable storefront starting points, with distinct typography, palette, hero composition, product-grid density, and copy hierarchy. Template choice is carried through signup and store settings and persisted by the new migration. Product search works for search-led archetypes. All archetypes use the existing stock-aware cart, address form, cash-on-delivery option, and merchant Razorpay checkout.

This is a design-system and storefront-structure implementation—not a claim that every genre-specific workflow is complete. Current product data does not yet include variant/size records, specification sheets, ingredients, delivery zones, modifier groups, booking slots, subscription contracts, B2B quote requests, customer reviews, or location/hours. Those require product-model, operations, and provider work before those interactions should be enabled in production. Where such functionality is absent, keep the generic commerce flow explicit and avoid presenting decorative controls as operational.

## Design guardrails

1. Keep the merchant's own brand and product photography central; templates provide hierarchy and rhythm, not a replacement identity.
2. Preserve legible contrast, descriptive image alternatives, keyboard focus, and readable mobile type.
3. Make the primary action match an implemented backend flow. Do not promise booking, recurring charges, quote response times, delivery slots, product recommendations, or ad reach until those systems exist.
4. Let merchant-entered detail create specificity. Never fabricate ingredients, warranties, review counts, availability, outcomes, or origin claims.
5. Use the benchmark library as a pattern vocabulary. Do not copy recognizable brand layouts, logos, photography, or prose.
