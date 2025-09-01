import { fetchAdvertisements, fetchIncompleteAdvertisements } from './src/supabaseFetcher';

async function debugDatabase() {
    console.log('🔍 Debugging database content...\n');
    
    // Sprawdź wszystkie ogłoszenia
    console.log('📊 All advertisements:');
    const allAds = await fetchAdvertisements();
    console.log(`Found ${allAds.length} total advertisements\n`);
    
    if (allAds.length > 0) {
        console.log('📋 First 3 advertisements (all):');
        for (let i = 0; i < Math.min(3, allAds.length); i++) {
            const ad = allAds[i];
            console.log(`\n  Advertisement ${i + 1}:`);
            console.log(`    - ID: ${ad.id}`);
            console.log(`    - Title: ${ad.title || 'NULL'}`);
            console.log(`    - Description: ${ad.description?.substring(0, 100) || 'NULL'}...`);
            console.log(`    - is_completed: ${ad.is_completed}`);
            console.log(`    - Photos: ${ad.photos?.length || 0}`);
            console.log(`    - Created: ${ad.created_at}`);
        }
    }
    
    // Sprawdź niekompletne ogłoszenia
    console.log('\n📊 Incomplete advertisements:');
    const incompleteAds = await fetchIncompleteAdvertisements();
    console.log(`Found ${incompleteAds.length} incomplete advertisements\n`);
    
    if (incompleteAds.length > 0) {
        console.log('📋 First 3 incomplete advertisements:');
        for (let i = 0; i < Math.min(3, incompleteAds.length); i++) {
            const ad = incompleteAds[i];
            console.log(`\n  Incomplete Advertisement ${i + 1}:`);
            console.log(`    - ID: ${ad.id}`);
            console.log(`    - Title: ${ad.title || 'NULL'}`);
            console.log(`    - Description: ${ad.description?.substring(0, 100) || 'NULL'}...`);
            console.log(`    - Photos: ${ad.photos?.length || 0}`);
            console.log(`    - Created: ${ad.created_at}`);
        }
    } else {
        console.log('❌ No incomplete advertisements found!');
        console.log('💡 You may need to:');
        console.log('   1. Set some advertisements to is_completed = false in your database');
        console.log('   2. Add titles and descriptions to existing advertisements');
        console.log('   3. Create new incomplete advertisements for testing');
    }
}

debugDatabase().catch(console.error);
