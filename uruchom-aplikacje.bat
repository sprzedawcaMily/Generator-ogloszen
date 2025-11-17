@echo off
title Generator Ogloszen - Uruchamianie...
cls
echo.
echo ====================================
echo   GENERATOR OGLOSZEN
echo   Uruchamianie aplikacji...
echo ====================================
echo.

cd /d "%~dp0"

REM Sprawdz czy Bun jest zainstalowany
where bun >nul 2>nul
if %errorlevel% neq 0 (
    echo [BLAD] Bun nie jest zainstalowany!
    echo Uruchom ponownie instalator.
    pause
    exit /b 1
)

REM Uruchom serwer
echo [INFO] Uruchamianie serwera...
start /B bun run src/server.ts

timeout /t 3 /nobreak >nul

REM Otworz przegladarke
echo [INFO] Otwieranie aplikacji w przegladarce...
start http://localhost:3001

echo.
echo ====================================
echo   Aplikacja uruchomiona!
echo   Adres: http://localhost:3001
echo ====================================
echo.
echo Zamknij to okno aby zatrzymac aplikacje.
echo.

REM Czekaj na zamkniecie
pause >nul
