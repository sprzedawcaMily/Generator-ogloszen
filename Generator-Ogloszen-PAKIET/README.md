# 🚀 Generator Ogłoszeń + Automatyzacja Vinted

**Zaawansowana aplikacja do generowania ogłoszeń i automatyzacji platform sprzedażowych**

## ⚡ SZYBKI START

### 📥 **Instalacja (2 kliknięcia)**
1. **KLIKNIJ**: `ZAINSTALUJ.bat` *(automatyczna instalacja)*
2. **KLIKNIJ**: `URUCHOM.bat` *(uruchom aplikację)*
3. **OTWÓRZ**: http://localhost:3001

### 🤖 **Automatyzacja Vinted (NOWOŚĆ!)**
1. **KLIKNIJ**: `URUCHOM-CHROME.bat` *(Chrome w trybie debug)*
2. **ZALOGUJ SIĘ** na vinted.pl
3. **UŻYJ AUTOMATYZACJI** w aplikacji

---

## ✨ **GŁÓWNE FUNKCJE**

### 📝 **Generator Ogłoszeń**
- ✅ Automatyczne formatowanie tytułów i opisów
- ✅ Obsługa różnych produktów (ubrania, akcesoria)
- ✅ Automatyczne wymiary i rozmiary
- ✅ Kopiowanie do schowka

### 🤖 **Automatyzacja Vinted (NOWE OPCJE!)**
- 🎯 **Zmiana cen z kontrolą procentu** (1-90% zniżki)
- 🚀 **Start od wybranego ogłoszenia** (numeracja od najstarszych)
- 🔢 **Limit liczby ogłoszeń** (puste = wszystkie)
- 📜 **Przewijanie wszystkich ogłoszeń** (poprawione!)
- 🔗 **Auto-wykrywanie profilu** lub ręczne podanie URL
- 📊 **Statystyki procesowania**

### 🤖 **Automatyzacja Grailed**
- ✅ Publikowanie ogłoszeń na Grailed
- ✅ Integracja z bazą danych

---

## 🎯 **PRZYKŁAD AUTOMATYZACJI VINTED**

```
🔗 URL profilu: https://www.vinted.pl/member/130445339 (opcjonalne)
🚀 Start od ogłoszenia: 1 (najstarsze)
🔢 Limit ogłoszeń: [puste] (wszystkie)
💰 Procent zniżki: 25% (100zł → 75zł)
```

**Rezultat**: Automatycznie obniży ceny wszystkich aktywnych ogłoszeń o 25%

---

## 🛠️ **Technologie**
- **Bun.js** - szybki runtime JavaScript
- **TypeScript** - typowany JavaScript  
- **Puppeteer** - automatyzacja przeglądarki
- **HTML/CSS** - interfejs użytkownika

---

## 📁 **Struktura plików**

```
Generator-ogloszen/
├── 🚀 ZAINSTALUJ.bat          # Automatyczna instalacja
├── 🚀 URUCHOM.bat             # Uruchom aplikację
├── 🌐 URUCHOM-CHROME.bat      # Chrome debug mode
├── 📖 INSTRUKCJA-PELNA.md     # Szczegółowa dokumentacja
├── 📖 JAK-WYSLAC.md           # Instrukcja dystrybucji
└── 📁 src/                    # Kod źródłowy
    ├── main.js               # Frontend interface
    ├── server.ts             # Backend API
    └── vintedPriceAutomation.ts  # Vinted automation
```

---

## ❓ **Pomoc**

### Problem z instalacją?
- Uruchom `ZAINSTALUJ.bat` jako administrator
- Sprawdź połączenie internetowe

### Problem z automatyzacją?
- Sprawdź czy Chrome jest uruchomiony przez `URUCHOM-CHROME.bat`
- Upewnij się że jesteś zalogowany na Vinted
- Sprawdź logi w konsoli aplikacji

### Więcej pomocy?
- Zobacz: `INSTRUKCJA-PELNA.md`
- Sprawdź logi w terminalu

---

## 🔄 **Aktualizacje**

**Wersja 2024.09.30:**
- ✅ Dodano kontrolę procentu zniżki (1-90%)
- ✅ Poprawiono przewijanie (ładuje wszystkie ogłoszenia)
- ✅ Dodano opcję startu od wybranego ogłoszenia
- ✅ Dodano limit liczby ogłoszeń do zmiany
- ✅ Ulepszone auto-wykrywanie profilu użytkownika
- ✅ Lepsze komunikaty i statystyki

---

## 📞 **Autor**
Generator stworzony dla automatyzacji sprzedaży online.
Wsparcie techniczne dostępne przez analizę logów.
```
[nazwa produktu] size [rozmiar] [stan]
[wymiary w formacie: p XX d XX s XX u XX n XX]
```

2. Kliknij przycisk generowania ogłoszenia
3. Skopiuj wygenerowane ogłoszenie do schowka

## Licencja

MIT
