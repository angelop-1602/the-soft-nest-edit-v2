# The Soft Nest Edit v2 — Shop by Room + Product Type upgrade

This **file overlay** implements the new room-first shopping categories. It is **not** a whole replacement project. It does **not** include or overwrite any `src/content/products/*.md` or Journal articles, Amazon tracking links, `public/uploads`, Cloudflare headers, or environment configuration.

## What changes

- Main Shop and homepage: **Shop by Room** (Living Room, Bedroom, Kitchen & Dining, Bathroom, Home Office, Entryway & Hallway, Outdoor & Balcony).
- On each room page, **product-type** filters display only types that have approved, published products. Examples: Pillows & Cushions, Vases, Decor Accents, Lighting, Throws & Blankets, Storage & Organization, and more.
- Shop's all-products section supports search + room + product-type filters.
- Pages CMS product editor: `rooms` (optional multiselect, up to 3) + `product_type` (optional single choice).
- A product can appear in multiple rooms, while keeping only **one** product detail URL and approved Amazon Special Link.
- Existing `Living Room` / `Bedroom` products continue to appear in the corresponding rooms without editing them. Older `Small Spaces`, `Home Organization`, and `Lifestyle` product records remain in All products until manually assigned a room. Other editorial categories and article routes are preserved.
- New room pages without verified products are `noindex`; room URLs enter `sitemap.xml` only after approved products exist. Previous `/shop/category/...` pages remain accessible but are `noindex` to avoid duplicate collection indexing.

## Install via PowerShell (recommended)

1. Save or commit any local changes **before** installing. Open your project directory:

```powershell
cd C:\Users\apera\Projects\the-soft-nest-edit-v2
git status
```

2. Once the working tree is clean, update your local copy:

```powershell
git pull --ff-only origin main
```

3. Extract **the-soft-nest-edit-shop-by-room-update.zip** directly into this project, preserving paths (this deliberately replaces the listed source files):

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\the-soft-nest-edit-shop-by-room-update.zip" -DestinationPath . -Force
```

4. Validate and check the product approval audit. **Do not deploy if any validation fails**:

```powershell
npm run validate
node scripts/audit-content.mjs
```

5. Commit and deploy:

```powershell
git add INSTALL-SHOP-BY-ROOM.md .pages.yml src/content.config.ts src/components/ProductCard.astro src/data/rooms.ts src/data/product-types.ts src/lib/shop-taxonomy.ts src/pages/index.astro src/pages/shop src/pages/sitemap.xml.ts src/layouts/Base.astro src/styles/global.css
git commit -m "feat: organize shop by room and product type"
git push origin main
npx wrangler deploy
```

If your GitHub push already triggers a verified Cloudflare deploy, you needn't run `npx wrangler deploy` again.

## Check after deployment

- `https://thesoftnestedit.online/shop/`: seven room cards and a room/type filter for approved products.
- `https://thesoftnestedit.online/shop/room/living-room/`: existing verified Living Room products (including the Bedsure blanket, if still approved) automatically appear. Category chips appear after you assign `product_type`.
- `https://thesoftnestedit.online/shop/room/bedroom/`: the Bedroom collection.
- `https://thesoftnestedit.online/shop/<product-slug>/`: product pages should still work and retain their affiliate buttons.
- `https://thesoftnestedit.online/sitemap.xml`: only room pages with live approved products are listed.

## Set the new fields in Pages CMS

Open **Amazon affiliate products** and select a product.

- **Rooms**: select one to three suitable rooms, e.g., `Living Room` and `Bedroom` for a genuinely versatile throw.
- **Product type**: select one specific type, e.g., `Throws & Blankets`, `Pillows & Cushions`, or `Vases`.
- **Legacy editorial collection**: keep the existing value if present. This is for compatibility with old records and links, not the primary Shop navigation.

Example of the two new YAML frontmatter fields:

```yaml
rooms:
  - Living Room
  - Bedroom
product_type: Throws & Blankets
```

For a vase:

```yaml
rooms:
  - Living Room
  - Entryway & Hallway
product_type: Vases
```

**Important:** These fields do *not* bypass the existing product safety checks. Products must still have `status: approved`, `published: true`, and a personally verified Amazon Special Link. Uploaded product photos must have confirmed usage rights.

## Testing status

The source overlay's YAML syntax, room/type consistency, TypeScript taxonomy utilities, and the existing nine affiliate rule tests were checked in the packaging environment. **Astro's full `npm run validate` was not run here** because project npm dependencies are not installed in this environment; use your local Windows installation to validate before deploying.

## Notes

- The included files are based on the GitHub v2 structure inspected on November 21, 2026. If you've installed the earlier category-upgrade ZIP, this upgrade supersedes those category/filter files.
- This package does **not** modify your actual product Markdown files. Content edited in Pages CMS and your Amazon links remain in place.
- If a room is empty, its page explains that it's being curated, and the route is not submitted in the sitemap; you don't need to create placeholder products to populate it.
