# Bezpieczny deployment i limity dowodów zgody

## Przesyłanie do WordPressa

Usunięto grunt-ftp-push i transport FTP. `grunt deploy` i `grunt dev:ssh` korzystają z rsync przez SSH; `grunt dev:ftp` jest wyłącznie aliasem do bezpiecznej ścieżki. Nie ma powrotu do zwykłego FTP. Wymagane są rsync, OpenSSH, klucz lub agent SSH i wcześniej zweryfikowany klucz serwera w known_hosts.

```dotenv
SSH_HOST=example.com
SSH_USER=deploy
SSH_PORT=22
SSH_WP_PLUGINS_FOLDER_PATH=/var/www/wp-content/plugins
```

Ścieżka musi być bezwzględna, bez spacji i metaznaków powłoki. Stare FTP_HOST/FTP_USERNAME/FTP_PASSWORD nie uruchomią transmisji. BatchMode i StrictHostKeyChecking=yes powodują zatrzymanie przy braku uwierzytelnienia lub nieznanym/zmienionym kluczu. Potwierdź fingerprint niezależnym kanałem przed dodaniem klucza — samo pobranie przez ssh-keyscan nie jest weryfikacją.

## WordPress.org SVN

SVN_USERNAME i SVN_PASSWORD nadal działają. SVN 1.10+ odczytuje hasło przez --password-from-stdin, hasło nie trafia do argv ani konfiguracji Grunta i jest usuwane ze środowiska procesu potomnego svn. Polecenia uwierzytelniane nie przechodzą przez sh -c. Weryfikacja certyfikatu pozostaje włączona, cache hasła jest wyłączony. Hasło zawierające CR/LF jest odrzucane — stdin wymaga pojedynczej linii. Nie wykonywano rzeczywistej publikacji do WordPress.org podczas testów.

## Publiczne dowody zgody

Kategorie muszą zawierać dokładnie essential=true, analytics=boolean i marketing=boolean. Inne pola kategorii, zagnieżdżone payloady i skalary są odrzucane. Limit body: 16 000 bajtów; pełny zapis z informacjami administratora: 16 384 bajty. Długie konfiguracje przekraczające ten limit zwracają 413 i wymagają skrócenia informacji.

Atomowe limity: 600 poprawnych żądań na minutę globalnie i 120 na minutę dla jednego z 256 stałych koszyków adresów. Koszyki mogą współdzielić limit; nie przechowują surowych adresów. Spóźnione żądanie nie może cofnąć okna czasu. Liczba liczników wynosi najwyżej 258 (capacity, minute, ip_0…ip_255).

Domyślny budżet to 10 000 dowodów, zmieniany filtrem cookie4_receipt_max_records (zakres 1–100 000). Przy wyczerpaniu nowe dowody zwracają 503, a już zapisany identyfikator pozostaje idempotentny. W tym momencie wykonywane jest także usuwanie przeterminowanych dowodów, niezależnie od WP-Cron. Retencja nadal korzysta z cookie4_receipt_retention_days (domyślnie 180 dni). Frontend nadal emituje cb:receipt-error przy nieudanym zapisie serwerowym; należy monitorować ten sygnał i pojemność na witrynach o większym ruchu. Odmowa i cofnięcie zgody nie zależą od dostępności archiwum.

Rezerwacja budżetu i zapis są jedną transakcją. Przerwanie procesu lub rollback nie zużywa miejsca. Usuwanie i zwalnianie budżetu również jest transakcyjne. Migracja przygotowuje licznik przed uruchomieniem nowej retencji; na MySQL wymaga InnoDB i w razie potrzeby konwertuje te dwie tabele. Przy błędzie migracji zapis jest odrzucany. Dotychczasowe dowody nie są przycinane ani usuwane z powodu samej migracji. Stare transients z poprzedniej wersji mogą pozostać do standardowego sprzątania WordPressa.

Testy lokalne: scripts/test-wordpress-consent-records.php, scripts/test-receipt-concurrency.php i scripts/test-deployment-security.cjs. Równoległość i transakcje sprawdzono na WordPressie z SQLite Database Integration oraz na prywatnym serwerze MariaDB 13.0.2/InnoDB (bez dostępu sieciowego). Sprawdzono również konwersję istniejących tabel MyISAM do InnoDB i przerwanie procesu bez COMMIT. Nie testowano oddzielnie Oracle MySQL ani rzeczywistego konta SSH/WordPress.org; transport sprawdzono przez kontrolowane wywołania procesów i lokalne repozytorium SVN.
