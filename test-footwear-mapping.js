// 🧪 Test mapowania kategorii obuwia
console.log('🧪 Testing footwear category mapping...\n');

function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Sneakersy, trampki i tenisówki': {
            mainCategory: 'Obuwie',
            mainCategoryId: '1231',  // Poprawione ID dla "Obuwie"
            finalCategory: 'Sneakersy, trampki i tenisówki',
            finalCategoryId: '1242'  // Poprawione ID dla "Sneakersy, trampki i tenisówki"
        }
    };
    
    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla obuwia
    if (type.includes('buty') || type.includes('sneakers') || type.includes('trampki') || type.includes('tenisówki') || type.includes('shoes')) {
        return categoryMappings['Sneakersy, trampki i tenisówki'];
    }

    return { error: 'No mapping found' };
}

// Test cases
const testCases = [
    'Sneakersy, trampki i tenisówki',
    'sneakersy',
    'Buty',
    'buty sportowe',
    'shoes',
    'trampki',
    'tenisówki',
    'buty Nike',
    'buty Adidas',
    'sneakers',
    'buty męskie',
    'inne ubrania' // should not match
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    const result = determineCategoryFromRodzaj(testCase);
    
    if (result.finalCategoryId) {
        console.log(`✅ Mapped to: ${result.mainCategory} (ID: ${result.mainCategoryId}) → ${result.finalCategory} (ID: ${result.finalCategoryId})`);
        console.log(`   📍 Will click: #catalog-${result.mainCategoryId} → #${result.finalCategoryId}-catalog-radio`);
        
        // Sprawdź zgodność z HTML selektorami
        if (result.mainCategoryId === '1231' && result.finalCategoryId === '1242') {
            console.log(`   ✅ Matches HTML selectors: #catalog-1231 → #1242-catalog-radio`);
        } else {
            console.log(`   ❌ HTML selectors mismatch!`);
        }
    } else {
        console.log(`❌ No mapping found`);
    }
    console.log('');
});

console.log('🎯 EXPECTED FLOW FOR FOOTWEAR:');
console.log('1. Click #catalog-1231 (Obuwie)');
console.log('2. Wait for subcategory list to load');
console.log('3. Click #1242-catalog-radio (Sneakersy, trampki i tenisówki)');
console.log('4. ✅ Category selected successfully!');
