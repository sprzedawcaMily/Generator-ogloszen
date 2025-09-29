// Słownik poprawek ortograficznych
const spellCorrections = {
    'dlugi': 'długi',
    'dugi': 'długi',
    'rekaw': 'rękaw',
    'rékaw': 'rękaw',
    'jortsy': 'szorty',
    'krotki': 'krótki',
    'krotkie': 'krótkie',
    'dlugie': 'długie',
    'spodnie': 'spodnie',
    'meski': 'męski',
    'meska': 'męska',
    'meskie': 'męskie',
    'damski': 'damski',
    'damska': 'damska',
    'damskie': 'damskie',
    'bialy': 'biały',
    'czarny': 'czarny',
    'rozowy': 'różowy',
    'bezowy': 'beżowy',
    'szary': 'szary',
    'skora': 'skóra',
    'skory': 'skóry',
    'skorzany': 'skórzany',
    'skorzana': 'skórzana',
    'skorzane': 'skórzane',
    'size' : "Size"
};

// Funkcja do kapitalizacji pierwszej litery każdego wyrazu
function capitalizeWord(word) {
    if (word.length === 0) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

// Funkcja do sprawdzania i poprawiania pisowni
function correctSpelling(text) {
    let words = text.split(' ');
    return words.map(word => {
        const lowerWord = word.toLowerCase();
        return spellCorrections[lowerWord] || word;
    }).join(' ');
}

// Główna funkcja do przetwarzania tekstu
export function processText(text) {
    // Najpierw popraw pisownię
    const correctedText = correctSpelling(text);
    
    // Podziel na słowa
    const words = correctedText.split(' ');
    
    // Kapitalizuj tylko pierwsze trzy słowa
    const processedWords = words.map((word, index) => {
        if (index < 3) {
            return capitalizeWord(word);
        }
        return word.toLowerCase();
    });
    
    return processedWords.join(' ');
}

// Funkcja do czyszczenia tekstu ze zbędnych elementów
export function cleanText(text) {
    return text
        .replace(/✨/g, '') // Usuń gwiazdki
        .trim();
}
