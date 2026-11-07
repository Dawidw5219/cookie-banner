# Weryfikacja wielojęzyczności

- npm: 10 języków w rzeczywistej przeglądarce, popup / preferencje / blokery,
  własne opisy usług, retencja, linki polityk, zmiana języka w SPA.
- Polylang 3.9.1: prawdziwa instalacja WordPressa, EN/PL/DE, przetłumaczone strony
  polityk oraz własne ciągi zapisane w Polylang. Brak żądań przed zgodą i po odmowie;
  po zgodzie interaktywny iframe. Grant EN nie odblokowuje treści na stronie PL.
- Panel: rzeczywisty edytor, zapis REST, niemiecki podgląd i strona publiczna.
- WPML: test kontraktów jego oficjalnych filtrów na prawdziwym WordPressie,
  rejestracja / odczyt ciągów, regionalne nakładki, walidacja i atomowy zapis.
  Nie wykonano testu z zainstalowaną płatną wtyczką WPML: brak lokalnej paczki.
- 86 testów jednostkowych, 4 testy słownika panelu, typecheck npm i panelu.
- 17 wcześniejszych scenariuszy ochrony zgód nadal przechodzi; NodeNext/Bundler
  sprawdzone na rzeczywiście spakowanym npm.
- Shortcode: nagłówki tabeli, kategorie, retencja sesyjna i link preferencji w 10 językach.

Wyniki: [npm](native-results.json), [Polylang](wordpress-results.json),
[panel](admin-results.json).

Środowisko lokalne: WP 7.1.4, PHP 8.5, SQLite, Twenty Twenty-Five; istniejące
Elementor i WP Rocket pozostawiono aktywne. Dla nowych stron Polylang zastosowano
zwykłe permalinki na lokalnym serwerze PHP. Usunięto strony i języki testowe,
przywrócono pierwotne opcje i permalinki oraz unieważniono tymczasową sesję administratora.
Polylang pozostaje zainstalowany i nieaktywny do ponowienia testów.

Źródła integracji:
- https://wpml.org/wpml-hook/wpml_translate_single_string/
- https://wpml.org/wpml-hook/wpml_object_id/
- https://wpml.org/documentation/support/wpml-coding-api/wpml-hooks-reference/
- https://polylang.pro/documentation/support/developers/developpers-how-to/

Własne informacje prawne nie są tłumaczone maszynowo: brak wpisu korzysta ze
wspólnej treści. W npm wielojęzyczny serwer musi przekazać locale do CSP zgodnie
z [instrukcją](../../multilingual.md).
