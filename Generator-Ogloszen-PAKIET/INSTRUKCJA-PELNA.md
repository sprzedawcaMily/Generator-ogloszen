# 🚀 Generator Ogłoszeń - Instrukcja Instalacji

## 📋 Wymagania systemowe
- Windows 10/11
- Połączenie z internetem (do instalacji Bun.js)
- Google Chrome

## ⚡ Szybka instalacja (ZALECANA)

### Opcja 1: Automatyczna instalacja (jeden klik)
1. **Kliknij dwukrotnie na plik**: `ZAINSTALUJ.bat`
2. **Poczekaj** na automatyczną instalację Bun.js i zależności
3. **Uruchom aplikację** klikając: `URUCHOM.bat`
4. **Otwórz przeglądarkę** na: http://localhost:3001

### Opcja 2: Ręczna instalacja
1. **Zainstaluj Bun.js**:
   - Wejdź na https://bun.sh
   - Pobierz instalator dla Windows
   - Uruchom instalator

2. **Otwórz terminal** (PowerShell) w folderze aplikacji

3. **Wykonaj komendy**:
   ```powershell
   bun install
   bun run dev
   ```

4. **Otwórz przeglądarkę**: http://localhost:3001

---

## 🎯 Główne funkcje aplikacji

### 📝 Generator Ogłoszeń
- Automatyczne formatowanie tytułów i opisów
- Obsługa różnych produktów (ubrania, akcesoria)
- Automatyczne wymiary i rozmiary
- Kopiowanie do schowka

### 🤖 Automatyzacja Vinted
- **Automatyczne publikowanie ogłoszeń**
- **Automatyczna zmiana cen** (nowa funkcja!)
  - Wybór procentu zniżki (1-90%)
  - Start od wybranego ogłoszenia
  - Limit liczby ogłoszeń
  - Przewijanie wszystkich ogłoszeń

### 🤖 Automatyzacja Grailed
- Automatyczne publikowanie na platformie Grailed
- Integracja z bazą danych

---

## 🔧 Instrukcja użycia automatyzacji Vinted

### Krok 1: Uruchom Chrome w trybie debug
1. Kliknij: `URUCHOM-CHROME.bat`
2. Zaloguj się na vinted.pl

### Krok 2: Automatyzacja cen (NOWOŚĆ!)
1. W aplikacji wybierz **"Automatyzacja cen Vinted"**
2. **Opcjonalnie**: Wklej URL swojego profilu
3. Ustaw parametry:
   - **Start od ogłoszenia**: Nr ogłoszenia od dołu (1 = najstarsze)
   - **Limit**: Ile ogłoszeń zmienić (puste = wszystkie)
   - **Zniżka**: Procent obniżki ceny (25% domyślnie)
4. Kliknij **"Uruchom automatyzację"**

### Przykład użycia:
```
🔗 URL: https://www.vinted.pl/member/130445339
🚀 Start: 1 (od najstarszego)
🔢 Limit: [puste] (wszystkie ogłoszenia)
💰 Zniżka: 30% (cena 100zł → 70zł)
```

---

## 📁 Struktura plików

```
Generator-ogloszen/
├── 📄 ZAINSTALUJ.bat          # Automatyczna instalacja
├── 📄 URUCHOM.bat             # Uruchom aplikację
├── 📄 URUCHOM-CHROME.bat      # Chrome w trybie debug
├── 📄 INSTRUKCJA-PELNA.md     # Ten plik
├── 📁 src/                    # Kod źródłowy
│   ├── main.js               # Główny interfejs
│   ├── server.ts             # Backend serwer
│   └── vintedPriceAutomation.ts  # Automatyzacja Vinted
└── 📁 package.json           # Zależności
```

---

## ❓ Rozwiązywanie problemów

### Problem: "bun nie jest rozpoznawany"
**Rozwiązanie**: Uruchom `ZAINSTALUJ.bat` lub zainstaluj Bun.js ręcznie

### Problem: Chrome się nie łączy
**Rozwiązanie**: 
1. Zamknij wszystkie okna Chrome
2. Uruchom `URUCHOM-CHROME.bat`
3. Zaloguj się na vinted.pl

### Problem: Automatyzacja się zatrzymuje
**Rozwiązanie**: 
1. Sprawdź czy jesteś zalogowany na Vinted
2. Sprawdź URL profilu
3. Upewnij się że masz aktywne ogłoszenia

---

## 🆘 Pomoc techniczna

W przypadku problemów:
1. Sprawdź logi w terminalu
2. Upewnij się że Chrome jest otwarty
3. Sprawdź połączenie internetowe
4. Zrestartuj aplikację

## 🔄 Aktualizacje

Program automatycznie przewija wszystkie ogłoszenia i obsługuje:
- ✅ Dynamiczne wykrywanie użytkownika
- ✅ Filtrowanie aktywnych ogłoszeń  
- ✅ Wybór zakresu ogłoszeń do zmiany
- ✅ Konfigurowalny procent zniżki
- ✅ Lepsze przewijanie (ładuje wszystkie ogłoszenia)

---

## 📞 Kontakt

Dla pytań technicznych sprawdź logi w konsoli lub dokumentację kodu.