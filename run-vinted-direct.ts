#!/usr/bin/env bun

import { VintedAutomation } from './src/vintedAutomation';

console.log('🚀 Starting Vinted automation directly...');
console.log('');
console.log('📋 WYMAGANIA:');
console.log('   🔵 Chrome musi być uruchomiony z debug portem');
console.log('   ✅ Musisz być zalogowany na Vinted w tej przeglądarce');
console.log('');
console.log('💡 SZYBKIE URUCHOMIENIE:');
console.log('   1. Uruchom: bun run chrome');
console.log('   2. Zaloguj się na Vinted');
console.log('   3. Uruchom: bun run direct');
console.log('');

async function runDirectAutomation() {
    const automation = new VintedAutomation();
    
    try {
        console.log('🔗 Próbuję połączyć z Chrome na porcie 9222...');
        
        // Próbuj połączyć bezpośrednio z istniejącym Chrome
        const connected = await automation.connectToExistingBrowser();
        
        if (!connected) {
            console.log('❌ Nie można połączyć z Chrome na porcie 9222');
            console.log('');
            console.log('🚀 URUCHOM CHROME:');
            console.log('1. Uruchom: bun run chrome');
            console.log('2. Zaloguj się na Vinted w otwartej przeglądarce');
            console.log('3. Uruchom ponownie: bun run direct');
            console.log('');
            return;
        }
        
        console.log('✅ Połączono z Chrome!');
        console.log('🚀 Rozpoczynam automatyzację Vinted...');
        
        // Uruchom główną automatyzację
        await automation.processAllAdvertisements();
        
        console.log('✅ Automatyzacja zakończona pomyślnie!');
        
    } catch (error) {
        if (error instanceof Error && error.message === 'CHROME_STARTED_PLEASE_LOGIN') {
            console.log('🎯 Chrome został uruchomiony. Zaloguj się i uruchom ponownie.');
        } else {
            console.log('❌ Błąd automatyzacji:', error);
        }
    }
}

// Uruchom automatyzację
runDirectAutomation().catch(console.error);
