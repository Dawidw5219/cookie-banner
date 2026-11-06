# 1.4.0

## WordPress administrator workspace

- Shared cookie icon replaces the warning symbol. Third-party plugin notices are filtered only on the Cookie Banner screen; WordPress core notices and our own updater messages remain available.

- Overview dashboard and setup checklist based on saved configuration and existing scanner data.
- Separate sections for appearance, services, cookies/scanning, WordPress integration and diagnostics.
- Custom integration editor: name, purpose, stable ID, HTTPS URL prefixes and privacy URL. The scanner, blocker, consent UI and CSP reuse the same definitions.
- Atomic validation and service-definition history prevent old consent from authorizing a different integration, including after removal/recreation.
- Frontend CSP/cache/DNS-prefetch header checks, detected cache/consent plugins, manual cache refresh and native Site Health integration.
- Supported page caches refresh automatically after settings/service changes.
- Sandboxed live preview cannot access actual consent storage, uses local assets and the WordPress admin URL, including subdirectory installations.
- Drafts survive section changes; edits made during a save remain marked as unsaved. Forms and preview adapt to mobile screens.
- Remove the legacy Tailwind CDN loader and obsolete pre-consent/auto-accept administrator switches whose runtime behavior was already disabled.

## Validation and scope

45 unit tests, root/plugin TypeScript checks and production build passed. The local
WordPress fixture passed 16 backend assertions and 10 administrator/browser scenarios,
including anonymous API rejection, preview isolation, shared service registry,
consent-gated loading, purpose-change protection, draft/save races, actual response
headers and mobile layout. Existing frontend consent/guard and HTTP-CSP browser
checks also passed. These checks do not constitute a production-domain audit.

Public source references for six plugins and the design comparison are documented
in docs/research/wordpress-product-comparison.md. Downloaded reference code remains
outside the shipped plugin and Git history.

This release publishes the WordPress ZIP. The npm source version on main is also
prepared as 1.4.0; npm registry publication is handled separately by Dawid.

Additional validation confirms cookie branding, third-party notice isolation on
our settings screen, retained own updater notices and unchanged notices elsewhere.

[Administrator screenshots](https://github.com/Dawidw5219/cookie-banner/tree/v1.4.0/docs/screenshots/admin)
