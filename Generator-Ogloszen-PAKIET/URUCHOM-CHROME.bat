@echo off
REM ========================================
REM    URUCHOM CHROME W TRYBIE DEBUG
REM ========================================

color 0E
echo.
echo  ==========================================
echo   🌐 CHROME DEBUG MODE - VINTED
echo  ==========================================
echo.
echo  🔧 Przygotowuję Chrome dla automatyzacji...
echo.

REM Zamknij wszystkie instancje Chrome
echo  🔄 Zamykam istniejące okna Chrome...
taskkill /f /im chrome.exe 2>nul
timeout /t 2 /nobreak >nul

REM Utwórz folder dla danych Chrome jeśli nie istnieje
if not exist "C:\temp\chrome-debug" (
    echo  📁 Tworzę folder dla danych Chrome...
    mkdir "C:\temp\chrome-debug" 2>nul
)

REM Uruchom Chrome w trybie debug
echo  🚀 Uruchamiam Chrome w trybie debug...
echo.
echo  ⚠️  WAŻNE INSTRUKCJE:
echo     1. Zaloguj się na vinted.pl
echo     2. Przejdź do swojego profilu
echo     3. Wróć do aplikacji Generator Ogłoszeń
echo     4. Użyj automatyzacji Vinted
echo.
echo  📱 Chrome otworzy się automatycznie na Vinted.pl
echo.

REM Uruchom Chrome z odpowiednimi parametrami
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" ^
    --remote-debugging-port=9222 ^
    --user-data-dir=C:\temp\chrome-debug ^
    --no-first-run ^
    --no-default-browser-check ^
    --disable-features=VizDisplayCompositor ^
    "https://www.vinted.pl"

if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Błąd uruchomienia Chrome!
    echo     Sprawdź czy Chrome jest zainstalowany w standardowej lokalizacji
    echo.
    pause
    exit /b 1
)

echo  ✅ Chrome uruchomiony pomyślnie!
echo.
echo  🎯 Następne kroki:
echo     1. Zaloguj się na Vinted.pl w otwartym oknie Chrome
echo     2. Uruchom aplikację: URUCHOM.bat  
echo     3. Użyj automatyzacji Vinted z nowymi opcjami!
echo.
echo  💡 Okno terminala można zamknąć
echo.
pause