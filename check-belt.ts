import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function checkBeltSize() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Checking belt size in database...\n');

    const snap = await getDocs(collection(db, 'advertisements'));
    const data = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((ad) => String(ad.rodzaj || '').toLowerCase().includes('pask'))
        .filter((ad) => ad.is_published_to_vinted === false)
        .slice(0, 1);
    
    if (data && data.length > 0) {
        console.log('🔍 Pasek data:');
        console.log('ID:', data[0].id);
        console.log('Rozmiar:', data[0].rozmiar);
        console.log('Rodzaj:', data[0].rodzaj);
        console.log('Marka:', data[0].marka);
        console.log('Stan:', data[0].stan);
    } else {
        console.log('No unpublished belts found');
    }
}

checkBeltSize().catch(console.error);
