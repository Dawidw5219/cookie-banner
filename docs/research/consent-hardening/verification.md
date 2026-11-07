# Weryfikacja wdrożenia 2.0.0

Raport lokalnej weryfikacji przed publikacją 2.0.0. Prace wykonano na `main`,
bez nowej gałęzi lub worktree. Artefakty i instrukcje wydania: `docs/releases/2.0.0.md`.
Publikacja npm pozostaje zadaniem Dawida.

## Zakres i dowody

| Wymaganie | Weryfikacja |
| --- | --- |
| Czytelna akceptacja i odmowa | Wspólny komponent; wypełniona akceptacja i obrysowana odmowa, wspólne rozmiary przy 320, 390, 768 i 1440 px w bar/modal; ciemny i błędnie dobrany jasny motyw HEX; lokalne PNG obok raportu |
| Kompletne informacje przed zgodą | Wymagane: administrator, cel, polityka, wersja; per dostawca nazwa, cel, polityka i retencja; brak danych blokuje zgodę, odmowa pozostaje dostępna |
| Bez powielania bazy skanera | Edytor informacji korzysta z tych samych ID i istniejącej bazy; cookie cleanup korzysta z klasyfikacji istniejącego skanera |
| Zapis decyzji | Aktualny pełny rekord klienta + minimalne dowody serwerowe WordPress z kopią informacji, czasem serwera i hashem runtime; oryginalnego ID nie można nadpisać |
| Zmiana informacji | Stary grant odrzucany przez CSP przed parserem; edycja retencji w panelu zmienia wersję, historyczne dowody pozostają bez zmian |
| Wycofanie | Bezpośredni przycisk; API i placeholder wspólnie korzystają z zapisania/wycofania; usunięcie jawnych identyfikatorów first-party, zachowana niezbędna sesja; natychmiastowe CSP blokuje beacony SDK przy consent-update i pagehide przed przeładowaniem |
| Inna karta i nawigacja klientowa | Testy rzeczywistych przeładowań z odmową CSP, brak nowych zewnętrznych żądań; nonce/rejestr sprawdzone również na WordPressie |
| Odporność na obejścia | Próby fetch/beacon/script/img/style; dodatkowo lokalny worker i niechroniony lokalny iframe, które mogłyby działać poza CSP rodzica |
| npm | 90 testów jednostkowych w 16 plikach; typecheck; gotowa paczka testowana jako konsument NodeNext i Bundler, import SSR, deklaracje, nieaktywne atrybuty, CSP; 17 plików w paczce |
| WordPress | Typecheck panelu; składnia PHP; 18 kontroli integracji/backendu + 9 kontroli dowodów; 8 pełnych scenariuszy w przeglądarce |
| Elementor / optymalizatory | WP Rocket: off/combine/delay/both; LiteSpeed: te same cztery profile na rzeczywistym OpenLiteSpeed i MariaDB; sprawdzone wygenerowane optymalizacje i działanie lokalnych kontrolek |
| Cache | 12 naprzemiennych odpowiedzi z/bez zgody dla Rocket i 12 dla OpenLiteSpeed/MariaDB: poprawny HTTP/meta CSP, no-store, brak trafień cache chronionego HTML. Osobny niechroniony plik potwierdził miss → hit serwera i identyczną treść |
| Rzeczywisty film | YouTube w natywnym widżecie Elementora: stan playing/readyState 4 i rosnący czas, zero żądań przed zgodą i błędów JS w zapisanych wynikach Rocket oraz OpenLiteSpeed/MariaDB |
| Panel | Rzeczywiste pola i edytor dostawców, zapis zmiany i przywrócenie, eksport dowodów; izolowany podgląd obsługuje akceptację → wycofanie → ponowną akceptację bez nawigacji i zapisu realnej zgody |
| Wydanie lokalne | ZIP 2.0.0: 35 wpisów, tylko runtime; JS identyczny z npm dist; checksumy w artifacts.json |

Kontrola mutacyjna: usunięcie wymogu nazwy administratora powodowało niepowodzenie
testu zgód. Kod przywrócono, końcowy zestaw jednostkowy przechodzi.

## Pliki wyników

- [npm: 19 scenariuszy przeglądarkowych](native-results.json)
- [WordPress: 8 scenariuszy panelu i zgód](wordpress-results.json)
- [WP Rocket: 4 profile](../elementor-rocket-hardening-results.json)
- [OpenLiteSpeed/MariaDB: 4 profile](../elementor-litespeed-mariadb-v2-results.json)
- [Kontrola końcowa LiteSpeed z delay + combine](../elementor-litespeed-final-results.json)
- [Rocket: izolacja cache](../rocket-v2-csp-cache-results.json)
- [OpenLiteSpeed/MariaDB: izolacja cache](../litespeed-mariadb-final-csp-cache-results.json)
- [Potwierdzenie działającego cache serwera](litespeed-cache-capability.json)
- [Rocket: rzeczywiste odtwarzanie YouTube](rocket-live-player.json)
- [OpenLiteSpeed/MariaDB: rzeczywiste odtwarzanie YouTube](litespeed-mariadb-live-player.json)
- [Nierozpoznany iframe i sfałszowana zgoda](../wordpress-csp-unknown-results.json)
- [Hash i rozmiar artefaktów](artifacts.json)

## Warunki interpretacji

Środowiska są lokalnymi instalacjami testowymi: WordPress 7.1.4,
Twenty Twenty-Five, Elementor 4.3.6, WP Rocket 3.24 lub LiteSpeed Cache 7.9.3.
Pierwsza instalacja używa PHP 8.5 i SQLite. Zachowane środowisko OpenLiteSpeed 1.9.4
używa PHP 8.2; macierz cache powtórzono także z prawdziwą bazą MariaDB 11.4,
ponieważ integracja SQLite zgłaszała błędy DELETE JOIN w czyszczeniu cache LiteSpeed.
To błąd zgodności tamtej kombinacji testowej; nie przyjęto jej jako dowodu MySQL.

WP Rocket pochodzi z oficjalnego kodu GPL z zależnościami; jego lokalny testowy
warunek klucza licencji był zmodyfikowany, aby uruchomić optymalizatory offline.
Usługi chmurowe i uwierzytelnianie licencji WP Rocket nie były przedmiotem testu.

Większość prób ruchu używa kontrolowanych odpowiedzi dostawcy. Oddzielne próby
odtwarzania kontaktowały się z prawdziwym YouTube dopiero po zgodzie. To testy
przeglądarki i konkretnych konfiguracji, nie dowód o każdej możliwej wtyczce,
wersji cache, istniejącym service workerze, serwerowym proxy czy produkcyjnym CDN.

Informacje administratora i retencji w testach są jawnie fikcyjnymi danymi QA.
Nie zastępują danych i polityki konkretnego klienta. Walidacja może sprawdzić
kompletność pól, lecz nie prawdziwość opisu procesów lub zgodność transferów.
Nie wydajemy na tej podstawie gwarancji „100% zgodności prawnej każdej witryny”.

Instrukcja wdrożenia i obowiązki operatora: [migracja do 2.0](../../consent-compliance.md).

## Aktualizacja wyglądu

Popup: wypełniona akceptacja i obrysowana odmowa w kolorze motywu, osobna akcja ustawień,
ikona ciasteczka i lżejsze odstępy. Placeholdery: font i kolor strony,
lokalna ikona YouTube, jeden przycisk i rozwijane informacje o prywatności.
Nie dodano żadnych zdalnych miniatur ani innych zasobów dostawcy.

Zrzuty nowego wyglądu: [popup mobilny](../../screenshots/consent-redesign/popup-390.png),
[popup desktop](../../screenshots/consent-redesign/popup-1440.png),
[blokery mobilne](../../screenshots/consent-redesign/blockers-390.png),
[blokery desktop](../../screenshots/consent-redesign/blockers-1440.png).
Skrypt `scripts/capture-consent-design.mjs` pozwala odtworzyć podgląd lokalnie.
Po aktualizacji wyglądu ponowiono testy jednostkowe, typecheck, build,
17 scenariuszy npm i kontrolę paczki konsumenta. Macierzy optymalizatorów
WordPressa nie powtarzano dla tej zmiany wizualnej; jej wyniki powyżej
pochodzą z wcześniejszej weryfikacji logiki 2.0.0.

Pierwszy widok bannera skrócono następnie do jednego akapitu. Nazwa administratora
i szczegółowe cele pozostają w preferencjach dostępnych przed zgodą. Powtórzono
typecheck, build i podgląd przeglądarkowy 320/390/1440 px, sprawdzając dostępność
pełnych danych w preferencjach oraz brak żądań do dostawców. Nie powtarzano
pełnej macierzy WordPressa dla tej zmiany prezentacji tekstu.

Blokery filmu i iframe otrzymały tło dopasowane do otaczającej sekcji, subtelny
gradient i cień, ikonę w polu oraz pełny przycisk z kolorem motywu bannera.
Wykorzystują istniejące `applyTheme`; warunki zgody nie zostały zmienione.
Zweryfikowano podglądy 320/390/1440 px, rozwijane informacje, brak przepełnień
i brak żądań zewnętrznych; powtórzono 69 testów, typecheck i build.

Obsługa języków została rozszerzona; aktualne testy i granice weryfikacji WPML
opisano w [raporcie wielojęzyczności](../multilingual/verification.md).

Po korekcie wyglądu akceptacja ma pełne wypełnienie, odmowa jest obrysowana,
a zapis preferencji neutralny. Zachowano rozmiary i bezpośrednią odmowę.
Identyczna kolorystyka nie jest przedstawiana jako wymóg prawny.

Styl przycisków jest teraz wyborem administratora: domyślnie ścisły (`equal`),
opcjonalnie standardowy (`standard`). Ten sam kontrakt działa w npm i WordPressie.
Zweryfikowano domyślną wartość oraz zapis i odczyt przez autoryzowany REST WordPressa;
próba ponownego testu panelu w przeglądarce zatrzymała się na timeout lokalnego wp-admin.
Dwa warianty UI sprawdzono w 19 scenariuszach wspólnego runtime.
