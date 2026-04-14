import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function inspectSchema() {
    const db = getFirestore(firebaseApp);
    console.log('🔍 Inspecting database schema...');

    // Check advertisements table columns
    const adSnap = await getDocs(query(collection(db, 'advertisements'), limit(1)));

    if (!adSnap.empty) {
        console.log('✅ "advertisements" table exists.');
        console.log('   Columns:', Object.keys(adSnap.docs[0].data() as any).join(', '));
    } else {
        console.log('✅ "advertisements" table exists.');
        console.log('   Table is empty, cannot verify columns from data.');
    }

    // Check if advertisement_photos exists
    const photosSnap = await getDocs(query(collection(db, 'advertisement_photos'), limit(1)));

    if (photosSnap.empty) {
        console.log('⚠️ "advertisement_photos" table NOT found or is empty.');
    } else {
        console.log('✅ "advertisement_photos" table exists.');
    }
}

inspectSchema();
