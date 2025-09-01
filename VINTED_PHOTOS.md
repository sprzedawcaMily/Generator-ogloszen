# Vinted Automation - Upload Zdjęć

## 🎯 **NOWA FUNKCJA: Automatyczny Upload Zdjęć!**

Aplikacja automatycznie pobiera zdjęcia z bazy danych i uploading je na Vinted.

## 🔄 **Jak to działa:**

1. **Pobiera URL-e zdjęć** z bazy danych Supabase
2. **Downloaduje zdjęcia** z URL-ów i zapisuje lokalnie
3. **Znajduje input file** na stronie Vinted
4. **Uploading zdjęcia** przez file input
5. **Czyści pliki tymczasowe** po zakończeniu

## 📊 **Struktura danych w bazie:**

```typescript
interface Advertisement {
    id: number;
    title: string;
    description: string;
    price: number;
    photos: string[];      // ← Array URL-ów zdjęć
    is_completed: boolean;
    created_at: string;
}
```

## 🚀 **Uruchamianie:**

### Sposób 1: Pełna automatyzacja
```bash
# 1. Uruchom Chrome z debug
bun run chrome-debug

# 2. Zaloguj się na Vinted
# 3. Uruchom automatyzację
bun run vinted-existing
```

### Sposób 2: Test upload zdjęć
```bash
bun run test-photos
```

### Sposób 3: Debug elementów upload
```bash
bun run debug-photos
```

## 🔧 **Supported formaty zdjęć:**
- JPG/JPEG
- PNG
- WebP
- GIF (statyczne)

## 📋 **Limity:**
- Maksymalnie **10 zdjęć** na ogłoszenie (limit Vinted)
- Maksymalny rozmiar: **20MB** na zdjęcie
- Obsługiwane rozdzielczości: do **4000x4000px**

## 🛠️ **Jak działa upload:**

### Krok 1: Pobieranie zdjęć
```typescript
// Z bazy danych:
photos: [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.png",
    "https://example.com/photo3.webp"
]

// Pobrane lokalnie do:
temp/photos/photo_1693929600000_1.jpg
temp/photos/photo_1693929600000_2.png
temp/photos/photo_1693929600000_3.webp
```

### Krok 2: Upload na Vinted
1. Znajdź przycisk "Dodaj zdjęcia"
2. Kliknij żeby odsłonić `input[type="file"]`
3. Użyj `uploadFile()` do przesłania plików
4. Czekaj na przetworzenie przez Vinted

### Krok 3: Weryfikacja
- Sprawdź czy zdjęcia się pojawiły na stronie
- Liczba uploaded zdjęć vs oczekiwana

## 🔍 **Debug & Troubleshooting:**

### Problem: "File input not found"
```bash
# Uruchom debug elementów:
bun run debug-photos
```
To pokaże wszystkie dostępne inputy i przyciski.

### Problem: "Photos not uploading"
1. Sprawdź format zdjęć (JPG/PNG/WebP)
2. Sprawdź rozmiar plików (<20MB)
3. Sprawdź czy URL-e zdjęć są dostępne
4. Spróbuj ręcznie upload 1 zdjęcia na Vinted

### Problem: "Download failed"
- URL zdjęcia może być nieprawidłowy
- Serwer może blokować automated pobieranie
- Sprawdź połączenie internetowe

## 💡 **Wskazówki:**

### ✅ Dobre praktyki:
- **Używaj wysokiej jakości zdjęć** (min. 800x800px)
- **Pierwszy obrazek = zdjęcie główne** (najważniejsze!)
- **Różne kąty produktu** (przód, tył, detale)
- **Czyste tło** (białe lub neutralne)
- **Dobre oświetlenie** (naturalne światło)

### ❌ Unikaj:
- Rozmazanych zdjęć
- Watermarków
- Zdjęć z innych stron (copyright)
- Zbyt małych rozdzielczości
- Nieodpowiednich formatów

## 🧪 **Testowanie:**

### Test z przykładowymi zdjęciami:
```sql
-- Dodaj do bazy testowe ogłoszenie:
INSERT INTO advertisements (title, description, photos) VALUES (
    'Test Product',
    'Test description',
    ARRAY[
        'https://picsum.photos/800/600?random=1',
        'https://picsum.photos/800/600?random=2',
        'https://picsum.photos/800/600?random=3'
    ]
);
```

### Sprawdź logi:
- `📥 Downloading image: photo_xxx.jpg`
- `✅ Downloaded: photo_xxx.jpg`
- `📤 Uploading photos...`
- `✅ Photos uploaded successfully!`

## 📈 **Monitoring:**

Aplikacja loguje:
- Liczbę pobranych zdjęć
- Sukces/błąd każdego downloadu
- Znalezione elementy input
- Status uploadu
- Liczbę zdjęć na stronie po uploadzie

## 🎯 **PODSUMOWANIE:**

**Automatyzacja zdjęć jest w pełni funkcjonalna!** 🔥

1. ✅ **Pobiera** zdjęcia z URL-ów
2. ✅ **Uploading** na Vinted  
3. ✅ **Czyści** pliki tymczasowe
4. ✅ **Debug tools** do diagnozowania
5. ✅ **Error handling** i retry logic

**Teraz automatyzacja Vinted jest kompletna!** 🎉
