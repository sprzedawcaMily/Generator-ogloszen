// Test mapowania kategorii dla portfeli
function determineCategoryFromRodzaj(rodzaj) {
    const categoryMappings = {
        'Portfele': {
            mainCategory: 'Akcesoria, dodatki',
            mainCategoryId: '82',
            subCategory: 'Torby',
            subCategoryId: '94',
            finalCategory: 'Portfele',
            finalCategoryId: '248'
        }
    };

    // Sprawdź dokładne dopasowanie
    if (categoryMappings[rodzaj]) {
        return categoryMappings[rodzaj];
    }

    // Fallback - sprawdź podobieństwa dla starych danych
    const type = rodzaj.toLowerCase();
    
    // Fallback dla portfeli
    if (type.includes('portfel') || type.includes('wallet')) {
        return categoryMappings['Portfele'];
    }
    
    // Fallback dla nieznanych kategorii
    return {
        mainCategory: 'Ubrania',
        mainCategoryId: '2050',
        subCategory: 'Inne',
        subCategoryId: '82'
    };
}

// Test cases dla portfeli
const testCases = [
    'Portfele',
    'portfele',
    'Portfel',
    'portfel',
    'wallet',
    'Wallet',
    'portfel skórzany',
    'portfel męski',
    'portfel damski',
    'portfel bifold',
    'small wallet',
    'leather wallet',
    'vintage portfel',
    'designer wallet',
    'portfel uniwersalny'
];

console.log('👛 TEST MAPOWANIA PORTFELI');
console.log('==========================');

testCases.forEach(testCase => {
    const result = determineCategoryFromRodzaj(testCase);
    const isWallet = result.finalCategoryId === '248';
    
    console.log(`\n${isWallet ? '✅' : '❌'} Input: "${testCase}"`);
    
    if (isWallet) {
        console.log(`✅ Kategoria główna: ${result.mainCategory} (ID: ${result.mainCategoryId})`);
        console.log(`✅ Podkategoria: ${result.subCategory} (ID: ${result.subCategoryId})`);
        console.log(`✅ Kategoria końcowa: ${result.finalCategory} (ID: ${result.finalCategoryId})`);
    } else {
        console.log(`❌ Nie rozpoznano jako portfel - używa fallback (ID: ${result.mainCategoryId})`);
    }
});

// Test scenariusza automatyzacji
console.log('\n🎯 ŚCIEŻKA NAWIGACJI VINTED DLA PORTFELI:');
console.log('=========================================');

const walletCategory = determineCategoryFromRodzaj('portfel');
console.log('1. Akcesoria, dodatki (catalog-82)');
console.log(`2. Torby (catalog-${walletCategory.subCategoryId})`);
console.log(`3. Portfele (catalog-${walletCategory.finalCategoryId}) - FINAL SELECTION`);

console.log('\n✅ Mapowanie portfeli zostało poprawione!');
