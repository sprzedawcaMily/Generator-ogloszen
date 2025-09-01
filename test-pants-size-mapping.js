// Test mapowania rozmiarów spodni - bezpośrednio
console.log('🧪 Testing pants size mapping...\n');

function mapPantsSize(rawSize, itemTitle) {
    // Convert numeric size to string for consistent comparison
    let numericSize = parseInt(rawSize);
    
    // Check if title contains "spodnie" (pants/trousers) to enable mapping
    if (itemTitle && itemTitle.toLowerCase().includes('spodnie')) {
        console.log(`📋 Item contains 'spodnie', converting size ${numericSize} to Vinted format`);
        
        const sizeMap = {
            28: "38 | W23",
            29: "40 | W24", 
            30: "42 | W25",
            31: "42 | W26",
            32: "44 | W27",
            33: "44 | W28",
            34: "46 | W29"
        };
        
        return sizeMap[numericSize] || rawSize;
    }
    
    return rawSize;
}

// Test cases
const testCases = [
    { size: 28, title: "Czarne spodnie jeans" },
    { size: 29, title: "Spodnie cargo khaki" },  
    { size: 30, title: "Spodnie dresowe" },
    { size: 31, title: "Granatowe spodnie klasyczne" },
    { size: 32, title: "Spodnie jeansowe slim" },
    { size: 33, title: "Spodnie materiałowe" },
    { size: 34, title: "Ciemne spodnie jeans" },
    { size: 32, title: "Bluza rozpinana" }, // should NOT convert
    { size: 'M', title: "Spodnie dresowe" }, // should NOT convert
];

testCases.forEach(testCase => {
    console.log(`Input: size ${testCase.size}, title: "${testCase.title}"`);
    const result = mapPantsSize(testCase.size, testCase.title);
    console.log(`✅ Output: "${result}"`);
    
    if (result !== testCase.size) {
        console.log(`   🔄 Size was converted from ${testCase.size} to ${result}`);
    } else {
        console.log(`   ➡️  Size remained unchanged`);
    }
    console.log('');
});
