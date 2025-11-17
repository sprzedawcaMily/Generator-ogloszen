# 🚀 Generator Ogłoszeń - Szybka Instrukcja

## DLA UŻYTKOWNIKA KOŃCOWEGO 👤

### Jak zainstalować:
1. **Pobierz** plik `GeneratorOgloszen-Setup.exe`
2. **Kliknij 2x** na pliku instalatora
3. **Kliknij "Next"** kilka razy
4. **Gotowe!** Ikonka pojawi się na pulpicie

### Jak uruchomić:
- Kliknij dwukrotnie **ikonę na pulpicie** "Generator Ogloszen"
- Aplikacja otworzy się w przeglądarce automatycznie

### Jak zamknąć:
- Zamknij okno konsoli (czarne okienko)

---

## DLA PROGRAMISTY (TY) 👨‍💻

### Co musisz zrobić raz:
1. **Zainstaluj Inno Setup**
   - Pobierz: https://jrsoftware.org/isdl.php
   - Zainstaluj (Next, Next, Next...)

2. **(OPCJONALNIE) Dodaj swoją ikonę**
   - Zamień plik `logo.ico` na swoją ikonę
   - Format: .ico (256x256 lub 128x128 pikseli)
   - Możesz użyć https://convertio.co/png-ico/ do konwersji

### Jak stworzyć instalator:

#### 🎯 SZYBKA METODA (polecana):
```powershell
.\build-installer.ps1
```
**To wszystko!** Instalator pojawi się w folderze `installer-output\`

#### 🔧 METODA RĘCZNA (alternatywna):
1. Otwórz **Inno Setup Compiler**
2. File → Open → Wybierz `installer.iss`
3. Build → Compile
4. Czekaj... Gotowe!

### Co dostaniesz:
📦 Plik: `installer-output\GeneratorOgloszen-Setup.exe`

### Co instalator robi automatycznie:
- ✅ Instaluje Bun (jeśli nie ma)
- ✅ Instaluje wszystkie zależności (`bun install`)
- ✅ Tworzy ikonkę na pulpicie
- ✅ Tworzy skrót w menu Start

---

## 🎁 GOTOWE DO WYSŁANIA

Po uruchomieniu `build-installer.ps1`:
1. Znajdziesz plik w `installer-output\GeneratorOgloszen-Setup.exe`
2. **Ten jeden plik** wyślij użytkownikowi
3. Użytkownik tylko kliknie 2x i gotowe! 🎉

---

## 📊 Rozmiar instalatora

- **Bez node_modules**: ~5-10 MB
- **Zależności instalują się podczas instalacji** (Internet wymagany)

---

## ❓ FAQ

**Q: Czy użytkownik musi instalować Node.js/Bun?**
A: NIE! Instalator robi to automatycznie.

**Q: Czy użytkownik musi znać się na programowaniu?**
A: NIE! Tylko klik, klik i działa.

**Q: Co jeśli chcę zmienić nazwę aplikacji?**
A: Edytuj `installer.iss`, linia 6: `#define MyAppName "Twoja Nazwa"`

**Q: Czy mogę zmienić ikonę?**
A: TAK! Zamień plik `logo.ico` i przebuduj instalator.

---

## 🎯 QUICK START - 3 KROKI

```powershell
# 1. Zainstaluj Inno Setup (raz, na początku)
# Pobierz z: https://jrsoftware.org/isdl.php

# 2. Stwórz instalator
.\build-installer.ps1

# 3. Wyślij plik
# installer-output\GeneratorOgloszen-Setup.exe
```

**KONIEC! 🎉**

---

## 💡 Wskazówki

- **Pierwsza instalacja** trwa dłużej (pobiera Bun i zależności)
- **Kolejne uruchomienia** są natychmiastowe
- Użytkownik **nie widzi kodu** - tylko ikonkę i aplikację
- Wszystko działa **offline** po instalacji (poza Supabase)

---

Masz pytania? Sprawdź pełną instrukcję: `INSTALATOR_INSTRUKCJA.md`
