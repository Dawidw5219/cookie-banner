# Wielojęzyczność npm i WordPress

Interfejs bannera, preferencje, komunikaty walidacji i blokery mają wspólny słownik:
`en`, `pl`, `de`, `fr`, `es`, `it`, `nl`, `da`, `no`, `sv`.
Kody regionalne i WordPressowe są normalizowane (`de_DE` → `de-de`).
`nb` i `nn` korzystają z norweskiego `no`. Nieobsługiwany język korzysta z EN;
można dostarczyć kompletny własny słownik również dla innego języka.

## npm / Next.js

```ts
import { initializeConsent, resolveLocalizedConfig, consentCspHeaders } from '@app4you/cookie-banner/native';

const config = {
  mode: 'standalone' as const,
  lang: 'de-DE', // język bieżącej trasy; po stronie klienta także 'auto' z <html lang>
  noticeVersion: 'privacy-2026-11-07',
  controller: { name: 'Your actual legal controller' },
  purposes: 'Your reviewed source-language purposes',
  privacyPolicyUrl: '/privacy',
  serviceDisclosures: {
    youtube: { description: 'Your reviewed video purpose', privacyUrl: 'https://policies.google.com/privacy', retention: 'Your reviewed retention criteria' },
  },
  localizations: {
    de: {
      purposes: 'Geprüfte Zwecke dieser Website',
      privacyPolicyUrl: '/de/datenschutz',
      customTexts: {
        overlay: { title: 'Ihre Privatsphäre' },
        content: { allowPlay: 'Zustimmen und Video ansehen' },
      },
      serviceDisclosures: {
        youtube: { description: 'YouTube-Videos auf Ihren Wunsch anzeigen.', retention: 'Geprüfte Speicherdauer' },
      },
    },
    'de-DE': { cookiePolicyUrl: '/de/cookies' },
  },
};

// SERWER: nigdy nie zgaduj języka trasy na podstawie przeglądarki.
const resolved = resolveLocalizedConfig(config);
const headers = consentCspHeaders({
  noticeVersion: resolved.noticeVersion,
  lang: resolved.lang, // odrzuca sieciowy grant z innego języka PRZED parserem
  services: { youtube: { 'frame-src': ['https://www.youtube.com'] } },
}, request.headers.get('cookie') || '');

// KLIENT: przekazuj ten sam config. Skrót pokazuje wyłącznie mechanizm języków;
// pełne źródła CSP dobierz według docs/consent-integration.md.
const dispose = await initializeConsent({ ...config, strictCsp: true });
// Przy zmianie trasy wywołaj dispose(), a następnie initializeConsent z jej językiem.
```

Kolejność: tekst wbudowany → wspólne `customTexts` → wersja języka (`de`) →
wersja regionalna (`de-de`). Własne obiekty są scalane głęboko; obsługujemy również
klucze kropkowe (`content.allowPlay`). Puste tłumaczenie korzysta z fallbacku.
Tłumaczenia usług są nakładkami na istniejące ID, bez kopiowania reguł URL,
cleanup lub ustawień CSP. Użyj ich także dla usług własnych.

Przy zmianie języka w aplikacji SPA odtwórz klienta. W trybie strict zmiana języka
wymaga świeżego dokumentu, aby wymienić HTTP CSP. Na serwerze zawsze podawaj `lang`
w `consentCspHeaders`; samo JS nie cofnie żądania parsera dopuszczonego nagłówkiem.
Zmiana treści prawnych wymaga nowej `noticeVersion` po stronie serwera i klienta.

## WordPress

W **Banner & texts → Language versions** wybierz kod języka i wprowadź:

- administratora i cele;
- linki do polityk;
- teksty bannera, preferencji, blokerów i komunikatów;
- nazwę, opis celu, retencję i politykę dostawcy dla istniejących usług.

Zapisz przyciskiem **Save Settings**. Edytowany język jest widoczny również
w izolowanym podglądzie. Puste pola korzystają z treści wspólnej.

Tryb **Auto** używa: Polylang (`pll_current_language`) → WPML
(`wpml_current_language`) → język WordPressa. Ręczne ustawienie języka ma pierwszeństwo.
W WPML potrzebny jest moduł **String Translation** do tłumaczenia własnych ciągów;
bez niego nadal działają wbudowane słowniki i nasz edytor wersji językowych.

Nagłówki tabeli cookies, etykiety kategorii i domyślny link do preferencji
korzystają z tego samego słownika; generowany plik PHP JSON powstaje podczas builda.
Tekst cookie ze skanera można przetłumaczyć w tłumaczeniach ciągów WPML/Polylang;
przejrzane opisy usług z edytora również są stosowane w tabeli.

Własne ciągi są rejestrowane w grupie **Cookie Banner** w tłumaczeniach WPML/Polylang.
Odczyt używa `wpml_translate_single_string` lub `pll_translate_string`.
Strony polityk mapujemy przez `wpml_object_id` / `pll_get_post`.
Jawny link wpisany dla języka w naszym edytorze ma pierwszeństwo nad mapowaniem.
Nie zmieniamy tłumaczeniami technicznych ID, reguł blokowania ani nazw usuwanych cookies.

Wyświetlony język, informacje i linki wpływają na wersję dowodu i CSP. Zapis decyzji
REST przekazuje język strony niezależnie od języka domyślnego endpointu. Grant
z poprzedniego języka nie uruchamia dostawcy przed zgodą na nowej wersji strony.
HTML chroniony strict CSP nadal jest `private, no-store`.

Nie wykonujemy automatycznego tłumaczenia danych administratora, celów, retencji,
polityk ani treści strony. Ich poprawne wersje trzeba dostarczyć; brak konkretnego
wpisu stosuje opisany fallback, zamiast wymyślać informacje prawne.
