import { supabase } from './src/supabaseClient';

async function checkPodkoszulki() {
    console.log('🔍 Sprawdzam ogłoszenia z podkoszulkami...\n');
    
    const { data } = await supabase
        .from('advertisements')
        .select('*')
        .ilike('rodzaj', '%podkoszul%');
    
    if (data && data.length > 0) {
        console.log(`📊 Znalezione ogłoszenia z podkoszulkami (${data.length}):`);
        data.forEach((ad, i) => {
            console.log(`  ${i + 1}. ${ad.marka} - ${ad.rodzaj} (${ad.rozmiar}) - Published: ${ad.is_published_to_vinted}`);
        });
    } else {
        console.log('❌ Brak ogłoszeń z podkoszulkami w bazie danych');
    }
    
    // Sprawdźmy też podobne nazwy
    console.log('\n🔍 Sprawdzam podobne kategorie...');
    const { data: similar } = await supabase
        .from('advertisements')
        .select('rodzaj')
        .or('rodzaj.ilike.%koszul%,rodzaj.ilike.%shirt%,rodzaj.ilike.%tank%');
    
    if (similar && similar.length > 0) {
        const uniqueTypes = [...new Set(similar.map(ad => ad.rodzaj))];
        console.log('📋 Znalezione typy koszulek/podkoszulek:');
        uniqueTypes.forEach(type => {
            console.log(`  - ${type}`);
        });
    }
}

checkPodkoszulki().catch(console.error);
