// Test ulepszonego wyboru rozmiarów butów
console.log('👟 ULEPSZENIA WYBORU ROZMIARÓW BUTÓW');
console.log('====================================');

console.log('\n❌ PROBLEM Z LOGA:');
console.log('• Rozmiar: "48.5" (buty)');
console.log('• Dropdown się otwiera: ✅');
console.log('• Znalezione elementy: 0 size elements');
console.log('• Radio buttons: próbuje, ale nie znajduje');
console.log('• Rezultat: rozmiar nie wybrany');

console.log('\n🔍 ANALIZA PRZYCZYN:');
console.log('====================');
console.log('1. ✅ Mapowanie działa: "48.5" → ["48.5", "48,5"]');
console.log('2. ❓ Selektor li .web_ui__Cell__cell[id^="size-"] nie znajduje elementów');
console.log('3. ❓ Elementy mogą mieć inną strukturę dla butów');
console.log('4. ❓ Timing - dropdown nie zdążył się załadować');

console.log('\n✅ NOWE ULEPSZENIA:');
console.log('===================');

console.log('\n🔧 1. ROZSZERZONE DEBUGOWANIE:');
console.log('• Lista wszystkich elementów z "size" w ID');
console.log('• Liczba elementów dla każdej metody');
console.log('• Szczegółowe logowanie każdej próby');
console.log('• Lista dostępnych rozmiarów na końcu');

console.log('\n🔍 2. TRZY METODY WYSZUKIWANIA:');
console.log('Metoda 1: li .web_ui__Cell__cell[id^="size-"]');
console.log('Metoda 2: [id^="size-"] (prostszy selektor)');
console.log('Metoda 3: Wyszukiwanie przez textContent w DOM');

console.log('\n🔘 3. ULEPSZONE RADIO BUTTONS:');
console.log('• Dodatkowe logowanie liczby radio buttons');
console.log('• Lepsze sprawdzanie labelText');
console.log('• Obsługa błędów przy .catch()');

console.log('\n📊 4. PRZYKŁAD DEBUGOWANIA:');
console.log('==========================');
console.log('🔍 Debug - found elements with "size" in id:');
console.log('[');
console.log('  { id: "size", tagName: "INPUT", textContent: "" },');
console.log('  { id: "size-1", tagName: "DIV", textContent: "38" },');
console.log('  { id: "size-2", tagName: "DIV", textContent: "38,5" },');
console.log('  { id: "size-15", tagName: "DIV", textContent: "48,5" },');
console.log('  { id: "size-16", tagName: "DIV", textContent: "49" }');
console.log(']');

console.log('\n🎯 PRZEWIDYWANY PROCES:');
console.log('=======================');
const steps = [
    '1. Kliknij dropdown rozmiaru',
    '2. Czekaj 1.5s na załadowanie',
    '3. Debug: znajdź wszystkie elementy z "size"',
    '4. Metoda 1: Użyj li .web_ui__Cell__cell[id^="size-"]',
    '5. Metoda 2: Użyj [id^="size-"]',
    '6. Metoda 3: Szukaj przez textContent("48,5")',
    '7. Radio buttons: aria-labelledby*="size-"',
    '8. Jeśli nie znaleziono → pokaż dostępne rozmiary',
    '9. SUCCESS: Kliknij element z "48,5"'
];

steps.forEach((step, i) => {
    console.log(`   ${step}`);
});

console.log('\n💡 BACKUP PLAN - jeśli nadal nie działa:');
console.log('🔍 Available size options found:');
console.log('   1. "38" (id: size-1, tag: DIV)');
console.log('   2. "38,5" (id: size-2, tag: DIV)');
console.log('   3. "39" (id: size-3, tag: DIV)');
console.log('   ...');
console.log('   15. "48,5" (id: size-15, tag: DIV) ← SZUKANY');
console.log('   16. "49" (id: size-16, tag: DIV)');

console.log('\n🎉 OCZEKIWANE REZULTATY:');
console.log('========================');
console.log('✅ System znajdzie elementy rozmiaru');
console.log('✅ Rozpozna "48,5" jako dopasowanie dla "48.5"');
console.log('✅ Kliknie właściwy element');
console.log('✅ Rozmiar zostanie wybrany');

console.log('\n🚀 SYSTEM GOTOWY NA KOLEJNY TEST!');
console.log('Jeśli nadal nie działa, debug pokaże dokładnie');
console.log('jakie rozmiary są dostępne do ręcznego wyboru.');
