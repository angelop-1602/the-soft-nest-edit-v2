# The Soft Nest Edit — First Journal Story Package

**Article:** 6 Thoughtful Details That Make a Living Room Feel Cozy and Beautiful  
**Page when published:** `/journal/6-thoughtful-details-for-a-cozy-living-room/`  
**Status:** `published: false` (draft; intentionally not public)

This package includes **one Markdown Journal story** and **seven optimized WebP images** (one hero and six product-focused illustrations). It is prepared for the Astro v2 content schema and the six product drafts previously delivered. It does not modify or remove existing posts, products, site code, or settings.

## Before installation

Install the earlier **`softnest-living-room-six-product-drafts.zip`** package first if you haven't done so. Those six exact Markdown filenames are referenced by this story. Save/commit your local changes before extracting either ZIP.

## Install on Windows (PowerShell)

```powershell
cd C:\Users\ADMIN\Projects\the-soft-nest-edit-v2
Get-Location
git status
Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\softnest-first-journal-article.zip" -DestinationPath . -Force
npm run validate
node scripts/audit-content.mjs
```

**To preview the unpublished post in Astro:** open `src/content/posts/6-thoughtful-details-for-a-cozy-living-room.md`, temporarily change `published: false` to `published: true` **locally only**, run `npm run dev`, and open `http://localhost:4321/journal/6-thoughtful-details-for-a-cozy-living-room/`. Restore `published: false` before committing if the six product pages remain drafts. While product pages are unpublished, their internal URLs will lead to 404; the draft therefore must not go live yet.

## Publish checklist

1. Independently confirm that each product link resolves to the correct Amazon variant and that Associates attribution works; opening a URL alone is not proof.
2. Confirm rights and permitted use of the AI-generated editorial images in connection with the original product photo references. **These images are styling illustrations, not guaranteed product-identical photos.** Do not imply hands-on testing.
3. For each product, update only after independently checking: `status: approved`, `published: true`, `link_verified: true`, `image_rights_confirmed: true`. The last two are human attestations; do not set them blindly.
4. Build and deploy products first. Confirm that all six `/shop/<slug>/` URLs work.
5. Finally, set `published: true` on the Journal article, validate, build and deploy.
6. Verify hero image, six inline images, all links, related product cards, affiliate disclosure and mobile presentation.

**Safety:** The ZIP includes the same six optimized product images as the earlier product drafts, plus the separate hero. Extracting it over the product draft package only replaces these images with identical files. No affiliate tracking URLs are in this article Markdown; the Shop product entries retain those URLs.

## Files included

- `src/content/posts/6-thoughtful-details-for-a-cozy-living-room.md`
- `public/uploads/living-room-six-thoughtful-details-hero.webp`
- six `public/uploads/living-room-*.webp` images matching product drafts
