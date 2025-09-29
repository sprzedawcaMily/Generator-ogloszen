# 💰 Automatyzacja Zmiany Cen Vinted - Instrukcja

## 🎯 Co robi automatyzacja

Ta automatyzacja przechodzi przez wszystkie Twoje ogłoszenia na Vinted i **obniża ceny o 25%**.

### Funkcje:
- ✅ Automatycznie znajduje wszystkie Twoje ogłoszenia
- ✅ Wchodzi w każde ogłoszenie
- ✅ Klika "Edytuj ogłoszenie"
- ✅ Obniża cenę o 25%
- ✅ Zapisuje zmiany
- ✅ Przechodzi do następnego ogłoszenia

## 🚀 Jak użyć

### Sposób 1: Przez interfejs webowy

1. **Uruchom serwer**:
   ```powershell
   bun run src/server.ts
   ```

2. **Otwórz przeglądarkę** i idź do `http://localhost:3001`

3. **Kliknij "🚀 Uruchom przeglądarkę"** w sekcji "Automatyzacja Zmiany Cen Vinted"

4. **Zaloguj się na Vinted** w otwartej przeglądarce

5. **Kliknij "💰 Uruchom automatyzację cen"**

### Sposób 2: Przez linię poleceń

1. **Uruchom Chrome z debug portem**:
   ```powershell
   bun run chrome
   ```

2. **Zaloguj się na Vinted** w otwartej przeglądarce

3. **Uruchom automatyzację**:
   ```powershell
   bun run vinted-price
   ```

## ⚙️ Konfiguracja

### Automatyczne wykrywanie profilu
Automatyzacja domyślnie automatycznie wykrywa profil zalogowanego użytkownika na Vinted.

### Ręczne podanie profilu (opcjonalne)
Możesz nadal podać konkretny profil jako argument:
```powershell
bun run run-vinted-price-automation.ts "https://www.vinted.pl/member/TWOJ_ID"
```

## 📊 Przykład działania

```
🔍 Szukam ogłoszeń...
✅ Znaleziono 15 ogłoszeń

📦 Przetwarzam ogłoszenie ID: 6950364329
💰 Aktualna cena w polu: 110,00 zł
🔄 Zmieniam cenę z 110,00 zł na 82,50 zł
✅ Cena zmieniona pomyślnie

📊 Postęp: 1/15
⏳ Przerwa 2 sekundy...

...

🎉 Automatyzacja zakończona!
📊 Statystyki:
   • Przetworzonych: 15
   • Udanych: 14
   • Nieudanych: 1
```

## ⚠️ Ważne uwagi

### Wymagania:
- Chrome musi być uruchomiony z `--remote-debugging-port=9222`
- Musisz być zalogowany na Vinted
- Twoje ogłoszenia muszą być widoczne na profilu

### Bezpieczeństwo:
- Automatyzacja robi 2-sekundowe przerwy między ogłoszeniami
- Nie przeciąża serwerów Vinted
- Wszystkie zmiany są zapisywane na Vinted

### Ograniczenia:
- Działa tylko z ogłoszeniami widocznymi na profilu
- Wymaga aktywnej sesji przeglądarki
- Ceny są obniżane o dokładnie 25%

## 🔧 Rozwiązywanie problemów

### Błąd "Nie można połączyć z przeglądarką"
- Upewnij się, że Chrome jest uruchomiony z debug portem
- Sprawdź czy port 9222 nie jest zajęty

### Błąd "Nie znaleziono przycisku Edytuj"
- Sprawdź czy jesteś zalogowany na Vinted
- Sprawdź czy ogłoszenia należą do Ciebie

### Błąd "Nie można odczytać ceny"
- Sprawdź format ceny na Vinted
- Ogłoszenie może mieć niepoprawną cenę

## 📝 Logi

Wszystkie akcje są logowane w konsoli:
- ✅ Sukces (zielony)
- ⚠️ Ostrzeżenie (żółty)  
- ❌ Błąd (czerwony)
- 🔍 Informacja (niebieski)

## 🆘 Pomoc

Jeśli automatyzacja nie działa:
1. Sprawdź czy Chrome jest uruchomiony prawidłowo
2. Sprawdź czy jesteś zalogowany na Vinted
3. Sprawdź logi w konsoli
4. Spróbuj ręcznie wykonać jeden cykl w przeglądarce