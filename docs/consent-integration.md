# Integracja zgód: npm i WordPress

Pakiet i wtyczka korzystają z jednego modelu zgód oraz rejestru rozpoznawania usług. Wyniki skanowania pozostają w istniejącym module `plugin/src/features/scanner` i dotychczasowych opcjach WordPressa. Nie ma drugiej tabeli cookies.

## Npm: kod własnej strony / Next.js

Nowy punkt wejścia: `cookie-banner/native`. Sam import i funkcje generujące atrybuty są bezpieczne w SSR. Klient pobiera kod bannera dopiero podczas inicjalizacji. Dotychczasowy bundle IIFE pozostaje w `cookie-banner` i `cookie-banner/auto`.

W komponencie serwerowym można od razu wygenerować nieaktywny iframe:

```tsx
import { blockedContentProps } from "cookie-banner/native";

export function Video() {
  return <iframe
    {...blockedContentProps("youtube", "https://www.youtube-nocookie.com/embed/VIDEO_ID")}
    title="Film o naszej firmie"
    width={800}
    height={450}
    allowFullScreen
  />;
}
```

W HTML nie ma `src`, tylko `data-cb-src`. Brak JS nie uruchomi dostawcy. Identyczne właściwości działają z Reactem i Preactem. Przykład w tym repo faktycznie korzysta z API: `src/demo.tsx`.

Inicjalizacja po hydratacji, np. w jednym komponencie klientowym Next.js:

```tsx
"use client";
import { useEffect } from "react";
import { initializeConsent } from "cookie-banner/native";

export function ConsentProvider() {
  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    initializeConsent({
      mode: "standalone",
      lang: "pl",
      variant: "bar",
      privacyPolicyUrl: "/polityka-prywatnosci",
      services: [{
        id: "youtube",
        name: "YouTube",
        description: "Odtwarzanie osadzonych filmów. Po zgodzie Google otrzyma adres IP i dane przeglądarki.",
        privacyUrl: "https://policies.google.com/privacy",
      }],
    }).then(cleanup => {
      if (cancelled) cleanup();
      else dispose = cleanup;
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);
  return null;
}
```

Dla zwykłego skryptu użyj `blockedScriptProps("service-id", "https://provider.example/sdk.js")`. Skrypt inline również musi dostać te atrybuty i `type="text/plain"`. Nie przekazuj aktywnego `src` do `next/script`, preloadu ani frameworkowego komponentu, który sam rozpoczyna połączenie. Identyfikator usługi musi być taki sam w konfiguracji i atrybutach.

Dla komponentu wykonującego żądania podczas montowania zastosuj `onServiceConsent` **przed jego zamontowaniem**:

```ts
import { onServiceConsent } from "cookie-banner/native";

const unsubscribe = onServiceConsent("support-chat", granted => {
  if (granted) mountChat();
  else unmountChat();
});
// Przy odmontowaniu właściciela: unsubscribe().
```

`mountChat()` powinno zawierać również import/uruchomienie SDK — nie importuj wcześniej modułu mającego efekty uboczne. Zarejestruj własną usługę w `services` z jej rzeczywistym celem i polityką. `urls` pozwala przypisać dokładne prefiksy URL (porównywane po origin i ścieżce), także własnych skryptów. Domyślnie natywna integracja nie zmienia prototypów przeglądarki; `autoBlock: true` włącza dodatkowy guard dla zewnętrznego, niekontrolowanego kodu.

Dostępne są też `hasServiceConsent(id)` i `setServiceConsent(id, boolean)`. Wycofanie zgody przeładowuje dokument, ponieważ usunięcie znacznika script nie usuwa uruchomionych timerów i listenerów SDK. Zgody usług są niezależne od kategorii analityka/marketing.

## WordPress

Warstwy działania:

1. `script_loader_tag`, `wp_inline_script_attributes`, `render_block`, `embed_oembed_html` przekształcają rozpoznane zasoby i kod powiązany z enqueue.
2. Bufor całej odpowiedzi PHP obejmuje również surowe `echo`, iframe i rozpoznane inline loadery. Parser WP neutralizuje `src`, alternatywne adresy lazy load, srcset i odpowiednie wskazówki połączeń. Skrypty są `text/plain`.
3. Synchronous bootstrap jest przenoszony na początek gotowego head, przed kod wydrukowany przed `wp_head`. Ma atrybuty wyłączenia optymalizacji dla popularnych loaderów.
4. Guard przechwytuje natywne właściwości URL, `setAttribute`, wstawianie węzłów i typowe operacje HTML przed wywołaniem implementacji przeglądarki. Dodatkowo zatrzymuje rozpoznane opcjonalne żądania `fetch`, XHR i `sendBeacon`. Nieznane iframe są grupowane osobno według dostawcy/domeny; celu nieznanych skryptów nie zgadujemy.
5. Runtime pokazuje lokalny boks bez zewnętrznej miniatury, aktywuje wyłącznie wybraną usługę i zachowuje kolejność odblokowywanych skryptów. Piksele śledzące i wskazówki połączeń nie dostają dużych widocznych boksów.
6. Istniejący skaner rozróżnia zablokowany element od requestu zaobserwowanego w Performance API. Audyt administratora wymusza odmowę bez nadpisywania jego zapamiętanych wyborów.

Własny kod WordPressa może emitować:

```html
<iframe hidden data-cb-service="youtube"
  data-cb-src="https://www.youtube.com/embed/VIDEO_ID" title="Film"></iframe>
<script type="text/plain" data-cb-service="custom-analytics"
  data-cb-src="https://metrics.example/sdk.js"></script>
```

Filtr `cookie4_config` pozwala dodać `services` (ten sam format co npm) i ustawić `autoBlock: false` w razie konfliktu konkretnej witryny. To wyłącza dodatkowy guard; transformacja PHP pozostaje. Własne usługi oznaczone w HTML pozostają blokowane bez zgody niezależnie od obecności w bazie.

Boksy dziedziczą font i korzystają z kolorów bannera. Strona może nadpisać zmienne CSS: `--cb-content-background`, `--cb-content-color`, `--cb-content-border`, `--cb-content-radius`, `--cb-content-primary`, `--cb-content-button-text` oraz klasę `.cb-content-placeholder`.

## Bazy i aktualizacje

- `plugin/includes/cookie-database.json`: istniejąca Open Cookie Database, zaktualizowana w miejscu — 2280 wpisów.
- `plugin/includes/service-database.json`: dane Third Party Web — 2141 dostawców, 3132 wzorce domen.
- `tracker-database.json`: niewielka warstwa dokładniejszych reguł produktów i metadanych (np. odróżnienie GA od kontenera GTM).
- `database-sources.json`: wersje źródłowe; `bun run update:databases` odtwarza import. Aktualizacja rewizji jest świadomą zmianą kodu, bez pobierania bazy podczas wizyty użytkownika. Import nie wykonuje pobranego JS.
- Licencje i atrybucja są w `plugin/NOTICE` oraz `plugin/licenses/`.

Preferencje pokazują usługi skonfigurowane lub zaobserwowane na witrynie, a nie całą bazę. Trzeba zweryfikować rzeczywisty cel przetwarzania, administratorów i polityki nieznanych usług. Kategorie z bazy są wskazówką, a nie oceną prawną konkretnej konfiguracji.

## Weryfikacja

```sh
bun run test
bun run typecheck
bun run --cwd plugin typecheck
bun run build
# W drugim terminalu: bun run dev --host 127.0.0.1
bun run test:browser
```

Testy przeglądarkowe używają lokalnego Chrome na macOS albo Chromium Playwright; można podać `CHROME_PATH` i `CONSENT_TEST_URL`. Wszystkie zewnętrzne żądania są przechwytywane i mockowane, więc test nie wysyła danych dostawcom.

Sprawdzenie prawdziwego parsera WordPressa i produkcyjnego bundla:

```sh
php scripts/test-content-blocker.php /path/to/wordpress /tmp/cookie-banner-fixture.html
WP_FIXTURE_PATH=/tmp/cookie-banner-fixture.html bun run test:browser
```

Test PHP korzysta z oryginalnych klas parsera WordPressa i stubów usług WordPressa; to nie jest pełna instalacja witryny z bazą danych. Przed wdrożeniem trzeba dodatkowo sprawdzić docelowy motyw, używane wtyczki, CSP, cache i optymalizatory, a potem wyczyścić stare odpowiedzi HTML w cache.

## Granice i zmiany zachowania

Nie deklarujemy automatycznej pełnej zgodności całej witryny z RODO. Baza nie zna wszystkich celów; guard nie stanowi kompletnego firewalla przeglądarki. Nie obejmuje każdej ścieżki, np. Workerów, obcych realmów, wcześniej przechwyconych API, dowolnego `document.write`, zasobów CSS, Early Hints i serwerowego trackingu. Nie usuwa cudzych cookies HttpOnly ani cookies na domenie dostawcy. Te przypadki wymagają integracji u źródła i audytu docelowej strony.

`testMode` i `autoAcceptAll` nie udzielają już zgód. Dotychczasowe zgody bez aktualnego rekordu wersji są uznawane za nieważne; nowy zapis ma wersję, czas i okres ważności 180 dni (wybór produktu, nie uniwersalny termin ustawowy). Google działa w Basic Consent Mode: GTM wymaga aktywnej zgody na usługę oraz cel, a przy odmowie nie jest ładowany. Tagi wewnątrz kontenera muszą nadal mieć poprawnie skonfigurowane wymagania zgód.

Badanie mechanizmów 17 konkurencyjnych paczek: [wordpress-blockers.md](research/wordpress-blockers.md).

## Strict network CSP (server integration)

`cookie-banner/native` now exports server-safe `consentCspHeaders`,
`buildConsentCsp` and `readCspConsent`. This is an HTTP policy, not a policy
installed by a client effect. Apply it to the initial HTML response:

```ts
import { consentCspHeaders } from 'cookie-banner/native';

const csp = {
  services: {
    youtube: {
      'script-src': ['https://www.youtube.com', 'https://s.ytimg.com'],
      'frame-src': ['https://www.youtube.com', 'https://www.youtube-nocookie.com'],
    },
    analytics: {
      'script-src': ['https://analytics.example.com'],
      'connect-src': ['https://analytics.example.com'],
    },
  },
};
const headers = consentCspHeaders(csp, request.headers.get('cookie') || '');
// Set every returned header on the HTML response. Preserve other Vary tokens.
// Initialize the client banner with strictCsp: true and the same service IDs.
```

For Next.js, compute these headers in middleware/proxy for document routes;
make the protected route/layout dynamic (`export const dynamic = 'force-dynamic'`)
and bypass CDN/full-page caching. Remove external HTTP Link/103 Early Hints and
HTML preconnect/prefetch hints; the helper disables DNS prefetch but cannot rewrite
HTML or a proxy configuration. A static export cannot emit a different HTTP
policy per visitor. Keep `blockedContentProps` / `blockedScriptProps` on optional
resources, including server-rendered markup. `initializeConsent` belongs in a
client effect; constructing response headers belongs on the server. The included
native browser test exercises the published build with an actual HTTP server.

The cookie `cb_csp_consent` contains only explicitly granted service IDs, expires
in 180 days, and uses Path=/, SameSite=Lax and Secure on HTTPS. The server ignores
unknown IDs; the cookie cannot add arbitrary origins. Every consent change reloads
the document before the client dispatches integration activation. Cross-tab storage
changes reload strict-CSP documents too. Serve one consent scope per host/path-root;
applications sharing an origin must use a common service registry.

Default policy: `default-src 'none'`, self-hosted resources, inline scripts/styles,
data images/fonts; no external sources, objects or external form submissions.
Service allowlists accept HTTPS origins only, optionally with a leading wildcard.
`essential` allows explicitly reviewed necessary destinations. `allowEval: true`
is an explicit optimizer compatibility escape hatch, not enabled by default.
Inline scripts remain allowed for framework/WordPress compatibility: this is a
network privacy policy, not a nonce-based XSS protection policy.

## WordPress CSP and caches

Strict CSP is enabled by default on frontend HTML, both as a response header and
as the first head meta policy (the header enforces additional directives such as
frame-ancestors). Registered service domains reuse the existing scanner registry;
unknown destinations stay blocked. Unknown HTTPS iframe origins are registered
for frame-src only from the actual HTML of the current response; consent cookies
cannot invent a destination. Customize `cookie4_csp_services` with a map of
service IDs to directive/origin arrays; use `cookie4_csp_essential` for necessary
origins. `cookie4_strict_csp` controls the whole mode. `cookie4_csp_allow_eval` can
force-disable the eval compatibility required by WP Rocket Delay JS, at the cost
of disabling that loader's behavior. Eval is otherwise allowed only while that
active optimizer has Delay JS enabled. LiteSpeed Delay JS instead needs local
`blob:` scripts; `cookie4_csp_allow_blob_scripts` can override that compatibility
exception. Neither exception adds an external network destination.

The plugin sets private/no-store HTML, Vary: Cookie, DONOTCACHEPAGE and LiteSpeed
no-cache controls, prevents LiteSpeed page-cache storage and WP Rocket HTML cache writes.
It purges both optimizers on deployment/activation and regenerates Rocket config
and Apache rules. Rocket's DONOTCACHEPAGE override is installed only when this
plugin defined that constant itself; cache writes remain disabled independently.
Local JS/CSS minification, combining and delay remain testable and active.
External HTML resource hints are removed, HTTP Link hints removed, and DNS prefetch
is disabled. Assets themselves remain cacheable.

Deploy through plugin activation/admin or explicitly run
`wp eval 'cookie4_csp_refresh_cache();'` **before reopening public traffic**. An
already cached HTML response can be served before WordPress loads the updated
plugin. Purge and bypass HTML at any additional CDN/reverse proxy/server cache;
PHP cannot reconfigure an unidentified upstream system or remove 103 Early Hints
it emits. Do not cache granted HTML variants, and do not let a CDN override no-store.
The meta policy is defense in depth, not permission to ignore these requirements.

CSP does not stop first-party tracking/proxy endpoints, server-to-server requests,
ordinary user navigation, or control requests inside an allowed cross-origin
iframe. YouTube's nested third-party dependencies become possible after YouTube
consent. Review the chosen integration's whole purpose and vendor dependencies.
This implementation does not itself establish legal compliance for a website.

References: [MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP),
[WP Rocket caching](https://docs.wp-rocket.me/article/1528-page-caching).
