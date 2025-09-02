import { fetchUnpublishedToVintedAdvertisements, fetchStyleByType } from './src/supabaseFetcher';

async function testFiltering() {
    console.log('🧪 Testing advertisement filtering...\n');
    
    // Test 1: Sprawdź czy funkcja poprawnie filtruje ogłoszenia
    console.log('📋 Test 1: Fetching unpublished advertisements with valid data');
    const unpublishedAds = await fetchUnpublishedToVintedAdvertisements();
    
    console.log(`Found ${unpublishedAds.length} valid unpublished advertisements:`);
    unpublishedAds.forEach((ad, i) => {
        console.log(`  ${i + 1}. ${ad.marka} ${ad.rodzaj} (rozmiar: ${ad.rozmiar}, stan: ${ad.stan})`);
        console.log(`     Photos: ${ad.photo_uris?.length || 0}, Published: ${ad.is_published_to_vinted}`);
    });
    
    // Test 2: Sprawdź obsługę fetchStyleByType z null
    console.log('\n🎨 Test 2: Testing fetchStyleByType with null/undefined values');
    
    try {
        const nullStyle = await fetchStyleByType(null as any);
        console.log('✅ fetchStyleByType(null) handled correctly:', nullStyle ? 'fallback style used' : 'no fallback available');
    } catch (error) {
        console.log('❌ fetchStyleByType(null) failed:', error);
    }
    
    try {
        const undefinedStyle = await fetchStyleByType(undefined as any);
        console.log('✅ fetchStyleByType(undefined) handled correctly:', undefinedStyle ? 'fallback style used' : 'no fallback available');
    } catch (error) {
        console.log('❌ fetchStyleByType(undefined) failed:', error);
    }
    
    try {
        const emptyStyle = await fetchStyleByType('');
        console.log('✅ fetchStyleByType("") handled correctly:', emptyStyle ? 'fallback style used' : 'no fallback available');
    } catch (error) {
        console.log('❌ fetchStyleByType("") failed:', error);
    }
    
    // Test 3: Sprawdź czy jest jakiś prawidłowy typ
    if (unpublishedAds.length > 0) {
        const firstAd = unpublishedAds[0];
        console.log(`\n🔍 Test 3: Testing fetchStyleByType with valid type "${firstAd.typ}"`);
        try {
            const validStyle = await fetchStyleByType(firstAd.typ);
            console.log('✅ fetchStyleByType with valid type:', validStyle ? 'style found' : 'fallback used');
        } catch (error) {
            console.log('❌ fetchStyleByType with valid type failed:', error);
        }
    }
}

testFiltering().catch(console.error);
