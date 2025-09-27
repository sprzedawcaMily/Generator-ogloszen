import puppeteer, { Browser, Page } from 'puppeteer';

export interface PriceOptimizationStrategy {
    name: string;
    description: string;
    calculateNewPrice(currentPrice: number): number;
}

export class PriceOptimizer {
    private browser: Browser | null = null;
    private page: Page | null = null;

    // Strategia 1: Zmniejszenie o stały procent (25%)
    static fixedPercentageReduction: PriceOptimizationStrategy = {
        name: 'Stały procent (25%)',
        description: 'Zmniejsza cenę o 25% od aktualnej wartości',
        calculateNewPrice(currentPrice: number): number {
            return Math.round((currentPrice * 0.75) * 100) / 100;
        }
    };

    // Strategia 2: Progresywna redukcja (więcej dla wyższych cen)
    static progressiveReduction: PriceOptimizationStrategy = {
        name: 'Progresywna redukcja',
        description: 'Większa redukcja dla wyższych cen: <50zł: -15%, 50-100zł: -20%, >100zł: -30%',
        calculateNewPrice(currentPrice: number): number {
            let reductionPercent: number;
            
            if (currentPrice < 50) {
                reductionPercent = 0.15; // 15% redukcji
            } else if (currentPrice <= 100) {
                reductionPercent = 0.20; // 20% redukcji
            } else {
                reductionPercent = 0.30; // 30% redukcji
            }
            
            return Math.round((currentPrice * (1 - reductionPercent)) * 100) / 100;
        }
    };

    // Strategia 3: Inteligentna optymalizacja (okrągłe liczby)
    static smartOptimization: PriceOptimizationStrategy = {
        name: 'Inteligentna optymalizacja',
        description: 'Zmniejsza cenę do atrakcyjnych liczb końcowych (9, 5, 0)',
        calculateNewPrice(currentPrice: number): number {
            // Zmniejsz o 20-30%
            let newPrice = currentPrice * 0.75;
            
            // Zaokrąglij do atrakcyjnych końcówek
            if (newPrice >= 100) {
                // Dla cen >100: końcówka 9 (np. 149, 199)
                newPrice = Math.floor(newPrice / 10) * 10 + 9;
            } else if (newPrice >= 20) {
                // Dla cen 20-100: końcówka 9 lub 5 (np. 39, 45, 59)
                const base = Math.floor(newPrice / 10) * 10;
                if (newPrice - base >= 7) {
                    newPrice = base + 9;
                } else {
                    newPrice = base + 5;
                }
            } else {
                // Dla małych cen: zaokrąglij do 5 lub 9
                newPrice = Math.floor(newPrice);
                if (newPrice % 10 >= 5) {
                    newPrice = Math.floor(newPrice / 10) * 10 + 9;
                } else {
                    newPrice = Math.floor(newPrice / 10) * 10 + 5;
                }
            }
            
            return Math.max(newPrice, 5); // Minimalna cena 5zł
        }
    };

    async connectToBrowser(): Promise<void> {
        console.log('🔗 Łączę się z Chrome...');
        
        try {
            this.browser = await puppeteer.connect({
                browserURL: 'http://localhost:9222',
                defaultViewport: null
            });

            const pages = await this.browser.pages();
            
            // Znajdź kartę z Vinted
            let vintedPage = pages.find(page => 
                page.url().includes('vinted.pl')
            );

            if (!vintedPage) {
                // Utwórz nową kartę z Vinted
                vintedPage = await this.browser.newPage();
                await vintedPage.goto('https://www.vinted.pl/member/130445339', { 
                    waitUntil: 'networkidle2' 
                });
            }

            this.page = vintedPage;
            console.log('✅ Połączono z przeglądarką');
            
        } catch (error) {
            throw new Error(`Nie można połączyć się z Chrome: ${error}`);
        }
    }

    async optimizeAllPrices(strategy: PriceOptimizationStrategy): Promise<void> {
        if (!this.page) {
            throw new Error('Brak połączenia z przeglądarką');
        }

        console.log(`🎯 Rozpoczynam optymalizację cen ze strategią: ${strategy.name}`);
        console.log(`📋 ${strategy.description}`);
        console.log('');

        // Idź na profil użytkownika
        await this.page.goto('https://www.vinted.pl/member/130445339', { 
            waitUntil: 'networkidle2' 
        });

        // Znajdź wszystkie ogłoszenia
        const itemElements = await this.page.$$('.new-item-box__overlay');
        console.log(`📦 Znaleziono ${itemElements.length} ogłoszeń`);

        for (let i = 0; i < itemElements.length; i++) {
            try {
                console.log(`\n🔄 Przetwarzam ogłoszenie ${i + 1}/${itemElements.length}`);
                
                // Kliknij w najniższe ogłoszenie (ostatnie w liście)
                const currentElements = await this.page.$$('.new-item-box__overlay');
                if (currentElements.length === 0) {
                    console.log('❌ Brak dostępnych ogłoszeń');
                    break;
                }
                
                const targetElement = currentElements[currentElements.length - 1];
                await targetElement.click();
                
                // Poczekaj na załadowanie strony ogłoszenia
                await this.page.waitForTimeout(2000);
                
                // Znajdź przycisk "Edytuj ogłoszenie"
                const editButton = await this.page.$('[data-testid="item-edit-button"]');
                if (!editButton) {
                    console.log('❌ Nie znaleziono przycisku edycji');
                    await this.page.goBack();
                    continue;
                }

                console.log('✅ Klikam "Edytuj ogłoszenie"');
                await editButton.click();
                
                // Poczekaj na załadowanie formularza edycji
                await this.page.waitForTimeout(3000);

                // Znajdź pole ceny
                const priceInput = await this.page.$('[data-testid="price-input--input"]');
                if (!priceInput) {
                    console.log('❌ Nie znaleziono pola ceny');
                    await this.page.goBack();
                    continue;
                }

                // Pobierz aktualną cenę
                const currentPriceText = await this.page.$eval(
                    '[data-testid="price-input--input"]', 
                    (el: any) => el.value
                );
                
                const currentPrice = parseFloat(currentPriceText.replace(/[^\d,]/g, '').replace(',', '.'));
                console.log(`💰 Aktualna cena: ${currentPrice}zł`);

                // Oblicz nową cenę
                const newPrice = strategy.calculateNewPrice(currentPrice);
                console.log(`💡 Nowa cena: ${newPrice}zł (oszczędność: ${(currentPrice - newPrice).toFixed(2)}zł)`);

                // Wyczyść pole i wpisz nową cenę
                await priceInput.click({ clickCount: 3 }); // Zaznacz cały tekst
                await priceInput.type(`${newPrice.toFixed(2).replace('.', ',')} zł`);
                
                // Kliknij "Zapisz"
                const saveButton = await this.page.$('[data-testid="upload-form-save-button"]');
                if (!saveButton) {
                    console.log('❌ Nie znaleziono przycisku zapisz');
                    continue;
                }

                console.log('💾 Zapisuję zmiany...');
                await saveButton.click();
                
                // Poczekaj na zapisanie i powrót do profilu
                await this.page.waitForTimeout(3000);
                
                // Sprawdź czy jesteśmy z powrotem na profilu, jeśli nie - nawiguj
                if (!this.page.url().includes('/member/130445339')) {
                    await this.page.goto('https://www.vinted.pl/member/130445339', { 
                        waitUntil: 'networkidle2' 
                    });
                }

                console.log('✅ Cena została zaktualizowana');
                
            } catch (error) {
                console.log(`❌ Błąd przy przetwarzaniu ogłoszenia: ${error}`);
                
                // Spróbuj wrócić do profilu w przypadku błędu
                try {
                    await this.page.goto('https://www.vinted.pl/member/130445339', { 
                        waitUntil: 'networkidle2' 
                    });
                } catch (navError) {
                    console.log('❌ Nie można wrócić do profilu');
                }
            }
        }

        console.log('\n🎉 Optymalizacja cen zakończona!');
    }

    async close(): Promise<void> {
        // Nie zamykamy przeglądarki, bo używamy istniejącej
        console.log('👋 Zakończono optymalizację cen');
    }
}

// Funkcja do interaktywnego wyboru strategii
export async function runPriceOptimization(): Promise<void> {
    const optimizer = new PriceOptimizer();
    
    try {
        await optimizer.connectToBrowser();
        
        console.log('\n📊 Dostępne strategie optymalizacji cen:\n');
        console.log('1. ' + PriceOptimizer.fixedPercentageReduction.name);
        console.log('   ' + PriceOptimizer.fixedPercentageReduction.description + '\n');
        
        console.log('2. ' + PriceOptimizer.progressiveReduction.name);
        console.log('   ' + PriceOptimizer.progressiveReduction.description + '\n');
        
        console.log('3. ' + PriceOptimizer.smartOptimization.name);
        console.log('   ' + PriceOptimizer.smartOptimization.description + '\n');
        
        // Dla automatyzacji używamy domyślnie strategii 1 (25% redukcja)
        console.log('🎯 Używam strategii domyślnej: Stały procent (25%)');
        
        await optimizer.optimizeAllPrices(PriceOptimizer.fixedPercentageReduction);
        
    } catch (error) {
        console.error('❌ Błąd optymalizacji cen:', error);
        
        if (error instanceof Error && error.message.includes('Nie można połączyć się z Chrome')) {
            console.log('\n🚀 INSTRUKCJE:');
            console.log('1. Uruchom Chrome z debug portem: bun run chrome');
            console.log('2. Zaloguj się na Vinted');
            console.log('3. Uruchom ponownie: bun run price-optimizer');
        }
    } finally {
        await optimizer.close();
    }
}
