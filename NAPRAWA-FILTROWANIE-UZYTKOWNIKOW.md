# Naprawa filtrowania hashtagów po użytkowniku

## Problem
Aplikacja pobierała hashtagi (style_templates) i nagłówki opisów (description_headers) od **wszystkich użytkowników** zamiast tylko z konta zalogowanego użytkownika.

## Rozwiązanie
Dodano filtrowanie po `user_id` do następujących funkcji:

### Zmienione pliki:

1. **src/supabaseFetcher.ts**
   - `fetchStyles(userId?: string)` - dodano parametr userId i filtrowanie
   - `fetchStyleByType(productType: string, userId?: string)` - dodano parametr userId
   - `fetchDescriptionHeaders(platform?: string, userId?: string)` - dodano parametr userId

2. **src/server.ts**
   - Endpoint `/api/styles` - przekazuje userId z sesji
   - Endpoint `/api/styles/:type` - przekazuje userId z sesji
   - Endpoint `/api/description-headers` - przekazuje userId z sesji

3. **src/grailedAutomation.ts**
   - Dodano pole `private userId?: string` do klasy
   - Metoda `startWithExistingBrowser()` zapisuje userId
   - Metoda `generateDescription()` przyjmuje userId i przekazuje do fetch funkcji

4. **src/vintedAutomation.ts**
   - Dodano pole `private userId?: string` do klasy
   - Metoda `startWithExistingBrowser()` zapisuje userId
   - Metoda `start()` zapisuje userId
   - Metoda `generateDescription()` przyjmuje userId i przekazuje do fetch funkcji

## Wynik
✅ Każdy użytkownik widzi **tylko swoje** hashtagi i style
✅ Aplikacja automatycznie filtruje dane po user_id z sesji
✅ Kompatybilność wsteczna zachowana (userId jest opcjonalny)

## Testowanie
Po zalogowaniu się, użytkownik powinien widzieć tylko swoje:
- Style (hashtagi)
- Nagłówki opisów
- Nie widzi danych innych użytkowników

## Data naprawy
17 listopada 2025
