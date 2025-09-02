import { supabase } from './src/supabaseClient';

async function checkUniversalSizes() {
    console.log('🔍 Sprawdzam kategorie z rozmiarem "uniwersalny"...\n');
    
    const { data } = await supabase
        .from('advertisements')
        .select('rodzaj, rozmiar')
        .ilike('rozmiar', '%uniwersalny%');
    
    if (data) {
        console.log('📊 Kategorie z rozmiarem uniwersalny:');
        const categories = {};
        data.forEach(ad => {
            if (!categories[ad.rodzaj]) {
                categories[ad.rodzaj] = 0;
            }
            categories[ad.rodzaj]++;
        });
        
        Object.entries(categories).forEach(([category, count]) => {
            console.log(`  - ${category}: ${count} ogłoszeń`);
        });
    } else {
        console.log('Brak danych');
    }
}

checkUniversalSizes().catch(console.error);
