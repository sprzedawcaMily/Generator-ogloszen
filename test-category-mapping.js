// Test mapowania kategorii
console.log('🧪 Testing category mapping...\n');

// Testowa funkcja mapowania kategorii
function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Swetry i bluzy z kapturem': {
            mainCategory: 'Ubrania',
            mainCategoryId: '2050',
            subCategory: 'Swetry i bluzy',
            subCategoryId: '79',
            finalCategory: 'Swetry i bluzy z kapturem',
            finalCategoryId: '267'
        }
    };
    
    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla bluz
    if (type.includes('bluza') || type.includes('hoodie') || type.includes('sweter')) {
        if (type.includes('kaptur') || type.includes('hood')) {
            return categoryMappings['Swetry i bluzy z kapturem'];
        } else {
            // Domyślnie bluzy z kapturem
            return categoryMappings['Swetry i bluzy z kapturem'];
        }
    }

    return { error: 'No mapping found' };
}

// Test cases
const testCases = [
    'Swetry i bluzy z kapturem',
    'bluza',
    'hoodie',
    'sweter',
    'bluza z kapturem',
    'random'
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    const result = determineCategoryFromRodzaj(testCase);
    
    if (result.subCategoryId) {
        console.log(`✅ Mapped to: ${result.subCategory} (ID: ${result.subCategoryId}) -> ${result.finalCategory} (ID: ${result.finalCategoryId})`);
    } else {
        console.log(`❌ No mapping found`);
    }
    console.log('');
});
