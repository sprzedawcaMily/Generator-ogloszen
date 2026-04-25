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

function optimizePreview(ad: AnyRecord): AnyRecord {
    const photos = Array.isArray(ad?.photo_uris)
        ? ad.photo_uris
        : Array.isArray(ad?.photos)
            ? ad.photos
            : [];
    const firstPhoto = photos[0] ? [photos[0]] : [];

    const out: AnyRecord = { ...ad };
    out.photo_uris = firstPhoto;
    out.photos = firstPhoto;
    delete out.image_details;
    out.storage_optimized = true;
    return out;
}

async function run() {
    const db = getFirestore(firebaseApp);
    const userId = process.env.USER_ID?.trim();
    const sampleLimit = Number(process.env.SAMPLE_LIMIT || 8);

    const baseRef = collection(db, 'advertisements');
    const snap = userId
        ? await getDocs(query(baseRef, where('user_id', '==', userId)))
        : await getDocs(baseRef);

    const sold = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as AnyRecord) }))
        .filter(isSold)
        .slice(0, sampleLimit);

    if (sold.length === 0) {
        console.log('Brak sprzedanych ogłoszeń do analizy.');
        return;
    }

    let totalBefore = 0;
    let totalAfter = 0;

    console.log(`Analiza ${sold.length} sprzedanych ogłoszeń:\n`);
    for (const ad of sold) {
        const before = byteSize(ad);
        const optimized = optimizePreview(ad);
        const after = byteSize(optimized);
        const saved = Math.max(before - after, 0);
        const savedPct = before > 0 ? ((saved / before) * 100).toFixed(1) : '0.0';

        totalBefore += before;
        totalAfter += after;

        console.log(`- ${ad.id}`);
        console.log(`  przed: ${before} B`);
        console.log(`  po:    ${after} B`);
        console.log(`  oszcz: ${saved} B (${savedPct}%)`);
    }

    const totalSaved = Math.max(totalBefore - totalAfter, 0);
    const totalSavedPct = totalBefore > 0 ? ((totalSaved / totalBefore) * 100).toFixed(1) : '0.0';

    console.log('\nPodsumowanie:');
    console.log(`- suma przed: ${totalBefore} B`);
    console.log(`- suma po:    ${totalAfter} B`);
    console.log(`- oszczędność: ${totalSaved} B (${totalSavedPct}%)`);
}

run().catch((error) => {
    console.error('Błąd analizy rozmiaru ogłoszeń:', error);
    process.exit(1);
});
