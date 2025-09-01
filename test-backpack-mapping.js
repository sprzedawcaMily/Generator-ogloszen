// 🧪 Test mapowania kategorii plecaków
console.log('🧪 Testing backpack category mapping...\n');

function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Plecaki': {
            mainCategory: 'Akcesoria, dodatki',
            mainCategoryId: '82',
            subCategory: 'Torby',
            subCategoryId: '94',  // Poprawione ID dla "Torby"
            finalCategory: 'Plecaki',
            finalCategoryId: '246'  // Poprawione ID dla "Plecaki"
        }
    };
    
    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla toreb i plecaków
    if (type.includes('plecak') || type.includes('backpack')) {
        return categoryMappings['Plecaki'];
    }

    return { error: 'No mapping found' };
}

// Test cases
const testCases = [
    'Plecaki',
    'plecaki',
    'Plecak',
    'plecak sportowy',
    'backpack',
    'plecak szkolny',
    'plecak Nike',
    'plecak damski',
    'plecak męski',
    'inne torby' // should not match
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    const result = determineCategoryFromRodzaj(testCase);
    
    if (result.finalCategoryId) {
        console.log(`✅ Mapped to: ${result.mainCategory} (ID: ${result.mainCategoryId}) → ${result.subCategory} (ID: ${result.subCategoryId}) → ${result.finalCategory} (ID: ${result.finalCategoryId})`);
        console.log(`   📍 Will click: #catalog-${result.mainCategoryId} → #catalog-${result.subCategoryId} → #${result.finalCategoryId}-catalog-radio`);
        
        // Sprawdź zgodność z HTML selektorami
        if (result.mainCategoryId === '82' && result.subCategoryId === '94' && result.finalCategoryId === '246') {
            console.log(`   ✅ Matches HTML selectors: #catalog-82 → #catalog-94 → #246-catalog-radio`);
        } else {
            console.log(`   ❌ HTML selectors mismatch!`);
        }
    } else {
        console.log(`❌ No mapping found`);
    }
    console.log('');
});

console.log('🎯 EXPECTED FLOW FOR BACKPACKS:');
console.log('1. Click #catalog-82 (Akcesoria, dodatki)');
console.log('2. Wait for subcategory list to load');
console.log('3. Click #catalog-94 (Torby)');
console.log('4. Wait for final category list to load');
console.log('5. Click #246-catalog-radio (Plecaki)');
console.log('6. ✅ Category selected successfully!');
