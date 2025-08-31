// Debug function
function updateDebug(message) {
    const debug = document.getElementById('debug');
    if (debug) {
        debug.textContent = message;
    }
    console.log(message);
}

// Fetch style by product type
async function fetchStyleByType(productType) {
    try {
        if (!productType) return null;
        
        const response = await fetch(`http://localhost:3001/api/styles/${encodeURIComponent(productType)}`);
        if (!response.ok) return null;
        
        return await response.json();
    } catch (error) {
        console.error(`Error fetching style for type ${productType}:`, error);
        return null;
    }
}

// Fetch data from Supabase
async function fetchSupabaseData() {
    try {
        updateDebug('Pobieranie danych z Supabase...');
        
        const [advertisements, styles, descriptionHeaders] = await Promise.all([
            fetch('http://localhost:3001/api/advertisements').then(r => r.json()),
            fetch('http://localhost:3001/api/styles').then(r => r.json()),
            fetch('http://localhost:3001/api/description-headers').then(r => r.json())
        ]);

        updateDebug(`Pobrano ${advertisements.length} ukończonych ogłoszeń`);

        return {
            advertisements: advertisements || [],
            styles: styles || [],
            descriptionHeaders: descriptionHeaders || []
        };
    } catch (error) {
        updateDebug(`Błąd podczas pobierania danych: ${error.message}`);
        return {
            advertisements: [],
            styles: [],
            descriptionHeaders: []
        };
    }
}

// Create a product card from advertisement data
async function createAdvertisementCard(ad, index, styles) {
    const card = document.createElement('div');
    card.className = 'item-card completed';

    const itemNumber = document.createElement('span');
    itemNumber.className = 'item-number';
    itemNumber.textContent = String(index + 1);
    card.appendChild(itemNumber);

    // Get style specific to this product type
    const specificStyle = await fetchStyleByType(ad.typ);
    const styleToUse = specificStyle || (styles && styles.length > 0 ? styles[0] : null);

    // Title with new format: {marka}{rodzaj}{rozmiar}{description_text}
    const titleElement = document.createElement('div');
    titleElement.className = 'title-preview';
    
    let title = '';
    if (ad.marka) title += ad.marka + ' ';
    if (ad.rodzaj) title += ad.rodzaj + ' ';
    if (ad.rozmiar) title += ad.rozmiar + ' ';
    
    // Add description_text from style_templates based on product type
    if (styleToUse && styleToUse.description_text) {
        title += styleToUse.description_text;
    }
    
    titleElement.textContent = title.trim();
    card.appendChild(titleElement);

    // Details
    const detailsElement = document.createElement('div');
    detailsElement.className = 'preview-container';
    
    let details = [];
    if (ad.stan) details.push(`Stan: ${ad.stan}`);
    if (ad.typ) details.push(`Typ: ${ad.typ}`);
    if (ad.wada) details.push(`Wada: ${ad.wada}`);
    
    // Add measurements if available
    const measurements = [];
    if (ad.dlugosc) measurements.push(`d ${ad.dlugosc}`);
    if (ad.szerokosc) measurements.push(`s ${ad.szerokosc}`);
    if (ad.pas) measurements.push(`p ${ad.pas}`);
    if (ad.udo) measurements.push(`u ${ad.udo}`);
    if (ad.dlugosc_nogawki) measurements.push(`n ${ad.dlugosc_nogawki}`);
    
    if (measurements.length > 0) {
        details.push(`Wymiary: ${measurements.join(' ')}`);
    }
    
    detailsElement.textContent = details.join('\n');
    card.appendChild(detailsElement);

    // Description preview section
    const descPreviewContainer = document.createElement('div');
    descPreviewContainer.className = 'description-preview-container collapsed';
    
    const descPreviewHeader = document.createElement('div');
    descPreviewHeader.textContent = 'Podgląd opisu';
    descPreviewHeader.className = 'description-preview-header';
    descPreviewHeader.onclick = () => toggleDescriptionPreview(descPreviewContainer, ad, descPreviewContent);
    descPreviewContainer.appendChild(descPreviewHeader);
    
    const descPreviewContent = document.createElement('div');
    descPreviewContent.className = 'description-preview-content';
    descPreviewContent.textContent = 'Kliknij nagłówek aby rozwinąć podgląd opisu';
    descPreviewContainer.appendChild(descPreviewContent);
    
    const refreshPreviewBtn = document.createElement('button');
    refreshPreviewBtn.textContent = 'Odśwież podgląd';
    refreshPreviewBtn.className = 'copy-btn refresh-preview-btn';
    refreshPreviewBtn.onclick = () => refreshDescriptionPreview(ad, descPreviewContent);
    descPreviewContainer.appendChild(refreshPreviewBtn);
    
    card.appendChild(descPreviewContainer);

    // Photos
    if (ad.photo_uris && ad.photo_uris.length > 0) {
        const photoContainer = document.createElement('div');
        photoContainer.className = 'photo-container';
        
        ad.photo_uris.forEach((photoUrl, i) => {
            if (i < 3) { // Show max 3 photos
                const img = document.createElement('img');
                img.src = photoUrl;
                img.className = 'product-photo';
                img.style.cssText = 'width: 60px; height: 60px; object-fit: cover; margin: 2px; border-radius: 4px;';
                img.onerror = () => {
                    img.style.display = 'none';
                };
                photoContainer.appendChild(img);
            }
        });
        
        card.appendChild(photoContainer);
    }

    // Copy buttons container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    
    // Copy title button
    const copyTitleButton = document.createElement('button');
    copyTitleButton.textContent = 'Kopiuj tytuł';
    copyTitleButton.className = 'copy-btn copy-title-btn';
    copyTitleButton.onclick = () => copyAdvertisementTitle(ad, styles);
    buttonContainer.appendChild(copyTitleButton);
    
    // Download photos button
    const downloadPhotosButton = document.createElement('button');
    downloadPhotosButton.textContent = 'Pobierz zdjęcia';
    downloadPhotosButton.className = 'copy-btn copy-photos-btn';
    downloadPhotosButton.onclick = () => downloadAdvertisementPhotos(ad);
    buttonContainer.appendChild(downloadPhotosButton);

    // Copy description button
    const copyDescButton = document.createElement('button');
    copyDescButton.textContent = 'Kopiuj opis';
    copyDescButton.className = 'copy-btn copy-desc-btn';
    copyDescButton.onclick = () => copyAdvertisementToClipboard(ad);
    buttonContainer.appendChild(copyDescButton);
    
    card.appendChild(buttonContainer);

    return card;
}

// Generate formatted description for advertisement
async function generateAdvertisementDescription(ad, styles, descriptionHeaders) {
    let description = '';
    
    // Get style specific to this product type
    const specificStyle = await fetchStyleByType(ad.typ);
    const styleToUse = specificStyle || (styles && styles.length > 0 ? styles[0] : null);
    
    // Add header from description_headers table (Instagram invite)
    if (descriptionHeaders && descriptionHeaders.length > 0) {
        const header = descriptionHeaders[0];
        if (header.title) {
            description += `${header.title}\n\n`;
        }
    }
    
    // Product title with stars: 🌟 {marka} {rodzaj} {description_text} 🌟
    description += '🌟 ';
    if (ad.marka) description += ad.marka + ' ';
    if (ad.rodzaj) description += ad.rodzaj + ' ';
    
    // Add description_text from style_templates based on product type
    if (styleToUse && styleToUse.description_text) {
        description += styleToUse.description_text + ' ';
    }
    description += '🌟\n\n';
    
    // Stan with emoji
    description += '📌 **Stan:** ';
    if (ad.stan) {
        description += ad.stan;
        if (ad.wada) {
            description += ` / ${ad.wada}`;
        } else {
            description += ' / Bez wad';
        }
    } else {
        description += 'Bez wad';
    }
    description += '\n';
    
    // Rozmiar with emoji
    if (ad.rozmiar) {
        description += `📏 **Rozmiar:** ${ad.rozmiar}\n`;
    }
    
    // Kolor with emoji
    if (ad.color) {
        description += `🎨 **Kolor:** ${ad.color}\n`;
    }
    
    // Wymiary with emoji
    description += '📐 **Wymiary:**\n';
    if (ad.pas) {
        description += `Pas ${ad.pas} cm\n`;
    }
    if (ad.dlugosc) {
        description += `Długość ${ad.dlugosc} cm\n`;
    }
    if (ad.udo) {
        description += `Udo ${ad.udo} cm\n`;
    }
    if (ad.dlugosc_nogawki) {
        description += `Nogawka ${ad.dlugosc_nogawki} cm\n`;
    }
    
    description += '\n';
    
    // Add footer from style_templates based on product type
    if (styleToUse && styleToUse.footer_text) {
        description += `${styleToUse.footer_text}`;
    }
    
    return description;
}

// Copy advertisement title to clipboard
async function copyAdvertisementTitle(ad, styles) {
    try {
        // Get style specific to this product type
        const specificStyle = await fetchStyleByType(ad.typ);
        const styleToUse = specificStyle || (styles && styles.length > 0 ? styles[0] : null);
        
        let title = '';
        if (ad.marka) title += ad.marka + ' ';
        if (ad.rodzaj) title += ad.rodzaj + ' ';
        if (ad.rozmiar) title += ad.rozmiar + ' ';
        
        // Add description_text from style_templates based on product type
        if (styleToUse && styleToUse.description_text) {
            title += styleToUse.description_text;
        }
        
        await navigator.clipboard.writeText(title.trim());
        updateDebug('Tytuł skopiowany do schowka!');
    } catch (error) {
        updateDebug(`Błąd kopiowania tytułu: ${error.message}`);
    }
}

// Toggle description preview visibility
function toggleDescriptionPreview(container, ad, contentElement) {
    const isCollapsed = container.classList.contains('collapsed');
    container.classList.toggle('collapsed');
    
    // If expanding and content is empty or default, automatically refresh
    if (isCollapsed && (contentElement.textContent === 'Kliknij nagłówek aby rozwinąć podgląd opisu' || contentElement.textContent.includes('Kliknij'))) {
        refreshDescriptionPreview(ad, contentElement);
    }
}

// Refresh description preview
async function refreshDescriptionPreview(ad, previewElement) {
    try {
        previewElement.textContent = 'Ładowanie...';
        
        const [styles, descriptionHeaders] = await Promise.all([
            fetch('http://localhost:3001/api/styles').then(r => r.json()),
            fetch('http://localhost:3001/api/description-headers').then(r => r.json())
        ]);
        
        const description = await generateAdvertisementDescription(ad, styles, descriptionHeaders);
        previewElement.textContent = description;
        
    } catch (error) {
        previewElement.textContent = `Błąd ładowania podglądu: ${error.message}`;
    }
}

// Download advertisement photos to local disk
async function downloadAdvertisementPhotos(ad) {
    try {
        if (ad.photo_uris && ad.photo_uris.length > 0) {
            updateDebug(`Rozpoczynam pobieranie ${ad.photo_uris.length} zdjęć...`);
            
            for (let i = 0; i < ad.photo_uris.length; i++) {
                const photoUrl = ad.photo_uris[i];
                const fileName = `${ad.marka || 'product'}_${ad.typ || 'item'}_${i + 1}.jpg`;
                
                try {
                    // Fetch the image
                    const response = await fetch(photoUrl);
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    
                    const blob = await response.blob();
                    
                    // Create download link
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    
                    // Add to DOM, click, and remove
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Clean up the URL object
                    window.URL.revokeObjectURL(url);
                    
                    updateDebug(`Pobrano zdjęcie ${i + 1}/${ad.photo_uris.length}: ${fileName}`);
                } catch (error) {
                    updateDebug(`Błąd pobierania zdjęcia ${i + 1}: ${error.message}`);
                }
            }
            
            updateDebug(`Zakończono pobieranie zdjęć dla ${ad.marka || 'product'}`);
        } else {
            updateDebug('Brak zdjęć do pobrania');
        }
    } catch (error) {
        updateDebug(`Błąd pobierania zdjęć: ${error.message}`);
    }
}

// Copy advertisement to clipboard
async function copyAdvertisementToClipboard(ad) {
    try {
        const [styles, descriptionHeaders] = await Promise.all([
            fetch('http://localhost:3001/api/styles').then(r => r.json()),
            fetch('http://localhost:3001/api/description-headers').then(r => r.json())
        ]);
        
        const description = await generateAdvertisementDescription(ad, styles, descriptionHeaders);
        
        await navigator.clipboard.writeText(description);
        updateDebug('Opis skopiowany do schowka!');
    } catch (error) {
        updateDebug(`Błąd kopiowania: ${error.message}`);
    }
}

// Initialize the application
async function init() {
    const container = document.getElementById('itemsContainer');
    if (!container) {
        updateDebug('Nie znaleziono kontenera itemsContainer');
        return;
    }
    
    try {
        // Show loading state
        container.innerHTML = '<div class="loading">Ładowanie danych z Supabase...</div>';
        
        // Fetch data from Supabase
        const data = await fetchSupabaseData();
        
        updateDebug(`Pobrano ${data.advertisements.length} reklam, ${data.styles.length} stylów`);
        
        // Clear loading state
        container.innerHTML = '';
        
        if (data.advertisements.length === 0) {
            container.innerHTML = '<div class="error">Brak danych do wyświetlenia</div>';
            return;
        }
        
        // Create and append advertisement cards
        for (let i = 0; i < data.advertisements.length; i++) {
            const ad = data.advertisements[i];
            const card = await createAdvertisementCard(ad, i, data.styles);
            container.appendChild(card);
        }
        
        updateDebug(`Wyświetlono ${data.advertisements.length} ukończonych ogłoszeń`);
        
    } catch (error) {
        updateDebug(`Błąd podczas inicjalizacji: ${error.message}`);
        container.innerHTML = '<div class="error">Wystąpił błąd podczas ładowania danych</div>';
    }
}

// Call init when the window loads
window.addEventListener('load', () => {
    updateDebug('Strona załadowana, inicjalizacja...');
    init().catch(error => {
        updateDebug(`Błąd podczas inicjalizacji: ${error.message}`);
    });
});
