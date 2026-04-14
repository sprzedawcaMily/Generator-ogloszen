import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { firebaseApp } from './src/firebaseConfig';

async function checkAndLog() {
    console.log('🔍 Checking database columns...');

    const db = getFirestore(firebaseApp);
    const snap = await getDocs(query(collection(db, 'advertisements'), limit(1)));

    if (snap.empty) {
        console.log('⚠️ Brak rekordów w advertisements - nie mogę potwierdzić kolumny.');
        return;
    }

    const row = snap.docs[0].data() as any;
    if (!Object.prototype.hasOwnProperty.call(row, 'is_published_to_vinted')) {
        console.log('⚠️ Column is_published_to_vinted MISSING. You need to run patch.sql');
    } else {
        console.log('✅ Column is_published_to_vinted EXISTS');
    }
}

checkAndLog();
