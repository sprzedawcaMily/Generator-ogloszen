@echo off
echo 🚀 Uruchamiam Chrome z debug portem...

echo 🔄 Zamykam istniejące procesy Chrome...
taskkill /F /IM chrome.exe 2>NUL
timeout /t 2 /nobreak >NUL

echo 📁 Tworzę katalog debug...
if not exist "C:\temp\chrome-debug" mkdir "C:\temp\chrome-debug"

echo 🔵 Uruchamiam Chrome z debug portem na porcie 9222...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug" --no-first-run --no-default-browser-check --disable-default-apps https://www.vinted.pl

echo ✅ Chrome uruchomiony!
echo 📱 Zaloguj się na Vinted w otwartej przeglądarce
echo 🔄 Następnie w innym terminalu uruchom: bun run direct
pause
