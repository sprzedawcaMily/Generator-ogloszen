import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function checkCompletedAds() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Checking for completed advertisements with valid data...\n');

    const snap = await getDocs(collection(db, 'advertisements'));
    const allAds = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const data = allAds
        .filter((ad) => ad.is_completed === true)
        .filter((ad) => ad.marka != null && ad.rodzaj != null)
        .slice(0, 3);
    
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
    const validAds = allAds
        .filter((ad) => ad.marka != null && ad.rodzaj != null)
        .slice(0, 5);
    
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
