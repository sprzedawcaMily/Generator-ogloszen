import puppeteer, { Browser, Page } from 'puppeteer';
import { spawn } from 'child_process';
import fs from 'fs';
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
} from 'firebase/firestore';
import { firebaseApp } from './firebaseConfig';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const DEFAULT_VINTED_PROFILE_URL = process.env.VINTED_PROFILE_URL || 'https://www.vinted.pl/member/130445339';

async function isDebugPortAvailable(): Promise<boolean> {
    try {
        const res = await fetch('http://127.0.0.1:9222/json/version');
        return res.ok;
    } catch {
        return false;
    }
}

async function launchChromeWithPersistentProfile(): Promise<boolean> {
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
        `${process.env['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
    ];

    let chromePath = '';
    for (const p of chromePaths) {
        if (p && fs.existsSync(p)) {
            chromePath = p;
            break;
        }
    }

    if (!chromePath) return false;

    const userDir = process.env.USERPROFILE || process.env.HOME || '.';
    let debugDir = `${userDir}\\AppData\\Local\\Kamochi\\chrome-debug-main-profile`;

    try {
        fs.mkdirSync(debugDir, { recursive: true });
    } catch {
        debugDir = `.\\chrome-debug-main-profile`;
        try {
            fs.mkdirSync(debugDir, { recursive: true });
        } catch {
            return false;
        }
    }

    spawn(chromePath, [
        '--remote-debugging-port=9222',
        `--user-data-dir=${debugDir}`,
        '--no-first-run',
        '--no-default-browser-check',
        DEFAULT_VINTED_PROFILE_URL,
    ], {
        detached: false,
        stdio: ['ignore', 'ignore', 'ignore'],
    }).unref();

    for (let i = 0; i < 8; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (await isDebugPortAvailable()) return true;
    }

    return false;
}

type ListingStatus = 'draft' | 'active';

interface ScrapedImage {
    order: number;
    src: string;
    alt: string;
}

interface ScrapedListing {
    vinted_item_id: string;
    listing_status: ListingStatus;
    source_profile_url: string | null;
    edit_url: string;
    listing_url: string;
    title: string;
    description: string;
    category: string;
    brand: string;
    size: string;
    condition: string;
    color: string;
    price: string;
    image_urls: string[];
    image_details: ScrapedImage[];
    scraped_at: string;
    user_id: string | null;
}

class VintedReverseScraper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private readonly db = getFirestore(firebaseApp);

    private async configurePage(page: Page) {
        page.on('dialog', async (dialog) => {
            try {
                // Confirm leave-page dialogs so scraper can continue to next listing.
                await dialog.accept();
                console.log(`[reverse-scraper] auto-accepted dialog: ${dialog.type()}`);
            } catch (err) {
                console.warn('[reverse-scraper] failed to auto-accept dialog', err);
            }
        });

        await page.setViewport({ width: 1366, height: 900 });
        page.setDefaultTimeout(60000);
        page.setDefaultNavigationTimeout(120000);
    }

    private async checkDebugPort(): Promise<boolean> {
        return isDebugPortAvailable();
    }

    private async launchChromeWithDebugPort(): Promise<boolean> {
        return launchChromeWithPersistentProfile();
    }

    private async connectToExistingChrome() {
        const available = await this.checkDebugPort();
        if (!available) {
            const launched = await this.launchChromeWithDebugPort();
            if (!launched) {
                throw new Error('Nie mogę uruchomić Chrome z debug portem 9222.');
            }

            // Inform caller to log in and run scraper again.
            throw new Error('CHROME_STARTED_PLEASE_LOGIN');
        }

        console.log('[reverse-scraper] connecting to Chrome debug endpoint...');
        this.browser = await puppeteer.connect({
            browserURL: 'http://127.0.0.1:9222',
            defaultViewport: null,
            protocolTimeout: 60000,
        });

        const pages = await this.browser.pages();
        this.page = pages.find((p) => p.url().includes('vinted.')) || pages[0] || (await this.browser.newPage());
        await this.configurePage(this.page);
    }

    private async withTemporaryPage<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.browser) throw new Error('No browser available');

        const previousPage = this.page;
        const tempPage = await this.browser.newPage();
        await this.configurePage(tempPage);

        this.page = tempPage;
        try {
            return await fn();
        } finally {
            this.page = previousPage;
            await tempPage.close().catch(() => null);
        }
    }

    private buildDocId(userId: string | undefined, itemId: string): string {
        const owner = userId || 'anonymous';
        return `${owner}_${itemId}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
    }

    private async hasListingAlreadySaved(itemId: string, status: ListingStatus, userId?: string): Promise<boolean> {
        if (!itemId || !/^\d+$/.test(itemId)) return false;

        const docId = this.buildDocId(userId, itemId);
        const snap = await getDoc(doc(this.db, 'advertisements', docId));
        if (!snap.exists()) return false;

        const data = snap.data() as Record<string, unknown>;
        const savedStatus = String(data?.listing_status || '');
        const hasCoreFields =
            Boolean(data?.marka) ||
            Boolean(data?.rodzaj) ||
            Array.isArray(data?.photo_uris) ||
            Boolean(data?.listing_url);
        return savedStatus === status && hasCoreFields;
    }

    private isRecoverableProtocolError(err: unknown): boolean {
        const msg = err instanceof Error ? err.message : String(err || '');
        return msg.includes('ProtocolError') || msg.includes('timed out') || msg.includes('Target closed');
    }

    private async recoverBrowserSession(profileUrl?: string) {
        console.warn('[reverse-scraper] recovering browser session after protocol timeout...');
        try {
            this.page = null;
            await this.connectToExistingChrome();
            await this.goToCloset(profileUrl);
        } catch (recoveryErr) {
            console.error('[reverse-scraper] recovery failed', recoveryErr);
            throw recoveryErr;
        }
    }

    private async goToCloset(profileUrl?: string) {
        if (!this.page) throw new Error('No page available');

        const target = profileUrl?.trim() || DEFAULT_VINTED_PROFILE_URL;
        await this.page.goto(target, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await sleep(1500);
    }

    private async clickFilter(filterSelector: string, label: string) {
        if (!this.page) throw new Error('No page available');

        const testId = label === 'draft' ? 'closet-seller-filters-draft' : 'closet-seller-filters-active';

        const isFilterSelected = async () => {
            if (!this.page) return false;
            return await this.page.evaluate((id) => {
                const btn = document.querySelector(`button[data-testid="${id}"]`) as HTMLButtonElement | null;
                if (!btn) return false;

                const ariaPressed = (btn.getAttribute('aria-pressed') || '').toLowerCase();
                if (ariaPressed === 'true') return true;

                const cls = (btn.className || '').toLowerCase();
                // In Vinted chip styles selected is often not outlined.
                if (!cls.includes('outlined')) return true;

                return btn.getAttribute('data-state') === 'selected';
            }, testId);
        };

        const clickBySelector = async () => {
            if (!this.page) return false;
            const filter = await this.page.$(filterSelector);
            if (!filter) return false;
            await filter.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'center' }));
            await filter.click();
            await sleep(1200);
            return true;
        };

        const clickByTestId = async () => {
            if (!this.page) return false;
            return await this.page.evaluate((id) => {
                const btn = document.querySelector(`button[data-testid="${id}"]`) as HTMLButtonElement | null;
                if (!btn) return false;
                btn.scrollIntoView({ block: 'center', inline: 'center' });
                btn.click();
                return true;
            }, testId);
        };

        for (let attempt = 1; attempt <= 3; attempt += 1) {
            const clickedDirect = await clickBySelector();
            if (!clickedDirect) {
                await clickByTestId();
            }

            if (await isFilterSelected()) {
                await sleep(1000);
                return true;
            }
        }

        // Last fallback: click by text content (PL/EN) on filter chip buttons.
        const clickedByText = await this.page.evaluate((targetLabel) => {
            const draftWords = ['robocze', 'draft'];
            const activeWords = ['aktywne', 'active'];
            const expected = targetLabel === 'draft' ? draftWords : activeWords;

            const chips = Array.from(document.querySelectorAll('button[data-testid^="closet-seller-filters-"]')) as HTMLButtonElement[];
            for (const chip of chips) {
                const text = (chip.textContent || '').toLowerCase().trim();
                if (expected.some((w) => text.includes(w))) {
                    chip.click();
                    return true;
                }
            }

            return false;
        }, label);

        if (!clickedByText || !(await isFilterSelected())) {
            console.log(`[reverse-scraper] filter not found: ${label}`);
            return false;
        }

        await sleep(2000);
        return true;
    }

    private async scrollToLoadAllCards() {
        if (!this.page) throw new Error('No page available');

        let sameCountIterations = 0;
        let previousCount = 0;

        while (sameCountIterations < 3) {
            const currentCount = await this.page.evaluate(() => {
                return document.querySelectorAll('[data-testid="grid-item"]').length;
            });

            if (currentCount === previousCount) {
                sameCountIterations += 1;
            } else {
                sameCountIterations = 0;
                previousCount = currentCount;
            }

            await this.page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await sleep(1200);
        }

        await this.page.evaluate(() => {
            window.scrollTo(0, 0);
        });
        await sleep(500);
    }

    private async collectCardLinks(status: ListingStatus): Promise<string[]> {
        if (!this.page) throw new Error('No page available');

        const links = await this.page.evaluate((targetStatus) => {
            const gridItems = Array.from(document.querySelectorAll('[data-testid="grid-item"]')) as HTMLElement[];
            const hrefs: string[] = [];

            for (const item of gridItems) {
                const text = (item.textContent || '').toLowerCase();
                const isDraftCard = /robocze|draft/.test(text);

                // For drafts, trust selected filter view and do not over-filter by text.
                // Some Vinted cards do not include explicit "robocze" text in card body.
                if (targetStatus === 'active' && isDraftCard) continue;

                const anchor = item.querySelector('a[data-testid$="--overlay-link"]') as HTMLAnchorElement | null;
                if (!anchor) continue;

                const href = anchor.getAttribute('href') || '';
                if (!href) continue;

                try {
                    hrefs.push(new URL(href, window.location.origin).href);
                } catch {
                    // skip malformed links
                }
            }

            return Array.from(new Set(hrefs));
        }, status);

        return links;
    }

    private normalizeItemId(rawUrl: string): string {
        const match = rawUrl.match(/\/items\/(\d+)/);
        if (match?.[1]) return match[1];

        return rawUrl
            .replace(/^https?:\/\//, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .slice(0, 120);
    }

    private getCanonicalListingUrl(rawUrl: string): string {
        const itemId = this.normalizeItemId(rawUrl);
        if (/^\d+$/.test(itemId)) {
            return `https://www.vinted.pl/items/${itemId}`;
        }
        return rawUrl.includes('/edit') ? rawUrl.replace('/edit', '') : rawUrl;
    }

    private getCanonicalEditUrl(rawUrl: string): string {
        const itemId = this.normalizeItemId(rawUrl);
        if (/^\d+$/.test(itemId)) {
            return `https://www.vinted.pl/items/${itemId}/edit`;
        }

        const listingUrl = rawUrl.includes('/edit') ? rawUrl.replace('/edit', '') : rawUrl;
        return listingUrl.endsWith('/') ? `${listingUrl}edit` : `${listingUrl}/edit`;
    }

    private async openListingEditPage(rawUrl: string): Promise<{ itemId: string; editUrl: string; listingUrl: string } | null> {
        if (!this.page) throw new Error('No page available');

        const listingUrl = this.getCanonicalListingUrl(rawUrl);
        const canonicalEditUrl = this.getCanonicalEditUrl(rawUrl);
        const initialTarget = canonicalEditUrl;

        await this.page.goto(initialTarget, { waitUntil: 'domcontentloaded', timeout: 120000 });
        await sleep(1500);

        let currentUrl = this.page.url();
        if (!currentUrl.includes('/edit')) {
            const editButton = await this.page.$('button[data-testid="item-edit-button"], a[href*="/edit"]');
            if (editButton) {
                await editButton.click();
                await sleep(1500);
                await this.page.waitForSelector('input#title, textarea#description', { timeout: 30000 }).catch(() => null);
                currentUrl = this.page.url();
            }
        }

        if (!currentUrl.includes('/edit')) {
            const maybeEditUrl = canonicalEditUrl;
            await this.page.goto(maybeEditUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });
            await this.page.waitForSelector('input#title, textarea#description', { timeout: 30000 }).catch(() => null);
            currentUrl = this.page.url();
        }

        if (!currentUrl.includes('/edit')) {
            console.log(`[reverse-scraper] could not open edit page for ${rawUrl}`);
            return null;
        }

        const itemId = this.normalizeItemId(currentUrl);
        return { itemId, editUrl: currentUrl, listingUrl };
    }

    private async getFieldValue(selector: string): Promise<string> {
        if (!this.page) return '';

        const value = await this.page.evaluate((sel) => {
            const element = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
            if (!element) return '';
            return (element.value || '').replace(/\u00a0/g, ' ').trim();
        }, selector);

        return value || '';
    }

    private async extractImages(): Promise<ScrapedImage[]> {
        if (!this.page) return [];

        const images = await this.page.evaluate(() => {
            const imgNodes = Array.from(document.querySelectorAll('img.web_ui__Image__content')) as HTMLImageElement[];
            const relevant = imgNodes
                .map((img) => ({ src: img.src || '', alt: img.alt || '' }))
                .filter((img) => img.src.includes('vinted.net'))
                .filter((img) => /Przes[łl]ane zdj[eę]cie/i.test(img.alt));

            const withOrder = relevant.map((img) => {
                const match = img.alt.match(/(\d+)\s+z\s+\d+/i) || img.alt.match(/zdj[eę]cie\s+(\d+)/i);
                const order = match?.[1] ? Number(match[1]) : 999;
                return { ...img, order };
            });

            withOrder.sort((a, b) => a.order - b.order);
            return withOrder;
        });

        return images;
    }

    private async scrapeCurrentEditPage(meta: { itemId: string; editUrl: string; listingUrl: string }, status: ListingStatus, profileUrl?: string): Promise<ScrapedListing> {
        const images = await this.extractImages();

        const title = await this.getFieldValue('input#title');
        const description = await this.getFieldValue('textarea#description');
        const category = await this.getFieldValue('input#category');
        const brand = await this.getFieldValue('input#brand');
        const size = await this.getFieldValue('input#size');
        const condition = await this.getFieldValue('input#condition');
        const color = await this.getFieldValue('input#color');
        const price = await this.getFieldValue('input#price');

        return {
            vinted_item_id: meta.itemId,
            listing_status: status,
            source_profile_url: profileUrl || null,
            edit_url: meta.editUrl,
            listing_url: meta.listingUrl,
            title,
            description,
            category,
            brand,
            size,
            condition,
            color,
            price,
            image_urls: images.map((img) => img.src),
            image_details: images,
            scraped_at: new Date().toISOString(),
            user_id: null,
        };
    }

    private async saveListing(record: ScrapedListing, userId?: string) {
        const safeDocId = this.buildDocId(userId, record.vinted_item_id);
        const now = new Date().toISOString();

        const listingPayload = {
            id: safeDocId,
            vinted_item_id: record.vinted_item_id,
            marka: record.brand || '',
            rodzaj: record.category || '',
            typ: record.category || '',
            rozmiar: record.size || '',
            stan: record.condition || '',
            wada: '',
            color: record.color || '',
            opis: record.description || '',
            title: record.title || '',
            listing_url: record.listing_url,
            edit_url: record.edit_url,
            listing_status: record.listing_status,
            source_profile_url: record.source_profile_url || null,
            price: record.price || '',
            price_vinted: record.price || '',
            photo_uris: record.image_urls || [],
            photos: record.image_urls || [],
            image_details: record.image_details || [],
            is_reverse_scraped: true,
            is_completed: true,
            is_published_to_vinted: record.listing_status === 'active',
            status: 'active',
            scraped_at: record.scraped_at || now,
            user_id: userId || null,
            created_at: now,
            updated_at: now,
        };

        // Save directly to main advertisements collection (single source of truth).
        await setDoc(doc(this.db, 'advertisements', safeDocId), listingPayload, { merge: true });

        // Separate links collection requested by user: one link record per listing, also deduplicated.
        await setDoc(
            doc(this.db, 'vinted_ad_links', safeDocId),
            {
                vinted_item_id: record.vinted_item_id,
                user_id: userId || null,
                listing_url: record.listing_url,
                edit_url: record.edit_url,
                listing_status: record.listing_status,
                last_seen_at: now,
            },
            { merge: true }
        );
    }

    private async processFilter(status: ListingStatus, filterSelector: string, userId?: string, profileUrl?: string) {
        if (!this.page) throw new Error('No page available');

        // Always return to closet before switching filters (draft -> active).
        await this.goToCloset(profileUrl);

        const clicked = await this.clickFilter(filterSelector, status);
        if (!clicked) {
            throw new Error(`FILTER_SWITCH_FAILED_${status.toUpperCase()}`);
        }

        await this.scrollToLoadAllCards();
        const links = await this.collectCardLinks(status);
        console.log(`[reverse-scraper] ${status}: collected ${links.length} card links`);

        let processed = 0;
        let skipped = 0;
        for (const rawUrl of links) {
            const itemId = this.normalizeItemId(rawUrl);

            try {
                const alreadySaved = await this.hasListingAlreadySaved(itemId, status, userId);
                if (alreadySaved) {
                    skipped += 1;
                    console.log(`[reverse-scraper] skipped existing ${status} item ${itemId}`);
                    continue;
                }
            } catch (existsErr) {
                console.warn(`[reverse-scraper] existence check failed for ${itemId}, continuing`, existsErr);
            }

            let done = false;
            for (let attempt = 1; attempt <= 2 && !done; attempt += 1) {
                try {
                    const listing = await this.withTemporaryPage(async () => {
                        const meta = await this.openListingEditPage(rawUrl);
                        if (!meta) return null;

                        const scraped = await this.scrapeCurrentEditPage(meta, status, profileUrl);
                        await this.saveListing(scraped, userId);
                        return scraped;
                    });

                    if (listing) {
                        processed += 1;
                        console.log(`[reverse-scraper] saved ${status} item ${listing.vinted_item_id}`);
                    }
                    done = true;
                } catch (err) {
                    if (attempt === 1 && this.isRecoverableProtocolError(err)) {
                        console.warn(`[reverse-scraper] recoverable error for ${rawUrl}, retrying once...`, err);
                        await this.recoverBrowserSession(profileUrl);
                        continue;
                    }
                    console.error(`[reverse-scraper] failed for ${rawUrl}`, err);
                    done = true;
                }
            }
        }

        return { processed, skipped };
    }

    async run(userId?: string, profileUrl?: string) {
        await this.connectToExistingChrome();
        await this.goToCloset(profileUrl);

        if (!this.page) throw new Error('No page available');

        // Drafts first, then active listings.
        let drafts = { processed: 0, skipped: 0 };
        try {
            drafts = await this.processFilter('draft', 'button[data-testid="closet-seller-filters-draft"]', userId, profileUrl);
        } catch (err) {
            if (!this.isRecoverableProtocolError(err)) throw err;
            console.warn('[reverse-scraper] draft phase hit protocol timeout, recovering and continuing...', err);
            await this.recoverBrowserSession(profileUrl);
            drafts = await this.processFilter('draft', 'button[data-testid="closet-seller-filters-draft"]', userId, profileUrl);
        }

        let active = { processed: 0, skipped: 0 };
        try {
            active = await this.processFilter('active', 'button[data-testid="closet-seller-filters-active"]', userId, profileUrl);
        } catch (err) {
            if (!this.isRecoverableProtocolError(err)) throw err;
            console.warn('[reverse-scraper] active phase hit protocol timeout, recovering and continuing...', err);
            await this.recoverBrowserSession(profileUrl);
            active = await this.processFilter('active', 'button[data-testid="closet-seller-filters-active"]', userId, profileUrl);
        }

        console.log(`[reverse-scraper] done. drafts=${drafts.processed} (skipped=${drafts.skipped}), active=${active.processed} (skipped=${active.skipped})`);
        return {
            success: true,
            draftsProcessed: drafts.processed,
            draftsSkipped: drafts.skipped,
            activeProcessed: active.processed,
            activeSkipped: active.skipped,
            totalProcessed: drafts.processed + active.processed,
            totalSkipped: drafts.skipped + active.skipped,
        };
    }
}

export async function runVintedReverseScraperWithExistingBrowser(userId?: string, profileUrl?: string) {
    const scraper = new VintedReverseScraper();
    try {
        return await scraper.run(userId, profileUrl);
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        if (msg === 'CHROME_STARTED_PLEASE_LOGIN') {
            return {
                success: false,
                needsLogin: true,
                message: 'Uruchomiłem Chrome z Twoim profilem. Zaloguj się na Vinted/Google i uruchom reverse scraper ponownie.',
            };
        }

        throw error;
    }
}

export async function preflightVintedReverseScraperBrowser() {
    const available = await isDebugPortAvailable();
    if (available) {
        return { ok: true, needsLogin: false, message: 'Chrome debug port jest gotowy.' };
    }

    const launched = await launchChromeWithPersistentProfile();
    if (!launched) {
        return { ok: false, needsLogin: false, message: 'Nie mogę uruchomić Chrome z debug portem 9222.' };
    }

    return {
        ok: false,
        needsLogin: true,
        message: 'Uruchomiłem Chrome. Zaloguj się na Vinted/Google i uruchom scraper ponownie.',
    };
}
