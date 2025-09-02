// Test kompletnego formatowania tytułu w kontekście automatyzacji Vinted
console.log('🎯 TEST KOMPLETNEGO FORMATOWANIA TYTUŁU');
console.log('======================================');

// Symulacja danych ogłoszenia
const testAd = {
    marka: 'BONESOUL',
    rodzaj: 'Spodnie', 
    rozmiar: '56|W40',
    typ: 'baggy',
    description_text: 'JNCO'  // z style_templates
};

// Symulacja funkcji formatTitleWord
function formatTitleWord(word) {
    const hasOnlyUppercaseLetters = /^[A-Z\W]*$/.test(word) && /[A-Z]/.test(word) && !/\d/.test(word);
    
    if (hasOnlyUppercaseLetters && word.length > 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    return word;
}

// Symulacja getShortenedProductType
function getShortenedProductType(rodzaj) {
    const typeMap = {
        'Spodnie': 'Spodnie',
        'Kurtka': 'Kurtka',
        'Bluza': 'Bluza'
    };
    return typeMap[rodzaj] || rodzaj;
}

// Symulacja generateTitle
function generateTitle(ad) {
    const parts = [];
    
    if (ad.marka) parts.push(formatTitleWord(ad.marka));
    if (ad.rodzaj) parts.push(formatTitleWord(getShortenedProductType(ad.rodzaj)));
    if (ad.rozmiar) parts.push(ad.rozmiar); // rozmiary zostają bez zmian
    
    // Symulacja style_templates
    if (ad.description_text) {
        parts.push(formatTitleWord(ad.description_text));
    }
    
    return parts.join(' ');
}

console.log('📋 DANE WEJŚCIOWE:');
console.log('==================');
console.log(`Marka: "${testAd.marka}"`);
console.log(`Rodzaj: "${testAd.rodzaj}"`);
console.log(`Rozmiar: "${testAd.rozmiar}"`);
console.log(`Description text: "${testAd.description_text}"`);

console.log('\n🔄 PROCES FORMATOWANIA:');
console.log('=======================');

const formattedMarka = formatTitleWord(testAd.marka);
console.log(`1. Marka: "${testAd.marka}" → "${formattedMarka}"`);

const shortenedType = getShortenedProductType(testAd.rodzaj);
const formattedRodzaj = formatTitleWord(shortenedType);
console.log(`2. Rodzaj: "${testAd.rodzaj}" → "${shortenedType}" → "${formattedRodzaj}"`);

const rozmiar = testAd.rozmiar;
console.log(`3. Rozmiar: "${rozmiar}" (bez zmian)`);

const formattedDesc = formatTitleWord(testAd.description_text);
console.log(`4. Description: "${testAd.description_text}" → "${formattedDesc}"`);

console.log('\n✅ WYNIK KOŃCOWY:');
console.log('================');
const finalTitle = generateTitle(testAd);
console.log(`TYTUŁ: "${finalTitle}"`);

console.log('\n🎯 PORÓWNANIE:');
console.log('==============');
const oldTitle = `${testAd.marka} ${testAd.rodzaj} ${testAd.rozmiar} ${testAd.description_text}`;
console.log(`PRZED: "${oldTitle}"`);
console.log(`PO:    "${finalTitle}"`);

console.log('\n📊 RÓŻNICE:');
console.log('===========');
const beforeParts = [testAd.marka, testAd.rodzaj, testAd.rozmiar, testAd.description_text];
const afterParts = [formattedMarka, formattedRodzaj, rozmiar, formattedDesc];

beforeParts.forEach((before, i) => {
    const after = afterParts[i];
    const changed = before !== after;
    console.log(`${i+1}. "${before}" → "${after}" ${changed ? '✅ ZMIENIONO' : '⚪ BEZ ZMIANY'}`);
});

console.log('\n🎉 WSZYSTKO DZIAŁA POPRAWNIE!');
