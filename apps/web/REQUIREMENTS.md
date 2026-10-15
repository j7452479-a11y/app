# Commerce OS interface requirements

## Design brief

- Product: Commerce OS, a managed storefront marketplace and operating workspace for Indian businesses.
- Target: multi-sector commerce, with Modern Marketplace as the shared discovery pattern.
- Market: Indian merchants and their customers.
- Palette: **Discovery Teal** from `sites/commerce-sector-colors.md` — Primary `#126A73`, Secondary `#D9EEF0`, Accent `#E57443`, Surface `#F8FEFE`, Ink `#17373A`.
- Typography: Manrope for display and DM Sans for operational text.
- Layout: compact commerce discovery above the fold; dense catalogue and order information where decisions are frequent; wide product imagery and calm detail layouts for end-customer stores.

## Feature decisions

The feature extraction study shows modern marketplaces depend most on discovery, product information, availability, and filtering. Commerce OS implements search, catalogue filters, clear product cards, stock state, cart, checkout, order state, and order-linked support. The selected sector template determines presentation; sector-specific systems such as variants, delivery slots, RFQs, subscriptions, and bookings remain unavailable until their data and operations exist.

| Capability | Decision | Source |
|---|---|---|
| Template discovery and search | Included | COM-FR-01, AMZ-FR-01/02 |
| Product media, price, stock and purchase control | Included | COM-FR-02, MYN-FR-04/05 |
| Cart and payment flow | Included | COM-FR-03/04/07, FLP-FR-04 |
| Order status and customer support entry | Included | COM-FR-05, SWI-FR-06 |
| Customer messages with image and voice notes | Included on every plan; linked to an order | COM-FR-05, IM-FR-05 |
| Customer-facing AI recommendations | Pro only, after recommendation data and controls exist | SRS Phase 3 |
| Installable branded storefront app | Pro only; PWA install experience, not an App Store/Play Store binary | Pro plan decision |
| Delivery tracking | Deferred pending a real tracking integration | SWI-FR-07 |
| Reviews, wish lists, coupons and loyalty | Deferred pending data, policy, and service workflows | MYN-FR-07/08, FLP-FR-06 |

## Screen mapping

| Screen | Requirements |
|---|---|
| Marketing home and templates | COM-FR-01, AMZ-FR-01/02, AJI-FR-01/03 |
| Customer storefront and collection | COM-FR-01/02/03, MYN-FR-04, FLP-FR-03 |
| Checkout | COM-FR-03/04/07, FLP-FR-04, COM-NFR-03/05 |
| Order support and customer chat | COM-FR-05, SWI-FR-06, COM-NFR-02/07 |
| Merchant products, orders, customers and messages | COM-FR-05/06, IM-FR-05/06, COM-NFR-02 |
| All screens | COM-FR-08, COM-NFR-06/08 |

## Craft checks

- The interface uses the selected five-token palette rather than the earlier warm cream/rust styling.
- Each important action names its result, with visible focus and reduced-motion handling.
- No page uses fabricated reviews, sales numbers, or delivery promises.
- Customer chat is shown only after an order is created; message access is available on every plan.
