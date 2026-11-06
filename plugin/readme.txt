=== Cookie Banner App4You ===
Contributors: app4you
Tags: cookie, gdpr, consent, google tag manager, consent mode
Requires at least: 6.5
Tested up to: 6.7
Requires PHP: 8.0
Stable tag: 1.4.0
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

= 1.3.0 =
Strict consent CSP is enabled by default. Optional external services require explicit consent and page reload. HTML page caching is bypassed; purge any additional CDN/proxy cache before enabling public traffic. Review external essential origins and custom integrations before upgrading.

== Changelog ==

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
