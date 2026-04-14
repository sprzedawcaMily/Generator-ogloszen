import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function updateAdvertisementStatus() {
    const db = getFirestore(firebaseApp);
    console.log('🔄 Updating first advertisement to is_completed = false...\n');
    
    try {
        const snap = await getDocs(collection(db, 'advertisements'));
        const ads = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
        ads.sort((a, b) => Date.parse(String(b.created_at || '')) - Date.parse(String(a.created_at || '')));
        
        if (!ads || ads.length === 0) {
            console.log('❌ No advertisements found in database');
            return;
        }
        
        const firstAd = ads[0];
        console.log('📋 First advertisement details:');
        console.log(`  - ID: ${firstAd.id}`);
        console.log(`  - Marka: ${firstAd.marka}`);
        console.log(`  - Rodzaj: ${firstAd.rodzaj}`);
        console.log(`  - Current is_completed: ${firstAd.is_completed}`);
        
        // Zmień status na niekompletne
        await updateDoc(doc(db, 'advertisements', firstAd.id), { is_completed: false });
        
        console.log('✅ Advertisement status updated to is_completed = false');
        console.log('🎉 Now you can run the Vinted automation!');
        
    } catch (error) {
        console.error('❌ Exception:', error);
    }
}

updateAdvertisementStatus().catch(console.error);
