# Vinted Automation - Instrukcja Użytkowania

## 🚀 Uruchamianie

Aby uruchomić automatyzację Vinted, użyj jednej z poniższych metod:

### Metoda 1: Przez npm script
```bash
bun run vinted
```

### Metoda 2: Przez plik startowy
```bash
bun run start-vinted.ts
```

### Metoda 3: Bezpośrednio
```bash
bun run src/vintedAutomation.ts
```

## 📋 Co robi aplikacja

1. **Nawigacja**: Przechodzi na stronę Vinted
   - Najpierw na: `https://www.vinted.pl/member/signup/select_type?ref_url=%2Finbox%2F17795503237%3Fsource%3Dinbox`
   - Potem na: `https://www.vinted.pl/member`

2. **Klik "Sprzedaj"**: Znajduje i klika przycisk "Sprzedaj" z linkiem `/items/new`

3. **Dodawanie zdjęć**: Klika przycisk "Dodaj zdjęcia"

4. **Wypełnianie danych**:
   - Wypełnia pole tytułu (`input#title[data-testid="title--input"]`)
   - Wypełnia pole opisu (`textarea#description[data-testid="description--input"]`)

5. **Dane z bazy**: Pobiera ogłoszenia z bazy danych Supabase

## ⚠️ Wymagania

1. **Zalogowanie**: Musisz być zalogowany na Vinted przed uruchomieniem
2. **Puppeteer**: Aplikacja otwiera przeglądarkę Chrome w trybie widocznym
3. **Baza danych**: Musi być skonfigurowana baza Supabase z tablicą `advertisements`

## 🔧 Konfiguracja

### Struktura ogłoszenia w bazie danych:
```typescript
interface Advertisement {
    id: number;
    title: string;
    description: string;
    price: number;
    photos: string[];
    is_completed: boolean;
    created_at: string;
}
```

## 📁 Pliki

- `src/vintedAutomation.ts` - Główna logika automatyzacji
- `start-vinted.ts` - Plik startowy z instrukcjami
- `src/supabaseFetcher.ts` - Pobieranie danych z bazy

## 🎯 Następne kroki

Po uruchomieniu podstawowej wersji, możesz rozszerzyć funkcjonalność o:
- Upload zdjęć z lokalnych plików
- Wypełnianie ceny
- Wybór kategorii
- Wybór marki
- Ustawienia dostawy
- Automatyczne publikowanie
- Pętla dla wielu ogłoszeń

## 🐛 Troubleshooting

### Problem: Przeglądarka nie otwiera się
- Sprawdź czy masz zainstalowany Chrome
- Sprawdź czy Puppeteer jest poprawnie zainstalowany: `bun add puppeteer`

### Problem: Nie znajduje przycisków
- Upewnij się że jesteś zalogowany na Vinted
- Sprawdź czy strona się w pełni załadowała
- Vinted może zmienić selektory - wtedy trzeba będzie je zaktualizować

### Problem: Błędy bazy danych
- Sprawdź konfigurację Supabase w `src/supabaseClient.ts`
- Upewnij się że tabela `advertisements` istnieje
