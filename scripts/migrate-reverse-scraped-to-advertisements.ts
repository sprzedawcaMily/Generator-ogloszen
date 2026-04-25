import { firebaseApp } from '../src/firebaseConfig';
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    query,
    setDoc,
    where,
} from 'firebase/firestore';

type AnyRecord = Record<string, any>;

function normalizePrice(value: any): string {
    return String(value || '').trim();
}

async function run() {
    const db = getFirestore(firebaseApp);
    const userId = process.env.USER_ID?.trim();

    const reverseRef = collection(db, 'vinted_reverse_scraped_ads');
    const reverseSnap = userId
        ? await getDocs(query(reverseRef, where('user_id', '==', userId)))
        : await getDocs(reverseRef);

    let migrated = 0;
    let deleted = 0;

    for (const d of reverseSnap.docs) {
        const row = d.data() as AnyRecord;
        const docId = d.id;
        const now = new Date().toISOString();
        const photoUris = Array.isArray(row?.image_urls)
            ? row.image_urls
            : Array.isArray(row?.photo_uris)
                ? row.photo_uris
                : Array.isArray(row?.photos)
                    ? row.photos
                    : [];

        const payload: AnyRecord = {
            id: row?.id || docId,
            vinted_item_id: row?.vinted_item_id || null,
            marka: row?.brand || row?.marka || '',
            rodzaj: row?.category || row?.rodzaj || '',
            typ: row?.category || row?.typ || row?.rodzaj || '',
            rozmiar: row?.size || row?.rozmiar || '',
            stan: row?.condition || row?.stan || '',
            wada: row?.wada || '',
            color: row?.color || '',
            opis: row?.description || row?.opis || '',
            title: row?.title || '',
            listing_url: row?.listing_url || '',
            edit_url: row?.edit_url || '',
            listing_status: row?.listing_status || '',
            source_profile_url: row?.source_profile_url || null,
            price: normalizePrice(row?.price),
            price_vinted: normalizePrice(row?.price),
            photo_uris: photoUris,
            photos: photoUris,
            image_details: Array.isArray(row?.image_details) ? row.image_details : [],
            is_reverse_scraped: true,
            is_completed: true,
            is_published_to_vinted: String(row?.listing_status || '').toLowerCase() === 'active',
            status: 'active',
            scraped_at: row?.scraped_at || now,
            user_id: row?.user_id || null,
            created_at: row?.created_at || row?.scraped_at || now,
            updated_at: now,
        };

        await setDoc(doc(db, 'advertisements', docId), payload, { merge: true });
        migrated += 1;

        await deleteDoc(doc(db, 'vinted_reverse_scraped_ads', docId));
        deleted += 1;
    }

    console.log(JSON.stringify({
        success: true,
        user_id: userId || null,
        reverse_found: reverseSnap.size,
        migrated,
        deleted_from_reverse_collection: deleted,
    }));
}

run().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
});
