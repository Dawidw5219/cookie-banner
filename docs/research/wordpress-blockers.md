# Mechanizmy blokowania w publicznych wtyczkach WordPress

Data badania: 2026-11-06. Analiza statyczna pobranych, wersjonowanych paczek z downloads.wordpress.org. Nie uruchamiano obcego kodu. Przejrzano 17 publicznych paczek. Nie jest to twierdzenie o analizie wszystkich pluginów: wyszukiwanie katalogu dla „cookie consent” zwróciło 1569 wyników, także niezwiązane bezpośrednio z CMP. Prywatne edycje premium (np. Borlabs) i zamknięte silniki CDN pozostają poza analizą źródłową.

Wystąpienia nazw API w bundlach bibliotek nie były traktowane jako dowód działania blockera. Rozróżniono ścieżki aktywne, legacy i kod zakomentowany.

## complianz-gdpr 7.5.7

PHP output buffer + integracje usług/wtyczek; neutralizacja skryptów inline, src iframe i style. Integracje potrafią usunąć cudzy callback z wp_head i wykonać go po zgodzie.

Dobry wzorzec: warstwa całego HTML i precyzyjne adaptery. Sam script_loader_tag występuje też w kodzie ładowania CMP — nie każdy taki filtr jest blockerem.

Źródła: [class-cookie-blocker.php](https://plugins.trac.wordpress.org/browser/complianz-gdpr/tags/7.5.7/class-cookie-blocker.php), [integrations/plugins/monsterinsights.php](https://plugins.trac.wordpress.org/browser/complianz-gdpr/tags/7.5.7/integrations/plugins/monsterinsights.php); [paczka](https://downloads.wordpress.org/plugin/complianz-gdpr.7.5.7.zip).

## cookie-law-info 3.5.8

CookieYes Lite przechwytuje document.createElement dla skryptów, definiuje src/type/setAttribute na utworzonym elemencie i dodaje MutationObserver. Starszy wariant legacy ma PHP output buffer. Tryb połączony korzysta z usługi zewnętrznej.

Nie łączyć mechanizmów legacy i lite w jedną rzekomo zawsze aktywną ścieżkę. Observer nie jest dowodem zatrzymania pierwszego żądania.

Źródła: [lite/frontend/js/script.js](https://plugins.trac.wordpress.org/browser/cookie-law-info/tags/3.5.8/lite/frontend/js/script.js), [legacy/public/modules/script-blocker/script-blocker.php](https://plugins.trac.wordpress.org/browser/cookie-law-info/tags/3.5.8/legacy/public/modules/script-blocker/script-blocker.php); [paczka](https://downloads.wordpress.org/plugin/cookie-law-info.3.5.8.zip).

## cookie-notice 3.1.18

Własny stan zgody i warunkowo emitowany kod wpisany do konfiguracji; adaptery modułów (np. Gravity Forms). Integracja Cookie Compliance jest odrębną ścieżką.

Nie znalazłem w przejrzanej bezpłatnej ścieżce ogólnego PHP blockera wszystkich obcych zasobów. Polyfill Element.prototype.classList nie jest blockerem.

Źródła: [includes/frontend.php](https://plugins.trac.wordpress.org/browser/cookie-notice/tags/3.1.18/includes/frontend.php), [includes/modules/gravity-forms/consent-defer.js](https://plugins.trac.wordpress.org/browser/cookie-notice/tags/3.1.18/includes/modules/gravity-forms/consent-defer.js); [paczka](https://downloads.wordpress.org/plugin/cookie-notice.3.1.18.zip).

## cookieadmin 1.2.6

template_redirect uruchamia ob_start; parser przechodzi po skryptach i wiąże je ze sklasyfikowanymi cookies. Klient przywraca skrypty po zgodzie.

Catch Throwable zwraca oryginalny HTML: awaria nie psuje strony, ale nie gwarantuje prywatności. Blokowanie wymaga danych klasyfikacji.

Źródła: [includes/enduser.php](https://plugins.trac.wordpress.org/browser/cookieadmin/tags/1.2.6/includes/enduser.php), [assets/js/consent.js](https://plugins.trac.wordpress.org/browser/cookieadmin/tags/1.2.6/assets/js/consent.js); [paczka](https://downloads.wordpress.org/plugin/cookieadmin.1.2.6.zip).

## gdpr-cookie-compliance 5.3.1

Kod usług przypisany do kategorii i kontrolowane uruchamianie przez frontend; osobne integracje Google/Clarity/Meta oraz mechanizm blokowanej treści.

Kontrola własnych integracji nie oznacza przechwycenia dowolnego skryptu wydrukowanego przez inny plugin. Ustawienia Consent Mode wpływają na żądania przed zgodą.

Źródła: [class-moove-gdpr-content.php](https://plugins.trac.wordpress.org/browser/gdpr-cookie-compliance/tags/5.3.1/class-moove-gdpr-content.php), [assets/scripts/main.js](https://plugins.trac.wordpress.org/browser/gdpr-cookie-compliance/tags/5.3.1/assets/scripts/main.js); [paczka](https://downloads.wordpress.org/plugin/gdpr-cookie-compliance.5.3.1.zip).

## wp-consent-api 2.1.0

Standard odczytu/ustawiania kategorii zgód i powiadamiania współpracujących pluginów.

To kontrakt integracyjny, a nie autonomiczny blocker dowolnego HTML. Inny plugin musi respektować API.

Źródła: [wp-consent-api.php](https://plugins.trac.wordpress.org/browser/wp-consent-api/tags/2.1.0/wp-consent-api.php), [inc/api-functions.php](https://plugins.trac.wordpress.org/browser/wp-consent-api/tags/2.1.0/inc/api-functions.php); [paczka](https://downloads.wordpress.org/plugin/wp-consent-api.2.1.0.zip).

## wpconsent-cookies-banner-privacy-suite 1.2.0

template_redirect + shutdown + ob_start; wykrywa skrypty/iframe według kategorii, przepisuje znaczniki i wstawia placeholdery wybranym selektorom.

Warto przejąć przypisywanie placeholdera do komponentu/selektora. Wyjątki Google Consent Mode wymagają świadomego ustawienia.

Źródła: [includes/class-wpconsent-cookie-blocking.php](https://plugins.trac.wordpress.org/browser/wpconsent-cookies-banner-privacy-suite/tags/1.2.0/includes/class-wpconsent-cookie-blocking.php), [includes/class-wpconsent-script-blocker.php](https://plugins.trac.wordpress.org/browser/wpconsent-cookies-banner-privacy-suite/tags/1.2.0/includes/class-wpconsent-script-blocker.php); [paczka](https://downloads.wordpress.org/plugin/wpconsent-cookies-banner-privacy-suite.1.2.0.zip).

## iubenda-cookie-law-solution 3.13.7

Buforowanie HTML i silnik reguł w PHP; neutralizacja skryptów do text/plain, integracje i zewnętrzny runtime CMP.

Można sprawdzić warstwę WP, ale kod i konfiguracja usługi zewnętrznej nie są w całości częścią tej paczki.

Źródła: [iubenda_cookie_solution.php](https://plugins.trac.wordpress.org/browser/iubenda-cookie-law-solution/tags/3.13.7/iubenda_cookie_solution.php), [iubenda-cookie-class/iubenda.class.php](https://plugins.trac.wordpress.org/browser/iubenda-cookie-law-solution/tags/3.13.7/iubenda-cookie-class/iubenda.class.php); [paczka](https://downloads.wordpress.org/plugin/iubenda-cookie-law-solution.3.13.7.zip).

## real-cookie-banner 5.4.0

Buforowanie od plugins_loaded oraz init, centralny HeadlessContentBlocker z matcherami/adapterami; reguły blockables, ekstrakcja URL z inline przy skanowaniu i deduplikacja przetwarzanej odpowiedzi.

Dobry wzorzec: jeden silnik dla skanera i blokera oraz odporność na wielokrotne przetwarzanie fragmentów. Przejrzano publiczną edycję, nie prywatny kod PRO.

Źródła: [inc/view/Blocker.php](https://plugins.trac.wordpress.org/browser/real-cookie-banner/tags/5.4.0/inc/view/Blocker.php), [inc/Core.php](https://plugins.trac.wordpress.org/browser/real-cookie-banner/tags/5.4.0/inc/Core.php); [paczka](https://downloads.wordpress.org/plugin/real-cookie-banner.5.4.0.zip).

## cookiebot 4.7.5

Wczesne wp_head dla runtime, adaptery script_loader_tag oraz Buffer_Output_Tag dla HTML wypisywanego przez integracje. Ogólny auto-blocker i instrukcje skanowania dostarcza Cookiebot z CDN.

Nie można z samej paczki WP twierdzić, że przejrzano pełen silnik usługi. Wymagana poprawna kolejność i aktualny skan.

Źródła: [src/lib/Cookiebot_Javascript_Helper.php](https://plugins.trac.wordpress.org/browser/cookiebot/tags/4.7.5/src/lib/Cookiebot_Javascript_Helper.php), [src/lib/buffer/Buffer_Output_Tag.php](https://plugins.trac.wordpress.org/browser/cookiebot/tags/4.7.5/src/lib/buffer/Buffer_Output_Tag.php); [paczka](https://downloads.wordpress.org/plugin/cookiebot.4.7.5.zip).

## surecookie 1.8.0

PHP blocker + DOM guard wstrzykiwany na sam początek gotowego head. Guard przechwytuje natywne settery script.src, iframe.src, link.href, link.rel i Element.setAttribute; współdzieli reguły z PHP.

Najbardziej bezpośrednio pasujący wzorzec dodatkowej ochrony przed kodem page builderów i lazy loaderów. Ma wyłącznik kompatybilności; nie opiera się wyłącznie na observerze.

Źródła: [inc/modules/script-blocking/dom-guard.php](https://plugins.trac.wordpress.org/browser/surecookie/tags/1.8.0/inc/modules/script-blocking/dom-guard.php), [build/dom-guard.js](https://plugins.trac.wordpress.org/browser/surecookie/tags/1.8.0/build/dom-guard.js); [paczka](https://downloads.wordpress.org/plugin/surecookie.1.8.0.zip).

## uk-cookie-consent 3.3.1

Aktualna edycja integruje Termly: emituje konfigurację i zewnętrzny runtime z wp_head.

Publiczna paczka pokazuje loader, nie pełny silnik Termly. Nie przypisuję jej niezweryfikowanego lokalnego algorytmu.

Źródła: [includes/controllers/class-frontend.php](https://plugins.trac.wordpress.org/browser/uk-cookie-consent/tags/3.3.1/includes/controllers/class-frontend.php), [includes/controllers/class-frontend.php](https://plugins.trac.wordpress.org/browser/uk-cookie-consent/tags/3.3.1/includes/controllers/class-frontend.php); [paczka](https://downloads.wordpress.org/plugin/uk-cookie-consent.3.3.1.zip).

## cookiez 0.0.12

PHP WP_HTML_Tag_Processor w buforze; wzorce plików i inline, kategorie/tryby, text/plain i data-cc-src. Osobny fallback w head korzysta z MutationObserver.

Dobry przykład parsera WP i wspólnych reguł. Fallback obserwujący dodane węzły nie daje samodzielnej gwarancji zatrzymania requestu.

Źródła: [modules/banner/components/script-blocker.php](https://plugins.trac.wordpress.org/browser/cookiez/tags/0.0.12/modules/banner/components/script-blocker.php), [modules/banner/components/script-blocker-fallback.php](https://plugins.trac.wordpress.org/browser/cookiez/tags/0.0.12/modules/banner/components/script-blocker-fallback.php); [paczka](https://downloads.wordpress.org/plugin/cookiez.0.0.12.zip).

## beautiful-and-responsive-cookie-consent 4.9.2

Filtry script_loader_tag i style_loader_tag, wczesna inicjalizacja dataLayer przez wp_print_scripts; integracje i atrybuty usług.

Filtr enqueue nie obejmie każdego surowego echo. Same wystąpienia MutationObserver w bibliotekach admina nie są dowodem auto-blockingu.

Źródła: [nsc_bar-cookie-consent.php](https://plugins.trac.wordpress.org/browser/beautiful-and-responsive-cookie-consent/tags/4.9.2/nsc_bar-cookie-consent.php), [nsc_bar-cookie-consent.php](https://plugins.trac.wordpress.org/browser/beautiful-and-responsive-cookie-consent/tags/4.9.2/nsc_bar-cookie-consent.php); [paczka](https://downloads.wordpress.org/plugin/beautiful-and-responsive-cookie-consent.4.9.2.zip).

## tarteaucitronjs 1.35.0

Ładuje zewnętrzny CMP, a część osadzeń filmów zamienia na puste divy z identyfikatorem filmu i kolejką tarteaucitron.job.

Bardzo dobry wzorzec dla wideo: przed zgodą w HTML nie istnieje iframe dostawcy. Publiczny plugin jest także adapterem usługi PRO; nie jest pełnym źródłem jej runtime.

Źródła: [tarteaucitron.php](https://plugins.trac.wordpress.org/browser/tarteaucitronjs/tags/1.35.0/tarteaucitron.php), [tarteaucitron.php](https://plugins.trac.wordpress.org/browser/tarteaucitronjs/tags/1.35.0/tarteaucitron.php); [paczka](https://downloads.wordpress.org/plugin/tarteaucitronjs.zip).

## consent-manager 3.1.2

Automatyczny blocker CDN w wp_head z priorytetem -9999; tryb półautomatyczny przez wp_print_scripts.

Kod zawiera historyczną ścieżkę server-side blocking, ale jest zakomentowana z powodu wydajności. Nie należy raportować jej jako aktywnej funkcji.

Źródła: [consentmanager.php](https://plugins.trac.wordpress.org/browser/consent-manager/tags/3.1.2/consentmanager.php), [ConsentManagerMain.php](https://plugins.trac.wordpress.org/browser/consent-manager/tags/3.1.2/ConsentManagerMain.php); [paczka](https://downloads.wordpress.org/plugin/consent-manager.3.1.2.zip).

## gdpr-cookie-consent 4.5.0

Wczesny consent core, PHP output buffer; JS przechwytuje src skryptów, iframe, img, embed, srcset obrazów oraz script.type i setAttribute; dodatkowo observer i obsługa cookies.

Dobry wzorzec wielu powierzchni blokowania i ochrony type przed ponownym nadpisaniem. Przechwytywanie document.cookie nie cofnie połączenia ani Set-Cookie z serwera.

Źródła: [public/modules/script-blocker/classes/class-wpl-cookie-consent-script-blocker-frontend.php](https://plugins.trac.wordpress.org/browser/gdpr-cookie-consent/tags/4.5.0/public/modules/script-blocker/classes/class-wpl-cookie-consent-script-blocker-frontend.php), [public/js/gdpr-cookie-consent-core.js](https://plugins.trac.wordpress.org/browser/gdpr-cookie-consent/tags/4.5.0/public/js/gdpr-cookie-consent-core.js); [paczka](https://downloads.wordpress.org/plugin/gdpr-cookie-consent.4.5.0.zip).

## Wybór dla naszego projektu

1. Npm / kod własnej strony: jawne, bezpieczne w SSR atrybuty bez `src`, subskrypcja zgody przed montowaniem widgetu lub wykonaniem fetch, możliwość rejestracji własnej usługi i jej URL. Framework nie powinien montować komponentu powodującego request przed zgodą.
2. WordPress: wspólny rejestr dostawców i wyników skanowania; transformacja całej odpowiedzi HTML, także surowych echo i rozpoznanych inline loaderów. Parser WP zamiast wyrażeń regularnych do parsowania całego HTML.
3. Wczesny guard na początku head: przechwytywanie właściwości URL i atrybutów przed przekazaniem wartości do natywnych setterów oraz kontrola węzłów przed wstawieniem. To dodatkowa, testowana ochrona zgodności z obcym kodem, z wyłącznikiem integracyjnym.
4. Adaptery do hooków i producentów kodu: blokowanie inline powiązanego z enqueue, renderowanych bloków i oEmbed; możliwość własnych reguł. Nie usuwać globalnie cudzych callbacków bez znajomości odpowiedzialności.
5. Google Basic Consent Mode: brak ładowania tagów przy odmowie. Samo `denied` z załadowanym tagiem w trybie Advanced nie oznacza braku pingów.
6. Audyt w istniejącym skanerze: zasób zadeklarowany / zablokowany to inny dowód niż żądanie zaobserwowane w sieci. Brak żądania w jednym audycie nie jest certyfikatem całej witryny.

## Granice

Observer DOM uruchamia się po zmianie. Nie stanowi granicy bezpieczeństwa dla pierwszego requestu. Guard JavaScript nie pokrywa automatycznie wszystkich API, Workerów, rozszerzeń, obcych realmów, nawigacji, Early Hints ani odpowiedzi cache pomijającej plugin. Nieznany cel przetwarzania nie może być wywnioskowany niezawodnie z samej nazwy domeny. Szablony, cache, optymalizatory, mixed bundles i już aktywne skrypty wymagają testów na konkretnej witrynie.

## Dokumentacja porównawcza

- [Cookiebot: auto-blocking](https://support.cookiebot.com/hc/en-us/articles/11438730619804-How-does-auto-blocking-work)
- [Complianz: integracje i Script Center](https://complianz.io/help/wordpress/configuration/integrating-plugins/)
- [Klaro: bezpieczny markup](https://klaro.org/docs/getting-started)
- [Google: Basic versus Advanced](https://developers.google.com/tag-platform/security/concepts/consent-mode)
