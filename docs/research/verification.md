# Weryfikacja zmian zgód — 2026-11-06

- 39 testów Vitest: wszystkie przeszły; w tym odmowa automatycznej zgody, SSR API, osobne zgody, ważność zapisu, dynamiczne komponenty i ochrona setterów.
- TypeScript: główny pakiet, panel WordPressa i osobny konsument opublikowanych deklaracji przeszły kontrolę typów.
- Build: IIFE, ESM/native, deklaracje oraz ZIP pluginu powstały poprawnie. Paczka npm ma licencje, NOTICE i natywny eksport; nie zawiera źródeł wtyczki WP. Sprawdzenie `npm pack --dry-run` nie publikuje niczego.
- 13 asercji PHP z prawdziwym parserem WordPressa: neutralizacja skryptów/iframe/piksela, lazy-src, wskazówek połączeń, loadera inline; lokalne zasoby zachowane, transformacja idempotentna, bootstrap przed surowym kodem, poprawna granica hostname.
- Chrome/Playwright: brak prób żądań do mockowanych dostawców przed zgodą i przy odmowie; zgoda na YouTube nie włącza Vimeo; zapis i cofnięcie działają; preferencje pokazują tylko wykryte usługi.
- Chrome/Playwright: przechwycenie dynamicznych src/type/setAttribute, appendChild, innerHTML, insertAdjacentHTML oraz rozpoznanych fetch, XHR i sendBeacon przed wysłaniem requestu. Wybrany dostawca odblokowuje się po zgodzie.
- Chrome/Playwright: odpowiedź przekształcona przez PHP + produkcyjny IIFE zatrzymała również inline loader składający URL z fragmentów, bez błędów strony.
- Ręcznie obejrzano zrzuty desktop/mobile boksów; poprawiono przepełnienie zawartości na małym ekranie. Boks korzysta z lokalnych elementów, bez zewnętrznych miniatur.

Środowisko PHP używało runtime PHP-WASM oraz oryginalnych klas WordPressa pobranych z wordpress.org. Pozostałe usługi WP były stubami. Nie testowano pełnego docelowego WordPressa z jego bazą, motywem, zestawem wtyczek, CDN, CSP i cache. Nie wykonano publikacji npm ani wdrożenia witryny. Wyniki nie stanowią certyfikatu zgodności prawnej całej witryny.

Powtarzalne komendy i zakres ograniczeń: [integracja](../consent-integration.md). Przejrzane mechanizmy konkurencji: [raport](wordpress-blockers.md).

Sprzątanie własnych kopii roboczych po analizie: przyrost dostępnego miejsca zmierzony przez statvfs wyniósł 220389376 bajtów (około 210 MiB). Zachowano aktualny dist, ZIP wtyczki, testy i użyteczne zależności.
