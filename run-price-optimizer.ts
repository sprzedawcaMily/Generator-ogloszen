#!/usr/bin/env bun

import { runPriceOptimization } from './src/priceOptimizer';

console.log('🎯 Vinted Price Optimizer');
console.log('========================');
console.log('');
console.log('📋 WYMAGANIA:');
console.log('   🔵 Chrome musi być uruchomiony z debug portem');
console.log('   ✅ Musisz być zalogowany na Vinted w tej przeglądarce');
console.log('');
console.log('💡 SZYBKIE URUCHOMIENIE:');
console.log('   1. Uruchom: bun run chrome');
console.log('   2. Zaloguj się na Vinted');
console.log('   3. Uruchom: bun run price-optimizer');
console.log('');

async function main() {
    try {
        await runPriceOptimization();
    } catch (error) {
        console.error('❌ Błąd:', error);
        process.exit(1);
    }
}

// Uruchom optymalizator
main().catch(console.error);
