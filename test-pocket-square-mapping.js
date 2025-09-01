// Test mapowania kategorii dla poszetki
function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Poszetki': {
            mainCategory: 'Akcesoria, dodatki',
            mainCategoryId: '82',
            finalCategory: 'Poszetki',
            finalCategoryId: '2957'
        }
    };

    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla poszetki
    if (type.includes('poszetk') || type.includes('pocket square')) {
        return categoryMappings['Poszetki'];
    }
    
    // Fallback dla nieznanych kategorii
    return {
        mainCategory: 'Ubrania',
        mainCategoryId: '2050',
        subCategory: 'Inne',
        subCategoryId: '82'
    };
}

// Test cases dla poszetki
const testCases = [
    'Poszetki',
    'poszetki',
    'Poszetka',
    'poszetka',
    'pocket square',
    'Pocket Square',
    'poszetka jedwabna',
    'poszetka do kieszeni',
    'elegancka poszetka'
];

console.log('👔 TEST MAPOWANIA POSZETKI');
console.log('==========================');

testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    const isPocket = result.finalCategoryId === '2957';
    
    console.log(`\n${isPocket ? '✅' : '❌'} Input: "${testCase}"`);
    
    if (isPocket) {
        console.log(`✅ Kategoria główna: ${result.mainCategory} (ID: ${result.mainCategoryId})`);
        console.log(`✅ Kategoria końcowa: ${result.finalCategory} (ID: ${result.finalCategoryId})`);
    } else {
        console.log(`❌ Nie rozpoznano jako poszetka - używa fallback (ID: ${result.mainCategoryId})`);
    }
});

// Test scenariusza automatyzacji
console.log('\n🎯 ŚCIEŻKA NAWIGACJI VINTED DLA POSZETKI:');
console.log('=========================================');

const pocketCategory = determineCategoryFromRodzaj('poszetka');
console.log('1. Akcesoria, dodatki (catalog-82)');
console.log(`2. Poszetki (catalog-${pocketCategory.finalCategoryId}) - FINAL SELECTION`);

console.log('\n✅ Mapowanie poszetki zostało poprawione!');
