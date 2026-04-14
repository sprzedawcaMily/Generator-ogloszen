import { getFirestore, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function checkAdvertisement() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Checking advertisement data...\n');

    const snap = await getDocs(
        query(collection(db, 'advertisements'), where('id', '==', 'd85fc112-ed8c-407c-bf14-72ffc43fca45'), limit(1))
    );

    if (snap.empty) {
        console.error('Error: advertisement not found');
        return;
    }

    const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;

    console.log('📋 Advertisement data:');
    console.log('ID:', data.id);
    console.log('Marka:', data.marka);
    console.log('Rodzaj:', data.rodzaj);
    console.log('Rozmiar:', data.rozmiar);
    console.log('Typ:', data.typ);
    console.log('Stan:', data.stan);
    console.log('Title:', data.title);
    console.log('Description:', data.description);
    console.log('Photos:', data.photos);
    console.log('Photo URIs:', data.photo_uris);
    console.log('Is completed:', data.is_completed);
    console.log('Is published to Vinted:', data.is_published_to_vinted);
    console.log('\n📊 Full data structure:');
    console.log(JSON.stringify(data, null, 2));
}

checkAdvertisement().catch(console.error);
