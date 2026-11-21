# The Soft Nest Edit — First Living Room Collection (DRAFTS)

This package was made for the current Astro v2 content schema. It adds **six new unpublished product drafts** and their optimized AI-generated **illustrative** lifestyle images. It does **not** delete old content or touch site code.

## Install (Windows PowerShell)

1. Make sure you are in the project and save/commit any local changes:

```powershell
cd C:\Users\ADMIN\Projects\the-soft-nest-edit-v2
git status
```

2. Extract the ZIP *into the project root* (file paths start with `src/` and `public/`):

```powershell
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\softnest-living-room-six-product-drafts.zip" -DestinationPath . -Force
```

3. Validate:

```powershell
npm run validate
node scripts/audit-content.mjs
```

4. Open Pages CMS or the Markdown files to review the details. All product entries intentionally have:

- `status: draft`
- `published: false`
- `link_verified: false`
- `image_rights_confirmed: false`

**They will not appear publicly.** Do not simply toggle all four fields without checking each listing.

## Affiliate links

All six links are `amazon.com/dp/<ASIN>` links with the `thesoftnested-20` tag supplied by the user. They retain SiteStripe `linkCode=ll2` and the supplied `linkId` for each item. The irrelevant long Amazon search-history parameters were removed. Before publishing, test that every link lands on the **correct variant** and shows attribution in your Amazon Associates account. A link's structure and opening successfully do not independently prove attribution.

## Lifestyle image accuracy

These are **AI-generated styling illustrations** based on the six product-reference photos supplied in the conversation, **not manufacturer product photographs**. Images can differ in texture, included accessories, form, dimensions, or product configuration. Editorial captions/considerations identify them as illustrations. Inspect image likeness and ensure you have the rights to publish material based on the reference photographs and that your use complies with Amazon's image/content terms. Only mark `image_rights_confirmed: true` once you have established the required rights. Consider replacing each with properly licensed exact-product photography when feasible.

## Content safeguards

The copy intentionally does not invent hands-on testing, star ratings, prices, coupons, or reviews. Product details and variants must still be checked against the listing. The article is **not included yet**; this is only the first step: six product entries. Save the generated hero image separately for the future Journal article. If old products remain, they will remain untouched.

## Products

| Draft filename | Product type | ASIN |
|---|---|---|
| `miulee-cream-slubby-pillow-covers.md` | Pillows & Cushions | `B0GSZ1M2B8` |
| `lvases-snuggle-ceramic-vase-set.md` | Vases | `B0C7WFZZ7D` |
| `yarra-decor-touch-control-lamp.md` | Lighting | `B087CDBKCH` |
| `hanobe-round-wood-tray.md` | Decor Accents | `B09LQB2PR2` |
| `warmplants-artificial-olive-tree-4ft.md` | Plants & Planters | `B0C2N583VF` |
| `soalmost-beige-vintage-rug-9x12.md` | Rugs & Mats | `B0D7HPZD9C` |

## Next

Once you review the titles, variants, and AI image illustrations, approve and publish only the products you are comfortable using. We can then write the first Journal article, include multiple editorial images, and link to these exact `/shop/<slug>/` pages. The page slugs come from the Markdown filenames.
