# Dostępność — weryfikacja 2026-11-07

Zakres: wspólny interfejs npm/WordPress — baner, preferencje, blokery YouTube i zwykłych iframe’ów — oraz panel administracyjny WordPressa. Raport nie jest deklaracją zgodności całej witryny z WCAG 2.2 AA.

## Poprawki

- Kontrast powierzchni preferencji w ciemnym motywie.
- Nazwy okien, Escape i nazwany przycisk zamknięcia w dziesięciu językach; zamknięcie nie zapisuje zgody.
- Inert tła, również dynamicznie dodanych elementów body; przywracanie fokusu bez przejmowania go po następnej akcji użytkownika.
- Tab i Shift+Tab obejmują wszystkie kontrolki okna, także przy ograniczonej systemowej tabulacji WebKit.
- Pasek pozostawia miejsce na końcu strony i odsłania element z fokusem; w krótkim oknie ma własne przewijanie.
- Po aktywacji bloker przekazuje fokus do filmu/iframe’u. Błąd zapisu zgody pozostawia treść zablokowaną i jest ogłaszany przez role=alert.
- Blokery mają widoczny fokus i cele summary/linków co najmniej 24 px; przyciski mają co najmniej 44 px. Minimum AA wynosi 24 px lub spełnienie przewidzianych wyjątków, nie 44 px dla każdego elementu.
- Obsługa reduced-motion i forced-colors; trwałe powiadomienia panelu z rolami status/alert i ręcznym zamykaniem.

## Wyniki

Chromium, Firefox i WebKit, axe-core 4.14.0, reguły wcag2a/wcag2aa/wcag21aa/wcag22aa. Po 40 analiz w każdym silniku: 2 warianty × 2 motywy (także ciemne tło strony) × 2 szerokości (320/1280 CSS px) × 5 stanów:

1. baner;
2. preferencje;
3. zablokowany film i iframe;
4. załadowane osadzenia;
5. blokery po cofnięciu zgody i przeładowaniu.

Dodatkowo błąd zapisu zgody i niepełna konfiguracja prywatności w każdym silniku oraz emulacja forced-colors w Chromium: razem **127 analiz**, bez automatycznie wykrytych naruszeń. Wyniki `*-results.json` zachowują pozycje incomplete wymagające ręcznej oceny; brak violations nie oznacza automatycznego zaliczenia każdego kryterium.

Asercje funkcjonalne sprawdzają: brak żądań do dostawców przed zgodą, działające osadzenia po indywidualnej zgodzie, ponowną blokadę bez nowych żądań po cofnięciu, fokus po aktywacji, rozwijanie szczegółów klawiaturą, obieg Tab/Shift+Tab, Escape, inert, powrót do przycisku otwierającego, brak zapisu zgody przy zamknięciu, zasłanianie ostatniego odnośnika, zwiększone odstępy tekstu i dostępność zamknięcia przy wysokości 320 px. Sprawdzane są również nazwy/role w drzewie dostępności oraz wymiary przycisku i summary blokera.

Sześć zakładek na lokalnym WordPressie przeszło wcześniejszy test axe bez naruszeń w obszarze naszej aplikacji (`wordpress-admin-results.json`). Nie dotyczy to interfejsów obcych wtyczek ani reszty panelu.

## Powtarzanie

```sh
bun run build:banner
bun run test:accessibility
TEST_BROWSER=firefox bun run test:accessibility
TEST_BROWSER=webkit bun run test:accessibility
```

Przeglądarki: `bunx playwright install firefox webkit`; Chromium domyślnie korzysta z Chrome na macOS, CHROME_PATH pozwala podać inną ścieżkę. ACCESSIBILITY_REPORT wskazuje wynik JSON; domyślnie jest w katalogu tymczasowym. Test blokuje rzeczywisty ruch do dostawców i po zgodzie podstawia kontrolowane, dostępne dokumenty testowe. Potwierdza mechanizm ładowania, **nie dostępność prawdziwego odtwarzacza YouTube lub obcego widżetu**. Npm i WordPress używają tego samego kodu blokera i banera.

## Granice oceny

Nie wykonano sesji odsłuchowej VoiceOver/NVDA, testu wydania Safari (WebKit jest osobnym silnikiem testowym), rzeczywistego systemowego trybu wysokiego kontrastu ani wszystkich kombinacji własnych tekstów, kolorów i motywów. Emulacja forced-colors nie zastępuje testu ustawień systemu. Szerokość 320 CSS px i zmiana odstępów sprawdzają reflow, ale nie zastępują pełnego testu rzeczywistego zoomu przeglądarki/systemu.

Ręcznego potwierdzenia w docelowej witrynie nadal wymagają interpretacja komunikatów przez czytnik ekranu, czytelność treści, kontrast pozycji incomplete, zachowanie faktycznych filmów/iframe’ów oraz napisy i audiodeskrypcja. Strona osadzająca odpowiada także za tytuły iframe’ów, dostępność motywu i treści dostawców. Dlatego wynik brzmi: **testy wskazanego zakresu przeszły; pełna deklaracja zgodności WCAG 2.2 AA pozostaje niepotwierdzona**.

Źródła: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [okna modalne APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [fokus niezasłonięty](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum), [minimalny rozmiar celu](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum).
