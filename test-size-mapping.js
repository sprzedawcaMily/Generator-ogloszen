// Test mapowania rozmiarów spodni - prostszy test
console.log('🧪 Testowanie mapowania rozmiarów spodni...\n');

// Test funkcji mapowania bezpośrednio
function mapPantsSize(rawSize, itemTitle) {
    const isPants = /\b(spodnie|jeansy|jortsy|spodenki|dresy)\b/i.test(itemTitle);
    
    if (isPants && /^\d+$/.test(rawSize)) {
        const numericSize = parseInt(rawSize);
        
        // Mapowanie rozmiarów spodni według standardowych konwersji
        const sizeMap = {
            28: "38 | W23",
            29: "40 | W24", 
            30: "40 | W25",
            31: "42 | W26",
            32: "44 | W27",
            33: "44 | W28",
            34: "46 | W29",
            35: "46 | W30",
            36: "48 | W31",
            37: "48 | W32",
            38: "50 | W33",
            39: "50 | W34",
            40: "50 | W35",
            41: "52 | W36",
            42: "54 | W38",
            44: "56 | W40",
            46: "58 | W42",
            48: "60 | W44",
            50: "62 | W46"
        };
        
        return sizeMap[numericSize] || rawSize;
    }
    
    return rawSize;
}

// Test cases
const testCases = [
    { rawSize: "44", title: "jeansy size 44 bez wad", expected: "56 | W40" },
    { rawSize: "36", title: "spodnie ecko size 36 bez wad", expected: "48 | W31" },
    { rawSize: "40", title: "jeansy raw blue size 40 bez wad", expected: "50 | W35" },
    { rawSize: "32", title: "spodenki size 32 bez wad", expected: "44 | W27" },
    { rawSize: "33", title: "dresy size 33 bez wad", expected: "44 | W28" },
    { rawSize: "XL", title: "bluza size XL bez wad", expected: "XL" }, // nie powinno być mapowane
    { rawSize: "42", title: "koszulka size 42 bez wad", expected: "42" } // nie powinno być mapowane
];

testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.title}`);
    console.log(`   Raw size: "${testCase.rawSize}"`);
    
    const result = mapPantsSize(testCase.rawSize, testCase.title);
    console.log(`   Mapped size: "${result}"`);
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   ✅ ${result === testCase.expected ? 'PASS' : 'FAIL'}`);
    console.log('');
});
