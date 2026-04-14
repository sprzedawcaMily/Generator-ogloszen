import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { firebaseApp, firebaseConfig } from './src/firebaseConfig';

console.log(`Testing connection to Firebase project: ${firebaseConfig.projectId}`);

async function checkConnection() {
    try {
        const db = getFirestore(firebaseApp);
        await getDocs(query(collection(db, 'advertisements'), limit(1)));
        console.log('✅ Connection successful!');
    } catch (err) {
        console.error('❌ Unexpected error:', err);
    }
}

checkConnection();
