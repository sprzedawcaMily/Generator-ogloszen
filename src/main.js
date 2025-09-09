// Debug function
function updateDebug(message) {
    const debug = document.getElementById('debug');
    if (debug) {
        debug.textContent = message;
    }
    console.log(message);
}

// Show message function
function showMessage(text) {
    const messageBox = document.getElementById('messageBox');
    if (messageBox) {
        messageBox.textContent = text;
        messageBox.style.cssText = 'position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #059669; color: white; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; opacity: 1; visibility: visible;';
        setTimeout(() => {
            messageBox.style.opacity = '0';
            messageBox.style.visibility = 'hidden';
        }, 5000);
    }
}

// Function to get shortened version of product type
function getShortenedProductType(rodzaj) {
    if (!rodzaj) return '';
    
    const typeMap = {
        'kurtka': 'Kurtka',
        'Koszule w kratkę': 'Koszula',
        'Koszule dżinsowe': 'Koszula',
        'Koszule gładkie': 'Koszula',
        'Koszulki z nadrukiem': 'Koszulka',
        'Koszule w paski': 'Koszula',
        'T-shirty gładkie': 'T-shirt',
        'T-shirty z nadrukiem': 'T-shirt',
        'T-shirty w paski': 'T-shirt',
        'Koszulki polo': 'Polo',
        'Koszulki z długim rękawem': 'Koszulka',
        'Podkoszulki': 'Podkoszulka',
        'Bluzy': 'Bluza',
        'Swetry i bluzy z kapturem': 'Bluza',
        'Bluzy rozpinane': 'Bluza',
        'Kardigany': 'Kardigan',
        'Swetry z okrągłym dekoltem': 'Sweter',
        'Swetry w serek': 'Sweter',
        'Swetry z golfem': 'Sweter',
        'Długie swetry': 'Sweter',
        'Swetry z dzianiny': 'Sweter',
        'Kamizelki': 'Kamizelka',
        'Spodnie z szerokimi nogawkami': 'Spodnie',
        'Szorty cargo': 'Szorty',
        'Szorty chinosy': 'Szorty',
        'Szorty dżinsowe': 'Szorty',
        'Mokasyny, buty żeglarskie, loafersy': 'Mokasyny',
        'Chodaki i mule': 'Chodaki',
        'Espadryle': 'Espadryle',
        'Klapki i japonki': 'Klapki',
        'Obuwie wizytowe': 'Buty',
        'Sandały': 'Sandały',
        'Kapcie': 'Kapcie',
        'Obuwie sportowe': 'Buty',
        'Sneakersy, trampki i tenisówki': 'Sneakersy',
        'Chusty i chustki': 'Chusta',
        'Paski': 'Pasek',
        'Szelki': 'Szelki',
        'Rękawiczki': 'Rękawiczki',
        'Chusteczki': 'Chusteczka',
        'Kapelusze i czapki': 'Czapka',
        'Biżuteria': 'Biżuteria',
        'Poszetki': 'Poszetka',
        'Szaliki i szale': 'Szalik',
        'Okulary przeciwsłoneczne': 'Okulary',
        'Krawaty i muszki': 'Krawat',
        'Zegarki': 'Zegarek',
        'Plecaki': 'Plecak',
        'Teczki': 'Teczka',
        'Nerki': 'Nerka',
        'Pokrowce na ubrania': 'Pokrowiec',
        'Torby na siłownię': 'Torba',
        'Torby podróżne': 'Torba',
        'Walizki': 'Walizka',
        'Listonoszki': 'Listonoszka',
        'Torby na ramię': 'Torba',
        'Portfele': 'Portfel'
    };
    
    return typeMap[rodzaj] || rodzaj;
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
    // Ustaw klasę CSS na podstawie statusu publikacji na Vinted
    if (ad.is_published_to_vinted) {
        card.className = 'item-card completed published-vinted';
    } else {
        card.className = 'item-card completed';
    }

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
    if (ad.rodzaj) title += getShortenedProductType(ad.rodzaj) + ' ';
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
    
    // Copy English title button
    const copyEnglishTitleBtn = document.createElement('button');
    copyEnglishTitleBtn.textContent = 'Kopiuj tytuł (EN)';
    copyEnglishTitleBtn.className = 'copy-btn copy-title-en-btn';
    copyEnglishTitleBtn.onclick = async () => {
        const eng = await generateEnglishTitle(ad);
        if (eng) {
            await navigator.clipboard.writeText(eng);
            showMessage('✅ Skopiowano tytuł (EN)');
        } else {
            showMessage('❌ Nie udało się wygenerować tytułu (EN)');
        }
    };
    buttonContainer.appendChild(copyEnglishTitleBtn);
    
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

    // Copy English description button
    const copyEnglishDescBtn = document.createElement('button');
    copyEnglishDescBtn.textContent = 'Kopiuj opis (EN)';
    copyEnglishDescBtn.className = 'copy-btn copy-desc-en-btn';
    copyEnglishDescBtn.onclick = async () => {
        try {
            // Fetch styles and grailed-specific description header
            const specificStyle = await fetchStyleByType(ad.typ);
            const stylesToUse = specificStyle ? [specificStyle] : (window._cachedStyles || []);
            const headersResp = await fetch(`/api/description-headers?platform=grailed`);
            const headers = headersResp.ok ? await headersResp.json() : [];
            const engDesc = await generateEnglishDescription(ad, stylesToUse, headers);
            if (engDesc) {
                await navigator.clipboard.writeText(engDesc);
                showMessage('✅ Skopiowano opis (EN)');
            } else {
                showMessage('❌ Nie udało się wygenerować opisu (EN)');
            }
        } catch (error) {
            console.error('Error generating English description:', error);
            showMessage('❌ Błąd podczas generowania opisu (EN)');
        }
    };
    buttonContainer.appendChild(copyEnglishDescBtn);

    // Vinted status button
    const vintedStatusButton = document.createElement('button');
    vintedStatusButton.className = `vinted-status-btn ${ad.is_published_to_vinted ? 'published' : ''}`;
    vintedStatusButton.textContent = ad.is_published_to_vinted ? '✓ Opublikowane' : '⊕ Nie opublikowane';
    vintedStatusButton.onclick = () => toggleVintedStatus(ad.id, vintedStatusButton, card);
    buttonContainer.appendChild(vintedStatusButton);
    
    // Grailed status button
    const grailedStatusButton = document.createElement('button');
    grailedStatusButton.className = `grailed-status-btn ${ad.is_published_to_grailed ? 'published' : ''}`;
    grailedStatusButton.textContent = ad.is_published_to_grailed ? '✓ Opublikowane (Grailed)' : '⊕ Nie opublikowane (Grailed)';
    grailedStatusButton.onclick = () => toggleGrailedStatus(ad.id, grailedStatusButton, card);
    buttonContainer.appendChild(grailedStatusButton);
    
    card.appendChild(buttonContainer);

    return card;
}

// Toggle Grailed publication status
async function toggleGrailedStatus(advertisementId, button, card) {
    try {
        showMessage('🔄 Aktualizuję status Grailed...');

        const response = await fetch('/api/grailed/toggle-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ advertisementId })
        });

        const result = await response.json();

        if (result.success) {
            if (result.is_published_to_grailed) {
                button.textContent = '✓ Opublikowane (Grailed)';
                button.className = 'grailed-status-btn published';
                showMessage('✅ Oznaczono jako opublikowane na Grailed');
            } else {
                button.textContent = '⊕ Nie opublikowane (Grailed)';
                button.className = 'grailed-status-btn';
                showMessage('✅ Oznaczono jako nieopublikowane na Grailed');
            }
        } else {
            showMessage('❌ Błąd: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling Grailed status:', error);
        showMessage('❌ Błąd zmiany statusu: ' + error.message);
    }
}

// Function to run Vinted automation
async function runVintedAutomation() {
    try {
        updateDebug('🚀 Uruchamianie automatyzacji Vinted...');
        
        const response = await fetch('/api/vinted/automate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            updateDebug('✅ Automatyzacja Vinted uruchomiona pomyślnie!');
            showMessage('Automatyzacja Vinted uruchomiona! Sprawdź konsolę serwera dla postępu.');
        } else {
            updateDebug(`❌ Błąd automatyzacji: ${result.message}`);
            showMessage(`Błąd: ${result.message}`);
        }
    } catch (error) {
        updateDebug(`❌ Błąd podczas uruchamiania automatyzacji: ${error.message}`);
        showMessage(`Błąd: ${error.message}`);
    }
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
    if (ad.szerokosc) {
        description += `Szerokość ${ad.szerokosc} cm\n`;
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

// Generate English title similar to GrailedAutomation.fillTitle
async function generateEnglishTitle(ad) {
    try {
        const productTypeTranslations = {
            'kurtka': 'jacket',
            'Koszule w kratkę': 'checkered shirt',
            'Koszule dżinsowe': 'denim shirt',
            'Koszule gładkie': 'solid shirt',
            'Koszulki z nadrukiem': 'printed t-shirt',
            'Koszule w paski': 'striped shirt',
            'T-shirty gładkie': 'solid t-shirt',
            'T-shirty z nadrukiem': 'printed t-shirt',
            'T-shirty w paski': 'striped t-shirt',
            'Koszulki polo': 'polo shirt',
            'Koszulki z długim rękawem': 'long sleeve shirt',
            'Podkoszulki': 'undershirt',
            'Bluzy': 'sweatshirt',
            'Swetry i bluzy z kapturem': 'hoodie',
            'Bluzy rozpinane': 'zip up sweatshirt',
            'Kardigany': 'cardigan',
            'Swetry z okrągłym dekoltem': 'crew neck sweater',
            'Swetry w serek': 'v-neck sweater',
            'Swetry z golfem': 'turtleneck sweater',
            'Długie swetry': 'long sweater',
            'Swetry z dzianiny': 'knit sweater',
            'Kamizelki': 'vest',
            'Spodnie z szerokimi nogawkami': 'wide leg pants',
            'Szorty cargo': 'cargo shorts',
            'Szorty chinosy': 'chino shorts',
            'Szorty dżinsowe': 'denim shorts',
            'Mokasyny, buty żeglarskie, loafersy': 'loafers',
            'Chodaki i mule': 'clogs and mules',
            'Espadryle': 'espadrilles',
            'Klapki i japonki': 'flip flops',
            'Obuwie wizytowe': 'dress shoes',
            'Sandały': 'sandals',
            'Kapcie': 'slippers',
            'Obuwie sportowe': 'sneakers',
            'Sneakersy, trampki i tenisówki': 'sneakers',
            'Chusty i chustki': 'scarves',
            'Paski': 'belts',
            'Szelki': 'suspenders',
            'Rękawiczki': 'gloves',
            'Chusteczki': 'handkerchiefs',
            'Kapelusze i czapki': 'hats and caps',
            'Biżuteria': 'jewelry',
            'Poszetki': 'pocket squares',
            'Szaliki i szale': 'scarves',
            'Okulary przeciwsłoneczne': 'sunglasses',
            'Krawaty i muszki': 'ties and bow ties',
            'Zegarki': 'watches',
            'Plecaki': 'backpacks',
            'Teczki': 'briefcases',
            'Nerki': 'fanny packs',
            'Pokrowce na ubrania': 'garment bags',
            'Torby na siłownię': 'gym bags',
            'Torby podróżne': 'travel bags',
            'Walizki': 'suitcases',
            'Listonoszki': 'messenger bags',
            'Torby na ramię': 'shoulder bags',
            'Portfele': 'wallets'
        };

        const englishProductType = productTypeTranslations[ad.rodzaj] || ad.rodzaj || 'item';
        const brand = ad.marka || 'Brand';
        const size = ad.rozmiar || '';

        let title = `${brand} ${englishProductType}`;
        if (size) title += ` size ${size}`;
        return title.trim();
    } catch (error) {
        console.error('Error generating English title:', error);
        return '';
    }
}

// Generate English description similar to GrailedAutomation.generateDescription
async function generateEnglishDescription(ad, styles, descriptionHeaders) {
    try {
        let description = '';
        const styleToUse = (styles && styles.length > 0) ? styles[0] : null;

        if (descriptionHeaders && descriptionHeaders.length > 0) {
            const header = descriptionHeaders[0];
            if (header.title) description += `${header.title}\n\n`;
        }

    // Title part - use the same generated English title so description matches the title
    const engTitle = await generateEnglishTitle(ad);
    description += '🌟 ' + (engTitle || '') + ' 🌟\n\n';

        // Condition
        description += '📌 **Condition:** ';
        if (ad.stan) {
            description += ad.stan;
            if (ad.wada && ad.wada.trim() !== '') description += ` / ${ad.wada}`;
            else description += ' / No flaws';
        } else {
            description += 'No flaws';
        }
        description += '\n';

        if (ad.rozmiar) description += `📏 **Size:** ${ad.rozmiar}\n`;
        if (ad.color) description += `🎨 **Color:** ${ad.color}\n`;

        const hasMeasurements = ad.pas || ad.dlugosc || ad.szerokosc || ad.udo || ad.dlugosc_nogawki;
        if (hasMeasurements) {
            description += '📐 **Measurements:**\n';
            if (ad.pas) description += `Waist ${ad.pas} cm\n`;
            if (ad.dlugosc) description += `Length ${ad.dlugosc} cm\n`;
            if (ad.szerokosc) description += `Width ${ad.szerokosc} cm\n`;
            if (ad.udo) description += `Thigh ${ad.udo} cm\n`;
            if (ad.dlugosc_nogawki) description += `Inseam ${ad.dlugosc_nogawki} cm\n`;
        }

        if (styleToUse && styleToUse.footer_text) description += `${styleToUse.footer_text}`;

        return description;
    } catch (error) {
        console.error('Error generating English description:', error);
        return '';
    }
}

// Copy advertisement title to clipboard
async function copyAdvertisementTitle(ad, styles) {
    try {
        // Get style specific to this product type
        const specificStyle = await fetchStyleByType(ad.typ);
        const styleToUse = specificStyle || (styles && styles.length > 0 ? styles[0] : null);
        
        let title = '';
        if (ad.marka) title += ad.marka + ' ';
        if (ad.rodzaj) title += getShortenedProductType(ad.rodzaj) + ' ';
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
    // Ensure auth container exists
    const authContainer = document.getElementById('authContainer');
    if (!authContainer) {
        updateDebug('Nie znaleziono kontenera authContainer');
        return;
    }
    
    try {
        // Check login state first
        container.innerHTML = '';
        authContainer.innerHTML = '';
        const meResp = await fetch('http://localhost:3001/api/me');
        let me = null;
        try { me = await meResp.json(); } catch (e) { me = null; }

        // If not logged in, render login form and stop here (login will call init again)
        if (!me || !me.userId) {
            renderAuthBar(authContainer, null);
            return;
        }

    // Show auth bar with username (if known) and loading state
    const storedUsername = (() => { try { return localStorage.getItem('app_username'); } catch (e) { return null; } })();
    renderAuthBar(authContainer, storedUsername);
    container.innerHTML = '<div class="loading">Ładowanie danych z Supabase...</div>';
        
        // Fetch data from Supabase (server will scope by cookie)
        const data = await fetchSupabaseData();
        
        updateDebug(`Pobrano ${data.advertisements.length} reklam, ${data.styles.length} stylów`);
        
        // Clear loading state
        container.innerHTML = '';
        
        if (data.advertisements.length === 0) {
            container.innerHTML = '<div class="error">Brak danych do wyświetlenia</div>';
            return;
        }
        
        // Add Vinted automation buttons
        const automationContainer = document.createElement('div');
        automationContainer.className = 'automation-container';
        automationContainer.style.cssText = 'margin: 20px 0; text-align: center; padding: 20px; background: #f0f9ff; border-radius: 12px; border: 2px solid #0ea5e9;';
        
        const automationTitle = document.createElement('h3');
        automationTitle.textContent = '🤖 Automatyzacja Vinted';
        automationTitle.style.cssText = 'margin: 0 0 10px 0; color: #0369a1;';
        
        const automationDescription = document.createElement('p');
        automationDescription.textContent = 'Krok 1: Uruchom przeglądarkę i zaloguj się do Google/Vinted. Krok 2: Podłącz automatyzację do publikacji ogłoszeń.';
        automationDescription.style.cssText = 'margin: 0 0 15px 0; color: #64748b; font-size: 14px;';
        
        const buttonRow = document.createElement('div');
        buttonRow.style.cssText = 'display: flex; gap: 12px; justify-content: center; align-items: center;';
        
        // Launch Chrome button
        const launchChromeButton = document.createElement('button');
        launchChromeButton.textContent = '🚀 Uruchom przeglądarkę';
        launchChromeButton.className = 'automation-btn launch-chrome-btn';
        launchChromeButton.style.cssText = 'background: #3b82f6; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        launchChromeButton.onclick = () => launchChromeForLogin();
        buttonRow.appendChild(launchChromeButton);
        
        // Connect automation button
        const connectAutomationButton = document.createElement('button');
        connectAutomationButton.textContent = '� Podłącz automatyzację';
        connectAutomationButton.className = 'automation-btn connect-automation-btn';
        connectAutomationButton.style.cssText = 'background: #059669; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        connectAutomationButton.onclick = () => connectVintedAutomation();
        buttonRow.appendChild(connectAutomationButton);
        
        automationContainer.appendChild(automationTitle);
        automationContainer.appendChild(automationDescription);
        automationContainer.appendChild(buttonRow);
        container.appendChild(automationContainer);

        // Add Grailed automation buttons
        const grailedAutomationContainer = document.createElement('div');
        grailedAutomationContainer.className = 'automation-container';
        grailedAutomationContainer.style.cssText = 'margin: 20px 0; text-align: center; padding: 20px; background: #fef2f2; border-radius: 12px; border: 2px solid #ef4444;';
        
        const grailedAutomationTitle = document.createElement('h3');
        grailedAutomationTitle.textContent = '🔥 Automatyzacja Grailed';
        grailedAutomationTitle.style.cssText = 'margin: 0 0 10px 0; color: #dc2626;';
        
        const grailedAutomationDescription = document.createElement('p');
        grailedAutomationDescription.textContent = 'Krok 1: Uruchom Chrome dla Grailed i zaloguj się. Krok 2: Uruchom automatyzację publikacji.';
        grailedAutomationDescription.style.cssText = 'margin: 0 0 15px 0; color: #64748b; font-size: 14px;';
        
        const grailedButtonRow = document.createElement('div');
        grailedButtonRow.style.cssText = 'display: flex; gap: 12px; justify-content: center; align-items: center;';
        
        // Launch Chrome for Grailed button
        const launchGrailedChromeButton = document.createElement('button');
        launchGrailedChromeButton.textContent = '🚀 Uruchom Chrome dla Grailed';
        launchGrailedChromeButton.className = 'automation-btn launch-grailed-chrome-btn';
        launchGrailedChromeButton.style.cssText = 'background: #dc2626; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        launchGrailedChromeButton.onclick = () => launchChromeForGrailed();
        grailedButtonRow.appendChild(launchGrailedChromeButton);
        
        // Grailed automation button
        const grailedAutomationButton = document.createElement('button');
        grailedAutomationButton.textContent = '⚡ Uruchom automatyzację Grailed';
        grailedAutomationButton.className = 'automation-btn grailed-automation-btn';
        grailedAutomationButton.style.cssText = 'background: #7c2d12; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        grailedAutomationButton.onclick = () => connectGrailedAutomation();
        grailedButtonRow.appendChild(grailedAutomationButton);
        
        grailedAutomationContainer.appendChild(grailedAutomationTitle);
        grailedAutomationContainer.appendChild(grailedAutomationDescription);
        grailedAutomationContainer.appendChild(grailedButtonRow);
        container.appendChild(grailedAutomationContainer);
        
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

// Render an auth bar: if username provided, show greeting + logout; otherwise show compact login form
function renderAuthBar(container, username) {
    container.innerHTML = '';
    const bar = document.createElement('div');
    bar.className = 'auth-bar';

    if (username) {
        const left = document.createElement('div');
        left.innerHTML = `<span class="auth-username">Zalogowany: ${escapeHtml(username)}</span>`;
        bar.appendChild(left);

        const right = document.createElement('div');
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'auth-btn logout';
        logoutBtn.textContent = 'Wyloguj';
        logoutBtn.onclick = async () => {
            await fetch('http://localhost:3001/api/logout', { method: 'POST' });
            try { localStorage.removeItem('app_username'); } catch (e) {}
            init();
        };
        right.appendChild(logoutBtn);
        bar.appendChild(right);
    } else {
        // compact login form
        const form = document.createElement('form');
        form.style.cssText = 'display:flex; gap:8px; align-items:center;';

        const usernameInput = document.createElement('input');
        usernameInput.placeholder = 'username';
        usernameInput.name = 'username';
        usernameInput.style.cssText = 'padding:8px; border-radius:6px; border:1px solid #ddd;';

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.placeholder = 'password';
        passwordInput.name = 'password';
        passwordInput.style.cssText = 'padding:8px; border-radius:6px; border:1px solid #ddd;';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = 'Zaloguj';
        submit.className = 'auth-btn login';

        form.appendChild(usernameInput);
        form.appendChild(passwordInput);
        form.appendChild(submit);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submit.disabled = true;
            const u = usernameInput.value.trim();
            const p = passwordInput.value;
            try {
                const resp = await fetch('http://localhost:3001/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u, password: p })
                });
                const json = await resp.json();
                if (json && json.success) {
                    try { localStorage.setItem('app_username', u); } catch (e) {}
                    showMessage('Zalogowano');
                    init();
                } else {
                    showMessage('Błąd logowania: ' + (json && json.message ? json.message : 'nieznany'));
                }
            } catch (err) {
                showMessage('Błąd sieci: ' + err.message);
            } finally {
                submit.disabled = false;
            }
        });

        bar.appendChild(form);
    }

    container.appendChild(bar);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, function (m) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m];
    });
}

// Floating logout button helper


// Render a simple login form inside the auth container
function renderLoginForm(container) {
    container.innerHTML = '';
    const form = document.createElement('form');
    form.style.cssText = 'display:flex; gap:8px; align-items:center; margin-bottom:12px;';

    const username = document.createElement('input');
    username.placeholder = 'username';
    username.name = 'username';
    username.style.cssText = 'padding:8px; border-radius:6px; border:1px solid #ddd;';

    const password = document.createElement('input');
    password.type = 'password';
    password.placeholder = 'password';
    password.name = 'password';
    password.style.cssText = 'padding:8px; border-radius:6px; border:1px solid #ddd;';

    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Zaloguj';
    submit.style.cssText = 'padding:8px 12px; border-radius:6px; background:#2563eb; color:white; border:none; cursor:pointer;';

    const logoutBtn = document.createElement('button');
    logoutBtn.type = 'button';
    logoutBtn.textContent = 'Wyloguj';
    logoutBtn.style.cssText = 'padding:8px 12px; border-radius:6px; background:#ef4444; color:white; border:none; cursor:pointer; margin-left:8px; display:none;';
    logoutBtn.onclick = async () => {
        await fetch('http://localhost:3001/api/logout', { method: 'POST' });
        // Re-init to show login
        init();
    };

    form.appendChild(username);
    form.appendChild(password);
    form.appendChild(submit);
    form.appendChild(logoutBtn);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submit.disabled = true;
        const u = username.value.trim();
        const p = password.value;
        try {
            const resp = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            const json = await resp.json();
            if (json && json.success) {
                showMessage('Zalogowano');
                // Re-init to load user-specific ads
                init();
            } else {
                showMessage('Błąd logowania: ' + (json && json.message ? json.message : 'nieznany'));
            }
        } catch (err) {
            showMessage('Błąd sieci: ' + err.message);
        } finally {
            submit.disabled = false;
        }
    });

    container.appendChild(form);
}

// Function to launch Chrome for login
async function launchChromeForLogin() {
    try {
        showMessage('🚀 Uruchamiam Chrome...');
        
        const response = await fetch('/api/chrome/launch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message);
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error launching Chrome:', error);
        showMessage('❌ Błąd uruchamiania Chrome: ' + error.message);
    }
}

// Function to connect Vinted automation
async function connectVintedAutomation() {
    try {
        showMessage('🔗 Podłączam automatyzację...');
        
        const response = await fetch('/api/vinted/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message);
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error connecting automation:', error);
        showMessage('❌ Błąd podłączenia automatyzacji: ' + error.message);
    }
}

// Toggle Vinted publication status
async function toggleVintedStatus(advertisementId, button, card) {
    try {
        showMessage('🔄 Aktualizuję status Vinted...');
        
        const response = await fetch('/api/vinted/toggle-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                advertisementId: advertisementId 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Aktualizuj UI
            if (result.is_published_to_vinted) {
                button.textContent = '✓ Opublikowane';
                button.className = 'vinted-status-btn published';
                card.className = 'item-card completed published-vinted';
                showMessage('✅ Oznaczono jako opublikowane na Vinted');
            } else {
                button.textContent = '⊕ Nie opublikowane';
                button.className = 'vinted-status-btn';
                card.className = 'item-card completed';
                showMessage('✅ Oznaczono jako nieopublikowane na Vinted');
            }
        } else {
            showMessage('❌ Błąd: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling Vinted status:', error);
        showMessage('❌ Błąd zmiany statusu: ' + error.message);
    }
}

// Function to launch Chrome for Grailed
async function launchChromeForGrailed() {
    try {
        showMessage('🚀 Uruchamiam Chrome dla Grailed...');
        
        const response = await fetch('/api/chrome/launch-grailed', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message);
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error launching Chrome for Grailed:', error);
        showMessage('❌ Błąd uruchamiania Chrome dla Grailed: ' + error.message);
    }
}

// Function to connect Grailed automation
async function connectGrailedAutomation() {
    try {
        showMessage('⚡ Uruchamiam automatyzację Grailed...');
        
        const response = await fetch('/api/grailed/automate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message);
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error connecting Grailed automation:', error);
        showMessage('❌ Błąd automatyzacji Grailed: ' + error.message);
    }
}

// Call init when the window loads
window.addEventListener('load', () => {
    updateDebug('Strona załadowana, inicjalizacja...');
    init().catch(error => {
        updateDebug(`Błąd podczas inicjalizacji: ${error.message}`);
    });
});
