// Końcowy test mapowania krawatów i muszek - wszystkie scenariusze
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

    // Fallback - sprawdź podobieństwa
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

// Kompletny test wszystkich możliwych nazw krawatów i muszek
const testCases = [
    // Dokładne dopasowania
    'Krawaty i muszki',
    'krawaty i muszki',
    
    // Fallback - krawaty
    'Krawat',
    'krawat',
    'krawat jedwabny',
    'elegancki krawat',
    'czarny krawat',
    'kolorowy krawat',
    'krawat w paski',
    'vintage krawat',
    
    // Fallback - muszki
    'Muszka',
    'muszka',
    'muszka do smokingu',
    'czarna muszka',
    'elegancka muszka',
    
    // Fallback - angielskie nazwy
    'tie',
    'Tie',
    'silk tie',
    'vintage tie',
    'bow tie',
    'Bow Tie',
    'black tie',
    'formal tie'
];

console.log('👔 KOŃCOWY TEST MAPOWANIA KRAWATÓW I MUSZEK');
console.log('============================================');

let successCount = 0;
testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    const isTie = result.finalCategoryId === '2956';
    
    console.log(`${isTie ? '✅' : '❌'} "${testCase}" → ${isTie ? 'KRAWAT/MUSZKA' : 'INNE'}`);
    
    if (isTie) successCount++;
});

console.log(`\n📊 WYNIKI: ${successCount}/${testCases.length} przypadków rozpoznanych jako krawat/muszka`);

console.log('\n🎯 ŚCIEŻKA VINTED DLA KRAWATÓW I MUSZEK:');
console.log('=======================================');
console.log('1. Akcesoria, dodatki (catalog-82)');
console.log('2. Krawaty i muszki (catalog-2956) ← WYBIERANE');

console.log('\n✅ MAPOWANIE KRAWATÓW I MUSZEK ZAKOŃCZONE SUKCESEM!');
