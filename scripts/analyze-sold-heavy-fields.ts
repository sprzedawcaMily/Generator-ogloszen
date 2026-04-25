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

async function run() {
    const db = getFirestore(firebaseApp);
    const userId = process.env.USER_ID?.trim();
    const limit = Math.max(1, Number(process.env.SAMPLE_LIMIT || 30));

    const baseRef = collection(db, 'advertisements');
    const snap = userId
        ? await getDocs(query(baseRef, where('user_id', '==', userId)))
        : await getDocs(baseRef);

    const soldAds = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as AnyRecord) }))
        .filter(isSold)
        .slice(0, limit);

    if (soldAds.length === 0) {
        console.log('Brak sprzedanych ogłoszeń do analizy.');
        return;
    }

    const totals = new Map<string, number>();
    let totalDocBytes = 0;

    for (const ad of soldAds) {
        totalDocBytes += byteSize(ad);
        for (const [key, value] of Object.entries(ad)) {
            const prev = totals.get(key) || 0;
            totals.set(key, prev + byteSize(value));
        }
    }

    const ranked = Array.from(totals.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);

    console.log(`Przeanalizowano sprzedane ogłoszenia: ${soldAds.length}`);
    console.log(`Łączny rozmiar dokumentów: ${totalDocBytes} B`);
    console.log('\nNajcięższe pola (suma po wszystkich sprzedanych):');

    for (const [key, bytes] of ranked) {
        const pct = totalDocBytes > 0 ? ((bytes / totalDocBytes) * 100).toFixed(1) : '0.0';
        console.log(`- ${key}: ${bytes} B (${pct}%)`);
    }
}

run().catch((error) => {
    console.error('Błąd analizy pól sprzedanych ogłoszeń:', error);
    process.exit(1);
});
