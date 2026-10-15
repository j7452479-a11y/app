# Indian Commerce Platform SRS

**Document status:** Research-derived reference specification  
**Scope:** Feature requirements inferred from the ten named Indian platforms in `site.txt` and the project’s benchmark research.  
**Important:** This is a pattern specification, not a claim that every described behavior exists on each live site. Validate legal terms, payment methods, delivery policies, prices, and third-party integrations against the target product before release.

## 1. Purpose

Define an implementation-ready feature catalogue for ten commerce and service archetypes represented by Indian platforms:

1. Myntra — fashion marketplace
2. AJIO — fashion and lifestyle marketplace
3. Croma — consumer electronics retail
4. Amazon.in — horizontal marketplace
5. Flipkart — horizontal marketplace
6. Nykaa — beauty commerce
7. IndiaMART — B2B supplier marketplace
8. Decathlon India — omnichannel sporting goods
9. PVR Cinemas — cinema discovery and ticketing
10. Swiggy — location-based food delivery

Each platform is treated as a **reference pattern**, not a brand to reproduce.

## 2. Common Requirements

### 2.1 Personas

| Persona | Primary goal |
|---|---|
| Guest shopper | Browse, compare, understand cost and delivery, and purchase quickly. |
| Registered customer | Manage identity, addresses, saved items, orders, returns, and support. |
| Merchant / supplier | List inventory or services, maintain availability, receive orders or leads, and resolve fulfillment. |
| Operations staff | Monitor orders, exceptions, refunds, availability, content, and customer support. |
| Administrator | Manage policy, catalog governance, access, promotions, observability, and integrations. |

### 2.2 Baseline functional requirements

| ID | Requirement |
|---|---|
| COM-FR-01 | The system shall provide responsive discovery through navigation, search, and browseable category pages. |
| COM-FR-02 | The system shall show a product/service title, price or quote state, media, availability state, and primary action before purchase. |
| COM-FR-03 | The system shall retain a basket or booking context across the primary customer journey. |
| COM-FR-04 | The system shall collect only the address, contact, payment, and consent information needed for the selected fulfillment mode. |
| COM-FR-05 | The system shall provide a post-purchase record with status, payment state, timeline, and support entry point. |
| COM-FR-06 | The system shall clearly distinguish an implemented action (buy, book, request quote, schedule pickup) from a non-operational marketing control. |
| COM-FR-07 | The system shall disclose material constraints before final confirmation: price components, availability, delivery/pickup window, return/cancellation policy, and applicable terms. |
| COM-FR-08 | The system shall support keyboard navigation, visible focus, semantic headings, image alternatives, and contrast meeting WCAG 2.2 AA. |

### 2.3 Baseline non-functional requirements

| ID | Requirement |
|---|---|
| COM-NFR-01 | Protect credentials, payment tokens, addresses, and order records in transit and at rest using current industry-standard controls. Never store raw card data unless the platform is formally PCI DSS compliant for that scope. |
| COM-NFR-02 | Use server-side authorization for every account, order, cart, supplier, and administrative action. |
| COM-NFR-03 | Make price, promotion, inventory, delivery eligibility, and booking availability authoritative on the server at confirmation time. |
| COM-NFR-04 | Instrument search, listing, cart/booking, payment initiation, payment outcome, and fulfillment events with privacy-conscious analytics. |
| COM-NFR-05 | Use idempotency keys for payment, booking, refund, and order-confirmation commands. |
| COM-NFR-06 | Make pages usable on 360px-wide mobile viewports; do not hide essential price, quantity, selection, or checkout controls on mobile. |
| COM-NFR-07 | Publish a data-retention and deletion policy appropriate to the business, including customer consent records where required. |
| COM-NFR-08 | Define service-level objectives and graceful error messages for search, checkout, booking, quote submission, and status tracking. |

---

## 3. Myntra — Fashion Marketplace

### 3.1 Product objective
Enable a high-volume fashion journey: discover style, narrow by fit/brand/price, inspect apparel, choose size and color, and buy with delivery and return clarity.

### 3.2 Functional requirements

| ID | Requirement |
|---|---|
| MYN-FR-01 | Provide gender, category, occasion, brand, trend, and sale-led navigation. |
| MYN-FR-02 | Provide search suggestions, typo tolerance, product/category/brand result grouping, and recent-search handling. |
| MYN-FR-03 | Support listing filters for category, brand, size, color, price, discount, rating, fabric, fit, and availability where catalog data supports them. |
| MYN-FR-04 | Display product cards with image, brand, title, price, discount state, rating summary where available, wish-list control, and color/variant cue. |
| MYN-FR-05 | Provide a product page with multi-image media, variant selection, size availability, size-guide access, fit/model information, delivery estimate by postal code, return terms, and seller/brand details where applicable. |
| MYN-FR-06 | Prevent cart addition when required size or variant selection is incomplete. |
| MYN-FR-07 | Support wish lists, saved addresses, order history, cancellation/return initiation, and order tracking for authenticated users. |
| MYN-FR-08 | Support promotion/coupon validation on the server and show ineligible promotion explanations. |
| MYN-FR-09 | Support marketplace seller attribution, policy disclosure, and catalog moderation. |

### 3.3 Data entities
`Product`, `Style`, `SKU`, `SizeOption`, `ColorOption`, `Brand`, `Category`, `SellerOffer`, `Inventory`, `Price`, `Promotion`, `Customer`, `Wishlist`, `Cart`, `Order`, `Shipment`, `ReturnRequest`.

### 3.4 Acceptance criteria
- A shopper cannot buy an apparel SKU without selecting a required size.
- A changed postal code refreshes delivery eligibility before the order is confirmed.
- A return request is limited by the order’s policy and eligible line-item state.

---

## 4. AJIO — Fashion and Lifestyle Marketplace

### 4.1 Product objective
Support fashion/lifestyle discovery with brand collections, sale-led entry points, editorial merchandising, and a standard marketplace checkout.

### 4.2 Functional requirements

| ID | Requirement |
|---|---|
| AJI-FR-01 | Provide category, brand, collection, sale, and editorial landing pages. |
| AJI-FR-02 | Provide site search with suggested queries and results that can be narrowed by product attribute. |
| AJI-FR-03 | Support fashion listing facets, sort order, paginated or incremental loading, and URL-addressable filter state. |
| AJI-FR-04 | Provide product detail pages with brand hierarchy, imagery, size selection, price/discount presentation, product attributes, care details, availability, and delivery/return information. |
| AJI-FR-05 | Support a wish list and persistent bag for signed-in customers. |
| AJI-FR-06 | Support coupons, sale rules, and eligibility messaging without applying a discount merely from client-side state. |
| AJI-FR-07 | Support orders, invoices, cancellations, returns, refunds, and customer-care handoff. |
| AJI-FR-08 | Support merchandising modules such as featured brands, curated looks, and cross-sell recommendations, with manual editorial override. |

### 4.3 Data entities
`Brand`, `Collection`, `EditorialModule`, `Product`, `SKU`, `Attribute`, `PriceRule`, `Coupon`, `Cart`, `Order`, `Return`, `Refund`, `CustomerSupportCase`.

### 4.4 Acceptance criteria
- A copied filtered-listing URL reproduces its sort/filter state.
- Coupon eligibility is recalculated on every cart mutation and at checkout.
- A catalog editor can feature a collection without changing product inventory records.

---

## 5. Croma — Consumer Electronics Retail

### 5.1 Product objective
Help customers make confident electronics purchases through specifications, comparison, store context, protection plans, delivery, and installation information.

### 5.2 Functional requirements

| ID | Requirement |
|---|---|
| CRO-FR-01 | Provide department navigation and search across consumer-electronics catalogues. |
| CRO-FR-02 | Support faceted filtering by technical and commercial attributes, including brand, price, rating, capacity/specification, availability, and delivery/pickup eligibility. |
| CRO-FR-03 | Provide structured specification tables rather than prose-only technical descriptions. |
| CRO-FR-04 | Support product comparison limited to compatible product types and normalize differing attributes in a comparison view. |
| CRO-FR-05 | Show warranty, manufacturer information, included accessories, compatibility constraints, and protection-plan options where supplied. |
| CRO-FR-06 | Determine delivery, pickup, installation, and service eligibility from product, stock, and postal-code/store data. |
| CRO-FR-07 | Support add-to-cart, payment, order tracking, cancellation/return, invoice retrieval, and service-support requests. |
| CRO-FR-08 | Support store locator, selected-store persistence, and in-store pickup handoff. |

### 5.3 Data entities
`Product`, `SpecificationDefinition`, `SpecificationValue`, `ComparisonSet`, `Warranty`, `ProtectionPlan`, `Store`, `StoreInventory`, `DeliveryPromise`, `InstallationService`, `Order`, `ServiceTicket`.

### 5.4 Acceptance criteria
- Comparison only exposes attributes shared or explicitly mapped across selected products.
- Installation is selectable only for eligible product/postal-code combinations.
- Store-pickup availability is based on the selected store’s real-time or explicitly time-stamped inventory.

---

## 6. Amazon.in — Horizontal Marketplace

### 6.1 Product objective
Enable broad catalogue discovery and marketplace purchasing with department-scoped search, seller offers, delivery promises, account/order services, and buyer confidence signals.

### 6.2 Functional requirements

| ID | Requirement |
|---|---|
| AMZ-FR-01 | Provide department-aware search, query suggestions, category navigation, and sponsored/merchandising placement labeling. |
| AMZ-FR-02 | Support results sorting and facets appropriate to category, including price, brand, rating, delivery eligibility, and availability. |
| AMZ-FR-03 | Represent a product separately from seller offers, allowing price, inventory, condition, fulfillment method, and seller details to vary by offer. |
| AMZ-FR-04 | Provide product media, variants, specification/attribute information, ratings/reviews with moderation controls, Q&A where supported, and policy information. |
| AMZ-FR-05 | Evaluate postal-code delivery promise and payment eligibility before order placement. |
| AMZ-FR-06 | Support cart, saved-for-later, wish lists, address book, order history, cancellation, replacement/return workflows, and customer support. |
| AMZ-FR-07 | Provide seller onboarding, offer management, shipment/fulfillment integration, policy enforcement, and seller performance controls. |
| AMZ-FR-08 | Maintain immutable audit records for price, offer, payment, fulfillment, and refund transitions. |

### 6.3 Data entities
`CatalogProduct`, `Variant`, `Seller`, `SellerOffer`, `FulfillmentMethod`, `Review`, `Question`, `Address`, `PaymentAttempt`, `Order`, `OrderItem`, `Shipment`, `Return`, `Refund`, `Dispute`.

### 6.4 Acceptance criteria
- The customer sees the actual seller/fulfillment offer being purchased at confirmation.
- Delivery estimates are calculated from the selected offer and destination, not a generic product setting.
- A return/refund transition is idempotent and auditable.

---

## 7. Flipkart — Horizontal Marketplace

### 7.1 Product objective
Provide promotion-rich marketplace discovery across high-frequency and durable goods, with search, filters, seller/offer choice, delivery context, flexible payment, account services, and support.

### 7.2 Functional requirements

| ID | Requirement |
|---|---|
| FLP-FR-01 | Provide broad category navigation, deal/collection landing pages, and search suggestions. |
| FLP-FR-02 | Support category-specific filter schemas, sorting, and persistent result state. |
| FLP-FR-03 | Display product pricing, discount state, seller/offer context, ratings, media, specifications, return/replacement policy, and delivery promise. |
| FLP-FR-04 | Support payment methods through tokenized/provider-managed flows, including methods enabled for an order’s eligibility rules. |
| FLP-FR-05 | Support marketplace seller onboarding, catalog/offer operations, serviceability, shipping, cancellation, replacement/return, and refund workflow. |
| FLP-FR-06 | Provide wish list, order history, profile, notifications, customer-care, rewards/membership, and gift-card modules only where those services are implemented. |
| FLP-FR-07 | Clearly label promotional financing, exchange, protection, installation, and warranty terms where available. |

### 7.3 Data entities
`Category`, `Product`, `Offer`, `Seller`, `ServiceabilityRule`, `Promotion`, `PaymentMethodEligibility`, `ExchangeQuote`, `ProtectionPlan`, `Order`, `ReplacementRequest`, `RewardAccount`.

### 7.4 Acceptance criteria
- A promotional price is accompanied by its conditions and expiration where applicable.
- Exchange/trade-in value is not final until its eligibility/condition rules have been satisfied.
- A replacement request cannot bypass seller, policy, and fulfillment validation.

---

## 8. Nykaa — Beauty Commerce

### 8.1 Product objective
Enable beauty discovery and confidence through ingredient/shade/concern-led content, brand and product catalogues, customer reviews, routines, and commerce fulfillment.

### 8.2 Functional requirements

| ID | Requirement |
|---|---|
| NYK-FR-01 | Provide browse paths by category, brand, beauty concern, trend, routine, and offer. |
| NYK-FR-02 | Support search and filters for brand, price, category, concern, formulation, rating, shade, and availability where those attributes exist. |
| NYK-FR-03 | Provide product details including images, shade/variant selection, ingredient information, usage guidance, safety information supplied by the brand, price, delivery/return context, and reviews. |
| NYK-FR-04 | Support shade guidance or recommendation tools only with clear limitations, consent for camera/image use, and a manual fallback. |
| NYK-FR-05 | Support editorial/tutorial/routine modules that link to real catalog products and preserve clear sponsored/affiliate labeling where relevant. |
| NYK-FR-06 | Support wish lists, carts, checkout, orders, cancellation/return/refund paths, and customer support. |
| NYK-FR-07 | Moderate reviews, images, and user-generated content; disclose the verification basis of review labels. |

### 8.3 Data entities
`BeautyProduct`, `Shade`, `Ingredient`, `Concern`, `Routine`, `Tutorial`, `Review`, `Brand`, `Promotion`, `Cart`, `Order`, `Return`.

### 8.4 Acceptance criteria
- A shade-specific SKU cannot be added unless a shade is selected when required.
- Ingredient and safety content is traceable to a versioned brand/product data source.
- A camera-based guidance flow never blocks manual shade browsing.

---

## 9. IndiaMART — B2B Supplier Marketplace

### 9.1 Product objective
Connect buyers with suppliers through product/service search, verified supplier profiles, lead/RFQ capture, quote negotiation, and trust signals rather than a universal consumer checkout.

### 9.2 Functional requirements

| ID | Requirement |
|---|---|
| IM-FR-01 | Provide product, service, category, and supplier search with regional/language support where required by the business. |
| IM-FR-02 | Provide supplier profiles containing business identity, verification state, location, capabilities, catalog, response channel, and policy/qualification information. |
| IM-FR-03 | Allow buyers to submit an enquiry or RFQ containing product/service, quantity, location, required date, contact details, and free-text requirements. |
| IM-FR-04 | Route RFQs to eligible suppliers according to category, geography, capacity, and platform policies, while rate-limiting spam and duplicate lead creation. |
| IM-FR-05 | Support supplier replies, quote versions, quote validity, minimum-order quantity, lead status, and buyer/supplier communication records. |
| IM-FR-06 | Provide buyer and supplier account areas for enquiry history, saved suppliers, listings, lead management, verification, and support. |
| IM-FR-07 | Display verification/payment-protection claims only when there is a documented operational program behind them. |
| IM-FR-08 | Support high-abuse controls: contact-data protection, scam reporting, identity checks appropriate to risk, rate limiting, content moderation, and audit logs. |

### 9.3 Data entities
`Buyer`, `Supplier`, `SupplierVerification`, `Listing`, `Capability`, `RFQ`, `Lead`, `Quote`, `QuoteLine`, `Conversation`, `Region`, `Report`, `ModerationCase`.

### 9.4 Acceptance criteria
- An RFQ is assigned a unique immutable identifier and cannot be silently duplicated by retry.
- Suppliers only receive leads they are authorized and eligible to receive.
- Quote revisions preserve historical terms and timestamps.

---

## 10. Decathlon India — Omnichannel Sporting Goods

### 10.1 Product objective
Support sport-led discovery, product selection, stock confidence, online fulfillment, in-store collection, store discovery, and post-purchase service/returns.

### 10.2 Functional requirements

| ID | Requirement |
|---|---|
| DEC-FR-01 | Provide browse journeys by sport, participant profile, activity level, category, and seasonal/collection needs. |
| DEC-FR-02 | Provide search and facets for sport, product type, price, size, brand, rating, availability, and functional attributes where catalogued. |
| DEC-FR-03 | Provide product pages with size/variant selection, sport-use guidance, technical attributes, care/safety information, delivery/pickup availability, and return context. |
| DEC-FR-04 | Support customer-selected store context and make in-store collection available only from inventory that is eligible for reservation/collection. |
| DEC-FR-05 | Support store locator, store detail, opening hours, services, and contact information. |
| DEC-FR-06 | Support wish list, cart, checkout, order history, return handling, and customer support. |
| DEC-FR-07 | Support second-life/buy-back/service programmes only with explicit operational eligibility rules and workflow ownership. |

### 10.3 Data entities
`Sport`, `Product`, `SKU`, `TechnicalAttribute`, `Store`, `StoreInventory`, `PickupReservation`, `DeliveryPromise`, `ServiceProgram`, `Order`, `Return`, `Customer`.

### 10.4 Acceptance criteria
- A selected store persists until the customer changes it or consent/storage is cleared.
- Pickup reservation expires according to an explicit policy and releases reserved inventory safely.
- Product safety/care guidance is versioned with product data.

---

## 11. PVR Cinemas — Cinema Discovery and Ticketing

### 11.1 Product objective
Let users choose a city, cinema, movie, date/showtime, seat(s), and optional concessions, then pay and receive a durable booking record.

### 11.2 Functional requirements

| ID | Requirement |
|---|---|
| PVR-FR-01 | Require or infer a city only with user control, then list cinemas, movies, languages/formats, dates, and showtimes available for that context. |
| PVR-FR-02 | Provide movie detail pages with classification/certification data, duration, language, format, showtime availability, and applicable policy information. |
| PVR-FR-03 | Provide an interactive seat map with seat type, price, blocked/reserved/sold states, accessibility seating where applicable, and clear selection feedback. |
| PVR-FR-04 | Create a short-lived seat hold on the server before payment and automatically release it after expiry or failed confirmation. |
| PVR-FR-05 | Support concessions/add-ons only for showtimes and fulfilment modes for which they are operationally available. |
| PVR-FR-06 | Present all fees, taxes, selected seats, add-ons, cancellation constraints, and booking terms before payment confirmation. |
| PVR-FR-07 | Issue a unique booking reference, confirmation notification, booking history entry, and validation artifact appropriate to venue operations. |
| PVR-FR-08 | Support membership/reward benefits only where entitlement verification and booking rules exist. |

### 11.3 Data entities
`City`, `Cinema`, `Auditorium`, `Movie`, `Showtime`, `Seat`, `SeatHold`, `TicketType`, `ConcessionItem`, `Booking`, `PaymentAttempt`, `Membership`, `Entitlement`.

### 11.4 Acceptance criteria
- Two users cannot successfully confirm the same seat for the same showtime.
- Seat holds expire server-side and cannot be extended solely by browser activity.
- Booking confirmation is idempotent across payment-provider retry callbacks.

---

## 12. Swiggy — Location-Based Food Delivery

### 12.1 Product objective
Enable an address-aware journey from restaurant discovery to menu customisation, cart review, payment, order dispatch, and delivery status.

### 12.2 Functional requirements

| ID | Requirement |
|---|---|
| SWI-FR-01 | Collect/resolve a delivery location with explicit consent and provide manual address entry/search as an alternative to device location. |
| SWI-FR-02 | Show only restaurants and delivery/pickup options that are serviceable for the selected address and current operating state. |
| SWI-FR-03 | Provide search, cuisine/category discovery, dietary preference cues where supplied, and filters/sort controls such as delivery time, rating, offer, or dietary category where supported. |
| SWI-FR-04 | Provide restaurant detail and menu views with item price, availability, description, dietary/allergen information supplied by the merchant, customization/modifier groups, and item-level quantity controls. |
| SWI-FR-05 | Validate required modifiers, modifier selection limits, unavailable add-ons, restaurant minimums, packaging/delivery fees, and promotional eligibility on the server. |
| SWI-FR-06 | Support cart, address selection, payment, order confirmation, order status timeline, support escalation, and cancellation/refund policy handling. |
| SWI-FR-07 | Provide delivery tracking only for orders where a tracking integration and customer-consent policy are operational. |
| SWI-FR-08 | Provide restaurant/merchant operations for menu availability, hours, order acceptance, preparation state, and issue management. |
| SWI-FR-09 | Provide delivery-partner operations for task assignment, pickup/drop status, exception handling, and privacy-limited contact workflows. |

### 12.3 Data entities
`Address`, `ServiceabilityZone`, `Restaurant`, `OperatingHours`, `Menu`, `MenuItem`, `ModifierGroup`, `Cart`, `FeeRule`, `Promotion`, `Order`, `PreparationState`, `DeliveryTask`, `TrackingEvent`, `Refund`, `SupportCase`.

### 12.4 Acceptance criteria
- Changing delivery address revalidates the restaurant, menu availability, fees, and delivery promise before checkout.
- A required modifier group blocks checkout until its valid selection is made.
- The status timeline records accepted, preparing, picked-up, delivered, cancelled, and failed/exception states with timestamps.

---

## 13. Cross-Platform Priority Map

### Phase 1 — Commerce foundation
- Account and address model
- Search, category/listing, PDP/service detail
- Inventory/availability and server-authoritative pricing
- Cart/booking context, payment-provider integration, confirmation
- Order/booking record, support entry, accessibility baseline

### Phase 2 — Sector fit
- Fashion: variants, size guide, return workflow, wish list
- Electronics: specifications, comparison, store inventory, installation/service
- Beauty: shade/concern/routine data, moderated reviews
- B2B: suppliers, verification, RFQ, quote versioning
- Cinema: showtime inventory, transactional seat holds
- Food: serviceability, modifier rules, merchant/delivery operations

### Phase 3 — Optimisation after operations are stable
- Personalisation/recommendations with customer controls
- Loyalty, subscription, rewards, exchange/trade-in, buy-back
- Advanced content tooling, experiments, and merchandising automation
- Real-time tracking and predictive delivery/availability estimates

## 14. Explicitly Out of Scope Until Backed by Operations

Do not expose controls for an unimplemented backend process. Examples include:

- Live inventory without a reliable inventory source
- Booking seats without transactional holds
- Delivery promises without serviceability and routing data
- Returns/refunds without policy and operations ownership
- Subscription/recurring charging without explicit customer consent, billing controls, and cancellation flows
- Buyer/seller verification or payment-protection claims without a documented programme
- Camera-based beauty guidance without consent, privacy policy, and manual alternatives

## 15. Traceability

| Reference platform | Primary archetype | Highest-value implementation patterns |
|---|---|---|
| Myntra | Fashion marketplace | Size/variant decision, sale discovery, wish list, returns |
| AJIO | Fashion/lifestyle marketplace | Editorial merchandising, collections, coupon rules |
| Croma | Electronics retailer | Structured specifications, comparison, store/pickup/service |
| Amazon.in | Horizontal marketplace | Product vs seller offer model, delivery promise, buyer account services |
| Flipkart | Horizontal marketplace | Promotion-rich listing, payment eligibility, seller/offer workflows |
| Nykaa | Beauty commerce | Concern/shade/routine guidance, ingredient content, review moderation |
| IndiaMART | B2B marketplace | Supplier profile, RFQ, lead routing, quote versioning |
| Decathlon India | Omnichannel sport | Sport taxonomy, store inventory, pickup reservation |
| PVR Cinemas | Ticketing | City/showtime discovery, seat hold, concessions, booking confirmation |
| Swiggy | Food delivery | Address serviceability, menu modifiers, order/delivery state machine |
