# Commerce OS local demo

This prototype demonstrates the customer and merchant workflow in one browser:

1. Open **Store builder**, choose a business name and storefront template, then generate a preview.
2. Open the demo storefront and add items to the bag.
3. Complete the clearly marked demo checkout. It does not collect payment.
4. Open the merchant dashboard to process and fulfil the order.
5. Use Products to add, edit, or remove catalog items and adjust stock.

Run from the repository root with Node.js 20 or newer:

```sh
node apps/marketing/server.mjs
```

Then open `http://127.0.0.1:4173`. To make a static build, run:

```sh
node apps/marketing/build.mjs
```

The demo saves its sample catalog, storefront settings, cart, and orders in the current browser's local storage. It has no real accounts, server database, payment capture, subscription billing, domain provisioning, advertising service, or AI provider integration. Those production services need a backend, database, provider configuration, and security review before the platform can take real business data or payments.
