// Test mapowania stanów dla portfeli
console.log('🏷️ TEST MAPOWANIA STANÓW');
console.log('========================');

// Symulacja funkcji mapowania stanów
function mapCondition(dbCondition) {
    const conditionMap = {
        'nowy z metką': 'Nowy z metką',
        'nowy bez metki': 'Nowy bez metki', 
        'bardzo dobry': 'Bardzo dobry',
        'dobry': 'Dobry',
        'zadowalający': 'Zadowalający'
    };
    
    const normalized = dbCondition?.toLowerCase().trim() || '';
    return conditionMap[normalized];
}

console.log('📋 PRZYKŁADY MAPOWANIA:');
console.log('=======================');

const testConditions = [
    'bardzo dobry',      // z loga
    'Bardzo dobry',      // z kapitalizacją
    'BARDZO DOBRY',      // wielkie litery
    ' bardzo dobry ',    // ze spacjami
    'nowy z metką',      // poprawny
    'dobry',             // podstawowy
    'nieznany'           // błędny
];

testConditions.forEach(condition => {
    const mapped = mapCondition(condition);
    const status = mapped ? '✅ ZMAPOWANO' : '❌ NIEZNANY';
    console.log(`"${condition}" → "${mapped || 'null'}" ${status}`);
});

console.log('\n🔍 ANALIZA PROBLEMU:');
console.log('====================');

const problemCondition = 'bardzo dobry';
const mapped = mapCondition(problemCondition);

console.log(`Stan z bazy danych: "${problemCondition}"`);
console.log(`Znormalizowany: "${problemCondition.toLowerCase().trim()}"`);
console.log(`Zmapowany na Vinted: "${mapped}"`);
console.log(`Status mapowania: ${mapped ? '✅ POPRAWNY' : '❌ BŁĘDNY'}`);

console.log('\n🎯 DOSTĘPNE OPCJE VINTED:');
console.log('=========================');
const vintedOptions = [
    'Nowy z metką',
    'Nowy bez metki', 
    'Bardzo dobry',
    'Dobry',
    'Zadowalający'
];

vintedOptions.forEach((option, i) => {
    const matches = option === mapped;
    console.log(`${i+1}. "${option}" ${matches ? '← SZUKANY' : ''}`);
});

console.log('\n🔧 MOŻLIWE PRZYCZYNY PROBLEMU:');
console.log('==============================');
console.log('1. ✅ Mapowanie działa poprawnie');
console.log('2. ❓ Problem z selektorem elementów dropdown');
console.log('3. ❓ Dropdown może nie być w pełni załadowany');
console.log('4. ❓ Elementy mogą mieć inną strukturę dla portfeli');
console.log('5. ❓ Timing - dropdown nie zdążył się otworzyć');

console.log('\n💡 ROZWIĄZANIE:');
console.log('================');
console.log('• Dodano 3 metody wyszukiwania elementów');
console.log('• Debugging struktury DOM');
console.log('• Lepsze logowanie procesu');
console.log('• Fallback na wyszukiwanie przez tekst');

console.log('\n🚀 GOTOWE DO TESTOWANIA!');
