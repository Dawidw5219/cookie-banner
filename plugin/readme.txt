=== Cookie Banner App4You ===
Contributors: app4you
Tags: cookie, gdpr, consent, google tag manager, consent mode
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.0
Stable tag: 3.0.0
License: GPL-2.0-or-later

Lightweight GDPR cookie consent banner with Google Consent Mode v2 support.

== Description ==

A self-hosted cookie consent banner that integrates with Google Tag Manager
and supports Google Consent Mode v2.

Features:

* Google Consent Mode v2 (analytics_storage, ad_storage, ad_user_data, ad_personalization)
* Optional GTM container loading
* Customizable colors (primary, background, text)
* Privacy policy URL integration
* Multi-language support (English, Polish, French, German, Spanish, Italian, Dutch, Danish, Norwegian, Swedish)
* Fullscreen overlay requiring user decision
* Preferences modal with granular control
* Lightweight Preact-based UI in Shadow DOM

== Installation ==

1. Upload the `cookie-banner-wp` folder to `/wp-content/plugins/`.
2. Activate the plugin through the Plugins menu.
3. Go to Settings > Cookie Banner to configure.

== Configuration ==

* **Primary Color** – Accent color for buttons and toggles.
* **Background Color** – Banner background.
* **Text Color** – Banner text color.
* **Privacy Policy URL** – Link shown in the banner. Banner is suppressed on this page.
* **GTM Container ID** – Optional. If set, the banner loads GTM and manages consent signals.
* **Language** – Choose English, Polish, French, German, Spanish, Italian, Dutch, Danish, Norwegian, Swedish, automatic WordPress locale detection, or custom text.

== Upgrade Notice ==

= 2.0.1 =
Security and accessibility fixes. Consent evidence now uses strict category validation, atomic request quotas and a transactional storage budget (10,000 records by default). Existing MySQL evidence tables require InnoDB and are migrated automatically. Review docs/deployment-security.md for limits and the SSH-only developer deployment configuration. Automated accessibility checks do not constitute a full WCAG conformance declaration.

= 2.0.0 =
Review the controller, processing purposes, privacy policy and provider disclosures before upgrading. Incomplete optional services remain blocked and prior consent records are invalidated. Strict button appearance is the default; choose Standard for outlined refusal. Both styles retain consent blocking. Multilingual content and migration instructions are in the repository documentation.

= 1.3.0 =
Strict consent CSP is enabled by default. Optional external services require explicit consent and page reload. HTML page caching is bypassed; purge any additional CDN/proxy cache before enabling public traffic. Review external essential origins and custom integrations before upgrading.

== Changelog ==

= 2.0.2 =
* Separate atomic controls, composed components, consent logic and tests in the source tree.
* Rebuild the banner and administrator assets from the reorganized sources.
* Exclude test fixtures and development configuration from the installable plugin archive.

= 2.0.1 =
* Bound public consent evidence size and storage with atomic quotas and transactional inserts/retention.
* Replace plaintext developer FTP deployment with verified SSH; pass SVN passwords through stdin.
* Improve modal names, keyboard traversal, closing and focus restoration across browsers.
* Fix dark preference surfaces and prevent the bottom banner from obscuring keyboard focus.
* Improve video/iframe blocker focus, error announcements and target sizes.
* Make administrator notifications persistent and available to assistive technology.
* Add accessibility regression coverage across Chromium, Firefox and WebKit, including blocked/loaded/withdrawn embeds.

= 2.0.0 =
* Require reviewed controller/purpose/policy and provider information before optional consent.
* Add versioned consent evidence, WordPress server records, export and retention.
* Add direct withdrawal, declared identifier cleanup and immediate network restriction before reload.
* Refine the popup and theme-aware video/iframe placeholders.
* Add Strict (default) and Standard button styles shared with the npm package.
* Complete ten-language UI/blocker/shortcode dictionaries and per-language custom content.
* Add Polylang/WPML language, string translation and policy-page adapters.
* Preserve consent/CSP separation by language and verify optimizer/cache behavior.

= 1.4.1 =
* Refine all administrator sections with consistent cards, typography, controls and accessible contrast.
* Add a palette and validated HEX editor, synchronized full-width live preview and preview retry states.
* Frame the interactive preview clearly and align consent-bar button sizes and responsive spacing.
* Keep banner descriptions complete when policy links are not configured in all supported languages.
* Make navigation fit its contents and keep the last scan date on one line.
* Improve populated cookie tables, filters, shortcode copying, import dialogs and mobile layouts.
* Preserve import selections after errors and prevent service writes before existing services load.

= 1.4.0 =
* Use shared cookie branding and keep third-party plugin notices off the Cookie Banner settings screen.
* Add an administrator dashboard, setup checklist and separate management sections.
* Add a custom service editor shared by the scanner, content blocker and CSP.
* Validate custom integrations and require a new service ID when their purpose or destinations change.
* Add frontend header diagnostics, cache maintenance and native WordPress Site Health information.
* Refresh supported caches after settings and service changes.
* Isolate the live preview from real consent storage and remove the legacy Tailwind CDN dependency.
* Preserve drafts across sections and edits made while a previous save is in progress.
* Improve administrator forms and preview layout on mobile screens.


= 1.3.1 =
* Make content placeholders more compact with smaller text and controls.
* Inherit the host page font family and text color, with subtle matching surfaces and borders.
* Add a local YouTube play icon without requesting a preview image before consent.
* Replace unknown provider labels with neutral external-content text.
* Let video placeholders grow on narrow screens so text and buttons remain inside the frame.


= 1.3.0 =
* Add per-service consent, automatic content placeholders, and server-safe npm integration helpers.
* Block third-party resources before consent using HTTP CSP, HTML rewriting and dynamic loader interception.
* Reload the document after consent changes and isolate consent-dependent HTML from shared caches.
* Preserve Elementor video, WP Rocket and LiteSpeed script combining/delay after consent.
* Reuse the scanner registry and include attributed community service/cookie databases.
* Verify real YouTube playback and cache isolation on native PHP and OpenLiteSpeed.


= 1.2.1 =
* Fix consent buttons becoming unresponsive while WP Rocket loads delayed scripts.
* Keep accept, reject, category toggles, saving and reopening preferences responsive.
* Exclude consent configuration and bundle from WP Rocket script delay.

= 1.2.0 =
* Added Dutch, Danish, Norwegian, and Swedish banner translations.
* Added WordPress language selection and automatic locale detection for the four new languages, including Bokmål and Nynorsk mapping.

= 1.0.0 =
* Initial release.

== Upgrade notice ==

= 2.0.0 =
Optional processing stays blocked until controller, purposes, privacy policy and reviewed provider disclosures are complete. Previous consent is invalidated. Consent evidence is retained locally in WordPress for 180 days by default.
