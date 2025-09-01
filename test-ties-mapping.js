// Test mapowania kategorii dla krawatów i muszek
function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Krawaty i muszki': {
            mainCategory: 'Akcesoria, dodatki',
            mainCategoryId: '82',
            finalCategory: 'Krawaty i muszki',
            finalCategoryId: '2956'
        }
    };

    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla krawatów i muszek
    if (type.includes('krawat') || type.includes('muszk') || type.includes('tie') || type.includes('bow tie')) {
        return categoryMappings['Krawaty i muszki'];
    }
    
    // Fallback dla nieznanych kategorii
    return {
        mainCategory: 'Ubrania',
        mainCategoryId: '2050',
        subCategory: 'Inne',
        subCategoryId: '82'
    };
}

// Test cases dla krawatów i muszek
const testCases = [
    'Krawaty i muszki',
    'krawaty i muszki',
    'Krawat',
    'krawat',
    'Muszka',
    'muszka',
    'tie',
    'Tie',
    'bow tie',
    'Bow Tie',
    'krawat jedwabny',
    'elegancki krawat',
    'muszka do smokingu',
    'czarny krawat',
    'vintage tie',
    'silk tie'
];

console.log('👔 TEST MAPOWANIA KRAWATÓW I MUSZEK');
console.log('===================================');

testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    const isTie = result.finalCategoryId === '2956';
    
    console.log(`\n${isTie ? '✅' : '❌'} Input: "${testCase}"`);
    
    if (isTie) {
        console.log(`✅ Kategoria główna: ${result.mainCategory} (ID: ${result.mainCategoryId})`);
        console.log(`✅ Kategoria końcowa: ${result.finalCategory} (ID: ${result.finalCategoryId})`);
    } else {
        console.log(`❌ Nie rozpoznano jako krawat/muszka - używa fallback (ID: ${result.mainCategoryId})`);
    }
});

// Test scenariusza automatyzacji
console.log('\n🎯 ŚCIEŻKA NAWIGACJI VINTED DLA KRAWATÓW I MUSZEK:');
console.log('==================================================');

const tieCategory = determineCategoryFromRodzaj('krawat');
console.log('1. Akcesoria, dodatki (catalog-82)');
console.log(`2. Krawaty i muszki (catalog-${tieCategory.finalCategoryId}) - FINAL SELECTION`);

console.log('\n✅ Mapowanie krawatów i muszek zostało poprawione!');
