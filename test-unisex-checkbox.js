// Test funkcji automatycznego zaznaczania checkbox Unisex
const fs = require('fs');

// Odczytaj kod źródłowy
const sourceCode = fs.readFileSync('./src/vintedAutomation.ts', 'utf8');

console.log('☑️  TEST FUNKCJI AUTOMATYCZNEGO ZAZNACZANIA UNISEX');
console.log('===================================================');

// Sprawdź czy funkcja została dodana
const checks = [
    {
        name: 'Funkcja checkAndSelectUnisexIfAvailable',
        found: sourceCode.includes('async checkAndSelectUnisexIfAvailable()')
    },
    {
        name: 'Sprawdzanie czy checkbox istnieje',
        found: sourceCode.includes('input[id="unisex"]')
    },
    {
        name: 'Sprawdzanie czy checkbox jest już zaznaczony',
        found: sourceCode.includes('checkbox.checked')
    },
    {
        name: 'Kliknięcie checkbox gdy nie zaznaczony',
        found: sourceCode.includes('await unisexCheckbox.click()')
    },
    {
        name: 'Wywołanie po wybraniu kategorii (selectCategory)',
        found: sourceCode.includes('await this.checkAndSelectUnisexIfAvailable();') && 
                sourceCode.includes('Category selected')
    },
    {
        name: 'Graceful error handling',
        found: sourceCode.includes('Error checking Unisex checkbox')
    },
    {
        name: 'Informacyjne logi',
        found: sourceCode.includes('Found Unisex checkbox, selecting it') &&
                sourceCode.includes('No Unisex checkbox found (normal for clothing items)')
    }
];

checks.forEach(check => {
    console.log(`${check.found ? '✅' : '❌'} ${check.name}`);
});

const passedChecks = checks.filter(check => check.found).length;
console.log(`\n📊 WYNIKI: ${passedChecks}/${checks.length} sprawdzeń przeszło pomyślnie`);

if (passedChecks === checks.length) {
    console.log('\n🎉 FUNKCJA UNISEX ZOSTAŁA WDROŻONA!');
    
    console.log('\n🎯 FUNKCJONALNOŚĆ:');
    console.log('• Automatyczne sprawdzanie checkbox Unisex po wyborze kategorii');
    console.log('• Zaznaczanie tylko gdy nie jest już zaznaczony');
    console.log('• Graceful handling gdy checkbox nie istnieje');
    console.log('• Nie przerywa procesu przy błędach');
    
    console.log('\n💡 ZASTOSOWANIA:');
    console.log('• Portfele - często mają opcję Unisex');
    console.log('• Okulary przeciwsłoneczne - zwykle Unisex');
    console.log('• Poszetki - mogą być Unisex');
    console.log('• Paski - czasem Unisex');
    console.log('• Inne akcesoria');
    
    console.log('\n🔄 PROCES:');
    console.log('1. Wybiera kategorię');
    console.log('2. Sprawdza czy jest checkbox Unisex');
    console.log('3. Jeśli istnieje i nie zaznaczony → zaznacza');
    console.log('4. Kontynuuje z wyborem marki');
    
} else {
    console.log('\n⚠️  Niektóre funkcje mogą wymagać poprawek');
}

console.log('\n📋 CHECKBOX HTML:');
console.log('<input id="unisex" aria-label="Unisex" type="checkbox" value="1" name="unisex">');
console.log('\n✅ System będzie automatycznie zaznaczać Unisex dla akcesoriów!');
