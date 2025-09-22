# Skrypt do budowania APK dla Google Play Store
# 
# INSTRUKCJE:
# 1. Zaloguj się do Expo: npx eas login
# 2. Zainicjalizuj projekt EAS: npx eas init
# 3. Zbuduj APK produkcyjny: npx eas build --platform android --profile production-apk

Write-Host "🚀 Instrukcje do budowania APK dla Google Play Store" -ForegroundColor Green
Write-Host ""
Write-Host "Krok 1: Zaloguj się do Expo (jeśli jeszcze nie jesteś zalogowany)" -ForegroundColor Yellow
Write-Host "npx eas login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Krok 2: Zainicjalizuj projekt EAS (ustawi automatycznie Project ID)" -ForegroundColor Yellow
Write-Host "npx eas init" -ForegroundColor Cyan
Write-Host ""
Write-Host "Krok 3: Zbuduj APK produkcyjny do Google Play Store" -ForegroundColor Yellow
Write-Host "npx eas build --platform android --profile production-apk" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Po ukończeniu buildu:" -ForegroundColor Green
Write-Host "- Pobierz APK z linku który otrzymasz"
Write-Host "- APK będzie gotowy do przesłania do Google Play Console"
Write-Host "- Plik będzie miał odpowiedni keystore do publikacji" -ForegroundColor Magenta
Write-Host ""
Write-Host "💡 Alternatywnie, aby zbudować AAB (preferowany format Google Play):" -ForegroundColor Blue
Write-Host "npx eas build --platform android --profile production" -ForegroundColor Cyan