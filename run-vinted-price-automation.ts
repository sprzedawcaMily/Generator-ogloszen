#!/usr/bin/env bun

// Skrypt do uruchamiania automatyzacji zmiany cen Vinted
import { runVintedPriceAutomationWithExistingBrowser } from './src/vintedPriceAutomation';

// Konfiguracja
const DEFAULT_PROFILE_URL = 'https://www.vinted.pl/member/130445339';

console.log('🏷️ ===================================');
console.log('   AUTOMATYZACJA ZMIANY CEN VINTED');
console.log('===================================');
console.log('');
console.log('📋 Ta automatyzacja:');
console.log('   • Przechodzi przez wszystkie Twoje ogłoszenia');
console.log('   • Obniża ceny o 25%');
console.log('   • Automatycznie zapisuje zmiany');
console.log('');
console.log('⚠️  WYMAGANIA:');
console.log('   • Chrome musi być uruchomiony z --remote-debugging-port=9222');
console.log('   • Musisz być zalogowany na Vinted');
console.log('   • Twoje ogłoszenia muszą być widoczne na profilu');
console.log('');

// Pobierz URL profilu z argumentów lub użyj domyślnego
const profileUrl = process.argv[2] || DEFAULT_PROFILE_URL;

console.log(`🔗 URL profilu: ${profileUrl}`);
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