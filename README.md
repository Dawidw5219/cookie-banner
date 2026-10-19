# Cookie Banner

Lekki baner zgód cookies dla aplikacji webowych, ze wsparciem Google Consent
Mode v2.

## Pakiet npm

```bash
npm install cookie-banner
```

Pakiet publikuje gotowy bundle z katalogu `dist/`. Katalog `plugin/` jest
częścią repozytorium GitHub, ale jest celowo wykluczony z paczki npm.

```bash
pnpm build
pnpm test
pnpm typecheck
```

## Plugin WordPress

Źródła pluginu znajdują się w [`plugin/`](./plugin). Plugin korzysta z tego
samego buildu cookie bannera i może być pakowany niezależnie:

```bash
pnpm build:all
pnpm --dir plugin run zip
```
