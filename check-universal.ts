import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function checkUniversalSizes() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Sprawdzam kategorie z rozmiarem "uniwersalny"...\n');

    const snap = await getDocs(collection(db, 'advertisements'));
    const data = snap.docs
        .map((d) => d.data() as any)
        .filter((ad) => String(ad.rozmiar || '').toLowerCase().includes('uniwersalny'));
    
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
