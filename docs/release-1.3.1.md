# 1.3.1

Content placeholders now use compact text and buttons, inherit the website font
family and text color, and use subtle matching surfaces and borders. YouTube gets
a local play icon; unknown integrations display “Treść zewnętrzna” / “External
content” instead of a technical provider label. Video-shaped placeholders grow
when necessary on narrow screens so that controls and text remain inside them.

The privacy behavior remains unchanged: no provider thumbnail or icon is fetched
before consent, and granting/withdrawing service consent uses the existing flow.
Existing custom `--cb-content-*` CSS variables remain supported.

Validation: 45 unit tests, TypeScript checks, production build, browser UI/guard
regressions, native HTTP-CSP browser test, and actual WordPress screenshots.
Mobile layout was checked at 375px, including font/color inheritance with a dark
host theme and absence of external requests before consent.

This release publishes the WordPress ZIP. npm publication is handled separately
by Dawid; the npm source version is also prepared as 1.3.1 on main.
