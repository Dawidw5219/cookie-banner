# Konfiguracja zgód i informacji o prywatności

Baner nie uruchamia opcjonalnego przetwarzania,
jeżeli brakuje danych administratora, celu, wersji informacji lub poprawnego linku
do polityki prywatności. Stare rekordy zgody są unieważniane. Odmowa działa także
przy niedostępnym localStorage; opcjonalne zgody wymagają skutecznego zapisu.

To mechanizmy wspierające zgodne wdrożenie. Nie są certyfikatem zgodności całej
witryny ani oceną prawdziwości danych wpisanych przez jej administratora.

## WordPress

1. W „Banner & texts” wpisz rzeczywistą nazwę administratora, konkretne cele
   opcjonalnego przetwarzania, URL opublikowanej polityki i jej wersję. Zmiana
   celów, odbiorców lub polityki pod zewnętrznym URL wymaga zmiany wersji.
   Zmiana treści lokalnej strony polityki oraz buildu bannera jest wykrywana automatycznie.
2. Uruchom istniejący skaner. W „Services” sprawdź informacje o wykrytych
   dostawcach: rzeczywisty cel na tej stronie, politykę dostawcy oraz okres
   przechowywania danych lub kryteria jego określenia. Sugestie korzystają
   z tej samej bazy i identyfikatorów co skaner i blokowanie, bez drugiej tabeli
   cookies. Opisy bazy są sugestiami, nie potwierdzeniem konkretnego wdrożenia.
3. Nierozpoznane lub nieopisane usługi pozostają zablokowane. Zarejestruj
   własną integrację z jej URL-ami i pełnymi informacjami, zamiast zgadywać cel
   nieznanej domeny. Zmiana integracji wymaga nowego identyfikatora usługi.
4. Link `.open-consent-settings` i shortcode `[cookie_preferences_link]`
   nadal działają. Kontrolka ustawień pozostaje widoczna; przy aktywnych zgodach
   jest też bezpośredni przycisk wycofania wszystkich opcjonalnych zgód.
5. Zachowaj blokowanie CSP, wyczyść stare cache HTML i sprawdź CDN/reverse proxy.
   HTML zależny od zgód nie może być współdzielony między odwiedzającymi.

Samo zaznaczenie kategorii nie zastępuje zgody na odrębnie pokazanego dostawcę.
Nie należy oznaczać wszystkich „funkcjonalnych” cookies jako ściśle niezbędnych.
Tabela cookies domyślnie pokazuje także nierozpoznane pozycje.

## npm / Next.js

Serwer i klient muszą używać tej samej `noticeVersion`. Uaktualniaj ją przy
zmianach informacji, celów, odbiorców lub polityki. Bez wersji serwerowy helper
pozostawia opcjonalne domeny zablokowane. Sam import JS nie zastąpi nagłówka HTTP
CSP i nieaktywnych atrybutów SSR.

```ts
const noticeVersion = '2026-11-06.1';
const config = {
  mode: 'standalone', lang: 'pl', strictCsp: true, noticeVersion,
  controller: {name: 'RZECZYWISTA NAZWA ADMINISTRATORA'},
  purposes: 'Konkretne cele opcjonalnego przetwarzania na tej stronie.',
  privacyPolicyUrl: '/polityka-prywatnosci',
  services: [{
    id: 'video', name: 'Dostawca filmu',
    description: 'Konkretny cel i zakres integracji, w tym przekazywane dane.',
    privacyUrl: 'https://video.example/privacy',
    retention: 'Rzeczywisty okres lub kryteria usunięcia danych — po weryfikacji.',
    urls: ['https://video.example/'],
    cleanup: {cookies: ['video_session'], localStorage: ['video-id']},
  }],
};
// Te dane są wzorem konfiguracji, nie gotową polityką konkretnej witryny.
const headers = consentCspHeaders({noticeVersion, services: {
  video: {'frame-src': ['https://video.example']},
}}, request.headers.get('cookie') || '');
```

Dla usług z katalogu można ustawić `serviceDisclosures[id]` z polami
`description`, `privacyUrl`, `retention` i opcjonalnym `cleanup`, bez powielania
reguł rozpoznawania URL. Dotychczasowe `scripts.analytics` / `scripts.marketing`
wymagają teraz `service` w każdym skrypcie; wykonanie wymaga zarówno zgody na
kategorię, jak i daną usługę. API `setServiceConsent` wywołuj w odpowiedzi na
świadomy wybór użytkownika, a nie podczas automatycznego startu aplikacji.

## Zapis decyzji i dowody

Przeglądarka zachowuje jeden aktualny rekord: losowy identyfikator decyzji, czas,
kategorie, wybory dostawców, wersję i kopię pokazanych informacji. `getConsentReceipt()`
i zdarzenie `cb:consent-receipt` udostępniają go integratorowi. Rekord może służyć
powiązaniu decyzji z procesami własnego backendu; nie należy wysyłać dodatkowych
identyfikatorów dostawcom bez potrzeby i odpowiedniej informacji.

WordPress zapisuje minimalną kopię decyzji i wersjonowane informacje po stronie
serwera, z czasem serwera i hashem runtime. Nie zapisuje w tym rekordzie IP,
user-agenta ani trwałego identyfikatora odwiedzającego. Powtórzenie ID nie zmienia
istniejącego dowodu. Krótkotrwały, solony skrót adresu służy osobno do ograniczania
nadużyć endpointu i wygasa po minucie. Zapis nie jest podpisem użytkownika ani
potwierdzeniem jego tożsamości.

- `GET /wp-json/cookie4/v1/consent-receipts?offset=0`: eksport dla administratora,
  100 pozycji na stronę, `nextOffset` wskazuje kolejną partię; wymaga zwykłego
  uwierzytelnienia WordPress REST. Panel Diagnostics eksportuje ostatnie 100.
- `POST` tego endpointu przyjmuje aktualną wersję i ściśle sprawdzone wybory;
  wymaga nonce. Brak uprawnienia nie daje dostępu do eksportu.
- Hook `cookie4_consent_recorded` pozwala administratorowi integrować własną
  retencję lub archiwum. `cb:receipt-error` sygnalizuje klientowi błąd wysyłki;
  lokalny pełny rekord pozostaje dostępny dla integratora.
- Domyślna ważność wyboru i retencja dowodów wynoszą 180 dni. To ustawienie
  produktu, nie uniwersalny termin ustawowy. Backendowy filtr
  `cookie4_receipt_retention_days` pozwala ustalić 1–365 dni. Zasady retencji
  muszą być opisane przez administratora. Usuwanie wykonuje też dzienny WP-Cron;
  przy wyłączonym WP-Cron trzeba zapewnić jego uruchamianie na serwerze.

## Wycofanie i ograniczenia techniczne

Wycofanie natychmiast zaostrza CSP bieżącego dokumentu przed wywołaniem SDK
i przeładowaniem, żeby zatrzymać także pingi consent-update i pagehide. Następnie
aktualizuje decyzję, wyłącza elementy korzystające z subskrypcji,
wysyła sygnały cofnięcia do używanego mechanizmu GTM/Meta i przeładowuje dokument
z odmawiającym CSP. Zmiana w innej karcie również odświeża politykę. Stary grant
serwerowy jest usuwany przed zmianami localStorage, aby inna karta nie odświeżyła
się ze starym zezwoleniem. Przywrócenie strony z bfcache odświeża ścisłe CSP. Zmiana wersji informacji
podczas ponownej inicjalizacji nawigacji klientowej również wymusza nowy dokument.

Usuwane są tylko jawnie wskazane identyfikatory first-party. WordPress korzysta
z nazw cookies sklasyfikowanych przez istniejący skaner jako analityczne lub
marketingowe; należy zweryfikować tę klasyfikację. npm ma `cleanup` per dostawca
oraz `categoryCleanup`. Nie usuwamy koszyka ani sesji strony „na wszelki wypadek”.
HttpOnly i dane u dostawcy wymagają odpowiedniej obsługi serwera/dostawcy;
przeglądarkowy JS nie ma uprawnień do ich dowolnego kasowania. Żądań już
rozpoczętych przed wycofaniem nie da się cofnąć; aktywność obcego dokumentu iframe
pozostaje ograniczeniem opisanym poniżej.

Polityka CSP kontroluje żądania dokumentu strony, nie całą wewnętrzną aktywność
zdalnego dokumentu iframe. Zgoda na osadzenie musi uwzględniać przetwarzanie tego
dostawcy. Lokalne iframe i workery są domyślnie zablokowane, ponieważ ich własne dokumenty
nie muszą dziedziczyć reguł sieciowych rodzica. Jawnie dopuszczone niezbędne
workery lub ramki wymagają właściwych nagłówków także na ich odpowiedziach.
Tracking first-party, proxy, backend, konfiguracja GTM, transfery poza
EOG, rzeczywiste cele i pełny obowiązek informacyjny wymagają oceny konkretnej
witryny. Kolory HEX z panelu dostają korektę kontrastu; zaawansowane kolory CSS
podane w integracji własnej trzeba zweryfikować w jej rzeczywistym otoczeniu.

Nie da się rzetelnie zamienić tych testów w gwarancję „100% zgodności każdej
strony z RODO”. Podstawy: [PKE art. 399–400](https://eli.gov.pl/api/acts/DU/2024/1221/text.html),
[RODO art. 4, 7, 12–13, 25 i rozdział V](https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX:32016R0679),
[raport EROD o bannerach](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf).

### Styl przycisków

WordPress: **Banner & texts → Consent button style**. Standardowy oznacza
wypełnioną akceptację i obrysowaną odmowę; ścisły oznacza identyczne przyciski
decyzji. Zapis preferencji ma neutralny styl. Ustawienie zmienia tylko wygląd,
nie blokowanie, CSP ani wymagania zgody. Nazwy trybów nie stanowią oceny prawnej.
W npm domyślną wartością `buttonStyle` jest `standard`. W WordPressie domyślną
wartością jest `equal`.
