# Cookie Banner

Lekki baner zgód cookies dla aplikacji webowych, ze wsparciem Google Consent
Mode v2.

Obsługiwane języki bannera: angielski, polski, francuski, niemiecki,
hiszpański, włoski, niderlandzki, duński, norweski i szwedzki. Plugin
WordPress może wykrywać język automatycznie na podstawie locale strony.

## Pakiet npm

```bash
npm install cookie-banner
```

Pakiet publikuje gotowy bundle z katalogu `dist/`. Katalog `plugin/` jest
częścią repozytorium GitHub, ale jest celowo wykluczony z paczki npm.

```bash
bun run build
bun run test
bun run typecheck
```

## Plugin WordPress

Źródła pluginu znajdują się w [`plugin/`](./plugin). Plugin korzysta z tego
samego buildu cookie bannera i może być pakowany niezależnie:

```bash
bun run build:all
bun run --cwd plugin zip
```

## Natywne zgody i blokowanie treści

Punkt wejścia `cookie-banner/native` udostępnia bezpieczne w SSR
`blockedContentProps` i `blockedScriptProps`, inicjalizację bannera oraz API
zgody na konkretną usługę. W WordPressie działa oddzielna warstwa blokowania
HTML i dynamicznych loaderów, korzystająca z istniejącego skanera.

[Integracja Next.js / npm i WordPress, ograniczenia oraz testy](docs/consent-integration.md).
[Porównanie mechanizmów 17 publicznych wtyczek WordPress](docs/research/wordpress-blockers.md).

Tryb rygorystyczny używa CSP w odpowiedzi HTTP i przeładowania po zmianie zgody.
Npm udostępnia `consentCspHeaders`; WordPress włącza ten tryb domyślnie.
HTML zależny od zgód omija współdzielony cache, a optymalizacje JS/CSS pozostają aktywne.
[Wyniki testów CSP z Elementorem, WP Rocket i rzeczywistym OpenLiteSpeed](docs/research/strict-csp-verification.md).

## Migracja do 2.0

[Wymagane informacje, zapis zgód, wycofanie i ograniczenia](docs/consent-compliance.md).
Wersja 2.0 celowo blokuje opcjonalne usługi przy niepełnych informacjach i wymaga nowego wyboru dla starych zgód.

Multilingual setup (npm, WPML, Polylang): [docs/multilingual.md](docs/multilingual.md).
