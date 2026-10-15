import { cp, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = resolve(appDir, 'dist');
const pages = ['index.html', 'templates.html', 'builder.html', 'pricing.html', 'storefront.html', 'catalog.html', 'dashboard.html'];
await mkdir(outputDir, { recursive: true });
for (const page of pages) await cp(resolve(appDir, page), resolve(outputDir, page));
for (const asset of ['styles.css', 'script.js', 'commerce.js']) await cp(resolve(appDir, asset), resolve(outputDir, asset));
process.stdout.write(`Built ${pages.length} pages and 3 assets into apps/marketing/dist\n`);
