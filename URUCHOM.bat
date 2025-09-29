@echo off
REM ========================================
REM      URUCHOM GENERATOR OGLOSZEN
REM ========================================

color 0B
echo.
echo  ==========================================
echo   🚀 GENERATOR OGLOSZEN
echo  ==========================================
echo.

REM Sprawdź czy Bun jest zainstalowany
where bun >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Bun.js nie jest zainstalowany!
    echo     Uruchom najpierw: ZAINSTALUJ.bat
    echo.
    pause
    exit /b 1
)

REM Sprawdź czy node_modules istnieje
if not exist "node_modules" (
    echo  ⚠️  Zależności nie są zainstalowane!
    echo     Uruchom najpierw: ZAINSTALUJ.bat
    echo.
    pause
    exit /b 1
)

echo  ✅ Uruchamianie aplikacji...
echo.
echo  📱 Aplikacja będzie dostępna na:
echo     👉 http://localhost:3001
echo.
echo  🔧 Funkcje aplikacji:
echo     • Generator ogłoszeń
echo     • Automatyzacja Vinted (nowe opcje!)
echo     • Automatyzacja Grailed
echo.
echo  ⚠️  Aby zamknąć aplikację naciśnij: Ctrl+C
echo.
echo  ==========================================
echo.

REM Uruchom aplikację
bun run dev