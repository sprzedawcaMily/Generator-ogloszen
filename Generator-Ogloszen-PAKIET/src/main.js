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

const styleByTypeCache = new Map();

// Fetch style by product type
async function fetchStyleByType(productType) {
    try {
        if (!productType) return null;
        const cacheKey = String(productType).trim().toLowerCase();
        if (styleByTypeCache.has(cacheKey)) {
            return styleByTypeCache.get(cacheKey);
        }
        
        const response = await fetch(`http://localhost:3001/api/styles/${encodeURIComponent(productType)}`);
        if (!response.ok) {
            styleByTypeCache.set(cacheKey, null);
            return null;
        }
        
        const style = await response.json();
        styleByTypeCache.set(cacheKey, style || null);
        return style || null;
    } catch (error) {
        console.error(`Error fetching style for type ${productType}:`, error);
        return null;
    }
}

// Fetch data from Firebase
async function fetchFirebaseData() {
    try {
        updateDebug('Pobieranie danych z Firebase...');
        
        const [advertisements, soldAdvertisements, styles, descriptionHeaders] = await Promise.all([
            fetch('http://localhost:3001/api/advertisements').then(r => r.json()),
            fetch('http://localhost:3001/api/advertisements/sold').then(r => r.json()).catch(() => []),
            fetch('http://localhost:3001/api/styles').then(r => r.json()),
            fetch('http://localhost:3001/api/description-headers').then(r => r.json())
        ]);

        updateDebug(`Pobrano ${advertisements.length} ukończonych ogłoszeń`);

        return {
            advertisements: advertisements || [],
            soldAdvertisements: soldAdvertisements || [],
            styles: styles || [],
            descriptionHeaders: descriptionHeaders || []
        };
    } catch (error) {
        updateDebug(`Błąd podczas pobierania danych: ${error.message}`);
        return {
            advertisements: [],
            soldAdvertisements: [],
            styles: [],
            descriptionHeaders: []
        };
    }
}

// Fetch cached exchange rate from server and apply to local config
async function fetchExchangeRate() {
    try {
        const resp = await fetch('/api/exchange-rate');
        if (!resp.ok) return null;
        const json = await resp.json();
        if (json && json.rate) {
            // override client-side constant
            if (typeof window !== 'undefined') {
                window.GRAILED_PLN_TO_USD_RATE = Number(json.rate);
            }
            return json;
        }
    } catch (e) {
        console.warn('Failed to fetch exchange rate:', e);
    }
    return null;
}

function isAdSold(ad) {
    if (ad?.is_sold === true || ad?.isSold === true || ad?.sold === true) {
        return true;
    }
    const normalized = String(ad?.status ?? ad?.sale_status ?? ad?.listing_status ?? '').trim().toLowerCase();
    return normalized === 'sold' || normalized === 'sprzedany' || normalized === 'sprzedane';
}

function applyCardStateClasses(card, adState) {
    card.className = 'item-card completed';
    if (adState?.is_published_to_vinted) {
        card.classList.add('published-vinted');
    }
    if (isAdSold(adState)) {
        card.classList.add('sold');
    }
}

// Create a product card from advertisement data
async function createAdvertisementCard(ad, index, styles, options = {}) {
    const showPublicationButtons = options.showPublicationButtons !== false;
    const card = document.createElement('div');
    applyCardStateClasses(card, ad);
    card.__adState = {
        status: ad.status,
        is_published_to_vinted: ad.is_published_to_vinted === true,
    };

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
    
    if (ad.is_reverse_scraped && ad.title) {
        titleElement.textContent = ad.title;
    } else {
        let title = '';
        if (ad.marka) title += ad.marka + ' ';
        if (ad.rodzaj) title += getShortenedProductType(ad.rodzaj) + ' ';
        if (ad.rozmiar) title += ad.rozmiar + ' ';
        
        // Add description_text from style_templates based on product type
        if (styleToUse && styleToUse.description_text) {
            title += styleToUse.description_text;
        }
        
        titleElement.textContent = title.trim();
    }
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

    if (ad.is_reverse_scraped) {
        if (ad.price_vinted || ad.price) details.push(`Cena: ${ad.price_vinted || ad.price}`);
        if (ad.listing_status) details.push(`Status Vinted: ${ad.listing_status}`);
    } else if (isAdSold(ad)) {
        details.push('Status sprzedaży: sprzedane');
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
    descPreviewContent.textContent = ad.is_reverse_scraped && ad.opis
        ? ad.opis
        : 'Kliknij nagłówek aby rozwinąć podgląd opisu';
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

    if (ad.is_reverse_scraped && ad.listing_url) {
        const openListingBtn = document.createElement('button');
        openListingBtn.textContent = 'Otwórz ogłoszenie Vinted';
        openListingBtn.className = 'copy-btn';
        openListingBtn.style.background = '#0ea5e9';
        openListingBtn.onclick = () => window.open(ad.listing_url, '_blank');
        buttonContainer.appendChild(openListingBtn);
    }

    // Copy Vinted price button
    const copyVintedPriceBtn = document.createElement('button');
    copyVintedPriceBtn.textContent = 'Kopiuj cenę (Vinted)';
    copyVintedPriceBtn.className = 'copy-btn copy-price-vinted-btn';
    copyVintedPriceBtn.onclick = () => copyVintedPrice(ad);
    buttonContainer.appendChild(copyVintedPriceBtn);

    // Copy Grailed price button
    const copyGrailedPriceBtn = document.createElement('button');
    copyGrailedPriceBtn.textContent = 'Kopiuj cenę (Grailed)';
    copyGrailedPriceBtn.className = 'copy-btn copy-price-grailed-btn';
    copyGrailedPriceBtn.onclick = () => copyGrailedPrice(ad);
    buttonContainer.appendChild(copyGrailedPriceBtn);

// Copy Vinted price to clipboard
function copyVintedPrice(ad) {
    // If you have ad.price_vinted, use it; else fallback to ad.price
    const price = ad.price_vinted || ad.price || '';
    if (price) {
        navigator.clipboard.writeText(price.toString());
        showMessage('✅ Skopiowano cenę (Vinted)');
    } else {
        showMessage('❌ Brak ceny do skopiowania (Vinted)');
    }
}

// Copy Grailed price to clipboard
function copyGrailedPrice(ad) {
    // Base price in PLN (prefer platform-specific field)
    const basePLN = parseFloat(ad.price_grailed || ad.price || 0);
    if (!basePLN || isNaN(basePLN)) {
        showMessage('❌ Brak ceny do skopiowania (Grailed)');
        return;
    }
    // Prefer server-provided cached rate if available on window, else use default constant
    const localRate = Number((window.GRAILED_PLN_TO_USD_RATE !== undefined && window.GRAILED_PLN_TO_USD_RATE !== null)
        ? window.GRAILED_PLN_TO_USD_RATE
        : GRAILED_PLN_TO_USD_RATE) || GRAILED_PLN_TO_USD_RATE;

    // Ensure percentage is numeric
    const pct = Number(GRAILED_PRICE_PERCENTAGE) || 0;

    // Convert PLN -> USD (round to nearest integer USD)
    const usd = Math.round(basePLN * localRate);

    // Apply percentage markup
    const finalUsd = Math.round(usd * (1 + (pct / 100)));

    const out = `$${finalUsd}`;
    try {
        navigator.clipboard.writeText(out);
        showMessage(`✅ Skopiowano cenę (Grailed): ${out}`);
    } catch (err) {
        showMessage(`❌ Błąd kopiowania ceny: ${err && err.message ? err.message : err}`);
    }
}

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

    if (showPublicationButtons) {
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

        const soldStatusButton = document.createElement('button');
        soldStatusButton.className = `sold-status-btn ${isAdSold(ad) ? 'sold' : ''}`;
        soldStatusButton.textContent = isAdSold(ad) ? '✓ Sprzedane (finalne)' : '🛒 Oznacz jako sprzedane';
        if (isAdSold(ad)) {
            soldStatusButton.disabled = true;
        }
        soldStatusButton.onclick = () => toggleSoldStatus(ad.id, soldStatusButton, card, ad);
        buttonContainer.appendChild(soldStatusButton);
    }
    
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

// Grailed price conversion config
const GRAILED_PLN_TO_USD_RATE = 0.25; // 1 PLN = 0.25 USD (approximate)
let GRAILED_PRICE_PERCENTAGE = 15; // percent markup to add for Grailed (editable)

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

    // Fetch exchange rate (server caches it at startup)
    try { await fetchExchangeRate(); } catch (e) { /* ignore */ }

    // Show auth bar with username (if known) and loading state
    const storedUsername = (() => { try { return localStorage.getItem('app_username'); } catch (e) { return null; } })();
    renderAuthBar(authContainer, storedUsername);
    container.innerHTML = '<div class="loading">Ładowanie danych z Firebase...</div>';
        
        // Fetch data from Firebase (server scopes by session cookie)
        const data = await fetchFirebaseData();
        
        updateDebug(`Pobrano ${data.advertisements.length} aktywnych, ${data.soldAdvertisements.length} sprzedanych i ${data.styles.length} stylów`);
        
        // Clear loading state
        container.innerHTML = '';
        
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

        // Add Vinted Price Automation buttons
        const priceAutomationContainer = document.createElement('div');
        priceAutomationContainer.className = 'automation-container';
        priceAutomationContainer.style.cssText = 'margin: 20px 0; text-align: center; padding: 20px; background: #f0fdf4; border-radius: 12px; border: 2px solid #22c55e;';
        
        const priceAutomationTitle = document.createElement('h3');
        priceAutomationTitle.textContent = '💰 Automatyzacja Zmiany Cen Vinted';
        priceAutomationTitle.style.cssText = 'margin: 0 0 10px 0; color: #16a34a;';
        
        const priceAutomationDescription = document.createElement('p');
        priceAutomationDescription.textContent = 'Krok 1: Uruchom przeglądarkę i zaloguj się do Vinted. Krok 2: Opcjonalnie wklej URL swojego profilu. Krok 3: Uruchom automatyzację obniżania cen o 25%.';
        priceAutomationDescription.style.cssText = 'margin: 0 0 15px 0; color: #64748b; font-size: 14px;';
        
        // Profile URL input section
        const profileUrlSection = document.createElement('div');
        profileUrlSection.style.cssText = 'margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;';
        
        const profileUrlLabel = document.createElement('label');
        profileUrlLabel.textContent = '🔗 URL Profilu Vinted (opcjonalne):';
        profileUrlLabel.style.cssText = 'display: block; margin-bottom: 8px; color: #374151; font-weight: 500; font-size: 14px;';
        
        const profileUrlInput = document.createElement('input');
        profileUrlInput.type = 'text';
        profileUrlInput.id = 'vintedProfileUrl';
        profileUrlInput.placeholder = 'https://www.vinted.pl/member/12345678 (zostaw puste dla automatycznego wykrywania)';
        profileUrlInput.style.cssText = 'width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; margin-bottom: 10px;';
        
        // Dodatkowe opcje automatyzacji
        const optionsRow = document.createElement('div');
        optionsRow.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 10px 0;';
        
        // Opcja startu od X ogłoszenia
        const startFromContainer = document.createElement('div');
        const startFromLabel = document.createElement('label');
        startFromLabel.textContent = '🚀 Start od ogłoszenia (od dołu):';
        startFromLabel.style.cssText = 'display: block; margin-bottom: 5px; color: #374151; font-weight: 500; font-size: 12px;';
        
        const startFromInput = document.createElement('input');
        startFromInput.type = 'number';
        startFromInput.id = 'vintedStartFrom';
        startFromInput.placeholder = '1';
        startFromInput.min = '1';
        startFromInput.value = '1';
        startFromInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; box-sizing: border-box;';
        
        startFromContainer.appendChild(startFromLabel);
        startFromContainer.appendChild(startFromInput);
        
        // Opcja limitu ogłoszeń
        const limitContainer = document.createElement('div');
        const limitLabel = document.createElement('label');
        limitLabel.textContent = '🔢 Ile ogłoszeń zmienić:';
        limitLabel.style.cssText = 'display: block; margin-bottom: 5px; color: #374151; font-weight: 500; font-size: 12px;';
        
        const limitInput = document.createElement('input');
        limitInput.type = 'number';
        limitInput.id = 'vintedLimit';
        limitInput.placeholder = 'puste = wszystkie';
        limitInput.min = '1';
        limitInput.max = '1000';
        limitInput.value = ''; // Puste pole = wszystkie ogłoszenia
        limitInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; box-sizing: border-box;';
        
        limitContainer.appendChild(limitLabel);
        limitContainer.appendChild(limitInput);
        
        // Opcja procentu zniżki
        const discountContainer = document.createElement('div');
        const discountLabel = document.createElement('label');
        discountLabel.textContent = '💰 Procent zniżki (%):';
        discountLabel.style.cssText = 'display: block; margin-bottom: 5px; color: #374151; font-weight: 500; font-size: 12px;';
        
        const discountInput = document.createElement('input');
        discountInput.type = 'number';
        discountInput.id = 'vintedDiscount';
        discountInput.placeholder = '25';
        discountInput.min = '1';
        discountInput.max = '90';
        discountInput.value = '25'; // Domyślnie 25% zniżki
        discountInput.style.cssText = 'width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; box-sizing: border-box;';
        
        discountContainer.appendChild(discountLabel);
        discountContainer.appendChild(discountInput);
        
        optionsRow.appendChild(startFromContainer);
        optionsRow.appendChild(limitContainer);
        optionsRow.appendChild(discountContainer);
        
        // Przyciski pomocnicze
        const urlButtonsRow = document.createElement('div');
        urlButtonsRow.style.cssText = 'display: flex; gap: 8px; margin: 8px 0; justify-content: flex-start;';
        
        // Przycisk do czyszczenia pola
        const clearUrlButton = document.createElement('button');
        clearUrlButton.textContent = '🗑️ Wyczyść';
        clearUrlButton.style.cssText = 'padding: 6px 12px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; cursor: pointer;';
        clearUrlButton.onclick = () => {
            profileUrlInput.value = '';
            showMessage('🗑️ Pole URL zostało wyczyszczone');
        };
        
        // Przycisk do przykładowego URL
        const exampleUrlButton = document.createElement('button');
        exampleUrlButton.textContent = '📋 Przykład';
        exampleUrlButton.style.cssText = 'padding: 6px 12px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; border-radius: 4px; font-size: 12px; cursor: pointer;';
        exampleUrlButton.onclick = () => {
            profileUrlInput.value = 'https://www.vinted.pl/member/12345678';
            profileUrlInput.focus();
            profileUrlInput.select();
            showMessage('📋 Wklejono przykładowy URL - zastąp 12345678 swoim ID');
        };
        
        urlButtonsRow.appendChild(clearUrlButton);
        urlButtonsRow.appendChild(exampleUrlButton);
        
        const profileUrlHint = document.createElement('p');
        profileUrlHint.textContent = '💡 Wskazówka: Automatyzacja zacznie od najstarszych ogłoszeń (od dołu) i przetworzy określoną liczbę. Start 1 = najstarsze ogłoszenie.';
        profileUrlHint.style.cssText = 'margin: 8px 0 0 0; color: #6b7280; font-size: 12px; font-style: italic;';
        
        profileUrlSection.appendChild(profileUrlLabel);
        profileUrlSection.appendChild(profileUrlInput);
        profileUrlSection.appendChild(optionsRow);
        profileUrlSection.appendChild(urlButtonsRow);
        profileUrlSection.appendChild(profileUrlHint);
        
        const priceButtonRow = document.createElement('div');
        priceButtonRow.style.cssText = 'display: flex; gap: 12px; justify-content: center; align-items: center;';
        
        // Launch Chrome for Price automation button
        const launchPriceChromeButton = document.createElement('button');
        launchPriceChromeButton.textContent = '🚀 Uruchom przeglądarkę';
        launchPriceChromeButton.className = 'automation-btn launch-price-chrome-btn';
        launchPriceChromeButton.style.cssText = 'background: #16a34a; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        launchPriceChromeButton.onclick = () => launchChromeForLogin();
        priceButtonRow.appendChild(launchPriceChromeButton);
        
        // Price automation button
        const priceAutomationButton = document.createElement('button');
        priceAutomationButton.textContent = '💰 Uruchom automatyzację cen';
        priceAutomationButton.className = 'automation-btn price-automation-btn';
        priceAutomationButton.style.cssText = 'background: #15803d; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        priceAutomationButton.onclick = () => runVintedPriceAutomation();
        priceButtonRow.appendChild(priceAutomationButton);

        // Reverse scraper button
        const reverseScraperButton = document.createElement('button');
        reverseScraperButton.textContent = '🔁 Odwrotny scraper';
        reverseScraperButton.className = 'automation-btn reverse-scraper-btn';
        reverseScraperButton.style.cssText = 'background: #0f766e; color: white; padding: 12px 20px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;';
        reverseScraperButton.onclick = () => runVintedReverseScraper();
        priceButtonRow.appendChild(reverseScraperButton);
        
        priceAutomationContainer.appendChild(priceAutomationTitle);
        priceAutomationContainer.appendChild(priceAutomationDescription);
        priceAutomationContainer.appendChild(profileUrlSection);
        priceAutomationContainer.appendChild(priceButtonRow);
        container.appendChild(priceAutomationContainer);
        
        const viewSwitch = document.createElement('div');
        viewSwitch.style.cssText = 'margin: 16px 0; display: flex; gap: 10px; justify-content: center;';

        const activeViewBtn = document.createElement('button');
        activeViewBtn.textContent = '📦 Aktywne ogłoszenia';
        activeViewBtn.className = 'automation-btn';
        activeViewBtn.style.cssText = 'background:#1d4ed8;color:white;padding:10px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:600;';

        const soldViewBtn = document.createElement('button');
        soldViewBtn.textContent = '✅ Sprzedane (archiwum)';
        soldViewBtn.className = 'automation-btn';
        soldViewBtn.style.cssText = 'background:#475569;color:white;padding:10px 16px;border:none;border-radius:8px;cursor:pointer;font-weight:600;';

        viewSwitch.appendChild(activeViewBtn);
        viewSwitch.appendChild(soldViewBtn);
        container.appendChild(viewSwitch);

        const paginationContainer = document.createElement('div');
        paginationContainer.style.cssText = 'margin: 8px 0 16px; display: flex; gap: 10px; justify-content: center; align-items: center;';
        container.appendChild(paginationContainer);

        const prevPageBtn = document.createElement('button');
        prevPageBtn.textContent = '⬅ Poprzednia';
        prevPageBtn.className = 'automation-btn';
        prevPageBtn.style.cssText = 'background:#334155;color:white;padding:8px 12px;border:none;border-radius:8px;cursor:pointer;font-weight:600;';

        const pageInfo = document.createElement('span');
        pageInfo.style.cssText = 'font-weight:700;color:#1f2937;';

        const nextPageBtn = document.createElement('button');
        nextPageBtn.textContent = 'Następna ➡';
        nextPageBtn.className = 'automation-btn';
        nextPageBtn.style.cssText = 'background:#334155;color:white;padding:8px 12px;border:none;border-radius:8px;cursor:pointer;font-weight:600;';

        const jumpToPageInput = document.createElement('input');
        jumpToPageInput.type = 'number';
        jumpToPageInput.min = '1';
        jumpToPageInput.placeholder = 'nr strony';
        jumpToPageInput.style.cssText = 'width:92px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;font-weight:600;';

        const jumpToPageBtn = document.createElement('button');
        jumpToPageBtn.textContent = 'Idź';
        jumpToPageBtn.className = 'automation-btn';
        jumpToPageBtn.style.cssText = 'background:#0f766e;color:white;padding:8px 12px;border:none;border-radius:8px;cursor:pointer;font-weight:600;';

        paginationContainer.appendChild(prevPageBtn);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextPageBtn);
        paginationContainer.appendChild(jumpToPageInput);
        paginationContainer.appendChild(jumpToPageBtn);

        const cardsContainer = document.createElement('div');
        container.appendChild(cardsContainer);

        let currentView = 'active';
        const PAGE_SIZE = 35;
        let currentPage = 1;
        const setActiveViewButtons = () => {
            activeViewBtn.style.background = currentView === 'active' ? '#1d4ed8' : '#64748b';
            soldViewBtn.style.background = currentView === 'sold' ? '#16a34a' : '#64748b';
        };

        const renderCardsForCurrentView = async () => {
            const sourceRaw = currentView === 'sold' ? (data.soldAdvertisements || []) : (data.advertisements || []);
            const source = sourceRaw.filter((ad) => currentView === 'sold' ? isAdSold(ad) : !isAdSold(ad));
            cardsContainer.innerHTML = '';

            if (!source.length) {
                cardsContainer.innerHTML = `<div class="error">Brak ogłoszeń (${currentView === 'sold' ? 'sprzedane' : 'aktywne'})</div>`;
                paginationContainer.style.display = 'none';
                updateDebug(`Widok ${currentView}: brak danych`);
                return;
            }

            const totalPages = Math.max(1, Math.ceil(source.length / PAGE_SIZE));
            if (currentPage > totalPages) currentPage = totalPages;
            if (currentPage < 1) currentPage = 1;
            const startIdx = (currentPage - 1) * PAGE_SIZE;
            const endIdx = Math.min(startIdx + PAGE_SIZE, source.length);
            const pageItems = source.slice(startIdx, endIdx);

            paginationContainer.style.display = 'flex';
            pageInfo.textContent = `Strona ${currentPage}/${totalPages} (${source.length} ogłoszeń)`;
            jumpToPageInput.max = String(totalPages);
            prevPageBtn.disabled = currentPage === 1;
            nextPageBtn.disabled = currentPage === totalPages;
            prevPageBtn.style.opacity = prevPageBtn.disabled ? '0.5' : '1';
            nextPageBtn.style.opacity = nextPageBtn.disabled ? '0.5' : '1';

            for (let i = 0; i < pageItems.length; i++) {
                const ad = pageItems[i];
                const card = await createAdvertisementCard(ad, startIdx + i, data.styles, {
                    showPublicationButtons: currentView !== 'sold',
                });
                cardsContainer.appendChild(card);
            }

            updateDebug(`Widok ${currentView}: wyświetlono ${pageItems.length}/${source.length} ogłoszeń (strona ${currentPage}/${totalPages})`);
        };

        activeViewBtn.onclick = async () => {
            currentView = 'active';
            currentPage = 1;
            setActiveViewButtons();
            await renderCardsForCurrentView();
        };

        soldViewBtn.onclick = async () => {
            currentView = 'sold';
            currentPage = 1;
            setActiveViewButtons();
            await renderCardsForCurrentView();
        };

        prevPageBtn.onclick = async () => {
            if (currentPage <= 1) return;
            currentPage -= 1;
            await renderCardsForCurrentView();
        };

        nextPageBtn.onclick = async () => {
            currentPage += 1;
            await renderCardsForCurrentView();
        };

        const jumpToPage = async () => {
            const sourceRaw = currentView === 'sold' ? (data.soldAdvertisements || []) : (data.advertisements || []);
            const source = sourceRaw.filter((ad) => currentView === 'sold' ? isAdSold(ad) : !isAdSold(ad));
            const totalPages = Math.max(1, Math.ceil(source.length / PAGE_SIZE));
            const requested = Number.parseInt(String(jumpToPageInput.value || '').trim(), 10);
            if (!Number.isFinite(requested)) return;
            const nextPage = Math.min(Math.max(requested, 1), totalPages);
            currentPage = nextPage;
            jumpToPageInput.value = String(nextPage);
            await renderCardsForCurrentView();
        };

        jumpToPageBtn.onclick = jumpToPage;
        jumpToPageInput.addEventListener('keydown', async (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                await jumpToPage();
            }
        });

        setActiveViewButtons();
        await renderCardsForCurrentView();
        
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
        const loggedSection = document.createElement('div');
        loggedSection.className = 'logged-in-section';
        
        const usernameDisplay = document.createElement('div');
        usernameDisplay.innerHTML = `<span class="auth-username">👋 Zalogowany: ${escapeHtml(username)}</span>`;
        
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'auth-btn logout';
        logoutBtn.textContent = '🔒 Wyloguj';
        logoutBtn.onclick = async () => {
            await fetch('http://localhost:3001/api/logout', { method: 'POST' });
            try { localStorage.removeItem('app_username'); } catch (e) {}
            init();
        };
        
        loggedSection.appendChild(usernameDisplay);
        loggedSection.appendChild(logoutBtn);
        bar.appendChild(loggedSection);
    } else {
        // Enhanced login form
        const form = document.createElement('form');
        form.className = 'login-form';

        const usernameInput = document.createElement('input');
        usernameInput.placeholder = '👤 Wpisz nick';
        usernameInput.name = 'username';
        usernameInput.className = 'login-input';
        usernameInput.autocomplete = 'username';

        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = '🚀 Zaloguj';
        submit.className = 'auth-btn login';

        form.appendChild(usernameInput);
        form.appendChild(submit);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            submit.disabled = true;
            submit.textContent = '⏳ Logowanie...';
            
            const u = usernameInput.value.trim();
            try {
                const resp = await fetch('http://localhost:3001/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: u })
                });
                const json = await resp.json();
                if (json && json.success) {
                    try { localStorage.setItem('app_username', u); } catch (e) {}
                    showMessage('✅ Zalogowano pomyślnie!');
                    init();
                } else {
                    showMessage('❌ Błąd logowania: ' + (json && json.message ? json.message : 'nieznany'));
                }
            } catch (err) {
                showMessage('🌐 Błąd sieci: ' + err.message);
            } finally {
                submit.disabled = false;
                submit.textContent = '🚀 Zaloguj';
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
    username.placeholder = 'nick';
    username.name = 'username';
    username.style.cssText = 'padding:8px; border-radius:6px; border:1px solid #ddd;';

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
    form.appendChild(submit);
    form.appendChild(logoutBtn);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submit.disabled = true;
        const u = username.value.trim();
        try {
            const resp = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u })
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

// Function to run reverse Vinted scraper (drafts first, then active)
async function runVintedReverseScraper() {
    try {
        const profileUrlInput = document.getElementById('vintedProfileUrl');
        const profileUrl = profileUrlInput ? profileUrlInput.value.trim() : '';

        if (profileUrl) {
            showMessage(`🔁 Uruchamiam odwrotny scraper dla profilu: ${profileUrl}`);
        } else {
            showMessage('🔁 Uruchamiam odwrotny scraper (bieżący profil Vinted)...');
        }

        const response = await fetch('/api/vinted/reverse-scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ profileUrl: profileUrl || undefined })
        });

        const result = await response.json();

        if (result.success) {
            showMessage('✅ ' + result.message);
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error running reverse scraper:', error);
        showMessage('❌ Błąd reverse scrapera: ' + error.message);
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
                showMessage('✅ Oznaczono jako opublikowane na Vinted');
            } else {
                button.textContent = '⊕ Nie opublikowane';
                button.className = 'vinted-status-btn';
                showMessage('✅ Oznaczono jako nieopublikowane na Vinted');
            }
            applyCardStateClasses(card, { ...card.__adState, is_published_to_vinted: result.is_published_to_vinted });
            card.__adState = { ...(card.__adState || {}), is_published_to_vinted: result.is_published_to_vinted };
        } else {
            showMessage('❌ Błąd: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling Vinted status:', error);
        showMessage('❌ Błąd zmiany statusu: ' + error.message);
    }
}

// Toggle advertisement sold status
async function toggleSoldStatus(advertisementId, button, card, ad) {
    try {
        if (isAdSold(ad)) {
            showMessage('ℹ️ To ogłoszenie jest już sprzedane i nie można cofnąć tej decyzji.');
            button.disabled = true;
            return;
        }
        const confirmed = window.confirm('Czy na pewno chcesz oznaczyć to ogłoszenie jako sprzedane? Tej decyzji nie można cofnąć.');
        if (!confirmed) {
            return;
        }
        showMessage('🔄 Aktualizuję status sprzedaży...');

        const response = await fetch('/api/advertisements/toggle-sold-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                advertisementId
            })
        });

        const result = await response.json();

        if (result.success) {
            ad.status = 'sold';
            button.textContent = '✓ Sprzedane (finalne)';
            button.className = 'sold-status-btn sold';
            button.disabled = true;
            applyCardStateClasses(card, { ...ad, ...(card.__adState || {}), status: ad.status });
            card.__adState = { ...(card.__adState || {}), status: ad.status };
            card.style.opacity = '0.5';
            setTimeout(() => card.remove(), 250);
            showMessage('✅ Ogłoszenie oznaczone jako sprzedane i przeniesione do archiwum');
        } else {
            showMessage('❌ Błąd: ' + result.message);
        }
    } catch (error) {
        console.error('Error toggling sold status:', error);
        showMessage('❌ Błąd zmiany statusu sprzedaży: ' + error.message);
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

// Function to run Vinted price automation
async function runVintedPriceAutomation() {
    try {
        // Pobierz wszystkie parametry z pól
        const profileUrlInput = document.getElementById('vintedProfileUrl');
        const startFromInput = document.getElementById('vintedStartFrom');
        const limitInput = document.getElementById('vintedLimit');
        const discountInput = document.getElementById('vintedDiscount');
        
        const profileUrl = profileUrlInput ? profileUrlInput.value.trim() : '';
        const startFrom = startFromInput ? parseInt(startFromInput.value) || 1 : 1;
        const limit = limitInput && limitInput.value ? parseInt(limitInput.value) : -1; // -1 = wszystkie ogłoszenia
        const discount = discountInput ? parseInt(discountInput.value) || 25 : 25; // domyślnie 25%
        
        // Walidacja parametrów
        if (startFrom < 1) {
            showMessage('❌ Start musi być większy niż 0');
            return;
        }
        
        if (limit !== -1 && (limit < 1 || limit > 1000)) {
            showMessage('❌ Limit musi być -1 (wszystkie) lub między 1 a 1000');
            return;
        }
        
        if (discount < 1 || discount > 90) {
            showMessage('❌ Procent zniżki musi być między 1% a 90%');
            return;
        }
        
        if (profileUrl) {
            // Walidacja URL
            if (!profileUrl.includes('vinted.pl/member/') || !profileUrl.match(/\/member\/\d+/)) {
                showMessage('❌ Nieprawidłowy URL profilu. Powinien być w formacie: https://www.vinted.pl/member/12345678');
                return;
            }
            const limitText = limit === -1 ? 'wszystkie' : limit;
            showMessage(`💰 Uruchamiam automatyzację cen dla profilu: ${profileUrl} (start: ${startFrom}, limit: ${limitText}, zniżka: ${discount}%)`);
        } else {
            const limitText = limit === -1 ? 'wszystkie' : limit;
            showMessage(`💰 Uruchamiam automatyzację cen z automatycznym wykrywaniem profilu (start: ${startFrom}, limit: ${limitText}, zniżka: ${discount}%)`);
        }
        
        const response = await fetch('/api/vinted/price-automation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profileUrl: profileUrl || undefined,
                startFrom: startFrom,
                limit: limit,
                discount: discount
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('✅ ' + result.message);
        } else {
            showMessage('❌ ' + result.message);
        }
    } catch (error) {
        console.error('Error running Vinted price automation:', error);
        showMessage('❌ Błąd automatyzacji cen Vinted: ' + error.message);
    }
}

// Call init when the window loads
window.addEventListener('load', () => {
    updateDebug('Strona załadowana, inicjalizacja...');
    init().catch(error => {
        updateDebug(`Błąd podczas inicjalizacji: ${error.message}`);
    });
});
