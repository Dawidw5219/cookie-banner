=== Cookie Banner App4You ===
Contributors: app4you
Tags: cookie, gdpr, consent, google tag manager, consent mode
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.2.0
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

== Changelog ==

= 1.2.0 =
* Added Dutch, Danish, Norwegian, and Swedish banner translations.
* Added WordPress language selection and automatic locale detection for the four new languages, including Bokmål and Nynorsk mapping.

= 1.0.0 =
* Initial release.
