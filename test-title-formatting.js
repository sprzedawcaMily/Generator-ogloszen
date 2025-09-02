// Test formatowania tytułów - kapitalizacja wyrazów z samymi consoleconsole.log('\n✅ LOGIKA DZIAŁANIA:');
console.log('====================');
console.log('1. Sprawdza regex: /^[A-Z\\W]*$/ (tylko wielkie litery i znaki spec.)');
console.log('2. Sprawdza czy zawiera wielkie litery: /[A-Z]/.test()');
console.log('3. Sprawdza czy NIE zawiera cyfr: !/\\d/.test()');
console.log('4. Sprawdza długość > 1');
console.log('5. Jeśli wszystko prawda → firstName.toUpperCase() + rest.toLowerCase()');
console.log('6. Jeśli nie → zostaw bez zmian');

console.log('\n🎉 GOTOWE!');OGIKA DZIAŁANIA:');
console.log('====================');
console.log('1. Sprawdza regex: /^[A-Z\\W]*$/ (tylko wielkie litery i znaki spec.)');
console.log('2. Sprawdza czy zawiera wielkie litery: /[A-Z]/.test()');
console.log('3. Sprawdza czy NIE zawiera cyfr: !/\\d/.test()');
console.log('4. Sprawdza długość > 1');
console.log('5. Jeśli wszystko prawda → firstName.toUpperCase() + rest.toLowerCase()');
console.log('6. Jeśli nie → zostaw bez zmian');i literami
console.log('🎯 TEST FORMATOWANIA TYTUŁÓW');
console.log('============================');

// Symulacja funkcji formatTitleWord
function formatTitleWord(word) {
    // Sprawdź czy wyraz składa się tylko z wielkich liter (bez cyfr)
    const hasOnlyUppercaseLetters = /^[A-Z\W]*$/.test(word) && /[A-Z]/.test(word) && !/\d/.test(word);
    
    if (hasOnlyUppercaseLetters && word.length > 1) {
        // Kapitalizuj tylko pierwszą literę
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    // Zostaw bez zmian jeśli ma mieszane wielkości liter lub zawiera cyfry
    return word;
}

console.log('📋 PRZYKŁADY FORMATOWANIA:');
console.log('==========================');

const testCases = [
    'BONESOUL',     // → Bonesoul
    'JNCO',         // → Jnco  
    'Nike',         // → Nike (bez zmiany)
    'ADIDAS',       // → Adidas
    'G-STAR',       // → G-star
    'Calvin',       // → Calvin (bez zmiany)
    'KLEIN',        // → Klein
    'RAW',          // → Raw
    'H&M',          // → H&m
    'SUPREME',      // → Supreme
    '56',           // → 56 (bez zmiany)
    'W40',          // → W40 (bez zmiany - ma cyfry)
    'Baggy',        // → Baggy (bez zmiany)
    'szerokie'      // → szerokie (bez zmiany)
];

testCases.forEach(word => {
    const formatted = formatTitleWord(word);
    const changed = word !== formatted;
    console.log(`${word.padEnd(12)} → ${formatted.padEnd(12)} ${changed ? '✅ ZMIENIONO' : '⚪ BEZ ZMIANY'}`);
});

console.log('\n🔍 ANALIZA PRZYKŁADU:');
console.log('=====================');
console.log('PRZED: "BONESOUL Spodnie 56|W40 Baggy szerokie jnco"');

// Symulacja parsowania
const parts = ['BONESOUL', 'Spodnie', '56|W40', 'Baggy', 'szerokie', 'jnco'];
const formatted = parts.map(formatTitleWord);

console.log('PO:    "' + formatted.join(' ') + '"');

console.log('\n📊 SZCZEGÓŁY ZMIAN:');
console.log('==================');
parts.forEach((part, i) => {
    const formattedPart = formatted[i];
    const changed = part !== formattedPart;
    console.log(`${(i+1)}. "${part}" → "${formattedPart}" ${changed ? '✅' : '⚪'}`);
});

console.log('\n✅ LOGIKA DZIAŁANIA:');
console.log('====================');
console.log('1. Sprawdza regex: /^[A-Z0-9\\W]*$/ (tylko wielkie litery, cyfry, znaki)');
console.log('2. Sprawdza czy zawiera wielkie litery: /[A-Z]/.test()');
console.log('3. Sprawdza długość > 1');
console.log('4. Jeśli wszystko prawda → firstName.toUpperCase() + rest.toLowerCase()');
console.log('5. Jeśli nie → zostaw bez zmian');

console.log('\n🎉 GOTOWE!');
