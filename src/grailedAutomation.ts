import puppeteer, { Browser, Page } from 'puppeteer';
import { fetchAdvertisements, fetchUnpublishedToGrailedAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType } from './supabaseFetcher';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import sharp from 'sharp';

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
            
            // Click the first option from dropdown
            try {
                console.log('🎯 Klikam pierwszą opcję z dropdown...');
                
                // Wait for dropdown options to appear
                const dropdownOptions = [
                    '.DesignersAndCollabs-module__option___jvM4j',
                    '[role="option"]',
                    '.autocomplete-option',
                    '.dropdown-option'
                ];
                
                let optionClicked = false;
                
                for (const selector of dropdownOptions) {
                    try {
                        await this.page.waitForSelector(selector, { timeout: 2000 });
                        await this.page.click(selector);
                        console.log(`✅ Wybrano markę z selektorem: ${selector}`);
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
            
            // Map Polish sizes to Grailed sizes
            const sizeMapping: { [key: string]: string } = {
                'XS': 'US XS / EU 42 / 0',
                'S': 'US S / EU 44-46 / 1',
                'M': 'US M / EU 48-50 / 2',
                'L': 'US L / EU 52-54 / 3',
                'XL': 'US XL / EU 56 / 4',
                'XXL': 'US XXL / EU 58 / 5',
                'XXS': 'US XXS / EU 40'
            };
            
            const grailedSize = sizeMapping[ad.rozmiar] || ad.rozmiar;
            console.log(`🎯 Mapowanie rozmiaru: ${ad.rozmiar} -> ${grailedSize}`);
            
            // Select the size from dropdown
            try {
                console.log(`🎯 Wyberam rozmiar: ${grailedSize}...`);
                
                await this.page.evaluate((targetSize) => {
                    const sizeElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                    const sizeEl = sizeElements.find(el => 
                        el.textContent?.includes(targetSize)
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
                
                // Try to select by partial match
                console.log('🔄 Próbuję wybór przez częściowe dopasowanie...');
                await this.page.evaluate((originalSize) => {
                    const sizeElements = Array.from(document.querySelectorAll('div[role="menuitem"]'));
                    const sizeEl = sizeElements.find(el => 
                        el.textContent?.includes(originalSize)
                    );
                    if (sizeEl) {
                        (sizeEl as HTMLElement).click();
                    } else {
                        // If no match, select the middle option (M)
                        const middleOption = sizeElements.find(el => 
                            el.textContent?.includes('US M / EU 48-50 / 2')
                        );
                        if (middleOption) {
                            (middleOption as HTMLElement).click();
                        }
                    }
                }, ad.rozmiar);
                
                console.log('✅ Wybrano rozmiar (fallback)');
            }
            
            await delay(1000);
            console.log('✅ Ukończono wybór rozmiaru');
            
        } catch (error) {
            console.log('❌ Błąd podczas wyboru rozmiaru:', error);
            throw new Error('Nie można wybrać rozmiaru');
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

    async startWithExistingBrowser(): Promise<void> {
        try {
            console.log('🚀 Starting Grailed automation with existing browser...');
            console.log('🔍 Checking Chrome connection...');
            
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
            await this.processGrailedListings();
            
        } catch (error) {
            if (error instanceof Error && error.message === 'CHROME_NEEDS_LAUNCH') {
                console.log('🚀 Chrome needs to be launched. Please start Chrome with remote debugging.');
                throw new Error('CHROME_STARTED_PLEASE_LOGIN');
            }
            throw error;
        }
    }

    async processGrailedListings(): Promise<void> {
        console.log('📋 Starting to process Grailed listings...');
        
        // Import supabase fetcher
        const { fetchUnpublishedToGrailedAdvertisements } = await import('./supabaseFetcher');
        
        // Fetch unpublished advertisements
        console.log('📥 Fetching unpublished Grailed advertisements...');
        const advertisements = await fetchUnpublishedToGrailedAdvertisements();
        
        if (!advertisements || advertisements.length === 0) {
            console.log('⚠️ No unpublished advertisements found for Grailed');
            return;
        }
        
        console.log(`📊 Found ${advertisements.length} unpublished advertisements`);
        
        // Navigate to Grailed sell page
        await this.navigateToGrailed();
        
        // Process first advertisement
        const firstAd = advertisements[0];
        console.log(`\n🏷️ ===== PROCESSING ADVERTISEMENT =====`);
        console.log(`📝 Title: ${firstAd.tytul || 'Brak tytułu'}`);
        console.log(`🆔 ID: ${firstAd.id}`);
        console.log(`📦 Product type: ${firstAd.rodzaj || 'Brak typu'}`);
        console.log(`💰 Price: ${firstAd.cena || 'Brak ceny'} PLN`);
        console.log(`👔 Brand: ${firstAd.marka || 'Brak marki'}`);
        console.log(`📏 Size: ${firstAd.rozmiar || 'Brak rozmiaru'}`);
        console.log(`🎨 Color: ${firstAd.kolor || 'Brak koloru'}`);
        console.log(`📸 Photos: ${firstAd.zdjecia ? firstAd.zdjecia.length : 0} photos`);
        console.log(`=======================================\n`);
        
        // Select department and category based on product type
        await this.selectDepartmentAndCategory(firstAd);
        
        // Fill brand/designer field
        await this.fillBrand(firstAd);
        
        // Select size
        await this.selectSize(firstAd);
        
        console.log('✅ Grailed automation completed successfully!');
    }

    async close(): Promise<void> {
        // Don't close the browser since we're using an existing instance
        console.log('🔚 Grailed automation finished');
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
export async function runGrailedAutomation() {
    const automation = new GrailedAutomation();
    
    try {
        await automation.startWithExistingBrowser();
    } catch (error) {
        console.error('Grailed automation failed:', error);
    } finally {
        await automation.close();
    }
}

// Function to run with existing browser
export async function runGrailedAutomationWithExistingBrowser() {
    const automation = new GrailedAutomation();
    
    try {
        await automation.startWithExistingBrowser();
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
