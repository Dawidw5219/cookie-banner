# WordPress i nietypowe loadery — 2026-11-06

Uruchomiono pełny lokalny WordPress Playground (CLI 3.1.62), SQLite, rzeczywisty motyw Twenty Twenty-Five, nowy Cookie Banner i aktywny Cache Enabler. Odpowiedzi raportowały WordPress 7.1.4 oraz PHP 8.5.12. Blueprint i testowa wtyczka MU są w `tests/wordpress/`; nie są publikowane z pluginem.

## Wyniki

- **12/12 dynamicznych prób zablokowanych po poprawkach**, bez błędów wykonania. Sprawdzono script.src/type, iframe.setAttribute, innerHTML, insertAdjacentHTML, image.srcset, iframe.srcdoc, setAttributeNS, Range.createContextualFragment, outerHTML, ShadowRoot.innerHTML, fetch oraz fetch przez contentWindow nowego iframe.
- Pierwszy przebieg ujawnił **7 skutecznych obejść**. Usunięto odtworzone ścieżki. Srcset wymaga zgody na wszystkich rozpoznanych dostawców w zestawie kandydatów.
- **14/14 testów pełnego WordPressa**: 7 scenariuszy przy pierwszym wejściu i powtórnie. Bez prób połączeń z dostawcami i błędów JS. W siedmiu odpowiedziach powtórnych komentarz Cache Enabler potwierdzał faktyczne podanie pliku cache.
- **5 kontroli cyklu zgody na WordPressie**: brak requestu przed zgodą, aktywacja wybranego dostawcy, zapis po reload, wycofanie po reload, brak odziedziczenia zgody przez kolejnego użytkownika przez cache.
- Test wycofania ujawnił **podwójny reload przy aktywnym skrypcie**. Poprawiono: API przeładowuje po własnej zmianie zgody, a blocker osobno reaguje na zmianę storage z innej karty.
- Istniejące 39 testów, TypeScript, build i wcześniejsze testy przeglądarkowe przeszły.

Wszystkie zewnętrzne requesty rejestrowano i mockowano/odrzucano przed dostarczeniem do dostawcy. BLOCKED oznacza brak próby requestu w danym scenariuszu, nie uniwersalny certyfikat.

W długotrwałej sesji Playground/Cache Enabler wystąpiły odpowiedzi 304 bez reprezentacji dostępnej świeżemu Chrome. Przerwanych przebiegów nie uznano za sukces. Po restarcie czystego środowiska 14 testów przeszło z potwierdzonym cache. Test wysyła starą datę If-Modified-Since. Jest to ograniczenie tego środowiska, wymagające osobnego sprawdzenia na docelowym serwerze HTTP.

## Publiczna strona FCA

Bez zmiany serwera sprawdzono też fertilityclinicsabroad.com, wskazane w starszej dokumentacji repo. Widać motyw sdk-front-end, WP Rocket i bundle z katalogu cache/minifikacji. Zarówno obecna instalacja, jak i izolowana podmiana samego JS powodowały próby pobrania Google Fonts, GTM i reCAPTCHA przed zgodą. Nie przesądzamy podstawy prawnej każdego zasobu.

**Podmiana JS nie instaluje nowego blockera PHP i nie czyści cache serwera. Produkcyjna instalacja FCA nie została uznana za zweryfikowaną z nowym pluginem.** Domeny App4You nie zmieniano — wykorzystano dopuszczone pełne środowisko lokalne.

## Powtarzanie

```sh
bun run build
sh scripts/start-wordpress-playground.sh
# W drugim terminalu; test dynamiczny wymaga także Vite na 5173:
bun run dev --host 127.0.0.1
node scripts/test-hostile-loaders.mjs
node scripts/test-wordpress-playground.mjs
node scripts/test-wordpress-consent.mjs
```

Po zmianie bundla wyczyść lokalny cache przez `http://127.0.0.1:9400/?cb_test_purge=1` lub uruchom czyste środowisko. Nie przenosić wtyczki testowej na produkcję. Domyślne konto Playground jest przeznaczone wyłącznie do lokalnych testów.

Surowe wyniki są w tym katalogu: `hostile-loaders-results.json`, `wordpress-playground-results.json`, `wordpress-consent-results.json`, `wordpress-live-results.json`.

## Granice

Nie przetestowano dowolnych Workerów, przechwyconych wcześniej API, każdej ścieżki do innego realm, całego CSS, serwerowego trackingu ani wszystkich optymalizatorów. Przechwycenie contentWindow.fetch nie oznacza kontroli wszystkich skryptów każdego iframe. Sanitacja złożonego srcdoc może zmienić jego funkcjonalność. Preferowana jest jawna integracja zgód u źródła. Wyniki nie stanowią gwarancji zgodności prawnej dowolnej witryny.
