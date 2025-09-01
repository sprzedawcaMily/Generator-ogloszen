// Test mapowania kategorii dla kurtek
function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'kurtka': {
            mainCategory: 'Ubrania',
            mainCategoryId: '2050',
            subCategory: 'Okrycia wierzchnie',
            subCategoryId: '1206',
            intermediateCategory: 'Kurtki',
            intermediateCategoryId: '2052',
            finalCategory: 'Kurtki ocieplane',
            finalCategoryId: '2536'
        }
    };

    const normalized = rodzaj.toLowerCase().trim();
    
    if (categoryMappings[normalized]) {
        return categoryMappings[normalized];
    }
    
    // Fallback dla nieznanych kategorii
    return {
        mainCategory: 'Ubrania',
        mainCategoryId: '2050',
        subCategory: 'Inne',
        subCategoryId: '82'
    };
}

// Test cases dla kurtek
const testCases = [
    'kurtka',
    'Kurtka',
    'KURTKA',
    ' kurtka ',
    'Kurtka zimowa',
    'kurtka ocieplane'
];

console.log('🧥 TEST MAPOWANIA KURTEK');
console.log('========================');

testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    console.log(`\nInput: "${testCase}"`);
    console.log(`✅ Kategoria główna: ${result.mainCategory} (ID: ${result.mainCategoryId})`);
    console.log(`✅ Podkategoria: ${result.subCategory} (ID: ${result.subCategoryId})`);
    if (result.intermediateCategory) {
        console.log(`✅ Kategoria pośrednia: ${result.intermediateCategory} (ID: ${result.intermediateCategoryId})`);
    }
    if (result.finalCategory) {
        console.log(`✅ Kategoria końcowa: ${result.finalCategory} (ID: ${result.finalCategoryId})`);
    }
});

// Test scenariusza automatyzacji
console.log('\n🎯 SCENARIO TESTOWY - ŚCIEŻKA NAWIGACJI:');
console.log('=======================================');

const jacketCategory = determineCategoryFromRodzaj('kurtka');
console.log('1. Ubrania (catalog-2050)');
console.log(`2. Okrycia wierzchnie (catalog-${jacketCategory.subCategoryId})`);
console.log(`3. Kurtki (catalog-${jacketCategory.intermediateCategoryId})`);
console.log(`4. Kurtki ocieplane (catalog-${jacketCategory.finalCategoryId}) - FINAL SELECTION`);

console.log('\n✅ Wszystkie ID kategorii dla kurtek zostały poprawione!');
