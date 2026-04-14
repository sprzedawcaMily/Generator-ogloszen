import {
    addDoc,
    collection,
    doc,
    getDocs,
    getFirestore,
    limit,
    query,
    setDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { firebaseApp } from '../src/firebaseConfig';

const db = getFirestore(firebaseApp);
const TARGET_USERNAME = 'kamochi';

function buildDocId(userId: string, itemId: string): string {
    return `${userId}_${itemId}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function extractItemIdFromDocId(docId: string): string {
    const idx = docId.lastIndexOf('_');
    if (idx === -1) return docId;
    return docId.slice(idx + 1);
}

async function getOrCreateUserIdByUsername(username: string): Promise<string> {
    const usersQ = query(collection(db, 'users'), where('username', '==', username), limit(1));
    const usersSnap = await getDocs(usersQ);

    if (!usersSnap.empty) {
        const row = usersSnap.docs[0].data() as Record<string, any>;
        const existingId = String(row.id || '').trim();
        if (existingId) return existingId;
    }

    const newUserId = crypto.randomUUID();
    await addDoc(collection(db, 'users'), {
        id: newUserId,
        username,
        display_name: username,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    });

    return newUserId;
}

async function assignAdvertisementsToUser(userId: string): Promise<number> {
    const snap = await getDocs(collection(db, 'advertisements'));
    const orphaned = snap.docs.filter((d) => {
        const data = d.data() as Record<string, any>;
        const owner = String(data.user_id || '').trim();
        return owner.length === 0;
    });

    if (orphaned.length === 0) {
        console.log('[attach] advertisements: no orphaned docs');
        return 0;
    }

    let updated = 0;
    const chunkSize = 400;

    for (let i = 0; i < orphaned.length; i += chunkSize) {
        const chunk = orphaned.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const row of chunk) {
            batch.set(row.ref, { user_id: userId, updated_at: new Date().toISOString() }, { merge: true });
            updated += 1;
        }

        await batch.commit();
    }

    console.log(`[attach] advertisements: assigned ${updated}`);
    return updated;
}

async function rekeyAndAssignReverseCollection(collectionName: 'vinted_reverse_scraped_ads' | 'vinted_ad_links', userId: string): Promise<number> {
    const snap = await getDocs(collection(db, collectionName));

    const candidates = snap.docs.filter((d) => {
        const data = d.data() as Record<string, any>;
        const owner = String(data.user_id || '').trim();
        const isAnonymousDocId = d.id.startsWith('anonymous_');
        return owner.length === 0 || isAnonymousDocId;
    });

    if (candidates.length === 0) {
        console.log(`[attach] ${collectionName}: no orphaned/anonymous docs`);
        return 0;
    }

    let migrated = 0;
    const chunkSize = 200;

    for (let i = 0; i < candidates.length; i += chunkSize) {
        const chunk = candidates.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const row of chunk) {
            const data = row.data() as Record<string, any>;
            const itemIdRaw = String(data.vinted_item_id || extractItemIdFromDocId(row.id) || '').trim();
            if (!itemIdRaw) continue;

            const newDocId = buildDocId(userId, itemIdRaw);
            const targetRef = doc(db, collectionName, newDocId);

            batch.set(
                targetRef,
                {
                    ...data,
                    vinted_item_id: itemIdRaw,
                    user_id: userId,
                    updated_at: new Date().toISOString(),
                },
                { merge: true }
            );

            if (row.id !== newDocId) {
                batch.delete(row.ref);
            }

            migrated += 1;
        }

        await batch.commit();
    }

    console.log(`[attach] ${collectionName}: migrated ${migrated}`);
    return migrated;
}

async function main() {
    const userId = await getOrCreateUserIdByUsername(TARGET_USERNAME);
    console.log(`[attach] target username=${TARGET_USERNAME}, userId=${userId}`);

    const adCount = await assignAdvertisementsToUser(userId);
    const reverseCount = await rekeyAndAssignReverseCollection('vinted_reverse_scraped_ads', userId);
    const linksCount = await rekeyAndAssignReverseCollection('vinted_ad_links', userId);

    console.log(`[attach] done: advertisements=${adCount}, reverse=${reverseCount}, links=${linksCount}`);
}

main().catch((err) => {
    console.error('[attach] failed', err);
    process.exit(1);
});
