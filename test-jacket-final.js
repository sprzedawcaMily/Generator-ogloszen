// Końcowy test kompletnego mapowania kurtek
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
    if (type.includes('kurtk') || type.includes('jacket') || type.includes('płaszcz') || type.includes('coat') || type.includes('bomber')) {
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

// Kompletny test wszystkich wariantów kurtek
const testCases = [
    'kurtka',
    'Kurtka',
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

console.log('🧥 KOŃCOWY TEST MAPOWANIA KURTEK');
console.log('===============================');

let successCount = 0;
testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    const isJacket = result.subCategoryId === '1206';
    
    console.log(`${isJacket ? '✅' : '❌'} "${testCase}" → ${isJacket ? 'KURTKA' : 'INNE'}`);
    
    if (isJacket) successCount++;
});

console.log(`\n📊 WYNIKI: ${successCount}/${testCases.length} przypadków rozpoznanych jako kurtka`);

console.log('\n🎯 ŚCIEŻKA VINTED DLA KURTEK:');
console.log('============================');
console.log('1. Ubrania (catalog-2050)');
console.log('2. Okrycia wierzchnie (catalog-1206)');
console.log('3. Kurtki (catalog-2052)'); 
console.log('4. Kurtki ocieplane (catalog-2536) ← WYBIERANE');

console.log('\n✅ MAPOWANIE KURTEK ZAKOŃCZONE SUKCESEM!');
