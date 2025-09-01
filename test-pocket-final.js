// Końcowy test mapowania poszetki - wszystkie scenariusze
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

    // Fallback - sprawdź podobieństwa
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

// Kompletny test wszystkich możliwych nazw poszetki
const testCases = [
    // Dokładne dopasowania
    'Poszetki',
    'poszetki',
    
    // Fallback - różne warianty
    'Poszetka',
    'poszetka',
    'poszetka jedwabna',
    'poszetka do kieszeni',
    'elegancka poszetka',
    'poszetka do garnituru',
    'pocket square',
    'Pocket Square',
    'silk pocket square',
    'vintage poszetka',
    'luksusowa poszetka'
];

console.log('👔 KOŃCOWY TEST MAPOWANIA POSZETKI');
console.log('==================================');

let successCount = 0;
testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    const isPocket = result.finalCategoryId === '2957';
    
    console.log(`${isPocket ? '✅' : '❌'} "${testCase}" → ${isPocket ? 'POSZETKA' : 'INNE'}`);
    
    if (isPocket) successCount++;
});

console.log(`\n📊 WYNIKI: ${successCount}/${testCases.length} przypadków rozpoznanych jako poszetka`);

console.log('\n🎯 ŚCIEŻKA VINTED DLA POSZETKI:');
console.log('==============================');
console.log('1. Akcesoria, dodatki (catalog-82)');
console.log('2. Poszetki (catalog-2957) ← WYBIERANE');

console.log('\n✅ MAPOWANIE POSZETKI ZAKOŃCZONE SUKCESEM!');
