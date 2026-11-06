# WordPress product reference review — 2026-11-06

Six complete public source packages were downloaded from the official WordPress
plugin API/download service, extracted locally and inspected without activating
foreign plugins. The reusable source trees are kept in ignored `reference-plugins/`
(about 63 MB). `scripts/fetch-cookie-references.py` downloads them again when needed;
`plugin-reference-manifest.json` records versions, public URLs, archive SHA-256,
local relative paths and the license declared in each readme.

This extends the earlier 17-plugin blocking audit (`wordpress-blockers.md`) to
administrator workflows. Public PHP/JS code was inspected; SaaS backends and
private PRO packages are not represented as having been reviewed. The plugin
licenses are recorded individually (GPL variants and MIT), rather than assumed
from the WordPress platform. Reference code is not bundled with our distribution.

## Concrete source evidence and resulting decisions

| Reference | Inspected code | Useful pattern | Applied to our plugin |
| --- | --- | --- | --- |
| Complianz 7.5.7 | `settings/config/fields/wizard/{general,documents,services,purposes,finish}.php`, `onboarding/class-onboarding.php` | Separate setup decisions and document/service configuration | Overview with saved-state setup checklist, distinct banner/service/scanner sections |
| Real Cookie Banner 5.4.0 | `inc/view/Checklist.php`, `inc/view/checklist/AddBlocker.php`, `inc/settings/Blocker.php`, `inc/rest/Consent.php` | Named, linked setup tasks; service and content-blocker modeling; explicit administrator/public API boundaries | Custom integration editor that feeds our existing scanner/blocker/CSP registry; administrator-only REST routes; changing integration meaning requires fresh consent |
| CookieYes 3.5.8 | `lite/admin/modules/dashboard/api/class-api.php`, `lite/admin/modules/cache/services/class-{wp-rocket,litespeed-cache,services}.php` | Dashboard summaries and cache-specific adapters | Summary from the existing scanner, cache refresh after service/settings saves, manual refresh action using existing adapters |
| Cookie Notice 3.1.18 | `includes/dashboard.php` (`site_status_tests`, `debug_information`) | Expose useful diagnostics through native WordPress Site Health | Local configuration check plus support information; no legal-compliance score or raw visitor records |
| Cookiebot 4.7.5 | `src/view/admin/common/dashboard-page.php`, `src/settings/templates/Main_Tabs.php` | Distinct management sections and explicit scan/configuration status | Responsive navigation, persistent drafts across sections, a frontend header check with a clear scope |
| iubenda 3.13.7 | `includes/services/class-iubenda-plugin-setting-service.php`, `assets/js/radar_dashboard_widget.js` | Keep product settings and dashboard summaries separate | Services, appearance, discovery and diagnostics are separate administrator workflows |

These are independently written changes on top of our existing components and
REST patterns. No competitor JS bundle, brand assets, SaaS tracking or upsell flow
was copied into the plugin.

## Implemented scope

- A practical WordPress dashboard and navigation instead of one long settings page.
- Setup tasks derived from saved settings and the same cookie/trackers endpoints
  already used by the scanner; no second scanner database or fabricated scan status.
- One service editor: stable ID, display name, purpose, HTTPS URL prefixes and
  optional provider privacy URL. Atomic validation rejects malformed input, built-in
  ID collisions and destination injection. Changes require a new ID; hashed ID
  history prevents deleting/recreating a service from reusing old consent for a
  different purpose. The site receives those same definitions through build_config.
- Frontend header inspection performed as a same-origin HTML fetch (no script
  execution), showing actual CSP/no-store/DNS-prefetch headers for the current
  administrator session. It is not advertised as an anonymous full-site leak scan.
- Detected cache adapters, theme/runtime information, active audit state and known
  competing CMP plugins. Supported caches refresh when settings/services change.
- WordPress Site Health and its support-information section expose configuration
  prerequisites without calling them proof of compliance.
- Responsive settings/preview arrangement, form drafts retained while navigating,
  unsaved banner-setting warning on exit, meaningful API load/save errors.
- Removed two obsolete administrator switches whose pre-consent/auto-accept behavior
  had already been disabled in the runtime. Existing stored values are preserved.

## Deliberately outside this change

No SaaS accounts were connected, no premium edition was represented as reviewed,
and no consent-log collection or legal-document generation was added. Those are
separate product/data-retention decisions; this implementation improves the local
WordPress integration and its administration. Publishing a new version is a
separate release step.

## Verification

`test-wordpress-admin.mjs` exercises the real local WordPress installation using an
expiring local test-admin session supplied outside the repository: anonymous API
rejection, actual UI service creation, draft preservation, frontend consent gating,
atomic validation, retired-ID protection, real header diagnostics and mobile shell.
The previous frontend consent tests and compiler/build checks are run separately.

Additional review fixes: the legacy scanner admin loader no longer requests the
Tailwind CDN; existing bundled styles are reused. The banner preview is now a
script-only sandbox with verified postMessage source/origin and cannot access
real consent storage. Its server-provided admin URL supports WordPress installed
in a subdirectory. A save racing with further edits keeps those edits marked dirty.

Final validation: 45 existing unit tests, both TypeScript checks and production
build; 16 backend assertions covering service validation/shared registry/CSP and
Site Health; 10 real WordPress admin/browser scenarios in wordpress-admin-results.json;
existing browser consent/guard regressions and native HTTP-CSP test. The visible
sandboxed preview was also checked with inaccessible origin storage. The URL
validation mutation was rejected by the backend test and reverted before build.
No production-domain or competitor-service account was changed. Publication
details are recorded in docs/release-1.4.0.md.

Release polish: the admin header shares a cookie silhouette with the banner
control. Third-party callbacks on standard WordPress notice hooks are filtered
only on the Cookie Banner settings screen; core and plugin-owned callbacks remain.
The live fixture confirms foreign notices are absent on our screen, present on
Plugins, and our updater warning remains visible. See
`wordpress-admin-notices-results.json` for those four assertions.
