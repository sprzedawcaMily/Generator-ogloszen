# Aplikacja do Ogłoszeń - Budowanie APK

## Przygotowanie aplikacji mobilnej

Aplikacja została przekonwertowana z aplikacji webowej na aplikację mobilną używając Expo/React Native.

## Struktura aplikacji

- `App.js` - główny komponent aplikacji z interfejsem do tworzenia ogłoszeń
- `app.json` - konfiguracja aplikacji Expo
- `eas.json` - konfiguracja buildowania dla EAS Build
- `babel.config.js` - konfiguracja Babel dla Expo

## Funkcjonalności

- Tworzenie ogłoszeń z tytułem, opisem i ceną
- Dodawanie zdjęć do ogłoszeń
- Responsywny interfejs mobilny
- Walidacja formularzy

## Budowanie APK dla Google Play Store

### Krok 1: Logowanie do Expo
```bash
npx eas login
```

### Krok 2: Inicjalizacja projektu EAS
```bash
npx eas init
```

### Krok 3: Budowanie APK
```bash
# APK (Android Package)
npx eas build --platform android --profile production-apk

# AAB (Android App Bundle) - preferowany przez Google Play
npx eas build --platform android --profile production
```

### Profile buildowania

- `development` - APK do testowania z Expo dev client
- `preview` - APK do testowania wewnętrznego
- `production` - AAB do publikacji w Google Play Store
- `production-apk` - APK do publikacji w Google Play Store

## Wymagania

- Konto Expo (bezpłatne)
- Podpisanie aplikacji będzie automatycznie zarządzane przez EAS Build
- Google Play Console do publikacji

## Po zbudowaniu

1. Pobierz plik APK/AAB z linku otrzymanego od EAS Build
2. Przejdź do Google Play Console
3. Utwórz nową aplikację lub wersję
4. Prześlij plik APK/AAB
5. Wypełnij wymagane metadane (opisy, zrzuty ekranu, itp.)
6. Opublikuj aplikację

## Następne kroki

- Dodaj ikony aplikacji (`assets/icon.png`, `assets/adaptive-icon.png`)
- Dodaj splash screen (`assets/splash.png`)
- Skonfiguruj store listing w Google Play Console
- Dodaj zrzuty ekranu aplikacji
- Ustaw kategorię aplikacji i rating

## Debugging

Jeśli wystąpią problemy:
```bash
npx expo-doctor  # Sprawdź konfigurację projektu
npx eas build:list  # Zobacz historię buildów
```