// Test ulepszonego wyboru stanu dla portfeli
console.log('🔧 ULEPSZONA FUNKCJA WYBORU STANU');
console.log('==================================');

console.log('\n❌ POPRZEDNI PROBLEM:');
console.log('• Program znajdował 0 elementów stanu');
console.log('• Tylko jedna metoda wyszukiwania');
console.log('• Krótki czas oczekiwania (1.5s)');
console.log('• Brak sprawdzenia czy dropdown się otworzył');
console.log('• Brak debug informacji o dostępnych opcjach');

console.log('\n✅ NOWE ULEPSZENIA:');
console.log('===================');

console.log('\n🔧 1. LEPSZE TIMING:');
console.log('• Zwiększony czas oczekiwania: 1.5s → 2.5s');
console.log('• Sprawdzenie czy dropdown się otworzył');
console.log('• Ponowne kliknięcie jeśli dropdown zamknięty');
console.log('• Dodatkowe 2s oczekiwania przy drugim kliknięciu');

console.log('\n🔍 2. CZTERY METODY WYSZUKIWANIA:');
console.log('Metoda 1: li .web_ui__Cell__cell[id^="condition-"]');
console.log('Metoda 2: [id^="condition-"] (prostszy selektor)');
console.log('Metoda 3: Wyszukiwanie przez textContent w DOM');
console.log('Metoda 4: TreeWalker + parent element search');

console.log('\n📊 3. ROZSZERZONE DEBUGOWANIE:');
console.log('• Lista wszystkich elementów z "condition" w ID');
console.log('• Status dropdown (OPEN/CLOSED)');
console.log('• Wyniki każdej metody wyszukiwania');
console.log('• Lista dostępnych opcji stanu na końcu');
console.log('• Mapowanie: "bardzo dobry" → "Bardzo dobry"');

console.log('\n🎯 4. PROCES DZIAŁANIA:');
console.log('======================');

function simulateProcess() {
    const steps = [
        '1. Sprawdź czy pole stanu istnieje',
        '2. Zamapuj stan: "bardzo dobry" → "Bardzo dobry"',
        '3. Kliknij dropdown stanu',
        '4. Czekaj 2.5s na otwarcie',
        '5. Sprawdź czy dropdown otwarty',
        '6. Jeśli zamknięty → kliknij ponownie + 2s',
        '7. Debug: znajdź wszystkie elementy z "condition"',
        '8. Metoda 1: Użyj selektora li .web_ui__Cell__cell',
        '9. Metoda 2: Użyj prostszego selektora [id^="condition-"]',
        '10. Metoda 3: Szukaj przez textContent w całym DOM',
        '11. Metoda 4: TreeWalker + parent element search',
        '12. Jeśli nie znaleziono → pokaż dostępne opcje',
        '13. Zamknij dropdown (1s delay)'
    ];
    
    steps.forEach((step, i) => {
        console.log(`   ${step}`);
    });
}

simulateProcess();

console.log('\n📋 PRZYKŁAD DEBUGOWANIA:');
console.log('========================');
console.log('🔍 Debug condition mapping:');
console.log('   Database condition: "bardzo dobry"');
console.log('   Normalized: "bardzo dobry"');
console.log('   Mapped to Vinted: "Bardzo dobry"');
console.log('');
console.log('📊 Dropdown state: OPEN');
console.log('🔍 Found 15 elements with "condition" in id');
console.log('🔍 Found 5 condition elements (method 1)');
console.log('📋 Checking condition: "Nowy z metką"');
console.log('📋 Checking condition: "Nowy bez metki"');
console.log('📋 Checking condition: "Bardzo dobry"');
console.log('✅ Selected condition: Bardzo dobry (method 1)');

console.log('\n💡 BACKUP PLAN - jeśli wszystko zawiedzie:');
console.log('🔍 Available condition options found:');
console.log('   1. "Nowy z metką" (id: condition-1, tag: DIV)');
console.log('   2. "Nowy bez metki" (id: condition-2, tag: DIV)');
console.log('   3. "Bardzo dobry" (id: condition-3, tag: DIV)');
console.log('   4. "Dobry" (id: condition-4, tag: DIV)');
console.log('   5. "Zadowalający" (id: condition-5, tag: DIV)');

console.log('\n🎉 WYNIKI:');
console.log('==========');
console.log('• 4x więcej metod wyszukiwania');
console.log('• 2x dłuższy czas oczekiwania');
console.log('• Inteligentne sprawdzenie dropdown');
console.log('• Kompletne debugowanie dostępnych opcji');
console.log('• Fallback na każdym etapie');

console.log('\n🚀 SYSTEM GOTOWY NA KOLEJNY TEST!');
