@echo off
REM ========================================
REM    AUTOMATYCZNA INSTALACJA APLIKACJI
REM ========================================

color 0A
echo.
echo  ==========================================
echo   🚀 GENERATOR OGLOSZEN - INSTALACJA
echo  ==========================================
echo.
echo  Rozpoczynam automatyczną instalację...
echo.

REM Sprawdź czy Bun jest zainstalowany
where bun >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo  ⚠️  Bun.js nie jest zainstalowany!
    echo.
    echo  📥 Pobieranie i instalowanie Bun.js...
    echo     To może potrwać kilka minut...
    echo.
    
    REM Pobierz i zainstaluj Bun przez PowerShell
    powershell -Command "& {Set-ExecutionPolicy Bypass -Scope Process -Force; try { irm bun.sh/install.ps1 | iex } catch { Write-Host 'Błąd instalacji Bun.js' -ForegroundColor Red; exit 1 }}"
    
    if %ERRORLEVEL% NEQ 0 (
        echo  ❌ Błąd instalacji Bun.js!
        echo     Zainstaluj ręcznie ze strony: https://bun.sh
        pause
        exit /b 1
    )
    
    echo  ✅ Bun.js został zainstalowany!
    echo.
    
    REM Odśwież zmienne środowiskowe
    call RefreshEnv.cmd 2>nul || echo     Może być konieczne ponowne uruchomienie terminala
    echo.
) else (
    echo  ✅ Bun.js jest już zainstalowany
    echo.
)

REM Zainstaluj zależności
echo  📦 Instalowanie zależności projektu...
bun install

if %ERRORLEVEL% NEQ 0 (
    echo  ❌ Błąd instalacji zależności!
    echo     Sprawdź połączenie internetowe i spróbuj ponownie
    pause
    exit /b 1
)

echo.
echo  ✅ Instalacja zakończona pomyślnie!
echo.
echo  ==========================================
echo   🎉 GOTOWE DO UŻYCIA!
echo  ==========================================
echo.
echo  Aby uruchomić aplikację:
echo  1. Kliknij dwukrotnie: URUCHOM.bat
echo  2. Albo wpisz w terminalu: bun run dev
echo.
echo  Aplikacja będzie dostępna na:
echo  👉 http://localhost:3001
echo.
pause