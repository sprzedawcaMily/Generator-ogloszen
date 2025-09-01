import puppeteer from 'puppeteer';

async function debugPhotoUpload() {
    console.log('🔍 Debug Photo Upload Elements...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // Połącz z istniejącą przeglądarką jeśli możliwe
        console.log('🔗 Próbuję połączyć z istniejącą przeglądarką...');
        
        await browser.close();
        
        // Użyj istniejącej przeglądarki
        const existingBrowser = await puppeteer.connect({
            browserURL: 'http://localhost:9222',
            defaultViewport: null
        });
        
        const pages = await existingBrowser.pages();
        const vintedPage = pages.find(p => p.url().includes('vinted.pl')) || await existingBrowser.newPage();
        
        if (!vintedPage.url().includes('vinted.pl')) {
            await vintedPage.goto('https://www.vinted.pl/items/new', { waitUntil: 'networkidle2' });
        }
        
        console.log('📍 Analyzing page for photo upload elements...');
        
        // Analizuj wszystkie elementy związane z uploadem
        const uploadElements = await vintedPage.evaluate(() => {
            const results = {
                fileInputs: [] as any[],
                buttons: [] as any[],
                dropZones: [] as any[],
                uploadAreas: [] as any[]
            };
            
            // Znajdź input[type="file"]
            const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'));
            results.fileInputs = fileInputs.map((input, i) => ({
                index: i,
                name: (input as HTMLInputElement).name,
                accept: (input as HTMLInputElement).accept,
                multiple: (input as HTMLInputElement).multiple,
                className: input.className,
                id: input.id,
                style: (input as HTMLElement).style.cssText,
                hidden: (input as HTMLElement).offsetParent === null
            }));
            
            // Znajdź przyciski związane ze zdjęciami
            const buttons = Array.from(document.querySelectorAll('button'));
            results.buttons = buttons
                .filter(btn => {
                    const text = btn.textContent?.toLowerCase() || '';
                    return text.includes('zdjęc') || text.includes('photo') || text.includes('image') || text.includes('dodaj');
                })
                .map((btn, i) => ({
                    index: i,
                    text: btn.textContent?.trim(),
                    className: btn.className,
                    id: btn.id,
                    dataset: Object.keys(btn.dataset).length > 0 ? btn.dataset : undefined
                }));
            
            // Znajdź potencjalne drop zones
            const allDivs = Array.from(document.querySelectorAll('div'));
            results.dropZones = allDivs
                .filter(div => {
                    const className = div.className.toLowerCase();
                    const textContent = div.textContent?.toLowerCase() || '';
                    return className.includes('drop') || 
                           className.includes('upload') || 
                           className.includes('photo') ||
                           textContent.includes('przeciągnij') ||
                           textContent.includes('drop');
                })
                .slice(0, 5)
                .map((div, i) => ({
                    index: i,
                    className: div.className,
                    id: div.id,
                    textContent: div.textContent?.trim().substring(0, 100)
                }));
            
            return results;
        });
        
        console.log('\n📋 ANALIZA ELEMENTÓW UPLOAD:');
        console.log('\n🗂️  FILE INPUTS:');
        uploadElements.fileInputs.forEach(input => {
            console.log(`${input.index}: [${input.hidden ? 'UKRYTY' : 'WIDOCZNY'}] name="${input.name}" accept="${input.accept}" multiple=${input.multiple}`);
            console.log(`   className: ${input.className}`);
            console.log(`   style: ${input.style}`);
        });
        
        console.log('\n🔘 PRZYCISKI ZDJĘĆ:');
        uploadElements.buttons.forEach(btn => {
            console.log(`${btn.index}: "${btn.text}"`);
            console.log(`   className: ${btn.className}`);
        });
        
        console.log('\n🎯 POTENCJALNE DROP ZONES:');
        uploadElements.dropZones.forEach(zone => {
            console.log(`${zone.index}: className="${zone.className}"`);
            console.log(`   text: "${zone.textContent}"`);
        });
        
        console.log('\n💡 REKOMENDACJE:');
        if (uploadElements.fileInputs.length > 0) {
            const visibleInputs = uploadElements.fileInputs.filter(i => !i.hidden);
            if (visibleInputs.length > 0) {
                console.log('✅ Znaleziono widoczne input[type="file"] - użyj uploadFile()');
            } else {
                console.log('⚠️  Input file jest ukryty - trzeba go najpierw odsłonić lub kliknąć przycisk');
            }
        } else {
            console.log('❌ Brak input[type="file"] - może być dynamicznie dodawany');
        }
        
        if (uploadElements.buttons.length > 0) {
            console.log('✅ Znaleziono przyciski do zdjęć - kliknij żeby odsłonić input');
        }
        
        console.log('\n⏳ Czekam 30 sekund na Twoją inspekcję...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ Błąd:', error);
    }
}

if (import.meta.main) {
    debugPhotoUpload().catch(console.error);
}
