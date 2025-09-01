import puppeteer, { Browser, Page } from 'puppeteer';
import { fetchAdvertisements, fetchUnpublishedToVintedAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType } from './supabaseFetcher';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

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

    // Generuj tytuł według wzorca z main.js: {marka} {getShortenedProductType(rodzaj)} {rozmiar} {description_text}
    async generateTitle(ad: Advertisement): Promise<string> {
        const parts = [];
        
        if (ad.marka) parts.push(ad.marka);
        if (ad.rodzaj) parts.push(this.getShortenedProductType(ad.rodzaj));
        if (ad.rozmiar) parts.push(ad.rozmiar);
        
        // Dodaj description_text ze style_templates na podstawie typu produktu
        try {
            const specificStyle = await fetchStyleByType(ad.typ);
            if (specificStyle && specificStyle.description_text) {
                parts.push(specificStyle.description_text);
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
                fetchDescriptionHeaders(),
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

    async downloadImages(photoUrls: string[]): Promise<string[]> {
        const downloadedPaths: string[] = [];
        
        for (let i = 0; i < photoUrls.length; i++) {
            const url = photoUrls[i];
            const extension = url.split('.').pop()?.toLowerCase() || 'jpg';
            const filename = `photo_${Date.now()}_${i + 1}.${extension}`;
            
            try {
                const filePath = await this.downloadImage(url, filename);
                downloadedPaths.push(filePath);
            } catch (error) {
                console.error(`Failed to download image ${i + 1}:`, error);
                // Kontynuuj z kolejnymi zdjęciami
            }
        }
        
        return downloadedPaths;
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
            
            // Użyj prostego timeout bez AbortSignal
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch('http://localhost:9222/json/version', {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            const isOk = response.ok;
            console.log(`📡 Port 9222 ${isOk ? 'dostępny' : 'niedostępny'}`);
            return isOk;
        } catch (error) {
            console.log('❌ Błąd sprawdzania portu 9222:', error);
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
            
            // Utwórz unikalny katalog dla profilu debug w folderze użytkownika
            const { execSync } = await import('child_process');
            const userDir = process.env.USERPROFILE || process.env.HOME || '.';
            let debugDir = `${userDir}\\AppData\\Local\\Temp\\chrome-debug-vinted-${Date.now()}`;
            
            try {
                console.log(`📁 Tworzę katalog debug: ${debugDir}`);
                execSync(`mkdir "${debugDir}"`, { stdio: 'ignore' });
                console.log(`✅ Utworzono katalog debug`);
            } catch (error) {
                console.log('⚠️ Błąd tworzenia katalogu:', error);
                // Spróbuj alternatywny katalog w bieżącym folderze
                debugDir = `.\\chrome-debug-${Date.now()}`;
                try {
                    execSync(`mkdir "${debugDir}"`, { stdio: 'ignore' });
                    console.log(`✅ Utworzono alternatywny katalog: ${debugDir}`);
                } catch {
                    console.log('❌ Nie można utworzyć katalogu debug');
                    return false;
                }
            }
            
            // Zamknij istniejące procesy Chrome przed uruchomieniem nowego
            console.log('🔄 Zamykam istniejące procesy Chrome...');
            try {
                const { execSync } = await import('child_process');
                execSync('taskkill /F /IM chrome.exe 2>NUL', { stdio: 'ignore' });
                await new Promise(resolve => setTimeout(resolve, 2000)); // Czekaj 2 sekundy
            } catch {
                // Ignoruj błędy - może nie być procesów Chrome
            }
            
            // Uruchom Chrome z debug portem w tle
            console.log('🚀 Uruchamiam nowy Chrome z debug portem...');
            console.log(`📁 Używając katalogu: ${debugDir}`);
            const { spawn } = await import('child_process');
            const chromeProcess = spawn(chromePath, [
                '--remote-debugging-port=9222',
                `--user-data-dir="${debugDir}"`,
                '--no-first-run',
                '--no-default-browser-check',
                '--disable-default-apps',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--disable-background-timer-throttling',
                '--disable-renderer-backgrounding',
                '--disable-backgrounding-occluded-windows',
                '--disable-ipc-flooding-protection',
                'https://www.vinted.pl'
            ], {
                detached: false,  // Zmieniono na false dla lepszego debugowania
                stdio: ['ignore', 'pipe', 'pipe']  // Pozwól na wyświetlanie błędów
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

    async navigateToNewListing() {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('🔄 Navigating to new listing page...');
        
        try {
            // Przejdź bezpośrednio na stronę dodawania ogłoszenia
            await this.page.goto('https://www.vinted.pl/items/new', { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });
            
            console.log('✅ New listing page loaded');
            
            // Sprawdź czy formularz się załadował
            await this.page.waitForSelector('[data-testid="item-upload-photo-section"]', { timeout: 10000 });
            console.log('✅ New listing form ready');
            
        } catch (error) {
            console.error('❌ Error navigating to new listing:', error);
            throw error;
        }
    }

    async processAllAdvertisements() {
        try {
            console.log('🚀 Starting to process all advertisements...');
            
            // Kliknij przycisk "Sprzedaj"
            await this.clickSellButton();
            
            // Poczekaj na załadowanie formularza
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Pobierz ogłoszenia z bazy danych - tylko nieopublikowane do Vinted
            console.log('📥 Fetching unpublished advertisements from database...');
            const advertisements = await fetchUnpublishedToVintedAdvertisements();
            
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
                            try {
                                await this.navigateToNewListing();
                                await new Promise(resolve => setTimeout(resolve, 3000));
                            } catch (navError) {
                                console.error('❌ Error navigating to new listing after error:', navError);
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

    async addPhotos(photoUrls: string[]) {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`📸 Starting photo upload process for ${photoUrls.length} photos...`);
        
        if (photoUrls.length === 0) {
            console.log('⚠️  No photos to upload');
            return;
        }
        
        try {
            // Pobierz zdjęcia z URL-ów i zapisz lokalnie
            console.log('📥 Downloading photos from URLs...');
            const localPhotoPaths = await this.downloadImages(photoUrls);
            
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
            
        } catch (error) {
            console.error('❌ Error selecting category:', error);
            console.log('💡 Możesz wybrać kategorię ręcznie w przeglądarce');
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
                finalCategoryId: '539'
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
                finalCategoryId: '2106'
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
            
            // Różne selektory dla elementów marki
            const brandSelectors = [
                'li.web_ui__Item__item .web_ui__Cell__cell[id^="brand-"]',
                '.web_ui__Cell__cell[aria-label*="' + brandName + '"]',
                '.web_ui__Cell__cell[id^="brand-"]',
                'li .web_ui__Cell__cell',
                '.web_ui__Cell__clickable'
            ];
            
            let brandSelected = false;
            
            for (const selector of brandSelectors) {
                try {
                    const elements = await this.page.$$(selector);
                    if (elements && elements.length > 0) {
                        console.log(`✅ Found ${elements.length} brand elements with selector: ${selector}`);
                        // Kliknij pierwszy element
                        await elements[0].click();
                        console.log('✅ First brand element selected');
                        brandSelected = true;
                        break;
                    }
                } catch (error) {
                    console.log(`❌ Selector ${selector} failed, trying next...`);
                }
            }
            
            if (!brandSelected) {
                console.log('⚠️  Could not select brand from list, trying radio button approach...');
                // Spróbuj znaleźć i kliknąć radio button
                try {
                    const radioButtons = await this.page.$$('input[type="radio"][name^="brand-radio-"]');
                    if (radioButtons && radioButtons.length > 0) {
                        await radioButtons[0].click();
                        console.log('✅ Brand radio button selected');
                        brandSelected = true;
                    }
                } catch (error) {
                    console.log('❌ Radio button approach failed');
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
            
            // Kliknij dropdown rozmiaru
            console.log('📁 Opening size dropdown...');
            await this.page.waitForSelector('input[data-testid="size-select-dropdown-input"]', { timeout: 10000 });
            await this.page.click('input[data-testid="size-select-dropdown-input"]');
            
            // Poczekaj na załadowanie listy rozmiarów
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Znajdź i kliknij odpowiedni rozmiar
            const targetSize = advertisement.rozmiar?.trim() || '';
            console.log(`🔍 Looking for size: "${targetSize}"`);
            
            if (!targetSize) {
                console.log('⚠️  No size specified, skipping size selection');
                return;
            }
            
            // Funkcja do normalizacji rozmiarów (dodaje spacje wokół | dla zgodności z Vinted)
            const normalizeSize = (size: string): string => {
                return size.replace(/\s*\|\s*/g, ' | ').trim();
            };
            
            const normalizedTargetSize = normalizeSize(targetSize);
            console.log(`🎯 Normalized target size: "${normalizedTargetSize}"`);
            
            // Spróbuj znaleźć rozmiar na różne sposoby
            let sizeSelected = false;
            
            // 1. Spróbuj znaleźć po dokładnym tekście
            try {
                const exactMatch = await this.page.waitForSelector(
                    `div[data-testid*="size-"] .web_ui__Cell__title:text("${targetSize}")`, 
                    { timeout: 3000 }
                );
                if (exactMatch) {
                    const parentCell = await exactMatch.evaluateHandle(el => el.closest('.web_ui__Cell__cell'));
                    if (parentCell && 'click' in parentCell) {
                        await (parentCell as any).click();
                        console.log(`✅ Selected size by exact text match: ${targetSize}`);
                        sizeSelected = true;
                    }
                }
            } catch (error) {
                console.log('❌ Exact text match failed, trying alternative approach...');
            }
            
            // 2. Jeśli nie znaleziono, spróbuj przeszukać wszystkie elementy
            if (!sizeSelected) {
                try {
                    const sizeElements = await this.page.$$('li .web_ui__Cell__cell[id^="size-"]');
                    console.log(`🔍 Found ${sizeElements.length} size elements`);
                    
                    for (const element of sizeElements) {
                        const sizeText = await element.$eval('.web_ui__Cell__title', el => el.textContent?.trim() || '');
                        const normalizedSizeText = normalizeSize(sizeText);
                        console.log(`📋 Checking size: "${sizeText}" (normalized: "${normalizedSizeText}")`);
                        
                        // Porównaj zarówno oryginalny jak i znormalizowany tekst
                        if (sizeText === targetSize || normalizedSizeText === normalizedTargetSize || 
                            sizeText === normalizedTargetSize || normalizedSizeText === targetSize) {
                            await element.click();
                            console.log(`✅ Selected size: ${sizeText} (matched with: ${targetSize})`);
                            sizeSelected = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.log('❌ Element iteration failed');
                }
            }
            
            // 3. Jeśli nadal nie znaleziono, spróbuj radio button
            if (!sizeSelected) {
                try {
                    console.log('🔘 Trying radio button approach...');
                    const radioSelector = `input[type="radio"][aria-labelledby*="size-"]`;
                    const radioButtons = await this.page.$$(radioSelector);
                    
                    for (const radio of radioButtons) {
                        const labelId = await radio.evaluate(el => el.getAttribute('aria-labelledby'));
                        if (labelId) {
                            const labelText = await this.page.$eval(`#${labelId} .web_ui__Cell__title`, 
                                el => el.textContent?.trim() || '');
                            const normalizedLabelText = normalizeSize(labelText);
                            
                            // Porównaj zarówno oryginalny jak i znormalizowany tekst
                            if (labelText === targetSize || normalizedLabelText === normalizedTargetSize || 
                                labelText === normalizedTargetSize || normalizedLabelText === targetSize) {
                                await radio.click();
                                console.log(`✅ Selected size via radio button: ${labelText} (matched with: ${targetSize})`);
                                sizeSelected = true;
                                break;
                            }
                        }
                    }
                } catch (error) {
                    console.log('❌ Radio button approach failed');
                }
            }
            
            if (!sizeSelected) {
                console.log(`⚠️  Could not find size "${targetSize}" in the list`);
                console.log(`🔄 Also tried normalized version: "${normalizedTargetSize}"`);
                console.log('💡 Available sizes can be selected manually');
            } else {
                // Poczekaj na zamknięcie dropdown
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
        } catch (error) {
            console.error('❌ Error selecting size:', error);
            console.log('💡 Możesz wybrać rozmiar ręcznie w przeglądarce');
        }
    }

    async selectCondition(advertisement: Advertisement) {
        if (!this.page) throw new Error('Page not initialized');
        
        try {
            console.log('🏷️ Selecting condition:', advertisement.stan);
            
            // Mapa stanów z bazy danych na opcje Vinted
            const conditionMap: Record<string, string> = {
                'nowy z metką': 'Nowy z metką',
                'nowy bez metki': 'Nowy bez metki', 
                'bardzo dobry': 'Bardzo dobry',
                'dobry': 'Dobry',
                'zadowalający': 'Zadowalający'
            };
            
            const dbCondition = advertisement.stan?.toLowerCase().trim() || '';
            const vintedCondition = conditionMap[dbCondition];
            
            if (!vintedCondition) {
                console.log(`⚠️  Unknown condition "${advertisement.stan}", skipping condition selection`);
                return;
            }
            
            console.log(`📁 Opening condition dropdown for: ${vintedCondition}...`);
            
            // Kliknij dropdown stanu
            await this.page.waitForSelector('input[data-testid="condition-select-dropdown-input"]', { timeout: 10000 });
            await this.page.click('input[data-testid="condition-select-dropdown-input"]');
            
            // Poczekaj na załadowanie listy stanów
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Znajdź i kliknij odpowiedni stan
            console.log(`🔍 Looking for condition: "${vintedCondition}"`);
            
            let conditionSelected = false;
            
            try {
                // Szukaj po poprawnym selektorze - elementy są w li z div[id^="condition-"]
                const conditionElements = await this.page.$$('li .web_ui__Cell__cell[id^="condition-"]');
                console.log(`🔍 Found ${conditionElements.length} condition elements`);
                
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
                console.log('❌ Error finding condition elements');
            }
            
            if (!conditionSelected) {
                console.log(`⚠️  Could not find condition "${vintedCondition}" in the list`);
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
                
                for (const element of colorElements) {
                    try {
                        const titleText = await element.$eval('.web_ui__Cell__title', el => el.textContent?.trim() || '');
                        console.log(`📋 Checking color: "${titleText}"`);
                        
                        if (titleText.toLowerCase() === targetColor.toLowerCase()) {
                            // Kliknij checkbox wewnątrz elementu koloru
                            const checkbox = await element.$('input[type="checkbox"]');
                            if (checkbox) {
                                await checkbox.click();
                                console.log(`✅ Selected color: ${titleText}`);
                                colorSelected = true;
                                
                                // Poczekaj na aktualizację UI
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                
                                // Sprawdź czy kolor pozostał wybrany
                                const isStillSelected = await this.verifyColorSelection(targetColor);
                                if (!isStillSelected) {
                                    console.log('⚠️  Color was deselected, trying JavaScript click...');
                                    
                                    // Użyj JavaScript click jako fallback
                                    await this.page.evaluate((colorText) => {
                                        const colorElements = document.querySelectorAll('li .web_ui__Cell__cell[id^="color-"]');
                                        for (const el of colorElements) {
                                            const titleEl = el.querySelector('.web_ui__Cell__title');
                                            if (titleEl && titleEl.textContent?.trim().toLowerCase() === colorText.toLowerCase()) {
                                                const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                                                if (checkbox) {
                                                    checkbox.checked = true;
                                                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                                                    return true;
                                                }
                                            }
                                        }
                                        return false;
                                    }, targetColor);
                                    
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                }
                                
                                break;
                            } else {
                                // Jeśli nie ma checkbox, kliknij na element
                                await element.click();
                                console.log(`✅ Selected color (by element click): ${titleText}`);
                                colorSelected = true;
                                
                                // Poczekaj na aktualizację UI
                                await new Promise(resolve => setTimeout(resolve, 1500));
                                
                                // Sprawdź czy kolor pozostał wybrany
                                const isStillSelected = await this.verifyColorSelection(targetColor);
                                if (!isStillSelected) {
                                    console.log('⚠️  Color was deselected, trying JavaScript click...');
                                    
                                    // Użyj JavaScript click jako fallback
                                    await this.page.evaluate((colorText) => {
                                        const colorElements = document.querySelectorAll('li .web_ui__Cell__cell[id^="color-"]');
                                        for (const el of colorElements) {
                                            const titleEl = el.querySelector('.web_ui__Cell__title');
                                            if (titleEl && titleEl.textContent?.trim().toLowerCase() === colorText.toLowerCase()) {
                                                (el as HTMLElement).click();
                                                return true;
                                            }
                                        }
                                        return false;
                                    }, targetColor);
                                    
                                    await new Promise(resolve => setTimeout(resolve, 1000));
                                }
                                
                                break;
                            }
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
                // Zamknij dropdown klikając gdzieś indziej
                console.log('🔄 Closing color dropdown...');
                await this.page.click('body'); // Kliknij w tło
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Sprawdź ponownie czy kolor jest wybrany
                console.log('🔍 Final color verification...');
                const finalCheck = await this.verifyColorSelection(targetColor);
                if (finalCheck) {
                    console.log('✅ Color selection confirmed');
                } else {
                    console.log('⚠️  Color selection may not have persisted');
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
                await this.addPhotos(preparedAd.photos);
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

    async startWithExistingBrowser() {
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
                console.log('⚠️  Nie jesteś zalogowany na Vinted!');
                console.log('📝 Zaloguj się ręcznie w tej przeglądarce...');
                await this.waitForUserInteraction('Czekam na zalogowanie', 60);
            }
            
            // Kliknij przycisk "Sprzedaj"
            await this.clickSellButton();
            
            // Poczekaj na załadowanie formularza
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Pobierz ogłoszenia z bazy danych - tylko nieopublikowane do Vinted
            console.log('📥 Fetching unpublished advertisements from database...');
            const advertisements = await fetchUnpublishedToVintedAdvertisements();
            
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

    async start() {
        try {
            console.log('🚀 Starting Vinted automation...');
            
            // Inicjalizuj przeglądarkę
            await this.init();
            
            // Przejdź na Vinted
            await this.navigateToVinted();
            
            // Uruchom przetwarzanie wszystkich ogłoszeń
            await this.processAllAdvertisements();
            
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

// Funkcja do uruchomienia z istniejącą przeglądarką
export async function runVintedAutomationWithExistingBrowser() {
    const automation = new VintedAutomation();
    
    try {
        await automation.startWithExistingBrowser();
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
