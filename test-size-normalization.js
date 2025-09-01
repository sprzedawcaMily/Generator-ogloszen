// Test normalizacji rozmiarów dla funkcji selectSize
console.log('🧪 Testing size normalization for Vinted size selection...\n');

function normalizeSize(sizeText) {
    return sizeText.replace(/\s+/g, ' ').trim();
}

// Test cases - różne warianty formatowania rozmiarów na Vinted
const testCases = [
    { input: "44|W28", expected: "44 | W28" },
    { input: "44 | W28", expected: "44 | W28" }, 
    { input: "44  |  W28", expected: "44 | W28" },
    { input: "38|W23", expected: "38 | W23" },
    { input: "46 |W29", expected: "46 | W29" },
    { input: "42| W25", expected: "42 | W25" },
    { input: "M", expected: "M" },
    { input: "L", expected: "L" },
    { input: "XL", expected: "XL" }
];

console.log('Testing normalizeSize function:');
testCases.forEach(testCase => {
    const normalized = normalizeSize(testCase.input);
    const isMatch = normalized === testCase.expected;
    
    console.log(`Input: "${testCase.input}"`);
    console.log(`Expected: "${testCase.expected}"`);
    console.log(`Normalized: "${normalized}"`);
    console.log(`Match: ${isMatch ? '✅' : '❌'}`);
    console.log('');
});

// Test czy system znajdzie rozmiary po normalizacji
console.log('\n🔍 Testing size finding after normalization:');

const availableSizes = [
    "38 | W23",
    "40 | W24", 
    "42 | W25",
    "42 | W26",
    "44 | W27",
    "44 | W28",
    "46 | W29",
    "M",
    "L",
    "XL"
];

const sizesToFind = [
    "44|W28",   // Should match "44 | W28"
    "42|W25",   // Should match "42 | W25"
    "38| W23",  // Should match "38 | W23"
    "L",        // Direct match
    "44|W30"    // Should not match (doesn't exist)
];

sizesToFind.forEach(sizeToFind => {
    const normalizedSearch = normalizeSize(sizeToFind);
    const found = availableSizes.find(size => normalizeSize(size) === normalizedSearch);
    
    console.log(`Looking for: "${sizeToFind}"`);
    console.log(`Normalized: "${normalizedSearch}"`);
    console.log(`Found: ${found ? `"${found}" ✅` : 'Not found ❌'}`);
    console.log('');
});
