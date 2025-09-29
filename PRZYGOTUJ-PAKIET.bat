@echo off
REM ========================================
REM    PRZYGOTOWANIE PAKIETU DO WYSLANIA
REM ========================================

color 0C
echo.
echo  ==========================================
echo   📦 PRZYGOTOWANIE PAKIETU DYSTRYBUCJI
echo  ==========================================
echo.

set "SOURCE_DIR=%~dp0"
set "PACKAGE_DIR=%SOURCE_DIR%Generator-Ogloszen-PAKIET"
set "ZIP_NAME=Generator-Ogloszen-v2024.09.30.zip"

echo  🗂️  Tworzę folder pakietu...
if exist "%PACKAGE_DIR%" (
    echo  🗑️  Usuwam stary pakiet...
    rmdir /s /q "%PACKAGE_DIR%"
)
mkdir "%PACKAGE_DIR%"

echo  📄 Kopiuję pliki główne aplikacji...

REM Pliki instalacyjne (NAJWAŻNIEJSZE)
copy "%SOURCE_DIR%ZAINSTALUJ.bat" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%URUCHOM.bat" "%PACKAGE_DIR%\" >nul  
copy "%SOURCE_DIR%URUCHOM-CHROME.bat" "%PACKAGE_DIR%\" >nul

REM Dokumentacja
copy "%SOURCE_DIR%README.md" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%INSTRUKCJA-PELNA.md" "%PACKAGE_DIR%\" >nul

REM Pliki konfiguracyjne aplikacji
copy "%SOURCE_DIR%package.json" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%bun.lock" "%PACKAGE_DIR%\" >nul
copy "%SOURCE_DIR%tsconfig.json" "%PACKAGE_DIR%\" >nul

REM Folder src (kod źródłowy)
echo  📁 Kopiuję kod źródłowy...
xcopy "%SOURCE_DIR%src" "%PACKAGE_DIR%\src\" /E /I /Q >nul

REM Folder static (zasoby)
if exist "%SOURCE_DIR%static" (
    echo  🎨 Kopiuję zasoby statyczne...
    xcopy "%SOURCE_DIR%static" "%PACKAGE_DIR%\static\" /E /I /Q >nul
)

REM Dodatkowe pliki pomocnicze
copy "%SOURCE_DIR%index.html" "%PACKAGE_DIR%\" >nul 2>nul

echo  ✅ Pliki skopiowane!
echo.

echo  📋 Tworzę plik informacyjny...
(
echo # 🚀 Generator Ogłoszeń - Pakiet Instalacyjny
echo.
echo ## ⚡ SZYBKA INSTALACJA
echo 1. Kliknij dwukrotnie: **ZAINSTALUJ.bat**
echo 2. Kliknij dwukrotnie: **URUCHOM.bat**  
echo 3. Otwórz przeglądarkę: http://localhost:3001
echo.
echo ## 🤖 AUTOMATYZACJA VINTED
echo 1. Kliknij: **URUCHOM-CHROME.bat**
echo 2. Zaloguj się na vinted.pl
echo 3. Użyj automatyzacji w aplikacji
echo.
echo ## ✨ NOWE FUNKCJE
echo - 🎯 Wybór procentu zniżki ^(1-90%%^)
echo - 🚀 Start od wybranego ogłoszenia
echo - 🔢 Limit liczby ogłoszeń  
echo - 📜 Przewijanie wszystkich ogłoszeń
echo - 🔗 Auto-wykrywanie profilu
echo.
echo ## 📖 POMOC
echo Zobacz plik: **INSTRUKCJA-PELNA.md**
echo.
echo **Wersja: 2024.09.30**
) > "%PACKAGE_DIR%\START-TUTAJ.md"

echo  📊 Sprawdzam rozmiar pakietu...
for /f "tokens=3" %%a in ('dir "%PACKAGE_DIR%" /s /-c ^| find "File(s)"') do set "SIZE=%%a"
echo     Rozmiar: %SIZE% bajtów

echo.
echo  🎯 Pakiet gotowy w folderze:
echo     📁 %PACKAGE_DIR%
echo.
echo  📦 Zawiera:
echo     ✅ Automatyczne skrypty instalacyjne
echo     ✅ Kod źródłowy aplikacji  
echo     ✅ Kompletną dokumentację
echo     ✅ Nowe funkcje automatyzacji Vinted
echo.

REM Sprawdź czy jest 7-Zip lub WinRAR do kompresji
where 7z >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo  🗜️  Tworzę archiwum ZIP...
    7z a "%SOURCE_DIR%%ZIP_NAME%" "%PACKAGE_DIR%\*" -mx9 >nul
    echo  ✅ Utworzono: %ZIP_NAME%
    echo.
) else (
    where winrar >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo  🗜️  Tworzę archiwum RAR...
        winrar a -m5 "%SOURCE_DIR%%ZIP_NAME%.rar" "%PACKAGE_DIR%\*" >nul
        echo  ✅ Utworzono: %ZIP_NAME%.rar
        echo.
    ) else (
        echo  ⚠️  Brak 7-Zip/WinRAR - spakuj folder ręcznie
        echo.
    )
)

echo  ==========================================
echo   🎉 PAKIET GOTOWY DO WYSŁANIA!
echo  ==========================================
echo.
echo  📤 OPCJE WYSŁANIA:
echo     • Email/WeTransfer: wyślij archiwum ZIP/RAR
echo     • Google Drive/OneDrive: wgraj i udostępnij
echo     • GitHub Release: załącz jako asset
echo.
echo  👥 INSTRUKCJA DLA UŻYTKOWNIKA:
echo     1. Pobierz i rozpakuj
echo     2. Kliknij ZAINSTALUJ.bat  
echo     3. Kliknij URUCHOM.bat
echo     4. Gotowe! ⚡
echo.
pause