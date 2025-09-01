import puppeteer from 'puppeteer';

async function debugVinted() {
    console.log('🔍 Debug Vinted - sprawdzanie elementów strony...');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    try {
        // Idź na Vinted
        console.log('📍 Nawigacja na Vinted...');
        await page.goto('https://www.vinted.pl', { waitUntil: 'networkidle2' });
        
        // Poczekaj na załadowanie
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Sprawdź wszystkie przyciski i linki
        console.log('🔍 Szukanie wszystkich przycisków i linków...');
        const elements = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button')).map((btn, index) => ({
                type: 'button',
                index,
                text: btn.textContent?.trim() || '',
                classes: btn.className,
                id: btn.id,
                dataset: Object.keys(btn.dataset).length > 0 ? btn.dataset : undefined
            }));
            
            const links = Array.from(document.querySelectorAll('a')).map((link, index) => ({
                type: 'link',
                index,
                text: link.textContent?.trim() || '',
                href: link.getAttribute('href'),
                classes: link.className,
                id: link.id,
                dataset: Object.keys(link.dataset).length > 0 ? link.dataset : undefined
            }));
            
            return { buttons, links };
        });
        
        console.log('\n📋 PRZYCISKI NA STRONIE:');
        elements.buttons.forEach(btn => {
            if (btn.text.length > 0) {
                console.log(`${btn.index}: "${btn.text}" [classes: ${btn.classes}] ${btn.id ? `[id: ${btn.id}]` : ''}`);
            }
        });
        
        console.log('\n🔗 LINKI NA STRONIE:');
        elements.links.forEach(link => {
            if (link.text.length > 0 && link.href) {
                console.log(`${link.index}: "${link.text}" -> ${link.href} [classes: ${link.classes}] ${link.id ? `[id: ${link.id}]` : ''}`);
            }
        });
        
        // Sprawdź czy istnieje przycisk sprzedaj
        console.log('\n🎯 SZUKANIE PRZYCISKU SPRZEDAJ:');
        const sellButtons = await page.evaluate(() => {
            const allElements = [
                ...Array.from(document.querySelectorAll('button')),
                ...Array.from(document.querySelectorAll('a'))
            ];
            
            return allElements
                .map((el, index) => ({
                    index,
                    type: el.tagName.toLowerCase(),
                    text: el.textContent?.trim() || '',
                    href: el.getAttribute('href'),
                    classes: el.className,
                    matchesSell: el.textContent?.toLowerCase().includes('sprzedaj') || 
                                el.getAttribute('href')?.includes('/items/new') ||
                                false
                }))
                .filter(el => el.matchesSell || el.href?.includes('/items/new') || el.text.toLowerCase().includes('sprzedaj'));
        });
        
        if (sellButtons.length > 0) {
            console.log('✅ Znalezione elementy związane ze sprzedażą:');
            sellButtons.forEach(btn => {
                console.log(`- ${btn.type}: "${btn.text}" ${btn.href ? `-> ${btn.href}` : ''} [${btn.classes}]`);
            });
        } else {
            console.log('❌ Nie znaleziono elementów związanych ze sprzedażą');
        }
        
        // Sprawdź stan logowania
        console.log('\n🔐 SPRAWDZANIE STANU LOGOWANIA:');
        const loginStatus = await page.evaluate(() => {
            const bodyText = document.body.textContent?.toLowerCase() || '';
            const hasLogin = bodyText.includes('zaloguj');
            const hasProfile = bodyText.includes('profil') || bodyText.includes('konto');
            const hasLogout = bodyText.includes('wyloguj');
            
            return {
                hasLogin,
                hasProfile,
                hasLogout,
                likelyLoggedIn: !hasLogin && (hasProfile || hasLogout)
            };
        });
        
        console.log(`Prawdopodobnie zalogowany: ${loginStatus.likelyLoggedIn ? '✅' : '❌'}`);
        console.log(`Ma tekst "zaloguj": ${loginStatus.hasLogin ? '✅' : '❌'}`);
        console.log(`Ma tekst "profil": ${loginStatus.hasProfile ? '✅' : '❌'}`);
        console.log(`Ma tekst "wyloguj": ${loginStatus.hasLogout ? '✅' : '❌'}`);
        
        console.log('\n⏳ Czekam 30 sekund na Twoją inspekcję...');
        console.log('💡 Możesz sprawdzić stronę i spróbować ręcznie znaleźć przycisk Sprzedaj');
        
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ Błąd:', error);
    } finally {
        await browser.close();
    }
}

if (import.meta.main) {
    debugVinted().catch(console.error);
}
