# Strict network CSP verification — 2026-11-06

Implementation is in the npm build and WordPress plugin on main. No npm release,
Git push or production-domain deployment was performed in this task.

## Behavior

- Server-side CSP defaults to no external destinations, independent of scanner matches.
- Local scripts/styles and inline WordPress/framework bootstrap remain allowed.
- Service grants are validated cookie IDs resolved against server-owned allowlists.
- WordPress unknown HTTPS iframe origins are allowed for frame-src only when the
  corresponding iframe appears in the current response. A forged cookie cannot
  introduce an arbitrary origin. Other independent CSP headers remain in force.
- The client saves consent, reloads, and only the new document can load newly
  allowed resources. Withdrawal, another tab's consent storage change and bfcache
  restoration refresh the policy. No client-side meta-CSP relaxation is used.
- Consent-dependent HTML is private/no-store with Vary: Cookie; assets remain
  cacheable. Rocket HTML writes are disabled and existing Rocket/LiteSpeed caches
  purged on deployment/activation. LiteSpeed emits no-cache independently of its
  active JS optimizations. Additional upstream caches require explicit bypass/purge.
- Early known-service CSP is emitted before rendering; the final full HTML buffer
  resolves page-specific iframe permissions before the first body byte is sent.
  A meta policy is placed before resources as defense in depth.

## Environments and evidence

Local native WordPress: PHP 8.5.12, WordPress 7.1.4, Twenty Twenty-Five,
Elementor 4.3.6, WP Rocket 3.24 or LiteSpeed Cache 7.9.3, SQLite integration.
Actual OpenLiteSpeed 1.9.4 / PHP 8.2 container was also tested, using the official
image digest `sha256:91ca324386be3fe8cd91591112dbdd8e41af48cccbe4a48e3e8673a2921c8504`.
The server cache was independently demonstrated with miss then hit and identical
response bodies; protected WordPress documents remained uncached.

WP Rocket came from official GPL source tag 3.24, with Composer runtime dependencies.
Only the local test copy's license-key gate was changed to return true, so offline
optimizers could run. This was not an untouched licensed customer distribution;
cloud services/license authentication were not tested or added to our package.
SQLite integration produced DELETE JOIN cleanup warnings during optimizer switches;
frontend runs reported no JavaScript errors. Production MySQL compatibility was
not inferred from this test. No DirectAdmin/production domain was modified.

| Evidence | Checks |
| --- | --- |
| `native-csp-results.json` | Published npm build via HTTP: parser-inserted external script and unknown CSS blocked before consent; refusal; grant reload; live vendor script and iframe; local button; eight alternating cookie/no-cookie HTTP responses; UI withdrawal |
| `elementor-rocket-csp-results.json` | off / combine / delay / both: enforced headers, unknown fetch/beacon/script/image/stylesheet probes, no external requests before interaction or after rejection, YouTube allowed after consent, local functionality, no JS errors; generated optimization markers asserted |
| `elementor-litespeed-csp-results.json` | Same four profiles on native PHP |
| `elementor-litespeed-server-csp-results.json` | Same four profiles on actual OpenLiteSpeed |
| `rocket-csp-cache-results.json` | Twelve alternating denied/granted requests to the same URL: correct HTTP and meta policies, no-store, no cache hits |
| `litespeed-server-csp-cache-results.json` | Same twelve requests on actual OpenLiteSpeed |
| `litespeed-cache-capability.json` | Separate disposable PHP probe proves the actual server can return a cache hit |
| `elementor-rocket-csp-live-player-results.json` | Genuine YouTube playback with Rocket both: readyState 4; currentTime progressed 0.021333 → 1.993008; zero external requests before consent, zero JS errors |
| `elementor-litespeed-csp-live-player-results.json` | Genuine YouTube playback on OpenLiteSpeed + LiteSpeed both: readyState 4; currentTime progressed 0.073017 → 2.074037; zero external requests before consent, zero JS errors |
| `wordpress-csp-unknown-results.json` | Unknown iframe restored with frame-only permission; unregistered script and fabricated cookie ID blocked |

The optimizer matrices mock external response bodies only after observing attempted
network requests, allowing deterministic leak and local functionality assertions.
The separate live-player checks allow genuine YouTube traffic after consent and
measure progression of the HTML video currentTime; they do not mock the player.
See the live-player JSON files for precise results.

Compatibility exceptions are scoped to the active delay loader: WP Rocket requires
unsafe-eval, LiteSpeed requires local blob scripts. No wildcard HTTPS, arbitrary
network source, unsafe-eval or blob permission is added by default to npm policy.
This is a network privacy allowlist, not a nonce-based XSS policy. Cross-origin
iframes control their own nested resource requests once allowed; first-party
tracking and server-to-server traffic require application-specific review.

## Commands

```sh
bun run test
bun run typecheck
bun run build
bun run --cwd plugin typecheck
bun run test:browser
php scripts/test-content-blocker.php /path/to/wordpress
node scripts/test-csp-native.mjs
WORDPRESS_TEST_URL=http://127.0.0.1:9403 OPTIMIZER_NAME=rocket-csp node scripts/test-elementor-optimizers.mjs
WORDPRESS_TEST_URL=http://127.0.0.1:9404 OPTIMIZER_NAME=litespeed-server-csp node scripts/test-elementor-optimizers.mjs
WORDPRESS_TEST_URL=http://127.0.0.1:9404 OPTIMIZER_NAME=litespeed-server node scripts/test-csp-cache.mjs
WORDPRESS_TEST_URL=http://127.0.0.1:9404 node scripts/test-wordpress-csp-unknown.mjs
WORDPRESS_TEST_URL=http://127.0.0.1:9404 node scripts/test-elementor-player.mjs
```

A mutation inverting the server service-allowlist guard was rejected by the CSP
unit tests; the mutation was restored before the final build. Browser test commands
currently use the installed macOS Google Chrome executable.

Final automated checks: 45 unit tests passed, root and plugin TypeScript checks,
production build/ZIP, PHP syntax checks, existing browser UI/guard regression tests,
13 HTML-rewrite checks plus malformed-cookie and wildcard-domain assertions.
The separate existing WP browser-fixture branch was skipped (no WP_FIXTURE_PATH);
actual WordPress browser matrices above cover the deployed plugin instead.

## Retained local environments

The superseded Playground processes on 9400–9402 were stopped. The native test
installation on 9403 remains available (about 205 MB). The dedicated `cb-consent`
Colima environment was stopped after testing; its roughly 2.3 GB of VM/image/site
state is retained for repeatable real-server tests. Restore it with
`colima start --profile cb-consent` and use localhost:9404. It contains only the
isolated local WordPress test copy. No separate environment was made per profile.
The current npm dist is about 716 KB; a single current plugin ZIP is retained.
