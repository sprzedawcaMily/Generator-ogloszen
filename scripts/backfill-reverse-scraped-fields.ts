import {
    collection,
    doc,
    getDocs,
    getFirestore,
    query,
    where,
    writeBatch,
} from 'firebase/firestore';
import { firebaseApp } from '../src/firebaseConfig';

const db = getFirestore(firebaseApp);

type AnyRecord = Record<string, any>;

type EnrichmentResult = {
    patch: AnyRecord;
    changedKeys: string[];
};

function asText(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function isBlank(value: unknown): boolean {
    return asText(value).length === 0;
}

function normalizeText(value: unknown): string {
    return asText(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function cleanMarkdown(value: string): string {
    return value
        .replace(/\*\*/g, '')
        .replace(/[*_`#]/g, '')
        .trim();
}

function sanitizeToken(token: string): string {
    return token.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
}

function isSizeToken(token: string): boolean {
    const t = normalizeText(token).replace(/[^a-z0-9.,/-]+/g, '');
    if (!t) return false;

    if (/^(xxxs|xxs|xs|s|m|l|xl|xxl|xxxl|4xl|5xl)$/.test(t)) return true;
    if (/^(one|onesize|one-size|uni|uniwersalny)$/.test(t)) return true;
    if (/^w\d{2}$/.test(t)) return true;
    if (/^\d{2,3}(?:[.,]\d)?$/.test(t)) return true;

    return false;
}

function titleCase(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';

    return trimmed
        .split(/\s+/)
        .map((part) => (part.length === 1 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1).toLowerCase()))
        .join(' ');
}

function extractByRegex(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match?.[1]) return '';
    return cleanMarkdown(match[1]);
}

function inferType(normalizedText: string): string {
    const dictionary: Array<{ keys: string[]; value: string }> = [
        { keys: ['t-shirt', 'tshirt', 'tee', 'koszulka'], value: 'Koszulka' },
        { keys: ['longsleeve', 'long sleeve'], value: 'Longsleeve' },
        { keys: ['koszula', 'shirt'], value: 'Koszula' },
        { keys: ['bluza', 'hoodie', 'sweatshirt'], value: 'Bluza' },
        { keys: ['sweter', 'sweater', 'jumper'], value: 'Sweter' },
        { keys: ['kardigan', 'cardigan'], value: 'Kardigan' },
        { keys: ['kurtka', 'jacket'], value: 'Kurtka' },
        { keys: ['spodnie', 'pants', 'trousers'], value: 'Spodnie' },
        { keys: ['jeans', 'jeansy', 'denim'], value: 'Jeansy' },
        { keys: ['szorty', 'shorts'], value: 'Szorty' },
        { keys: ['polo'], value: 'Polo' },
        { keys: ['bezrekawnik', 'kamizelka', 'vest'], value: 'Kamizelka' },
        { keys: ['czapka', 'beanie', 'cap', 'hat'], value: 'Czapka' },
        { keys: ['buty', 'sneakers', 'trampki', 'shoes'], value: 'Buty' },
        { keys: ['torba', 'bag'], value: 'Torba' },
        { keys: ['plecak', 'backpack'], value: 'Plecak' },
        { keys: ['pasek', 'belt'], value: 'Pasek' },
        { keys: ['portfel', 'wallet'], value: 'Portfel' },
    ];

    for (const entry of dictionary) {
        for (const key of entry.keys) {
            const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = new RegExp(`(^|\\b)${escaped}(\\b|$)`, 'i');
            if (pattern.test(normalizedText)) {
                return entry.value;
            }
        }
    }

    return '';
}

function inferTypFromTitle(title: string): string {
    const normalized = normalizeText(title);
    if (!normalized) return '';

    if (/(^|\b)(affliction|tapout)(\b|$)/i.test(normalized)) return 'affliction';
    if (/(^|\b)archive(\b|$)/i.test(normalized) || /ed\s*hardy/i.test(normalized)) return 'archive';
    if (/(^|\b)(hip\s*hop|hip-hop|hiphop|jnco|baggy)(\b|$)/i.test(normalized)) return 'hip hop';
    if (/(^|\b)gorp\s*core(\b|$)/i.test(normalized) || /(^|\b)gorpcore(\b|$)/i.test(normalized)) return 'gorpcore';

    return '';
}

function inferBrandFromTitle(title: string, inferredType: string): string {
    const raw = asText(title);
    if (!raw) return '';

    const ignored = new Set([
        'meska',
        'damska',
        'unisex',
        'vintage',
        'retro',
        'nowa',
        'nowy',
        'stan',
        'idealny',
        'bardzo',
        'dobry',
        'bez',
        'wad',
        'z',
        'nadrukiem',
    ]);

    const typeHints = new Set([
        'tshirt',
        't-shirt',
        'koszulka',
        'koszula',
        'bluza',
        'hoodie',
        'sweter',
        'kardigan',
        'kurtka',
        'spodnie',
        'jeans',
        'jeansy',
        'szorty',
        'polo',
        'czapka',
        'buty',
        'torba',
        'plecak',
        'pasek',
        'portfel',
    ]);

    if (inferredType) {
        typeHints.add(normalizeText(inferredType).replace(/\s+/g, ''));
    }

    const words = raw.split(/\s+/).map((w) => sanitizeToken(w)).filter(Boolean);
    const normalizedWords = words.map((w) => normalizeText(w).replace(/[^a-z0-9-]+/g, ''));

    let firstTypeIndex = normalizedWords.findIndex((w) => typeHints.has(w));
    if (firstTypeIndex < 0) {
        firstTypeIndex = normalizedWords.findIndex((w) => w.includes('shirt') || w.includes('koszul'));
    }

    let candidates: string[] = [];
    if (firstTypeIndex > 0) {
        candidates = words.slice(0, firstTypeIndex);
    } else if (firstTypeIndex === 0) {
        candidates = words.slice(1, 4);
    } else {
        candidates = words.slice(0, 3);
    }

    const filtered = candidates
        .map((t) => sanitizeToken(t))
        .filter(Boolean)
        .filter((t) => !isSizeToken(t))
        .filter((t) => !ignored.has(normalizeText(t)))
        .filter((t) => !typeHints.has(normalizeText(t).replace(/[^a-z0-9-]+/g, '')));

    if (filtered.length === 0) return '';

    return filtered.slice(0, 3).join(' ');
}

function canonicalCondition(input: string): string {
    const normalized = normalizeText(input);
    if (!normalized) return '';

    if (/stan\s*idealny|idealny|jak\s*nowy|perfect|mint|excellent/.test(normalized)) return 'Stan idealny';
    if (/bardzo\s*dobry|very\s*good/.test(normalized)) return 'Bardzo dobry';
    if (/dobry|good/.test(normalized)) return 'Dobry';
    if (/zadowalajacy|satisfactory|fair/.test(normalized)) return 'Zadowalajacy';
    if (/bez\s*wad|brak\s*wad|no\s*flaws|no\s*defects/.test(normalized)) return 'Bez wad';

    return '';
}

function parseConditionAndFlaw(description: string): { stan: string; wada: string } {
    const cleaned = cleanMarkdown(description);
    const normalized = normalizeText(cleaned);

    const line = extractByRegex(cleaned, /(?:^|\n)\s*(?:stan|condition)\s*:\s*([^\n]+)/im);
    const fallback = line || cleaned;

    const parts = fallback
        .split(/[\/|]/)
        .map((p) => cleanMarkdown(p))
        .filter((p) => p.length > 0);

    let stan = '';
    let wada = '';

    if (parts.length > 0) {
        const first = parts[0];
        const firstCondition = canonicalCondition(first);
        if (firstCondition) stan = firstCondition;

        if (parts.length > 1) {
            wada = titleCase(parts.slice(1).join(' / '));
        } else if (canonicalCondition(first) === 'Bez wad') {
            wada = 'Bez wad';
        }
    }

    if (!stan) {
        stan = canonicalCondition(normalized);
    }

    if (!wada && /bez\s*wad|no\s*flaws|brak\s*wad/i.test(normalized)) {
        wada = 'Bez wad';
    }

    return { stan, wada };
}

function extractMeasurement(text: string, labels: string[]): string {
    const normalized = normalizeText(text);

    for (const label of labels) {
        const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|\\n)\\s*${escaped}\\s*:?\\s*(\\d+(?:[.,]\\d+)?)`, 'im');
        const match = normalized.match(regex);
        if (match?.[1]) return match[1];
    }

    return '';
}

function extractSize(text: string): string {
    const cleaned = cleanMarkdown(text);
    const normalized = normalizeText(cleaned);

    const labeled = normalized.match(/(?:^|\n)\s*(?:rozmiar|size)\s*:\s*([a-z0-9+.,\/-]{1,20})/im);
    if (labeled?.[1]) return labeled[1].toUpperCase();

    const common = normalized.match(/(?:^|\b)(xxxs|xxs|xs|s|m|l|xl|xxl|xxxl|4xl|5xl|one\s*size|uniwersalny)(?:\b|$)/i);
    if (common?.[1]) return common[1].toUpperCase().replace(/\s+/g, ' ');

    return '';
}

function extractColor(text: string): string {
    const cleaned = cleanMarkdown(text);
    const labeled = extractByRegex(cleaned, /(?:^|\n)\s*(?:kolor|color)\s*:\s*([^\n]+)/im);
    if (labeled) return titleCase(labeled);

    return '';
}

function firstNonBlank(...values: unknown[]): string {
    for (const value of values) {
        const text = asText(value);
        if (text) return text;
    }
    return '';
}

function addIfMissing(patch: AnyRecord, source: AnyRecord, key: string, value: unknown) {
    if (!isBlank(source[key])) return;
    const text = asText(value);
    if (!text) return;
    patch[key] = text;
}

function enrichRow(row: AnyRecord): EnrichmentResult {
    const patch: AnyRecord = {};

    const title = asText(row.title);
    const description = firstNonBlank(row.description, row.opis);
    const fullText = [title, description].filter(Boolean).join('\n');
    const fullNormalized = normalizeText(fullText);

    if (isBlank(row.description) && !isBlank(row.opis)) {
        patch.description = asText(row.opis);
    }
    if (isBlank(row.opis) && !isBlank(row.description)) {
        patch.opis = asText(row.description);
    }

    const inferredType = firstNonBlank(
        row.category,
        row.rodzaj,
        row.typ,
        inferType(fullNormalized)
    );
    const inferredTypFromTitle = inferTypFromTitle(title);

    addIfMissing(patch, row, 'category', inferredType);
    addIfMissing(patch, row, 'rodzaj', inferredType);

    if (inferredTypFromTitle) {
        if (normalizeText(row.typ) !== inferredTypFromTitle) {
            patch.typ = inferredTypFromTitle;
        }
    } else {
        addIfMissing(patch, row, 'typ', inferredType);
    }

    const inferredBrand = firstNonBlank(
        row.brand,
        row.marka,
        inferBrandFromTitle(title, inferredType)
    );

    addIfMissing(patch, row, 'brand', inferredBrand);
    addIfMissing(patch, row, 'marka', inferredBrand);

    const inferredSize = firstNonBlank(row.size, row.rozmiar, extractSize(fullText));
    addIfMissing(patch, row, 'size', inferredSize.toUpperCase());
    addIfMissing(patch, row, 'rozmiar', inferredSize.toUpperCase());

    const parsedCondition = parseConditionAndFlaw(fullText);
    const inferredCondition = firstNonBlank(row.condition, row.stan, parsedCondition.stan);
    const inferredFlaw = firstNonBlank(row.wada, parsedCondition.wada);

    addIfMissing(patch, row, 'condition', inferredCondition);
    addIfMissing(patch, row, 'stan', inferredCondition);
    addIfMissing(patch, row, 'wada', inferredFlaw);

    const inferredColor = firstNonBlank(row.color, extractColor(fullText));
    addIfMissing(patch, row, 'color', inferredColor);

    const dlugosc = firstNonBlank(row.dlugosc, extractMeasurement(fullText, ['dlugosc', 'length']));
    const szerokosc = firstNonBlank(row.szerokosc, extractMeasurement(fullText, ['szerokosc', 'width']));
    const pas = firstNonBlank(row.pas, extractMeasurement(fullText, ['pas', 'waist']));
    const udo = firstNonBlank(row.udo, extractMeasurement(fullText, ['udo', 'thigh']));
    const dlugoscNogawki = firstNonBlank(row.dlugosc_nogawki, extractMeasurement(fullText, ['nogawka', 'inseam']));

    addIfMissing(patch, row, 'dlugosc', dlugosc);
    addIfMissing(patch, row, 'szerokosc', szerokosc);
    addIfMissing(patch, row, 'pas', pas);
    addIfMissing(patch, row, 'udo', udo);
    addIfMissing(patch, row, 'dlugosc_nogawki', dlugoscNogawki);

    const inferredPrice = firstNonBlank(row.price, row.price_vinted);
    addIfMissing(patch, row, 'price', inferredPrice);
    addIfMissing(patch, row, 'price_vinted', inferredPrice);

    const imageUrls = Array.isArray(row.image_urls) ? row.image_urls.filter(Boolean) : [];
    const photoUris = Array.isArray(row.photo_uris) ? row.photo_uris.filter(Boolean) : [];
    const photos = Array.isArray(row.photos) ? row.photos.filter(Boolean) : [];

    if (photoUris.length === 0 && imageUrls.length > 0) patch.photo_uris = imageUrls;
    if (photos.length === 0) {
        if (imageUrls.length > 0) patch.photos = imageUrls;
        else if (photoUris.length > 0) patch.photos = photoUris;
    }

    if (typeof row.is_reverse_scraped !== 'boolean') {
        patch.is_reverse_scraped = true;
    }

    if (typeof row.is_completed !== 'boolean') {
        patch.is_completed = true;
    }

    if (typeof row.is_published_to_vinted !== 'boolean' && !isBlank(row.listing_status)) {
        patch.is_published_to_vinted = asText(row.listing_status).toLowerCase() === 'active';
    }

    const changedKeys = Object.keys(patch);
    if (changedKeys.length > 0) {
        patch.updated_at = new Date().toISOString();
        changedKeys.push('updated_at');
    }

    return { patch, changedKeys };
}

function parseArgs() {
    const args = Bun.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    const userArg = args.find((arg) => arg.startsWith('--user='));
    const userId = userArg ? asText(userArg.slice('--user='.length)) : '';

    return { dryRun, userId };
}

async function main() {
    const { dryRun, userId } = parseArgs();

    const colRef = collection(db, 'vinted_reverse_scraped_ads');
    const snap = userId
        ? await getDocs(query(colRef, where('user_id', '==', userId)))
        : await getDocs(colRef);

    console.log(`[backfill] scanned docs: ${snap.size}${userId ? ` (user=${userId})` : ''}`);

    if (snap.empty) {
        console.log('[backfill] no documents to process');
        return;
    }

    let changedDocs = 0;
    let unchangedDocs = 0;
    let totalPatchedFields = 0;
    const changedPreview: Array<{ id: string; keys: string[] }> = [];

    const docChanges: Array<{ id: string; patch: AnyRecord }> = [];

    for (const row of snap.docs) {
        const data = row.data() as AnyRecord;
        const { patch, changedKeys } = enrichRow(data);

        if (changedKeys.length === 0) {
            unchangedDocs += 1;
            continue;
        }

        changedDocs += 1;
        totalPatchedFields += changedKeys.length;
        docChanges.push({ id: row.id, patch });

        if (changedPreview.length < 10) {
            changedPreview.push({ id: row.id, keys: changedKeys });
        }
    }

    console.log(`[backfill] changed docs: ${changedDocs}`);
    console.log(`[backfill] unchanged docs: ${unchangedDocs}`);
    console.log(`[backfill] patched fields total: ${totalPatchedFields}`);

    if (changedPreview.length > 0) {
        console.log('[backfill] sample changes:');
        for (const entry of changedPreview) {
            console.log(`  - ${entry.id}: ${entry.keys.join(', ')}`);
        }
    }

    if (dryRun) {
        console.log('[backfill] dry-run mode enabled, no writes executed');
        return;
    }

    if (docChanges.length === 0) {
        console.log('[backfill] nothing to write');
        return;
    }

    const chunkSize = 350;
    let written = 0;

    for (let i = 0; i < docChanges.length; i += chunkSize) {
        const chunk = docChanges.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        for (const change of chunk) {
            batch.set(doc(db, 'vinted_reverse_scraped_ads', change.id), change.patch, { merge: true });
        }

        await batch.commit();
        written += chunk.length;
        console.log(`[backfill] committed ${written}/${docChanges.length}`);
    }

    console.log(`[backfill] done, updated docs: ${written}`);
}

main().catch((error) => {
    console.error('[backfill] failed', error);
    process.exit(1);
});
