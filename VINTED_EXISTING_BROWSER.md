# Vinted Automation - Użycie Istniejącej Przeglądarki

## 🎯 **NOWA FUNKCJA: Użyj swojej zalogowanej przeglądarki!**

Teraz możesz zalogować się normalnie w Chrome, a potem pozwolić aplikacji używać Twojej sesji.

## 🚀 **Sposób 1: Automatyczne uruchomienie Chrome (NAJŁATWIEJSZY)**

```bash
# Uruchom Chrome z debug portem
bun run chrome-debug
```

To uruchomi Chrome w specjalnym trybie i przekieruje Cię na Vinted.

## 🚀 **Sposób 2: Ręczne uruchomienie Chrome**

### Krok 1: Zamknij Chrome
Zamknij wszystkie okna Chrome.

### Krok 2: Uruchom Chrome z debug portem
Otwórz CMD/PowerShell i wklej:

```bash
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug" https://www.vinted.pl
```

### Krok 3: Zaloguj się
- Zaloguj się normalnie na Vinted
- Możesz użyć Google Auth - działa w normalnej przeglądarce!
- Sprawdź że jesteś zalogowany

### Krok 4: Uruchom automatyzację
```bash
bun run vinted-existing
```

## 🔥 **ZALETY tego rozwiązania:**

✅ **Google Auth działa** - logowanie przez Google  
✅ **Używa Twojej sesji** - nie trzeba logować się ponownie  
✅ **Zachowuje cookies** - wszystkie ustawienia  
✅ **Bezpieczniejsze** - używa Twojego profilu  
✅ **Szybsze** - od razu zalogowany  

## 🎮 **Dostępne komendy:**

| Komenda | Opis |
|---------|------|
| `bun run chrome-debug` | Uruchom Chrome z debug portem |
| `bun run vinted-existing` | Automatyzacja z istniejącą przeglądarką |
| `bun run vinted` | Standardowa automatyzacja (nowa przeglądarka) |
| `bun run debug-vinted` | Debug mode - sprawdź elementy strony |

## 🔧 **Troubleshooting:**

### Problem: "Cannot connect to browser"
- Sprawdź czy Chrome jest uruchomiony z `--remote-debugging-port=9222`
- Spróbuj zamknąć wszystkie okna Chrome i uruchomić ponownie
- Użyj `bun run chrome-debug` dla automatycznego uruchomienia

### Problem: "Port already in use"
- Zamknij wszystkie procesy Chrome: `taskkill /F /IM chrome.exe`
- Uruchom ponownie Chrome z debug portem

### Problem: Nie działa logowanie
- Upewnij się że jesteś zalogowany w Chrome
- Sprawdź czy jesteś na stronie vinted.pl
- Odśwież stronę jeśli potrzeba

## 💡 **Wskazówki:**

1. **Zawsze najpierw zaloguj się ręcznie** w Chrome
2. **Sprawdź że jesteś na vinted.pl** przed uruchomieniem automatyzacji
3. **Nie zamykaj Chrome** podczas działania automatyzacji
4. **Możesz przełączać karty** - aplikacja znajdzie kartę z Vinted

## 🎯 **PODSUMOWANIE:**

Ta metoda rozwiązuje problemy z:
- ❌ Blokowaniem Google Auth
- ❌ Wykrywaniem automatyzacji
- ❌ Koniecznością wielokrotnego logowania

**To jest najlepszy sposób użycia automatyzacji Vinted!** 🔥
