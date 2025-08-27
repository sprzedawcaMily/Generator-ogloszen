import { tagsTemplate } from './data.js';

export function parseData(data) {
    console.log('Parsing data:', data.substring(0, 100) + '...');
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    console.log('Found lines:', lines.length);
    const items = [];
    let currentItem = null;

    lines.forEach(line => {
        // Sprawdź czy to jest akcesoria
        const isAccessory = line.toLowerCase().includes('okulary') || 
                          line.toLowerCase().includes('plecak') ||
                          line.toLowerCase().includes('czapka') ||
                          line.toLowerCase().includes('klapki') ||
                          line.toLowerCase().includes('bucket');
        
        // Sprawdź czy to jest linia z wymiarami
        const hasMeasurements = /^(?:(?:p|d|dl|s|u|n|pas|szer|udo|nog|dł)\s*\d+|p\d+\s+dl\s*\d+|dl\s*\d+\s+s\d+)\s*$/i.test(line);

        // Sprawdź czy linia zawiera nazwy ubrań
        const hasClothingWord = /\b(bluza|spodnie|koszulka|kurtka|jeansy|szorty|jersey|longsleeve|spodenki|catana|bomberka|koszula|dresy|dress)\b/i.test(line);
        
        // Sprawdź czy to jest opis stanu/wyglądu
        const hasConditionDesc = /\b(poszarpane|poplamione|bez wad|z wadami|cracking|dziurki|przetarcia)\b/i.test(line);
        
        // Sprawdź czy linia zawiera rozmiar lub znane marki
        const hasSize = line.toLowerCase().includes('size') || 
                       /\b(xs|s|m|l|xl|xxl|xxxl|\d+xl|\d+\/?\d*)\b/i.test(line);
                       
        // Sprawdź czy linia zawiera znane marki
        const hasBrand = /\b(ecko|phat|rydel|fishbone|fubu|southpole|nike|adidas|jigga|toy|machine)\b/i.test(line);

        // Sprawdź czy to nowy przedmiot
        const isNewItem = !hasMeasurements && (isAccessory || hasClothingWord || hasSize || hasBrand || hasConditionDesc);
        
        console.log('Processing line:', {
            line,
            isAccessory,
            hasMeasurements,
            hasClothingWord,
            hasSize,
            isNewItem
        });

        if (line && isNewItem) {
            if (currentItem) {
                items.push(currentItem);
                console.log('Added item:', currentItem);
            }
            currentItem = { rawTitle: line, details: [], isAccessory };
            console.log('Created new item:', currentItem);
        } else if (currentItem && !line.includes(tagsTemplate)) {
            currentItem.details.push(line);
        }
    });

    if (currentItem) {
        items.push(currentItem);
        console.log('Added final item:', currentItem);
    }

    console.log('Total items found:', items.length);
    return items;
}

export function formatTitle(item) {
    const rawTitle = item.rawTitle;
    // Podziel tytuł na słowa
    const words = rawTitle.split(' ');
    
    // Przetwórz pierwsze trzy słowa aby zaczynały się wielką literą
    const processedWords = words.map((word, index) => {
        if (index < 3) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        return word;
    });
    
    return processedWords.join(' ');
}

export function formatItem(item) {
    const rawTitle = item.rawTitle;
    const details = item.details;
    const isAccessory = item.isAccessory;

    // Extract size from title
    let size = '';
    
    // Sprawdź najpierw "size" z numerem/literą
    const sizeWithWordMatch = rawTitle.match(/size\s+([^\s]+)/i);
    if (sizeWithWordMatch) {
        size = sizeWithWordMatch[1].toUpperCase();
    } else {
        // Sprawdź samodzielne oznaczenia rozmiaru
        const sizeRegex = /\b(XS|S|M|L|XL|XXL|XXXL|[2-5]?XL|(?:2[0-9]|3[0-9]|4[0-9]|50))\b/i;
        const standaloneSizeMatch = rawTitle.match(sizeRegex);
        if (standaloneSizeMatch) {
            size = standaloneSizeMatch[1].toUpperCase();
        }
    }

    // Extract condition
    const condition = rawTitle.includes('bez wad') ? 'Stan idealny / Bez wad' : 'Stan dobry';

    // Process measurements
    const measurements = [];
    
    if (!isAccessory) {
        // For regular items, process all measurements
        details.forEach(detail => {
            console.log('Processing measurement detail:', detail);
            
            // Podziel linię na części
            const parts = detail.split(/\s+/);
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i].toLowerCase();
                const nextPart = parts[i + 1];
                
                // Sprawdź czy aktualna część to oznaczenie wymiaru
                if (/^(p|d|dl|dł|s|u|n|pas|szer|udo|nog)$/i.test(part)) {
                    // Sprawdź czy następna część to liczba
                    if (nextPart && /^\d+$/.test(nextPart)) {
                        const value = nextPart;
                        
                        if (part === 'p' || part === 'pas') {
                            measurements.push(`Pas ${value} cm`);
                        } else if (part === 'd' || part === 'dl' || part === 'dł') {
                            measurements.push(`Długość ${value} cm`);
                        } else if (part === 's' || part === 'szer') {
                            measurements.push(`Szerokość ${value} cm`);
                        } else if (part === 'u' || part === 'udo') {
                            measurements.push(`Udo ${value} cm`);
                        } else if (part === 'n' || part === 'nog') {
                            measurements.push(`Nogawka ${value} cm`);
                        }
                        i++; // Przeskocz następną część, bo już ją użyliśmy
                    }
                }
                // Sprawdź czy to pomiar w formacie "d74"
                else {
                    const measureMatch = part.match(/^(p|d|dl|dł|s|u|n|pas|szer|udo|nog)(\d+)$/i);
                    if (measureMatch) {
                        const [_, type, value] = measureMatch;
                        const typeLower = type.toLowerCase();
                        
                        if (typeLower === 'p' || typeLower === 'pas') {
                            measurements.push(`Pas ${value} cm`);
                        } else if (typeLower === 'd' || typeLower === 'dl' || typeLower === 'dł') {
                            measurements.push(`Długość ${value} cm`);
                        } else if (typeLower === 's' || typeLower === 'szer') {
                            measurements.push(`Szerokość ${value} cm`);
                        } else if (typeLower === 'u' || typeLower === 'udo') {
                            measurements.push(`Udo ${value} cm`);
                        } else if (typeLower === 'n' || typeLower === 'nog') {
                            measurements.push(`Nogawka ${value} cm`);
                        }
                    }
                }
            }
            console.log('Found measurements:', measurements);
        });
    }

    // Clean up the title (remove size and condition info)
    const cleanTitle = rawTitle
        .replace(/size\s+[^\s]+/i, '')
        .replace(/bez wad/i, '')
        .replace(/z wadami/i, '')
        .trim();

    // Format the output
    const titleSection = "🌟 " + cleanTitle + " 🌟";
    const stateSection = "📌 **Stan:** " + condition;
    const sizeSection = !isAccessory && size ? 
        "📏 **Rozmiar:** " + size : 
        "📏 **Rozmiar:** uniwersalny";
    
    const measurementsSection = !isAccessory && measurements.length > 0 ? 
        "\n📐 **Wymiary:**\n" + measurements.join('\n') : 
        '';

    let output = "💎 Jak chcesz wiedzieć wcześniej o itemach zapraszam na instagram kamochi.store 💎\n\n";
    output += titleSection + "\n\n";
    output += stateSection + "\n";
    output += sizeSection;
    if (measurementsSection) output += measurementsSection;
    output += "\n\n" + tagsTemplate;
    return output;
}
