@echo off
echo 🚀 Uruchamianie Chrome z debug portem...
echo.
echo 📋 To jest skrypt pomocniczy do uruchomienia Chrome
echo    w trybie debug, który pozwoli Puppeteer się połączyć
echo.

REM Zamknij wszystkie procesy Chrome
echo 🔄 Zamykanie istniejących procesów Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

REM Utwórz folder tymczasowy jeśli nie istnieje
if not exist "C:\temp" mkdir "C:\temp"
if not exist "C:\temp\chrome-debug" mkdir "C:\temp\chrome-debug"

REM Uruchom Chrome z debug portem
echo 🌐 Uruchamianie Chrome z debug portem...
echo.
echo ✅ Chrome zostanie uruchomiony z portem debug 9222
echo ✅ Możesz teraz zalogować się na Vinted
echo ✅ Potem uruchom: bun run vinted-existing
echo.

start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug" https://www.vinted.pl

echo 📝 Chrome został uruchomiony!
echo 💡 Zaloguj się na Vinted, a potem uruchom: bun run vinted-existing
pause
