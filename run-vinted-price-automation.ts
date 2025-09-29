#!/usr/bin/env bun

// Skrypt do uruchamiania automatyzacji zmiany cen Vinted
import { runVintedPriceAutomationWithExistingBrowser } from './src/vintedPriceAutomation';

console.log('🏷️ ===================================');
console.log('   AUTOMATYZACJA ZMIANY CEN VINTED');
console.log('===================================');
console.log('');
console.log('📋 Ta automatyzacja:');
console.log('   • Automatycznie wykrywa Twój profil');
console.log('   • Przechodzi przez wszystkie Twoje ogłoszenia');
console.log('   • Obniża ceny o 25%');
console.log('   • Automatycznie zapisuje zmiany');
console.log('');
console.log('⚠️  WYMAGANIA:');
console.log('   • Chrome musi być uruchomiony z --remote-debugging-port=9222');
console.log('   • Musisz być zalogowany na Vinted');
console.log('   • Twoje ogłoszenia muszą być widoczne na profilu');
console.log('');
console.log('💡 INSTRUKCJA:');
console.log('   1. Uruchom Chrome z --remote-debugging-port=9222');
console.log('   2. Zaloguj się na Vinted');
console.log('   3. Przejdź do swojego profilu');
console.log('   4. Uruchom ten skrypt');
console.log('');
console.log('💡 JEŚLI AUTOMATYCZNE WYKRYWANIE NIE DZIAŁA:');
console.log('   1. Skopiuj URL swojego profilu (np. https://www.vinted.pl/member/12345)');
console.log('   2. Uruchom: bun run run-vinted-price-automation.ts "SKOPIOWANY_URL"');
console.log('');

// Pobierz URL profilu z argumentów (opcjonalnie)
const profileUrl = process.argv[2];

if (profileUrl) {
    console.log(`🔗 Używam podanego URL profilu: ${profileUrl}`);
} else {
    console.log('🔍 Automatyczne wykrywanie profilu zalogowanego użytkownika...');
}
console.log('');
console.log('▶️  Rozpoczynam automatyzację...');
console.log('');

// Uruchom automatyzację
runVintedPriceAutomationWithExistingBrowser(profileUrl)
    .then(() => {
        console.log('✅ Automatyzacja cen zakończona pomyślnie!');
    })
    .catch((error) => {
        console.error('❌ Automatyzacja cen nie powiodła się:', error);
        process.exit(1);
    });