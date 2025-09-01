// 🧪 Test mapowania kategorii chust i chustek
console.log('🧪 Testing scarves category mapping...\n');

function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Chusty i chustki': {
            mainCategory: 'Akcesoria, dodatki',
            mainCategoryId: '82',
            finalCategory: 'Chusty i chustki',
            finalCategoryId: '2960'  // Poprawione ID dla "Chusty i chustki"
        }
    };
    
    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla chust i chustek
    if (type.includes('chusta') || type.includes('chustka') || type.includes('szal') || type.includes('scarf')) {
        return categoryMappings['Chusty i chustki'];
    }

    return { error: 'No mapping found' };
}

// Test cases
const testCases = [
    'Chusty i chustki',
    'chusty i chustki',
    'Chusta',
    'chustka',
    'chustka damska',
    'scarf',
    'szal',
    'szalik',
    'chusta jedwabna',
    'chustka na głowę',
    'inne akcesoria' // should not match
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    const result = determineCategoryFromRodzaj(testCase);
    
    if (result.finalCategoryId) {
        console.log(`✅ Mapped to: ${result.mainCategory} (ID: ${result.mainCategoryId}) → ${result.finalCategory} (ID: ${result.finalCategoryId})`);
        console.log(`   📍 Will click: #catalog-${result.mainCategoryId} → #${result.finalCategoryId}-catalog-radio`);
        
        // Sprawdź zgodność z HTML selektorami
        if (result.mainCategoryId === '82' && result.finalCategoryId === '2960') {
            console.log(`   ✅ Matches HTML selectors: #catalog-82 → #2960-catalog-radio`);
        } else {
            console.log(`   ❌ HTML selectors mismatch!`);
        }
    } else {
        console.log(`❌ No mapping found`);
    }
    console.log('');
});

console.log('🎯 EXPECTED FLOW FOR SCARVES:');
console.log('1. Click #catalog-82 (Akcesoria, dodatki)');
console.log('2. Wait for subcategory list to load');
console.log('3. Click #2960-catalog-radio (Chusty i chustki)');
console.log('4. ✅ Category selected successfully!');
