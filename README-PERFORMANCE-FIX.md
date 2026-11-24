
# The Soft Nest Edit v2 — Mobile PageSpeed fix (24 Nov 2026)

**Scope:** A source-specific, reviewable local patch for `https://github.com/angelop-1602/the-soft-nest-edit-v2`. No files were pushed or deployed. This ZIP contains no third-party images.

Based on the mobile screenshot: Performance 66, FCP 3.5 s, LCP 6.4 s, TBT 30 ms, CLS 0, Accessibility 96, Best Practices and SEO 100. A score increase is not guaranteed until retested after deployment.

## What this patch changes

1. Preloads the existing responsive living-room hero image in the document head. The existing image stays `fetchpriority=high` and eager. Aligns the `sizes` breakpoint with the layout's 800px tablet stacking breakpoint to avoid wrong variants.
2. Defers the already-enabled AdSense JavaScript until after `window.load` and browser idle, without changing the publisher ID, the meta verification tag, existing ad slot settings or Auto Ads intent. **Trade-off:** ad rendering may start later. If your site relies on immediate ads, revert this change.
3. Moves the Supabase member/saved-product bundle behind a small, interaction-aware loader, after page load and idle. The saved page and auth callbacks still load it immediately. Early Save / Sign in click is caught and replayed once ready. **Trade-off:** saved counts and signed-in labels can be delayed briefly. Test your account sign-in, cross-tab email callback, saved-product saves, and sign-out before production.
4. Removes initial entrance animations only from the home hero image and first lines of text, so they don't postpone rendering of the LCP candidate. All other existing animations remain intact.
5. Includes an **optional** Pillow-based WebP recompressor for the two existing hero variants, keeping originals when recompression won't save at least 5%. Run separately only after checking visual quality.

No accessibility colors were changed: the screenshot's 96 Accessibility score does not identify the specific failed selector. Expand the Lighthouse contrast audit before applying targeted contrast fixes.

## Installer revision 2

Supports Windows CRLF and Unix LF, preserves existing source line endings, reports the specific missing anchor, and refuses mixed line endings or unexpected source changes. Tested against synthetic anchor fixtures in both formats, including repeated application and refusal on mismatches. Existing fix branches can be reused.

## Windows PowerShell instructions

1. From your local repository:

```powershell
cd C:\Users\apera\Projects\the-soft-nest-edit-v2
git status --short
git switch -c fix/mobile-pagespeed-20261124
Expand-Archive "$env:USERPROFILE\Downloads\softnest-mobile-performance-fix-v2.zip" -DestinationPath . -Force
node .\perf-fix\apply.mjs --check
node .\perf-fix\apply.mjs
npm run validate
git diff --check
git diff
```

If `git status --short` already has unrelated modifications, commit/stash those first. If the branch already exists, use a different branch name. Do **not** merge if the validator fails.

2. Optional: recompress the two existing hero images, *after* the text patch and with visual QA:

```powershell
py -m pip install Pillow
py .\perf-fix\optimize-images.py
npm run validate
```

3. Examine the first screen, sticky navigation, mobile/desktop layout, account login, save/unsave buttons, and Ads behavior locally. Validate:

```powershell
npm run dev
# In a second terminal, or use Chrome DevTools > Lighthouse
```

4. Commit only after review:

```powershell
git add src/layouts/Base.astro src/pages/index.astro src/scripts/activate-members.js src/styles/performance-first-paint.css
# If you accepted the optional recompression:
git add public/assets/editorial/living-room-480.webp public/assets/editorial/living-room-1080.webp
git commit -m "Optimize mobile hero and defer noncritical scripts"
git push -u origin fix/mobile-pagespeed-20261124
```

Then open a pull request in GitHub, review the Cloudflare preview, and deploy/merge only when satisfied. The ZIP's `perf-fix/` directory is an installer aid: it does not need to be committed to the site.

## Retesting and expectations

Re-run PageSpeed Insights mobile in 3–5 separate tests for `/`, at the same target URL and similar conditions, and compare median LCP, FCP, Total Blocking Time and CLS. Lighthouse lab scores vary; target LCP under 2.5 s if realistic, without sacrificing legibility and fidelity. Use the expanded report's LCP breakdown, network dependency tree, image-delivery opportunities and the exact accessibility contrast targets for further improvements.

**Not executed here:** `npm run validate` (source dependencies and repository checkout unavailable in this runtime); live Cloudflare deployment; real PageSpeed re-measurement; authenticating with a real Supabase user; ad monetization verification. The installer was checked against the known source anchors and is designed to refuse unexpected content changes.
