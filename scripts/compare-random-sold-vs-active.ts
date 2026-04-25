import { firebaseApp } from '../src/firebaseConfig';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

type AnyRecord = Record<string, any>;

function byteSize(value: unknown): number {
    return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
}

function isSold(ad: AnyRecord): boolean {
    if (ad?.is_sold === true || ad?.isSold === true || ad?.sold === true) return true;
    const raw = String(ad?.status ?? ad?.sale_status ?? ad?.listing_status ?? '').trim().toLowerCase();
    return raw === 'sold' || raw === 'sprzedane' || raw === 'sprzedany';
}

function pickRandom<T>(items: T[]): T | null {
    if (!items.length) return null;
    const idx = Math.floor(Math.random() * items.length);
    return items[idx];
}

function describeAd(ad: AnyRecord) {
    const photos = Array.isArray(ad?.photo_uris)
        ? ad.photo_uris
        : Array.isArray(ad?.photos)
            ? ad.photos
            : [];

    return {
        id: ad.id,
        marka: ad.marka || null,
        rodzaj: ad.rodzaj || null,
        status: ad.status ?? ad.sale_status ?? ad.listing_status ?? null,
        is_sold: isSold(ad),
        photo_count: photos.length,
        json_size_bytes: byteSize(ad),
    };
}

async function run() {
    const db = getFirestore(firebaseApp);
    const userId = process.env.USER_ID?.trim();
    const comparisonCount = Math.max(1, Number(process.env.COMPARISON_COUNT || 1));
    const baseRef = collection(db, 'advertisements');
    const snap = userId
        ? await getDocs(query(baseRef, where('user_id', '==', userId)))
        : await getDocs(baseRef);

    const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnyRecord) }));
    const soldAds = all.filter(isSold);
    const activeAds = all.filter((ad) => !isSold(ad));

    if (soldAds.length === 0 || activeAds.length === 0) {
        console.log('Brak wystarczających danych do porównania (potrzebne min. 1 sprzedane i 1 niesprzedane).');
        console.log(`Sprzedane: ${soldAds.length}, niesprzedane: ${activeAds.length}`);
        return;
    }

    let totalSizeDiff = 0;
    let totalPhotoDiff = 0;
    let totalPct = 0;
    let executed = 0;

    console.log(`Losowe porównania (niesprzedane vs sprzedane), liczba prób: ${comparisonCount}\n`);
    for (let i = 1; i <= comparisonCount; i += 1) {
        const randomSold = pickRandom(soldAds);
        const randomActive = pickRandom(activeAds);
        if (!randomSold || !randomActive) continue;

        const soldInfo = describeAd(randomSold);
        const activeInfo = describeAd(randomActive);
        const sizeDiff = activeInfo.json_size_bytes - soldInfo.json_size_bytes;
        const photoDiff = activeInfo.photo_count - soldInfo.photo_count;
        const pctNum = activeInfo.json_size_bytes > 0 ? (sizeDiff / activeInfo.json_size_bytes) * 100 : 0;

        executed += 1;
        totalSizeDiff += sizeDiff;
        totalPhotoDiff += photoDiff;
        totalPct += pctNum;

        console.log(`#${i}`);
        console.log(`  active: ${activeInfo.id} | ${activeInfo.json_size_bytes} B | zdjęcia: ${activeInfo.photo_count}`);
        console.log(`  sold:   ${soldInfo.id} | ${soldInfo.json_size_bytes} B | zdjęcia: ${soldInfo.photo_count}`);
        console.log(`  różnica: ${sizeDiff} B (${pctNum.toFixed(1)}%), zdjęcia: ${photoDiff}\n`);
    }

    if (executed === 0) {
        console.log('Nie udało się wykonać porównań.');
        return;
    }

    console.log('Podsumowanie:');
    console.log(`- wykonane porównania: ${executed}`);
    console.log(`- średnia oszczędność JSON: ${(totalSizeDiff / executed).toFixed(1)} B`);
    console.log(`- średnia oszczędność procentowa: ${(totalPct / executed).toFixed(1)}%`);
    console.log(`- średnia różnica liczby zdjęć: ${(totalPhotoDiff / executed).toFixed(1)}`);
}

run().catch((error) => {
    console.error('Błąd porównania ogłoszeń:', error);
    process.exit(1);
});
