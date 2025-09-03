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

// Function to get Grailed category mapping
function getGrailedCategoryMapping(rodzaj) {
    if (!rodzaj) return { department: 'Menswear', category: 'Tops' };
    
    const categoryMap = {
        // Tops
        'kurtka': { department: 'Menswear', category: 'Outerwear' },
        'Koszule w kratkę': { department: 'Menswear', category: 'Tops' },
        'Koszule dżinsowe': { department: 'Menswear', category: 'Tops' },
        'Koszule gładkie': { department: 'Menswear', category: 'Tops' },
        'Koszulki z nadrukiem': { department: 'Menswear', category: 'Tops' },
        'Koszule w paski': { department: 'Menswear', category: 'Tops' },
        'T-shirty gładkie': { department: 'Menswear', category: 'Tops' },
        'T-shirty z nadrukiem': { department: 'Menswear', category: 'Tops' },
        'T-shirty w paski': { department: 'Menswear', category: 'Tops' },
        'Koszulki polo': { department: 'Menswear', category: 'Tops' },
        'Koszulki z długim rękawem': { department: 'Menswear', category: 'Tops' },
        'Podkoszulki': { department: 'Menswear', category: 'Tops' },
        'Bluzy': { department: 'Menswear', category: 'Tops' },
        'Swetry i bluzy z kapturem': { department: 'Menswear', category: 'Tops' },
        'Bluzy rozpinane': { department: 'Menswear', category: 'Tops' },
        'Kardigany': { department: 'Menswear', category: 'Tops' },
        'Swetry z okrągłym dekoltem': { department: 'Menswear', category: 'Tops' },
        'Swetry w serek': { department: 'Menswear', category: 'Tops' },
        'Swetry z golfem': { department: 'Menswear', category: 'Tops' },
        'Długie swetry': { department: 'Menswear', category: 'Tops' },
        'Swetry z dzianiny': { department: 'Menswear', category: 'Tops' },
        'Kamizelki': { department: 'Menswear', category: 'Tops' },
        
        // Bottoms
        'Spodnie z szerokimi nogawkami': { department: 'Menswear', category: 'Bottoms' },
        'Szorty cargo': { department: 'Menswear', category: 'Bottoms' },
        'Szorty chinosy': { department: 'Menswear', category: 'Bottoms' },
        'Szorty dżinsowe': { department: 'Menswear', category: 'Bottoms' },
        
        // Footwear
        'Mokasyny, buty żeglarskie, loafersy': { department: 'Menswear', category: 'Footwear' },
        'Chodaki i mule': { department: 'Menswear', category: 'Footwear' },
        'Espadryle': { department: 'Menswear', category: 'Footwear' },
        'Klapki i japonki': { department: 'Menswear', category: 'Footwear' },
        'Obuwie wizytowe': { department: 'Menswear', category: 'Footwear' },
        'Sandały': { department: 'Menswear', category: 'Footwear' },
        'Kapcie': { department: 'Menswear', category: 'Footwear' },
        'Obuwie sportowe': { department: 'Menswear', category: 'Footwear' },
        'Sneakersy, trampki i tenisówki': { department: 'Menswear', category: 'Footwear' },
        
        // Accessories
        'Chusty i chustki': { department: 'Menswear', category: 'Accessories' },
        'Paski': { department: 'Menswear', category: 'Accessories' },
        'Szelki': { department: 'Menswear', category: 'Accessories' },
        'Rękawiczki': { department: 'Menswear', category: 'Accessories' },
        'Chusteczki': { department: 'Menswear', category: 'Accessories' },
        'Kapelusze i czapki': { department: 'Menswear', category: 'Accessories' },
        'Biżuteria': { department: 'Menswear', category: 'Accessories' },
        'Poszetki': { department: 'Menswear', category: 'Accessories' },
        'Szaliki i szale': { department: 'Menswear', category: 'Accessories' },
        'Okulary przeciwsłoneczne': { department: 'Menswear', category: 'Accessories' },
        'Krawaty i muszki': { department: 'Menswear', category: 'Accessories' },
        'Zegarki': { department: 'Menswear', category: 'Accessories' },
        'Plecaki': { department: 'Menswear', category: 'Accessories' },
        'Teczki': { department: 'Menswear', category: 'Accessories' },
        'Nerki': { department: 'Menswear', category: 'Accessories' },
        'Pokrowce na ubrania': { department: 'Menswear', category: 'Accessories' },
        'Torby na siłownię': { department: 'Menswear', category: 'Accessories' },
        'Torby podróżne': { department: 'Menswear', category: 'Accessories' },
        'Walizki': { department: 'Menswear', category: 'Accessories' },
        'Listonoszki': { department: 'Menswear', category: 'Accessories' },
        'Torby na ramię': { department: 'Menswear', category: 'Accessories' },
        'Portfele': { department: 'Menswear', category: 'Accessories' }
    };
    
    return categoryMap[rodzaj] || { department: 'Menswear', category: 'Tops' };
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

    // Vinted status button
    const vintedStatusButton = document.createElement('button');
    vintedStatusButton.className = `vinted-status-btn ${ad.is_published_to_vinted ? 'published' : ''}`;
    vintedStatusButton.textContent = ad.is_published_to_vinted ? '✓ Opublikowane' : '⊕ Nie opublikowane';
    vintedStatusButton.onclick = () => toggleVintedStatus(ad.id, vintedStatusButton, card);
    buttonContainer.appendChild(vintedStatusButton);

    // Grailed status button
    const grailedStatusButton = document.createElement('button');
    grailedStatusButton.className = `grailed-status-btn ${ad.is_published_to_grailed ? 'published' : ''}`;
    grailedStatusButton.textContent = ad.is_published_to_grailed ? '✓ Grailed' : '🏷️ Grailed';
    grailedStatusButton.style.cssText = `background: ${ad.is_published_to_grailed ? '#10b981' : '#f59e0b'}; color: white; padding: 8px 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600; margin: 2px;`;
    grailedStatusButton.onclick = () => toggleGrailedStatus(ad.id, grailedStatusButton, card);
    buttonContainer.appendChild(grailedStatusButton);
    
    card.appendChild(buttonContainer);

    return card;
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

// Toggle Grailed publication status
async function toggleGrailedStatus(advertisementId, button, card) {
    try {
        showMessage('🔄 Aktualizuję status Grailed...');
        
        const response = await fetch('/api/grailed/toggle-status', {
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
            if (result.is_published_to_grailed) {
                button.textContent = '✓ Grailed';
                button.style.background = '#10b981';
                showMessage('✅ Oznaczono jako opublikowane na Grailed');
            } else {
                button.textContent = '🏷️ Grailed';
                button.style.background = '#f59e0b';
                showMessage('✅ Oznaczono jako nieopublikowane na Grailed');
            }
        } else {
            showMessage('❌ Błąd: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling Grailed status:', error);
        showMessage('❌ Błąd zmiany statusu Grailed: ' + error.message);
    }
}

// Function to launch Grailed automation
async function launchGrailedAutomation() {
    try {
        showMessage('🏷️ Uruchamiam automatyzację Grailed...');
        
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
        console.error('Error launching Grailed automation:', error);
        showMessage('❌ Błąd uruchamiania Grailed: ' + error.message);
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
        
        // Add Grailed automation section
        const grailedContainer = document.createElement('div');
        grailedContainer.className = 'automation-container';
        grailedContainer.style.cssText = 'margin: 20px 0; text-align: center; padding: 20px; background: #fef3c7; border-radius: 12px; border: 2px solid #f59e0b;';
        
        const grailedTitle = document.createElement('h3');
        grailedTitle.textContent = '🏷️ Automatyzacja Grailed';
        grailedTitle.style.cssText = 'margin: 0 0 10px 0; color: #92400e;';
        
        const grailedDescription = document.createElement('p');
        grailedDescription.textContent = 'Krok 1: Uruchom przeglądarkę i zaloguj się na Grailed. Krok 2: Podłącz automatyzację do publikacji ogłoszeń.';
        grailedDescription.style.cssText = 'margin: 0 0 15px 0; color: #64748b; font-size: 14px;';
        
        const grailedButtonRow = document.createElement('div');
        grailedButtonRow.style.cssText = 'display: flex; gap: 12px; justify-content: center; align-items: center;';
        
        // Launch Chrome for Grailed button
        const launchChromeGrailedButton = document.createElement('button');
        launchChromeGrailedButton.textContent = '🌐 Uruchom przeglądarkę';
        launchChromeGrailedButton.className = 'automation-btn launch-chrome-grailed-btn';
        launchChromeGrailedButton.style.cssText = 'background: #dc2626; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        launchChromeGrailedButton.onclick = () => launchChromeForGrailed();
        grailedButtonRow.appendChild(launchChromeGrailedButton);
        
        // Launch Grailed automation button
        const launchGrailedButton = document.createElement('button');
        launchGrailedButton.textContent = '🏷️ Podłącz automatyzację';
        launchGrailedButton.className = 'automation-btn launch-grailed-btn';
        launchGrailedButton.style.cssText = 'background: #f59e0b; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        launchGrailedButton.onclick = () => launchGrailedAutomation();
        grailedButtonRow.appendChild(launchGrailedButton);
        
        grailedContainer.appendChild(grailedTitle);
        grailedContainer.appendChild(grailedDescription);
        grailedContainer.appendChild(grailedButtonRow);
        container.appendChild(grailedContainer);
        
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

// Function to launch Chrome for Grailed
async function launchChromeForGrailed() {
    try {
        showMessage('🌐 Uruchamiam Chrome dla Grailed...');
        
        const response = await fetch('/api/chrome/launch-grailed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message + ' - Zaloguj się na grailed.com');
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error launching Chrome for Grailed:', error);
        showMessage('❌ Błąd uruchamiania Chrome dla Grailed: ' + error.message);
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

// Call init when the window loads
window.addEventListener('load', () => {
    updateDebug('Strona załadowana, inicjalizacja...');
    init().catch(error => {
        updateDebug(`Błąd podczas inicjalizacji: ${error.message}`);
    });
});
