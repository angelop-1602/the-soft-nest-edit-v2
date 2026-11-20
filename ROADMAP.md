# V2 launch scope and later additions

## Completed in this source package (subject to `npm install`, Astro build, and browser acceptance testing)

- Public editorial site and product discovery experience.
- Search and category filtering of approved products; saved finds in browser storage.
- Product detail pages with original observations, caveats, and affiliate link disclosures.
- Blog article collections, Pinterest sharing, related affiliate products.
- SEO page metadata, canonical URLs, XML sitemap, RSS, robots, 404 and basic redirects.
- Pages CMS editorial workflow with fail-closed publishing safeguards.
- Local importer from the v1 repository, product approval guard tests, CI validation.

## Human/editor approvals required before production

- Supply and verify Amazon Associates Special Links.
- Check original claims, media permissions, and on-site disclosure placement.
- Review the archived v1 indexed URLs, create relevant redirects for actual content matches.
- Test on staging, including mobile interactions, site security, and the production Cloudflare route.
- Enter a public contact method, verify privacy disclosures, and register the site with Amazon as applicable.

## Optional enhancements only after traffic validates demand

- A privacy-reviewed affiliate-click analytics pipeline with server-side reporting; Amazon remains the authoritative source for conversion commissions.
- Curated buyer checklists and product comparison filters based on verified editorial fields.
- A moderated reader comment system with spam controls, Cloudflare Turnstile, content moderation, and an administrative review interface.
- Original editorial scores with a published scoring methodology; never represent them as Amazon customer ratings.
- Pinterest creative generation workflow, content planning board, and keyword research queue.
- Shopify checkout and fulfillment only in a **separate project** after the affiliate business justifies the costs.

**Important:** The v2 website is intentionally not a dropshipping store. "Complete" means the core Amazon affiliate publishing and browsing workflow, not an unneeded checkout, supplier sync, or customer account system.
