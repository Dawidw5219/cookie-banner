# Cookie Banner 1.2.1 — WP Rocket compatibility

## Reproduction

On https://www.fertilityclinicsabroad.com/, open an isolated browser context with empty storage, 500 ms network latency, 128 KB/s download and 4x CPU throttling. Click Accept All immediately when the banner becomes visible. The production bundle leaves the banner visible and cb_has_consented unset, including after further clicks while scripts are loading.

WP Rocket's RocketLazyLoadScripts 2.0.5 replaces EventTarget.addEventListener and queues click listeners until all delayed scripts finish. This also queues Preact's banner handlers even though the banner script itself is excluded from delay.

## Fix

ConsentButton registers its native click handler in useLayoutEffect with Rocket's isRocket option, bypassing its listener queue. Handled consent clicks stop propagating so Rocket cannot queue and replay the same action. This applies to accept, preferences, reject, save, category toggles and the reopen icon. The document policy-link listener uses the same exemption for registration and cleanup. WordPress marks the configuration and bundle with data-nowprocket.

No global event APIs are modified by the production fix. Consent defaults and the requirement for a user choice remain intact.

## Validation

- 27 Vitest tests pass, including five regression cases for deferred event registration. Four initial regression cases failed before the fix.
- TypeScript, PHP syntax and WordPress locale checks pass.
- Full plugin build produces plugin/builds/cookie-banner-wp-1.2.1.zip.
- On the actual FCA page, replacing only the bundle in an isolated test browser fixes the same slow incognito reproduction. Desktop accept succeeds. Mobile touch accept grants analytics and marketing; reject denies both; selective save grants analytics and denies marketing. Each action closes the banner.

The initial browser substitution was a test, not a production deployment.

## Production installation — 2026-10-22/23

With user authorization, uploaded and replaced the active 1.2.0 plugin with 1.2.1 through WordPress on FCA EN, DE, FR and IT, in that order. Each admin plugin listing confirmed active version 1.2.1. Used the WP Rocket Clear and Preload Cache action on each site.

Fresh isolated production browser contexts (no script substitution) verified first-click/touch accept with 500 ms latency, 128 KB/s download and 4x CPU throttling on all four domains. Consent was stored and the banner stayed hidden after reload on DE, FR and IT. On EN, additional mobile reject and selective-save tests verified denied/denied and granted/denied optional categories respectively, and persistence after reload. EN desktop accept also succeeded under throttling.

The release ZIP has not been published to GitHub; installation used the local build directly.
