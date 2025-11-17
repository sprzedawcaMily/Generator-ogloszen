# Generator Ogłoszeń - Instrukcja Instalacji

## 📦 Dla użytkownika końcowego

### Krok 1: Pobierz instalator
Pobierz plik `GeneratorOgloszen-Setup.exe`

### Krok 2: Uruchom instalator
1. Kliknij dwukrotnie na `GeneratorOgloszen-Setup.exe`
2. Jeśli pojawi się ostrzeżenie Windows Defender, kliknij "Więcej informacji" → "Uruchom mimo to"
3. Postępuj zgodnie z instrukcjami kreatora instalacji

### Krok 3: Czekaj na instalację
Instalator automatycznie:
- ✅ Zainstaluje Bun runtime (jeśli nie jest zainstalowany)
- ✅ Zainstaluje wszystkie wymagane zależności
- ✅ Utworzy ikonkę na pulpicie

### Krok 4: Uruchom aplikację
Po instalacji:
- Kliknij dwukrotnie ikonę **"Generator Ogloszen"** na pulpicie
- Aplikacja otworzy się automatycznie w przeglądarce
- Adres: http://localhost:3000

### 🎯 Użytkowanie
- **Uruchomienie**: Kliknij ikonę na pulpicie
- **Zamknięcie**: Zamknij okno konsoli które się otworzy

---

## 🛠️ Dla programisty - Tworzenie instalatora

### Wymagania
1. **Inno Setup** - [Pobierz tutaj](https://jrsoftware.org/isdl.php)
2. Zainstaluj Inno Setup Compiler

### Jak stworzyć instalator

#### Metoda 1: Użyj gotowego skryptu
```powershell
.\build-installer.ps1
```

#### Metoda 2: Ręcznie przez Inno Setup
1. Otwórz **Inno Setup Compiler**
2. Wybierz `File` → `Open` → Otwórz plik `installer.iss`
3. Kliknij `Build` → `Compile`
4. Instalator zostanie utworzony w folderze `installer-output\`

### Struktura plików instalatora
```
installer.iss           # Skrypt Inno Setup
logo.ico               # Ikona aplikacji
uruchom-aplikacje.bat  # Skrypt startowy
build-installer.ps1    # Automatyczny build
```

### Dostosowywanie

#### Zmiana ikony
Zamień plik `logo.ico` na własną ikonę (format .ico, 256x256 lub 128x128)

#### Zmiana nazwy
Edytuj `installer.iss`, linia:
```
#define MyAppName "Generator Ogloszen"
```

#### Zmiana wersji
Edytuj `installer.iss`, linia:
```
#define MyAppVersion "1.0.0"
```

---

## 📋 Zawartość instalatora

Instalator pakuje:
- ✅ Cały kod źródłowy aplikacji
- ✅ Wszystkie skrypty TypeScript/JavaScript
- ✅ Pliki konfiguracyjne
- ✅ Pliki HTML/CSS
- ❌ NIE pakuje: node_modules, .git, dist, build

Zależności (`node_modules`) są instalowane automatycznie podczas instalacji.

---

## 🚀 Szybki start

### Dla użytkownika:
```
1. Pobierz GeneratorOgloszen-Setup.exe
2. Zainstaluj (dwukrotne kliknięcie)
3. Kliknij ikonę na pulpicie
4. Gotowe! 🎉
```

### Dla programisty:
```powershell
# Zainstaluj Inno Setup, potem:
.\build-installer.ps1
```

---

## ❓ Rozwiązywanie problemów

### Problem: "Bun nie jest zainstalowany"
**Rozwiązanie**: Uruchom instalator ponownie - instaluje on Bun automatycznie

### Problem: "Port 3000 jest zajęty"
**Rozwiązanie**: Zamknij inne aplikacje używające portu 3000 lub zmień port w `src/server.ts`

### Problem: Aplikacja nie otwiera się w przeglądarce
**Rozwiązanie**: 
1. Zamknij aplikację
2. Otwórz przeglądarkę ręcznie
3. Wejdź na http://localhost:3000

---

## 📞 Wsparcie

W razie problemów:
1. Sprawdź czy Bun jest zainstalowany: `bun --version`
2. Sprawdź logi w konsoli
3. Zgłoś problem na GitHub

---

## 📄 Licencja

Ten instalator i aplikacja są dostępne dla użytkowników końcowych.
