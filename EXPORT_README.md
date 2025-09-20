Jak wyeksportować i uruchomić aplikację "Aplikacja do wstawiania ogloszen"

1) Utworzenie paczki (na Windows PowerShell)

   - Uruchom w katalogu repozytorium:

     .\export.ps1 -OutFile "app-export.zip"

   - Skrypt pakuje repozytorium do `app-export.zip`, wykluczając `.git`, `node_modules`, `temp`, `dist`, pliki zip i logi.

2) Wymagania u odbiorcy

   - Bun (https://bun.sh/) zainstalowany i dostępny z PATH.
   - Node.js NIE jest wymagany, ale można użyć jeśli preferujesz.
   - Google Chrome (lub Chromium) z opcją uruchamiania w trybie debug (do automatyzacji Puppeteer).
   - (Opcjonalnie) konto i dostęp do Supabase, jeśli chcesz korzystać z rzeczywistej bazy danych. Alternatywnie możesz pracować na lokalnych plikach.

3) Rozpakowanie

   - Rozpakuj `app-export.zip` do dowolnego katalogu.

4) Zmienne środowiskowe

    - Możesz ustawić opcjonalne zmienne środowiskowe przed uruchomieniem.
    - Przygotowałem plik przykładowy `.env.example` — skopiuj go do `.env` i zmodyfikuj jeśli chcesz.

5) Szybkie uruchomienie (zalecane dla odbiorcy Windows)

    - Aby ułatwić start, użyj skryptu `run-app.ps1` który:
       - sprawdza obecność Bun,
       - ładuje `.env` jeśli istnieje,
       - ustawia domyślne wartości (PORT=3001, GRAILED_PRICE_PERCENTAGE=15) i uruchamia serwer.

    - Uruchom w PowerShell z katalogu projektu:

       .\run-app.ps1

    - Alternatywnie możesz ręcznie uruchomić:

       bun run start

    - Serwer wystawi stronę na `http://localhost:3001` (lub innym porcie jeśli ustawione).

6) Automatyzacja (Grailed/Vinted)

   - Aby używać automatyzacji Puppeteer, uruchom Chrome/Chromium w trybie debug (instrukcje w repo: `start-chrome.ps1` lub `start-chrome.bat`).
   - Najpierw manualnie zaloguj się do Vinted/Grailed w tej instancji Chrome, a następnie użyj opcji "Uruchom automatyzację" w UI.

7) Problemy i debug

   - Jeśli serwer nie startuje, sprawdź czy port jest wolny.
   - Upewnij się, że Bun jest zainstalowany i `bun run start` działa lokalnie.

8) Kontakt

   - Jeśli chcesz, mogę przygotować dodatkowy skrypt instalacyjny dla Bun lub wersję dla macOS/Linux.
