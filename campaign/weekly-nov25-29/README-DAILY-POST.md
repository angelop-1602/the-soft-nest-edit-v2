# Weekly batch — November 25–29, 2026 (US Eastern)

**Partial campaign handoff: written content completed, visual production and approvals outstanding.**

15 Journal drafts (14 new + prior bathroom), 11 product records (6 new + 5 prior bathroom), 6 new generic product illustrations (native crops), 6 prior website illustrations and 14 prior social JPEGs. 14 final Journal banners, 56 new Pinterest JPEGs, and 140 new Instagram/Story/Facebook JPEGs are not delivered. The 14 small hero concept thumbnails are private reference previews only, not publishable banners. New social briefs and captions are included for all 14 new articles. No new video rendered. Prior bathroom asset resolution limitations still apply. Do not use the promotional mockup as actual campaign media.

## Install

Download ZIP, stop dev server, run in PowerShell (no manual unzip):

```powershell
cd C:\Users\apera\Projects\the-soft-nest-edit-v2; $p = Join-Path $env:TEMP ('softnest-weekly-' + [guid]::NewGuid()); Expand-Archive -LiteralPath "$env:USERPROFILE\Downloads\softnest-weekly-nov25-29-2026.zip" -DestinationPath $p; node "$p\apply.mjs" (Get-Location).Path --apply; if ($LASTEXITCODE -eq 0) { npm run validate; if ($LASTEXITCODE -eq 0) { node scripts/audit-content.mjs } }
```

The installer checks for the expected CMS-only scheduler, skips identical files, refuses differing existing files (including locally edited bathroom content), except for the original bathroom article with a matching original file hash. For that one file it updates the planned date, backs up the previous version, and preserves its body. No changes to existing published catalog records. It copies reports to `campaign/weekly-nov25-29/`. This does not schedule live publishing, commit or push. Existing differing content will require reconciliation. If the earlier bathroom folder already exists with differing campaign notes, conflicts are reported before any writes.

## Schedule and release

`weekly-calendar.csv` lists all approved dates and slots, stored as quoted UTC timestamps and converted from America/New_York. Wednesday uses 11 AM/2 PM/6 PM, Thursday–Sunday 9 AM/1 PM/5 PM. Dates are preserved, not automatically moved. If a slot passes before approval, the enabled scheduler can activate overdue eligible entries on its next run; no exact-time promise. Social dates are conditional on live verification.

All new articles and product records remain `published: false`, `publication_approved: false`, and `image_rights_confirmed: false`. Six new links have `link_verified: true` based on the user's confirmation. The five prior bathroom link flags remain false. Product status remains draft pending review of imagery and editorial details; no final release authorization or rights verification is invented. Do not set a future article to published manually. Once the actual images/variants and rights are reviewed, set approved flags on article and products, enable `auto_release_related_products: true` for articles, keep `published: false` until the scheduler activates them. Products without independent dates inherit the first eligible linked Journal's time, provided all release gates pass. Check actual local flags of reused products (notably the OIAHOMY basket); some may still be blocked. The source repository is public; draft files are not confidential if pushed there.

## Missing and review tasks

- Generate final original 16:9 hero illustrations for the 14 new guides, export to `public/uploads`, populate `image` and `image_alt` on those articles; the scheduler requires a valid local approved image. The mockup photo tiles are too small to use as final website images.
- Generate four distinct 2:3 Pinterest JPEGs per new guide (56 outstanding) and finish the 14 sets of 6 carousel, 3 Story and 1 Facebook stills (140 outstanding). Alt text is pending actual images. Existing bathroom stills are included unchanged. Keep social files outside `public`.
- Review the generic product illustrations for accuracy, especially the hook counts, holder shape and IRIS variant; use generic styling labels and verify exact product variants/rights before approving. Do not claim personal tests. Review earlier bathroom links, visuals and rights.
- Verify link dependencies and live routes, run local full Astro validation and audit; production scheduler settings not verified. Review actual source evidence before publishing. No private analytics available. See research notes and validation report.

**Validation:** 239 structural checks passed. No full local Astro build or deployment run. No social post, merge or schedule activation performed.
