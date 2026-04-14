import puppeteer, { Browser, Page } from 'puppeteer';
import { fetchAdvertisements, fetchUnpublishedToVintedAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType } from './supabaseFetcher';
import { getSizesForCategory, normalizeSizeForCategory } from './categoryToSizesMapping';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

interface Advertisement {
    id: string;
    marka: string;
    rodzaj: string;
    rozmiar: string;
    typ: string;
    stan: string;
    wada?: string;
    dlugosc?: string;
    szerokosc?: string;
    pas?: string;
    udo?: string;
    dlugosc_nogawki?: string;
    color?: string;
    price?: string;
    photo_uris: string[];
    photo_rotations?: string[];
    is_completed: boolean;
    is_published_to_vinted: boolean;
    is_local: boolean;
    created_at: string;
    // Wygenerowane pola
    title?: string;
    description?: string;
    photos?: string[];
}

export class VintedAutomation {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private tempDir = path.join(process.cwd(), 'temp', 'photos');

    // Function to get shortened version of product type (copied from main.js)
    getShortenedProductType(rodzaj: string): string {
        if (!rodzaj) return '';
        
        const typeMap: { [key: string]: string } = {
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

    // Funkcja do formatowania wyrazów - kapitalizuje tylko pierwszą literę w wyrazach napisanych tylko wielkimi literami
    private formatTitleWord(word: string): string {
        // Sprawdź czy wyraz składa się tylko z wielkich liter (bez cyfr)
        const hasOnlyUppercaseLetters = /^[A-Z\W]*$/.test(word) && /[A-Z]/.test(word) && !/\d/.test(word);
        
        if (hasOnlyUppercaseLetters && word.length > 1) {
            // Kapitalizuj tylko pierwszą literę
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
        
        // Zostaw bez zmian jeśli ma mieszane wielkości liter lub zawiera cyfry
        return word;
    }

    // Generuj tytuł według wzorca z main.js: {marka} {getShortenedProductType(rodzaj)} {rozmiar} {description_text}
    async generateTitle(ad: Advertisement): Promise<string> {
        const parts = [];
        
        if (ad.marka) parts.push(this.formatTitleWord(ad.marka));
        if (ad.rodzaj) parts.push(this.formatTitleWord(this.getShortenedProductType(ad.rodzaj)));
        if (ad.rozmiar) parts.push(ad.rozmiar); // rozmiary zostają bez zmian
        
        // Dodaj description_text ze style_templates na podstawie typu produktu
        try {
            const specificStyle = await fetchStyleByType(ad.typ);
            if (specificStyle && specificStyle.description_text) {
                parts.push(this.formatTitleWord(specificStyle.description_text));
            }
        } catch (error) {
            console.log('Could not fetch style for type:', ad.typ);
        }
        
        return parts.join(' ');
    }

    // Generuj opis według wzorca z main.js z emoji i formatowaniem
    async generateDescription(ad: Advertisement): Promise<string> {
        let description = '';
        
        try {
            // Pobierz style i nagłówki opisów
            const [styles, descriptionHeaders, specificStyle] = await Promise.all([
                fetchStyles(),
                // Use platform-specific headers for Vinted
                fetchDescriptionHeaders('vinted'),
                fetchStyleByType(ad.typ)
            ]);
            
            const styleToUse = specificStyle || (styles && styles.length > 0 ? styles[0] : null);
            
            // Dodaj nagłówek z tabeli description_headers (zaproszenie na Instagram)
            if (descriptionHeaders && descriptionHeaders.length > 0) {
                const header = descriptionHeaders[0];
                if (header.title) {
                    description += `${header.title}\n\n`;
                }
            }
            
            // Tytuł produktu z gwiazdkami: 🌟 {marka} {rodzaj} {description_text} 🌟
            description += '🌟 ';
            if (ad.marka) description += ad.marka + ' ';
            if (ad.rodzaj) description += ad.rodzaj + ' ';
            
            // Dodaj description_text ze style_templates na podstawie typu produktu
            if (styleToUse && styleToUse.description_text) {
                description += styleToUse.description_text + ' ';
            }
            description += '🌟\n\n';
            
            // Stan z emoji
            description += '📌 **Stan:** ';
            if (ad.stan) {
                description += ad.stan;
                if (ad.wada && ad.wada.trim() !== '') {
                    description += ` / ${ad.wada}`;
                } else {
                    description += ' / Bez wad';
                }
            } else {
                description += 'Bez wad';
            }
            description += '\n';
            
            // Rozmiar z emoji
            if (ad.rozmiar) {
                description += `📏 **Rozmiar:** ${ad.rozmiar}\n`;
            }
            
            // Kolor z emoji
            if (ad.color) {
                description += `🎨 **Kolor:** ${ad.color}\n`;
            }
            
            // Wymiary z emoji
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
            
            // Dodaj stopkę ze style_templates na podstawie typu produktu
            if (styleToUse && styleToUse.footer_text) {
                description += `${styleToUse.footer_text}`;
            }
            
        } catch (error) {
            console.error('Error generating description:', error);
            // Fallback do prostszego opisu
            description = this.generateSimpleDescription(ad);
        }
        
        return description;
    }

    // Prosta wersja opisu jako fallback
    generateSimpleDescription(ad: Advertisement): string {
        const parts = [];
        
        if (ad.marka) parts.push(`Marka: ${ad.marka}`);
        if (ad.rodzaj) parts.push(`Rodzaj: ${ad.rodzaj}`);
        if (ad.typ && ad.typ !== ad.marka) parts.push(`Typ: ${ad.typ}`);
        if (ad.rozmiar) parts.push(`Rozmiar: ${ad.rozmiar}`);
        if (ad.stan) parts.push(`Stan: ${ad.stan}`);
        
        // Wymiary (jeśli dostępne)
        const dimensions = [];
        if (ad.dlugosc) dimensions.push(`długość ${ad.dlugosc}cm`);
        if (ad.szerokosc) dimensions.push(`szerokość ${ad.szerokosc}cm`);
        if (ad.pas) dimensions.push(`pas ${ad.pas}cm`);
        if (ad.udo) dimensions.push(`udo ${ad.udo}cm`);
        if (ad.dlugosc_nogawki) dimensions.push(`długość nogawki ${ad.dlugosc_nogawki}cm`);
        
        if (dimensions.length > 0) {
            parts.push(`Wymiary: ${dimensions.join(', ')}`);
        }
        
        parts.push('');
        parts.push('Przedmiot w bardzo dobrym stanie, dokładnie opisany i sfotografowany.');
        parts.push('Zapraszam do zakupu! 😊');
        
        return parts.join('\n');
    }

    // Przygotuj ogłoszenie - wygeneruj tytuł, opis i ustaw zdjęcia
    async prepareAdvertisement(ad: Advertisement): Promise<Advertisement> {
        return {
            ...ad,
            title: await this.generateTitle(ad),
            description: await this.generateDescription(ad),
            photos: ad.photo_uris || []
        };
    }

    async downloadImage(url: string, filename: string): Promise<string> {
        try {
            console.log(`📥 Downloading image: ${filename}`);
            
            // Upewnij się że folder istnieje
            await mkdir(this.tempDir, { recursive: true });
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to download image: ${response.status}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const filePath = path.join(this.tempDir, filename);
            await writeFile(filePath, buffer);
            
            console.log(`✅ Downloaded: ${filename}`);
            return filePath;
        } catch (error) {
            console.error(`❌ Error downloading ${filename}:`, error);
            throw error;
        }
    }

    async downloadImages(photoUrls: string[], rotations?: string[]): Promise<string[]> {
        const downloadedPaths: string[] = [];
        
        for (let i = 0; i < photoUrls.length; i++) {
            const url = photoUrls[i];
            const extension = url.split('.').pop()?.toLowerCase() || 'jpg';
            const filename = `photo_${Date.now()}_${i + 1}.${extension}`;
            
            try {
                // Pobierz zdjęcie
                const filePath = await this.downloadImage(url, filename);
                
                // Sprawdź czy jest potrzebna rotacja
                const rotation = rotations && rotations[i] ? parseInt(rotations[i]) : 0;
                
                if (rotation > 0) {
                    console.log(`🔄 Rotating photo ${i + 1} by ${rotation} degrees...`);
                    await this.rotateImage(filePath, rotation);
                }
                
                downloadedPaths.push(filePath);
            } catch (error) {
                console.error(`Failed to download image ${i + 1}:`, error);
                // Kontynuuj z kolejnymi zdjęciami
            }
        }
        
        return downloadedPaths;
    }

    async rotateImage(filePath: string, degrees: number): Promise<void> {
        try {
            const originalBuffer = await fs.promises.readFile(filePath);
            
            let sharpImage = sharp(originalBuffer);
            
            // Normalizuj orientację EXIF
            sharpImage = sharpImage.rotate();
            
            // Zastosuj dodatkową rotację
            if (degrees > 0) {
                sharpImage = sharpImage.rotate(degrees);
            }
            
            const rotatedBuffer = await sharpImage.jpeg({ quality: 90 }).toBuffer();
            await fs.promises.writeFile(filePath, rotatedBuffer);
            
            console.log(`✅ Photo rotated by ${degrees} degrees`);
        } catch (error) {
            console.error(`❌ Error rotating image: ${error}`);
            throw error;
        }
    }

    async cleanupTempFiles() {
        try {
            console.log('🧹 Cleaning up temporary files...');
            if (fs.existsSync(this.tempDir)) {
                const files = fs.readdirSync(this.tempDir);
                for (const file of files) {
                    const filePath = path.join(this.tempDir, file);
                    fs.unlinkSync(filePath);
                }
                console.log(`✅ Cleaned up ${files.length} temporary files`);
            }
        } catch (error) {
            console.error('⚠️  Error cleaning up temp files:', error);
        }
    }

    async init(useExistingBrowser: boolean = false) {
        if (useExistingBrowser) {
            // Użyj istniejącej przeglądarki z profilem użytkownika
            console.log('🔗 Łączenie z istniejącą przeglądarką...');
            console.log('💡 Otwórz najpierw Chrome i zaloguj się na Vinted!');
            console.log('');
            
            this.browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null,
                // Używa domyślnego profilu Chrome użytkownika
                userDataDir: 'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\User Data',
                args: [
                    '--start-maximized',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--remote-debugging-port=9222', // Ważne dla łączenia
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-blink-features=AutomationControlled',
                    '--no-first-run',
                    '--no-default-browser-check'
                ]
            });
        } else {
            // Standardowa nowa przeglądarka
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
        }
        
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

    async connectToExistingBrowser() {
        try {
            console.log('🔗 Próbuję połączyć z istniejącą przeglądarką...');
            
            // Sprawdź czy port 9222 jest dostępny
            const isPortOpen = await this.checkDebugPort();
            if (!isPortOpen) {
                console.log('📡 Port 9222 nie jest dostępny');
                return false;
            }
            
            // Połącz z Chrome uruchomionym z debug portem
            this.browser = await puppeteer.connect({
                browserURL: 'http://localhost:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            
            // Znajdź kartę z Vinted lub utwórz nową
            let vintedPage = pages.find(page => 
                page.url().includes('vinted.pl')
            );
            
            if (vintedPage) {
                console.log('✅ Znaleziono kartę z Vinted');
                this.page = vintedPage;
            } else {
                console.log('📄 Tworzę nową kartę dla Vinted');
                this.page = await this.browser.newPage();
            }
            
            // Dodaj obsługę dialogów na stronie
            if (this.page) {
                // Usuń poprzednie listenery jeśli istnieją
                this.page.removeAllListeners('dialog');
                
                this.page.on('dialog', async (dialog) => {
                    console.log(`🔔 Dialog detected: ${dialog.message()}`);
                    try {
                        await dialog.accept(); // Automatycznie akceptuj dialogi
                    } catch (error) {
                        console.log('ℹ️  Dialog already handled');
                    }
                });
            }
            
            console.log('✅ Pomyślnie połączono z istniejącą przeglądarką');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.log('❌ Nie udało się połączyć z istniejącą przeglądarką:', errorMessage);
            return false;
        }
    }

    async checkDebugPort(): Promise<boolean> {
        try {
            console.log('🔍 Sprawdzam port 9222...');
            
            // Sprawdź kilka razy z większymi przerwami
            for (let i = 0; i < 3; i++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000);
                    
                    const response = await fetch('http://localhost:9222/json/version', {
                        method: 'GET',
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);
                    
                    if (response.ok) {
                        console.log('✅ Port 9222 dostępny');
                        return true;
                    }
                } catch (fetchError) {
                    if (i < 2) {
                        console.log(`🔄 Próba ${i + 1}/3 nieudana, czekam 2 sekundy...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            console.log('📡 Port 9222 nie jest dostępny');
            return false;
        } catch (error) {
            console.log('❌ Błąd sprawdzania portu 9222:', error);
            console.log('📡 Port 9222 nie jest dostępny');
            return false;
        }
    }

    async initWithExistingBrowser() {
        console.log('🔍 Sprawdzenie czy Chrome jest uruchomiony z debug portem...');
        
        // Sprawdź czy Chrome jest uruchomiony z debug portem
        const connected = await this.connectToExistingBrowser();
        
        if (!connected) {
            console.log('❌ Nie znaleziono Chrome z debug portem');
            console.log('');
            console.log('📋 WAŻNE: Jeśli Chrome jest już uruchomiony:');
            console.log('   1. Zamknij wszystkie okna Chrome (Ctrl+Shift+Q)');
            console.log('   2. Uruchom Chrome z debug portem (automatycznie...)');
            console.log('');
            console.log('🚀 Automatycznie uruchamiam Chrome z debug portem...');
            
            const chromeStarted = await this.startChromeWithDebugPort();
            
            if (chromeStarted) {
                console.log('✅ Chrome został uruchomiony z debug portem');
                console.log('⏳ Czekam na uruchomienie Chrome...');
                
                // Czekaj 3 sekundy na uruchomienie Chrome
                await new Promise(resolve => setTimeout(resolve, 3000));
                
                console.log('� Próbuję połączyć się z uruchomionym Chrome...');
                
                // Spróbuj połączyć się ponownie
                const reconnected = await this.connectToExistingBrowser();
                
                if (reconnected) {
                    console.log('✅ Pomyślnie połączono z Chrome!');
                    // Kontynuuj normalnie - nie rzucaj błędu
                } else {
                    console.log('');
                    console.log('�📱 WAŻNE: Zaloguj się teraz na Vinted w otwartej przeglądarce');
                    console.log('🔄 Po zalogowaniu uruchom ponownie: bun run vinted');
                    console.log('');
                    throw new Error('CHROME_STARTED_PLEASE_LOGIN');
                }
            } else {
                console.log('');
                console.log('🚀 INSTRUKCJE RĘCZNEGO URUCHOMIENIA CHROME:');
                console.log('');
                console.log('1. Zamknij wszystkie okna Chrome');
                console.log('2. Uruchom Chrome z debug portem:');
                console.log('   "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\\temp\\chrome-debug"');
                console.log('3. Zaloguj się na Vinted w tej przeglądarce');
                console.log('4. Uruchom ponownie: bun run vinted');
                console.log('');
                throw new Error('Nie można uruchomić Chrome automatycznie');
            }
        }
        
        console.log('✅ Połączono z Chrome z debug portem');
        
        // Usuń właściwości automatyzacji
        if (this.page) {
            // Usuń poprzednie listenery jeśli istnieją
            this.page.removeAllListeners('dialog');
            
            // Automatycznie obsługuj dialogi potwierdzenia
            this.page.on('dialog', async (dialog) => {
                console.log(`🔔 Dialog detected: ${dialog.message()}`);
                try {
                    await dialog.accept(); // Automatycznie akceptuj dialogi
                } catch (error) {
                    console.log('ℹ️  Dialog already handled');
                }
            });
            
            await this.page.evaluateOnNewDocument(() => {
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined,
                });
                
                (window as any).chrome = {
                    runtime: {},
                };
                
                // Wyłącz beforeunload dialogi
                window.addEventListener('beforeunload', (e) => {
                    e.preventDefault = () => {};
                    delete e['returnValue'];
                });
            });
        }
    }

    async startChromeWithDebugPort(): Promise<boolean> {
        try {
            // Najpierw sprawdź czy Chrome z debug portem już nie jest uruchomiony
            console.log('🔍 Sprawdzam czy Chrome z debug portem już jest uruchomiony...');
            const isAlreadyRunning = await this.checkDebugPort();
            
            if (isAlreadyRunning) {
                console.log('✅ Chrome z debug portem już jest uruchomiony!');
                console.log('� Korzystam z istniejącej przeglądarki...');
                return true;
            }
            
            console.log('�🔧 Sprawdzam czy Chrome jest zainstalowany...');
            
            // Możliwe ścieżki do Chrome na Windows
            const chromePaths = [
                'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
                'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
                `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
                `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
                `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`
            ];
            
            // Znajdź Chrome przez sprawdzenie czy plik istnieje
            let chromePath = '';
            const fs = await import('fs');
            
            console.log('🔍 Sprawdzam lokalizacje Chrome...');
            for (const path of chromePaths) {
                try {
                    console.log(`   Sprawdzam: ${path}`);
                    if (fs.existsSync(path)) {
                        chromePath = path;
                        console.log(`✅ Znaleziono Chrome: ${path}`);
                        break;
                    } else {
                        console.log(`   ❌ Nie znaleziono w: ${path}`);
                    }
                } catch (error) {
                    console.log(`   ⚠️ Błąd sprawdzania: ${path}`, error);
                    // Kontynuuj szukanie
                }
            }
            
            if (!chromePath) {
                console.log('❌ Nie znaleziono Chrome w standardowych lokalizacjach');
                return false;
            }
            
            console.log('🚀 Uruchamiam Chrome z debug portem...');
            
            // Użyj stałego katalogu profilu, aby sesja Google/Vinted była zapamiętana.
            const { execSync } = await import('child_process');
            const userDir = process.env.USERPROFILE || process.env.HOME || '.';
            let debugDir = `${userDir}\\AppData\\Local\\Kamochi\\chrome-debug-main-profile`;
            
            try {
                console.log(`📁 Tworzę katalog debug: ${debugDir}`);
                execSync(`mkdir "${debugDir}"`, { stdio: 'ignore' });
                console.log(`✅ Utworzono katalog debug`);
            } catch (error) {
                console.log('⚠️ Błąd tworzenia katalogu:', error);
                // Spróbuj alternatywny stały katalog w bieżącym folderze
                debugDir = `.\\chrome-debug-main-profile`;
                try {
                    execSync(`mkdir "${debugDir}"`, { stdio: 'ignore' });
                    console.log(`✅ Utworzono alternatywny katalog: ${debugDir}`);
                } catch {
                    console.log('❌ Nie można utworzyć katalogu debug');
                    return false;
                }
            }

            console.log('💾 Używam trwałego profilu Chrome - konto powinno pozostać zalogowane.');
            
            // Uruchom Chrome z debug portem w tle
            console.log('🚀 Uruchamiam nowy Chrome z debug portem...');
            console.log(`📁 Używając katalogu: ${debugDir}`);
            const { spawn } = await import('child_process');
            const chromeProcess = spawn(chromePath, [
                '--remote-debugging-port=9222',
                `--user-data-dir=${debugDir}`,  // Usunięty cudzysłów
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                '--allow-running-insecure-content',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--exclude-switches=enable-automation',
                '--disable-extensions-except',
                '--disable-plugins-except',
                'https://www.vinted.pl'
            ], {
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            // Obsłuż błędy uruchamiania
            chromeProcess.on('error', (error) => {
                console.log('❌ Błąd uruchamiania Chrome:', error);
            });
            
            chromeProcess.stderr?.on('data', (data) => {
                console.log('⚠️ Chrome stderr:', data.toString());
            });
            
            chromeProcess.unref(); // Pozwól procesowi działać niezależnie
            
            console.log('✅ Chrome uruchomiony z debug portem');
            console.log('⏳ Czekam 5 sekund na uruchomienie Chrome...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Sprawdź czy port 9222 jest dostępny po uruchomieniu
            console.log('🔄 Sprawdzam połączenie z Chrome...');
            const portCheck = await this.checkDebugPort();
            
            if (!portCheck) {
                console.log('⚠️ Chrome może potrzebować więcej czasu na uruchomienie');
                console.log('⏳ Czekam dodatkowe 5 sekund...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                
                const secondCheck = await this.checkDebugPort();
                if (!secondCheck) {
                    console.log('❌ Nie udało się połączyć z Chrome na porcie 9222');
                    console.log('');
                    console.log('📱 UWAGA: Chrome został uruchomiony, ale może potrzebować ręcznej obsługi');
                    console.log('🔧 Spróbuj ręcznie otworzyć: http://localhost:9222');
                    console.log('');
                }
            }
            
            console.log('📱 Zaloguj się na Vinted w otwartej przeglądarce');
            
            return true;
            
        } catch (error) {
            console.log('❌ Błąd podczas uruchamiania Chrome:', error);
            return false;
        }
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
            console.log('   ✅ Możesz użyć "Zaloguj się przez Google"');
            console.log('   ✅ Sesja będzie zapisana w trwałym profilu Chrome');
            console.log('   ✅ Przy kolejnych uruchomieniach nie powinno wymagać ponownego logowania');
            console.log('');
            
        } catch (error) {
            console.log('⚠️  Nie udało się automatycznie otworzyć strony logowania');
            console.log('🔧 Spróbuj ręcznie przejść na stronę logowania');
        }
    }

    async checkIfLoggedIn(): Promise<boolean> {
        if (!this.page) return false;
        
        try {
            const currentUrl = this.page.url();
            
            // Jeśli jesteś na stronie Google lub innych zewnętrznych stronach logowania
            if (currentUrl.includes('accounts.google.com') || 
                currentUrl.includes('facebook.com') || 
                currentUrl.includes('login') ||
                currentUrl.includes('sign_in')) {
                console.log('📱 Wykryto stronę logowania - użytkownik nie jest zalogowany');
                return false;
            }
            
            // Sprawdź czy istnieje element wskazujący na zalogowanie
            const loggedInIndicators = [
                'button[data-testid="header-user-menu-button"]',
                '[data-testid="user-menu"]',
                '.user-avatar',
                'a[href*="/member"]',
                '[class*="user"]',
                '[data-testid="user-menu-dropdown"]'
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
                
                // Upewnij się, że nie jesteś na stronie logowania
                if (allText.includes('zaloguj się') || 
                    allText.includes('sign in') || 
                    allText.includes('log in') ||
                    window.location.href.includes('accounts.google.com') ||
                    window.location.href.includes('facebook.com')) {
                    return false;
                }
                
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
            
            // Jeśli nie ma przycisku logowania i jest na Vinted, prawdopodobnie jest zalogowany
            const isOnVinted = currentUrl.includes('vinted.pl') || currentUrl.includes('vinted.com');
            return !hasLoginButton && isOnVinted;
            
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

    async navigateToNewListing() {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('🔄 Navigating to new listing page...');
        
        try {
            // Najpierw sprawdź czy już jesteśmy na właściwej stronie
            const currentUrl = this.page.url();
            console.log(`📍 Current URL: ${currentUrl}`);
            
            if (currentUrl.includes('/items/new')) {
                console.log('💡 Already on new listing page, checking form...');
                
                // Sprawdź czy formularz jest już dostępny - różne selektory
                const formSelectors = [
                    '[data-testid="item-upload-photo-section"]',  // stary selektor
                    '.media-select__input',                       // nowy selektor - container
                    'button .web_ui__Button__label:text("Dodaj zdjęcia")',  // przycisk
                    '.web_ui__Button__label:contains("Dodaj zdjęcia")'      // alternatywny
                ];
                
                let formExists = false;
                for (const selector of formSelectors) {
                    try {
                        const element = await this.page.$(selector);
                        if (element) {
                            console.log(`✅ Form found with selector: ${selector}`);
                            formExists = true;
                            break;
                        }
                    } catch (error) {
                        // Kontynuuj z następnym selektorem
                    }
                }
                
                if (formExists) {
                    console.log('✅ Form already ready, no navigation needed');
                    return;
                }
            }
            
            // Przejdź bezpośrednio na stronę dodawania ogłoszenia
            console.log('🌐 Navigating to fresh listing page...');
            await this.page.goto('https://www.vinted.pl/items/new', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            console.log('✅ New listing page loaded');
            
            // Daj stronie więcej czasu na pełne załadowanie
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Sprawdź czy formularz się załadował z retry logic
            let retries = 3;
            while (retries > 0) {
                try {
                    // Sprawdź różne selektory dla formularza zdjęć
                    const formSelectors = [
                        '[data-testid="item-upload-photo-section"]',  // stary selektor
                        '.media-select__input',                       // nowy selektor - container
                        'button:has(.web_ui__Button__label:text("Dodaj zdjęcia"))',  // przycisk
                        '.web_ui__Button__label'                      // ogólny selektor przycisku
                    ];
                    
                    let formFound = false;
                    for (const selector of formSelectors) {
                        try {
                            await this.page.waitForSelector(selector, { timeout: 3000 });
                            console.log(`✅ Form found with selector: ${selector}`);
                            formFound = true;
                            break;
                        } catch (error) {
                            // Spróbuj następny selektor
                        }
                    }
                    
                    if (formFound) {
                        console.log('✅ New listing form ready');
                        return;
                    } else {
                        throw new Error('No form selectors matched');
                    }
                } catch (error) {
                    retries--;
                    console.log(`⚠️  Photo section not found, retries left: ${retries}`);
                    
                    if (retries > 0) {
                        // Odśwież stronę i spróbuj ponownie
                        console.log('🔄 Refreshing page and trying again...');
                        await this.page.reload({ waitUntil: 'networkidle2', timeout: 20000 });
                        await new Promise(resolve => setTimeout(resolve, 3000));
                    } else {
                        // Jako ostatni resort, sprawdź czy jest jakikolwiek przycisk lub formularz
                        const anyButton = await this.page.$('button');
                        if (anyButton) {
                            console.log('⚠️  Found some button, assuming form is ready');
                            return;
                        }
                        throw error;
                    }
                }
            }
            
        } catch (error) {
            console.error('❌ Error navigating to new listing:', error);
            throw error;
        }
    }

    async waitForLogin(maxMinutes: number = 5): Promise<boolean> {
        console.log('');
        console.log('🔐 CZEKAM NA ZALOGOWANIE UŻYTKOWNIKA 🔐');
        console.log('');
        console.log('📱 INSTRUKCJE:');
        console.log('   1. Przejdź do otwartej przeglądarki Chrome');
        console.log('   2. Zaloguj się na Vinted (https://www.vinted.pl)');
        console.log('   3. ❌ NIE używaj logowania przez Google/Facebook');
        console.log('   4. ✅ Użyj "Zaloguj się przez email" + hasło');
        console.log('   5. ✅ Lub utwórz nowe konto bezpośrednio na Vinted');
        console.log('   6. ⚠️ Jeśli Google blokuje logowanie - to normalne!');
        console.log('   7. 🔄 Kliknij "Cofnij" i wybierz logowanie przez email');
        console.log('   8. Po zalogowaniu automatyzacja rozpocznie się automatycznie');
        console.log('');
        console.log(`⏰ Maksymalny czas oczekiwania: ${maxMinutes} minut`);
        console.log('');

        const maxWaitTime = maxMinutes * 60 * 1000; // Konwersja na milisekundy
        const startTime = Date.now();
        let lastStatus = '';

        while (Date.now() - startTime < maxWaitTime) {
            try {
                if (!this.page) {
                    console.log('❌ Utracono połączenie ze stroną');
                    return false;
                }

                // Sprawdź aktualny URL
                const currentUrl = this.page.url();
                const isOnVinted = currentUrl.includes('vinted.pl') || currentUrl.includes('vinted.com');
                const isOnGoogleLogin = currentUrl.includes('accounts.google.com');
                
                if (isOnGoogleLogin) {
                    const status = '⚠️ Google blokuje logowanie! Wróć do Vinted i użyj logowania przez email';
                    if (status !== lastStatus) {
                        console.log(status);
                        lastStatus = status;
                    }
                    
                    // Automatycznie wróć na Vinted
                    try {
                        await this.page.goto('https://www.vinted.pl/member/sign_in', { 
                            waitUntil: 'networkidle2', 
                            timeout: 10000 
                        });
                        console.log('🔄 Automatycznie przekierowano na stronę logowania Vinted');
                    } catch {
                        // Ignoruj błędy nawigacji
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }
                
                if (!isOnVinted) {
                    const status = '📍 Przejdź na stronę vinted.pl w przeglądarce';
                    if (status !== lastStatus) {
                        console.log(status);
                        lastStatus = status;
                    }
                    
                    // Próbuj automatycznie przejść na Vinted
                    try {
                        await this.page.goto('https://www.vinted.pl', { 
                            waitUntil: 'networkidle2', 
                            timeout: 10000 
                        });
                    } catch {
                        // Ignoruj błędy nawigacji
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    continue;
                }

                // Sprawdź czy użytkownik jest zalogowany
                const isLoggedIn = await this.checkIfLoggedIn();
                
                if (isLoggedIn) {
                    console.log('');
                    console.log('✅ ZALOGOWANO POMYŚLNIE!');
                    console.log('🚀 Rozpoczynam automatyzację...');
                    console.log('');
                    return true;
                }

                // Pokaż status oczekiwania co 10 sekund
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                if (elapsed % 10 === 0) {
                    const remaining = Math.ceil((maxWaitTime - (Date.now() - startTime)) / 1000);
                    const status = `⏳ Czekam na zalogowanie... (${remaining}s pozostało)`;
                    if (status !== lastStatus) {
                        console.log(status);
                        lastStatus = status;
                    }
                }

                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.log('⚠️ Błąd podczas sprawdzania logowania:', error);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        console.log('');
        console.log('❌ PRZEKROCZONO CZAS OCZEKIWANIA NA ZALOGOWANIE');
        console.log('🔄 Spróbuj uruchomić automatyzację ponownie po zalogowaniu');
        console.log('');
        return false;
    }

    async processAllAdvertisements(userId?: string) {
        try {
            console.log('🚀 Starting to process all advertisements...');
            
            // Najpierw sprawdź czy użytkownik jest zalogowany
            const isLoggedIn = await this.checkIfLoggedIn();
            
            if (!isLoggedIn) {
                console.log('⚠️ Użytkownik nie jest zalogowany');
                
                // Czekaj na zalogowanie użytkownika
                const loginSuccess = await this.waitForLogin(5); // 5 minut
                
                if (!loginSuccess) {
                    throw new Error('Nie udało się zalogować w wyznaczonym czasie');
                }
            } else {
                console.log('✅ Użytkownik już jest zalogowany');
            }
            
            // Kliknij przycisk "Sprzedaj"
            await this.clickSellButton();
            
            // Poczekaj na załadowanie formularza
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Pobierz ogłoszenia z bazy danych - tylko nieopublikowane do Vinted
            console.log('📥 Fetching unpublished advertisements from database...');
            const advertisements = await fetchUnpublishedToVintedAdvertisements(userId);
            
            if (advertisements.length === 0) {
                console.log('❌ No unpublished advertisements found in database');
                console.log('💡 Tip: Check if any advertisements have is_published_to_vinted = false');
                return;
            }
            
            console.log(`✅ Found ${advertisements.length} unpublished advertisements`);
            
            // Przetwarzaj ogłoszenia jedno po drugim
            for (let i = 0; i < advertisements.length; i++) {
                const ad = advertisements[i] as Advertisement;
                
                if (ad && !ad.is_published_to_vinted) {
                    console.log(`\n🔄 Processing advertisement ${i + 1}/${advertisements.length}: ${ad.marka} ${ad.rodzaj}`);
                    
                    try {
                        await this.processAdvertisement(ad);
                        console.log(`✅ Advertisement ${i + 1} completed successfully!`);
                        
                        // Jeśli to nie ostatnie ogłoszenie, przygotuj się do następnego
                        if (i < advertisements.length - 1) {
                            console.log('\n🔄 Preparing for next advertisement...');
                            console.log('📝 Navigating to create new listing...');
                            
                            // Przejdź bezpośrednio na stronę dodawania nowego ogłoszenia
                            await this.navigateToNewListing();
                            
                            // Poczekaj na załadowanie formularza
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            console.log('✅ Ready for next advertisement');
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error processing advertisement ${i + 1}:`, error);
                        console.log('⏭️  Skipping to next advertisement...');
                        
                        // Jeśli mamy więcej ogłoszeń, przygotuj się do następnego
                        if (i < advertisements.length - 1) {
                            console.log('🔄 Preparing for next advertisement after error...');
                            
                            // Daj stronie więcej czasu na zresetowanie się po błędzie
                            await new Promise(resolve => setTimeout(resolve, 5000));
                            
                            let navigationSuccess = false;
                            let navAttempts = 0;
                            const maxNavAttempts = 3;
                            
                            while (!navigationSuccess && navAttempts < maxNavAttempts) {
                                navAttempts++;
                                console.log(`🎯 Navigation attempt ${navAttempts}/${maxNavAttempts}...`);
                                
                                try {
                                    await this.navigateToNewListing();
                                    await new Promise(resolve => setTimeout(resolve, 3000));
                                    navigationSuccess = true;
                                    console.log('✅ Navigation successful after error');
                                } catch (navError) {
                                    console.error(`❌ Navigation attempt ${navAttempts} failed:`, navError instanceof Error ? navError.message : String(navError));
                                    
                                    if (navAttempts < maxNavAttempts) {
                                        console.log(`⏳ Waiting 10 seconds before next attempt...`);
                                        await new Promise(resolve => setTimeout(resolve, 10000));
                                    } else {
                                        console.error('❌ All navigation attempts failed. Stopping automation.');
                                        throw new Error('Failed to navigate to new listing after multiple attempts');
                                    }
                                }
                            }
                        }
                        continue;
                    }
                } else {
                    console.log(`⏭️  Skipping completed advertisement: ${ad.marka} ${ad.rodzaj}`);
                }
            }
            
            console.log('\n🎉 All advertisements processed!');
            console.log('✅ Automation completed successfully.');
            
        } catch (error) {
            console.error('❌ Error in processAllAdvertisements:', error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage.includes('TimeoutError') || errorMessage.includes('Waiting for selector')) {
                console.log('\n💡 Rozwiązania problemów:');
                console.log('1. Sprawdź czy jesteś zalogowany na Vinted');
                console.log('2. Sprawdź czy strona się w pełni załadowała');
                console.log('3. Vinted może zmienić interfejs - spróbuj ręcznie');
                
                await this.waitForUserInteraction('Możesz kontynuować ręcznie w przeglądarce', 120);
            }
        }
    }

    async clickSellButton() {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('Looking for Sprzedaj button...');
        
        try {
            // Lista możliwych selektorów dla przycisku "Sprzedaj"
            const sellButtonSelectors = [
                'a[href="/items/new"]'
            ];
            
            let buttonFound = false;
            
            // Próbuj każdy selektor
            for (const selector of sellButtonSelectors) {
                try {
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    await this.page.click(selector);
                    console.log(`✅ Clicked Sprzedaj button with selector: ${selector}`);
                    buttonFound = true;
                    break;
                } catch (error) {
                    // Nie loguj błędów dla poszczególnych selektorów
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

    async addPhotos(photoUrls: string[], rotations?: string[]) {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`📸 Starting photo upload process for ${photoUrls.length} photos...`);
        
        if (photoUrls.length === 0) {
            console.log('⚠️  No photos to upload');
            return;
        }
        
        try {
            // Pobierz zdjęcia z URL-ów i zapisz lokalnie z rotacją
            console.log('📥 Downloading photos from URLs...');
            const localPhotoPaths = await this.downloadImages(photoUrls, rotations);
            
            if (localPhotoPaths.length === 0) {
                console.log('❌ No photos were downloaded successfully');
                return;
            }
            
            console.log(`✅ Downloaded ${localPhotoPaths.length} photos`);
            
            // Znajdź input file dla zdjęć
            console.log('🔍 Looking for photo upload input...');
            
            // Spróbuj różne selektory dla input file
            const fileInputSelectors = [
                'input[type="file"]',
                'input[accept*="image"]',
                'input[multiple]',
                'input[name*="photo"]',
                'input[name*="image"]',
                '.photo-upload input',
                '.image-upload input'
            ];
            
            let fileInput = null;
            
            for (const selector of fileInputSelectors) {
                try {
                    fileInput = await this.page.$(selector);
                    if (fileInput) {
                        console.log(`✅ Found file input with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    // Kontynuuj z kolejnym selektorem
                }
            }
            
            // Jeśli nie ma input file, spróbuj kliknąć przycisk "Dodaj zdjęcia" żeby go odsłonić
            if (!fileInput) {
                console.log('🔍 File input not found, trying to click "Dodaj zdjęcia" button...');
                
                // Spróbuj konkretnych selektorów dla przycisku
                const buttonSelectors = [
                    '.media-select__input button',
                    'button[class*="Button"]:has-text("Dodaj zdjęcia")',
                    'button:has([data-testid="plus"])',
                    'button'
                ];
                
                let buttonClicked = false;
                
                for (const selector of buttonSelectors) {
                    try {
                        if (selector === 'button') {
                            // Ostatni fallback - szukaj po tekście
                            buttonClicked = await this.page.evaluate(() => {
                                const buttons = Array.from(document.querySelectorAll('button'));
                                const addPhotosBtn = buttons.find(btn => 
                                    btn.textContent?.includes('Dodaj zdjęcia') || 
                                    btn.textContent?.includes('Add photos')
                                );
                                if (addPhotosBtn) {
                                    (addPhotosBtn as HTMLElement).click();
                                    return true;
                                }
                                return false;
                            });
                        } else {
                            // Próbuj kliknąć konkretny selektor
                            const button = await this.page.$(selector);
                            if (button) {
                                await button.click();
                                console.log(`✅ Clicked button with selector: ${selector}`);
                                buttonClicked = true;
                                break;
                            }
                        }
                    } catch (error) {
                        continue;
                    }
                    
                    if (buttonClicked) break;
                }
                
                if (buttonClicked) {
                    console.log('✅ Clicked "Dodaj zdjęcia" button');
                    
                    // Czekaj chwilę na pojawienie się input
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // Spróbuj znaleźć input ponownie
                    for (const selector of fileInputSelectors) {
                        try {
                            fileInput = await this.page.$(selector);
                            if (fileInput) {
                                console.log(`✅ Found file input after button click: ${selector}`);
                                break;
                            }
                        } catch (error) {
                            // Kontynuuj
                        }
                    }
                } else {
                    console.log('❌ Could not find or click "Dodaj zdjęcia" button');
                }
            }
            
            if (!fileInput) {
                console.log('❌ Could not find file input element');
                console.log('🔧 Available inputs on page:');
                
                const availableInputs = await this.page.evaluate(() => {
                    const inputs = Array.from(document.querySelectorAll('input'));
                    return inputs.map(input => ({
                        type: input.type,
                        name: input.name,
                        accept: input.accept,
                        className: input.className,
                        id: input.id
                    })).slice(0, 10);
                });
                
                console.log(JSON.stringify(availableInputs, null, 2));
                
                // Spróbuj alternatywnego podejścia - drag & drop
                console.log('🔄 Trying alternative approach with drag & drop...');
                await this.uploadPhotosByDragDrop(localPhotoPaths);
                return;
            }
            
            // Upload zdjęć przez input file
            console.log('📤 Uploading photos...');
            
            // Upload maksymalnie 10 zdjęć (limit Vinted)
            const photosToUpload = localPhotoPaths.slice(0, 10);
            
            // Użyj właściwej metody Puppeteer
            const inputElement = await this.page.$('input[type="file"]');
            if (inputElement) {
                await inputElement.uploadFile(...photosToUpload);
            } else {
                // Alternatywne podejście - ustaw pliki bezpośrednio
                await this.page.evaluate(() => {
                    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                    if (input) {
                        input.style.display = 'block';
                        input.style.visibility = 'visible';
                        input.style.opacity = '1';
                    }
                });
                
                // Spróbuj ponownie
                const retryInput = await this.page.$('input[type="file"]');
                if (retryInput) {
                    await retryInput.uploadFile(...photosToUpload);
                }
            }
            
            console.log('✅ Photos uploaded successfully!');
            
            // Czekaj na przetworzenie zdjęć
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Opcjonalnie: sprawdź czy zdjęcia się pojawiły
            const uploadedPhotosCount = await this.page.evaluate(() => {
                const photoElements = document.querySelectorAll('img[src*="blob:"], .photo-preview, .image-preview');
                return photoElements.length;
            });
            
            console.log(`📊 Detected ${uploadedPhotosCount} uploaded photos on page`);
            
        } catch (error) {
            console.error('❌ Error adding photos:', error);
            throw error;
        }
    }

    async uploadPhotosByDragDrop(photoPaths: string[]) {
        if (!this.page) return;
        
        console.log('🎯 Attempting drag & drop upload...');
        
        try {
            // Znajdź element do przeciągnięcia zdjęć
            const dropZoneSelectors = [
                '.drop-zone',
                '.photo-upload',
                '.image-upload',
                '[data-testid*="photo"]',
                '[data-testid*="image"]',
                '.upload-area'
            ];
            
            let dropZone = null;
            
            for (const selector of dropZoneSelectors) {
                try {
                    dropZone = await this.page.$(selector);
                    if (dropZone) {
                        console.log(`✅ Found drop zone: ${selector}`);
                        break;
                    }
                } catch (error) {
                    // Kontynuuj
                }
            }
            
            if (!dropZone) {
                console.log('❌ No drop zone found for drag & drop');
                return;
            }
            
            // Symuluj drag & drop dla każdego zdjęcia
            for (const photoPath of photoPaths) {
                console.log(`🎯 Dropping photo: ${path.basename(photoPath)}`);
                
                const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
                
                // To jest skomplikowane w Puppeteer - może być potrzebne inne podejście
                console.log('⚠️  Drag & drop simulation is complex in Puppeteer');
                console.log('💡 Manual intervention may be required');
            }
            
        } catch (error) {
            console.error('❌ Error in drag & drop upload:', error);
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

    async selectCategory(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('🏷️ Selecting category based on rodzaj:', advertisement.rodzaj);
            
            // Kliknij dropdown kategorii
            console.log('📁 Opening category dropdown...');
            await this.page.waitForSelector('input[data-testid="catalog-select-dropdown-input"]', { timeout: 10000 });
            await this.page.click('input[data-testid="catalog-select-dropdown-input"]');
            
            // Poczekaj na załadowanie kategorii
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wybierz "Mężczyźni"
            console.log('👨 Selecting "Mężczyźni"...');
            await this.page.waitForSelector('#catalog-5', { timeout: 5000 });
            await this.page.click('#catalog-5');
            
            // Poczekaj na załadowanie podkategorii
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Określ kategorię główną na podstawie rodzaju
            const categoryInfo = this.determineCategoryFromRodzaj(advertisement.rodzaj || '');
            
            console.log('🔍 Category mapping result:', {
                rodzaj: advertisement.rodzaj,
                mainCategory: categoryInfo.mainCategory,
                mainCategoryId: categoryInfo.mainCategoryId,
                subCategory: categoryInfo.subCategory,
                subCategoryId: categoryInfo.subCategoryId,
                intermediateCategory: categoryInfo.intermediateCategory,
                intermediateCategoryId: categoryInfo.intermediateCategoryId,
                finalCategory: categoryInfo.finalCategory,
                finalCategoryId: categoryInfo.finalCategoryId
            });
            
            // Wybierz kategorię główną (Ubrania/Obuwie/Akcesoria)
            console.log(`📂 Selecting main category: ${categoryInfo.mainCategory}...`);
            await this.page.waitForSelector(`#catalog-${categoryInfo.mainCategoryId}`, { timeout: 5000 });
            await this.page.click(`#catalog-${categoryInfo.mainCategoryId}`);
            
            // Poczekaj na załadowanie kolejnych podkategorii
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wybierz subkategorię jeśli potrzebna
            if (categoryInfo.subCategoryId) {
                console.log(`📂 Selecting subcategory: ${categoryInfo.subCategory}...`);
                await this.page.waitForSelector(`#catalog-${categoryInfo.subCategoryId}`, { timeout: 5000 });
                await this.page.click(`#catalog-${categoryInfo.subCategoryId}`);
                
                // Poczekaj na załadowanie kolejnych podkategorii
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Wybierz kategorię pośrednią jeśli potrzebna (np. "Koszule" przed "Koszule w kratkę")
            if (categoryInfo.intermediateCategoryId) {
                console.log(`📂 Selecting intermediate category: ${categoryInfo.intermediateCategory}...`);
                await this.page.waitForSelector(`#catalog-${categoryInfo.intermediateCategoryId}`, { timeout: 5000 });
                await this.page.click(`#catalog-${categoryInfo.intermediateCategoryId}`);
                
                // Poczekaj na załadowanie kolejnych podkategorii
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            // Wybierz finalną kategorię
            if (categoryInfo.finalCategoryId) {
                console.log(`📂 Selecting final category: ${categoryInfo.finalCategory}...`);
                await this.page.waitForSelector(`#catalog-${categoryInfo.finalCategoryId}`, { timeout: 5000 });
                await this.page.click(`#catalog-${categoryInfo.finalCategoryId}`);
                
                // Poczekaj na załadowanie
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Sprawdź czy jest radio button do zaznaczenia
            if (categoryInfo.finalCategoryId) {
                const radioSelector = `#${categoryInfo.finalCategoryId}-catalog-radio`;
                try {
                    await this.page.waitForSelector(radioSelector, { timeout: 2000 });
                    await this.page.click(radioSelector);
                    console.log(`✅ Selected radio option for ${categoryInfo.finalCategory}`);
                } catch (error) {
                    console.log('ℹ️  No radio button found, category selection might be complete');
                }
            }
            
            // Poczekaj na zamknięcie dropdown
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            console.log('✅ Category selected successfully');
            
            // Sprawdź i zaznacz checkbox Unisex jeśli istnieje (dla akcesoriów)
            await this.checkAndSelectUnisexIfAvailable();
            
        } catch (error) {
            console.error('❌ Error selecting category:', error);
            console.log('💡 Możesz wybrać kategorię ręcznie w przeglądarce');
        }
    }

    async checkAndSelectUnisexIfAvailable() {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('🔄 Checking for Unisex checkbox...');
            
            // Sprawdź czy checkbox unisex istnieje
            const unisexCheckbox = await this.page.$('input[id="unisex"]');
            
            if (unisexCheckbox) {
                // Sprawdź czy checkbox jest już zaznaczony
                const isChecked = await this.page.evaluate(() => {
                    const checkbox = document.querySelector('input[id="unisex"]') as HTMLInputElement;
                    return checkbox ? checkbox.checked : false;
                });
                
                if (!isChecked) {
                    console.log('☑️  Found Unisex checkbox, selecting it...');
                    await unisexCheckbox.click();
                    
                    // Poczekaj chwilę żeby się załadowało
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    console.log('✅ Unisex checkbox selected');
                } else {
                    console.log('ℹ️  Unisex checkbox already selected');
                }
            } else {
                console.log('ℹ️  No Unisex checkbox found (normal for clothing items)');
            }
            
        } catch (error) {
            console.error('⚠️  Error checking Unisex checkbox:', error);
            // Nie przerywamy procesu - to nie jest krytyczny błąd
        }
    }

    private determineCategoryFromRodzaj(rodzaj: string): {
        mainCategory: string;
        mainCategoryId: string;
        subCategory?: string;
        subCategoryId?: string;
        intermediateCategory?: string;
        intermediateCategoryId?: string;
        finalCategory?: string;
        finalCategoryId?: string;
    } {
        // Mapowanie dokładnych nazw kategorii na ścieżki Vinted
        const categoryMappings: { [key: string]: any } = {
            'kurtka': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Okrycia wierzchnie',
                subCategoryId: '1206',
                intermediateCategory: 'Kurtki',
                intermediateCategoryId: '2052',
                finalCategory: 'Kurtki ocieplane',
                finalCategoryId: '2536'
            },
            'Koszule w kratkę': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                intermediateCategory: 'Koszule',
                intermediateCategoryId: '536',
                finalCategory: 'Koszule w kratkę',
                finalCategoryId: '1801'
            },
            'Koszule dżinsowe': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                intermediateCategory: 'Koszule',
                intermediateCategoryId: '536',
                finalCategory: 'Koszule dżinsowe',
                finalCategoryId: '1802'
            },
            'Koszulki z nadrukiem': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                intermediateCategory: 'Koszule',
                intermediateCategoryId: '536',
                finalCategory: 'Koszulki z nadrukiem',
                finalCategoryId: '1805'
            },
            'T-shirty z nadrukiem': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                intermediateCategory: 'T-shirty',
                intermediateCategoryId: '77',
                finalCategory: 'T-shirty z nadrukiem',
                finalCategoryId: '1807'
            },
            'Koszulki polo': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                intermediateCategory: 'T-shirty',
                intermediateCategoryId: '77',
                finalCategory: 'Koszulki polo',
                finalCategoryId: '1808'
            },
            'Koszulki z długim rękawem': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                intermediateCategory: 'T-shirty',
                intermediateCategoryId: '77',
                finalCategory: 'Koszulki z długim rękawem',
                finalCategoryId: '1809'
            },
            'Podkoszulki': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Koszule, T-shirty i podkoszulki',
                subCategoryId: '76',
                finalCategory: 'Podkoszulki',
                finalCategoryId: '560'  // Poprawione ID zgodnie z HTML
            },
            'Swetry i bluzy z kapturem': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Swetry i bluzy',
                subCategoryId: '79',  // Poprawione ID dla "Swetry i bluzy"
                finalCategory: 'Swetry i bluzy z kapturem',
                finalCategoryId: '267'  // Poprawione ID dla "Swetry i bluzy z kapturem"
            },
            'Bluzy rozpinane': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Swetry i bluzy',
                subCategoryId: '79',  // Poprawione ID dla "Swetry i bluzy"
                finalCategory: 'Kardigany',  // Używamy kategorii Kardigany jako najbliższej dla bluz rozpinanych
                finalCategoryId: '266'  // Poprawione ID dla kategorii Kardigany
            },
            'Kardigany': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Swetry i bluzy',
                subCategoryId: '79',
                finalCategory: 'Kardigany',
                finalCategoryId: '266'
            },
            'Spodnie z szerokimi nogawkami': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Spodnie',
                subCategoryId: '34',
                finalCategory: 'Spodnie z szerokimi nogawkami',
                finalCategoryId: '260'
            },
            'Szorty dżinsowe': {
                mainCategory: 'Ubrania',
                mainCategoryId: '2050',
                subCategory: 'Szorty',
                subCategoryId: '80',
                finalCategory: 'Szorty dżinsowe',
                finalCategoryId: '1824'
            },
            'Sneakersy, trampki i tenisówki': {
                mainCategory: 'Obuwie',
                mainCategoryId: '1231',  // Poprawione ID dla "Obuwie"
                finalCategory: 'Sneakersy, trampki i tenisówki',
                finalCategoryId: '1242'  // Poprawione ID dla "Sneakersy, trampki i tenisówki"
            },
            'Chusty i chustki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Chusty i chustki',
                finalCategoryId: '2960'  // Poprawione ID dla "Chusty i chustki"
            },
            'Paski': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Paski',
                finalCategoryId: '96'  // Poprawione ID dla "Paski"
            },
            'Rękawiczki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Rękawiczki',
                finalCategoryId: '2085'
            },
            'Poszetki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Poszetki',
                finalCategoryId: '2957'
            },
            'Szaliki i szale': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Szaliki i szale',
                finalCategoryId: '2092'
            },
            'Okulary przeciwsłoneczne': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',  // Poprawione ID dla "Akcesoria, dodatki"
                finalCategory: 'Okulary przeciwsłoneczne',
                finalCategoryId: '98'  // Poprawione ID dla "Okulary przeciwsłoneczne"
            },
            'Krawaty i muszki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Krawaty i muszki',
                finalCategoryId: '2956'
            },
            'Zegarki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                finalCategory: 'Zegarki',
                finalCategoryId: '2095'
            },
            'Plecaki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',  // Poprawione ID dla "Torby"
                finalCategory: 'Plecaki',
                finalCategoryId: '246'  // Poprawione ID dla "Plecaki"
            },
            'Teczki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Teczki',
                finalCategoryId: '2098'
            },
            'Nerki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Nerki',
                finalCategoryId: '2099'
            },
            'Pokrowce na ubrania': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Pokrowce na ubrania',
                finalCategoryId: '2100'
            },
            'Torby na siłownię': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Torby na siłownię',
                finalCategoryId: '2101'
            },
            'Torby podróżne': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Torby podróżne',
                finalCategoryId: '2102'
            },
            'Walizki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Walizki',
                finalCategoryId: '2103'
            },
            'Listonoszki': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Listonoszki',
                finalCategoryId: '2104'
            },
            'Torby na ramię': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Torby na ramię',
                finalCategoryId: '2105'
            },
            'Portfele': {
                mainCategory: 'Akcesoria, dodatki',
                mainCategoryId: '82',
                subCategory: 'Torby',
                subCategoryId: '94',
                finalCategory: 'Portfele',
                finalCategoryId: '248'
            }
        };

        // Sprawdź dokładne dopasowanie
        if (categoryMappings[rodzaj]) {
            return categoryMappings[rodzaj];
        }

        // Fallback - sprawdź podobieństwa dla starych danych
        const type = rodzaj.toLowerCase();
        
        if (type.includes('t-shirt') || type.includes('tshirt')) {
            if (type.includes('nadruk') || type.includes('print')) {
                return categoryMappings['T-shirty z nadrukiem'];
            }
        }
        
        if (type.includes('koszul') && !type.includes('podkoszul')) {
            if (type.includes('nadruk') || type.includes('print')) {
                return categoryMappings['Koszulki z nadrukiem'];
            } else if (type.includes('kratk')) {
                return categoryMappings['Koszule w kratkę'];
            } else if (type.includes('dżins')) {
                return categoryMappings['Koszule dżinsowe'];
            }
        }
        
        // Fallback dla kurtek
        if (type.includes('kurtk') || type.includes('jacket') || type.includes('płaszcz') || type.includes('coat') || type.includes('bomber')) {
            return categoryMappings['kurtka'];
        }

        // Fallback dla bluz
        if (type.includes('bluza') || type.includes('hoodie') || type.includes('sweter') || type.includes('kardigan')) {
            if (type.includes('kaptur') || type.includes('hood')) {
                return categoryMappings['Swetry i bluzy z kapturem'];
            } else if (type.includes('rozpina') || type.includes('zip') || type.includes('kardigan')) {
                return categoryMappings['Kardigany'];  // Używamy Kardigany zamiast "Bluzy rozpinane"
            } else {
                // Domyślnie bluzy z kapturem
                return categoryMappings['Swetry i bluzy z kapturem'];
            }
        }

        // Fallback dla akcesoriów
        if (type.includes('okular') || type.includes('sunglasses')) {
            return categoryMappings['Okulary przeciwsłoneczne'];
        }

        // Fallback dla toreb i plecaków
        if (type.includes('plecak') || type.includes('backpack')) {
            return categoryMappings['Plecaki'];
        }

        // Fallback dla portfeli
        if (type.includes('portfel') || type.includes('wallet')) {
            return categoryMappings['Portfele'];
        }

        // Fallback dla obuwia
        if (type.includes('buty') || type.includes('sneakers') || type.includes('trampki') || type.includes('tenisówki') || type.includes('shoes')) {
            return categoryMappings['Sneakersy, trampki i tenisówki'];
        }

        // Fallback dla chust i chustek
        if (type.includes('chusta') || type.includes('chustka') || type.includes('szal') || type.includes('scarf')) {
            return categoryMappings['Chusty i chustki'];
        }

        // Fallback dla pasków
        if (type.includes('pasek') || type.includes('belt')) {
            return categoryMappings['Paski'];
        }

        // Fallback dla krawatów i muszek
        if (type.includes('krawat') || type.includes('muszk') || type.includes('tie') || type.includes('bow tie')) {
            return categoryMappings['Krawaty i muszki'];
        }

        // Fallback dla poszetki
        if (type.includes('poszetk') || type.includes('pocket square')) {
            return categoryMappings['Poszetki'];
        }

        // Domyślna kategoria
        return {
            mainCategory: 'Ubrania',
            mainCategoryId: '2050',
            subCategory: 'Koszule, T-shirty i podkoszulki',
            subCategoryId: '76',
            intermediateCategory: 'T-shirty',
            intermediateCategoryId: '77',
            finalCategory: 'T-shirty z nadrukiem',
            finalCategoryId: '1807'
        };
    }

    async selectBrand(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('🏷️ Selecting brand:', advertisement.marka);
            
            // Kliknij dropdown marki - spróbuj różne selektory
            console.log('📁 Opening brand dropdown...');
            
            const brandDropdownSelectors = [
                'input[data-testid="brand-select-dropdown-input"]'
            ];
            
            let dropdownClicked = false;
            
            for (const selector of brandDropdownSelectors) {
                try {
                    console.log(`🎯 Trying brand dropdown selector: ${selector}`);
                    await this.page.waitForSelector(selector, { timeout: 5000 });
                    
                    // Sprawdź czy element jest widoczny, klikalny i czy nie jest disabled
                    const elementState = await this.page.evaluate((sel) => {
                        const element = document.querySelector(sel) as HTMLInputElement;
                        if (!element) return { exists: false };
                        
                        const rect = element.getBoundingClientRect();
                        const isVisible = rect.width > 0 && rect.height > 0;
                        const isDisabled = element.disabled || element.hasAttribute('disabled');
                        const isReadonly = element.readOnly || element.hasAttribute('readonly');
                        
                        return {
                            exists: true,
                            isVisible,
                            isDisabled,
                            isReadonly,
                            canClick: isVisible && !isDisabled
                        };
                    }, selector);
                    
                    console.log(`📊 Element state for ${selector}:`, elementState);
                    
                    if (elementState.canClick) {
                        await this.page.click(selector);
                        console.log(`✅ Successfully clicked brand dropdown with selector: ${selector}`);
                        dropdownClicked = true;
                        break;
                    } else if (elementState.exists) {
                        console.log(`⚠️  Element found but not clickable: ${selector} (visible: ${elementState.isVisible}, disabled: ${elementState.isDisabled})`);
                    }
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    console.log(`❌ Selector ${selector} failed: ${errorMsg}`);
                }
            }
            
            if (!dropdownClicked) {
                console.log('❌ Could not click brand dropdown with any selector');
                console.log('💡 Manual intervention needed - please click the brand dropdown manually');
                // Czekaj 10 sekund na ręczne kliknięcie
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
            
            // Poczekaj dłużej na załadowanie modala
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Sprawdź różne możliwe selektory pola wyszukiwania
            console.log(`🔍 Looking for brand input field...`);
            let inputField = null;
            
            const inputSelectors = [
                'input[placeholder*="markę"]'
            ];
            
            for (const selector of inputSelectors) {
                try {
                    inputField = await this.page.waitForSelector(selector, { timeout: 2000 });
                    if (inputField) {
                        console.log(`✅ Found input field with selector: ${selector}`);
                        break;
                    }
                } catch (error) {
                    // Nie loguj błędów dla poszczególnych selektorów
                }
            }
            
            if (!inputField) {
                console.log('⚠️  Could not find brand input field, trying to proceed without typing...');
                // Spróbuj znaleźć markę bezpośrednio na liście
                await this.selectBrandFromList(advertisement.marka || '');
                return;
            }
            
            // Wpisz markę w pole wyszukiwania
            console.log(`⌨️  Typing brand name: ${advertisement.marka}...`);
            await inputField.click();
            
            // Wyczyść pole i wpisz markę
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.keyboard.type(advertisement.marka || '');
            
            // Poczekaj na wyniki wyszukiwania
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Wybierz pierwszy wynik
            await this.selectBrandFromList(advertisement.marka || '');
            
            // Dodatkowo sprawdź czy nie pojawił się modal autentyczności
            await this.closeAuthenticityModalIfPresent();
            
        } catch (error) {
            console.error('❌ Error selecting brand:', error);
            console.log('💡 Możesz wybrać markę ręcznie w przeglądarce');
        }
    }

    async selectBrandFromList(brandName: string) {
        if (!this.page) return;
        
        try {
            console.log('📋 Selecting brand from list...');
            console.log(`🔍 Looking for brand: "${brandName}"`);
            
            // Poczekaj na załadowanie listy marek
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            let brandSelected = false;
            
            // 1. Spróbuj znaleźć po dokładnej nazwie marki w aria-label
            try {
                const exactBrandElement = await this.page.$(`[aria-label="${brandName}"]`);
                if (exactBrandElement) {
                    console.log(`✅ Found exact brand match: ${brandName}`);
                    await exactBrandElement.click();
                    brandSelected = true;
                }
            } catch (error) {
                console.log('❌ Exact brand match failed');
            }
            
            // 2. Jeśli nie znaleziono, spróbuj po ID marki (brand-*)
            if (!brandSelected) {
                try {
                    const brandElements = await this.page.$$('.web_ui__Cell__cell[id^="brand-"]');
                    console.log(`🔍 Found ${brandElements.length} brand elements with brand- prefix`);
                    
                    for (const element of brandElements) {
                        const ariaLabel = await element.evaluate(el => el.getAttribute('aria-label'));
                        console.log(`📋 Checking brand element: "${ariaLabel}"`);
                        
                        if (ariaLabel && ariaLabel.toLowerCase().includes(brandName.toLowerCase())) {
                            console.log(`✅ Found matching brand: ${ariaLabel}`);
                            await element.click();
                            brandSelected = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.log('❌ Brand ID search failed');
                }
            }
            
            // 3. Sprawdź czy jest opcja "Użyj [marka] jako marki" dla niestandardowych marek
            if (!brandSelected) {
                try {
                    console.log('🔍 Looking for custom brand option...');
                    
                    // Metoda A: Szukaj elementu z id="custom-select-brand"
                    const customBrandElement = await this.page.$('#custom-select-brand');
                    if (customBrandElement) {
                        const titleText = await customBrandElement.$eval('.web_ui__Cell__title', 
                            el => el.textContent?.trim() || '').catch(() => '');
                        
                        console.log(`📋 Found custom brand option: "${titleText}"`);
                        
                        // Sprawdź czy tekst zawiera nazwę marki
                        if (titleText.toLowerCase().includes(brandName.toLowerCase()) || 
                            titleText.includes('Użyj') || titleText.includes('jako marki')) {
                            console.log(`✅ Clicking custom brand option: ${titleText}`);
                            await customBrandElement.click();
                            brandSelected = true;
                        }
                    }
                    
                    // Metoda B: Szukaj przez tekst "Użyj ... jako marki"
                    if (!brandSelected) {
                        const customBrandFound = await this.page.evaluate((brand) => {
                            const elements = document.querySelectorAll('*');
                            for (const element of elements) {
                                const text = element.textContent?.trim() || '';
                                if ((text.includes('Użyj') && text.includes('jako marki')) || 
                                    (text.includes(brand) && text.includes('jako marki'))) {
                                    // Znajdź kliknięty element (może to być rodzic)
                                    let clickableElement: Element | null = element;
                                    while (clickableElement && !clickableElement.id?.includes('custom-select')) {
                                        clickableElement = clickableElement.parentElement;
                                        if (!clickableElement) break;
                                    }
                                    
                                    if (clickableElement) {
                                        (clickableElement as HTMLElement).click();
                                        return true;
                                    } else {
                                        (element as HTMLElement).click();
                                        return true;
                                    }
                                }
                            }
                            return false;
                        }, brandName);
                        
                        if (customBrandFound) {
                            console.log(`✅ Found and clicked custom brand option via text search`);
                            brandSelected = true;
                        }
                    }
                } catch (error) {
                    console.log('❌ Custom brand search failed');
                }
            }
            
            // 4. Fallback - kliknij pierwszy element z brand- ID (jeśli inne metody zawiodły)
            if (!brandSelected) {
                try {
                    const firstBrandElement = await this.page.$('.web_ui__Cell__cell[id^="brand-"]');
                    if (firstBrandElement) {
                        console.log('⚠️  Using fallback: clicking first brand element');
                        await firstBrandElement.click();
                        brandSelected = true;
                    }
                } catch (error) {
                    console.log('❌ Fallback brand selection failed');
                }
            }
            
            if (brandSelected) {
                // Poczekaj chwilę i kliknij przycisk zapisz
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Sprawdź czy pojawił się modal autentyczności i zamknij go
                await this.closeAuthenticityModalIfPresent();
                
                // Poczekaj na zamknięcie dropdown
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.error('❌ Error selecting brand from list:', error);
        }
    }

    async closeAuthenticityModalIfPresent() {
        if (!this.page) return;
        
        try {
            console.log('🔍 Checking for authenticity modal...');
            
            // Sprawdź czy modal autentyczności jest widoczny
            const modalSelector = 'button[data-testid="authenticity-modal--close-button"]';
            const modal = await this.page.$(modalSelector);
            
            if (modal) {
                console.log('📋 Authenticity modal detected, closing...');
                await this.page.click(modalSelector);
                console.log('✅ Authenticity modal closed');
                
                // Poczekaj na zamknięcie modala
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                console.log('ℹ️ No authenticity modal found');
            }
            
        } catch (error) {
            console.log('⚠️ Error checking/closing authenticity modal:', error);
            // Nie rzucamy błędu, bo to nie jest krytyczne
        }
    }

    async selectSize(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('📏 Selecting size:', advertisement.rozmiar);
            
            // Lista kategorii, które nie mają rozmiarów
            const categoriesWithoutSize = [
                'portfele', 'portfel', 'wallet',
                'poszetki', 'poszetka', 'pocket square',
                'krawaty i muszki', 'krawat', 'muszka', 'tie', 'bow tie',
                'okulary', 'sunglasses',
                'chusty', 'chustki', 'szal', 'scarf'
            ];
            
            // Sprawdź czy to kategoria bez rozmiarów
            const rodzajLower = (advertisement.rodzaj || '').toLowerCase();
            const hasNoSize = categoriesWithoutSize.some(category => 
                rodzajLower.includes(category.toLowerCase())
            );
            
            if (hasNoSize) {
                console.log(`⚠️  Category "${advertisement.rodzaj}" typically has no size options, skipping size selection`);
                return;
            }
            
            // Sprawdź czy pole rozmiaru w ogóle istnieje na stronie
            const sizeFieldExists = await this.page.$('input[data-testid="size-select-dropdown-input"]');
            if (!sizeFieldExists) {
                console.log('⚠️  Size dropdown not found on page, skipping size selection');
                return;
            }
            
            // Kliknij dropdown rozmiaru
            console.log('📁 Opening size dropdown...');
            await this.page.waitForSelector('input[data-testid="size-select-dropdown-input"]', { timeout: 10000 });
            await this.page.click('input[data-testid="size-select-dropdown-input"]');
            
            // Poczekaj na załadowanie listy rozmiarów
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Debug: sprawdź jakie elementy rozmiaru są dostępne
            try {
                const allSizeElements = await this.page.$$eval('*[id*="size"]', 
                    elements => elements.map(el => ({
                        id: el.id,
                        tagName: el.tagName,
                        textContent: el.textContent?.trim(),
                        className: el.className
                    }))
                );
                console.log('🔍 Debug - found elements with "size" in id:', allSizeElements.slice(0, 15));
            } catch (e) {
                console.log('Size debug failed, continuing...');
            }
            
            // Znajdź i kliknij odpowiedni rozmiar
            const targetSize = advertisement.rozmiar?.trim() || '';
            console.log(`🔍 Looking for size: "${targetSize}"`);

            if (!targetSize) {
                console.log('⚠️  No size specified, skipping size selection');
                return;
            }

            // Użyj nowego mapowania rozmiarów
            const availableSizes = getSizesForCategory(advertisement.rodzaj || '');
            const normalizedTargetSize = normalizeSizeForCategory(targetSize, advertisement.rodzaj || '');
            
            console.log(`🎯 Available sizes for "${advertisement.rodzaj}":`, availableSizes);
            console.log(`🎯 Normalized target size: "${normalizedTargetSize}"`);

            // Funkcja do normalizacji rozmiarów (dla porównania z Vinted)
            const normalizeSize = (size: string): string => {
                // Konwertuj kropkę na przecinek dla rozmiarów butów (np. 48.5 → 48,5)
                let normalized = size.replace(/\./g, ',');
                // Dodaj spacje wokół | dla zgodności z Vinted
                normalized = normalized.replace(/\s*\|\s*/g, ' | ').trim();
                return normalized;
            };

            // Stwórz listę wariantów do przetestowania (tylko dokładne dopasowania)
            const allSizeVariants = [
                normalizedTargetSize,
                targetSize,
                normalizeSize(targetSize),
                normalizeSize(normalizedTargetSize),
                targetSize.replace(/\./g, ','),
                targetSize.replace(/,/g, '.'),
                // Tylko dokładne dopasowania z dostępnych rozmiarów
                ...availableSizes.filter(size => 
                    size.toLowerCase() === targetSize.toLowerCase() ||
                    size.toLowerCase() === normalizedTargetSize.toLowerCase()
                )
            ];

            // Usuń duplikaty
            const uniqueSizeVariants = [...new Set(allSizeVariants)];
            console.log(`🔍 Will try size variants:`, uniqueSizeVariants);
            
            // Spróbuj znaleźć rozmiar na różne sposoby
            let sizeSelected = false;
            
            // 1. Spróbuj znaleźć po dokładnym tekście (wszystkie warianty)
            try {
                for (const variant of uniqueSizeVariants) {
                    const exactMatch = await this.page.waitForSelector(
                        `div[data-testid*="size-"] .web_ui__Cell__title:text("${variant}")`, 
                        { timeout: 1000 }
                    ).catch(() => null);
                    
                    if (exactMatch) {
                        const parentCell = await exactMatch.evaluateHandle(el => el.closest('.web_ui__Cell__cell'));
                        if (parentCell && 'click' in parentCell) {
                            await (parentCell as any).click();
                            console.log(`✅ Selected size by exact text match: ${variant} (for target: ${targetSize})`);
                            sizeSelected = true;
                            break;
                        }
                    }
                }
            } catch (error) {
                console.log('❌ Exact text match failed, trying alternative approach...');
            }
            
            // 2. Jeśli nie znaleziono, spróbuj przeszukać wszystkie elementy
            if (!sizeSelected) {
                try {
                    const sizeElements = await this.page.$$('li .web_ui__Cell__cell[id^="size-"]');
                    console.log(`🔍 Found ${sizeElements.length} size elements (method 1)`);
                    
                    for (const element of sizeElements) {
                        const sizeText = await element.$eval('.web_ui__Cell__title', el => el.textContent?.trim() || '');
                        console.log(`📋 Checking size: "${sizeText}"`);
                        
                        // Porównaj z wszystkimi wariantami rozmiaru
                        const sizeMatch = uniqueSizeVariants.some((variant: string) => 
                            sizeText === variant || 
                            sizeText.replace(/\./g, ',') === variant ||
                            sizeText.replace(/,/g, '.') === variant
                        );
                        
                        if (sizeMatch) {
                            await element.click();
                            console.log(`✅ Selected size: ${sizeText} (matched with target: ${targetSize})`);
                            sizeSelected = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.log('❌ Method 1 failed');
                }
            }
            
            // 3. Metoda 2: Prostszy selektor
            if (!sizeSelected) {
                try {
                    const sizeElements2 = await this.page.$$('[id^="size-"]');
                    console.log(`🔍 Found ${sizeElements2.length} size elements (method 2)`);
                    
                    for (const element of sizeElements2) {
                        try {
                            const sizeText = await element.evaluate(el => el.textContent?.trim() || '');
                            console.log(`📋 Checking size (method 2): "${sizeText}"`);
                            
                            // Porównaj z wszystkimi wariantami rozmiaru
                            const sizeMatch = uniqueSizeVariants.some((variant: string) => 
                                sizeText === variant || 
                                sizeText.replace(/\./g, ',') === variant ||
                                sizeText.replace(/,/g, '.') === variant
                            );
                            
                            if (sizeMatch) {
                                await element.click();
                                console.log(`✅ Selected size: ${sizeText} (method 2, matched with target: ${targetSize})`);
                                sizeSelected = true;
                                break;
                            }
                        } catch (elementError) {
                            continue;
                        }
                    }
                } catch (error) {
                    console.log('❌ Method 2 failed');
                }
            }
            
            // 4. Metoda 3: Wyszukiwanie przez evaluate i textContent
            if (!sizeSelected) {
                try {
                    console.log('🔍 Trying method 3: search by text content...');
                    for (const variant of uniqueSizeVariants) {
                        const found = await this.page.evaluate((targetSize) => {
                            const elements = Array.from(document.querySelectorAll('*'));
                            for (const element of elements) {
                                if (element.textContent?.trim() === targetSize && 
                                    element.id?.includes('size')) {
                                    (element as HTMLElement).click();
                                    return true;
                                }
                            }
                            return false;
                        }, variant);
                        
                        if (found) {
                            console.log(`✅ Selected size: ${variant} (method 3)`);
                            sizeSelected = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.log('❌ Method 3 failed');
                }
            }
            
            // 3. Jeśli nadal nie znaleziono, spróbuj radio button
            if (!sizeSelected) {
                try {
                    console.log('🔘 Trying radio button approach...');
                    const radioSelector = `input[type="radio"][aria-labelledby*="size-"]`;
                    const radioButtons = await this.page.$$(radioSelector);
                    console.log(`🔍 Found ${radioButtons.length} radio buttons`);
                    
                    for (const radio of radioButtons) {
                        const labelId = await radio.evaluate(el => el.getAttribute('aria-labelledby'));
                        if (labelId) {
                            const labelText = await this.page.$eval(`#${labelId} .web_ui__Cell__title`, 
                                el => el.textContent?.trim() || '').catch(() => '');
                            
                            if (labelText) {
                                console.log(`📋 Checking radio size: "${labelText}"`);
                                
                                // Porównaj z wszystkimi wariantami rozmiaru
                                const labelMatch = uniqueSizeVariants.some((variant: string) => 
                                    labelText === variant ||
                                    labelText.replace(/\./g, ',') === variant ||
                                    labelText.replace(/,/g, '.') === variant
                                );                                if (labelMatch) {
                                    await radio.click();
                                    console.log(`✅ Selected size via radio button: ${labelText} (matched with target: ${targetSize})`);
                                    sizeSelected = true;
                                    break;
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.log('❌ Radio button approach failed');
                }
            }

            if (!sizeSelected) {
                console.log(`⚠️  Could not find size "${targetSize}" in the list`);
                console.log(`🔄 Also tried variants:`, uniqueSizeVariants);
                
                // Debug: pokaż wszystkie dostępne rozmiary
                try {
                    const availableSizes = await this.page.evaluate(() => {
                        const sizes = [];
                        const elements = document.querySelectorAll('*');
                        for (const el of elements) {
                            if (el.id?.includes('size') && el.textContent?.trim() && 
                                !el.id.includes('input') && !el.id.includes('label')) {
                                sizes.push({
                                    id: el.id,
                                    text: el.textContent.trim(),
                                    tagName: el.tagName
                                });
                            }
                        }
                        return sizes;
                    });
                    
                    console.log('🔍 Available size options found:');
                    availableSizes.forEach((size, i) => {
                        console.log(`   ${i+1}. "${size.text}" (id: ${size.id}, tag: ${size.tagName})`);
                    });
                } catch (e) {
                    console.log('⚠️  Could not retrieve available sizes');
                }
                
                console.log('💡 Available sizes can be selected manually');
            } else {
                // Poczekaj na zamknięcie dropdown
                await new Promise(resolve => setTimeout(resolve, 1000));
            }        } catch (error) {
            console.error('❌ Error selecting size:', error);
            console.log('💡 Możesz wybrać rozmiar ręcznie w przeglądarce');
        }
    }

    async selectCondition(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('🏷️ Selecting condition:', advertisement.stan);
            
            // Sprawdź czy pole stanu w ogóle istnieje na stronie
            const conditionFieldExists = await this.page.$('input[data-testid="condition-select-dropdown-input"]');
            if (!conditionFieldExists) {
                console.log('⚠️  Condition dropdown not found on page, skipping condition selection');
                console.log('💡 This might be expected for some categories that don\'t require condition');
                return;
            }
            
            // Mapa stanów z bazy danych na opcje Vinted
            const conditionMap: Record<string, string> = {
                'nowy z metką': 'Nowy z metką',
                'nowy bez metki': 'Nowy bez metki', 
                'bardzo dobry': 'Bardzo dobry',
                'dobry': 'Dobry',
                'zadowalający': 'Zadowalający',
                'zadowalające': 'Zadowalający'  // Dodanie mapowania dla formy z końcówką "-e"
            };
            
            const dbCondition = advertisement.stan?.toLowerCase().trim() || '';
            const vintedCondition = conditionMap[dbCondition];
            
            console.log(`🔍 Debug condition mapping:`);
            console.log(`   Database condition: "${advertisement.stan}"`);
            console.log(`   Normalized: "${dbCondition}"`);
            console.log(`   Mapped to Vinted: "${vintedCondition}"`);
            
            if (!vintedCondition) {
                console.log(`⚠️  Unknown condition "${advertisement.stan}", skipping condition selection`);
                console.log(`💡 Available conditions: ${Object.keys(conditionMap).join(', ')}`);
                return;
            }
            
            console.log(`📁 Opening condition dropdown for: ${vintedCondition}...`);
            
            // Kliknij dropdown stanu
            await this.page.waitForSelector('input[data-testid="condition-select-dropdown-input"]', { timeout: 10000 });
            await this.page.click('input[data-testid="condition-select-dropdown-input"]');
            
            // Poczekaj na załadowanie listy stanów - zwiększony czas
            console.log('⏳ Waiting for dropdown to open...');
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            // Sprawdź czy dropdown się otworzył
            const dropdownOpen = await this.page.evaluate(() => {
                const elements = document.querySelectorAll('[id*="condition"]');
                return elements.length > 1; // Więcej niż sam input
            });
            
            console.log(`📊 Dropdown state: ${dropdownOpen ? 'OPEN' : 'CLOSED'}`);
            
            if (!dropdownOpen) {
                console.log('⚠️  Dropdown did not open, trying to click again...');
                await this.page.click('input[data-testid="condition-select-dropdown-input"]');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            // Znajdź i kliknij odpowiedni stan
            console.log(`🔍 Looking for condition: "${vintedCondition}"`);
            
            let conditionSelected = false;
            
            // Dodaj debugging - sprawdź jakie elementy są dostępne
            try {
                const allElements = await this.page.$$eval('*[id*="condition"]', 
                    elements => elements.map(el => ({
                        id: el.id,
                        tagName: el.tagName,
                        textContent: el.textContent?.trim(),
                        className: el.className
                    }))
                );
                console.log('🔍 Debug - found elements with "condition" in id:', allElements.slice(0, 10));
            } catch (e) {
                console.log('Debug failed, continuing...');
            }
            
            // Metoda 1: Próbuj oryginalny selektor
            try {
                const conditionElements = await this.page.$$('li .web_ui__Cell__cell[id^="condition-"]');
                console.log(`🔍 Found ${conditionElements.length} condition elements (method 1)`);
                
                for (const element of conditionElements) {
                    try {
                        const titleText = await element.$eval('.web_ui__Cell__title', el => el.textContent?.trim() || '');
                        console.log(`📋 Checking condition: "${titleText}"`);
                        
                        if (titleText === vintedCondition) {
                            await element.click();
                            console.log(`✅ Selected condition: ${vintedCondition}`);
                            conditionSelected = true;
                            break;
                        }
                    } catch (elementError) {
                        // Element może nie mieć tytułu, kontynuuj
                        continue;
                    }
                }
            } catch (error) {
                console.log('❌ Method 1 failed');
            }
            
            // Metoda 2: Jeśli nie znaleziono, spróbuj alternatywny selektor
            if (!conditionSelected) {
                try {
                    const conditionElements2 = await this.page.$$('[id^="condition-"]');
                    console.log(`🔍 Found ${conditionElements2.length} condition elements (method 2)`);
                    
                    for (const element of conditionElements2) {
                        try {
                            const titleText = await element.evaluate(el => el.textContent?.trim() || '');
                            console.log(`📋 Checking condition (method 2): "${titleText}"`);
                            
                            if (titleText === vintedCondition) {
                                await element.click();
                                console.log(`✅ Selected condition: ${vintedCondition} (method 2)`);
                                conditionSelected = true;
                                break;
                            }
                        } catch (elementError) {
                            continue;
                        }
                    }
                } catch (error) {
                    console.log('❌ Method 2 failed');
                }
            }
            
            // Metoda 3: Szukaj przez wszystkie elementy z tekstem
            if (!conditionSelected) {
                try {
                    console.log('🔍 Trying method 3: search by text content...');
                    conditionSelected = await this.page.evaluate((targetCondition) => {
                        const elements = Array.from(document.querySelectorAll('*'));
                        for (const element of elements) {
                            if (element.textContent?.trim() === targetCondition && 
                                element.id?.includes('condition')) {
                                (element as HTMLElement).click();
                                return true;
                            }
                        }
                        return false;
                    }, vintedCondition);
                    
                    if (conditionSelected) {
                        console.log(`✅ Selected condition: ${vintedCondition} (method 3)`);
                    }
                } catch (error) {
                    console.log('❌ Method 3 failed');
                }
            }
            
            // Metoda 4: Szukaj przez Puppeteer evaluate z kliknięciem na parent
            if (!conditionSelected) {
                try {
                    console.log('🔍 Trying method 4: evaluate with parent click...');
                    conditionSelected = await this.page.evaluate((targetCondition) => {
                        // Znajdź elementy z tekstem
                        const walker = document.createTreeWalker(
                            document.body,
                            NodeFilter.SHOW_TEXT
                        );
                        
                        let node;
                        while (node = walker.nextNode()) {
                            if (node.textContent?.trim() === targetCondition) {
                                let parent = node.parentElement;
                                while (parent) {
                                    if (parent.id?.includes('condition') || 
                                        parent.className?.includes('condition') ||
                                        parent.getAttribute('role') === 'option') {
                                        (parent as HTMLElement).click();
                                        return true;
                                    }
                                    parent = parent.parentElement;
                                }
                            }
                        }
                        return false;
                    }, vintedCondition);
                    
                    if (conditionSelected) {
                        console.log(`✅ Selected condition: ${vintedCondition} (method 4)`);
                    }
                } catch (error) {
                    console.log('❌ Method 4 failed');
                }
            }
            
            if (!conditionSelected) {
                console.log(`⚠️  Could not find condition "${vintedCondition}" in the list`);
                
                // Debug: pokaż wszystkie dostępne opcje stanu
                try {
                    const availableConditions = await this.page.evaluate(() => {
                        const conditions = [];
                        const elements = document.querySelectorAll('*');
                        for (const el of elements) {
                            if (el.id?.includes('condition') && el.textContent?.trim()) {
                                conditions.push({
                                    id: el.id,
                                    text: el.textContent.trim(),
                                    tagName: el.tagName
                                });
                            }
                        }
                        return conditions;
                    });
                    
                    console.log('🔍 Available condition options found:');
                    availableConditions.forEach((condition, i) => {
                        console.log(`   ${i+1}. "${condition.text}" (id: ${condition.id}, tag: ${condition.tagName})`);
                    });
                } catch (e) {
                    console.log('⚠️  Could not retrieve available conditions');
                }
                
                console.log('💡 Available conditions can be selected manually');
            } else {
                // Poczekaj na zamknięcie dropdown
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.error('❌ Error selecting condition:', error);
            console.log('💡 Możesz wybrać stan ręcznie w przeglądarce');
        }
    }

    async selectColor(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('🎨 Selecting color:', advertisement.color);
            
            const targetColor = advertisement.color?.trim() || '';
            
            if (!targetColor) {
                console.log('⚠️  No color specified, skipping color selection');
                return;
            }
            
            console.log(`📁 Opening color dropdown...`);
            
            // Sprawdź czy dropdown jest już otwarty
            const isDropdownOpen = await this.page.$('.web_ui__Cell__cell[id^="color-"]');
            
            if (!isDropdownOpen) {
                // Kliknij dropdown koloru
                await this.page.waitForSelector('input[data-testid="color-select-dropdown-input"]', { timeout: 10000 });
                await this.page.click('input[data-testid="color-select-dropdown-input"]');
                
                // Poczekaj na załadowanie listy kolorów
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.log('✅ Color dropdown already open');
            }
            
            // Znajdź i kliknij odpowiedni kolor
            console.log(`🔍 Looking for color: "${targetColor}"`);
            
            let colorSelected = false;
            
            try {
                // Szukaj po poprawnym selektorze - elementy są w li z div[id^="color-"]
                const colorElements = await this.page.$$('li .web_ui__Cell__cell[id^="color-"]');
                console.log(`🔍 Found ${colorElements.length} color elements`);
                
                // Debug: wypisz wszystkie dostępne kolory
                console.log('🎨 Available colors:');
                for (const element of colorElements) {
                    try {
                        const titleText = await element.$eval('.web_ui__Cell__title', el => el.textContent?.trim() || '');
                        const colorId = await element.evaluate(el => el.id);
                        console.log(`   - ${titleText} (ID: ${colorId})`);
                    } catch (e) {
                        // Ignore elements without title
                    }
                }
                
                console.log(`🎯 Looking for exact match: "${targetColor}"`);
                
                for (const element of colorElements) {
                    try {
                        const titleText = await element.$eval('.web_ui__Cell__title', el => el.textContent?.trim() || '');
                        console.log(`📋 Checking color: "${titleText}"`);
                        
                        if (titleText.toLowerCase() === targetColor.toLowerCase()) {
                            // Znajdź konkretny ID tego elementu koloru i checkbox
                            const colorId = await element.evaluate(el => el.id);
                            const colorNumber = colorId.replace('color-', '');
                            const checkboxId = `color-checkbox-${colorNumber}`;
                            
                            console.log(`🎯 Found target color "${titleText}" with element ID: ${colorId}, checkbox ID: ${checkboxId}`);
                            
                            // Kliknij bezpośrednio w checkbox używając jego ID
                            try {
                                await this.page.click(`#${checkboxId}`);
                                console.log(`✅ Clicked checkbox #${checkboxId} for color: ${titleText}`);
                                colorSelected = true;
                                
                                // Sprawdź od razu czy checkbox jest zaznaczony
                                await new Promise(resolve => setTimeout(resolve, 300));
                                const isChecked = await this.page.evaluate((id) => {
                                    const checkbox = document.getElementById(id) as HTMLInputElement;
                                    return checkbox ? checkbox.checked : false;
                                }, checkboxId);
                                
                                console.log(`🔍 Checkbox ${checkboxId} checked status: ${isChecked}`);
                                
                                if (!isChecked) {
                                    console.log(`⚠️  Checkbox not checked, trying alternative click...`);
                                    // Spróbuj kliknąć w element koloru zamiast checkbox
                                    await this.page.click(`#${colorId}`);
                                    await new Promise(resolve => setTimeout(resolve, 300));
                                }
                                
                            } catch (checkboxError) {
                                console.log(`⚠️  Checkbox click failed, trying element click...`);
                                // Fallback - kliknij na element koloru
                                await element.click();
                                console.log(`✅ Selected color (by element click): ${titleText}`);
                                colorSelected = true;
                            }
                            
                            // Poczekaj dłużej przed zamknięciem dropdown
                            console.log('🔄 Waiting before closing color dropdown...');
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            
                            // Zamknij dropdown przez kliknięcie w konkretny element - nota o wysyłce
                            try {
                                console.log('🔄 Closing color dropdown by clicking shipping note...');
                                await this.page.click('.web_ui__Note__note');
                                await new Promise(resolve => setTimeout(resolve, 500));
                                console.log('✅ Color dropdown closed by clicking shipping note');
                            } catch (noteError) {
                                // Fallback - kliknij w inne bezpieczne miejsce
                                try {
                                    console.log('🔄 Fallback: closing dropdown with alternative click...');
                                    await this.page.click('h1, .page-title');
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    console.log('✅ Color dropdown closed with fallback method');
                                } catch (error) {
                                    console.log('⚠️  Could not close dropdown, but color selected');
                                }
                            }
                            
                            break;
                        }
                    } catch (elementError) {
                        // Element może nie mieć tytułu, kontynuuj
                        continue;
                    }
                }
            } catch (error) {
                console.log('❌ Error finding color elements');
            }
            
            if (!colorSelected) {
                console.log(`⚠️  Could not find color "${targetColor}" in the list`);
                console.log('💡 Available colors can be selected manually');
            } else {
                // Finalna weryfikacja po zamknięciu dropdown
                console.log('🔍 Final verification of color selection...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const finalCheck = await this.page.evaluate((targetColor) => {
                    const colorElements = document.querySelectorAll('li .web_ui__Cell__cell[id^="color-"]');
                    const results = [];
                    for (const el of colorElements) {
                        const titleEl = el.querySelector('.web_ui__Cell__title');
                        const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                        if (titleEl && checkbox) {
                            const colorName = titleEl.textContent?.trim() || '';
                            const isChecked = checkbox.checked;
                            if (isChecked) {
                                results.push(colorName);
                            }
                        }
                    }
                    return results;
                }, targetColor);
                
                console.log(`🔍 Currently selected colors: [${finalCheck.join(', ')}]`);
                
                if (finalCheck.includes(targetColor)) {
                    console.log(`✅ Color "${targetColor}" is correctly selected`);
                } else if (finalCheck.length > 0) {
                    console.log(`⚠️  Different color(s) selected: [${finalCheck.join(', ')}] instead of "${targetColor}"`);
                } else {
                    console.log(`⚠️  No color appears to be selected`);
                }
            }
            
        } catch (error) {
            console.error('❌ Error selecting color:', error);
            console.log('💡 Możesz wybrać kolor ręcznie w przeglądarce');
        }
    }

    async verifyColorSelection(expectedColor: string): Promise<boolean> {
        if (!this.page) return false;
        
        try {
            // Sprawdź czy dropdown koloru pokazuje wybrany kolor
            const selectedValue = await this.page.$eval(
                'input[data-testid="color-select-dropdown-input"]', 
                el => (el as HTMLInputElement).value || el.getAttribute('value') || ''
            );
            
            const isSelected = selectedValue.toLowerCase().includes(expectedColor.toLowerCase()) ||
                              expectedColor.toLowerCase().includes(selectedValue.toLowerCase());
            
            console.log(`🔍 Color verification: expected "${expectedColor}", found "${selectedValue}", selected: ${isSelected}`);
            return isSelected;
            
        } catch (error) {
            console.log('❌ Could not verify color selection');
            return false;
        }
    }

    async fillPrice(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('💰 Filling price:', advertisement.price);
            
            const price = advertisement.price?.trim() || '';
            
            if (!price) {
                console.log('⚠️  No price specified, skipping price input');
                return;
            }
            
            // Znajdź pole ceny
            console.log('🔍 Looking for price input field...');
            await this.page.waitForSelector('input[data-testid="price-input--input"]', { timeout: 10000 });
            
            // Wyczyść pole i wpisz cenę
            await this.page.click('input[data-testid="price-input--input"]');
            await this.page.evaluate(() => {
                const input = document.querySelector('input[data-testid="price-input--input"]') as HTMLInputElement;
                if (input) {
                    input.value = '';
                    input.focus();
                }
            });
            
            // Wpisz cenę
            await this.page.type('input[data-testid="price-input--input"]', price);
            console.log(`✅ Price filled: ${price} zł`);
            
            // Poczekaj chwilę na aktualizację
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error('❌ Error filling price:', error);
            console.log('💡 Możesz wpisać cenę ręcznie w przeglądarce');
        }
    }

    async verifyAllFields(advertisement: Advertisement): Promise<boolean> {
        if (!this.page) return false;
        
        try {
            console.log('🔍 Verifying all form fields...');
            
            let allFieldsOk = true;
            const issues: string[] = [];
            
            // Sprawdź tytuł
            try {
                const title = await this.page.$eval(
                    'input#title[data-testid="title--input"]',
                    el => (el as HTMLInputElement).value
                );
                if (!title || title.trim().length === 0) {
                    issues.push('❌ Title is empty');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Title: "${title.substring(0, 50)}..."`);
                }
            } catch (error) {
                issues.push('❌ Could not verify title');
                allFieldsOk = false;
            }
            
            // Sprawdź opis
            try {
                const description = await this.page.$eval(
                    'textarea#description[data-testid="description--input"]',
                    el => (el as HTMLTextAreaElement).value
                );
                if (!description || description.trim().length === 0) {
                    issues.push('❌ Description is empty');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Description: ${description.length} characters`);
                }
            } catch (error) {
                issues.push('❌ Could not verify description');
                allFieldsOk = false;
            }
            
            // Sprawdź kategorię
            try {
                const category = await this.page.$eval(
                    'input[data-testid="catalog-select-dropdown-input"]',
                    el => (el as HTMLInputElement).value
                );
                if (!category || category.trim().length === 0) {
                    issues.push('❌ Category is not selected');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Category: "${category}"`);
                }
            } catch (error) {
                issues.push('❌ Could not verify category');
                allFieldsOk = false;
            }
            
            // Sprawdź markę
            try {
                const brand = await this.page.$eval(
                    'input[data-testid="brand-select-dropdown-input"]',
                    el => (el as HTMLInputElement).value
                );
                if (!brand || brand.trim().length === 0) {
                    issues.push('❌ Brand is not selected');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Brand: "${brand}"`);
                }
            } catch (error) {
                issues.push('❌ Could not verify brand');
                allFieldsOk = false;
            }
            
            // Sprawdź rozmiar
            try {
                const size = await this.page.$eval(
                    'input[data-testid="size-select-dropdown-input"]',
                    el => (el as HTMLInputElement).value
                );
                if (!size || size.trim().length === 0) {
                    issues.push('❌ Size is not selected');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Size: "${size}"`);
                }
            } catch (error) {
                issues.push('❌ Could not verify size');
                allFieldsOk = false;
            }
            
            // Sprawdź stan
            try {
                const condition = await this.page.$eval(
                    'input[data-testid="condition-select-dropdown-input"]',
                    el => (el as HTMLInputElement).value
                );
                if (!condition || condition.trim().length === 0) {
                    issues.push('❌ Condition is not selected');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Condition: "${condition}"`);
                }
            } catch (error) {
                issues.push('❌ Could not verify condition');
                allFieldsOk = false;
            }
            
            // Sprawdź kolor (opcjonalny)
            try {
                const color = await this.page.$eval(
                    'input[data-testid="color-select-dropdown-input"]',
                    el => (el as HTMLInputElement).value || el.getAttribute('value') || ''
                );
                
                if (advertisement.color && advertisement.color.trim().length > 0) {
                    // Sprawdź czy wybrany kolor pasuje do oczekiwanego
                    const isSelected = color.toLowerCase().includes(advertisement.color.toLowerCase()) ||
                                      advertisement.color.toLowerCase().includes(color.toLowerCase());
                    
                    // Dodatkowo sprawdź czy checkbox koloru jest zaznaczony
                    const isColorActuallySelected = await this.page.evaluate((targetColor) => {
                        const colorElements = document.querySelectorAll('li .web_ui__Cell__cell[id^="color-"]');
                        for (const el of colorElements) {
                            const titleEl = el.querySelector('.web_ui__Cell__title');
                            if (titleEl && titleEl.textContent?.trim().toLowerCase() === targetColor.toLowerCase()) {
                                const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                                return checkbox ? checkbox.checked : false;
                            }
                        }
                        return false;
                    }, advertisement.color);
                    
                    if (isColorActuallySelected) {
                        console.log(`✅ Color: "${advertisement.color}" (verified via checkbox)`);
                    } else if (isSelected && color.trim().length > 0) {
                        console.log(`✅ Color: "${color}" (verified via input field)`);
                    } else if (!isSelected && (!color || color.trim().length === 0)) {
                        console.log(`⚠️  Color expected "${advertisement.color}" but not found in field or checkbox`);
                        // Nie dodawaj do issues - kolor może być wybrany ale nie widoczny w polu
                    } else {
                        console.log(`⚠️  Color verification inconclusive: field="${color}", expected="${advertisement.color}"`);
                    }
                } else {
                    if (color && color.trim().length > 0) {
                        console.log(`✅ Color: "${color}"`);
                    } else {
                        console.log(`ℹ️  Color: not specified`);
                    }
                }
            } catch (error) {
                console.log('ℹ️  Color field not found or not verifiable');
            }
            
            // Sprawdź cenę
            try {
                const price = await this.page.$eval(
                    'input[data-testid="price-input--input"]',
                    el => (el as HTMLInputElement).value
                );
                if (!price || price.trim().length === 0) {
                    issues.push('❌ Price is empty');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Price: "${price} zł"`);
                }
            } catch (error) {
                issues.push('❌ Could not verify price');
                allFieldsOk = false;
            }
            
            // Sprawdź zdjęcia
            try {
                const photosCount = await this.page.evaluate(() => {
                    const photoElements = document.querySelectorAll('img[src*="blob:"], .photo-preview, .image-preview');
                    return photoElements.length;
                });
                
                if (photosCount === 0) {
                    issues.push('❌ No photos uploaded');
                    allFieldsOk = false;
                } else {
                    console.log(`✅ Photos: ${photosCount} uploaded`);
                }
            } catch (error) {
                issues.push('❌ Could not verify photos');
                allFieldsOk = false;
            }
            
            if (allFieldsOk) {
                console.log('🎉 All form fields verified successfully!');
            } else {
                console.log('⚠️  Some issues found with form fields:');
                issues.forEach(issue => console.log(`   ${issue}`));
            }
            
            return allFieldsOk;
            
        } catch (error) {
            console.error('❌ Error verifying form fields:', error);
            return false;
        }
    }

    async saveDraftAndMarkComplete(advertisementId: string) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            // Kliknij przycisk "Wersja robocza"
            console.log('💾 Saving as draft...');
            
            // Sprawdź czy przycisk jest dostępny
            await this.page.waitForSelector('button[data-testid="upload-form-save-draft-button"]', { timeout: 10000 });
            
            // Sprawdź czy przycisk jest kliknny
            const isClickable = await this.page.evaluate(() => {
                const button = document.querySelector('button[data-testid="upload-form-save-draft-button"]') as HTMLButtonElement;
                if (!button) return { exists: false };
                
                const rect = button.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0;
                const isEnabled = !button.disabled;
                
                return {
                    exists: true,
                    isVisible,
                    isEnabled,
                    text: button.textContent,
                    canClick: isVisible && isEnabled
                };
            });
            
            console.log('🔍 Button state:', isClickable);
            
            if (!isClickable.canClick) {
                console.log('⚠️  Button is not clickable, waiting 3 seconds...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // Zapisz aktualny URL przed kliknięciem
            const currentUrl = this.page.url();
            console.log(`📍 Current URL: ${currentUrl}`);
            
            // Użyj evaluate do bezpośredniego kliknięcia
            const clicked = await this.page.evaluate(() => {
                const button = document.querySelector('button[data-testid="upload-form-save-draft-button"]') as HTMLButtonElement;
                if (button && !button.disabled) {
                    button.click();
                    return true;
                }
                return false;
            });
            
            if (clicked) {
                console.log('✅ Successfully clicked "Wersja robocza" button via JavaScript');
            } else {
                console.log('❌ Failed to click "Wersja robocza" button');
                throw new Error('Could not click draft button');
            }
            console.log('⏳ Waiting for page redirect...');
            
            // Czekaj na przekierowanie (zmianę URL) lub komunikat o sukcesie
            try {
                // Opcja 1: Sprawdź przekierowanie
                await this.page.waitForFunction(
                    (originalUrl) => window.location.href !== originalUrl,
                    { timeout: 8000 },
                    currentUrl
                );
                console.log('✅ Page redirected successfully');
                
                // Dodatowe oczekiwanie na pełne załadowanie nowej strony
                await new Promise(resolve => setTimeout(resolve, 3000));
                console.log('✅ New page fully loaded');
                
            } catch (redirectError) {
                console.log('⏳ No immediate redirect, checking for success indicators...');
                
                // Opcja 2: Sprawdź czy jest komunikat o sukcesie lub zmiana na stronie
                try {
                    await this.page.waitForSelector('.success-message, .draft-saved, [data-testid*="success"]', { timeout: 5000 });
                    console.log('✅ Success indicator found');
                } catch (successError) {
                    // Opcja 3: Sprawdź czy przycisk się zmienił lub zniknął
                    const buttonStillExists = await this.page.$('button[data-testid="upload-form-save-draft-button"]');
                    if (!buttonStillExists) {
                        console.log('✅ Draft button disappeared - likely saved');
                    } else {
                        console.log('⚠️  No clear success indication, but continuing...');
                    }
                }
                
                // Poczekaj trochę na zapisanie
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
            
            // Oznacz ogłoszenie jako opublikowane do Vinted
            console.log('📝 Marking advertisement as published to Vinted...');
            
            const { updateVintedPublishStatus } = await import('./supabaseFetcher');
            const success = await updateVintedPublishStatus(advertisementId, true);
            
            if (success) {
                console.log('✅ Advertisement marked as published to Vinted in database');
            } else {
                console.log('⚠️  Failed to update Vinted publish status in database');
            }
            
        } catch (error) {
            console.error('❌ Error saving draft or updating database:', error);
            console.log('💡 You may need to save manually');
        }
    }

    async processAdvertisement(ad: Advertisement) {
        // Validate required fields before processing
        if (!ad.marka || !ad.rodzaj || !ad.rozmiar || !ad.stan) {
            console.log(`❌ Skipping advertisement ${ad.id}: missing required fields`);
            console.log(`   - Marka: ${ad.marka || 'MISSING'}`);
            console.log(`   - Rodzaj: ${ad.rodzaj || 'MISSING'}`);
            console.log(`   - Rozmiar: ${ad.rozmiar || 'MISSING'}`);
            console.log(`   - Stan: ${ad.stan || 'MISSING'}`);
            throw new Error('Advertisement has missing required fields');
        }

        // Validate photos
        if (!ad.photo_uris || ad.photo_uris.length === 0) {
            console.log(`❌ Skipping advertisement ${ad.id}: no photos available`);
            throw new Error('Advertisement has no photos');
        }

        console.log(`🔄 Processing advertisement: ${ad.marka} ${ad.rodzaj}`);
        
        // Przygotuj ogłoszenie - wygeneruj tytuł i opis
        const preparedAd = await this.prepareAdvertisement(ad);
        
        console.log(`📊 Advertisement data:`, {
            originalData: {
                marka: ad.marka,
                rodzaj: ad.rodzaj,
                rozmiar: ad.rozmiar,
                stan: ad.stan
            },
            generatedData: {
                title: preparedAd.title,
                description: preparedAd.description?.substring(0, 100) + '...',
                photosCount: preparedAd.photos?.length || 0
            },
            isCompleted: ad.is_completed
        });
        
        try {
            // Dodaj zdjęcia najpierw
            if (preparedAd.photos && preparedAd.photos.length > 0) {
                console.log('📸 Adding photos...');
                await this.addPhotos(preparedAd.photos, ad.photo_rotations);
                console.log('✅ Photos added');
                
                // Poczekaj chwilę na przetworzenie zdjęć
                console.log('⏳ Waiting for photos to process...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                console.log('ℹ️  No photos to upload');
            }
            
            // Poczekaj chwilę na załadowanie formularza
            console.log('⏳ Waiting 2 seconds for form to be ready...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Wypełnij tytuł
            if (preparedAd.title && preparedAd.title.trim().length > 0) {
                console.log('📝 Filling title...');
                await this.fillTitle(preparedAd.title);
                console.log('✅ Title filled');
            } else {
                console.log('⚠️  No valid title generated for this advertisement');
            }
            
            // Poczekaj chwilę między akcjami
            console.log('⏳ Waiting 1 second before filling description...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wypełnij opis
            if (preparedAd.description && preparedAd.description.trim().length > 0) {
                console.log('📄 Filling description...');
                await this.fillDescription(preparedAd.description);
                console.log('✅ Description filled');
            } else {
                console.log('⚠️  No valid description generated for this advertisement');
            }
            
            // Poczekaj chwilę przed wyborem kategorii
            console.log('⏳ Waiting 1 second before selecting category...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wybierz kategorię
            console.log('🏷️ Selecting category...');
            await this.selectCategory(ad);
            console.log('✅ Category selected');
            
            // Sprawdź i zaznacz checkbox Unisex jeśli istnieje (dla akcesoriów)
            await this.checkAndSelectUnisexIfAvailable();
            
            // Poczekaj dłużej przed wyborem marki - Vinted może ładować marki dla danej kategorii
            console.log('⏳ Waiting 3 seconds for brand field to become available after category selection...');
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Wybierz markę
            console.log('🏷️ Selecting brand...');
            await this.selectBrand(ad);
            console.log('✅ Brand selected');
            
            // Poczekaj chwilę przed wyborem rozmiaru
            console.log('⏳ Waiting 1 second before selecting size...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wybierz rozmiar
            console.log('📏 Selecting size...');
            await this.selectSize(ad);
            console.log('✅ Size selected');
            
            // Poczekaj chwilę przed wyborem stanu
            console.log('⏳ Waiting 1 second before selecting condition...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wybierz stan
            console.log('🏷️ Selecting condition...');
            await this.selectCondition(ad);
            console.log('✅ Condition selected');
            
            // Poczekaj chwilę przed wyborem koloru
            console.log('⏳ Waiting 1 second before selecting color...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wybierz kolor
            console.log('🎨 Selecting color...');
            await this.selectColor(ad);
            console.log('✅ Color selected');
            
            // Poczekaj chwilę przed wypełnieniem ceny
            console.log('⏳ Waiting 1 second before filling price...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Wypełnij cenę
            console.log('💰 Filling price...');
            await this.fillPrice(ad);
            console.log('✅ Price filled');
            
            // Zweryfikuj wszystkie pola przed zapisaniem
            console.log('🔍 Final verification before saving...');
            const allFieldsOk = await this.verifyAllFields(ad);
            
            if (!allFieldsOk) {
                console.log('⚠️  Some fields are missing or incorrect. Please check manually.');
                console.log('💡 You can continue manually in the browser and save the draft.');
                // Mimo problemów, kontynuuj z zapisem - użytkownik może poprawić ręcznie
            }
            
            // Zapisz jako wersję roboczą i oznacz jako ukończone
            console.log('💾 Finalizing advertisement...');
            await this.saveDraftAndMarkComplete(ad.id);
            console.log('✅ Advertisement finalized');
            
            console.log(`🎉 Advertisement processed successfully: ${preparedAd.title}`);
            
        } catch (error) {
            console.error(`❌ Error processing advertisement ${ad.marka} ${ad.rodzaj}:`, error);
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

    async startWithExistingBrowser(userId?: string) {
        try {
            console.log('🚀 Starting Vinted automation with existing browser...');
            console.log('🔍 Sprawdzanie połączenia z Chrome...');
            
            // Połącz z istniejącą przeglądarką (lub uruchom automatycznie)
            await this.initWithExistingBrowser();
            
            // Dodatkowa ochrona przed dialogami
            if (this.page) {
                await this.page.evaluateOnNewDocument(() => {
                    // Nadpisz window.confirm, alert i beforeunload
                    window.confirm = () => true;
                    window.alert = () => {};
                    window.onbeforeunload = null;
                    
                    // Usuń wszystkie event listenery beforeunload
                    const originalAddEventListener = window.addEventListener;
                    window.addEventListener = function(event: any, handler: any, options: any) {
                        if (event === 'beforeunload') {
                            return; // Ignoruj beforeunload listenery
                        }
                        return originalAddEventListener.call(this, event, handler, options);
                    };
                });
            }
            
            // Sprawdź czy jesteś na Vinted, jeśli nie - przejdź tam
            if (!this.page?.url().includes('vinted.pl')) {
                console.log('📍 Navigating to Vinted...');
                await this.page?.goto('https://www.vinted.pl', { waitUntil: 'networkidle2' });
            }
            
            // Sprawdź logowanie
            const isLoggedIn = await this.checkIfLoggedIn();
            if (!isLoggedIn) {
                console.log('⚠️ Użytkownik nie jest zalogowany');
                
                // Czekaj na zalogowanie użytkownika
                const loginSuccess = await this.waitForLogin(5); // 5 minut
                
                if (!loginSuccess) {
                    throw new Error('Nie udało się zalogować w wyznaczonym czasie');
                }
            } else {
                console.log('✅ Użytkownik już jest zalogowany');
            }
            
            // Kliknij przycisk "Sprzedaj"
            await this.clickSellButton();
            
            // Poczekaj na załadowanie formularza
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Pobierz ogłoszenia z bazy danych - tylko nieopublikowane do Vinted
            console.log('📥 Fetching unpublished advertisements from database...');
            const advertisements = await fetchUnpublishedToVintedAdvertisements(userId);
            
            if (advertisements.length === 0) {
                console.log('❌ No unpublished advertisements found in database');
                console.log('💡 Tip: Check if any advertisements have is_published_to_vinted = false');
                return;
            }
            
            console.log(`✅ Found ${advertisements.length} unpublished advertisements`);
            
            // Przetwarzaj ogłoszenia jedno po drugim
            for (let i = 0; i < advertisements.length; i++) {
                const ad = advertisements[i] as Advertisement;
                
                if (ad && !ad.is_published_to_vinted) {
                    console.log(`\n🔄 Processing advertisement ${i + 1}/${advertisements.length}: ${ad.marka} ${ad.rodzaj}`);
                    
                    try {
                        await this.processAdvertisement(ad);
                        console.log(`✅ Advertisement ${i + 1} completed successfully!`);
                        
                        // Jeśli to nie ostatnie ogłoszenie, przygotuj się do następnego
                        if (i < advertisements.length - 1) {
                            console.log('\n🔄 Preparing for next advertisement...');
                            console.log('📝 Navigating to create new listing...');
                            
                            // Przejdź bezpośrednio na stronę dodawania nowego ogłoszenia
                            await this.navigateToNewListing();
                            
                            // Poczekaj na załadowanie formularza
                            await new Promise(resolve => setTimeout(resolve, 3000));
                            console.log('✅ Ready for next advertisement');
                        }
                        
                    } catch (error) {
                        console.error(`❌ Error processing advertisement ${i + 1}:`, error);
                        console.log('⏭️  Skipping to next advertisement...');
                        continue;
                    }
                } else {
                    console.log(`⏭️  Skipping completed advertisement: ${ad.marka} ${ad.rodzaj}`);
                }
            }
            
            console.log('\n🎉 All advertisements processed!');
            console.log('✅ Automation completed successfully.');
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Specjalna obsługa dla przypadku uruchomienia Chrome
            if (errorMessage === 'CHROME_STARTED_PLEASE_LOGIN') {
                console.log('🎯 Chrome został uruchomiony. Program kończy działanie.');
                return; // Zakończ bez błędu
            }
            
            console.error('❌ Error in Vinted automation:', error);
            
            if (errorMessage.includes('TimeoutError') || errorMessage.includes('Waiting for selector')) {
                console.log('\n💡 Rozwiązania problemów:');
                console.log('1. Sprawdź czy jesteś zalogowany na Vinted');
                console.log('2. Sprawdź czy strona się w pełni załadowała');
                console.log('3. Vinted może zmienić interfejs - spróbuj ręcznie');
                
                await this.waitForUserInteraction('Możesz kontynuować ręcznie w przeglądarce', 120);
            }
        }
    }

    async start(userId?: string) {
        try {
            console.log('🚀 Starting Vinted automation...');
            
            // Inicjalizuj przeglądarkę
            await this.init();
            
            // Przejdź na Vinted
            await this.navigateToVinted();
            
            // Uruchom przetwarzanie wszystkich ogłoszeń
            await this.processAllAdvertisements(userId);
            
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
        // Wyczyść tymczasowe pliki
        await this.cleanupTempFiles();
        
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Funkcja główna do uruchomienia automatyzacji
export async function runVintedAutomation(userId?: string) {
    const automation = new VintedAutomation();
    
    try {
        await automation.start(userId);
    } catch (error) {
        console.error('Vinted automation failed:', error);
    } finally {
        await automation.close();
    }
}

// Funkcja do uruchomienia z istniejącą przeglądarką
export async function runVintedAutomationWithExistingBrowser(userId?: string) {
    const automation = new VintedAutomation();
    
    try {
        await automation.startWithExistingBrowser(userId);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Nie pokazuj błędu jeśli Chrome został właśnie uruchomiony
        if (errorMessage !== 'CHROME_STARTED_PLEASE_LOGIN') {
            console.error('Vinted automation with existing browser failed:', error);
        }
    }
    // Nie zamykamy przeglądarki bo używamy istniejącej
}

// Jeśli plik jest uruchamiany bezpośrednio
if (import.meta.main) {
    runVintedAutomation().catch(console.error);
}
