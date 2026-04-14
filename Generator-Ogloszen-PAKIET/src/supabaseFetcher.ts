import { firebaseApp } from './firebaseConfig';
import {
    getFirestore,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    addDoc,
    limit,
} from 'firebase/firestore';

const db = getFirestore(firebaseApp);

type AnyRecord = Record<string, any>;

function toMillis(value: any): number {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.seconds === 'number') return value.seconds * 1000;
    const parsed = Date.parse(String(value));
    return Number.isNaN(parsed) ? 0 : parsed;
}

function normalizeAd(ad: AnyRecord): AnyRecord {
    const photoUris = Array.isArray(ad.photo_uris)
        ? ad.photo_uris
        : Array.isArray(ad.photos)
            ? ad.photos
            : ad.photo_uris
                ? [ad.photo_uris]
                : [];

    return {
        ...ad,
        photo_uris: photoUris,
        photos: photoUris,
    };
}

function sortByCreatedAtDesc<T extends AnyRecord>(rows: T[]): T[] {
    return [...rows].sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
}

function sortByTimestampDesc<T extends AnyRecord>(rows: T[], fields: string[]): T[] {
    return [...rows].sort((a, b) => {
        const aTs = fields.map((f) => toMillis(a[f])).find((x) => x > 0) || 0;
        const bTs = fields.map((f) => toMillis(b[f])).find((x) => x > 0) || 0;
        return bTs - aTs;
    });
}

function normalizeReverseScrapedAd(row: AnyRecord): AnyRecord {
    const description = String(row.description || '');

    const getMeasurement = (patterns: RegExp[]): string => {
        for (const pattern of patterns) {
            const match = description.match(pattern);
            if (match?.[1]) return String(match[1]).trim();
        }
        return '';
    };

    const dlugosc = getMeasurement([
        /d[łl]ugo(?:[śs]?[ćc])?\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
        /length\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
    ]);
    const szerokosc = getMeasurement([
        /szeroko(?:[śs]?[ćc])?\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
        /width\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
    ]);
    const pas = getMeasurement([
        /pas\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
        /waist\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
    ]);
    const udo = getMeasurement([
        /udo\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
        /thigh\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
    ]);
    const dlugoscNogawki = getMeasurement([
        /nogawka\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
        /inseam\s*[:]?\s*(\d+(?:[.,]\d+)?)/i,
    ]);

    const photoUris = Array.isArray(row.image_urls)
        ? row.image_urls
        : Array.isArray(row.image_details)
            ? row.image_details.map((img: AnyRecord) => img?.src).filter(Boolean)
            : [];

    const normalizedPrice = String(row.price || '').trim();

    return {
        id: row.vinted_item_id || row.id,
        vinted_item_id: row.vinted_item_id || null,
        marka: row.brand || '',
        rodzaj: row.category || '',
        typ: row.category || '',
        rozmiar: row.size || '',
        stan: row.condition || '',
        color: row.color || '',
        wada: '',
        opis: row.description || '',
        dlugosc,
        szerokosc,
        pas,
        udo,
        dlugosc_nogawki: dlugoscNogawki,
        title: row.title || '',
        listing_url: row.listing_url || '',
        edit_url: row.edit_url || '',
        listing_status: row.listing_status || '',
        price: normalizedPrice,
        price_vinted: normalizedPrice,
        photo_uris: photoUris,
        photos: photoUris,
        is_reverse_scraped: true,
        is_completed: true,
        is_published_to_vinted: row.listing_status === 'active',
        is_published_to_grailed: false,
        created_at: row.scraped_at || row.updated_at || null,
        scraped_at: row.scraped_at || null,
        updated_at: row.updated_at || null,
        user_id: row.user_id || null,
    };
}

async function readCollection(collectionName: string, constraints: any[] = []): Promise<AnyRecord[]> {
    const ref = collection(db, collectionName);
    const q = constraints.length > 0 ? query(ref, ...constraints) : ref;
    const snap = await getDocs(q as any);

    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyRecord) }));
}

async function findAdvertisementDocId(advertisementId: string): Promise<string | null> {
    if (!advertisementId) return null;

    const directRef = doc(db, 'advertisements', advertisementId);
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) return advertisementId;

    const byBusinessId = await readCollection('advertisements', [
        where('id', '==', advertisementId),
        limit(1),
    ]);

    if (byBusinessId.length > 0) {
        return String(byBusinessId[0].id);
    }

    return null;
}

export async function fetchAdvertisements(userId?: string) {
    try {
        const constraints = userId ? [where('user_id', '==', userId)] : [];
        const rows = await readCollection('advertisements', constraints);
        return sortByCreatedAtDesc(rows.map(normalizeAd));
    } catch (error) {
        console.error('Error in fetchAdvertisements:', error);
        return [];
    }
}

export async function fetchCompletedAdvertisements(userId?: string) {
    try {
        const constraints = [where('is_completed', '==', true)];
        if (userId) constraints.push(where('user_id', '==', userId));
        const rows = await readCollection('advertisements', constraints);
        return sortByCreatedAtDesc(rows.map(normalizeAd));
    } catch (error) {
        console.error('Error in fetchCompletedAdvertisements:', error);
        return [];
    }
}

export async function fetchIncompleteAdvertisements(userId?: string) {
    try {
        const constraints = [where('is_completed', '==', false)];
        if (userId) constraints.push(where('user_id', '==', userId));
        const rows = await readCollection('advertisements', constraints);
        return sortByCreatedAtDesc(rows.map(normalizeAd));
    } catch (error) {
        console.error('Error in fetchIncompleteAdvertisements:', error);
        return [];
    }
}

export async function fetchUnpublishedToVintedAdvertisements(userId?: string) {
    try {
        const constraints = [where('is_published_to_vinted', '==', false)];
        if (userId) constraints.push(where('user_id', '==', userId));

        const rows = await readCollection('advertisements', constraints);
        const valid = rows
            .map(normalizeAd)
            .filter((ad) => ad.marka && ad.rodzaj && ad.rozmiar && ad.stan && ad.photo_uris?.length > 0);

        return sortByCreatedAtDesc(valid);
    } catch (error) {
        console.error('Error in fetchUnpublishedToVintedAdvertisements:', error);
        return [];
    }
}

export async function fetchUnpublishedToGrailedAdvertisements(userId?: string) {
    try {
        const constraints = [
            where('is_published_to_grailed', '==', false),
            where('is_completed', '==', true),
        ];
        if (userId) constraints.push(where('user_id', '==', userId));

        const rows = await readCollection('advertisements', constraints);
        const valid = rows
            .map(normalizeAd)
            .filter((ad) => ad.marka && ad.rodzaj && ad.rozmiar && ad.stan && ad.photo_uris?.length > 0);

        return sortByCreatedAtDesc(valid);
    } catch (error) {
        console.error('Error in fetchUnpublishedToGrailedAdvertisements:', error);
        return [];
    }
}

export async function fetchStyles(userId?: string) {
    try {
        const constraints = [where('is_active', '==', true)];
        if (userId) constraints.push(where('user_id', '==', userId));

        const rows = await readCollection('style_templates', constraints);
        return rows.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    } catch (error) {
        console.error('Error in fetchStyles:', error);
        return [];
    }
}

export async function fetchStyleByType(productType: string, userId?: string) {
    try {
        if (!productType || productType.trim() === '') {
            const styles = await fetchStyles(userId);
            return styles[0] || null;
        }

        const constraints = [where('is_active', '==', true), where('style_name', '==', productType)];
        if (userId) constraints.push(where('user_id', '==', userId));

        const rows = await readCollection('style_templates', constraints);
        if (rows.length > 0) return rows[0];

        const fallback = await fetchStyles(userId);
        return fallback[0] || null;
    } catch (error) {
        console.error('Error in fetchStyleByType:', error);
        const fallback = await fetchStyles(userId);
        return fallback[0] || null;
    }
}

export async function fetchDescriptionHeaders(platform?: string, userId?: string) {
    try {
        const constraints = [where('is_active', '==', true)];
        if (platform) constraints.push(where('platform', '==', platform));
        if (userId) constraints.push(where('user_id', '==', userId));

        const rows = await readCollection('description_headers', constraints);
        return rows.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    } catch (error) {
        console.error('Error in fetchDescriptionHeaders:', error);
        return [];
    }
}

export async function fetchReverseScrapedAdvertisements(userId?: string) {
    try {
        const constraints = userId ? [where('user_id', '==', userId)] : [];
        const rows = await readCollection('vinted_reverse_scraped_ads', constraints);
        const normalized = rows.map(normalizeReverseScrapedAd);
        return sortByTimestampDesc(normalized, ['scraped_at', 'updated_at', 'created_at']);
    } catch (error) {
        console.error('Error in fetchReverseScrapedAdvertisements:', error);
        return [];
    }
}

export async function loginUser(username: string) {
    try {
        const normalizedUsername = (username || '').trim();
        if (!normalizedUsername) {
            return { success: false, message: 'Username is required', data: null };
        }

        const users = await readCollection('users', [
            where('username', '==', normalizedUsername),
            limit(1),
        ]);

        if (users.length > 0) {
            const user = users[0];
            if (user.is_active === false) {
                return { success: false, message: 'Konto nieaktywne', data: null };
            }

            return {
                success: true,
                data: {
                    id: user.id,
                    username: user.username,
                    display_name: user.display_name || null,
                    email: user.email || null,
                },
            };
        }

        const newUserId = crypto.randomUUID();
        const payload = {
            id: newUserId,
            username: normalizedUsername,
            display_name: normalizedUsername,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        await addDoc(collection(db, 'users'), payload);

        return {
            success: true,
            data: {
                id: newUserId,
                username: normalizedUsername,
                display_name: normalizedUsername,
                email: null,
            },
        };
    } catch (err) {
        console.error('Exception in loginUser:', err);
        return { success: false, message: String(err), data: null };
    }
}

export async function getUserIdByUsername(username: string) {
    try {
        const normalizedUsername = (username || '').trim();
        if (!normalizedUsername) return null;

        const users = await readCollection('users', [
            where('username', '==', normalizedUsername),
            limit(1),
        ]);

        if (users.length === 0) return null;
        return String(users[0].id);
    } catch (err) {
        console.error('Exception in getUserIdByUsername:', err);
        return null;
    }
}

export async function getUsernameById(userId: string) {
    try {
        if (!userId) return null;

        const directRef = doc(db, 'users', userId);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
            const d = directSnap.data() as AnyRecord;
            return d.username || null;
        }

        const users = await readCollection('users', [where('id', '==', userId), limit(1)]);
        if (users.length === 0) return null;
        return users[0].username || null;
    } catch (err) {
        console.error('Exception in getUsernameById:', err);
        return null;
    }
}

export async function updateAdvertisementStatus(advertisementId: string, isCompleted: boolean) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) return false;

        await updateDoc(doc(db, 'advertisements', docId), { is_completed: isCompleted });
        return true;
    } catch (error) {
        console.error('Error in updateAdvertisementStatus:', error);
        return false;
    }
}

export async function updateVintedPublishStatus(advertisementId: string, isPublished: boolean) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) return false;

        await updateDoc(doc(db, 'advertisements', docId), { is_published_to_vinted: isPublished });
        return true;
    } catch (error) {
        console.error('Error in updateVintedPublishStatus:', error);
        return false;
    }
}

export async function toggleVintedPublishStatus(advertisementId: string) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        const snap = await getDoc(doc(db, 'advertisements', docId));
        if (!snap.exists()) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        const current = (snap.data() as AnyRecord).is_published_to_vinted === true;
        const next = !current;
        await updateDoc(doc(db, 'advertisements', docId), { is_published_to_vinted: next });

        return { success: true, is_published_to_vinted: next };
    } catch (error) {
        console.error('Error in toggleVintedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function updateGrailedPublishStatus(advertisementId: string, isPublished: boolean) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        await updateDoc(doc(db, 'advertisements', docId), { is_published_to_grailed: isPublished });
        return { success: true };
    } catch (error) {
        console.error('Error in updateGrailedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function toggleGrailedPublishStatus(advertisementId: string) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        const snap = await getDoc(doc(db, 'advertisements', docId));
        if (!snap.exists()) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        const current = (snap.data() as AnyRecord).is_published_to_grailed === true;
        const next = !current;
        await updateDoc(doc(db, 'advertisements', docId), { is_published_to_grailed: next });

        return { success: true, is_published_to_grailed: next };
    } catch (error) {
        console.error('Error in toggleGrailedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function saveVintedUrl(advertisementId: string, vintedUrl: string) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        await updateDoc(doc(db, 'advertisements', docId), { Vinted_URL: vintedUrl });
        return { success: true };
    } catch (error) {
        console.error('Error in saveVintedUrl:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}
