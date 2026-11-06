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
