// Test konwersji rozmiarów butów z kropki na przecinek
console.log('👟 TEST KONWERSJI ROZMIARÓW BUTÓW');
console.log('=================================');

// Symulacja funkcji normalizacji rozmiarów
function normalizeSize(size) {
    // Konwertuj kropkę na przecinek dla rozmiarów butów (np. 48.5 → 48,5)
    let normalized = size.replace(/\./g, ',');
    // Dodaj spacje wokół | dla zgodności z Vinted
    normalized = normalized.replace(/\s*\|\s*/g, ' | ').trim();
    return normalized;
}

// Generowanie wariantów rozmiarów
function getSizeVariants(targetSize) {
    const variants = [
        targetSize,                    // oryginalny format
        normalizeSize(targetSize),     // z przecinkiem zamiast kropki
        targetSize.replace(/\./g, ','), // tylko zamiana kropki na przecinek
        targetSize.replace(/,/g, '.'), // tylko zamiana przecinka na kropkę
    ].filter((v, i, arr) => arr.indexOf(v) === i); // usuń duplikaty
    
    return variants;
}

console.log('📋 PRZYKŁADY KONWERSJI:');
console.log('=======================');

const testSizes = [
    '48.5',      // rozmiar z bazy danych
    '42,5',      // rozmiar już z przecinkiem
    '44',        // rozmiar całkowity
    '40.5',      // kolejny przykład z kropką
    '46|W12',    // rozmiar z szerokością
    '38.5|M',    // rozmiar z oznaczeniem
];

const vintedSizes = [
    '48,5',      // format Vinted
    '42,5',      // format Vinted
    '44',        // format Vinted
    '40,5',      // format Vinted
    '46 | W12',  // format Vinted z spacjami
    '38,5 | M',  // format Vinted z spacjami
];

testSizes.forEach((testSize, index) => {
    const variants = getSizeVariants(testSize);
    const vintedFormat = vintedSizes[index];
    
    console.log(`\n🔍 Rozmiar: "${testSize}"`);
    console.log(`📝 Warianty do testowania: [${variants.map(v => `"${v}"`).join(', ')}]`);
    console.log(`🎯 Format Vinted: "${vintedFormat}"`);
    
    // Sprawdź czy któryś wariant pasuje
    const match = variants.some(variant => 
        variant === vintedFormat || 
        variant.replace(/\./g, ',') === vintedFormat ||
        variant.replace(/,/g, '.') === vintedFormat
    );
    
    console.log(`✅ Dopasowanie: ${match ? 'TAK' : 'NIE'}`);
    
    if (match) {
        const matchingVariant = variants.find(variant => 
            variant === vintedFormat || 
            variant.replace(/\./g, ',') === vintedFormat ||
            variant.replace(/,/g, '.') === vintedFormat
        );
        console.log(`🎯 Dopasowany wariant: "${matchingVariant}"`);
    }
});

console.log('\n🔍 SZCZEGÓLNY PRZYPADEK - 48.5:');
console.log('================================');

const problemSize = '48.5';
const problemVariants = getSizeVariants(problemSize);
const vintedOption = '48,5';

console.log(`📥 Z bazy danych: "${problemSize}"`);
console.log(`📝 Wygenerowane warianty: [${problemVariants.map(v => `"${v}"`).join(', ')}]`);
console.log(`🎯 Opcja w Vinted: "${vintedOption}"`);

// Test wszystkich metod dopasowania
const methods = [
    { name: 'Bezpośrednie porównanie', test: (v) => v === vintedOption },
    { name: 'Po zamianie kropki na przecinek', test: (v) => v.replace(/\./g, ',') === vintedOption },
    { name: 'Po zamianie przecinka na kropkę', test: (v) => v.replace(/,/g, '.') === vintedOption },
];

methods.forEach(method => {
    const matches = problemVariants.filter(method.test);
    console.log(`${method.name}: ${matches.length > 0 ? '✅ DOPASOWANIE' : '❌ BRAK'}`);
    if (matches.length > 0) {
        console.log(`   → Dopasowane warianty: [${matches.map(v => `"${v}"`).join(', ')}]`);
    }
});

console.log('\n🎉 WNIOSEK:');
console.log('============');
console.log('System będzie teraz automatycznie konwertować:');
console.log('• 48.5 → 48,5 (kropka na przecinek)');
console.log('• 42,5 → 42.5 (przecinek na kropkę)');
console.log('• Testować wszystkie warianty przy wyszukiwaniu');
console.log('• Obsługiwać formaty ze spacjami (46|W12 → 46 | W12)');

console.log('\n🚀 GOTOWE DO TESTOWANIA!');
