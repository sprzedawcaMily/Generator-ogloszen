# Generator Ogłoszeń

Aplikacja służąca do generowania ogłoszeń z gotowymi szablonami i formatowaniem. Wspiera automatyczne formatowanie tekstu, obsługę różnych rodzajów produktów oraz akcesoriów.

## Funkcje

- Automatyczne formatowanie tytułów i opisów
- Obsługa różnych typów produktów (ubrania, akcesoria)
- Automatyczne dodawanie wymiarów dla ubrań
- Uniwersalny rozmiar dla akcesoriów
- Generowanie tagów dla ogłoszeń
- Kopiowanie gotowych ogłoszeń do schowka

## Technologie

- Bun.js
- TypeScript
- HTML/CSS

## Instalacja

1. Zainstaluj [Bun](https://bun.sh/):
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Sklonuj repozytorium:
```bash
git clone [URL_REPOZYTORIUM]
cd Aplikacja-do-wstawiania-ogloszen
```

3. Zainstaluj zależności:
```bash
bun install
```

4. Uruchom aplikację:
```bash
bun run dev
```

Aplikacja będzie dostępna pod adresem: http://localhost:3001

## Użycie

1. Wprowadź tekst ogłoszenia w formacie:
```
[nazwa produktu] size [rozmiar] [stan]
[wymiary w formacie: p XX d XX s XX u XX n XX]
```

2. Kliknij przycisk generowania ogłoszenia
3. Skopiuj wygenerowane ogłoszenie do schowka

## Licencja

MIT
