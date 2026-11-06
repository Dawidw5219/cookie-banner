# Przegląd designu panelu Cookie Banner

Data: 2026-11-06. Zakres: sześć zakładek, stany z danymi i bez danych, formularze, import, edycja kolorów, własne teksty, błędy i widoki mobilne.

## Wzorzec

Porównano kod i zrzuty lokalnej kopii repozytorium `slominskiwiktor/wcag-2-2-audio-player-for-articles` (HEAD `16b8b6c5`), w szczególności:

- `plugin/admin/admin-page-renderer.php`: nagłówek, kafelki statystyk, ikony i monochromatyczne akcenty.
- `plugin/admin/templates/settings/sections/player-branding-section.php` oraz `privacy-section.php`: karty, opisy, przełączniki, formularze, dokumentacja.
- `plugin/assets/admin/admin-compiled.css`: rzeczywiste reguły `.aat-privacy-switch`, `.aat-cookie-table`, `.aat-privacy-code`.
- `wordpress-org/screenshot-2.png`, `screenshot-3.png`, `screenshot-4.png`: wygląd ustawień, okna nagrań i sekcji prywatności.

Wspólna skala: nagłówki kart 18/28 px i waga 600, tekst i etykiety 14 px, pola wysokości 48 px, obramowania `#e5e7eb` / `#d1d5db`, karty z promieniem 16 px, pola i przyciski 8 px, granat `#111827`, pomocniczy tekst `#4b5563`, białe powierzchnie oraz jasne tła kodu. Przełącznik ma 44×24 px i uchwyt 20 px. Tabele mają obramowanie, nagłówek na `#f9fafb`, odstępy 12 px i własny obszar przewijania. Kolorowe statusy służą wynikom i ostrzeżeniom.

## Ocena sekcja po sekcji

| Sekcja | Problem poprzedniej wersji | Wprowadzona korekta i sprawdzenie |
| --- | --- | --- |
| Nagłówek i nawigacja | Różne rozmiary tekstu, niski kontrast przejściowych kolorów po kliknięciu, nierówne wyrównanie na telefonie. | Jedna typografia, stały kontrast aktywnej zakładki, wyrównane ikony i etykiety, pełne nazwy zawijane wewnątrz przycisku. |
| Overview | Kafelki nie korzystały z jednej skali; przycisk obok checklisty ściskał tekst na telefonie; szare numery miały kontrast 4,39:1. | Wspólny StatCard, ciemne ikony, liczby 30 px, poprawiony kontrast, przyciski pod opisami na telefonie. Sprawdzono rzeczywiste wartości i częściowo ukończoną checklistę. |
| Banner & texts | Pola i opisy miały różne rozmiary; przełączniki nie odwzorowywały układu audio; komunikat o niezapisanym stanie miał kontrast 3,2:1. | Pola 48 px, etykiety i opisy 14 px, poprawne przełączniki z opisem pod całą szerokością, czytelny status niezapisanych zmian, fieldsety własnych tekstów. Picker sprawdzono z poprawnym i błędnym HEX oraz klawiaturą. |
| Live Preview | Brak wyraźnego stanu błędu; screen mógł pokazywać poprzedni kolor albo pusty iframe. | Widoczny stan ładowania i ponowienie po błędzie. Aktualizacje mają identyfikator: starsza odpowiedź nie oznacza gotowości nowego podglądu. Ta sama konfiguracja nie jest wysyłana dwukrotnie. Sprawdzono kolor rzeczywistego przycisku w sandboxie po edycji. |
| Services | Inny pusty stan, nierówne opisy i identyfikatory, przycisk dodawania rozciągnięty przez grid. Błąd odczytu udawał pustą listę i pozwalał zapisać nową. | Wspólne karty i pusty stan; kontrolowane łamanie nazw, adresów i identyfikatorów; przycisk o szerokości treści. Odrębny błąd z ponowieniem; zapis zablokowany do pierwszego udanego pobrania istniejących usług. Sprawdzono ponowne odblokowanie po poprawnym odczycie. |
| Cookies & scan | Nagłówki skanera i usług miały inny układ, przypadkowa tęcza statystyk, jaskrawy przycisk audytu i drobne opisy. Testy pustej tabeli nie ujawniały ucinania danych. | Wspólny Card z akcjami, monochromatyczne kafelki, standardowy przycisk audytu, semantyczne wyniki audytu, wspólny pusty stan. Tabela sprawdzona z różnymi źródłami, kategorią wymagającą sprawdzenia, długą nazwą oraz pustym wynikiem filtrów. Przewijanie pozostaje wewnątrz tabeli. |
| Import | Osobny styl przycisków i filtrów, brak natywnego modalnego fokusu, wyblakłe niezaznaczone wiersze i ściskana stopka na telefonie. | Natywny dialog, wspólne przyciski i segmenty, czytelne wiersze, zaznaczanie pozycji, przewijana tabela, elastyczna stopka, Escape i zachowanie wyboru po błędzie importu. |
| WordPress integration | Ciemne bloki kodu odbiegały od dokumentacji audio i wcześniej były nadpisywane przez WordPress. | Jasne bloki kodu z ciemnym tekstem, spójne opisy i przyciski kopiowania. Zawijanie kodu nie zmienia kopiowanej wartości. Sprawdzono zawartość schowka. |
| Diagnostics | Niespójne kafelki i małe metadane; rozwinięte nagłówki odpowiedzi nie miały wspólnego stylu dokumentacji. | Siatka opisów o wspólnej skali, standardowe przyciski, semantyczne wyniki i rozwijane szczegóły w stylu prywatności audio. Sprawdzono rzeczywiste nagłówki odpowiedzi lokalnego WordPressa i ich zawijanie. |

## Dowody i granice weryfikacji

- `scripts/test-wordpress-admin-design.mjs` uruchamia faktyczne, skompilowane zasoby panelu w lokalnym WordPressie z jego stylami oraz aktywnym Elementorem i WP Rocket. Przykładowe cookies, dostawcy i usługi są podstawiane wyłącznie w odpowiedziach przeglądarki przez `scripts/fixtures/admin-design.mjs`; nie zapisuje ich do bazy WordPressa.
- Dla wszystkich sześciu zakładek sprawdzono szerokości 320, 390, 768, 1024 i 1440 px: brak przewijania całej strony w poziomie, rozmiary pól i nagłówków, kontrast widocznych tekstów. Wykonano także ręczny przegląd zrzutów. Automatyczny pomiar kontrastu nie jest pełnym audytem WCAG.
- Sprawdzono klawiaturę przełącznika i pickera, walidację HEX, powrót fokusu, filtrowanie tabeli, wybór pozycji importu, nieudany import, kopiowanie shortcode'u, własne teksty, błąd i ponowienie podglądu oraz odczytu usług.
- `scripts/test-wordpress-admin.mjs`: 10 scenariuszy na rzeczywistym API WordPressa, m.in. zapis i zachowanie szkiców, dodanie usługi, sandbox podglądu i kontrola nagłówków. `scripts/test-wordpress-admin-backend.php`: 16 kontroli backendu. Tymczasowa konfiguracja jest przywracana.
- 55 testów projektu, typy aplikacji i panelu, build wtyczki oraz składnia PHP podglądu zostały sprawdzone.
- Wynik automatycznej kontroli designu: `admin-design-results.json`. Aktualne zrzuty: `../screenshots/admin-reviewed/`. Mobilny edytor i rzeczywisty widoczny podgląd są zapisane osobno jako `mobile-appearance.png` i `mobile-preview.png`: Chromium pomija rysowanie iframe poza widocznym obszarem w pełnostronicowym zrzucie. Nie pokazujemy tego jako pustego działającego podglądu.

Kod i materiały w tym przeglądzie stanowią podstawę wydania 1.4.1; publikacja npm odbywa się oddzielnie.

## Dopracowanie podglądu przed wydaniem 1.4.1

Podgląd ma ramę okna, odseparowane tło makiety i spójny pasek zgód. Przyciski mają wspólną wysokość i typografię; odmowa jest czytelnym przyciskiem z obramowaniem. W dziesięciu językach wprowadzenie do polityki jest dodawane tylko przy skonfigurowanym linku, bez urwanego ani zdublowanego zdania. Potwierdzają to testy renderowanego opisu i linków.

Menu dopasowuje szerokość do przycisków. Last Scan pokazuje datę w jednej linii, zachowując pełną wartość w tytule. `scripts/test-wordpress-admin-layout.mjs` mierzy rzeczywistą szerokość iframe i dokumentu wewnątrz, niewykorzystane miejsce menu oraz liczbę linii daty przy 320–1440 px. Kontrola mutacyjna potwierdziła, że przywrócenie nadmiernej szerokości menu powoduje niepowodzenie testu. Zrzuty detali znajdują się w `../screenshots/admin-layout/`.
