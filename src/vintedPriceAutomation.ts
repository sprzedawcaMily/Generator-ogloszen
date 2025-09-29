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

    async navigateToUserProfile(profileUrl: string): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');

        console.log(`🔄 Przechodzę do profilu: ${profileUrl}`);
        await this.page.goto(profileUrl, { waitUntil: 'networkidle2' });
        
        // Poczekaj na załadowanie ogłoszeń
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    async getAdvertisements(): Promise<Array<{id: string, url: string, currentPrice: string}>> {
        if (!this.page) throw new Error('Page not initialized');

        console.log('🔍 Szukam ogłoszeń...');

        const advertisements = await this.page.evaluate(() => {
            const items: Array<{id: string, url: string, currentPrice: string}> = [];
            
            // Znajdź wszystkie elementy ogłoszeń
            const itemElements = document.querySelectorAll('.new-item-box__image-container');
            
            itemElements.forEach((element) => {
                const linkElement = element.querySelector('a.new-item-box__overlay') as HTMLAnchorElement;
                if (linkElement && linkElement.href) {
                    // Wyciągnij ID z URL-a
                    const urlMatch = linkElement.href.match(/\/items\/(\d+)/);
                    if (urlMatch) {
                        const id = urlMatch[1];
                        const url = linkElement.href;
                        
                        // Spróbuj znaleźć cenę w alt tekście zdjęcia
                        const imgElement = element.querySelector('img') as HTMLImageElement;
                        let currentPrice = '';
                        if (imgElement && imgElement.alt) {
                            const priceMatch = imgElement.alt.match(/(\d+,\d+)\s*zł/);
                            if (priceMatch) {
                                currentPrice = priceMatch[1];
                            }
                        }
                        
                        items.push({ id, url, currentPrice });
                    }
                }
            });
            
            return items;
        });

        console.log(`✅ Znaleziono ${advertisements.length} ogłoszeń`);
        return advertisements;
    }

    async processAdvertisement(ad: {id: string, url: string, currentPrice: string}): Promise<boolean> {
        if (!this.page) throw new Error('Page not initialized');

        try {
            console.log(`\n📦 Przetwarzam ogłoszenie ID: ${ad.id}`);
            console.log(`🔗 URL: ${ad.url}`);
            console.log(`💰 Aktualna cena: ${ad.currentPrice} zł`);

            // Przejdź do ogłoszenia
            await this.page.goto(ad.url, { waitUntil: 'networkidle2' });
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Znajdź i kliknij przycisk "Edytuj ogłoszenie"
            console.log('🔍 Szukam przycisku "Edytuj ogłoszenie"...');
            
            const editButtonSelector = 'button[data-testid="item-edit-button"]';
            await this.page.waitForSelector(editButtonSelector, { timeout: 10000 });
            
            console.log('✅ Znaleziono przycisk "Edytuj ogłoszenie", klikam...');
            await this.page.click(editButtonSelector);
            
            // Poczekaj na załadowanie strony edycji
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Znajdź pole ceny
            console.log('🔍 Szukam pola ceny...');
            const priceInputSelector = 'input[data-testid="price-input--input"]';
            await this.page.waitForSelector(priceInputSelector, { timeout: 10000 });

            // Pobierz aktualną cenę z pola input
            const currentInputPrice = await this.page.evaluate((selector) => {
                const input = document.querySelector(selector) as HTMLInputElement;
                return input ? input.value : '';
            }, priceInputSelector);

            console.log(`💰 Aktualna cena w polu: ${currentInputPrice}`);

            // Oblicz nową cenę (25% mniej)
            const priceMatch = currentInputPrice.match(/(\d+),(\d+)/);
            if (!priceMatch) {
                console.log('❌ Nie można odczytać ceny, pomijam...');
                return false;
            }

            const currentPriceNumber = parseFloat(priceMatch[1] + '.' + priceMatch[2]);
            const newPriceNumber = Math.round(currentPriceNumber * 0.75 * 100) / 100; // 25% mniej, zaokrąglone
            const newPriceString = newPriceNumber.toFixed(2).replace('.', ',') + ' zł';

            console.log(`🔄 Zmieniam cenę z ${currentInputPrice} na ${newPriceString}`);

            // Wyczyść pole i wpisz nową cenę
            await this.page.click(priceInputSelector);
            await this.page.evaluate((selector) => {
                const input = document.querySelector(selector) as HTMLInputElement;
                if (input) {
                    input.value = '';
                    input.focus();
                }
            }, priceInputSelector);

            await this.page.type(priceInputSelector, newPriceString);
            
            // Poczekaj chwilę
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Znajdź i kliknij przycisk "Zapisz"
            console.log('🔍 Szukam przycisku "Zapisz"...');
            const saveButtonSelector = 'button[data-testid="upload-form-save-button"]';
            await this.page.waitForSelector(saveButtonSelector, { timeout: 10000 });
            
            console.log('✅ Klikam przycisk "Zapisz"...');
            await this.page.click(saveButtonSelector);
            
            // Poczekaj na zapisanie
            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log(`✅ Cena zmieniona pomyślnie dla ogłoszenia ${ad.id}`);
            return true;

        } catch (error) {
            console.error(`❌ Błąd podczas przetwarzania ogłoszenia ${ad.id}:`, error);
            return false;
        }
    }

    async processAllAdvertisements(profileUrl: string): Promise<void> {
        try {
            console.log('🚀 Rozpoczynam automatyzację zmiany cen na Vinted...');

            // Połącz z przeglądarką
            await this.connectToExistingBrowser();

            // Przejdź do profilu użytkownika
            await this.navigateToUserProfile(profileUrl);

            // Pobierz listę ogłoszeń
            const advertisements = await this.getAdvertisements();

            if (advertisements.length === 0) {
                console.log('⚠️ Nie znaleziono ogłoszeń do przetworzenia');
                return;
            }

            console.log(`📋 Znaleziono ${advertisements.length} ogłoszeń do przetworzenia`);

            let processed = 0;
            let successful = 0;

            // Przetwarzaj każde ogłoszenie
            for (const ad of advertisements) {
                processed++;
                console.log(`\n📊 Postęp: ${processed}/${advertisements.length}`);
                
                const success = await this.processAdvertisement(ad);
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
export async function runVintedPriceAutomation(profileUrl: string = 'https://www.vinted.pl/member/130445339') {
    const automation = new VintedPriceAutomation();
    
    try {
        await automation.processAllAdvertisements(profileUrl);
    } catch (error) {
        console.error('Vinted price automation failed:', error);
        throw error;
    } finally {
        await automation.close();
    }
}

// Funkcja do uruchomienia z istniejącą przeglądarką
export async function runVintedPriceAutomationWithExistingBrowser(profileUrl: string = 'https://www.vinted.pl/member/130445339') {
    return runVintedPriceAutomation(profileUrl);
}