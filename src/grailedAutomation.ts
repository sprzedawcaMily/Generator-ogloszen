import puppeteer, { Browser, Page } from 'puppeteer';
import { fetchAdvertisements, fetchUnpublishedToGrailedAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType } from './supabaseFetcher';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';
import { Logger } from './logger';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Helper function to wait
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    is_published_to_grailed: boolean;
    is_local: boolean;
    created_at: string;
    // Wygenerowane pola
    title?: string;
    description?: string;
    photos?: string[];
}

interface GrailedCategoryMapping {
    department: string;
    category: string;
    subcategory: string;
}

export class GrailedAutomation {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private tempDir = path.join(process.cwd(), 'temp', 'grailed-photos');
    private logger: Logger;

    constructor() {
        this.logger = Logger.getInstance();
    }

    // Wait for photos to be fully loaded and processed
    async waitForPhotosToLoad(expectedPhotoCount: number): Promise<void> {
        if (!this.page) return;
        
        await this.logger.info(`⏳ Waiting for ${expectedPhotoCount} photos to be fully loaded...`);
        
        const maxWaitTime = 60000; // 60 seconds max wait
        const checkInterval = 2000; // Check every 2 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            try {
                // Check for photo upload progress indicators
                const uploadingElements = await this.page.$$('[class*="uploading"], [class*="loading"], .spinner, [class*="progress"]');
                
                // Check for error states
                const errorElements = await this.page.$$('[class*="error"], [class*="failed"]');
                
                // Check for completed photo thumbnails or preview images
                const completedPhotos = await this.page.$$('img[src*="grailed"], .photo-preview, [class*="photo"][class*="complete"]');
                
                if (errorElements.length > 0) {
                    await this.logger.warn(`⚠️ Detected ${errorElements.length} photo upload errors`);
                    break;
                }
                
                if (uploadingElements.length === 0) {
                    await this.logger.info(`✅ No uploading indicators found - photos appear to be processed`);
                    break;
                }
                
                await this.logger.debug(`🔄 Still uploading... Found ${uploadingElements.length} uploading indicators`);
                await delay(checkInterval);
                
            } catch (error) {
                await this.logger.warn('⚠️ Error checking photo upload status:', error);
                break;
            }
        }
        
        // Additional wait to ensure all processing is complete
        await this.logger.info('⏳ Additional 5-second wait to ensure all photos are ready...');
        await delay(5000);
        
        await this.logger.info('✅ Photo loading verification completed');
    }

    // Function to get Grailed category mapping with subcategories
    getGrailedCategoryMapping(rodzaj: string): GrailedCategoryMapping {
        if (!rodzaj) return { department: 'Menswear', category: 'Tops', subcategory: 'Short Sleeve T-Shirts' };
        
        const categoryMap: { [key: string]: GrailedCategoryMapping } = {
            // Tops - T-shirts
            'Koszulki z nadrukiem': { department: 'Menswear', category: 'Tops', subcategory: 'Short Sleeve T-Shirts' },
            'T-shirty gładkie': { department: 'Menswear', category: 'Tops', subcategory: 'Short Sleeve T-Shirts' },
            'T-shirty z nadrukiem': { department: 'Menswear', category: 'Tops', subcategory: 'Short Sleeve T-Shirts' },
            'T-shirty w paski': { department: 'Menswear', category: 'Tops', subcategory: 'Short Sleeve T-Shirts' },
            'Koszulki z długim rękawem': { department: 'Menswear', category: 'Tops', subcategory: 'Long Sleeve T-Shirts' },
            'Podkoszulki': { department: 'Menswear', category: 'Tops', subcategory: 'Tank Tops & Sleeveless' },
            
            // Tops - Shirts
            'Koszule w kratkę': { department: 'Menswear', category: 'Tops', subcategory: 'Shirts (Button Ups)' },
            'Koszule dżinsowe': { department: 'Menswear', category: 'Tops', subcategory: 'Shirts (Button Ups)' },
            'Koszule gładkie': { department: 'Menswear', category: 'Tops', subcategory: 'Shirts (Button Ups)' },
            'Koszule w paski': { department: 'Menswear', category: 'Tops', subcategory: 'Shirts (Button Ups)' },
            
            // Tops - Polo
            'Koszulki polo': { department: 'Menswear', category: 'Tops', subcategory: 'Polos' },
            
            // Tops - Sweatshirts & Hoodies
            'Bluzy': { department: 'Menswear', category: 'Tops', subcategory: 'Sweatshirts & Hoodies' },
            'Swetry i bluzy z kapturem': { department: 'Menswear', category: 'Tops', subcategory: 'Sweatshirts & Hoodies' },
            'Bluzy rozpinane': { department: 'Menswear', category: 'Tops', subcategory: 'Sweatshirts & Hoodies' },
            
            // Tops - Sweaters & Knitwear
            'Kardigany': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            'Swetry z okrągłym dekoltem': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            'Swetry w serek': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            'Swetry z golfem': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            'Długie swetry': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            'Swetry z dzianiny': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            'Kamizelki': { department: 'Menswear', category: 'Tops', subcategory: 'Sweaters & Knitwear' },
            
            // Outerwear
            'kurtka': { department: 'Menswear', category: 'Outerwear', subcategory: 'Light Jackets' },
            
            // Bottoms
            'Spodnie z szerokimi nogawkami': { department: 'Menswear', category: 'Bottoms', subcategory: 'Casual Pants' },
            'Spodnie': { department: 'Menswear', category: 'Bottoms', subcategory: 'Casual Pants' },
            'Jeansy': { department: 'Menswear', category: 'Bottoms', subcategory: 'Jeans' },
            'Spodnie dżinsowe': { department: 'Menswear', category: 'Bottoms', subcategory: 'Jeans' },
            'Spodnie dresowe': { department: 'Menswear', category: 'Bottoms', subcategory: 'Sweatpants & Joggers' },
            'Dresy': { department: 'Menswear', category: 'Bottoms', subcategory: 'Sweatpants & Joggers' },
            'Spodnie sportowe': { department: 'Menswear', category: 'Bottoms', subcategory: 'Sweatpants & Joggers' },
            'Chinosy': { department: 'Menswear', category: 'Bottoms', subcategory: 'Casual Pants' },
            'Spodnie cargo': { department: 'Menswear', category: 'Bottoms', subcategory: 'Casual Pants' },
            'Szorty cargo': { department: 'Menswear', category: 'Bottoms', subcategory: 'Shorts' },
            'Szorty chinosy': { department: 'Menswear', category: 'Bottoms', subcategory: 'Shorts' },
            'Szorty dżinsowe': { department: 'Menswear', category: 'Bottoms', subcategory: 'Shorts' },
            
            // Footwear
            'Mokasyny, buty żeglarskie, loafersy': { department: 'Menswear', category: 'Footwear', subcategory: 'Slip Ons' },
            'Chodaki i mule': { department: 'Menswear', category: 'Footwear', subcategory: 'Slip Ons' },
            'Espadryle': { department: 'Menswear', category: 'Footwear', subcategory: 'Slip Ons' },
            'Klapki i japonki': { department: 'Menswear', category: 'Footwear', subcategory: 'Sandals' },
            'Obuwie wizytowe': { department: 'Menswear', category: 'Footwear', subcategory: 'Formal Shoes' },
            'Sandały': { department: 'Menswear', category: 'Footwear', subcategory: 'Sandals' },
            'Kapcie': { department: 'Menswear', category: 'Footwear', subcategory: 'Slip Ons' },
            'Obuwie sportowe': { department: 'Menswear', category: 'Footwear', subcategory: 'Low-Top Sneakers' },
            'Sneakersy, trampki i tenisówki': { department: 'Menswear', category: 'Footwear', subcategory: 'Low-Top Sneakers' },
            
            // Accessories
            'Chusty i chustki': { department: 'Menswear', category: 'Accessories', subcategory: 'Gloves & Scarves' },
            'Paski': { department: 'Menswear', category: 'Accessories', subcategory: 'Belts' },
            'Szelki': { department: 'Menswear', category: 'Accessories', subcategory: 'Belts' },
            'Rękawiczki': { department: 'Menswear', category: 'Accessories', subcategory: 'Gloves & Scarves' },
            'Chusteczki': { department: 'Menswear', category: 'Accessories', subcategory: 'Ties & Pocketsquares' },
            'Kapelusze i czapki': { department: 'Menswear', category: 'Accessories', subcategory: 'Hats' },
            'Biżuteria': { department: 'Menswear', category: 'Accessories', subcategory: 'Jewelry & Watches' },
            'Poszetki': { department: 'Menswear', category: 'Accessories', subcategory: 'Ties & Pocketsquares' },
            'Szaliki i szale': { department: 'Menswear', category: 'Accessories', subcategory: 'Gloves & Scarves' },
            'Okulary przeciwsłoneczne': { department: 'Menswear', category: 'Accessories', subcategory: 'Sunglasses' },
            'Krawaty i muszki': { department: 'Menswear', category: 'Accessories', subcategory: 'Ties & Pocketsquares' },
            'Zegarki': { department: 'Menswear', category: 'Accessories', subcategory: 'Jewelry & Watches' },
            'Plecaki': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Teczki': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Nerki': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Pokrowce na ubrania': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Torby na siłownię': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Torby podróżne': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Walizki': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Listonoszki': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Torby na ramię': { department: 'Menswear', category: 'Accessories', subcategory: 'Bags & Luggage' },
            'Portfele': { department: 'Menswear', category: 'Accessories', subcategory: 'Wallets' }
        };
        
        return categoryMap[rodzaj] || { department: 'Menswear', category: 'Tops', subcategory: 'Short Sleeve T-Shirts' };
    }

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

    // Navigate to Grailed and start the selling process
    async navigateToGrailed(): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log('🌐 Navigating to Grailed...');
        
        try {
            // Zwiększony timeout i mniej restrykcyjne warunki ładowania
            await this.page.goto('https://www.grailed.com/', { 
                waitUntil: 'domcontentloaded', 
                timeout: 60000 
            });
            console.log('✅ Page loaded successfully');
        } catch (error) {
            console.log('⚠️ Navigation timeout, trying alternative approach...');
            
            // Spróbuj ponownie z jeszcze prostszym warunkiem
            try {
                await this.page.goto('https://www.grailed.com/', { 
                    waitUntil: 'load', 
                    timeout: 30000 
                });
                console.log('✅ Page loaded with alternative approach');
            } catch (secondError) {
                console.log('❌ Could not load Grailed homepage, checking if already on Grailed...');
                
                // Sprawdź czy już jesteśmy na Grailed
                const currentUrl = await this.page.url();
                if (currentUrl.includes('grailed.com')) {
                    console.log('✅ Already on Grailed domain');
                } else {
                    throw new Error(`Cannot navigate to Grailed. Current URL: ${currentUrl}`);
                }
            }
        }
        
        // Poczekaj na załadowanie strony
        console.log('⏳ Waiting for page to stabilize...');
        await delay(3000);
        
        // Sprawdź czy jesteśmy już na stronie sprzedaży
        const currentUrl = await this.page.url();
        console.log(`📍 Current URL: ${currentUrl}`);
        
        if (currentUrl.includes('/sell/new') || currentUrl.includes('/sell')) {
            console.log('✅ Already on sell page');
            return;
        }
        
        // Kliknij przycisk sprzedaży
        console.log('🔍 Looking for sell button...');
        try {
            // Najpierw spróbuj podstawowy selektor
            const sellSelector = 'a[href="/sell/new"], a[href*="/sell"], button:contains("Sell"), a:contains("Sell")';
            await this.page.waitForSelector('a[href="/sell/new"]', { timeout: 10000 });
            await this.page.click('a[href="/sell/new"]');
            console.log('✅ Clicked sell button');
        } catch (error) {
            console.log('❌ Could not find primary sell button, trying alternatives...');
            
            // Próbuj różne selektory
            const alternativeSelectors = [
                'a[data-testid="desktop-sell"]',
                'a[href*="/sell"]',
                'button[data-testid="sell-button"]',
                'nav a:contains("Sell")',
                'header a:contains("Sell")',
                '.sell-button',
                '[data-cy="sell-link"]'
            ];
            
            let buttonFound = false;
            for (const selector of alternativeSelectors) {
                try {
                    console.log(`🔄 Trying selector: ${selector}`);
                    const elements = await this.page.$$(selector);
                    if (elements.length > 0) {
                        await elements[0].click();
                        console.log(`✅ Clicked sell button with selector: ${selector}`);
                        buttonFound = true;
                        break;
                    }
                } catch (selectorError) {
                    console.log(`⚠️ Selector ${selector} failed:`, selectorError);
                }
            }
            
            if (!buttonFound) {
                // Ostatnia próba - znajdź przycisk po tekście
                console.log('🔄 Trying to find sell button by text...');
                try {
                    await this.page.evaluate(() => {
                        const elements = Array.from(document.querySelectorAll('a, button'));
                        const sellElement = elements.find(el => 
                            el.textContent?.toLowerCase().includes('sell') ||
                            el.getAttribute('href')?.includes('/sell')
                        );
                        if (sellElement) {
                            (sellElement as HTMLElement).click();
                            return true;
                        }
                        return false;
                    });
                    console.log('✅ Found and clicked sell button by text');
                    buttonFound = true;
                } catch (textError) {
                    console.log('❌ Could not find sell button by text');
                }
            }
            
            if (!buttonFound) {
                console.log('⚠️ Could not find sell button, trying direct navigation...');
                try {
                    await this.page.goto('https://www.grailed.com/sell/new', { 
                        waitUntil: 'domcontentloaded', 
                        timeout: 30000 
                    });
                    console.log('✅ Navigated directly to sell page');
                } catch (directNavError) {
                    throw new Error('Could not navigate to sell page');
                }
            }
        }
        
        // Poczekaj na nawigację jeśli kliknięto przycisk
        try {
            console.log('⏳ Waiting for navigation to sell page...');
            await this.page.waitForNavigation({ 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });
            console.log('✅ Navigated to sell page');
        } catch (navError) {
            console.log('⚠️ Navigation timeout, checking current page...');
            const finalUrl = await this.page.url();
            console.log(`📍 Final URL: ${finalUrl}`);
            
            if (finalUrl.includes('/sell')) {
                console.log('✅ Successfully on sell page');
            } else {
                console.log('⚠️ Not on sell page, but continuing...');
            }
        }
    }

    // Select department and category on Grailed
    async selectDepartmentAndCategory(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n🎯 ===== CATEGORY MAPPING =====`);
        console.log(`📦 Polish product type: "${ad.rodzaj}"`);
        
        const mapping = this.getGrailedCategoryMapping(ad.rodzaj);
        
        console.log(`🎯 Mapped to Grailed:`);
        console.log(`   🏢 Department: ${mapping.department}`);
        console.log(`   📂 Category: ${mapping.category}`);
        console.log(`   📂 Subcategory: ${mapping.subcategory}`);
        console.log(`=============================\n`);
        
        console.log(`🏷️ Selecting department: ${mapping.department}, category: ${mapping.category}, subcategory: ${mapping.subcategory}`);
        
        // Step 1: Click department/category dropdown button
        try {
            console.log('🎯 Klikam przycisk "Department / Category"...');
            
            // Użyj bardziej uniwersalnych selektorów
            const possibleSelectors = [
                'button[aria-haspopup="menu"]',
                'button:has-text("Department / Category")',
                'button[class*="trigger"]',
                '.DropdownMenu-module__trigger___JEOMM',
                'button[data-state="closed"]'
            ];
            
            let buttonClicked = false;
            
            for (const selector of possibleSelectors) {
                try {
                    console.log(`🔄 Próbuję selektor: ${selector}`);
                    await this.page.waitForSelector(selector, { timeout: 3000 });
                    
                    // Sprawdź czy przycisk zawiera tekst "Department" lub "Category"
                    const buttonText = await this.page.evaluate((sel) => {
                        const button = document.querySelector(sel);
                        return button?.textContent?.toLowerCase() || '';
                    }, selector);
                    
                    if (buttonText.includes('department') || buttonText.includes('category')) {
                        await this.page.click(selector);
                        console.log(`✅ Otworzono dropdown z selektorem: ${selector}`);
                        buttonClicked = true;
                        break;
                    }
                } catch (selectorError) {
                    console.log(`⚠️ Selektor ${selector} nie zadziałał`);
                }
            }
            
            if (!buttonClicked) {
                // Ostatnia próba - znajdź przycisk po tekście
                console.log('🔄 Próbuję znaleźć przycisk po tekście...');
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const dropdownButton = buttons.find(btn => 
                        btn.textContent?.toLowerCase().includes('department') ||
                        btn.textContent?.toLowerCase().includes('category')
                    );
                    
                    if (dropdownButton) {
                        (dropdownButton as HTMLElement).click();
                        return true;
                    }
                    throw new Error('Nie znaleziono przycisku dropdown');
                });
                console.log('✅ Otworzono dropdown po tekście');
            }
        } catch (error) {
            console.log('❌ Nie można znaleźć przycisku Department / Category:', error);
            throw new Error('Nie można znaleźć przycisku Department / Category');
        }
        
        await delay(1000);
        
        // Step 2: Click "Menswear" department
        try {
            console.log('🎯 Klikam "Menswear"...');
            const menswearSelector = 'div[role="menuitem"].DepartmentCategoryField-module__department___rSr6T';
            await this.page.waitForSelector(menswearSelector, { timeout: 5000 });
            
            // Znajdź element zawierający tekst "Menswear"
            await this.page.evaluate(() => {
                const departmentElements = Array.from(document.querySelectorAll('div[role="menuitem"].DepartmentCategoryField-module__department___rSr6T'));
                const menswearEl = departmentElements.find(el => el.textContent?.includes('Menswear'));
                if (menswearEl) {
                    (menswearEl as HTMLElement).click();
                } else {
                    throw new Error('Nie znaleziono elementu Menswear');
                }
            });
            console.log('✅ Wybrano Menswear');
        } catch (error) {
            console.log('❌ Nie mogę znaleźć Menswear, próbuję alternatywnie...');
            await this.page.evaluate(() => {
                const allElements = Array.from(document.querySelectorAll('*'));
                const menswearEl = allElements.find(el => el.textContent?.includes('Menswear'));
                if (menswearEl) {
                    (menswearEl as HTMLElement).click();
                }
            });
        }
        
        await delay(1500);
        
        // Step 3: Select specific category based on product type
        try {
            console.log(`🎯 Wyberam kategorię: ${mapping.category}...`);
            
            // Mapowanie kategorii na odpowiednie selektory
            const categorySelectors: { [key: string]: string } = {
                'Tops': 'div[role="menuitem"] svg + text(), "Tops"',
                'Bottoms': 'div[role="menuitem"] svg + text(), "Bottoms"', 
                'Outerwear': 'div[role="menuitem"] svg + text(), "Outerwear"',
                'Footwear': 'div[role="menuitem"] svg + text(), "Footwear"',
                'Tailoring': 'div[role="menuitem"] svg + text(), "Tailoring"',
                'Accessories': 'div[role="menuitem"] svg + text(), "Accessories"'
            };
            
            // Użyj bardziej ogólnego podejścia - znajdź element z odpowiednim tekstem
            await this.page.evaluate((category) => {
                // Szukaj elementów z rolą menuitem i odpowiednim tekstem
                const menuItems = Array.from(document.querySelectorAll('div[role="menuitem"].DepartmentCategoryField-module__item___Dv4iA'));
                console.log(`Znaleziono ${menuItems.length} elementów menu kategorii`);
                
                const categoryEl = menuItems.find(el => {
                    const textContent = el.textContent || '';
                    return textContent.includes(category);
                });
                
                if (categoryEl) {
                    console.log(`Znaleziono kategorię: ${category}`);
                    (categoryEl as HTMLElement).click();
                    return true;
                } else {
                    console.log(`Nie znaleziono kategorii: ${category}`);
                    // Spróbuj z wszystkimi elementami
                    const allElements = Array.from(document.querySelectorAll('*'));
                    const fallbackEl = allElements.find(el => el.textContent?.includes(category));
                    if (fallbackEl) {
                        (fallbackEl as HTMLElement).click();
                        return true;
                    }
                    return false;
                }
            }, mapping.category);
            
            console.log(`✅ Wybrano kategorię: ${mapping.category}`);
        } catch (error) {
            console.log(`❌ Nie mogę wybrać kategorii ${mapping.category}:`, error);
            throw new Error(`Nie można wybrać kategorii: ${mapping.category}`);
        }

        await delay(1500);

        // Step 4: Now select subcategory
        try {
            console.log(`🎯 Klikam przycisk "Sub-category"...`);
            
            // Selectors for subcategory dropdown
            const subcategorySelectors = [
                'button[id*=":rl:"]',
                'button[aria-haspopup="menu"]:has-text("Sub-category")',
                'button .DropdownMenu-module__placeholder___fgWvm:has-text("Sub-category")',
                'button:has(.DropdownMenu-module__placeholder___fgWvm)'
            ];
            
            let subcategoryButtonClicked = false;
            
            for (const selector of subcategorySelectors) {
                try {
                    console.log(`🔄 Próbuję selektor subcategory: ${selector}`);
                    const elements = await this.page.$$(selector);
                    
                    for (const element of elements) {
                        const text = await this.page.evaluate(el => el.textContent?.toLowerCase() || '', element);
                        if (text.includes('sub-category')) {
                            await element.click();
                            console.log(`✅ Otworzono dropdown subcategory z selektorem: ${selector}`);
                            subcategoryButtonClicked = true;
                            break;
                        }
                    }
                    
                    if (subcategoryButtonClicked) break;
                    
                } catch (selectorError) {
                    console.log(`⚠️ Selektor subcategory ${selector} nie zadziałał`);
                }
            }
            
            if (!subcategoryButtonClicked) {
                console.log('⚠️ Nie znaleziono przycisku Sub-category, próbuję alternatywnej metody...');
                
                // Alternative method - find button by placeholder text
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const subcategoryButton = buttons.find(btn => 
                        btn.textContent?.includes('Sub-category') || 
                        btn.querySelector('.DropdownMenu-module__placeholder___fgWvm')?.textContent?.includes('Sub-category')
                    );
                    if (subcategoryButton) {
                        subcategoryButton.click();
                        return true;
                    }
                    return false;
                });
                
                console.log('✅ Otworzono dropdown subcategory metodą alternatywną');
            }
            
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Nie można znaleźć przycisku Sub-category:', error);
            throw new Error('Nie można znaleźć przycisku Sub-category');
        }

        // Step 5: Select the subcategory
        try {
            console.log(`🎯 Wyberam podkategorię: ${mapping.subcategory}...`);
            
            await this.page.evaluate((subcategoryName) => {
                const subcategoryElements = Array.from(document.querySelectorAll('div[role="menuitem"].DropdownMenu-module__item___wOBLg'));
                const subcategoryEl = subcategoryElements.find(el => 
                    el.textContent?.trim() === subcategoryName
                );
                if (subcategoryEl) {
                    (subcategoryEl as HTMLElement).click();
                } else {
                    throw new Error(`Nie znaleziono podkategorii: ${subcategoryName}`);
                }
            }, mapping.subcategory);
            
            console.log(`✅ Wybrano podkategorię: ${mapping.subcategory}`);
            await delay(2000);
            
        } catch (error) {
            console.log(`❌ Nie mogę wybrać podkategorii ${mapping.subcategory}:`, error);
            throw new Error(`Nie można wybrać podkategorii: ${mapping.subcategory}`);
        }
        
        await delay(2000);
        console.log('✅ Ukończono wybór kategorii i podkategorii');
    }

    // Fill brand/designer field
    async fillBrand(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n🏢 ===== FILLING BRAND =====`);
        console.log(`👔 Brand to fill: "${ad.marka}"`);
        console.log(`============================\n`);
        
        try {
            console.log('🎯 Klikam pole marki...');
            
            // Click on the designer input field
            const designerInput = '#designer-autocomplete';
            await this.page.waitForSelector(designerInput, { timeout: 5000 });
            await this.page.click(designerInput);
            
            console.log('✅ Kliknięto pole marki');
            await delay(500);
            
            // Clear any existing text and type the brand
            await this.page.evaluate((selector) => {
                const input = document.querySelector(selector) as HTMLInputElement;
                if (input) {
                    input.value = '';
                }
            }, designerInput);
            
            console.log(`🎯 Wpisuję markę: ${ad.marka}...`);
            await this.page.type(designerInput, ad.marka);
            
            console.log('✅ Wpisano markę');
            await delay(1500); // Wait for dropdown to appear
            
            // Debug: Check what elements appeared after typing
            console.log('🔍 Sprawdzam dostępne elementy dropdown po wpisaniu marki...');
            const availableElements = await this.page.evaluate(() => {
                const elements: Array<{
                    selector: string;
                    index: number;
                    text: string;
                    className: string;
                    tagName: string;
                }> = [];
                // Szukaj wszystkich elementów, które mogą być opcjami dropdown
                const selectors = [
                    '.DesignersAndCollabs-module__option___jvM4j',
                    '[role="option"]',
                    '.autocomplete-option', 
                    '.dropdown-option',
                    '[class*="option"]',
                    '[class*="dropdown"]',
                    '.DesignersAndCollabs-module__dropdown___9ZjFr *'
                ];
                
                selectors.forEach(selector => {
                    try {
                        const found = document.querySelectorAll(selector);
                        found.forEach((el, i) => {
                            elements.push({
                                selector: selector,
                                index: i,
                                text: el.textContent?.trim() || '',
                                className: el.className,
                                tagName: el.tagName
                            });
                        });
                    } catch (e) {
                        // Ignore selector errors
                    }
                });
                
                return elements.slice(0, 10); // Limit to first 10 results
            });
            
            console.log('📋 Znalezione elementy dropdown:');
            availableElements.forEach((el, i) => {
                console.log(`   ${i+1}. [${el.tagName}] "${el.text}" (selector: ${el.selector}, class: ${el.className})`);
            });

            // Click the first option from dropdown
            try {
                console.log('🎯 Klikam pierwszą opcję z dropdown...');                // Wait for dropdown options to appear
                const dropdownOptions = [
                    'li[role="menuitem"].DesignersAndCollabs-module__option___WtIFa',
                    '.DesignersAndCollabs-module__option___jvM4j',
                    '[role="option"]',
                    '.autocomplete-option',
                    '.dropdown-option',
                    '.DesignersAndCollabs-module__dropdown___9ZjFr .DesignersAndCollabs-module__option___jvM4j',
                    '[class*="DesignersAndCollabs-module__option"]',
                    '.DesignersAndCollabs-module__dropdown___9ZjFr [role="option"]'
                ];
                
                let optionClicked = false;
                
                for (const selector of dropdownOptions) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        
                        // Sprawdź czy element jest widoczny i kliknięty
                        const elementText = await this.page.$eval(selector, el => el.textContent?.trim() || '');
                        console.log(`🎯 Próbuję kliknąć opcję: "${elementText}" z selektorem: ${selector}`);
                        
                        await this.page.click(selector);
                        console.log(`✅ Wybrano markę z selektorem: ${selector} - "${elementText}"`);
                        optionClicked = true;
                        break;
                    } catch (selectorError) {
                        console.log(`⚠️ Selektor ${selector} nie zadziałał`);
                    }
                }
                
                if (!optionClicked) {
                    // Alternative method - press Enter to select first option
                    console.log('🔄 Próbuję alternatywną metodę - Enter...');
                    await this.page.keyboard.press('ArrowDown');
                    await delay(200);
                    await this.page.keyboard.press('Enter');
                    console.log('✅ Wybrano markę przez Enter');
                }
                
            } catch (dropdownError) {
                console.log('⚠️ Nie można wybrać opcji z dropdown, kontynuuję...');
            }
            
            await delay(1000);
            console.log('✅ Ukończono wypełnianie marki');
            
        } catch (error) {
            console.log('❌ Błąd podczas wypełniania marki:', error);
            throw new Error('Nie można wypełnić marki');
        }
    }

    // Select size
    async selectSize(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n📏 ===== SELECTING SIZE =====`);
        console.log(`📐 Size to select: "${ad.rozmiar}"`);
        console.log(`============================\n`);
        
        try {
            console.log('🎯 Klikam przycisk "Select Size"...');
            
            // Click the size dropdown button
            const sizeSelectors = [
                'button[id="radix-:rn:"]',
                'button:has(.DropdownMenu-module__placeholder___fgWvm)',
                'button[aria-haspopup="menu"]:has-text("Select Size")'
            ];
            
            let sizeButtonClicked = false;
            
            for (const selector of sizeSelectors) {
                try {
                    console.log(`🔄 Próbuję selektor size: ${selector}`);
                    const elements = await this.page.$$(selector);
                    
                    for (const element of elements) {
                        const text = await this.page.evaluate(el => el.textContent?.toLowerCase() || '', element);
                        if (text.includes('select size') || text.includes('size')) {
                            await element.click();
                            console.log(`✅ Otworzono dropdown size z selektorem: ${selector}`);
                            sizeButtonClicked = true;
                            break;
                        }
                    }
                    
                    if (sizeButtonClicked) break;
                    
                } catch (selectorError) {
                    console.log(`⚠️ Selektor size ${selector} nie zadziałał`);
                }
            }
            
            if (!sizeButtonClicked) {
                console.log('⚠️ Nie znaleziono przycisku Select Size, próbuję alternatywnej metody...');
                
                // Alternative method - find button by placeholder text
                await this.page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const sizeButton = buttons.find(btn => 
                        btn.textContent?.includes('Select Size') || 
                        btn.querySelector('.DropdownMenu-module__placeholder___fgWvm')?.textContent?.includes('Select Size')
                    );
                    if (sizeButton) {
                        sizeButton.click();
                        return true;
                    }
                    return false;
                });
                
                console.log('✅ Otworzono dropdown size metodą alternatywną');
            }
            
            await delay(1000);
            
            // Get product category to determine size mapping
            const productMapping = this.getGrailedCategoryMapping(ad.rodzaj);
            const isBottoms = productMapping?.category === 'Bottoms';
            const isAccessories = productMapping?.category === 'Accessories';
            const isFootwear = productMapping?.category === 'Footwear';
            
            // Map Polish sizes to Grailed sizes based on category
            let sizeMapping: { [key: string]: string } = {};
            
            if (isFootwear) {
                // Footwear size mapping - US to EU conversion based on Grailed format
                sizeMapping = {
                    // EU sizes (common in Poland)
                    '37': 'US 5 / EU 37',
                    '38': 'US 5.5 / EU 38',
                    '39': 'US 6 / EU 39',
                    '39-40': 'US 6.5 / EU 39-40',
                    '40': 'US 7 / EU 40',
                    '40-41': 'US 7.5 / EU 40-41',
                    '41': 'US 8 / EU 41',
                    '41-42': 'US 8.5 / EU 41-42',
                    '42': 'US 9 / EU 42',
                    '42-43': 'US 9.5 / EU 42-43',
                    '43': 'US 10 / EU 43',
                    '43-44': 'US 10.5 / EU 43-44',
                    '44': 'US 11 / EU 44',
                    '44-45': 'US 11.5 / EU 44-45',
                    '45': 'US 12 / EU 45',
                    '45-46': 'US 12.5 / EU 45-46',
                    '46': 'US 13 / EU 46',
                    '47': 'US 14 / EU 47',
                    '48': 'US 15 / EU 48',
                    // US sizes (if already in US format)
                    '5': 'US 5 / EU 37',
                    '5.5': 'US 5.5 / EU 38',
                    '6': 'US 6 / EU 39',
                    '6.5': 'US 6.5 / EU 39-40',
                    '7': 'US 7 / EU 40',
                    '7.5': 'US 7.5 / EU 40-41',
                    '8': 'US 8 / EU 41',
                    '8.5': 'US 8.5 / EU 41-42',
                    '9': 'US 9 / EU 42',
                    '9.5': 'US 9.5 / EU 42-43',
                    '10': 'US 10 / EU 43',
                    '10.5': 'US 10.5 / EU 43-44',
                    '11': 'US 11 / EU 44',
                    '11.5': 'US 11.5 / EU 44-45',
                    '12': 'US 12 / EU 45',
                    '12.5': 'US 12.5 / EU 45-46',
                    '13': 'US 13 / EU 46',
                    '14': 'US 14 / EU 47',
                    '15': 'US 15 / EU 48',
                    // Letter sizes for some footwear (e.g., flip-flops)
                    'XS': 'US 5 / EU 37',
                    'S': 'US 7 / EU 40',
                    'M': 'US 9 / EU 42',
                    'L': 'US 11 / EU 44',
                    'XL': 'US 13 / EU 46',
                    'XXL': 'US 15 / EU 48'
                };
            } else if (isAccessories) {
                // Accessories size mapping - mostly One Size
                sizeMapping = {
                    'uniwersalny': 'One Size',
                    'Uniwersalny': 'One Size',
                    'UNIWERSALNY': 'One Size',
                    'One Size': 'One Size',
                    'onesize': 'One Size',
                    'OS': 'One Size',
                    'U': 'One Size',
                    // Some accessories may have letter sizes
                    'XS': 'XS',
                    'S': 'S',
                    'M': 'M',
                    'L': 'L',
                    'XL': 'XL',
                    'XXL': 'XXL'
                };
            } else if (isBottoms) {
                // Pants/Bottoms size mapping
                sizeMapping = {
                    '26': 'US 26 / EU 42',
                    '27': 'US 27',
                    '28': 'US 28 / EU 44',
                    '29': 'US 29',
                    '30': 'US 30 / EU 46',
                    '31': 'US 31',
                    '32': 'US 32 / EU 48',
                    '33': 'US 33',
                    '34': 'US 34 / EU 50',
                    '35': 'US 35',
                    '36': 'US 36 / EU 52',
                    '37': 'US 37',
                    '38': 'US 38 / EU 54',
                    '39': 'US 39',
                    '40': 'US 40 / EU 56',
                    '41': 'US 41',
                    '42': 'US 42 / EU 58',
                    '43': 'US 43',
                    '44': 'US 44 / EU 60',
                    // Waist size mappings (W prefixed)
                    'W26': 'US 26',
                    'W27': 'US 27',
                    'W28': 'US 28',
                    'W29': 'US 29',
                    'W30': 'US 30',
                    'W31': 'US 31',
                    'W32': 'US 32',
                    'W33': 'US 33',
                    'W34': 'US 34',
                    'W35': 'US 35',
                    'W36': 'US 36',
                    'W37': 'US 37',
                    'W38': 'US 38',
                    'W39': 'US 39',
                    'W40': 'US 40',
                    'W41': 'US 41',
                    'W42': 'US 42',
                    'W43': 'US 43',
                    'W44': 'US 44',
                    // Alternative mappings for letter sizes in bottoms
                    'XS': 'US 26 / EU 42',
                    'S': 'US 28 / EU 44',
                    'M': 'US 32 / EU 48',
                    'L': 'US 36 / EU 52',
                    'XL': 'US 40 / EU 56',
                    'XXL': 'US 44 / EU 60'
                };
            } else {
                // Tops/General size mapping
                sizeMapping = {
                    'XS': 'US XS / EU 42 / 0',
                    'S': 'US S / EU 44-46 / 1',
                    'M': 'US M / EU 48-50 / 2',
                    'L': 'US L / EU 52-54 / 3',
                    'XL': 'US XL / EU 56 / 4',
                    'XXL': 'US XXL / EU 58 / 5',
                    'XXS': 'US XXS / EU 40'
                };
            }
            
            // Parse size format: handle formats like "50|W33" where we want the W33 part
            let sizeToMap = ad.rozmiar;
            if (ad.rozmiar && ad.rozmiar.includes('|')) {
                const sizeParts = ad.rozmiar.split('|');
                // Look for part with W prefix (waist size) or use the second part
                const waistPart = sizeParts.find(part => part.trim().startsWith('W'));
                if (waistPart) {
                    sizeToMap = waistPart.trim();
                    console.log(`🎯 Extracted waist size from "${ad.rozmiar}": ${sizeToMap}`);
                } else if (sizeParts.length > 1) {
                    sizeToMap = sizeParts[1].trim();
                    console.log(`🎯 Using second part from "${ad.rozmiar}": ${sizeToMap}`);
                }
            }
            
            // Get mapped size or fallback to One Size for accessories, original size for others
            let grailedSize = sizeMapping[sizeToMap];
            if (!grailedSize) {
                if (isAccessories) {
                    grailedSize = 'One Size'; // Default fallback for accessories
                    console.log(`🎯 Rozmiar "${sizeToMap}" nie znaleziony dla akcesoriów, używam: One Size`);
                } else {
                    grailedSize = sizeToMap; // Keep processed size for other categories
                }
            }
            
            const categoryType = isFootwear ? 'Footwear' : (isAccessories ? 'Accessories' : (isBottoms ? 'Bottoms' : 'Tops'));
            console.log(`🎯 Mapowanie rozmiaru (${categoryType}): ${ad.rozmiar} -> ${sizeToMap} -> ${grailedSize}`);
            
            // Select the size from dropdown
            try {
                console.log(`🎯 Wyberam rozmiar: ${grailedSize}...`);
                
                await this.page.evaluate((targetSize) => {
                    const sizeElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                    const sizeEl = sizeElements.find(el => 
                        el.textContent?.toLowerCase().includes(targetSize.toLowerCase())
                    );
                    if (sizeEl) {
                        (sizeEl as HTMLElement).click();
                    } else {
                        throw new Error(`Nie znaleziono rozmiaru: ${targetSize}`);
                    }
                }, grailedSize);
                
                console.log(`✅ Wybrano rozmiar: ${grailedSize}`);
                await delay(1500);
                
            } catch (error) {
                console.log(`❌ Nie mogę wybrać rozmiaru ${grailedSize}:`, error);
                
                // Try to select by partial match first
                console.log('🔄 Próbuję wybór przez częściowe dopasowanie...');
                const partialSuccess = await this.page.evaluate((originalSize, processedSize, isAccessoriesCategory) => {
                    const sizeElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                    
                    // First try processed size (case-insensitive)
                    let sizeEl = sizeElements.find(el => 
                        el.textContent?.toLowerCase().includes(processedSize.toLowerCase())
                    );
                    
                    if (sizeEl) {
                        (sizeEl as HTMLElement).click();
                        return true;
                    }
                    
                    // Then try original size (case-insensitive)
                    sizeEl = sizeElements.find(el => 
                        el.textContent?.toLowerCase().includes(originalSize.toLowerCase())
                    );
                    
                    if (sizeEl) {
                        (sizeEl as HTMLElement).click();
                        return true;
                    }
                    
                    // For accessories, try to find "One Size" (case-insensitive)
                    if (isAccessoriesCategory) {
                        const oneSizeEl = sizeElements.find(el => {
                            const text = el.textContent?.toLowerCase() || '';
                            return text.includes('one size') || 
                                   text.includes('os') ||
                                   text.includes('one') ||
                                   text.includes('universal') ||
                                   text === 'one size';
                        });
                        if (oneSizeEl) {
                            (oneSizeEl as HTMLElement).click();
                            console.log('Selected One Size for accessories');
                            return true;
                        }
                    }
                    
                    // If no match, select the middle option (M) for non-accessories
                    if (!isAccessoriesCategory) {
                        const middleOption = sizeElements.find(el => {
                            const text = el.textContent?.toLowerCase() || '';
                            return text.includes('us m / eu 48-50 / 2') ||
                                   text.includes('m');
                        });
                        if (middleOption) {
                            (middleOption as HTMLElement).click();
                            return true;
                        }
                    }
                    
                    return false;
                }, ad.rozmiar, sizeToMap, isAccessories);
                
                if (partialSuccess) {
                    console.log('✅ Wybrano rozmiar (fallback)');
                } else {
                    console.log('⚠️ Nie udało się wybrać żadnego rozmiaru');
                }
            }
            
            await delay(1000);
            console.log('✅ Ukończono wybór rozmiaru');
            
        } catch (error) {
            console.log('❌ Błąd podczas wyboru rozmiaru:', error);
            throw new Error('Nie można wybrać rozmiaru');
        }
    }

    // Fill title field
    async fillTitle(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n📝 ===== FILLING TITLE =====`);
        console.log(`📋 Title to fill: Creating from product type and brand`);
        console.log(`============================\n`);
        
        try {
            // Create title from product type translated to English + brand
            const productTypeTranslations: { [key: string]: string } = {
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
            
            // Create title: Brand + Product Type + Size (if available)
            let title = `${brand} ${englishProductType}`;
            if (size) {
                title += ` size ${size}`;
            }
            
            console.log(`🎯 Generated title: "${title}"`);
            
            // Find and fill the title input field
            const titleInput = 'input[name="title"]';
            await this.page.waitForSelector(titleInput, { timeout: 5000 });
            
            // Clear existing content and type new title
            await this.page.click(titleInput);
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type(titleInput, title);
            
            console.log('✅ Title filled successfully');
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error filling title:', error);
            throw new Error('Failed to fill title');
        }
    }

    // Select color
    async selectColor(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n🎨 ===== SELECTING COLOR =====`);
        console.log(`🌈 Color to select: "${ad.color || 'Auto-select from database'}"`);
        console.log(`============================\n`);
        
        try {
            // Click the color dropdown button
            console.log('🎯 Clicking color dropdown button...');
            const colorButton = 'button[id="radix-:rp:"]';
            await this.page.waitForSelector(colorButton, { timeout: 5000 });
            await this.page.click(colorButton);
            
            console.log('✅ Color dropdown opened');
            await delay(1000);
            
            // Get color from database if not specified
            let targetColor = ad.color;
            
            // Map Polish colors to English Grailed colors
            const colorMapping: { [key: string]: string } = {
                // Basic colors from Supabase
                'Czarny': 'Black',
                'Brązowy': 'Brown',
                'Szary': 'Gray',
                'Beżowy': 'Beige',
                'Różowy': 'Pink',
                'Fioletowy': 'Purple',
                'Czerwony': 'Red',
                'Żółty': 'Yellow',
                'Niebieski': 'Blue',
                'Zielony': 'Green',
                'Pomarańczowy': 'Orange',
                'Biały': 'White',
                'Srebrny': 'Silver',
                'Złoty': 'Gold',
                'Wielobarwny': 'Multi',
                'Khaki': 'Green', // Map to closest available
                'Turkus': 'Blue', // Map to closest available
                'Kremowy': 'Beige',
                'Morelowy': 'Orange', // Map to closest available
                'Koralowy': 'Pink', // Map to closest available
                'Burgundowy': 'Red', // Map to closest available
                'Pudrowy róż': 'Pink',
                'Liliowy': 'Purple',
                'Jasnoniebieski': 'Blue',
                'Granatowy': 'Blue',
                'Ciemnozielony': 'Green',
                'Musztardowy': 'Yellow',
                'Miętowy': 'Green',
                'Przezroczysty': 'Multi', // Map to Multi as closest
                
                // Legacy lowercase variants
                'czarny': 'Black',
                'brązowy': 'Brown',
                'szary': 'Gray',
                'beżowy': 'Beige',
                'różowy': 'Pink',
                'fioletowy': 'Purple',
                'czerwony': 'Red',
                'żółty': 'Yellow',
                'niebieski': 'Blue',
                'zielony': 'Green',
                'pomarańczowy': 'Orange',
                'biały': 'White',
                'srebrny': 'Silver',
                'złoty': 'Gold',
                'wielobarwny': 'Multi',
                'khaki': 'Green',
                'turkus': 'Blue',
                'kremowy': 'Beige',
                'morelowy': 'Orange',
                'koralowy': 'Pink',
                'burgundowy': 'Red',
                'pudrowy róż': 'Pink',
                'liliowy': 'Purple',
                'jasnoniebieski': 'Blue',
                'granatowy': 'Blue',
                'ciemnozielony': 'Green',
                'musztardowy': 'Yellow',
                'miętowy': 'Green',
                'przezroczysty': 'Multi',
                
                // Common variations
                'wielokolorowy': 'Multi',
                'mix': 'Multi'
            };
            
            // Apply color mapping if available
            if (targetColor && colorMapping[targetColor]) {
                const originalColor = targetColor;
                targetColor = colorMapping[targetColor];
                console.log(`🎨 Color mapping: ${originalColor} -> ${targetColor}`);
            }
            
            if (!targetColor) {
                console.log('🔍 No color specified, getting from database...');
                targetColor = 'Black'; // Default to black if no color specified
            }
            
            console.log(`🎯 Target color: ${targetColor}`);
            
            // Try to find and click the matching color
            const colorClicked = await this.page.evaluate((color) => {
                const colorElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                const colorEl = colorElements.find(el => 
                    el.textContent?.toLowerCase().includes(color.toLowerCase())
                );
                if (colorEl) {
                    (colorEl as HTMLElement).click();
                    return true;
                }
                return false;
            }, targetColor);
            
            if (colorClicked) {
                console.log(`✅ Selected color: ${targetColor}`);
            } else {
                console.log(`⚠️ Color ${targetColor} not found, selecting first available color...`);
                // Fallback: select first color option
                await this.page.evaluate(() => {
                    const firstColor = document.querySelector('div[role="menuitem"]');
                    if (firstColor) {
                        (firstColor as HTMLElement).click();
                    }
                });
                console.log('✅ Selected first available color');
            }
            
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error selecting color:', error);
            throw new Error('Failed to select color');
        }
    }

    // Select condition
    async selectCondition(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n🏷️ ===== SELECTING CONDITION =====`);
        console.log(`📋 Item condition: "${ad.stan}"`);
        console.log(`============================\n`);
        
        try {
            // Click the condition dropdown button
            console.log('🎯 Clicking condition dropdown button...');
            const conditionButton = 'button[id="radix-:rr:"]';
            
            await this.page.waitForSelector(conditionButton, { timeout: 5000 });
            console.log('🔍 Found condition button');
            
            await this.page.click(conditionButton);
            console.log('✅ Condition dropdown opened');
            
            await delay(1000);
            
            // Map Polish conditions to Grailed conditions
            const conditionMapping: { [key: string]: string } = {
                'nowy z metką': 'New/Never Worn',
                'nowy bez metki': 'New/Never Worn', 
                'bardzo dobry': 'Gently Used',
                'dobry': 'Used',
                'zadowalający': 'Very Worn'
            };
            
            const grailedCondition = conditionMapping[ad.stan?.toLowerCase()] || 'Used';
            console.log(`🎯 Mapping condition: "${ad.stan}" -> "${grailedCondition}"`);
            
            // Find and click the matching condition
            const conditionClicked = await this.page.evaluate((condition) => {
                console.log(`🔍 Looking for condition: "${condition}"`);
                const conditionElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                console.log(`🔍 Found ${conditionElements.length} condition options`);
                
                for (let i = 0; i < conditionElements.length; i++) {
                    const el = conditionElements[i];
                    const text = el.textContent?.trim();
                    console.log(`   ${i + 1}. "${text}"`);
                }
                
                const conditionEl = conditionElements.find(el => 
                    el.textContent?.includes(condition)
                );
                if (conditionEl) {
                    console.log(`✅ Found matching condition: "${conditionEl.textContent}"`);
                    (conditionEl as HTMLElement).click();
                    return true;
                }
                console.log(`❌ Condition "${condition}" not found`);
                return false;
            }, grailedCondition);
            
            if (conditionClicked) {
                console.log(`✅ Selected condition: ${grailedCondition}`);
            } else {
                console.log(`⚠️ Condition ${grailedCondition} not found, selecting "Used" as fallback...`);
                // Fallback: select "Used"
                const fallbackClicked = await this.page.evaluate(() => {
                    console.log('🔍 Looking for "Used" fallback...');
                    const conditionElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                    const usedCondition = conditionElements.find(el => 
                        el.textContent?.includes('Used') && !el.textContent?.includes('Gently') && !el.textContent?.includes('Very')
                    );
                    if (usedCondition) {
                        console.log(`✅ Found "Used" fallback: "${usedCondition.textContent}"`);
                        (usedCondition as HTMLElement).click();
                        return true;
                    }
                    console.log('❌ "Used" fallback not found');
                    return false;
                });
                
                if (fallbackClicked) {
                    console.log('✅ Selected "Used" condition as fallback');
                } else {
                    console.log('❌ Could not select any condition');
                }
            }
            
            await delay(1000);
            console.log('✅ Condition selection completed');
            
        } catch (error) {
            console.log('❌ Error selecting condition:', error);
            console.log('⚠️ Continuing without condition selection...');
        }
    }

    // Fill description field
    // Generate description using the same logic as Vinted automation
    async generateDescription(ad: Advertisement): Promise<string> {
        let description = '';
        
        try {
            // Fetch styles and description headers
            const [styles, descriptionHeaders, specificStyle] = await Promise.all([
                fetchStyles(),
                // Use platform-specific headers for Grailed
                fetchDescriptionHeaders('grailed'),
                fetchStyleByType(ad.typ)
            ]);
            
            const styleToUse = specificStyle || (styles && styles.length > 0 ? styles[0] : null);
            
            // Add header from description_headers table (Instagram invitation)
            if (descriptionHeaders && descriptionHeaders.length > 0) {
                const header = descriptionHeaders[0];
                if (header.title) {
                    description += `${header.title}\n\n`;
                }
            }
            
            // Product title with stars: use same English title generation as fillTitle()
            const productTypeTranslations: { [key: string]: string } = {
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
            let englishTitle = `${brand} ${englishProductType}`;
            if (size) englishTitle += ` size ${size}`;

            description += '🌟 ' + englishTitle + ' 🌟\n\n';
            
            // Condition with emoji
            description += '📌 **Condition:** ';
            if (ad.stan) {
                // Translate Polish condition to English
                const conditionMap: { [key: string]: string } = {
                    'nowy z metką': 'New with tags',
                    'nowy bez metki': 'New without tags',
                    'bardzo dobry': 'Very good',
                    'dobry': 'Good',
                    'zadowalający': 'Satisfactory'
                };
                
                const englishCondition = conditionMap[ad.stan.toLowerCase()] || ad.stan;
                description += englishCondition;
                
                if (ad.wada && ad.wada.trim() !== '') {
                    description += ` / ${ad.wada}`;
                } else {
                    description += ' / No flaws';
                }
            } else {
                description += 'No flaws';
            }
            description += '\n';
            
            // Size with emoji
            if (ad.rozmiar) {
                description += `� **Size:** ${ad.rozmiar}\n`;
            }
            
            // Color with emoji
            if (ad.color) {
                description += `🎨 **Color:** ${ad.color}\n`;
            }
            
            // Measurements with emoji - only if we have measurements
            const hasMeasurements = ad.pas || ad.dlugosc || ad.szerokosc || ad.udo || ad.dlugosc_nogawki;
            if (hasMeasurements) {
                description += '📐 **Measurements:**\n';
                if (ad.pas) {
                    description += `Waist ${ad.pas} cm\n`;
                }
                if (ad.dlugosc) {
                    description += `Length ${ad.dlugosc} cm\n`;
                }
                if (ad.szerokosc) {
                    description += `Width ${ad.szerokosc} cm\n`;
                }
                if (ad.udo) {
                    description += `Thigh ${ad.udo} cm\n`;
                }
                if (ad.dlugosc_nogawki) {
                    description += `Inseam ${ad.dlugosc_nogawki} cm\n`;
                }
            }
            
            description += '\n';
            
            // Add footer from style_templates based on product type
            if (styleToUse && styleToUse.footer_text) {
                description += `${styleToUse.footer_text}`;
            }
            
        } catch (error) {
            console.error('Error generating description:', error);
            // Fallback to simpler description
            description = this.generateSimpleDescription(ad);
        }
        
        return description;
    }

    // Simple description as fallback
    generateSimpleDescription(ad: Advertisement): string {
        const parts = [];
        
        if (ad.marka) parts.push(`Brand: ${ad.marka}`);
        if (ad.rodzaj) parts.push(`Type: ${ad.rodzaj}`);
        if (ad.typ && ad.typ !== ad.marka) parts.push(`Category: ${ad.typ}`);
        if (ad.rozmiar) parts.push(`Size: ${ad.rozmiar}`);
        if (ad.stan) parts.push(`Condition: ${ad.stan}`);
        
        // Measurements (if available)
        const dimensions = [];
        if (ad.dlugosc) dimensions.push(`length ${ad.dlugosc}cm`);
        if (ad.szerokosc) dimensions.push(`width ${ad.szerokosc}cm`);
        if (ad.pas) dimensions.push(`waist ${ad.pas}cm`);
        if (ad.udo) dimensions.push(`thigh ${ad.udo}cm`);
        if (ad.dlugosc_nogawki) dimensions.push(`inseam ${ad.dlugosc_nogawki}cm`);
        
        if (dimensions.length > 0) {
            parts.push(`Measurements: ${dimensions.join(', ')}`);
        }
        
        parts.push('');
        parts.push('Item in very good condition, accurately described and photographed.');
        parts.push('Feel free to purchase! 😊');
        
        return parts.join('\n');
    }

    async fillDescription(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n📝 ===== FILLING DESCRIPTION =====`);
        console.log(`📋 Generating Vinted-style description from database data`);
        console.log(`============================\n`);
        
        try {
            // Generate description using the same logic as Vinted automation
            const description = await this.generateDescription(ad);
            
            console.log(`🎯 Generated Vinted-style description:\n${description.substring(0, 500)}...`);
            
            // Find and fill the description textarea
            const descriptionTextarea = 'textarea[name="description"]';
            await this.page.waitForSelector(descriptionTextarea, { timeout: 5000 });
            
            // Clear existing content and type new description
            await this.page.click(descriptionTextarea);
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type(descriptionTextarea, description);
            
            console.log('✅ Vinted-style description filled successfully');
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error filling description:', error);
            
            // Fallback: simple description
            try {
                const brand = ad.marka || 'Brand';
                const productType = ad.rodzaj || 'item';
                const size = ad.rozmiar || '';
                const condition = ad.stan || 'good condition';
                
                const fallbackDescription = `🌟 ${brand} ${productType} ${size} 🌟\n\n📌 **Stan:** ${condition}\n📏 **Rozmiar:** ${size}\n\nFast and secure shipping. Feel free to ask any questions!`;
                
                const descriptionTextarea = 'textarea[name="description"]';
                await this.page.waitForSelector(descriptionTextarea, { timeout: 5000 });
                await this.page.click(descriptionTextarea);
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('a');
                await this.page.keyboard.up('Control');
                await this.page.type(descriptionTextarea, fallbackDescription);
                
                console.log('✅ Fallback description filled');
            } catch (fallbackError) {
                console.log('❌ Failed to fill even fallback description:', fallbackError);
                throw new Error('Failed to fill description');
            }
        }
    }

    // Select style
    async selectStyle(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n🎨 ===== SELECTING STYLE =====`);
        console.log(`🎯 Product type: "${ad.typ || 'Not specified'}"`);
        console.log(`============================\n`);
        
        try {
            // Click the style dropdown button
            console.log('🎯 Clicking style dropdown button...');
            
            // Try to find and click style button using evaluate
            const styleButtonClicked = await this.page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const styleButton = buttons.find(btn => 
                    btn.querySelector('.DropdownMenu-module__placeholder___fgWvm')?.textContent?.includes('Select a Style')
                );
                if (styleButton) {
                    styleButton.click();
                    return true;
                }
                return false;
            });
            
            if (!styleButtonClicked) {
                console.log('⚠️ Style dropdown not found, skipping style selection');
                return;
            }
            
            console.log('✅ Style dropdown opened');
            await delay(1000);
            
            // Map product types to styles
            const styleMapping: { [key: string]: string } = {
                'luksusowy': 'Luxury',
                'vintage': 'Vintage', 
                'streetwear': 'Streetwear',
                'sportowy': 'Sportswear',
                'podstawowy': 'Basics',
                'western': 'Western',
                'workwear': 'Workwear',
                'gorpcore': 'Gorpcore',
                'awangarda': 'Avant-Garde'
            };
            
            // Try to map product type to style
            let targetStyle = '';
            if (ad.typ) {
                const typLower = ad.typ.toLowerCase();
                targetStyle = styleMapping[typLower] || '';
            }
            
            // If no mapping found, try to detect from product name
            if (!targetStyle && ad.rodzaj) {
                const rodzajLower = ad.rodzaj.toLowerCase();
                if (rodzajLower.includes('vintage') || rodzajLower.includes('retro')) {
                    targetStyle = 'Vintage';
                } else if (rodzajLower.includes('sport') || rodzajLower.includes('athletic')) {
                    targetStyle = 'Sportswear';
                } else if (rodzajLower.includes('luxury') || rodzajLower.includes('premium')) {
                    targetStyle = 'Luxury';
                } else if (rodzajLower.includes('street') || rodzajLower.includes('casual')) {
                    targetStyle = 'Streetwear';
                } else if (rodzajLower.includes('basic') || rodzajLower.includes('plain')) {
                    targetStyle = 'Basics';
                } else {
                    targetStyle = 'None'; // Default to None
                }
            } else if (!targetStyle) {
                targetStyle = 'None'; // Default to None
            }
            
            console.log(`🎯 Target style: ${targetStyle}`);
            
            // Find and click the matching style
            const styleClicked = await this.page.evaluate((style) => {
                const styleElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                const styleEl = styleElements.find(el => 
                    el.textContent?.trim() === style
                );
                if (styleEl) {
                    (styleEl as HTMLElement).click();
                    return true;
                }
                return false;
            }, targetStyle);
            
            if (styleClicked) {
                console.log(`✅ Selected style: ${targetStyle}`);
            } else {
                console.log(`⚠️ Style ${targetStyle} not found, selecting "None" as fallback...`);
                // Fallback: select "None"
                await this.page.evaluate(() => {
                    const styleElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                    const noneStyle = styleElements.find(el => 
                        el.textContent?.trim() === 'None'
                    );
                    if (noneStyle) {
                        (noneStyle as HTMLElement).click();
                    }
                });
                console.log('✅ Selected "None" style as fallback');
            }
            
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error selecting style:', error);
            console.log('⚠️ Continuing without style selection...');
        }
    }

    // Fill price
    async fillPrice(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n💰 ===== FILLING PRICE =====`);
        console.log(`💵 Polish price: ${ad.price || 'Not specified'} PLN`);
        console.log(`============================\n`);
        
        try {
            // Try to obtain PLN->USD rate from local server (cached); fall back to default
            let PLN_TO_USD_RATE = 0.25; // default fallback
            try {
                const resp = await fetch('http://localhost:3001/api/exchange-rate');
                if (resp.ok) {
                    const json = await resp.json();
                    if (json && typeof json.rate === 'number') {
                        PLN_TO_USD_RATE = Number(json.rate) || PLN_TO_USD_RATE;
                        console.log(`[exchange-rate] using cached PLN->USD rate: ${PLN_TO_USD_RATE}`);
                    }
                }
            } catch (e) {
                console.log('[exchange-rate] could not fetch rate from server, using default', e);
            }

            // Percentage markup (can be configured via env var GRAILED_PRICE_PERCENTAGE)
            const GRAILED_PRICE_PERCENTAGE = Number(process.env.GRAILED_PRICE_PERCENTAGE) || 15;

            let priceInPLN = 0;
            if (ad.price) {
                // Extract number from price string
                const priceMatch = ad.price.toString().match(/\d+/);
                if (priceMatch) {
                    priceInPLN = parseInt(priceMatch[0]);
                }
            }
            
            if (priceInPLN === 0) {
                priceInPLN = 50; // Default price if not specified
                console.log('⚠️ No price specified, using default: 50 PLN');
            }
            
            // Convert to USD (round to nearest USD)
            const priceInUSD = Math.round(priceInPLN * PLN_TO_USD_RATE);
            console.log(`🔄 Converted: ${priceInPLN} PLN → ${priceInUSD} USD (rate ${PLN_TO_USD_RATE})`);

            // Apply configured markup so Grailed price is higher (e.g., 15%)
            const finalUsd = Math.round(priceInUSD * (1 + (GRAILED_PRICE_PERCENTAGE / 100)));
            console.log(`📈 Applying markup ${GRAILED_PRICE_PERCENTAGE}% → final: $${finalUsd} USD`);
            
            // Find and fill the price input field
            const priceInput = 'input[name="price"]';
            await this.page.waitForSelector(priceInput, { timeout: 5000 });
            
            // Clear existing content and type new price
            await this.page.click(priceInput);
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            await this.page.type(priceInput, finalUsd.toString());
            
            console.log(`✅ Price filled: $${finalUsd} USD`);
            
            // Fill Floor Price (25% reduction)
            const floorPrice = Math.round(finalUsd * 0.75); // 25% reduction of final price
            console.log(`🔄 Floor price (75% of final): $${floorPrice} USD`);
            
            try {
                const floorPriceInput = 'input[name="smartPricing.minimumPrice"]';
                await this.page.waitForSelector(floorPriceInput, { timeout: 3000 });
                
                await this.page.click(floorPriceInput);
                await this.page.keyboard.down('Control');
                await this.page.keyboard.press('a');
                await this.page.keyboard.up('Control');
                await this.page.type(floorPriceInput, floorPrice.toString());
                
                console.log(`✅ Floor price filled: $${floorPrice} USD`);
            } catch (floorPriceError) {
                console.log('⚠️ Floor price input not found, skipping...');
            }
            
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error filling price:', error);
            throw new Error('Failed to fill price');
        }
    }

    // Fill measurements in input fields
    async fillMeasurements(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n📐 ===== FILLING MEASUREMENTS =====`);
        console.log(`📏 Length: ${ad.dlugosc || 'Not specified'} cm`);
        console.log(`📐 Width: ${ad.szerokosc || 'Not specified'} cm`);
        console.log(`===================================\n`);
        
        try {
            // Find measurement input fields
            const measurementInputs = await this.page.$$('.MeasurementInput-module__input___DookL');
            
            if (measurementInputs.length >= 2) {
                // Fill length (first input)
                if (ad.dlugosc) {
                    console.log(`🎯 Filling length: ${ad.dlugosc} cm`);
                    await measurementInputs[0].click();
                    await measurementInputs[0].evaluate(input => (input as HTMLInputElement).value = '');
                    await measurementInputs[0].type(ad.dlugosc.toString());
                    console.log('✅ Length filled');
                }
                
                // Fill width (second input)
                if (ad.szerokosc) {
                    console.log(`🎯 Filling width: ${ad.szerokosc} cm`);
                    await measurementInputs[1].click();
                    await measurementInputs[1].evaluate(input => (input as HTMLInputElement).value = '');
                    await measurementInputs[1].type(ad.szerokosc.toString());
                    console.log('✅ Width filled');
                }
                
                console.log('✅ Measurements filled successfully');
            } else {
                console.log('⚠️ Measurement input fields not found, skipping...');
            }
            
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error filling measurements:', error);
            console.log('⚠️ Continuing without measurements...');
        }
    }

    // Fill country of origin
    async fillCountryOfOrigin(): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n🌍 ===== FILLING COUNTRY OF ORIGIN =====`);
        console.log(`🌏 Setting country: China`);
        console.log(`=======================================\n`);
        
        try {
            // Find the country of origin input field
            const countryInput = 'input#country-of-origin';
            await this.page.waitForSelector(countryInput, { timeout: 5000 });
            
            console.log('🎯 Clicking country input field...');
            await this.page.click(countryInput);
            
            // Clear existing content
            await this.page.keyboard.down('Control');
            await this.page.keyboard.press('a');
            await this.page.keyboard.up('Control');
            
            console.log('🎯 Typing "China"...');
            await this.page.type(countryInput, 'China');
            
            // Wait for dropdown to appear and try multiple approaches
            await delay(2000);
            
            console.log('🔍 Looking for dropdown options...');
            
            try {
                // First try: wait for specific country dropdown to appear
                await this.page.waitForSelector('li[data-cy="menu-item"][role="menuitem"]', { timeout: 3000 });
                
                // Click first option using page.click() method
                const firstOptionSelector = 'li[data-cy="menu-item"][role="menuitem"]';
                const firstOption = await this.page.$(firstOptionSelector);
                
                if (firstOption) {
                    const optionText = await this.page.evaluate(el => el.textContent?.trim(), firstOption);
                    const ariaLabel = await this.page.evaluate(el => el.getAttribute('aria-label'), firstOption);
                    console.log(`🎯 Found first option: "${optionText}" (aria-label: "${ariaLabel}")`);
                    
                    await firstOption.click();
                    console.log('✅ First country option clicked successfully');
                } else {
                    throw new Error('First option not found');
                }
                
            } catch (selectorError) {
                console.log('⚠️ Direct selector failed, trying JavaScript evaluation...');
                
                // Fallback: JavaScript evaluation method
                const optionSelected = await this.page.evaluate(() => {
                    // Look for exact country dropdown structure
                    const countryOptions = Array.from(document.querySelectorAll('li[data-cy="menu-item"][role="menuitem"]'));
                    
                    console.log(`🔍 Found ${countryOptions.length} country dropdown options`);
                    
                    if (countryOptions.length > 0) {
                        const firstOption = countryOptions[0] as HTMLElement;
                        const optionText = firstOption.textContent?.trim();
                        const ariaLabel = firstOption.getAttribute('aria-label');
                        console.log(`🎯 Clicking first option: "${optionText}" (aria-label: "${ariaLabel}")`);
                        firstOption.click();
                        return true;
                    }
                    
                    // Try even more generic selectors
                    const fallbackOptions = Array.from(document.querySelectorAll('li[role="menuitem"], [class*="menuItem"], [class*="option"]'));
                    console.log(`🔍 Fallback: Found ${fallbackOptions.length} generic dropdown options`);
                    
                    if (fallbackOptions.length > 0) {
                        const firstOption = fallbackOptions[0] as HTMLElement;
                        const optionText = firstOption.textContent?.trim();
                        console.log(`🎯 Clicking first fallback option: "${optionText}"`);
                        firstOption.click();
                        return true;
                    }
                    
                    return false;
                });
                
                if (!optionSelected) {
                    console.log('🔄 Final fallback: pressing Arrow Down + Enter...');
                    await this.page.keyboard.press('ArrowDown');
                    await delay(500);
                    await this.page.keyboard.press('Enter');
                }
            }
            
            console.log('✅ Country of origin filled - first option selected');
            await delay(1000);
            
        } catch (error) {
            console.log('❌ Error filling country of origin:', error);
            console.log('⚠️ Continuing without country of origin...');
        }
    }

    // Upload photos
    async uploadPhotos(ad: Advertisement): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n📸 ===== UPLOADING PHOTOS =====`);
        console.log(`📷 Photos to upload: ${ad.photo_uris?.length || 0}`);
        console.log(`==============================\n`);
        
        try {
            if (!ad.photo_uris || ad.photo_uris.length === 0) {
                console.log('⚠️ No photos to upload');
                return;
            }
            
            // Download photos from Supabase URLs and save locally
            console.log('🔄 Downloading photos from Supabase...');
            const localPhotoPaths: string[] = [];
            
            // Ensure temp directory exists
            await mkdir(this.tempDir, { recursive: true });
            
            for (let i = 0; i < Math.min(ad.photo_uris.length, 8); i++) { // Max 8 photos for Grailed
                const photoUrl = ad.photo_uris[i];
                console.log(`📥 Downloading photo ${i + 1}: ${photoUrl}`);
                
                try {
                    // Fetch photo from URL
                    const response = await fetch(photoUrl);
                    if (!response.ok) {
                        console.log(`❌ Failed to download photo ${i + 1}: ${response.status}`);
                        continue;
                    }
                    
                    // Get photo buffer
                    const photoBuffer = await response.arrayBuffer();
                    const uint8Array = new Uint8Array(photoBuffer);
                    
                    // Save to temp directory
                    const fileName = `grailed_photo_${Date.now()}_${i}.jpg`;
                    const localPath = path.join(this.tempDir, fileName);
                    
                    await writeFile(localPath, uint8Array);
                    localPhotoPaths.push(localPath);
                    
                    console.log(`✅ Downloaded and saved: ${fileName}`);
                } catch (error) {
                    console.log(`❌ Error downloading photo ${i + 1}:`, error);
                }
            }
            
            if (localPhotoPaths.length === 0) {
                console.log('❌ No photos were downloaded successfully');
                return;
            }
            
            console.log(`✅ Successfully downloaded ${localPhotoPaths.length} photos`);
            
            // Upload photos to Grailed
            console.log('📤 Uploading photos to Grailed...');
            
            for (let i = 0; i < localPhotoPaths.length; i++) {
                const photoPath = localPhotoPaths[i];
                console.log(`� Uploading photo ${i + 1}: ${path.basename(photoPath)}`);
                
                try {
                    // Find the appropriate file input
                    const inputId = `photo_input_${i}`;
                    const fileInput = await this.page.$(`#${inputId}`) as any;
                    
                    if (fileInput) {
                        await fileInput.uploadFile(photoPath);
                        console.log(`✅ Uploaded photo ${i + 1} successfully`);
                        await delay(2500); // Wait longer between uploads
                    } else {
                        console.log(`⚠️ File input #${inputId} not found`);
                    }
                } catch (error) {
                    console.log(`❌ Error uploading photo ${i + 1}:`, error);
                }
            }
            
            // Wait for all photos to finish uploading and processing
            console.log('⏳ Waiting for all photos to be fully processed...');
            await this.waitForPhotosToLoad(localPhotoPaths.length);
            
            console.log('✅ Photo upload process completed');
            
            // Clean up local files
            console.log('🧹 Cleaning up temporary files...');
            for (const photoPath of localPhotoPaths) {
                try {
                    await import('fs').then(fs => fs.promises.unlink(photoPath));
                } catch (error) {
                    console.log(`⚠️ Could not delete temp file: ${photoPath}`);
                }
            }
            
        } catch (error) {
            console.log('❌ Error with photo upload:', error);
            console.log('⚠️ Continuing without photos...');
        }
    }

    // Save as draft and update Supabase status
    async saveAsDraft(advertisementId: string): Promise<void> {
        if (!this.page) throw new Error('Page not initialized');
        
        console.log(`\n💾 ===== SAVING AS DRAFT =====`);
        console.log(`📋 Advertisement ID: ${advertisementId}`);
        console.log(`=============================\n`);
        
        try {
            // Additional wait before saving to ensure all uploads are complete
            console.log('⏳ Final check - waiting 10 seconds before saving to ensure all uploads are complete...');
            await delay(10000);
            
            // Find and click Save as Draft button
            const saveButton = 'button.Button-module__button___gha04.Button-module__large___DWRNc.Button-module__secondary___PTcqW.ActionTray-module__action___R8XmQ[type="submit"]';
            await this.page.waitForSelector(saveButton, { timeout: 5000 });
            
            console.log('🎯 Clicking Save as Draft button...');
            await this.page.click(saveButton);
            
            // Wait longer for save to complete
            await delay(5000);
            console.log('✅ Save as Draft clicked successfully');
            
            // Update Supabase status
            console.log('🔄 Updating Supabase status...');
            const { updateGrailedPublishStatus } = await import('./supabaseFetcher');
            const result = await updateGrailedPublishStatus(advertisementId, true);
            
            if (result.success) {
                console.log('✅ Supabase status updated: is_published_to_grailed = true');
            } else {
                console.log('❌ Failed to update Supabase status:', result.message);
            }
            
        } catch (error) {
            console.log('❌ Error saving as draft:', error);
            throw new Error('Failed to save as draft');
        }
    }

    // Initialize browser connection
    async initWithExistingBrowser(): Promise<void> {
        try {
            console.log('🔍 Attempting to connect to existing Chrome instance...');
            this.browser = await puppeteer.connect({
                browserURL: 'http://localhost:9222',
                defaultViewport: null
            });
            
            const pages = await this.browser.pages();
            if (pages.length > 0) {
                this.page = pages[0];
                console.log('✅ Connected to existing Chrome instance');
            } else {
                this.page = await this.browser.newPage();
                console.log('✅ Created new page in existing Chrome instance');
            }
        } catch (error) {
            console.log('❌ Could not connect to existing Chrome. Launching new instance...');
            throw new Error('CHROME_NEEDS_LAUNCH');
        }
    }

    async startWithExistingBrowser(userId?: string): Promise<void> {
        try {
            await this.logger.banner('GRAILED AUTOMATION STARTING');
            await this.logger.info('🔍 Checking Chrome connection...');
            
            // Connect to existing browser (or launch automatically)
            await this.initWithExistingBrowser();
            
            // Add protection against dialogs
            if (this.page) {
                await this.page.evaluateOnNewDocument(() => {
                    window.confirm = () => true;
                    window.alert = () => {};
                    window.onbeforeunload = null;
                });
            }
            
            // Start the automation process
            await this.processGrailedListings(userId);
            
        } catch (error) {
            if (error instanceof Error && error.message === 'CHROME_NEEDS_LAUNCH') {
                await this.logger.warn('🚀 Chrome needs to be launched. Please start Chrome with remote debugging.');
                throw new Error('CHROME_STARTED_PLEASE_LOGIN');
            }
            throw error;
        }
    }

    async processGrailedListings(userId?: string): Promise<void> {
        await this.logger.info('📋 Starting to process Grailed listings...');
        
        // Import supabase fetcher
        const { fetchUnpublishedToGrailedAdvertisements } = await import('./supabaseFetcher');
        
        // Fetch unpublished advertisements
        await this.logger.info('📥 Fetching unpublished Grailed advertisements...');
        const advertisements = await fetchUnpublishedToGrailedAdvertisements(userId);
        
        if (!advertisements || advertisements.length === 0) {
            await this.logger.warn('⚠️ No unpublished advertisements found for Grailed');
            return;
        }
        
        await this.logger.automationStart(advertisements.length);
        
        let successful = 0;
        let failed = 0;
        
        // Process all advertisements
        for (let i = 0; i < advertisements.length; i++) {
            const currentAd = advertisements[i];
            
            await this.logger.separator();
            await this.logger.highlight(`PROCESSING ADVERTISEMENT ${i + 1}/${advertisements.length}`);
            await this.logger.progress(i + 1, advertisements.length, currentAd.tytul || 'Untitled');
            
            await this.logger.info('📝 Advertisement Details:', {
                title: currentAd.tytul || 'Brak tytułu',
                id: currentAd.id,
                type: currentAd.rodzaj || 'Brak typu',
                price: `${currentAd.price || 'Brak ceny'} PLN`,
                brand: currentAd.marka || 'Brak marki',
                size: currentAd.rozmiar || 'Brak rozmiaru',
                color: currentAd.color || 'Brak koloru',
                photos: currentAd.photo_uris ? currentAd.photo_uris.length : 0
            });
            
            try {
                // Navigate to Grailed sell page for each item
                await this.navigateToGrailed();
                
                // Process current advertisement
                await this.processAdvertisement(currentAd);
                
                // Save as draft and update status
                await this.saveAsDraft(currentAd.id);
                
                await this.logger.success(`Advertisement ${i + 1}/${advertisements.length} processed successfully!`);
                successful++;
                
                // Clean up temporary photos after successful processing
                await this.cleanupTempPhotos();
                
                // Wait before processing next item
                if (i < advertisements.length - 1) {
                    await this.logger.info('⏳ Waiting 3 seconds before next advertisement...');
                    await delay(3000);
                }
                
            } catch (error) {
                await this.logger.failure(`Failed to process advertisement ${i + 1}/${advertisements.length}`, {
                    error: error instanceof Error ? error.message : String(error),
                    adId: currentAd.id
                });
                failed++;
                
                // Clean up on error too
                await this.cleanupTempPhotos();
                
                // Continue with next advertisement
                continue;
            }
        }
        
        await this.logger.separator();
        await this.logger.automationComplete(advertisements.length, successful, failed);
        await this.logger.banner('GRAILED AUTOMATION COMPLETED');
        
        // Final cleanup of any remaining temporary photos
        await this.logger.info('🧹 Performing final cleanup...');
        await this.cleanupTempPhotos();
    }

    // Process a single advertisement
    async processAdvertisement(ad: Advertisement): Promise<void> {
        await this.logger.stepStart('Department & Category Selection');
        await this.selectDepartmentAndCategory(ad);
        await this.logger.stepComplete('Department & Category Selection', true);
        
        await this.logger.stepStart('Brand/Designer Field');
        await this.fillBrand(ad);
        await this.logger.stepComplete('Brand/Designer Field', true);
        
        await this.logger.stepStart('Size Selection');
        await this.selectSize(ad);
        await this.logger.stepComplete('Size Selection', true);
        
        await this.logger.stepStart('Title Filling');
        await this.fillTitle(ad);
        await this.logger.stepComplete('Title Filling', true);
        
        await this.logger.stepStart('Color Selection');
        await this.selectColor(ad);
        await this.logger.stepComplete('Color Selection', true);
        
        await this.logger.stepStart('Condition Selection');
        await this.selectCondition(ad);
        await this.logger.stepComplete('Condition Selection', true);
        
        await this.logger.stepStart('Description Filling');
        await this.fillDescription(ad);
        await this.logger.stepComplete('Description Filling', true);
        
        await this.logger.stepStart('Style Selection');
        await this.selectStyle(ad);
        await this.logger.stepComplete('Style Selection', true);
        
        await this.logger.stepStart('Price Filling');
        await this.fillPrice(ad);
        await this.logger.stepComplete('Price Filling', true);
        
        await this.logger.stepStart('Country of Origin');
        await this.fillCountryOfOrigin();
        await this.logger.stepComplete('Country of Origin', true);
        
        await this.logger.stepStart('Photo Upload');
        await this.uploadPhotos(ad);
        await this.logger.stepComplete('Photo Upload', true);
    }

    async close(): Promise<void> {
        // Don't close the browser since we're using an existing instance
        console.log('🔚 Grailed automation finished');
    }

    // Clean up all temporary photo files from the temp directory
    async cleanupTempPhotos(): Promise<void> {
        try {
            console.log('🧹 Cleaning up all temporary photo files...');
            const fs = await import('fs');
            const path = await import('path');
            
            // Ensure temp directory exists
            if (!await fs.promises.access(this.tempDir).then(() => true).catch(() => false)) {
                console.log('📁 Temp directory does not exist, nothing to clean up');
                return;
            }
            
            // Read all files in temp directory
            const files = await fs.promises.readdir(this.tempDir);
            const photoFiles = files.filter(file => 
                file.startsWith('grailed_photo_') && 
                (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))
            );
            
            if (photoFiles.length === 0) {
                console.log('📁 No temporary photo files found');
                return;
            }
            
            console.log(`🗑️ Found ${photoFiles.length} temporary photo files to delete`);
            
            // Delete all photo files
            for (const file of photoFiles) {
                try {
                    const filePath = path.join(this.tempDir, file);
                    await fs.promises.unlink(filePath);
                    console.log(`✅ Deleted: ${file}`);
                } catch (error) {
                    console.log(`⚠️ Could not delete: ${file} - ${error}`);
                }
            }
            
            console.log('✅ Temporary photo cleanup completed');
            
        } catch (error) {
            console.log('⚠️ Error during photo cleanup:', error);
        }
    }

    async startChromeWithGrailed(): Promise<boolean> {
        try {
            // Najpierw sprawdź czy Chrome z debug portem już nie jest uruchomiony
            console.log('🔍 Sprawdzam czy Chrome z debug portem już jest uruchomiony...');
            const isAlreadyRunning = await this.checkDebugPort();
            
            if (isAlreadyRunning) {
                console.log('✅ Chrome z debug portem już jest uruchomiony!');
                console.log('🌐 Przechodzę na grailed.com...');
                await this.initWithExistingBrowser();
                if (this.page) {
                    await this.page.goto('https://www.grailed.com/', { waitUntil: 'networkidle2' });
                    console.log('✅ Przeszedłem na grailed.com');
                }
                return true;
            }
            
            console.log('🔧 Sprawdzam czy Chrome jest zainstalowany...');
            
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
                    }
                } catch (error) {
                    console.log(`   ⚠️ Błąd sprawdzania: ${path}`, error);
                }
            }
            
            if (!chromePath) {
                console.log('❌ Nie znaleziono Chrome w standardowych lokalizacjach');
                return false;
            }
            
            console.log('🚀 Uruchamiam Chrome z debug portem dla Grailed...');
            
            // Utwórz unikalny katalog dla profilu debug
            const { execSync } = await import('child_process');
            const userDir = process.env.USERPROFILE || process.env.HOME || '.';
            let debugDir = `${userDir}\\AppData\\Local\\Temp\\chrome-debug-grailed-${Date.now()}`;
            
            try {
                console.log(`📁 Tworzę katalog debug: ${debugDir}`);
                execSync(`mkdir "${debugDir}"`, { stdio: 'ignore' });
                console.log(`✅ Utworzono katalog debug`);
            } catch (error) {
                debugDir = `.\\chrome-debug-grailed-${Date.now()}`;
                try {
                    execSync(`mkdir "${debugDir}"`, { stdio: 'ignore' });
                    console.log(`✅ Utworzono alternatywny katalog: ${debugDir}`);
                } catch {
                    console.log('❌ Nie można utworzyć katalogu debug');
                    return false;
                }
            }
            
            // Zamknij istniejące procesy Chrome
            console.log('🔄 Zamykam istniejące procesy Chrome...');
            try {
                console.log('⚠️ Zamykam wszystkie procesy Chrome...');
                execSync('taskkill /F /IM chrome.exe 2>NUL', { stdio: 'ignore' });
                console.log('✅ Procesy Chrome zamknięte');
                await new Promise(resolve => setTimeout(resolve, 3000));
            } catch {
                console.log('ℹ️ Brak procesów Chrome do zamknięcia');
            }
            
            // Wyczyść port 9222
            try {
                console.log('🧹 Czyszczę port 9222...');
                execSync('for /f "tokens=5" %a in (\'netstat -ano ^| findstr :9222\') do taskkill /F /PID %a 2>NUL', { stdio: 'ignore' });
            } catch {
                console.log('ℹ️ Port 9222 jest wolny');
            }
            
            // Uruchom Chrome z grailed.com
            console.log('🚀 Uruchamiam Chrome z grailed.com...');
            console.log(`📁 Używając katalogu: ${debugDir}`);
            const { spawn } = await import('child_process');
            const chromeProcess = spawn(chromePath, [
                '--remote-debugging-port=9222',
                `--user-data-dir=${debugDir}`,
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
                'https://www.grailed.com/'
            ], {
                detached: false,
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            console.log('✅ Chrome uruchomiony z debug portem');
            
            // Obsługa stderr (błędów)
            chromeProcess.stderr?.on('data', (data) => {
                console.log('⚠️ Chrome stderr:', data.toString());
            });
            
            // Czekaj na uruchomienie Chrome
            console.log('⏳ Czekam 5 sekund na uruchomienie Chrome...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Sprawdź czy port jest dostępny
            console.log('🔄 Sprawdzam połączenie z Chrome...');
            const portAvailable = await this.checkDebugPort();
            
            if (portAvailable) {
                console.log('✅ Port 9222 dostępny');
                console.log('🏷️ Grailed.com otwarty w przeglądarce');
                console.log('📱 Zaloguj się na Grailed w otwartej przeglądarce');
                return true;
            } else {
                console.log('❌ Port 9222 niedostępny');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Błąd uruchamiania Chrome dla Grailed:', error);
            return false;
        }
    }

    private async checkDebugPort(): Promise<boolean> {
        try {
            console.log('🔍 Sprawdzam port 9222...');
            const fetch = (await import('node-fetch')).default;
            
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`🔄 Próba ${attempt}/3...`);
                    const response = await fetch('http://localhost:9222/json/version', {
                        signal: AbortSignal.timeout(2000)
                    });
                    
                    if (response.ok) {
                        console.log('✅ Port 9222 odpowiada');
                        return true;
                    }
                } catch (error) {
                    console.log(`🔄 Próba ${attempt}/3 nieudana, czekam 2 sekundy...`);
                    if (attempt < 3) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            console.log('📡 Port 9222 nie jest dostępny');
            return false;
        } catch (error) {
            console.log('❌ Błąd sprawdzania portu 9222:', error);
            return false;
        }
    }
}

// Main automation functions
export async function runGrailedAutomation(userId?: string) {
    const automation = new GrailedAutomation();
    
    try {
        await automation.startWithExistingBrowser(userId);
    } catch (error) {
        console.error('Grailed automation failed:', error);
    } finally {
        await automation.close();
    }
}

// Function to run with existing browser
export async function runGrailedAutomationWithExistingBrowser(userId?: string) {
    const automation = new GrailedAutomation();
    
    try {
        await automation.startWithExistingBrowser(userId);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Don't show error if Chrome was just launched
        if (errorMessage !== 'CHROME_STARTED_PLEASE_LOGIN') {
            console.error('Grailed automation with existing browser failed:', error);
        }
    }
    // Don't close browser because we're using existing one
}

// If file is run directly
if (import.meta.main) {
    runGrailedAutomation().catch(console.error);
}
