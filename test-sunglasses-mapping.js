// 🧪 Test mapowania kategorii okularów przeciwsłonecznych
console.log('🧪 Testing sunglasses category mapping...\n');

function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Okulary przeciwsłoneczne': {
            mainCategory: 'Akcesoria, dodatki',
            mainCategoryId: '82',  // Poprawione ID dla "Akcesoria, dodatki"
            finalCategory: 'Okulary przeciwsłoneczne',
            finalCategoryId: '98'  // Poprawione ID dla "Okulary przeciwsłoneczne"
        }
    };
    
    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla akcesoriów
    if (type.includes('okular') || type.includes('sunglasses')) {
        return categoryMappings['Okulary przeciwsłoneczne'];
    }

    return { error: 'No mapping found' };
}

// Test cases
const testCases = [
    'Okulary przeciwsłoneczne',
    'okulary przeciwsłoneczne',
    'Okulary',
    'okular przeciwsłoneczny',
    'sunglasses',
    'Okulary Ray-Ban',
    'okulary damskie',
    'okulary męskie',
    'czarne okulary',
    'inne akcesroium' // should not match
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    const result = determineCategoryFromRodzaj(testCase);
    
    if (result.finalCategoryId) {
        console.log(`✅ Mapped to: ${result.mainCategory} (ID: ${result.mainCategoryId}) -> ${result.finalCategory} (ID: ${result.finalCategoryId})`);
        console.log(`   📍 Will click: #catalog-${result.mainCategoryId} then #${result.finalCategoryId}-catalog-radio`);
        
        // Sprawdź zgodność z HTML selektorami
        if (result.mainCategoryId === '82' && result.finalCategoryId === '98') {
            console.log(`   ✅ Matches HTML selectors: #catalog-82 and #98-catalog-radio`);
        } else {
            console.log(`   ❌ HTML selectors mismatch!`);
        }
    } else {
        console.log(`❌ No mapping found`);
    }
    console.log('');
});

console.log('🎯 EXPECTED FLOW FOR SUNGLASSES:');
console.log('1. Click #catalog-82 (Akcesoria, dodatki)');
console.log('2. Wait for subcategory list to load');
console.log('3. Click #98-catalog-radio (Okulary przeciwsłoneczne)');
console.log('4. ✅ Category selected successfully!');
