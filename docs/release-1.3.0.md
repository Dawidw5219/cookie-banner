# 1.3.0

Per-service consent and default-deny third-party network CSP are now available in
the npm package and WordPress plugin. Optional content uses placeholders before
consent and loads after the visitor grants the corresponding service.

## Upgrade behavior

WordPress enables strict network CSP by default. Consent changes reload the page.
Consent-dependent HTML bypasses shared page caches; JS/CSS optimization and asset
caching remain available. Purge and bypass any additional CDN/reverse-proxy HTML
cache before serving an upgraded site. Register necessary external sources with
`cookie4_csp_essential` and custom service rules with `cookie4_csp_services`.

For npm/Next.js, use the new `cookie-banner/native` API, apply
`consentCspHeaders` to server HTML responses and set `strictCsp: true` on the client.
This requires dynamic HTML and coordinated CDN caching; a client bundle alone
cannot install an HTTP CSP header.

## Verification

45 unit tests, TypeScript checks for both packages, PHP syntax and HTML-rewrite
checks, npm build/browser tests, twelve Elementor optimizer configurations,
server cache miss/hit control probes and consent cache isolation passed.
Real YouTube playback was verified after consent with both WP Rocket and LiteSpeed.

WP Rocket tests used the official GPL source with a locally modified license gate;
cloud services and an untouched licensed distribution were not tested. Testing was
local, including an actual OpenLiteSpeed server, not a production-domain audit.
See docs/research/strict-csp-verification.md for evidence and limitations.
