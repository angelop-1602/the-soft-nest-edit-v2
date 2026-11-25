# The Soft Nest Edit — Mobile navigation patch

Designed for the existing Astro site after the mobile performance installer. Extract at the repository root. Run `node .\mobile-nav-fix\apply.mjs --check`, then `node .\mobile-nav-fix\apply.mjs`, `npm run validate`, and `git diff --check`.

Changes: Base.astro adds a native dialog and replaces only the old menu controller; two new source files provide styles and the controller. The performance loader, hero preload, AdSense, desktop header, affiliate content and member scripts are not modified. At widths up to 800px the existing nav is moved into the drawer while open and returned afterward. The menu is usable without JS through the existing expanded navigation fallback (subject to existing styles). Native modal provides focus containment and background inertness; Escape, close, backdrop and navigation dismiss it. Opening animation honors reduced motion; closing is immediate to avoid interfering with account-dialog handoff. Existing link labels and saved count are retained.

Installer handles LF, CRLF and mixed line endings (mixed edited file is normalized to LF). It checks all anchors and new-file collisions before writing. Re-running is safe. If an anchor fails, send the relevant local Base.astro section; don't force replacement. The ZIP is a local installer, not a GitHub commit.

Tests run: Node syntax checks, installer fixture checks for LF/CRLF/mixed endings, non-writing preflight and repeat installation; Chromium fixture tests for opening, focus return, Escape, backdrop, account-dialog handoff and resizing to desktop. Full Astro build and real Supabase sign-in remain untested here.

Manual checks: open at 390px, check scroll lock and keyboard focus, close via X/Escape/backdrop, navigate Shop/Journal/Saved, check account sign-in when configured, check count and mobile header, rotate to desktop and confirm menu remains intact. Repeat with reduced motion. Run PageSpeed on deployed preview after your approval. No new dependency.

To commit after review: `git add src/layouts/Base.astro src/scripts/mobile-navigation.js src/styles/mobile-navigation.css`; `git commit -m "Add accessible mobile navigation drawer"`. Do not stage installer files unless wanted. No deploy performed.
