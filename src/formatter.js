import { tagsTemplate } from './data.js';

export function parseData(data) {
    const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const items = [];
    let currentItem = null;

    lines.forEach(line => {
        // Sprawdź czy to jest akcesoria
        const isAccessory = line.toLowerCase().includes('okulary') || 
                          line.toLowerCase().includes('plecak') ||
                          line.toLowerCase().includes('czapka') ||
                          line.toLowerCase().includes('klapki') ||
                          line.toLowerCase().includes('bucket');
        
        // Sprawdź czy linia zawiera "size" lub kończy się na rozmiar
        const isSizeLine = line.toLowerCase().includes('size') || /\b(xs|s|m|l|xl|xxl|xxxl|\d+\/?\d*)\b/i.test(line);
        // Sprawdź czy linia nie jest parametrem (nie zaczyna się od p, d, s, u, n)
        const isNotMeasurement = !line.match(/^[pdsun]\s*\d+/i);
        
        // Jeśli to akcesorium lub linia z rozmiarem
        if (line && (isAccessory || (isSizeLine && isNotMeasurement))) {
            if (currentItem) {
                items.push(currentItem);
            }
            currentItem = { rawTitle: line, details: [], isAccessory };
        } else if (currentItem) {
            // Nie dodawaj pustych linii ani tagu template
            if (line && !line.includes(tagsTemplate)) {
                currentItem.details.push(line);
            }
        }
    });

    if (currentItem) {
        items.push(currentItem);
    }

    return items;
}

export function formatTitle(item) {
    const rawTitle = item.rawTitle;
    return rawTitle;
}

export function formatItem(item) {
    const rawTitle = item.rawTitle;
    const details = item.details;
    const isAccessory = item.isAccessory;

    // Extract size from title
    const sizeMatch = rawTitle.match(/size\s+([^\s]+)/i);
    const size = sizeMatch ? sizeMatch[1].toUpperCase() : '';

    // Extract condition
    const condition = rawTitle.includes('bez wad') ? 'Stan idealny / Bez wad' : 'Stan dobry';

    // Process measurements
    const measurements = [];
    
    if (!isAccessory) {
        // For regular items, process all measurements
        details.forEach(detail => {
            const parts = detail.split(' ');
            if (parts.length >= 2) {
                if (parts[0].toLowerCase() === 'p' || parts[0].toLowerCase() === 'pas') {
                    measurements.push(`Pas ${parts[1]} cm`);
                } else if (parts[0].toLowerCase() === 'd' || parts[0].toLowerCase() === 'dl') {
                    measurements.push(`Długość ${parts[1]} cm`);
                } else if (parts[0].toLowerCase() === 's') {
                    measurements.push(`Szerokość ${parts[1]} cm`);
                } else if (parts[0].toLowerCase() === 'u') {
                    measurements.push(`Udo ${parts[1]} cm`);
                } else if (parts[0].toLowerCase() === 'n') {
                    measurements.push(`Nogawka ${parts[1]} cm`);
                }
            }
        });
    }

    // Clean up the title (remove size and condition info)
    const cleanTitle = rawTitle
        .replace(/size\s+[^\s]+/i, '')
        .replace(/bez wad/i, '')
        .replace(/z wadami/i, '')
        .trim();

    // Format the output
    const titleSection = cleanTitle;
    const stateSection = "**stan:** " + condition;
    const sizeSection = !isAccessory && size ? 
        "**rozmiar:** " + size : 
        "**rozmiar:** uniwersalny";
    
    const measurementsSection = !isAccessory && measurements.length > 0 ? 
        "\n**wymiary:**\n" + measurements.join('\n') : 
        '';

    let output = "Jak chcesz wiedzieć wcześniej o itemach zapraszam na instagram kamochi.store\n\n";
    output += titleSection + "\n\n";
    output += "**stan:** " + condition + "\n";
    output += sizeSection;
    if (measurementsSection) output += measurementsSection;
    output += "\n\n" + tagsTemplate;
    return output;
}
