#!/usr/bin/env bun
import { VintedAutomation } from './src/vintedAutomation';

// Typ Advertisement z vintedAutomation.ts
interface Advertisement {
    id: string;
    marka: string;
    rodzaj: string;
    rozmiar: string;
    typ: string;
    stan: string;
    photo_uris: string[];
    is_completed: boolean;
    is_published_to_vinted: boolean;
    is_local: boolean;
    created_at: string;
    title?: string;
    description?: string;
    photos?: string[];
}

async function testCategorySelection() {
    const automation = new VintedAutomation();
    
    try {
        console.log('🚀 Testing category selection for "Szorty dżinsowe"...');
        
        // Połącz z istniejącą przeglądarką
        await automation.initWithExistingBrowser();
        
        // Przejdź na stronę dodawania ogłoszenia
        await automation.navigateToNewListing();
        
        // Test selekcji kategorii
        const testAd: Advertisement = {
            id: 'test',
            rodzaj: 'Szorty dżinsowe',
            marka: 'Test',
            rozmiar: '50',
            typ: 'test',
            stan: 'nowy',
            photo_uris: [],
            is_completed: false,
            is_published_to_vinted: false,
            is_local: false,
            created_at: new Date().toISOString(),
            title: 'Test',
            photos: []
        };
        
        console.log('🏷️ Testing category selection...');
        await automation.selectCategory(testAd);
        
        console.log('✅ Category selection test completed!');
        console.log('💡 Check the browser to see if "Szorty dżinsowe" was selected correctly');
        
        // Nie zamykaj przeglądarki, żeby użytkownik mógł sprawdzić rezultat
        console.log('🔍 Browser remains open for inspection');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testCategorySelection();
