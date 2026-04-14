import { getFirestore, collection, getDocs, writeBatch } from 'firebase/firestore';
import { firebaseApp } from '../src/firebaseConfig';

const db = getFirestore(firebaseApp);

async function deleteCollection(collectionName: string): Promise<number> {
    const snap = await getDocs(collection(db, collectionName));
    if (snap.empty) {
        console.log(`[cleanup] ${collectionName}: 0 docs`);
        return 0;
    }

    const docs = snap.docs;
    let deleted = 0;
    const chunkSize = 450;

    for (let i = 0; i < docs.length; i += chunkSize) {
        const chunk = docs.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        for (const d of chunk) {
            batch.delete(d.ref);
        }
        await batch.commit();
        deleted += chunk.length;
    }

    console.log(`[cleanup] ${collectionName}: deleted ${deleted}`);
    return deleted;
}

async function main() {
    const targetCollections = [
        'advertisements',
        'vinted_reverse_scraped_ads',
        'vinted_ad_links',
    ];

    let total = 0;
    for (const name of targetCollections) {
        total += await deleteCollection(name);
    }

    console.log(`[cleanup] total deleted: ${total}`);
}

main().catch((err) => {
    console.error('[cleanup] failed', err);
    process.exit(1);
});
