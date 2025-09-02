import { fetchUnpublishedToVintedAdvertisements } from './src/supabaseFetcher';

async function testUnpublishedFetch() {
    console.log('🧪 Testing fetchUnpublishedToVintedAdvertisements with new filtering...\n');
    
    const advertisements = await fetchUnpublishedToVintedAdvertisements();
    
    console.log(`\n📊 Results: Found ${advertisements.length} valid unpublished advertisements\n`);
    
    if (advertisements.length > 0) {
        console.log('📋 Valid advertisements ready for processing:');
        advertisements.forEach((ad, i) => {
            console.log(`\n  Advertisement ${i + 1}:`);
            console.log(`    - ID: ${ad.id}`);
            console.log(`    - Marka: ${ad.marka}`);
            console.log(`    - Rodzaj: ${ad.rodzaj}`);
            console.log(`    - Rozmiar: ${ad.rozmiar}`);
            console.log(`    - Typ: ${ad.typ}`);
            console.log(`    - Stan: ${ad.stan}`);
            console.log(`    - Photos: ${ad.photo_uris?.length || 0}`);
            console.log(`    - Published to Vinted: ${ad.is_published_to_vinted}`);
        });
    } else {
        console.log('❌ No valid unpublished advertisements found');
        console.log('💡 This could mean:');
        console.log('   1. All advertisements are already published to Vinted');
        console.log('   2. All unpublished advertisements have missing required fields');
        console.log('   3. All unpublished advertisements have no photos');
    }
}

testUnpublishedFetch().catch(console.error);
