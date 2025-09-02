// Mapowanie kategorii na dostępne rozmiary w Vinted
export const categoryToSizesMapping: Record<string, string[]> = {
    // Kurtki, koszule, t-shirty, bluzy
    "kurtka": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "koszula w kratke": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "koszule dzinsowe": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "koszulki z nadrukiem": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "tishirty z nadrukiem": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "koszulki polo": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "koszulki z dlugim rekawem": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "podkoszulki": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "swetry i bluzy z kapturem": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],
    "bluzy rozpinane": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny"
    ],

    // Spodnie z rozszerzonymi opcjami
    "spodnie z szerokimi nogawkami": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny",
        "38 | W23", "40 | W24", "40 | W25", "42 | W26", "44 | W27", "44 | W28", "46 | W29", 
        "46 | W30", "48 | W31", "48 | W32", "50 | W33", "50 | W34", "50 | W35", "52 | W36", 
        "54 | W38", "56 | W40", "58 | W42", "60 | W44", "62 | W46", "64 | W48", "66 | W50", 
        "68 | W52", "70 | W54"
    ],
    "szorty dzinsowe": [
        "XS", "S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL", "6XL", "7XL", "8XL", "Uniwersalny",
        "38 | W23", "40 | W24", "40 | W25", "42 | W26", "44 | W27", "44 | W28", "46 | W29", 
        "46 | W30", "48 | W31", "48 | W32", "50 | W33", "50 | W34", "50 | W35", "52 | W36", 
        "54 | W38", "56 | W40", "58 | W42", "60 | W44", "62 | W46", "64 | W48", "66 | W50", 
        "68 | W52", "70 | W54"
    ],

    // Buty
    "sneakrsy": [
        "38", "38,5", "39", "39,5", "40", "40,5", "41", "41,5", "42", "42,5", "43", "43,5", 
        "44", "44,5", "45", "45,5", "46", "46,5", "47", "47,5", "48", "48,5", "49", "50", 
        "51", "52", "Uniwersalny", "Inny"
    ],
    "trampki": [
        "38", "38,5", "39", "39,5", "40", "40,5", "41", "41,5", "42", "42,5", "43", "43,5", 
        "44", "44,5", "45", "45,5", "46", "46,5", "47", "47,5", "48", "48,5", "49", "50", 
        "51", "52", "Uniwersalny", "Inny"
    ],
    "tenisowki": [
        "38", "38,5", "39", "39,5", "40", "40,5", "41", "41,5", "42", "42,5", "43", "43,5", 
        "44", "44,5", "45", "45,5", "46", "46,5", "47", "47,5", "48", "48,5", "49", "50", 
        "51", "52", "Uniwersalny", "Inny"
    ],

    // Akcesoria
    "chusty": ["Uniwersalny"],
    "chustki": ["Uniwersalny"],
    
    "paski": [
        "70 cm", "75 cm", "80 cm", "85 cm", "90 cm", "95 cm", "100 cm", "105 cm", 
        "110 cm", "115 cm", "120 cm", "125 cm", "130 cm", "Regulowany"
    ],

    "zegarki": [
        "Do 30 mm", "30–38 mm", "39–42 mm", "43–46 mm", "Od 47 mm", "Uniwersalny"
    ],

    "plecaki": ["Uniwersalny"],
    "nerki": ["Uniwersalny"],
    "listonoszki": ["Uniwersalny"],
    "torby na ramie": ["Uniwersalny"],
    "portfele": ["Uniwersalny"]
};

// Funkcja pomocnicza do znalezienia odpowiednich rozmiarów dla kategorii
export function getSizesForCategory(categoryName: string): string[] {
    const normalizedCategory = categoryName.toLowerCase().trim();
    
    // Sprawdź dokładne dopasowanie
    if (categoryToSizesMapping[normalizedCategory]) {
        return categoryToSizesMapping[normalizedCategory];
    }
    
    // Sprawdź częściowe dopasowania
    for (const [category, sizes] of Object.entries(categoryToSizesMapping)) {
        if (normalizedCategory.includes(category) || category.includes(normalizedCategory)) {
            return sizes;
        }
    }
    
    // Domyślne rozmiary jeśli nie znaleziono dopasowania
    return ["XS", "S", "M", "L", "XL", "XXL", "Uniwersalny"];
}

// Funkcja do normalizacji rozmiarów
export function normalizeSizeForCategory(size: string, categoryName: string): string {
    const availableSizes = getSizesForCategory(categoryName);
    const normalizedSize = size.trim().toUpperCase();
    
    // Sprawdź dokładne dopasowanie
    if (availableSizes.some(s => s.toUpperCase() === normalizedSize)) {
        return availableSizes.find(s => s.toUpperCase() === normalizedSize) || size;
    }
    
    // Mapowania specjalne
    const sizeMapping: Record<string, string> = {
        "UNIWERSALNY": "Uniwersalny",
        "REGULOWANY": "Regulowany",
        "JEDEN ROZMIAR": "Uniwersalny",
        "ONE SIZE": "Uniwersalny",
        "OS": "Uniwersalny"
    };
    
    if (sizeMapping[normalizedSize]) {
        const mappedSize = sizeMapping[normalizedSize];
        if (availableSizes.includes(mappedSize)) {
            return mappedSize;
        }
    }
    
    return size;
}
