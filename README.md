# Cookie Banner

Lekki baner zgód cookies dla aplikacji webowych, ze wsparciem Google Consent
Mode v2.

Publiczne API jest niezależne od frameworka. Wbudowany interfejs używa Preact,
ale aplikacja nie musi korzystać z React ani Preact. W Vue inicjalizuj baner
w `onMounted()`, a w React/Next.js po stronie klienta, po hydratacji.

Obsługiwane języki bannera: angielski, polski, francuski, niemiecki,
hiszpański, włoski, niderlandzki, duński, norweski i szwedzki. Plugin
WordPress może wykrywać język automatycznie na podstawie locale strony.

## Pakiet npm

```bash
npm install @app4you/cookie-banner
```

Pakiet publikuje gotowy bundle z katalogu `dist/`. Katalog `plugin/` jest
częścią repozytorium GitHub, ale jest celowo wykluczony z paczki npm.

```bash
bun run build
bun run test
bun run typecheck
```

Build bannera oraz build panelu WordPressa zaczynają się od sprawdzenia typów.
Wszystkie słowniki muszą odpowiadać schematowi `src/i18n/en.ts`; brak klucza,
nieprawidłowy typ tłumaczenia lub błędny klucz edytora przerywa build.

## Struktura projektu

- `src/core/` — logika zgód, zapis, usługi, CSP i blokowanie zasobów.
- `src/ui/` — atomowe elementy: przyciski, przełącznik i ikonki.
- `src/components/` — złożone komponenty: baner, pasek, modal i sekcje.
- `src/hooks/` — hooki Preact.
- `src/style.css` — style bannera; obsługa hosta, motywu i przewijania jest w `src/core/`.
- `src/i18n/` — słowniki tłumaczeń i wybór języka.
- `src/api/` — publiczne API npm.
- `src/app.tsx` — uruchamianie i zamykanie bannera; `src/types.ts` — wspólne typy i stałe.
- `src/demo.tsx` — demo uruchamiane przez `bun run dev`.
- `tests/` — testy bannera w układzie odpowiadającym źródłom; `tests/fixtures/` — dane testowe.
- `plugin/src/` — panel WordPressa; `plugin/tests/` — testy pluginu.
- `scripts/` — generowanie metadanych paczki, aktualizacja baz usług i uruchamianie WordPress Playground.

`bun run test` uruchamia testy Vitest z `tests/` i `plugin/tests/`.

Testy przeglądarkowe bannera są w `tests/browser/`, a test paczki npm w
`tests/package/`. Komendy `test:browser`, `test:package`, `test:privacy`
i `test:accessibility` wskazują te katalogi. Test paczki i testy korzystające
z `dist/` wymagają wcześniejszego `bun run build:banner`; `test:browser`
korzysta z serwera demo uruchomionego przez `bun run dev`.

Testy WordPressa są w `plugin/tests/browser/` i `plugin/tests/php/`.
Uruchamia się je ręcznie, np. `node plugin/tests/browser/wordpress-consent.mjs`
lub `php plugin/tests/php/wordpress-locales.php`. Testy integracyjne wymagają
lokalnego WordPressa, a testy panelu również sesji administratora
(`WORDPRESS_ADMIN_SESSION`). Nie należą do domyślnego zestawu Vitest.
Test narzędzi wdrożeniowych można uruchomić bez serwera:
`node plugin/tests/deployment.cjs`.

## Plugin WordPress

Źródła pluginu znajdują się w [`plugin/`](./plugin). Plugin korzysta z tego
samego buildu cookie bannera i może być pakowany niezależnie:

```bash
bun run build:all
bun run --cwd plugin zip
```

## Natywne zgody i blokowanie treści

Punkt wejścia `@app4you/cookie-banner/native` udostępnia bezpieczne w SSR
`blockedContentProps` i `blockedScriptProps`, inicjalizację bannera oraz API
zgody na konkretną usługę. W WordPressie działa oddzielna warstwa blokowania
HTML i dynamicznych loaderów, korzystająca z istniejącego skanera.

[Integracja npm / Next.js i WordPress](docs/consent-integration.md).

Tryb rygorystyczny używa CSP w odpowiedzi HTTP i przeładowania po zmianie zgody.
Npm udostępnia `consentCspHeaders`; WordPress włącza ten tryb domyślnie.
HTML zależny od zgód omija współdzielony cache, a optymalizacje JS/CSS pozostają aktywne.
[Konfiguracja wdrożeń](docs/deployment-security.md).

## Konfiguracja zgód

Opcjonalne usługi pozostają zablokowane przy niepełnych informacjach o administratorze, celu i dostawcy. Zmiana wersji informacji wymaga ponownego wyboru.

[Wymagane informacje i konfiguracja zgód](docs/consent-compliance.md).
[Konfiguracja języków, WPML i Polylang](docs/multilingual.md).
