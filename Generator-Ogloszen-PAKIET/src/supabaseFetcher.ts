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
    setDoc,
    deleteDoc,
    addDoc,
    limit,
    deleteField,
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

function normalizeSaleStatus(value: any): 'active' | 'sold' | 'archived' {
    const normalized = String(value || '').trim().toLowerCase();
    if (normalized === 'sold' || normalized === 'sprzedany' || normalized === 'sprzedane') return 'sold';
    if (normalized === 'archived' || normalized === 'zarchiwizowany') return 'archived';
    return 'active';
}

function isSoldAdvertisement(ad: AnyRecord): boolean {
    if (ad?.is_sold === true || ad?.isSold === true || ad?.sold === true) return true;
    return normalizeSaleStatus(ad?.status ?? ad?.sale_status ?? ad?.listing_status) === 'sold';
}

async function optimizePhotoValue(photo: string): Promise<string> {
    const value = String(photo || '').trim();
    if (!value) return '';

    const dataUriMatch = value.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (!dataUriMatch?.[1]) {
        // For URL-based photos there is nothing to compress in Firestore payload.
        return value;
    }

    try {
        const sharpModule = await import('sharp');
        const sharp = sharpModule.default;
        const originalBuffer = Buffer.from(dataUriMatch[1], 'base64');
        const optimizedBuffer = await sharp(originalBuffer)
            .rotate()
            .resize({ width: 1280, withoutEnlargement: true })
            .jpeg({ quality: 55, mozjpeg: true })
            .toBuffer();
        const optimized = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
        return optimized.length < value.length ? optimized : value;
    } catch (error) {
        console.warn('Failed to optimize base64 image payload, keeping original image', error);
        return value;
    }
}

async function optimizeSoldAdByDocId(docId: string, ad: AnyRecord) {
    const firstPhotoRaw = Array.isArray(ad?.photo_uris) && ad.photo_uris.length > 0
        ? ad.photo_uris[0]
        : Array.isArray(ad?.photos) && ad.photos.length > 0
            ? ad.photos[0]
            : '';
    const firstPhoto = await optimizePhotoValue(String(firstPhotoRaw || ''));
    const optimizedPhotos = firstPhoto ? [firstPhoto] : [];

    const payload: AnyRecord = {
        photo_uris: optimizedPhotos,
        photos: deleteField(),
        storage_optimized: true,
        storage_optimized_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    if (Array.isArray(ad?.image_details) && ad.image_details.length > 0) {
        payload.image_details = deleteField();
    }

    await updateDoc(doc(db, 'advertisements', docId), payload);
    return {
        success: true,
        kept_photos: optimizedPhotos.length,
        optimized_photo_payload: firstPhotoRaw !== firstPhoto,
    };
}

async function archiveSoldAdvertisement(docId: string, ad: AnyRecord, soldAtIso: string) {
    const firstPhotoRaw = Array.isArray(ad?.photo_uris) && ad.photo_uris.length > 0
        ? ad.photo_uris[0]
        : Array.isArray(ad?.photos) && ad.photos.length > 0
            ? ad.photos[0]
            : '';
    const firstPhoto = await optimizePhotoValue(String(firstPhotoRaw || ''));

    const archivePayload: AnyRecord = {
        source_advertisement_doc_id: docId,
        id: ad?.id || docId,
        user_id: ad?.user_id || null,
        marka: ad?.marka || null,
        rodzaj: ad?.rodzaj || null,
        typ: ad?.typ || null,
        rozmiar: ad?.rozmiar || null,
        stan: ad?.stan || null,
        wada: ad?.wada || null,
        color: ad?.color || null,
        price: ad?.price || null,
        price_vinted: ad?.price_vinted || null,
        price_grailed: ad?.price_grailed || null,
        is_completed: ad?.is_completed === true,
        is_published_to_vinted: ad?.is_published_to_vinted === true,
        is_published_to_grailed: ad?.is_published_to_grailed === true,
        Vinted_URL: ad?.Vinted_URL || null,
        listing_status: ad?.listing_status || null,
        status: 'sold',
        sold_at: ad?.sold_at || soldAtIso,
        created_at: ad?.created_at || null,
        updated_at: soldAtIso,
        archived_at: soldAtIso,
        photo_uris: firstPhoto ? [firstPhoto] : [],
        photos: deleteField(),
        storage_optimized: true,
        storage_optimized_at: soldAtIso,
    };

    await setDoc(doc(db, 'sold_advertisements', docId), archivePayload, { merge: true });
}

function requiresSoldStorageOptimization(ad: AnyRecord): boolean {
    if (!isSoldAdvertisement(ad)) return false;

    const photos = Array.isArray(ad?.photo_uris)
        ? ad.photo_uris
        : Array.isArray(ad?.photos)
            ? ad.photos
            : [];
    const hasImageDetails = Array.isArray(ad?.image_details) && ad.image_details.length > 0;
    const firstPhoto = String((photos[0] || '')).trim();
    const base64Photo = /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(firstPhoto);

    if (photos.length > 1) return true;
    if (hasImageDetails) return true;
    if (base64Photo && ad?.storage_optimized !== true) return true;
    return false;
}

function triggerAutomaticSoldOptimization(rows: AnyRecord[]) {
    const candidates = rows.filter(requiresSoldStorageOptimization).slice(0, 3);
    if (candidates.length === 0) return;

    (async () => {
        for (const ad of candidates) {
            try {
                const adId = String(ad?.id || '');
                if (!adId) continue;
                const docId = await findAdvertisementDocId(adId);
                if (!docId) continue;
                await optimizeSoldAdByDocId(docId, ad);
            } catch (error) {
                console.warn('Automatic sold optimization failed for one advertisement', error);
            }
        }
    })().catch((error) => {
        console.warn('Automatic sold optimization background task failed', error);
    });
}

function normalizeAd(ad: AnyRecord): AnyRecord {
    const photoUris = Array.isArray(ad.photo_uris)
        ? ad.photo_uris
        : Array.isArray(ad.photos)
            ? ad.photos
            : ad.photo_uris
                ? [ad.photo_uris]
                : [];
    const explicitSold =
        ad?.is_sold === true ||
        ad?.isSold === true ||
        ad?.sold === true;
    const statusSource = explicitSold ? 'sold' : (ad?.status ?? ad?.sale_status ?? ad?.listing_status ?? '');
    const normalizedStatus = normalizeSaleStatus(statusSource);

    return {
        ...ad,
        status: normalizedStatus,
        is_sold: normalizedStatus === 'sold',
        photo_uris: photoUris,
        photos: photoUris,
    };
}

function sortByCreatedAtDesc<T extends AnyRecord>(rows: T[]): T[] {
    return [...rows].sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));
}

function sortByBestTimelineDesc<T extends AnyRecord>(rows: T[]): T[] {
    return [...rows].sort((a, b) => {
        const aTs = toMillis(a.updated_at) || toMillis(a.created_at) || toMillis(a.scraped_at) || toMillis(a.sold_at);
        const bTs = toMillis(b.updated_at) || toMillis(b.created_at) || toMillis(b.scraped_at) || toMillis(b.sold_at);
        if (bTs !== aTs) return bTs - aTs;
        const aId = String(a.id || a.source_advertisement_doc_id || a.title || '');
        const bId = String(b.id || b.source_advertisement_doc_id || b.title || '');
        return aId.localeCompare(bId);
    });
}

function sortByTimestampDesc<T extends AnyRecord>(rows: T[], fields: string[]): T[] {
    return [...rows].sort((a, b) => {
        const aTs = fields.map((f) => toMillis(a[f])).find((x) => x > 0) || 0;
        const bTs = fields.map((f) => toMillis(b[f])).find((x) => x > 0) || 0;
        if (bTs !== aTs) return bTs - aTs;
        const aId = String(a.id || a.source_advertisement_doc_id || a.title || '');
        const bId = String(b.id || b.source_advertisement_doc_id || b.title || '');
        return aId.localeCompare(bId);
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
        const activeRows = rows.filter((row) => !isSoldAdvertisement(row));
        triggerAutomaticSoldOptimization(rows);
        return sortByBestTimelineDesc(activeRows.map(normalizeAd));
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
        const activeRows = rows.filter((row) => !isSoldAdvertisement(row));
        triggerAutomaticSoldOptimization(rows);
        return sortByBestTimelineDesc(activeRows.map(normalizeAd));
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
        const activeRows = rows.filter((row) => !isSoldAdvertisement(row));
        return sortByBestTimelineDesc(activeRows.map(normalizeAd));
    } catch (error) {
        console.error('Error in fetchIncompleteAdvertisements:', error);
        return [];
    }
}

export async function fetchUnpublishedToVintedAdvertisements(userId?: string) {
    try {
        // Uwaga: część starych rekordów nie ma pola is_published_to_vinted.
        // W UI są traktowane jako "nieopublikowane", więc tutaj robimy to samo.
        const constraints = userId ? [where('user_id', '==', userId)] : [];

        const rows = await readCollection('advertisements', constraints);
        const valid = rows
            .filter((ad) => !isSoldAdvertisement(ad))
            .map(normalizeAd)
            .filter((ad) => ad.is_published_to_vinted !== true)
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
            .filter((ad) => !isSoldAdvertisement(ad))
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
        const constraints = [where('is_reverse_scraped', '==', true)];
        if (userId) constraints.push(where('user_id', '==', userId));
        const rows = await readCollection('advertisements', constraints);
        return sortByTimestampDesc(rows.map(normalizeAd), ['scraped_at', 'updated_at', 'created_at']);
    } catch (error) {
        console.error('Error in fetchReverseScrapedAdvertisements:', error);
        return [];
    }
}

export async function fetchSoldAdvertisements(userId?: string) {
    try {
        const constraints = userId ? [where('user_id', '==', userId)] : [];
        const rows = await readCollection('sold_advertisements', constraints);
        const soldOnly = rows.filter(isSoldAdvertisement);
        return sortByTimestampDesc(soldOnly.map(normalizeAd), ['sold_at', 'archived_at', 'updated_at', 'created_at']);
    } catch (error) {
        console.error('Error in fetchSoldAdvertisements:', error);
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

        await updateDoc(doc(db, 'advertisements', docId), {
            is_published_to_vinted: isPublished,
            listing_status: isPublished ? 'active' : 'draft'
        });
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
        await updateDoc(doc(db, 'advertisements', docId), {
            is_published_to_vinted: next,
            listing_status: next ? 'active' : 'draft'
        });

        return { success: true, is_published_to_vinted: next };
    } catch (error) {
        console.error('Error in toggleVintedPublishStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function toggleAdvertisementSoldStatus(advertisementId: string) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        const adRef = doc(db, 'advertisements', docId);
        const snap = await getDoc(adRef);
        if (!snap.exists()) {
            return { success: false, message: 'Nie znaleziono ogłoszenia' };
        }

        const currentStatus = normalizeSaleStatus((snap.data() as AnyRecord).status);
        if (currentStatus === 'sold') {
            return {
                success: false,
                status: 'sold',
                is_sold: true,
                message: 'Ogłoszenie jest już oznaczone jako sprzedane i nie może zostać cofnięte',
            };
        }
        const nextStatus = 'sold';
        const soldAtIso = new Date().toISOString();
        await updateDoc(adRef, {
            status: nextStatus,
            sold_at: soldAtIso,
            updated_at: soldAtIso,
        });

        const sourceAd = { ...(snap.data() as AnyRecord), status: nextStatus, sold_at: soldAtIso };
        await archiveSoldAdvertisement(docId, sourceAd, soldAtIso);
        await deleteDoc(adRef);

        return {
            success: true,
            status: nextStatus,
            is_sold: nextStatus === 'sold',
            archived: true,
            removed_from_active_collection: true,
        };
    } catch (error) {
        console.error('Error in toggleAdvertisementSoldStatus:', error);
        return { success: false, message: 'Błąd serwera' };
    }
}

export async function optimizeAdvertisementStorage(advertisementId: string) {
    try {
        const docId = await findAdvertisementDocId(advertisementId);
        if (!docId) return { success: false, message: 'Nie znaleziono ogłoszenia' };

        const snap = await getDoc(doc(db, 'advertisements', docId));
        if (!snap.exists()) return { success: false, message: 'Nie znaleziono ogłoszenia' };

        const ad = snap.data() as AnyRecord;
        if (!isSoldAdvertisement(ad)) {
            return { success: false, message: 'Ogłoszenie nie jest oznaczone jako sprzedane' };
        }

        return await optimizeSoldAdByDocId(docId, ad);
    } catch (error) {
        console.error('Error in optimizeAdvertisementStorage:', error);
        return { success: false, message: 'Błąd serwera podczas optymalizacji' };
    }
}

export async function optimizeAllSoldAdvertisements(userId?: string) {
    try {
        const constraints = userId ? [where('user_id', '==', userId)] : [];
        const rows = await readCollection('advertisements', constraints);
        const soldAds = rows.filter(isSoldAdvertisement);

        let optimizedCount = 0;
        for (const ad of soldAds) {
            const docId = String(ad.id);
            const result = await optimizeSoldAdByDocId(docId, ad);
            if (result.success) optimizedCount += 1;
        }

        return {
            success: true,
            scanned: rows.length,
            sold_found: soldAds.length,
            optimized: optimizedCount,
        };
    } catch (error) {
        console.error('Error in optimizeAllSoldAdvertisements:', error);
        return { success: false, message: 'Błąd serwera podczas masowej optymalizacji' };
    }
}

export async function migrateSoldAdvertisementsToArchive(userId?: string) {
    try {
        const constraints = userId ? [where('user_id', '==', userId)] : [];
        const rows = await readCollection('advertisements', constraints);
        const soldRows = rows.filter(isSoldAdvertisement);

        let migrated = 0;
        for (const ad of soldRows) {
            const docId = String(ad.id);
            const soldAtIso = ad?.sold_at ? String(ad.sold_at) : new Date().toISOString();
            await archiveSoldAdvertisement(docId, ad, soldAtIso);
            await deleteDoc(doc(db, 'advertisements', docId));
            migrated += 1;
        }

        return {
            success: true,
            scanned: rows.length,
            sold_found: soldRows.length,
            migrated,
        };
    } catch (error) {
        console.error('Error in migrateSoldAdvertisementsToArchive:', error);
        return { success: false, message: 'Błąd serwera podczas migracji sprzedanych ogłoszeń' };
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
