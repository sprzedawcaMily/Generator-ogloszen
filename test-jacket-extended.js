// Rozszerzony test mapowania kategorii dla kurtek z fallback
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

    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla kurtek
    if (type.includes('kurtk') || type.includes('jacket') || type.includes('płaszcz') || type.includes('coat')) {
        return categoryMappings['kurtka'];
    }
    
    // Fallback dla nieznanych kategorii
    return {
        mainCategory: 'Ubrania',
        mainCategoryId: '2050',
        subCategory: 'Inne',
        subCategoryId: '82'
    };
}

// Rozszerzony test cases dla kurtek - dokładne dopasowania i fallback
const testCases = [
    // Dokładne dopasowania
    'kurtka',
    'Kurtka',
    'KURTKA',
    ' kurtka ',
    
    // Fallback - różne warianty kurtek
    'kurtka zimowa',
    'kurtka jeans',
    'kurtka jeansowa',
    'Vintage kurtka',
    'kurtka ocieplane',
    'kurtka bomber',
    'bomberka',
    'jacket',
    'jacket vintage',
    'płaszcz',
    'coat',
    'winter coat',
    'denim jacket',
    'leather jacket'
];

console.log('🧥 ROZSZERZONY TEST MAPOWANIA KURTEK');
console.log('===================================');

testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    console.log(`\nInput: "${testCase}"`);
    
    if (result.subCategoryId === '1206') {
        console.log(`✅ KURTKA DETECTED!`);
        console.log(`✅ Kategoria główna: ${result.mainCategory} (ID: ${result.mainCategoryId})`);
        console.log(`✅ Podkategoria: ${result.subCategory} (ID: ${result.subCategoryId})`);
        console.log(`✅ Kategoria pośrednia: ${result.intermediateCategory} (ID: ${result.intermediateCategoryId})`);
        console.log(`✅ Kategoria końcowa: ${result.finalCategory} (ID: ${result.finalCategoryId})`);
    } else {
        console.log(`❌ Nie rozpoznano jako kurtka - używa fallback (ID: ${result.subCategoryId})`);
    }
});

// Test scenariusza automatyzacji
console.log('\n🎯 ŚCIEŻKA NAWIGACJI VINTED DLA KURTEK:');
console.log('=====================================');

const jacketCategory = determineCategoryFromRodzaj('kurtka bomber');
console.log('1. Ubrania (catalog-2050)');
console.log(`2. Okrycia wierzchnie (catalog-${jacketCategory.subCategoryId})`);
console.log(`3. Kurtki (catalog-${jacketCategory.intermediateCategoryId})`);
console.log(`4. Kurtki ocieplane (catalog-${jacketCategory.finalCategoryId}) - FINAL SELECTION`);

console.log('\n✅ Mapowanie kurtek z fallback zostało wdrożone!');
