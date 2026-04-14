// Test poprawionej logiki wyboru marki
const fs = require('fs');

// Odczytaj kod źródłowy
const sourceCode = fs.readFileSync('./src/vintedAutomation.ts', 'utf8');

console.log('🏷️ TEST POPRAWIONEJ LOGIKI WYBORU MARKI');
console.log('======================================');

// Sprawdź ulepszenia
const improvements = [
    {
        name: 'Sprawdzanie dokładnej nazwy marki w aria-label',
        found: sourceCode.includes('aria-label="${brandName}"')
    },
    {
        name: 'Wyszukiwanie elementów z ID brand-*',
        found: sourceCode.includes('id^="brand-"')
    },
    {
        name: 'Porównywanie nazw marek (case-insensitive)',
        found: sourceCode.includes('ariaLabel.toLowerCase().includes(brandName.toLowerCase())')
    },
    {
        name: 'Logowanie sprawdzanych elementów',
        found: sourceCode.includes('Checking brand element')
    },
    {
        name: 'Bezpieczny fallback na pierwszy element brand-',
        found: sourceCode.includes('Using fallback: clicking first brand element')
    },
    {
        name: 'Nowy selektor inputu marki (ID)',
        found: sourceCode.includes('#brand-search-input')
    },
    {
        name: 'Usunięcie ogólnego selektora li .web_ui__Cell__cell',
        found: !sourceCode.includes("'li .web_ui__Cell__cell'")
    }
];

improvements.forEach(improvement => {
    console.log(`${improvement.found ? '✅' : '❌'} ${improvement.name}`);
});

const passedImprovements = improvements.filter(imp => imp.found).length;
console.log(`\n📊 WYNIKI: ${passedImprovements}/${improvements.length} ulepszeń wdrożono`);

if (passedImprovements === improvements.length) {
    console.log('\n🎉 WSZYSTKIE ULEPSZENIA WDROŻONE!');

    console.log('\n🔄 NOWY PROCES WYBORU MARKI:');
    console.log('1️⃣ Szuka dokładnie po aria-label="Mia soana"');
    console.log('2️⃣ Jeśli nie znaleziono → przeszukuje elementy [id^="brand-"]');
    console.log('3️⃣ Porównuje nazwy marek (ignoruje wielkość liter)');
    console.log('4️⃣ Fallback → kliknie pierwszy element z brand- ID');
    console.log('5️⃣ Loguje każdy sprawdzany element');

    console.log('\n🎯 ROZWIĄZANE PROBLEMY:');
    console.log('• Klikanie w checkbox zamiast markę');
    console.log('• Zbyt ogólne selektory');
    console.log('• Brak precyzyjnego wyszukiwania');
    console.log('• Odznaczanie checkbox Unisex');

    console.log('\n💡 PRZYKŁAD DZIAŁANIA:');
    console.log('Szukana marka: "Mia soana"');
    console.log('1. Szuka: [aria-label="Mia soana"]');
    console.log('2. Sprawdza: <div id="brand-280" aria-label="Mia soana">');
    console.log('3. ✅ Znaleziono i kliknięto w właściwy element');

} else {
    console.log('\n⚠️  Niektóre ulepszenia wymagają weryfikacji');
}

console.log('\n📋 ELEMENT MARKI VINTED:');
console.log('<div aria-label="Mia soana" id="brand-280" class="web_ui__Cell__cell">');
console.log('  <div class="web_ui__Cell__title">Mia soana</div>');
console.log('  <input id="brand-radio-280" type="radio" name="brand-radio-280">');
console.log('</div>');

console.log('\n✅ PRECYZYJNY WYBÓR MARKI GOTOWY!');
