# 🚀 Vinted Automation - Instrukcja użytkowania

## 📋 Wymagania przed uruchomieniem

### 1. Dodaj kolumnę do bazy danych
W panelu Supabase wykonaj następującą komendę SQL:
```sql
ALTER TABLE advertisements ADD COLUMN is_published_to_vinted BOOLEAN DEFAULT FALSE;
```

### 2. Uruchom Chrome z portem debug
Otwórz terminal i uruchom:
```powershell
# Windows
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\temp\chrome-debug"
```

### 3. Zaloguj się na Vinted
- Przejdź na https://www.vinted.pl w otwartym Chrome
- Zaloguj się na swoje konto

## 🔧 Uruchamianie automatyzacji

### Opcja 1: Z istniejącą przeglądarką (zalecane)
```bash
bun run run-vinted-automation.ts
```

### Opcja 2: Z nową przeglądarką
```bash
bun run src/vintedAutomation.ts
```

## 🎯 Co robi automatyzacja

1. **Pobiera ogłoszenia** - wybiera tylko te z `is_published_to_vinted = false`
2. **Wypełnia formularz**:
   - ✅ Dodaje zdjęcia z bazy danych
   - ✅ Wypełnia tytuł i opis
   - ✅ Wybiera kategorię
   - ✅ Wybiera markę
   - ✅ Wybiera rozmiar
   - ✅ Wybiera stan
   - ✅ Wybiera kolor
   - ✅ Wypełnia cenę
3. **Zapisuje wersję roboczą**
4. **Oznacza w bazie** - ustawia `is_published_to_vinted = true`
5. **Przechodzi do następnego** ogłoszenia

## 🚨 Rozwiązywanie problemów

### "No unpublished advertisements found"
- Sprawdź czy kolumna `is_published_to_vinted` została dodana
- Sprawdź czy masz ogłoszenia z `is_published_to_vinted = false`

### Błędy z selektorami
- Vinted może zmienić interfejs
- Uruchom ręcznie i sprawdź co się zmieniło

### Problemy z logowaniem
- Sprawdź czy jesteś zalogowany w Chrome
- Odśwież stronę Vinted

## 📊 Status ogłoszeń

Po uruchomieniu sprawdź w bazie danych:
- `is_completed = true` - ogłoszenie zostało przetworzone przez Generator
- `is_published_to_vinted = true` - ogłoszenie zostało dodane do Vinted

## 🔄 Ponowne przetwarzanie

Aby ponownie przetworzyć ogłoszenie:
```sql
UPDATE advertisements 
SET is_published_to_vinted = false 
WHERE id = 'YOUR_ADVERTISEMENT_ID';
```

## 🎉 Wskazówki

1. **Uruchamiaj po małych grupach** - zacznij od 2-3 ogłoszeń
2. **Sprawdzaj rezultaty** - po każdej sesji sprawdź czy wszystko wygląda dobrze
3. **Ręczne poprawki** - możesz ręcznie poprawić ogłoszenia w Vinted po automatyzacji
4. **Backup bazy** - zrób backup przed pierwszym uruchomieniem

---
*Automatyzacja stworzona dla ułatwienia publikacji ogłoszeń na Vinted*
