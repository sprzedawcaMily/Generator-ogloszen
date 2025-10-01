import puppeteer, { Browser, Page } from 'puppeteer';

export class VintedPriceAutomation {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async connectToExistingBrowser(): Promise<void> {
        try {
            console.log('🔗 Łączenie z istniejącą przeglądarką...');
            
            // Połącz z istniejącą przeglądarką na porcie 9222
            this.browser = await puppeteer.connect({
                browserURL: 'http://localhost:9222',
                defaultViewport: null
            });

            const pages = await this.browser.pages();
            this.page = pages[0];

            if (!this.page) {
                throw new Error('Nie znaleziono otwartej karty w przeglądarce');
            }

            console.log('✅ Połączono z przeglądarką');
        } catch (error) {
            console.error('❌ Błąd połączenia z przeglądarką:', error);
            throw error;
        }
    }

    async getCurrentUserProfileUrl(): Promise<string> {
        if (!this.page) throw new Error('Page not initialized');

        console.log('🔍 Wykrywam profil zalogowanego użytkownika...');

        try {
            // Sprawdź aktualny URL
            let currentUrl = this.page.url();
            console.log(`📍 Aktualny URL: ${currentUrl}`);

            // Jeśli już jesteś na profilu użytkownika, użyj tego URL
            const memberUrlMatch = currentUrl.match(/https:\/\/www\.vinted\.pl\/member\/(\d+)/);
            if (memberUrlMatch) {
                console.log(`✅ Wykryto profil z aktualnego URL: ${currentUrl}`);
                return currentUrl;
            }

            // Jeśli nie jesteś na profilu, spróbuj przejść do ustawień profilu
            // które automatycznie przekierują na stronę profilu
            console.log('� Przechodzę do ustawień profilu aby wykryć ID użytkownika...');
            
            await this.page.goto('https://www.vinted.pl/profile/edit', { 
                waitUntil: 'networkidle2',
                timeout: 10000 
            });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Sprawdź czy udało się przejść do ustawień (oznacza zalogowanie)
            currentUrl = this.page.url();
            console.log(`📍 URL po przejściu do ustawień: ${currentUrl}`);
            
            if (!currentUrl.includes('/profile')) {
                throw new Error('Nie można uzyskać dostępu do ustawień profilu. Sprawdź czy jesteś zalogowany.');
            }

            // Spróbuj wyciągnąć ID użytkownika z strony ustawień
            const userId = await this.page.evaluate(() => {
                // Szukaj ID użytkownika w różnych miejscach
                
                // 1. Sprawdź czy są jakieś linki do profilu
                const profileLinks = document.querySelectorAll('a[href*="/member/"]');
                for (const link of profileLinks) {
                    const href = (link as HTMLAnchorElement).href;
                    const match = href.match(/\/member\/(\d+)/);
                    if (match) {
                        return match[1];
                    }
                }
                
                // 2. Sprawdź atrybuty data-
                const dataElements = document.querySelectorAll('[data-user-id], [data-member-id], [data-id]');
                for (const el of dataElements) {
                    const userId = el.getAttribute('data-user-id') || 
                                   el.getAttribute('data-member-id') || 
                                   el.getAttribute('data-id');
                    if (userId && userId.match(/^\d+$/)) {
                        return userId;
                    }
                }
                
                // 3. Sprawdź zawartość skryptów JavaScript
                const scripts = document.querySelectorAll('script');
                for (const script of scripts) {
                    const content = script.textContent || '';
                    // Szukaj różnych wzorców ID użytkownika
                    const patterns = [
                        /user_id['"]*:\s*['"]?(\d+)/i,
                        /member_id['"]*:\s*['"]?(\d+)/i,
                        /current_user['"]*:\s*\{[^}]*id['"]*:\s*['"]?(\d+)/i,
                        /"id"\s*:\s*(\d+)/g
                    ];
                    
                    for (const pattern of patterns) {
                        const match = content.match(pattern);
                        if (match && match[1] && match[1].length > 3) { // ID powinno mieć więcej niż 3 cyfry
                            return match[1];
                        }
                    }
                }
                
                return null;
            });

            if (userId) {
                const profileUrl = `https://www.vinted.pl/member/${userId}`;
                console.log(`✅ Wykryto ID użytkownika: ${userId}, skonstruowano URL: ${profileUrl}`);
                return profileUrl;
            }

            // Jeśli nic nie działa, poproś użytkownika o ręczne podanie URL
            throw new Error(`
🔍 Nie udało się automatycznie wykryć ID użytkownika.

💡 ROZWIĄZANIE:
1. Przejdź do swojego profilu na Vinted
2. Skopiuj URL (np. https://www.vinted.pl/member/12345678)
3. Uruchom automatyzację z tym URL:

   bun run run-vinted-price-automation.ts "SKOPIOWANY_URL"

Przykład:
   bun run run-vinted-price-automation.ts "https://www.vinted.pl/member/78164979"
            `);

        } catch (error) {
            if (error instanceof Error && error.message.includes('ROZWIĄZANIE:')) {
                throw error; // Przekaż instrukcje bez dodatkowego opakowania
            }
            
            console.error('❌ Błąd podczas wykrywania profilu użytkownika:', error);
            throw new Error(`
🔍 Nie udało się automatycznie wykryć profilu użytkownika.

💡 ROZWIĄZANIE:
1. Przejdź do swojego profilu na Vinted  
2. Skopiuj URL (np. https://www.vinted.pl/member/12345678)
3. Uruchom automatyzację z tym URL:

   bun run run-vinted-price-automation.ts "SKOPIOWANY_URL"
            `);
        }
    }

    async navigateToUserProfile(profileUrl: string): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');

        console.log(`🔄 Przechodzę do profilu: ${profileUrl}`);
        await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
        
        // Poczekaj na załadowanie ogłoszeń
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Sprawdź czy nie ma captcha na profilu
        const hasCaptchaOnProfile = await this.checkForCaptcha();
        if (hasCaptchaOnProfile) {
            await this.waitForCaptchaResolution();
        }
        
        // Kliknij filtr "Aktywne" aby pokazać tylko aktywne ogłoszenia
        console.log('🔍 Szukam filtru "Aktywne"...');
        try {
            const activeFilterSelector = 'button[data-testid="closet-seller-filters-active"]';
            const activeFilter = await this.page.$(activeFilterSelector);
            
            if (activeFilter) {
                console.log('✅ Znaleziono filtr "Aktywne", klikam...');
                await activeFilter.click();
                await new Promise(resolve => setTimeout(resolve, 2000));
                console.log('✅ Zastosowano filtr aktywnych ogłoszeń');
            } else {
                console.log('⚠️ Nie znaleziono filtru "Aktywne", kontynuuję bez filtrowania');
            }
        } catch (error) {
            console.log('⚠️ Błąd przy filtrowaniu aktywnych ogłoszeń:', error);
        }
        
        // Przewiń stronę w dół aby załadować wszystkie ogłoszenia
        console.log('📜 Przewijam stronę w dół aby załadować wszystkie ogłoszenia...');
        await this.scrollToLoadAllAdvertisements();
    }

    async scrollToLoadAllAdvertisements(): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');

        console.log('📜 Przewijam stronę w dół aby załadować wszystkie ogłoszenia...');
        
        let previousItemCount = 0;
        let currentItemCount = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 50; // Znacznie zwiększone aby załadować wszystkie ogłoszenia
        let noChangeCount = 0;
        const maxNoChangeAttempts = 5; // Więcej prób bez zmian

        while (scrollAttempts < maxScrollAttempts && noChangeCount < maxNoChangeAttempts) {
            // Policz aktualne ogłoszenia
            currentItemCount = await this.page.evaluate(() => {
                const selectors = [
                    '.new-item-box__image-container',
                    '.item-box',
                    '[data-testid*="item"]',
                    '.c-box',
                    '.item'
                ];
                
                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        return elements.length;
                    }
                }
                return 0;
            });

            console.log(`📜 Przewijanie ${scrollAttempts + 1}/${maxScrollAttempts} - znaleziono ${currentItemCount} ogłoszeń`);
            
            // Przewiń do końca strony
            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            
            // Poczekaj na załadowanie nowych ogłoszeń - zwiększone z 3s do 5s
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Sprawdź czy liczba ogłoszeń się zmieniła
            if (currentItemCount === previousItemCount) {
                noChangeCount++;
                console.log(`⚠️ Brak nowych ogłoszeń (próba ${noChangeCount}/${maxNoChangeAttempts})`);
                
                // Spróbuj dodatkowego przewinięcia i czekania
                await this.page.evaluate(() => {
                    window.scrollTo(0, document.body.scrollHeight + 1000);
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
                
            } else {
                noChangeCount = 0; // Reset licznika jeśli znaleziono nowe ogłoszenia
                console.log(`✅ Załadowano ${currentItemCount - previousItemCount} nowych ogłoszeń`);
            }
            
            previousItemCount = currentItemCount;
            scrollAttempts++;
            
            // Sprawdź czy osiągnęliśmy koniec (sprawdź h2 z liczbą przedmiotów)
            const totalItemsFromHeader = await this.page.evaluate(() => {
                const headerElements = document.querySelectorAll('h2');
                for (const header of headerElements) {
                    const text = header.textContent || '';
                    const match = text.match(/(\d+)\s+Przedmiotów?/i);
                    if (match) {
                        return parseInt(match[1]);
                    }
                }
                return null;
            });
            
            if (totalItemsFromHeader && currentItemCount >= totalItemsFromHeader) {
                console.log(`✅ Załadowano wszystkie ogłoszenia: ${currentItemCount}/${totalItemsFromHeader}`);
                break;
            }
        }

        console.log(`✅ Zakończono przewijanie strony - załadowano ${currentItemCount} ogłoszeń`);
        
        // Przewiń z powrotem na górę
        await this.page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async getAdvertisements(): Promise<Array<{id: string, url: string, currentPrice: string}>> {
        if (!this.page) throw new Error('Page not initialized');

        console.log('🔍 Szukam ogłoszeń...');

        const advertisements = await this.page.evaluate(() => {
            const items: Array<{id: string, url: string, currentPrice: string}> = [];
            
            // Znajdź wszystkie elementy ogłoszeń - różne możliwe selektory
            const possibleSelectors = [
                '.new-item-box__image-container',
                '.item-box',
                '[data-testid*="item"]',
                '.c-box',
                '.item'
            ];
            
            let itemElements: NodeListOf<Element> | null = null;
            
            // Spróbuj różnych selektorów
            for (const selector of possibleSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`Znaleziono ${elements.length} elementów z selektorem: ${selector}`);
                    itemElements = elements;
                    break;
                }
            }
            
            if (!itemElements || itemElements.length === 0) {
                console.log('Nie znaleziono elementów ogłoszeń z żadnym selektorem');
                return [];
            }
            
            itemElements.forEach((element) => {
                // Szukaj linku do ogłoszenia
                const linkSelectors = [
                    'a.new-item-box__overlay',
                    'a[href*="/items/"]',
                    'a'
                ];
                
                let linkElement: HTMLAnchorElement | null = null;
                for (const linkSelector of linkSelectors) {
                    const link = element.querySelector(linkSelector) as HTMLAnchorElement;
                    if (link && link.href && link.href.includes('/items/')) {
                        linkElement = link;
                        break;
                    }
                }
                
                if (linkElement && linkElement.href) {
                    // Wyciągnij ID z URL-a
                    const urlMatch = linkElement.href.match(/\/items\/(\d+)/);
                    if (urlMatch) {
                        const id = urlMatch[1];
                        const url = linkElement.href;
                        
                        // Spróbuj znaleźć cenę w różnych miejscach
                        let currentPrice = '';
                        
                        // 1. Alt tekst zdjęcia
                        const imgElement = element.querySelector('img') as HTMLImageElement;
                        if (imgElement && imgElement.alt) {
                            const priceMatch = imgElement.alt.match(/(\d+,\d+)\s*zł/);
                            if (priceMatch) {
                                currentPrice = priceMatch[1];
                            }
                        }
                        
                        // 2. Tekst w elemencie z ceną
                        if (!currentPrice) {
                            const priceElement = element.querySelector('.web_ui__Text__text, .price, [class*="price"]');
                            if (priceElement) {
                                const priceText = priceElement.textContent || '';
                                const priceMatch = priceText.match(/(\d+,\d+)\s*zł/);
                                if (priceMatch) {
                                    currentPrice = priceMatch[1];
                                }
                            }
                        }
                        
                        // 3. Domyślna cena jeśli nie znaleziono
                        if (!currentPrice) {
                            currentPrice = '000,00';
                        }
                        
                        items.push({ id, url, currentPrice });
                    }
                }
            });
            
            console.log(`Znaleziono ${items.length} ogłoszeń przed odwróceniem kolejności`);
            
            // Odwróć kolejność - zacznij od najstarszych (od dołu)
            return items.reverse();
        });

        console.log(`✅ Znaleziono ${advertisements.length} ogłoszeń (kolejność od najstarszych)`);
        return advertisements;
    }

    async checkForCaptcha(): Promise<boolean> {
        if (!this.page) throw new Error('Page not initialized');

        try {
            // Sprawdź czy istnieje element captcha
            const captchaSelectors = [
                '#ddv1-captcha-container',
                '.captcha__ddv1',
                '[data-dd-ddv1-captcha-container]',
                '#captcha__frame',
                '.captcha__puzzle',
                '.sliderContainer'
            ];

            for (const selector of captchaSelectors) {
                const captchaElement = await this.page.$(selector);
                if (captchaElement) {
                    // Sprawdź czy element jest widoczny
                    const isVisible = await this.page.evaluate((element) => {
                        const style = window.getComputedStyle(element);
                        const htmlElement = element as HTMLElement;
                        return style.display !== 'none' && style.visibility !== 'hidden' && htmlElement.offsetHeight > 0;
                    }, captchaElement);

                    if (isVisible) {
                        console.log('🤖 Wykryto CAPTCHA na stronie!');
                        return true;
                    }
                }
            }
            return false;
        } catch (error) {
            // Jeśli wystąpi błąd podczas sprawdzania, zakładamy że captcha nie ma
            return false;
        }
    }

    async waitForCaptchaResolution(): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');

        console.log('');
        console.log('🛑 ========================================');
        console.log('🤖 WYKRYTO CAPTCHA!');
        console.log('🛑 ========================================');
        console.log('');
        console.log('⚠️  INSTRUKCJA:');
        console.log('   1. Przejdź do okna przeglądarki Chrome');
        console.log('   2. Rozwiąż captcha (przeciągnij suwak lub audio)');
        console.log('   3. Poczekaj aż strona się załaduje');
        console.log('   4. Automatyzacja zostanie wznowiona automatycznie');
        console.log('');
        console.log('⏳ Czekam na rozwiązanie captcha...');
        console.log('   (sprawdzam co 5 sekund)');
        console.log('');

        let attempts = 0;
        const maxAttempts = 120; // 10 minut maksymalnie (120 * 5s = 600s)

        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 5000)); // Czekaj 5 sekund
            attempts++;

            const hasCaptcha = await this.checkForCaptcha();
            
            if (!hasCaptcha) {
                console.log('✅ Captcha rozwiązana! Wznawianie automatyzacji...');
                console.log('');
                await new Promise(resolve => setTimeout(resolve, 3000)); // Dodatkowe 3s na załadowanie
                return;
            }

            if (attempts % 6 === 0) { // Co 30 sekund (6 * 5s)
                const remainingMinutes = Math.ceil((maxAttempts - attempts) * 5 / 60);
                console.log(`⏱️  Wciąż czekam na captcha... (pozostało ~${remainingMinutes} min)`);
            }
        }

        // Timeout - za długo czekamy
        console.log('');
        console.log('⚠️ TIMEOUT: Zbyt długo czekam na rozwiązanie captcha');
        console.log('   Sprawdź czy captcha została rozwiązana i spróbuj ponownie');
        throw new Error('Timeout podczas oczekiwania na rozwiązanie captcha');
    }

    async navigateWithCaptchaHandling(url: string, maxRetries: number = 3): Promise<boolean> {
        if (!this.page) throw new Error('Page not initialized');

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🔄 Próba nawigacji ${attempt}/${maxRetries} do: ${url}`);
                
                await this.page.goto(url, { 
                    waitUntil: 'networkidle2',
                    timeout: 20000  // Skrócony timeout dla szybszej responsywności
                });
                
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Sprawdź czy nie ma captcha po nawigacji
                const hasCaptcha = await this.checkForCaptcha();
                if (hasCaptcha) {
                    console.log('🤖 Wykryto captcha po nawigacji - oczekuję na rozwiązanie...');
                    await this.waitForCaptchaResolution();
                }
                
                console.log(`✅ Nawigacja pomyślna do: ${url}`);
                return true;
                
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.log(`⚠️ Błąd nawigacji (próba ${attempt}/${maxRetries}): ${errorMessage}`);
                
                // Sprawdź czy może to być captcha mimo błędu
                try {
                    const hasCaptcha = await this.checkForCaptcha();
                    if (hasCaptcha) {
                        console.log('🤖 Wykryto captcha mimo błędu nawigacji - oczekuję na rozwiązanie...');
                        await this.waitForCaptchaResolution();
                        
                        // Po rozwiązaniu captcha spróbuj ponownie nawigować
                        console.log('🔄 Próbuję ponowną nawigację po rozwiązaniu captcha...');
                        continue;
                    }
                } catch (captchaError) {
                    console.log('⚠️ Błąd podczas sprawdzania captcha:', captchaError);
                }
                
                if (attempt === maxRetries) {
                    console.log(`❌ Nie udało się nawigować po ${maxRetries} próbach`);
                    throw error;
                }
                
                // Przerwa przed kolejną próbą
                const waitTime = attempt * 3000; // 3s, 6s, 9s
                console.log(`⏳ Czekam ${waitTime/1000}s przed kolejną próbą...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        return false;
    }

    async processAdvertisement(ad: {id: string, url: string, currentPrice: string}, discount: number = 25): Promise<boolean> {
        if (!this.page) throw new Error('Page not initialized');

        try {
            console.log(`\n📦 Przetwarzam ogłoszenie ID: ${ad.id}`);
            console.log(`🔗 URL: ${ad.url}`);
            console.log(`💰 Aktualna cena: ${ad.currentPrice} zł`);

            // Przejdź bezpośrednio do strony edycji (optymalizacja - bez szukania przycisku)
            console.log('🔄 Przechodzę bezpośrednio do strony edycji...');
            const editUrl = ad.url.replace(/\/items\/(\d+)/, '/items/$1/edit');
            console.log(`� URL edycji: ${editUrl}`);
            
            const editNavigationSuccess = await this.navigateWithCaptchaHandling(editUrl);
            if (!editNavigationSuccess) {
                console.log('❌ Nie udało się przejść bezpośrednio do strony edycji');
                
                // Fallback: spróbuj tradycyjnej metody (przejdź do ogłoszenia i znajdź przycisk)
                console.log('🔄 Próbuję alternatywnej metody - przejście do ogłoszenia i szukanie przycisku...');
                const navigationSuccess = await this.navigateWithCaptchaHandling(ad.url);
                if (!navigationSuccess) {
                    console.log('❌ Nie udało się przejść do ogłoszenia');
                    return false;
                }

                // Znajdź i kliknij przycisk "Edytuj ogłoszenie"
                console.log('🔍 Szukam przycisku "Edytuj ogłoszenie"...');
                
                const editButtonSelector = 'button[data-testid="item-edit-button"]';
                
                try {
                    // Poczekaj na załadowanie przycisku
                    await this.page.waitForSelector(editButtonSelector, { timeout: 10000 });
                    
                    // Poczekaj dodatkowe 2 sekundy na pełne załadowanie
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Sprawdź czy nie ma captcha przed kliknięciem
                    const hasCaptchaBeforeEdit = await this.checkForCaptcha();
                    if (hasCaptchaBeforeEdit) {
                        await this.waitForCaptchaResolution();
                    }
                    
                    console.log('✅ Znaleziono przycisk "Edytuj ogłoszenie", klikam...');
                    await this.page.click(editButtonSelector);
                    
                } catch (error) {
                    console.log('❌ Nie udało się znaleźć lub kliknąć przycisku edycji');
                    return false;
                }
            } else {
                console.log('✅ Przeszedłem bezpośrednio do strony edycji');
            }
            
            // Poczekaj na załadowanie strony edycji
            console.log('⏳ Czekam na załadowanie strony edycji...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Skrócony czas oczekiwania

            // Sprawdź czy jesteś na stronie edycji
            const currentUrl = this.page.url();
            if (!currentUrl.includes('/edit')) {
                console.log('⚠️ Nie udało się przejść do strony edycji, próbuję ponownie...');
                const editUrl = ad.url.replace(/\/items\/(\d+)/, '/items/$1/edit');
                const fallbackNavigationSuccess = await this.navigateWithCaptchaHandling(editUrl);
                if (!fallbackNavigationSuccess) {
                    console.log('❌ Nie udało się przejść do strony edycji nawet po ponownej próbie');
                    return false;
                }
            }

            console.log(`📍 Aktualny URL: ${this.page.url()}`);

            // Sprawdź czy nie ma captcha na stronie edycji
            const hasCaptchaOnEdit = await this.checkForCaptcha();
            if (hasCaptchaOnEdit) {
                await this.waitForCaptchaResolution();
            }

            // Znajdź pole ceny
            console.log('🔍 Szukam pola ceny...');
            const priceInputSelector = 'input[data-testid="price-input--input"]';
            
            try {
                await this.page.waitForSelector(priceInputSelector, { timeout: 15000 });
            } catch (error) {
                console.log('❌ Nie znaleziono pola ceny w określonym czasie');
                // Spróbuj alternatywnych selektorów
                const alternativeSelectors = [
                    'input[name="price"]',
                    'input[placeholder*="cena"]',
                    'input[type="number"]',
                    '.price-input input'
                ];
                
                let foundAlternative = false;
                for (const altSelector of alternativeSelectors) {
                    try {
                        await this.page.waitForSelector(altSelector, { timeout: 3000 });
                        console.log(`✅ Znaleziono pole ceny z alternatywnym selektorem: ${altSelector}`);
                        // Użyj alternatywnego selektora
                        foundAlternative = true;
                        break;
                    } catch {
                        continue;
                    }
                }
                
                if (!foundAlternative) {
                    throw new Error('Nie znaleziono pola ceny na stronie edycji');
                }
            }

            // Pobierz aktualną cenę z pola input
            const currentInputPrice = await this.page.evaluate((selector) => {
                const input = document.querySelector(selector) as HTMLInputElement;
                return input ? input.value : '';
            }, priceInputSelector);

            console.log(`💰 Aktualna cena w polu: ${currentInputPrice}`);

            // Oblicz nową cenę (zniżka według parametru)
            const priceMatch = currentInputPrice.match(/(\d+),(\d+)/);
            if (!priceMatch) {
                console.log('❌ Nie można odczytać ceny, pomijam...');
                return false;
            }

            const currentPriceNumber = parseFloat(priceMatch[1] + '.' + priceMatch[2]);
            const discountMultiplier = (100 - discount) / 100; // np. 25% zniżki = 0.75 mnożnik
            const newPriceNumber = Math.round(currentPriceNumber * discountMultiplier * 100) / 100; // zaokrąglone
            const newPriceString = newPriceNumber.toFixed(2).replace('.', ',') + ' zł';

            console.log(`🔄 Zmieniam cenę z ${currentInputPrice} na ${newPriceString} (zniżka ${discount}%)`);

            // Wyczyść pole i wpisz nową cenę
            console.log('🔄 Czyszczę pole ceny i wpisuję nową...');
            
            try {
                // Kliknij w pole ceny
                await this.page.click(priceInputSelector);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Wyczyść pole różnymi metodami
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('KeyA');
                await this.page.keyboard.up('Control');
                await this.page.keyboard.press('Delete');
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Wpisz nową cenę
                await this.page.type(priceInputSelector, newPriceString);
                
                console.log(`✅ Wpisano nową cenę: ${newPriceString}`);
                
            } catch (error) {
                console.log('⚠️ Problemz wpisywaniem przez keyboard, próbuję JavaScript...');
                
                // Alternatywna metoda przez JavaScript
                await this.page.evaluate((selector, newPrice) => {
                    const input = document.querySelector(selector) as HTMLInputElement;
                    if (input) {
                        input.value = newPrice;
                        input.focus();
                        // Wywołaj zdarzenia aby strona wiedziała o zmianie
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, priceInputSelector, newPriceString);
                
                console.log(`✅ Wpisano nową cenę przez JavaScript: ${newPriceString}`);
            }
            
            // Poczekaj chwilę
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Znajdź i kliknij przycisk "Zapisz"
            console.log('🔍 Szukam przycisku "Zapisz"...');
            const saveButtonSelector = 'button[data-testid="upload-form-save-button"]';
            
            try {
                await this.page.waitForSelector(saveButtonSelector, { timeout: 10000 });
                console.log('✅ Znaleziono przycisk "Zapisz", klikam...');
                
                // Spróbuj różne metody klikania przycisku Zapisz
                try {
                    await this.page.click(saveButtonSelector);
                    console.log('✅ Kliknięto przycisk "Zapisz" standardowo');
                } catch (clickError) {
                    console.log('⚠️ Standardowe kliknięcie nie powiodło się, próbuję JavaScript...');
                    await this.page.evaluate((selector) => {
                        const button = document.querySelector(selector);
                        if (button) {
                            (button as HTMLButtonElement).click();
                        }
                    }, saveButtonSelector);
                    console.log('✅ Kliknięto przycisk "Zapisz" przez JavaScript');
                }
                
            } catch (error) {
                console.log('⚠️ Nie znaleziono przycisku "Zapisz", szukam alternatywnych...');
                
                // Alternatywne selektory dla przycisku zapisz
                const altSaveSelectors = [
                    'button[type="submit"]',
                    'button:contains("Zapisz")',
                    '.save-button',
                    'input[type="submit"]',
                    'button[class*="save"]'
                ];
                
                let saveFound = false;
                for (const altSelector of altSaveSelectors) {
                    try {
                        const element = await this.page.$(altSelector);
                        if (element) {
                            await element.click();
                            console.log(`✅ Kliknięto przycisk zapisz z selektorem: ${altSelector}`);
                            saveFound = true;
                            break;
                        }
                    } catch {
                        continue;
                    }
                }
                
                if (!saveFound) {
                    console.log('⚠️ Nie znaleziono przycisku zapisz, próbuję Enter...');
                    await this.page.keyboard.press('Enter');
                }
            }
            
            // Poczekaj na zapisanie
            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log(`✅ Cena zmieniona pomyślnie dla ogłoszenia ${ad.id}`);
            return true;

        } catch (error) {
            console.error(`❌ Błąd podczas przetwarzania ogłoszenia ${ad.id}:`, error);
            
            // Loguj więcej szczegółów dla debugowania
            try {
                const currentUrl = this.page?.url();
                console.log(`📍 URL podczas błędu: ${currentUrl}`);
                
                // Sprawdź czy strona nie wyświetla błędu
                const pageText = await this.page?.evaluate(() => document.body.textContent?.toLowerCase() || '');
                if (pageText?.includes('błąd') || pageText?.includes('error')) {
                    console.log('⚠️ Strona wyświetla komunikat o błędzie');
                }
                
            } catch (debugError) {
                console.log('⚠️ Nie można pobrać dodatkowych informacji debugowych');
            }
            
            return false;
        }
    }

    async processAllAdvertisements(profileUrl?: string, startFrom: number = 1, limit: number = -1, discount: number = 25): Promise<void> {
        try {
            console.log('🚀 Rozpoczynam automatyzację zmiany cen na Vinted...');

            // Połącz z przeglądarką
            await this.connectToExistingBrowser();

            // Wykryj profil zalogowanego użytkownika lub użyj podanego
            let userProfileUrl = profileUrl;
            if (!userProfileUrl) {
                console.log('🔍 Brak podanego URL profilu - wykrywam automatycznie...');
                try {
                    userProfileUrl = await this.getCurrentUserProfileUrl();
                } catch (error) {
                    console.error('❌ Błąd wykrywania profilu:', error);
                    console.log('💡 Spróbuj podać URL profilu ręcznie jako parametr');
                    throw error;
                }
            } else {
                console.log(`📝 Używam podanego URL profilu: ${userProfileUrl}`);
            }

            // Przejdź do profilu użytkownika
            await this.navigateToUserProfile(userProfileUrl);

            // Pobierz listę ogłoszeń
            const allAdvertisements = await this.getAdvertisements();

            if (allAdvertisements.length === 0) {
                console.log('⚠️ Nie znaleziono ogłoszeń do przetworzenia');
                return;
            }

            console.log(`📋 Znaleziono ${allAdvertisements.length} ogłoszeń łącznie`);
            
            // Sprawdź parametry zakresu
            if (startFrom > allAdvertisements.length) {
                console.log(`⚠️ Start (${startFrom}) większy niż liczba ogłoszeń (${allAdvertisements.length})`);
                return;
            }
            
            // Pobierz tylko wybrane ogłoszenia (od startFrom do startFrom+limit)
            const startIndex = startFrom - 1; // Indeks tablicy (0-based)
            let endIndex: number;
            
            if (limit === -1) {
                // Przetwarzaj wszystkie ogłoszenia od startFrom do końca
                endIndex = allAdvertisements.length;
                console.log(`🎯 Przetwarzam WSZYSTKIE ogłoszenia od pozycji ${startFrom} (${allAdvertisements.length - startIndex} ogłoszeń)`);
            } else {
                endIndex = Math.min(startIndex + limit, allAdvertisements.length);
                console.log(`🎯 Przetwarzam ogłoszenia ${startFrom}-${Math.min(startFrom + limit - 1, allAdvertisements.length)} z ${allAdvertisements.length} (${endIndex - startIndex} ogłoszeń)`);
            }
            
            const advertisements = allAdvertisements.slice(startIndex, endIndex);

            if (advertisements.length === 0) {
                console.log('⚠️ Brak ogłoszeń w wybranym zakresie');
                return;
            }

            let processed = 0;
            let successful = 0;

            // Przetwarzaj każde ogłoszenie
            for (const ad of advertisements) {
                processed++;
                console.log(`\n📊 Postęp: ${processed}/${advertisements.length}`);
                
                const success = await this.processAdvertisement(ad, discount);
                if (success) {
                    successful++;
                }

                // Przerwa między ogłoszeniami (żeby nie przeciążać serwera)
                if (processed < advertisements.length) {
                    console.log('⏳ Przerwa 2 sekundy...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            console.log(`\n🎉 Automatyzacja zakończona!`);
            console.log(`📊 Statystyki:`);
            console.log(`   • Przetworzonych: ${processed}`);
            console.log(`   • Udanych: ${successful}`);
            console.log(`   • Nieudanych: ${processed - successful}`);

        } catch (error) {
            console.error('❌ Błąd automatyzacji:', error);
            throw error;
        }
    }

    async close(): Promise<void> {
        // Nie zamykamy przeglądarki, tylko się rozłączamy
        if (this.browser) {
            await this.browser.disconnect();
            this.browser = null;
            this.page = null;
            console.log('✅ Rozłączono od przeglądarki');
        }
    }
}

// Funkcja główna do uruchomienia automatyzacji zmiany cen
export async function runVintedPriceAutomation(profileUrl?: string, startFrom: number = 1, limit: number = -1, discount: number = 25) {
    const automation = new VintedPriceAutomation();
    
    try {
        await automation.processAllAdvertisements(profileUrl, startFrom, limit, discount);
    } catch (error) {
        console.error('Vinted price automation failed:', error);
        throw error;
    } finally {
        await automation.close();
    }
}

// Funkcja do uruchomienia z istniejącą przeglądarką
export async function runVintedPriceAutomationWithExistingBrowser(profileUrl?: string, startFrom: number = 1, limit: number = -1, discount: number = 25) {
    return runVintedPriceAutomation(profileUrl, startFrom, limit, discount);
}