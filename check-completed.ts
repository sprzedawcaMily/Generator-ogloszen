import { supabase } from './src/supabaseClient';

async function checkCompletedAds() {
    console.log('🔍 Checking for completed advertisements with valid data...\n');
    
    const { data, error } = await supabase
        .from('advertisements')
        .select('*')
        .eq('is_completed', true)
        .not('marka', 'is', null)
        .not('rodzaj', 'is', null)
        .limit(3);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    console.log('📊 Completed advertisements with data:');
    if (data && data.length > 0) {
        data.forEach((ad, i) => {
            console.log(`\n  Advertisement ${i + 1}:`);
            console.log(`    - ID: ${ad.id}`);
            console.log(`    - Marka: ${ad.marka}`);
            console.log(`    - Rodzaj: ${ad.rodzaj}`);
            console.log(`    - Rozmiar: ${ad.rozmiar}`);
            console.log(`    - Typ: ${ad.typ}`);
            console.log(`    - Stan: ${ad.stan}`);
            console.log(`    - Photos: ${ad.photo_uris?.length || 0}`);
        });
    } else {
        console.log('❌ No completed advertisements with valid data found');
    }
    
    // Also check for any ads with proper data structure
    console.log('\n🔍 Checking all ads with marka and rodzaj...');
    const { data: validAds } = await supabase
        .from('advertisements')
        .select('*')
        .not('marka', 'is', null)
        .not('rodzaj', 'is', null)
        .limit(5);
    
    if (validAds && validAds.length > 0) {
        console.log(`Found ${validAds.length} advertisements with valid marka/rodzaj:`);
        validAds.forEach((ad, i) => {
            console.log(`  ${i + 1}. ${ad.marka} ${ad.rodzaj} (completed: ${ad.is_completed})`);
        });
    } else {
        console.log('❌ No advertisements found with valid marka/rodzaj data');
    }
}

checkCompletedAds().catch(console.error);
