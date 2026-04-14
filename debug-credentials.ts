import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { firebaseApp, firebaseConfig } from './src/firebaseConfig';

console.log('🔍 Starting Firebase credential debugger...');

async function run() {
    try {
        const db = getFirestore(firebaseApp);
        await getDocs(query(collection(db, 'advertisements'), limit(1)));
        console.log('🎉 Firebase connection works!');
        console.log(`PROJECT_ID=${firebaseConfig.projectId}`);
        console.log(`APP_ID=${firebaseConfig.appId}`);
    } catch (e: any) {
        console.log(`❌ Exception: ${e?.message || String(e)}`);
    }
}

run();
