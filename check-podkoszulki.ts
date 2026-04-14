import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function checkPodkoszulki() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Sprawdzam ogłoszenia z podkoszulkami...\n');

    const snap = await getDocs(collection(db, 'advertisements'));
    const allAds = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const data = allAds.filter((ad) => String(ad.rodzaj || '').toLowerCase().includes('podkoszul'));
    
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
    const similar = allAds
        .filter((ad) => {
            const rodzaj = String(ad.rodzaj || '').toLowerCase();
            return rodzaj.includes('koszul') || rodzaj.includes('shirt') || rodzaj.includes('tank');
        })
        .map((ad) => ({ rodzaj: ad.rodzaj }));
    
    if (similar && similar.length > 0) {
        const uniqueTypes = [...new Set(similar.map(ad => ad.rodzaj))];
        console.log('📋 Znalezione typy koszulek/podkoszulek:');
        uniqueTypes.forEach(type => {
            console.log(`  - ${type}`);
        });
    }
}

checkPodkoszulki().catch(console.error);
