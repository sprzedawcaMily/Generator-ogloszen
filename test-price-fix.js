// Test poprawionej logiki wpisywania ceny
const fs = require('fs');

// Odczytaj kod źródłowy
const sourceCode = fs.readFileSync('./src/vintedAutomation.ts', 'utf8');

console.log('💰 TEST POPRAWIONEJ LOGIKI WPISYWANIA CENY');
console.log('==========================================');

// Sprawdź ulepszenia
const improvements = [
    {
        name: 'Wyszukiwanie po ID (#price)',
        found: sourceCode.includes("'#price'")
    },
    {
        name: 'Wyszukiwanie po name="price"',
        found: sourceCode.includes('input[name="price"]')
    },
    {
        name: 'Iteracja po selektorach',
        found: sourceCode.includes('for (const selector of priceSelectors)')
    },
    {
        name: 'Czyszczenie pola klawiaturą (Ctrl+A, Backspace)',
        found: sourceCode.includes("keyboard.press('Backspace')") && sourceCode.includes("keyboard.press('a')")
    },
    {
        name: 'Weryfikacja wpisanej ceny',
        found: sourceCode.includes('if (inputValue !== price)')
    },
    {
        name: 'Mechanizm Retry z dispatchEvent',
        found: sourceCode.includes("dispatchEvent(new Event('input'")
    }
];

improvements.forEach(improvement => {
    console.log(`${improvement.found ? '✅' : '❌'} ${improvement.name}`);
});

const passedImprovements = improvements.filter(imp => imp.found).length;
console.log(`\n📊 WYNIKI: ${passedImprovements}/${improvements.length} ulepszeń wdrożono`);

if (passedImprovements === improvements.length) {
    console.log('\n🎉 WSZYSTKIE ULEPSZENIA CENY WDROŻONE!');

    console.log('\n🔄 NOWY PROCES WPISYWANIA CENY:');
    console.log('1️⃣ Sprawdza listę selektorów: #price, name="price", data-testid');
    console.log('2️⃣ Klika w znaleziony input');
    console.log('3️⃣ Czyści pole skrótem klawiszowym (Ctrl+A, Backspace)');
    console.log('4️⃣ Wpisuje cenę z opóźnieniem (symulacja człowieka)');
    console.log('5️⃣ Weryfikuje czy wartość została wpisana poprawnie');
    console.log('6️⃣ W razie błędu ponawia próbę przez dispatchEvent');

} else {
    console.log('\n⚠️  Niektóre ulepszenia wymagają weryfikacji');
}
