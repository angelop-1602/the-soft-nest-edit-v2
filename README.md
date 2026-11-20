# The Soft Nest Edit — v2 (Amazon affiliate-first)

A fresh, standalone **Astro 6 static website** for the Amazon affiliate phase of The Soft Nest Edit. It does **not** need Shopify, an order database, an Amazon API key, or a payment backend.

The ZIP is source code. It has not been deployed to the live domain, and it is not a replacement for the original repository until you complete the migration checks below.

## What works

- Responsive homepage, persistent header, mobile navigation, editorial category showcases, and reduced-motion support.
- Shop with typed product collections, search and room filters, original notes, and individual product detail pages.
- **Fail-closed affiliate publishing:** products are displayed only when `status: approved`, `published: true`, `link_verified: true`, and `affiliate_url` has an allowed format. If an image exists, its usage rights must also be confirmed.
- Two supported link formats: direct `https://www.amazon.com/dp/ASIN?tag=...` / `/gp/product/ASIN?tag=...`, or a manually verified `https://amzn.to/SHORTCODE` SiteStripe link. URL structure validation does not prove that a link truly tracks your account: you must confirm it yourself.
- Direct Amazon affiliate links with `rel="sponsored nofollow noopener noreferrer"` and visible required Amazon Associate disclosure.
- Client-side saved products stored locally in the visitor's browser. No accounts or tracking cookies are created for this feature.
- Articles, related affiliate products, Pinterest sharing, SEO titles, canonicals, Open Graph, BlogPosting markup, sitemap, RSS, robots, redirect rules, and error page.
- GitHub-based Pages CMS editing of blog posts, products, and site settings. Admin authentication happens through GitHub / Pages CMS, not through a password form stored on the website.
- Product-policy unit tests, content audit, post-build smoke check, GitHub Actions checks.
- An importer for the legacy Jinja2 project that preserves published article URLs and brings product records across as **unapproved drafts**. Legacy product images are not copied because they require rights verification.

## Not part of this affiliate-first phase

- Customer carts, checkout, inventory, PayPal, CJ API, supplier sync, Shopify, orders, returns, shipping, or product payments.
- Public user comments or Amazon-style customer star ratings. These require a moderation/abuse-prevention system and verified sourcing. No fake ratings are produced.
- Guaranteed conversion attribution: Amazon Associates reports are the source of truth for completed affiliate orders/commissions. The site can emit optional client-side `affiliate_click` events to an existing GA4 `gtag`, but does not upload visitor clicks or imply they are sales. Cloudflare Web Analytics may be enabled for website traffic by putting its public token in site settings, after updating the privacy policy.
- Automatic Amazon prices, stock, API-sourced product photos, or review scores. These require additional Amazon program authorization and correct implementation.

## Requirements

- Node.js 22.12+ and npm.
- An existing Amazon.com Associates account, with approved Special Links made using your Associates account.
- GitHub and a free Cloudflare account. For easy content management, Pages CMS (GitHub-based).

## Start locally (PowerShell)

```powershell
Expand-Archive -Path "$env:USERPROFILE\Downloads\the-soft-nest-edit-v2.zip" -DestinationPath "$env:USERPROFILE\Projects"
cd "$env:USERPROFILE\Projects\the-soft-nest-edit-v2"
npm install
npm run test
npm run dev
```

Open the local URL printed by Astro (normally `http://localhost:4321`).

Run a production-style static build:

```powershell
npm run check
node scripts/audit-content.mjs
npm run build
npm run preview
```

**Do not publish the sample product.** It is a draft by design. The site will show an attractive empty state until you've approved a real product.

## Import your old website content safely

Keep the old directory separate and checked into Git. In the v2 directory, run:

```powershell
npm run import:v1 -- "C:\Users\YOUR_USER\Projects\the-soft-nest-edit"
node scripts/audit-content.mjs
npm run build
```

This reads `content/posts/*.md` and `content/products/*.md` from v1. It rewrites the v2 Markdown records, preserving article slugs, dates, and published flags; the product records are **always drafts**, even if the old site said they were published. It does not change your v1 folder.

**Back up or commit your new v2 files before running the import**: records with matching slugs are overwritten in v2. Review legacy posts for factual accuracy and image permissions. Only locally referenced article images are copied. Product images are NOT copied automatically; re-upload properly licensed images through Pages CMS after confirming your rights.

The old 24-category shop links cannot all become accurate one-to-one affiliate pages. The v2 `_redirects` file includes a few examples, but **audit actual indexed pages and backlinks** before switching the live domain. Configure suitable 301 mappings for real replacement content, and let pages without an honest replacement return 404/410 rather than broadly redirecting them to an unrelated page.

## Publish the first Amazon product

1. Open `.pages.yml` via Pages CMS in the new GitHub repository, or edit `src/content/products/*.md` directly.
2. Add the genuine product name, category, and **original** summary. Include the best use case, practical caveats and highlights. Don't claim firsthand testing unless it happened.
3. Create the Amazon.com Special Link using your Associates account and insert it as `affiliate_url` (a tagged Amazon.com product URL or SiteStripe `amzn.to` URL).
4. Open the destination and check that it is the exact product you intend, and verify tracking using your account and Amazon's instructions. Only then set `link_verified: true`.
5. Only include a product image if you own it or have permission to display it. Upload it to `public/uploads/`, set `image: /uploads/name.png`, supply meaningful image alt text, then set `image_rights_confirmed: true`. An empty image is fine; the site displays a decorative placeholder instead.
6. When the editorial review is complete, choose `status: approved` and `published: true`. Check for any misleading claims, wrong dimensions, disallowed pricing, or broken links.
7. Run `node scripts/audit-content.mjs` and `npm run build`, then check the product page. Drafts, rejected or unverified links are suppressed automatically.
8. To unpublish, set `status: hidden` or `published: false` and redeploy.

## Product record example

```yaml
---
title: Textured Ceramic Vase
category: Living Room
summary: A neutral accent piece for a shelf or entry table. Compare the dimensions before buying.
retailer: Amazon US
status: draft
published: false
affiliate_url: ''
link_verified: false
image: ''
image_alt: ''
image_rights_confirmed: false
best_for: Shelves and console tables
considerations: Check height, opening width, and whether the vase is watertight.
highlights:
  - Versatile neutral color
featured: false
---
Original editorial research notes go here.
```

## Pages CMS

1. Create a **new** GitHub repo, for example `the-soft-nest-edit-v2`, and push this source (not the `dist/` folder).
2. Visit [Pages CMS](https://app.pagescms.org/) and authorize that new repository using the GitHub app.
3. The repository's `.pages.yml` defines Journal, Affiliate Products, and Website Settings. Product status/verification gates remain enforced by the build even if an editor accidentally checks Publish.
4. `https://thesoftnestedit.online/admin/` is only a shortcut to Pages CMS. It is not an admin login; do not put API keys in content files.

## Deploy to Cloudflare Workers (staging)

Astro is **static** in this version. The Cloudflare adapter is intentionally unnecessary. Cloudflare's Workers static assets serve the built `dist/` output. No databases, custom Worker API, or cron jobs are needed.

```powershell
npm run build
npx wrangler login
npx wrangler deploy
```

Cloudflare will provide a temporary `workers.dev` address. Prefer a staging subdomain or workers.dev for acceptance testing. **Do not connect the live `thesoftnestedit.online` custom domain yet.** Set a staging-only `noindex` policy at the hosting layer if the preview is public; do not allow a duplicate content site to be indexed. The site config currently has the production canonical URL intentionally so you're testing the final URL plan, not indexing a duplicate host.

For an automated CI deployment, connect the *new* GitHub repository through Workers Builds and configure build command `npm run build` and deploy command `npx wrangler deploy`. The included GitHub Actions workflow tests PRs, but it does **not** deploy automatically or contain deployment credentials.

## Before connecting the live domain

- [ ] Verify every existing indexed article slug and important content section survived the import.
- [ ] Run `npm run test`, `npm run check`, `node scripts/audit-content.mjs`, and `npm run build` successfully on your machine.
- [ ] Test mobile navigation, Shop search/filter, Save/Remove, external links, journal links, product page, Pinterest sharing, 404, RSS, robots and sitemap.
- [ ] Verify the Amazon Associates website URL registration, your exact Special Links, and prominent Associate disclosures.
- [ ] Confirm all images are licensed, all statements are accurate, and all examples/drafts are not published.
- [ ] Resolve live-domain routing / Cloudflare Worker DNS and custom domain ownership, test on staging first.
- [ ] Preserve redirects only where content has a relevant replacement; audit indexing and update Search Console sitemap after cutover.
- [ ] Customize contact email and privacy policy. If you enable analytics, adjust privacy disclosures.
- [ ] Keep a deployment rollback path to the old site. Do not delete the old repository or D1 data.

## Cost and later expansion

This architecture is optimized for low ongoing cost. It can serve an affiliate publication and curated catalog for a long time. When revenue justifies commerce, add Shopify as a **separate** ordering/fulfillment project rather than reactivating the old CJ/PayPal sandbox code in production.

## Current validation caveat

This project was authored with official Astro 6, Pages CMS, Cloudflare and Amazon documentation as of November 20, 2026. The generation environment did not have access to the npm registry, so `npm install`, Astro compilation and browser-based tests **could not be executed here**. The included plain Node policy tests are executable without dependencies and were run locally. Run the full validation commands on your machine before deployment.
