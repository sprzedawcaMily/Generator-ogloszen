import puppeteer, { Browser, Page } from 'puppeteer';
import { fetchAdvertisements } from './supabaseFetcher';

interface Advertisement {
    id: number;
    title: string;
    description: string;
    price: number;
    photos: string[];
    is_completed: boolean;
    created_at: string;
}

class VintedAutomation {
    private browser: Browser | null = null;
    private page: Page | null = null;

    async init() {
        this.browser = await puppeteer.launch({
            headless: false, // Pokazuj przeglądarkę
            defaultViewport: null,
            args: [
                '--start-maximized',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                // Ważne dla Google Auth
                '--disable-blink-features=AutomationControlled',
                '--disable-extensions-except',
                '--disable-extensions',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-component-extensions-with-background-pages',
                '--disable-ipc-flooding-protection'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Ustaw User Agent jak w normalnej przeglądarce
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Usuń właściwości, które wskazują na automatyzację
        await this.page.evaluateOnNewDocument(() => {
            // Ukryj webdriver property
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            
            // Zmień właściwości które wskazują na headless
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            Object.defineProperty(navigator, 'languages', {
                get: () => ['pl-PL', 'pl', 'en-US', 'en'],
            });
            
            // Dodaj chrome runtime
            (window as any).chrome = {
                runtime: {},
            };
            
            // Usuń automation flag
            try {
                delete (navigator as any).__proto__.webdriver;
            } catch (e) {
                // Ignore if can't delete
            }
        });
        
        // Ustaw dodatkowe headers
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        });
        
        // Ustaw viewport na typowy rozmiar ekranu
        await this.page.setViewport({
            width: 1366,
            height: 768,
            deviceScaleFactor: 1,
        });
    }

    async openLoginPage() {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('🔐 Próbuję otworzyć stronę logowania...');
        
        try {
            // Bezpośrednia nawigacja na stronę logowania
            console.log('🔄 Przechodzę na stronę logowania...');
            await this.page.goto('https://www.vinted.pl/member/sign_in', { waitUntil: 'networkidle2' });
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('📄 Strona logowania jest teraz otwarta');
            console.log('');
            console.log('💡 WAŻNE WSKAZÓWKI:');
            console.log('   ❌ NIE używaj "Zaloguj się przez Google"');
            console.log('   ✅ Użyj "Zaloguj się przez email"');
            console.log('   ✅ Lub utwórz nowe konto bezpośrednio');
            console.log('');
            
        } catch (error) {
            console.log('⚠️  Nie udało się automatycznie otworzyć strony logowania');
            console.log('🔧 Spróbuj ręcznie przejść na stronę logowania');
        }
    }

    async checkIfLoggedIn(): Promise<boolean> {
        if (!this.page) return false;
        
        try {
            // Sprawdź czy istnieje element wskazujący na zalogowanie
            const loggedInIndicators = [
                'button[data-testid="header-user-menu-button"]',
                '[data-testid="user-menu"]',
                '.user-avatar',
                'a[href*="/member"]',
                '[class*="user"]'
            ];
            
            for (const selector of loggedInIndicators) {
                try {
                    const element = await this.page.waitForSelector(selector, { timeout: 2000 });
                    if (element) {
                        console.log(`✅ Znaleziono wskaźnik zalogowania: ${selector}`);
                        return true;
                    }
                } catch {
                    // Kontynuuj sprawdzanie innych selektorów
                }
            }
            
            // Sprawdź przez JavaScript czy istnieje tekst wskazujący na zalogowanie
            const hasUserProfile = await this.page.evaluate(() => {
                const texts = ['profil', 'konto', 'wyloguj', 'ustawienia'];
                const allText = document.body.textContent?.toLowerCase() || '';
                return texts.some(text => allText.includes(text));
            });
            
            if (hasUserProfile) {
                console.log('✅ Znaleziono tekst wskazujący na zalogowanie');
                return true;
            }
            
            // Sprawdź czy NIE ma przycisku "Zaloguj się"
            const hasLoginButton = await this.page.evaluate(() => {
                const elements = Array.from(document.querySelectorAll('a, button'));
                return elements.some(el => {
                    const text = el.textContent?.toLowerCase() || '';
                    return text.includes('zaloguj') && text.includes('się');
                });
            });
            
            return !hasLoginButton; // Jeśli nie ma przycisku logowania, prawdopodobnie jesteś zalogowany
            
        } catch (error) {
            console.log('Błąd podczas sprawdzania stanu logowania:', error);
            return false;
        }
    }

    async navigateToVinted() {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('📍 Navigating to Vinted main page...');
        await this.page.goto('https://www.vinted.pl', {
            waitUntil: 'networkidle2'
        });
        
        // Czekaj na załadowanie strony
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Sprawdź czy jesteś zalogowany
        const isLoggedIn = await this.checkIfLoggedIn();
        
        if (!isLoggedIn) {
            console.log('⚠️  Nie jesteś zalogowany na Vinted!');
            
            // Spróbuj otworzyć stronę logowania
            await this.openLoginPage();
            
            console.log('📝 Zaloguj się ręcznie w przeglądarce...');
            console.log('⏳ Czekam 90 sekund na zalogowanie...');
            
            // Czekaj dłużej na ręczne zalogowanie
            await new Promise(resolve => setTimeout(resolve, 90000));
            
            // Sprawdź ponownie
            const isLoggedInAfterWait = await this.checkIfLoggedIn();
            if (!isLoggedInAfterWait) {
                console.log('');
                console.log('⚠️  Nadal nie wykryto logowania.');
                console.log('💡 Spróbuj:');
                console.log('   - Odświeżyć stronę');
                console.log('   - Zalogować się przez email zamiast Google');
                console.log('   - Sprawdzić czy nie ma captcha');
                console.log('');
                console.log('⏳ Czekam jeszcze 30 sekund...');
                
                await new Promise(resolve => setTimeout(resolve, 30000));
                
                const finalCheck = await this.checkIfLoggedIn();
                if (!finalCheck) {
                    throw new Error('Nie udało się zalogować. Proszę zaloguj się ręcznie i uruchom ponownie.');
                }
            }
        }
        
        console.log('✅ Zalogowany pomyślnie!');
    }

    async clickSellButton() {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('Looking for Sprzedaj button...');
        
        try {
            // Lista możliwych selektorów dla przycisku "Sprzedaj"
            const sellButtonSelectors = [
                'a[href="/items/new"]',
                'a[href*="/items/new"]',
                'button[href="/items/new"]',
                '[data-testid*="sell"]',
                '.sell-button'
            ];
            
            let buttonFound = false;
            
            // Próbuj każdy selektor
            for (const selector of sellButtonSelectors) {
                try {
                    console.log(`Trying selector: ${selector}`);
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked Sprzedaj button with selector: ${selector}`);
                    buttonFound = true;
                    break;
                } catch (error) {
                    console.log(`❌ Selector ${selector} not found, trying next...`);
                }
            }
            
            // Jeśli żaden selektor nie zadziałał, spróbuj znaleźć przez tekst
            if (!buttonFound) {
                console.log('Trying to find button by text content...');
                buttonFound = await this.page.evaluate(() => {
                    // Znajdź wszystkie linki i przyciski
                    const elements = [
                        ...Array.from(document.querySelectorAll('a')),
                        ...Array.from(document.querySelectorAll('button'))
                    ];
                    
                    for (const element of elements) {
                        const text = element.textContent?.toLowerCase() || '';
                        const href = element.getAttribute('href') || '';
                        
                        if (text.includes('sprzedaj') || href.includes('/items/new')) {
                            (element as HTMLElement).click();
                            return true;
                        }
                    }
                    return false;
                });
                
                if (buttonFound) {
                    console.log('✅ Found and clicked Sprzedaj button by text');
                }
            }
            
            if (!buttonFound) {
                // Wypisz dostępne elementy na stronie dla debugowania
                console.log('🔍 Available buttons and links on page:');
                const availableElements = await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
                        type: 'button',
                        text: btn.textContent?.trim(),
                        classes: btn.className
                    }));
                    
                    const links = Array.from(document.querySelectorAll('a')).map(link => ({
                        type: 'link',
                        text: link.textContent?.trim(),
                        href: link.getAttribute('href'),
                        classes: link.className
                    }));
                    
                    return [...buttons, ...links].slice(0, 20); // Pokaż pierwsze 20 elementów
                });
                
                console.log(JSON.stringify(availableElements, null, 2));
                
                throw new Error('Nie znaleziono przycisku Sprzedaj. Sprawdź czy jesteś zalogowany i na właściwej stronie.');
            }
            
            // Czekaj na załadowanie strony dodawania przedmiotu
            await this.page.waitForNavigation({ 
                waitUntil: 'networkidle2', 
                timeout: 15000 
            }).catch(() => {
                console.log('Navigation timeout - but continuing...');
            });
            
        } catch (error) {
            console.error('Error clicking Sprzedaj button:', error);
            throw error;
        }
    }

    async addPhotos(photoUrls: string[]) {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('Adding photos...');
        
        try {
            // Czekaj na załadowanie przycisków
            await this.page.waitForSelector('button', { timeout: 10000 });
            
            // Znajdź i kliknij przycisk "Dodaj zdjęcia"
            const buttonClicked = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const addPhotosBtn = buttons.find(btn => btn.textContent?.includes('Dodaj zdjęcia'));
                if (addPhotosBtn) {
                    (addPhotosBtn as HTMLElement).click();
                    return true;
                }
                return false;
            });
            
            if (buttonClicked) {
                console.log('Clicked add photos button');
            } else {
                console.log('Add photos button not found');
            }
            
            // Tutaj dodasz logikę do uploadowania zdjęć
            // Na razie tylko logujemy URLs zdjęć
            console.log('Photos to upload:', photoUrls);
            
        } catch (error) {
            console.error('Error adding photos:', error);
        }
    }

    async fillTitle(title: string) {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('Filling title...');
        
        try {
            // Czekaj na pole tytułu
            await this.page.waitForSelector('input#title[data-testid="title--input"]', { timeout: 10000 });
            
            // Wyczyść pole i wpisz tytuł
            await this.page.click('input#title[data-testid="title--input"]');
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type('input#title[data-testid="title--input"]', title);
            
            console.log('Title filled:', title);
            
        } catch (error) {
            console.error('Error filling title:', error);
            throw error;
        }
    }

    async fillDescription(description: string) {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('Filling description...');
        
        try {
            // Czekaj na pole opisu
            await this.page.waitForSelector('textarea#description[data-testid="description--input"]', { timeout: 10000 });
            
            // Wyczyść pole i wpisz opis
            await this.page.click('textarea#description[data-testid="description--input"]');
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type('textarea#description[data-testid="description--input"]', description);
            
            console.log('Description filled');
            
        } catch (error) {
            console.error('Error filling description:', error);
            throw error;
        }
    }

    async processAdvertisement(ad: Advertisement) {
        console.log(`Processing advertisement: ${ad.title}`);
        
        try {
            // Dodaj zdjęcia
            if (ad.photos && ad.photos.length > 0) {
                await this.addPhotos(ad.photos);
            }
            
            // Poczekaj chwilę między akcjami
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Wypełnij tytuł
            await this.fillTitle(ad.title);
            
            // Poczekaj chwilę między akcjami
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wypełnij opis
            await this.fillDescription(ad.description);
            
            console.log(`Advertisement processed: ${ad.title}`);
            
        } catch (error) {
            console.error(`Error processing advertisement ${ad.title}:`, error);
            throw error;
        }
    }

    async waitForUserInteraction(message: string, timeoutSeconds: number = 60) {
        if (!this.page) return;
        
        console.log(`\n🔄 ${message}`);
        console.log(`⏳ Czekam ${timeoutSeconds} sekund na Twoją akcję...`);
        console.log('💡 Możesz kontynuować ręcznie w przeglądarce, a następnie naciśnij Enter w terminalu');
        
        // Czekaj określony czas
        await new Promise(resolve => setTimeout(resolve, timeoutSeconds * 1000));
    }

    async start() {
        try {
            console.log('🚀 Starting Vinted automation...');
            
            // Inicjalizuj przeglądarkę
            await this.init();
            
            // Przejdź na Vinted
            await this.navigateToVinted();
            
            // Jeśli nie udało się automatycznie sprawdzić logowania, daj użytkownikowi szansę
            await this.waitForUserInteraction('Upewnij się, że jesteś zalogowany na Vinted', 10);
            
            // Kliknij przycisk "Sprzedaj"
            await this.clickSellButton();
            
            // Poczekaj na załadowanie formularza
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Pobierz ogłoszenia z bazy danych
            console.log('📥 Fetching advertisements from database...');
            const advertisements = await fetchAdvertisements();
            
            if (advertisements.length === 0) {
                console.log('❌ No advertisements found in database');
                return;
            }
            
            console.log(`✅ Found ${advertisements.length} advertisements`);
            
            // Przetwórz pierwsze ogłoszenie (możesz rozszerzyć to o pętlę)
            const firstAd = advertisements[0] as Advertisement;
            if (firstAd && !firstAd.is_completed) {
                await this.processAdvertisement(firstAd);
                
                // Czekaj na dalsze instrukcje od użytkownika
                console.log('✅ Advertisement processing completed. Waiting for further instructions...');
                await this.waitForUserInteraction('Sprawdź formularz i kontynuuj ręcznie jeśli potrzeba', 60);
            }
            
        } catch (error) {
            console.error('❌ Error in Vinted automation:', error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage.includes('TimeoutError') || errorMessage.includes('Waiting for selector')) {
                console.log('\n💡 Rozwiązania problemów:');
                console.log('1. Sprawdź czy jesteś zalogowany na Vinted');
                console.log('2. Sprawdź czy strona się w pełni załadowała');
                console.log('3. Vinted może zmienić interfejs - spróbuj ręcznie');
                console.log('4. Sprawdź połączenie internetowe');
                
                // Nie zamykaj przeglądarki od razu, daj użytkownikowi szansę na ręczną interakcję
                await this.waitForUserInteraction('Możesz kontynuować ręcznie w przeglądarce', 120);
            }
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Funkcja główna do uruchomienia automatyzacji
export async function runVintedAutomation() {
    const automation = new VintedAutomation();
    
    try {
        await automation.start();
    } catch (error) {
        console.error('Vinted automation failed:', error);
    } finally {
        await automation.close();
    }
}

// Jeśli plik jest uruchamiany bezpośrednio
if (import.meta.main) {
    runVintedAutomation().catch(console.error);
}
