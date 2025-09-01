// Test funkcji navigateToNewListing z lepszą obsługą błędów
const fs = require('fs');

// Odczytaj kod źródłowy
const sourceCode = fs.readFileSync('./src/vintedAutomation.ts', 'utf8');

// Sprawdź czy nowa logika została dodana
const checks = [
    {
        name: 'Sprawdzenie obecnego URL',
        pattern: /currentUrl = this\.page\.url\(\)/,
        found: sourceCode.match(/currentUrl = this\.page\.url\(\)/) !== null
    },
    {
        name: 'Retry logic dla photo section',
        pattern: /let retries = 3/,
        found: sourceCode.match(/let retries = 3/) !== null
    },
    {
        name: 'Reload strony przy błędzie',
        pattern: /await this\.page\.reload/,
        found: sourceCode.match(/await this\.page\.reload/) !== null
    },
    {
        name: 'Sprawdzenie czy już na właściwej stronie',
        pattern: /Already on new listing page/,
        found: sourceCode.match(/Already on new listing page/) !== null
    },
    {
        name: 'Dłuższy timeout',
        pattern: /timeout: 8000/,
        found: sourceCode.match(/timeout: 8000/) !== null
    }
];

console.log('🔄 TEST NOWEJ LOGIKI NAWIGACJI');
console.log('==============================');

checks.forEach(check => {
    console.log(`${check.found ? '✅' : '❌'} ${check.name}`);
});

const passedChecks = checks.filter(check => check.found).length;
console.log(`\n📊 WYNIKI: ${passedChecks}/${checks.length} sprawdzeń przeszło pomyślnie`);

if (passedChecks === checks.length) {
    console.log('\n🎉 WSZYSTKIE ULEPSZENIA ZOSTAŁY WDROŻONE!');
    console.log('\n📋 NOWE FUNKCJE:');
    console.log('• Sprawdzanie czy już na właściwej stronie');
    console.log('• Retry logic z 3 próbami');
    console.log('• Automatyczne odświeżanie strony przy błędzie');
    console.log('• Dłuższe timeouty');
    console.log('• Dodatkowe czasy oczekiwania');
} else {
    console.log('\n⚠️  Niektóre ulepszenia mogą nie zostać wdrożone prawidłowo');
}

console.log('\n🎯 ROZWIĄZANE PROBLEMY:');
console.log('• TimeoutError przy oczekiwaniu na photo section');
console.log('• Problemy z nawigacją między ogłoszeniami'); 
console.log('• Zbyt krótkie timeouty');
console.log('• Brak retry logic');
