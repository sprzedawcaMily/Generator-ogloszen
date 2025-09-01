// Test mapowania kategorii bluz rozpinanych
console.log('🧪 Testing updated category mapping for cardigans/zipup hoodies...\n');

function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Swetry i bluzy z kapturem': {
            mainCategory: 'Ubrania',
            mainCategoryId: '2050',
            subCategory: 'Swetry i bluzy',
            subCategoryId: '79',
            finalCategory: 'Swetry i bluzy z kapturem',
            finalCategoryId: '267'
        },
        'Bluzy rozpinane': {
            mainCategory: 'Ubrania',
            mainCategoryId: '2050',
            subCategory: 'Swetry i bluzy',
            subCategoryId: '79',
            finalCategory: 'Kardigany',
            finalCategoryId: '266'
        },
        'Kardigany': {
            mainCategory: 'Ubrania',
            mainCategoryId: '2050',
            subCategory: 'Swetry i bluzy',
            subCategoryId: '79',
            finalCategory: 'Kardigany',
            finalCategoryId: '266'
        }
    };
    
    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla bluz
    if (type.includes('bluza') || type.includes('hoodie') || type.includes('sweter') || type.includes('kardigan')) {
        if (type.includes('kaptur') || type.includes('hood')) {
            return categoryMappings['Swetry i bluzy z kapturem'];
        } else if (type.includes('rozpina') || type.includes('zip') || type.includes('kardigan')) {
            return categoryMappings['Kardigany'];  // Używamy Kardigany zamiast "Bluzy rozpinane"
        } else {
            // Domyślnie bluzy z kapturem
            return categoryMappings['Swetry i bluzy z kapturem'];
        }
    }

    return { error: 'No mapping found' };
}

// Test cases
const testCases = [
    'Bluzy rozpinane',
    'Kardigany',
    'bluza zip',
    'kardigan',
    'bluza rozpinana',
    'sweter rozpinany',
    'hoodie zip',
    'bluza z kapturem', // should map to hooded category
    'bluza' // should default to hooded category
];

testCases.forEach(testCase => {
    console.log(`Input: "${testCase}"`);
    const result = determineCategoryFromRodzaj(testCase);
    
    if (result.finalCategoryId) {
        console.log(`✅ Mapped to: ${result.subCategory} (ID: ${result.subCategoryId}) -> ${result.finalCategory} (ID: ${result.finalCategoryId})`);
        if (result.finalCategoryId === '266') {
            console.log(`   📍 Will click: #catalog-266 then #266-catalog-radio`);
        } else if (result.finalCategoryId === '267') {
            console.log(`   📍 Will click: #catalog-267 then #267-catalog-radio`);
        }
    } else {
        console.log(`❌ No mapping found`);
    }
    console.log('');
});
