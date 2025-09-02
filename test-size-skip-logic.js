// Test logiki pomijania rozmiarów dla kategorii bez rozmiarów
function shouldSkipSize(rodzaj) {
    const categoriesWithoutSize = [
        'portfele', 'portfel', 'wallet',
        'poszetki', 'poszetka', 'pocket square',
        'krawaty i muszki', 'krawat', 'muszka', 'tie', 'bow tie',
        'okulary', 'sunglasses',
        'paski', 'pasek', 'belt',
        'chusty', 'chustki', 'szal', 'scarf'
    ];
    
    const rodzajLower = (rodzaj || '').toLowerCase();
    return categoriesWithoutSize.some(category => 
        rodzajLower.includes(category.toLowerCase())
    );
}

// Test cases dla kategorii bez rozmiarów
const testCases = [
    // Kategorii z rozmiarami (nie powinny być pomijane)
    { rodzaj: 'kurtka', shouldSkip: false },
    { rodzaj: 'spodnie', shouldSkip: false },
    { rodzaj: 'bluza', shouldSkip: false },
    { rodzaj: 'koszulka', shouldSkip: false },
    
    // Kategorii bez rozmiarów (powinny być pomijane)
    { rodzaj: 'Portfele', shouldSkip: true },
    { rodzaj: 'portfel', shouldSkip: true },
    { rodzaj: 'wallet', shouldSkip: true },
    { rodzaj: 'portfel skórzany', shouldSkip: true },
    { rodzaj: 'Poszetki', shouldSkip: true },
    { rodzaj: 'poszetka', shouldSkip: true },
    { rodzaj: 'pocket square', shouldSkip: true },
    { rodzaj: 'Krawaty i muszki', shouldSkip: true },
    { rodzaj: 'krawat', shouldSkip: true },
    { rodzaj: 'muszka', shouldSkip: true },
    { rodzaj: 'tie', shouldSkip: true },
    { rodzaj: 'bow tie', shouldSkip: true },
    { rodzaj: 'okulary', shouldSkip: true },
    { rodzaj: 'sunglasses', shouldSkip: true },
    { rodzaj: 'paski', shouldSkip: true },
    { rodzaj: 'pasek', shouldSkip: true },
    { rodzaj: 'belt', shouldSkip: true },
    { rodzaj: 'chusty', shouldSkip: true },
    { rodzaj: 'chustki', shouldSkip: true },
    { rodzaj: 'szal', shouldSkip: true },
    { rodzaj: 'scarf', shouldSkip: true }
];

console.log('📏 TEST LOGIKI POMIJANIA ROZMIARÓW');
console.log('==================================');

let correctCount = 0;
testCases.forEach(testCase => {
    const result = shouldSkipSize(testCase.rodzaj);
    const isCorrect = result === testCase.shouldSkip;
    
    console.log(`${isCorrect ? '✅' : '❌'} "${testCase.rodzaj}" → ${result ? 'POMIJAJ ROZMIAR' : 'WYBIERZ ROZMIAR'} (expected: ${testCase.shouldSkip ? 'POMIJAJ' : 'WYBIERZ'})`);
    
    if (isCorrect) correctCount++;
});

console.log(`\n📊 WYNIKI: ${correctCount}/${testCases.length} testów przeszło pomyślnie`);

if (correctCount === testCases.length) {
    console.log('\n🎉 WSZYSTKIE TESTY PRZESZŁY!');
    console.log('\n🎯 ROZWIĄZANY PROBLEM:');
    console.log('• TimeoutError dla kategorii bez rozmiarów');
    console.log('• Niepotrzebne próby wypełniania rozmiaru dla portfeli, okularów, etc.');
    console.log('• Graceful handling kategorii akcesoriów');
    
    console.log('\n💡 KATEGORII BEZ ROZMIARÓW:');
    console.log('• Portfele/Wallets');
    console.log('• Poszetki/Pocket squares');
    console.log('• Krawaty i muszki/Ties');
    console.log('• Okulary/Sunglasses');
    console.log('• Paski/Belts');
    console.log('• Chusty i szale/Scarves');
} else {
    console.log('\n⚠️  Niektóre testy nie przeszły, sprawdź logikę');
}
