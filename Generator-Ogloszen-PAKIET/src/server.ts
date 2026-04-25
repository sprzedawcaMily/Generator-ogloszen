import { serve } from "bun";
import { fetchAdvertisements, fetchCompletedAdvertisements, fetchIncompleteAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType, fetchReverseScrapedAdvertisements, fetchSoldAdvertisements } from './supabaseFetcher';

const DEFAULT_PORT = Number(process.env.PORT) || 3001;

// Cached exchange rate (PLN -> USD). Default fallback used until fetched.
let cachedPlnToUsdRate = 0.25;
let exchangeRateFetchedAt: number | null = null;
let vintedAutomationInProgress = false;

async function fetchAndCacheExchangeRateOnce() {
    try {
        // Use exchangerate.host for free exchange rates
        const res = await fetch('https://api.exchangerate.host/latest?base=PLN&symbols=USD');
        if (!res.ok) throw new Error('Failed to fetch exchange rate');
        const json = await res.json();
        const rate = json?.rates?.USD;
        if (rate && typeof rate === 'number') {
            cachedPlnToUsdRate = Number(rate);
            exchangeRateFetchedAt = Date.now();
            console.log(`[exchange-rate] fetched PLN->USD rate: ${cachedPlnToUsdRate}`);
        }
    } catch (err) {
        console.warn('[exchange-rate] could not fetch live rate, using fallback', err);
    }
}

async function handleFetch(req: Request) {
    const url = new URL(req.url);
    console.log(`Otrzymano żądanie: ${url.pathname}`);

    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response(null, {
            status: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        });
    }

    try {
        // Ignoruj żądania devtools
        if (url.pathname.includes('.well-known/appspecific/com.chrome.devtools')) {
            return new Response(null, { status: 404 });
        }

        // Helper: get logged-in user id from cookie or header
        function getUserIdFromReq(req: Request) {
            // check header first
            const headerUser = req.headers.get('x-user-id');
            if (headerUser) return headerUser;

            const cookie = req.headers.get('cookie') || '';
            const match = cookie.match(/(?:^|; )user_id=([^;]+)/);
            if (match) return decodeURIComponent(match[1]);
            return null;
        }

        // Endpoint dla ukończonych reklam (domyślnie)
        if (url.pathname === "/api/advertisements") {
            const userId = getUserIdFromReq(req);
            console.log('Fetching /api/advertisements for userId=', userId);
            const data = await fetchCompletedAdvertisements(userId as any);
            return new Response(JSON.stringify(data), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // Endpoint dla wszystkich reklam z Firebase
            if (url.pathname === "/api/advertisements/all") {
                const userId = getUserIdFromReq(req);
                console.log('Fetching /api/advertisements/all for userId=', userId);
                const data = await fetchAdvertisements(userId || undefined);
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

        // Endpoint dla ukończonych reklam z Firebase
            if (url.pathname === "/api/advertisements/completed") {
                const userId = getUserIdFromReq(req);
                console.log('Fetching /api/advertisements/completed for userId=', userId);
                const data = await fetchCompletedAdvertisements(userId as any);
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

        // Endpoint dla nieukończonych reklam z Firebase
            if (url.pathname === "/api/advertisements/incomplete") {
                const userId = getUserIdFromReq(req);
                console.log('Fetching /api/advertisements/incomplete for userId=', userId);
                const data = await fetchIncompleteAdvertisements(userId as any);
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint dla sprzedanych reklam z archiwum
            if (url.pathname === "/api/advertisements/sold") {
                const userId = getUserIdFromReq(req);
                console.log('Fetching /api/advertisements/sold for userId=', userId);
                const data = await fetchSoldAdvertisements(userId || undefined);
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint dla ogłoszeń pobranych reverse scraperem z Vinted
            if (url.pathname === "/api/vinted/reverse-scraped") {
                const userId = getUserIdFromReq(req);
                console.log('Fetching /api/vinted/reverse-scraped for userId=', userId);
                const data = await fetchReverseScrapedAdvertisements(userId || undefined);
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint: return current logged-in user id (if any)
            if (url.pathname === "/api/me") {
                const userId = getUserIdFromReq(req);
                let username = null;
                if (userId) {
                    try {
                        const { getUsernameById } = await import('./supabaseFetcher');
                        username = await getUsernameById(userId as string);
                    } catch (e) {
                        console.warn('Failed to lookup username for /api/me', e);
                    }
                }

                return new Response(JSON.stringify({ userId: userId || null, username: username || null }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint: logout (clear the user_id cookie)
            if (url.pathname === "/api/logout" && req.method === "POST") {
                const headers = new Headers();
                headers.set('Content-Type', 'application/json');
                headers.set('Access-Control-Allow-Origin', '*');
                // Clear cookie by setting Max-Age=0
                headers.append('Set-Cookie', `user_id=; Path=/; HttpOnly; Max-Age=0`);
                return new Response(JSON.stringify({ success: true }), { headers });
            }

            // Endpoint: login by nickname only. Expects JSON { username }
            if (url.pathname === "/api/login" && req.method === "POST") {
                try {
                    const body = await req.json();
                    const { username } = body || {};
                    if (!username) {
                        return new Response(JSON.stringify({ success: false, message: 'username required' }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                    }

                    const { loginUser } = await import('./supabaseFetcher');
                    const res = await loginUser(username);

                    // Log full login result for debugging
                    try {
                        console.log('loginUser result:', JSON.stringify(res));
                    } catch (e) {
                        console.log('loginUser result (non-serializable):', res);
                    }

                    if (!res.success) {
                        return new Response(JSON.stringify({ success: false, message: res.message || 'Login failed', rpc: res }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                    }

                    const userRow = res.data;

                    // Robust extraction of user id from multiple possible shapes
                    let userId: string | null = null;
                    if (!userRow) {
                        userId = null;
                    } else if (typeof userRow === 'string' || typeof userRow === 'number') {
                        userId = String(userRow);
                    } else if (Array.isArray(userRow)) {
                        // array might contain primitives or objects
                        const first = userRow[0];
                        if (first && typeof first === 'object') {
                            userId = first.id ?? first.user_id ?? null;
                        } else if (first !== undefined) {
                            userId = String(first);
                        }
                    } else if (typeof userRow === 'object') {
                        userId = (userRow as any).id ?? (userRow as any).user_id ?? null;
                    }

                    if (!userId) {
                        // If login result didn't return id but returned username, try to resolve id
                        const maybeUsername = (userRow && typeof userRow === 'object') ? ((userRow as any).username || (userRow as any).user_name || null) : null;
                        if (maybeUsername) {
                            const { getUserIdByUsername } = await import('./supabaseFetcher');
                            const lookedUpId = await getUserIdByUsername(maybeUsername);
                            if (lookedUpId) {
                                userId = String(lookedUpId);
                            }
                        }
                    }

                    if (!userId) {
                        // Return login payload to make debugging easier for the developer
                        return new Response(JSON.stringify({ success: false, message: 'No user id returned from login', rpc: res }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                    }

                    // Set HttpOnly cookie with user_id (simple session). Adjust Secure/SameSite for production.
                    const headers = new Headers();
                    headers.set('Content-Type', 'application/json');
                    headers.set('Access-Control-Allow-Origin', '*');
                    headers.append('Set-Cookie', `user_id=${encodeURIComponent(userId)}; Path=/; HttpOnly`);

                    // expose minimal user info
                    const usernameOut = (userRow && typeof userRow === 'object') ? ((userRow as any).username || (userRow as any).user_name || null) : null;
                    return new Response(JSON.stringify({ success: true, message: 'Logowanie udane', user: { id: userId, username: usernameOut } }), { headers });
                } catch (error) {
                    console.error('Login error:', error);
                    return new Response(JSON.stringify({ success: false, message: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
                }
            }

        // Endpoint dla automatyzacji Vinted
        if (url.pathname === "/api/vinted/automate" && req.method === "POST") {
            try {
                console.log('🚀 Starting Vinted automation from web interface...');

                // Import dynamically to avoid issues
                const { runVintedAutomationWithExistingBrowser } = await import('./vintedAutomation');

                // determine user id from cookie/header
                function getUserIdFromReqLocal(r: Request) {
                    const headerUser = r.headers.get('x-user-id');
                    if (headerUser) return headerUser;
                    const cookie = r.headers.get('cookie') || '';
                    const match = cookie.match(/(?:^|; )user_id=([^;]+)/);
                    if (match) return decodeURIComponent(match[1]);
                    return null;
                }

                const userIdForAutomation = getUserIdFromReqLocal(req);

                // Run automation in background with scoped userId
                runVintedAutomationWithExistingBrowser(userIdForAutomation || undefined)
                    .then(() => {
                        console.log('✅ Vinted automation completed successfully');
                    })
                    .catch((error) => {
                        console.error('❌ Vinted automation failed:', error);
                    });

                return new Response(JSON.stringify({
                    success: true,
                    message: "Vinted automation started. Check console for progress."
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Failed to start automation: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint do uruchomienia przeglądarki do logowania
        if (url.pathname === "/api/chrome/launch" && req.method === "POST") {
            try {
                console.log('🚀 Uruchamiam Chrome do logowania...');

                if (vintedAutomationInProgress) {
                    return new Response(JSON.stringify({
                        success: false,
                        alreadyRunning: true,
                        message: "Automatyzacja Vinted już działa. Nie uruchamiaj ponownie Chrome podczas aktywnego procesu."
                    }), {
                        status: 409,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }

                const { VintedAutomation } = await import('./vintedAutomation');
                const automation = new VintedAutomation();

                // Uruchom tylko Chrome bez automatyzacji
                const chromeStarted = await automation.startChromeWithDebugPort();

                if (chromeStarted) {
                    return new Response(JSON.stringify({
                        success: true,
                        message: "Chrome uruchomiony! Zaloguj się na Vinted, a następnie kliknij 'Podłącz automatyzację'."
                    }), {
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: "Nie udało się uruchomić Chrome"
                    }), {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd uruchamiania Chrome: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint do podłączenia automatyzacji do istniejącej przeglądarki
        if (url.pathname === "/api/vinted/connect" && req.method === "POST") {
            try {
                console.log('🔗 Podłączam automatyzację do Chrome...');

                if (vintedAutomationInProgress) {
                    return new Response(JSON.stringify({
                        success: false,
                        alreadyRunning: true,
                        message: "Automatyzacja Vinted już działa. Poczekaj na zakończenie lub zaloguj się w otwartej przeglądarce."
                    }), {
                        status: 409,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }

                const { runVintedAutomationWithExistingBrowser } = await import('./vintedAutomation');

                // determine user id from cookie/header
                function getUserIdFromReqLocal(r: Request) {
                    const headerUser = r.headers.get('x-user-id');
                    if (headerUser) return headerUser;
                    const cookie = r.headers.get('cookie') || '';
                    const match = cookie.match(/(?:^|; )user_id=([^;]+)/);
                    if (match) return decodeURIComponent(match[1]);
                    return null;
                }

                const userIdForAutomation = getUserIdFromReqLocal(req);

                vintedAutomationInProgress = true;

                // Run automation in background with scoped userId
                runVintedAutomationWithExistingBrowser(userIdForAutomation || undefined)
                    .then(() => {
                        console.log('✅ Vinted automation completed successfully');
                    })
                    .catch((error) => {
                        console.error('❌ Vinted automation failed:', error);
                    })
                    .finally(() => {
                        vintedAutomationInProgress = false;
                    });

                return new Response(JSON.stringify({
                    success: true,
                    message: "Automatyzacja podłączona! Sprawdź konsolę dla szczegółów."
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd podłączenia automatyzacji: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint for reverse scraping listings from Vinted profile (drafts first, then active)
        if (url.pathname === "/api/vinted/reverse-scrape" && req.method === "POST") {
            try {
                const body = await req.json().catch(() => ({}));
                const profileUrl = (body?.profileUrl || '').trim() || undefined;

                const { runVintedReverseScraperWithExistingBrowser, preflightVintedReverseScraperBrowser } = await import('./vintedReverseScraper');

                function getUserIdFromReqLocal(r: Request) {
                    const headerUser = r.headers.get('x-user-id');
                    if (headerUser) return headerUser;
                    const cookie = r.headers.get('cookie') || '';
                    const match = cookie.match(/(?:^|; )user_id=([^;]+)/);
                    if (match) return decodeURIComponent(match[1]);
                    return null;
                }

                const userIdForScraper = getUserIdFromReqLocal(req);

                const preflight = await preflightVintedReverseScraperBrowser();
                if (!preflight.ok) {
                    return new Response(JSON.stringify(preflight), {
                        status: 409,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }

                runVintedReverseScraperWithExistingBrowser(userIdForScraper || undefined, profileUrl)
                    .then((summary) => {
                        console.log('✅ Reverse scraper completed:', summary);
                    })
                    .catch((error) => {
                        console.error('❌ Reverse scraper failed:', error);
                    });

                return new Response(JSON.stringify({
                    success: true,
                    message: 'Reverse scraper uruchomiony. Przegląda drafty, potem aktywne i zapisuje do Firebase.'
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: 'Błąd reverse scrapera: ' + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint do przełączania statusu publikacji na Vinted
        if (url.pathname === "/api/vinted/toggle-status" && req.method === "POST") {
            try {
                const body = await req.json();
                const { advertisementId } = body;

                if (!advertisementId) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: "Brak ID ogłoszenia"
                    }), {
                        status: 400,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }

                const { toggleVintedPublishStatus } = await import('./supabaseFetcher');
                const result = await toggleVintedPublishStatus(advertisementId);

                if (result.success) {
                    return new Response(JSON.stringify({
                        success: true,
                        is_published_to_vinted: result.is_published_to_vinted,
                        message: `Status zmieniony na: ${result.is_published_to_vinted ? 'opublikowane' : 'nieopublikowane'}`
                    }), {
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: result.message || "Błąd zmiany statusu"
                    }), {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd serwera: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint do przełączania statusu publikacji na Grailed
        if (url.pathname === "/api/grailed/toggle-status" && req.method === "POST") {
            try {
                const body = await req.json();
                const { advertisementId } = body;

                if (!advertisementId) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: "Brak ID ogłoszenia"
                    }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                    });
                }

                const { toggleGrailedPublishStatus } = await import('./supabaseFetcher');
                const result = await toggleGrailedPublishStatus(advertisementId);

                if (result.success) {
                    return new Response(JSON.stringify({
                        success: true,
                        is_published_to_grailed: result.is_published_to_grailed,
                        message: `Status zmieniony na: ${result.is_published_to_grailed ? 'opublikowane' : 'nieopublikowane'}`
                    }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
                } else {
                    return new Response(JSON.stringify({ success: false, message: result.message || "Błąd zmiany statusu" }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
                }
            } catch (error) {
                return new Response(JSON.stringify({ success: false, message: "Błąd serwera: " + error }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
            }
        }

        // Endpoint do przełączania statusu sprzedaży ogłoszenia
        if (url.pathname === "/api/advertisements/toggle-sold-status" && req.method === "POST") {
            try {
                const body = await req.json();
                const { advertisementId } = body;

                if (!advertisementId) {
                    return new Response(JSON.stringify({
                        success: false,
                        message: "Brak ID ogłoszenia"
                    }), {
                        status: 400,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                    });
                }

                const { toggleAdvertisementSoldStatus } = await import('./supabaseFetcher');
                const result = await toggleAdvertisementSoldStatus(advertisementId);

                if (result.success) {
                    return new Response(JSON.stringify({
                        success: true,
                        status: result.status,
                        is_sold: result.is_sold,
                        optimization: result.optimization || null,
                        message: result.is_sold ? "Ogłoszenie oznaczone jako sprzedane" : "Ogłoszenie przywrócone jako aktywne"
                    }), {
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                    });
                }

                return new Response(JSON.stringify({
                    success: false,
                    message: result.message || "Błąd zmiany statusu sprzedaży"
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd serwera: " + error
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }
        }

        // Endpoint do ręcznej optymalizacji danych sprzedanych ogłoszeń
        if (url.pathname === "/api/advertisements/optimize-sold-storage" && req.method === "POST") {
            try {
                const body = await req.json().catch(() => ({}));
                const advertisementId = body?.advertisementId ? String(body.advertisementId) : '';
                const userId = getUserIdFromReq(req);

                if (advertisementId) {
                    const { optimizeAdvertisementStorage } = await import('./supabaseFetcher');
                    const result = await optimizeAdvertisementStorage(advertisementId);
                    return new Response(JSON.stringify(result), {
                        status: result.success ? 200 : 400,
                        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                    });
                }

                const { optimizeAllSoldAdvertisements } = await import('./supabaseFetcher');
                const result = await optimizeAllSoldAdvertisements(userId || undefined);
                return new Response(JSON.stringify(result), {
                    status: result.success ? 200 : 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd serwera: " + error
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }
        }

        // Endpoint do migracji już sprzedanych rekordów z advertisements -> sold_advertisements
        if (url.pathname === "/api/advertisements/migrate-sold-archive" && req.method === "POST") {
            try {
                const userId = getUserIdFromReq(req);
                const { migrateSoldAdvertisementsToArchive } = await import('./supabaseFetcher');
                const result = await migrateSoldAdvertisementsToArchive(userId || undefined);
                return new Response(JSON.stringify(result), {
                    status: result.success ? 200 : 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd serwera: " + error
                }), {
                    status: 500,
                    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
            }
        }

        // Endpoint dla stylów z Firebase
        if (url.pathname === "/api/styles") {
            const data = await fetchStyles();
            return new Response(JSON.stringify(data), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // Endpoint dla stylu według typu produktu
        if (url.pathname.startsWith("/api/styles/") && url.pathname !== "/api/styles") {
            const productType = decodeURIComponent(url.pathname.split("/").pop() || "");
            console.log(`Searching for style with name: "${productType}"`);
            if (productType) {
                const data = await fetchStyleByType(productType);
                console.log(`Found style data:`, data);
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint dla nagłówków opisów z Firebase
        if (url.pathname === "/api/description-headers") {
            const platform = url.searchParams.get('platform') || undefined;
            const data = await fetchDescriptionHeaders(platform);
            return new Response(JSON.stringify(data), {
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            });
        }

        // Endpoint zwracający składowany kurs PLN->USD
        if (url.pathname === '/api/exchange-rate') {
            return new Response(JSON.stringify({ rate: cachedPlnToUsdRate, fetchedAt: exchangeRateFetchedAt }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ============= DASHBOARD API ENDPOINTS =============
        
        // Status aplikacji
        if (url.pathname === '/api/status') {
            const { Logger } = await import('./logger');
            const logger = Logger.getInstance();
            
            return new Response(JSON.stringify({
                status: 'running',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Statystyki automatyzacji
        if (url.pathname === '/api/stats') {
            const { Logger } = await import('./logger');
            const logger = Logger.getInstance();
            const stats = logger.getLogStats();
            
            return new Response(JSON.stringify({
                logs: stats,
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                timestamp: new Date().toISOString()
            }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Logi z poziomu
        if (url.pathname === '/api/logs') {
            const level = url.searchParams.get('level');
            const limit = parseInt(url.searchParams.get('limit') || '100');
            
            const { Logger } = await import('./logger');
            const logger = Logger.getInstance();
            
            let logs;
            if (level) {
                logs = logger.getLogsByLevel(level);
            } else {
                logs = logger.getRecentLogs(limit);
            }
            
            return new Response(JSON.stringify({ logs }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // Lista wszystkich ogłoszeń
        if (url.pathname === '/api/advertisements') {
            const { Logger } = await import('./logger');
            const logger = Logger.getInstance();
            
            // Pobierz logi związane z ogłoszeniami
            const advertisementLogs = logger.getRecentLogs(500).filter(log => 
                log.message.includes('Advertisement') || log.message.includes('Ogłoszenie')
            );
            
            return new Response(JSON.stringify({ advertisements: advertisementLogs }), {
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
            });
        }

        // ============= GRAILED AUTOMATION ENDPOINTS =============
        
        // Endpoint uruchomienia Chrome dla Grailed
        if (url.pathname === "/api/chrome/launch-grailed") {
            try {
                console.log('🚀 Uruchamiam Chrome do logowania na Grailed...');

                const { GrailedAutomation } = await import('./grailedAutomation');
                const automation = new GrailedAutomation();

                // Uruchom tylko Chrome bez automatyzacji
                const chromeStarted = await automation.startChromeWithGrailed();

                if (chromeStarted) {
                    return new Response(JSON.stringify({
                        success: true,
                        message: "Chrome uruchomiony na Grailed! Zaloguj się, a następnie kliknij 'Uruchom automatyzację Grailed'."
                    }), {
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                } else {
                    return new Response(JSON.stringify({
                        success: false,
                        message: "Nie udało się uruchomić Chrome"
                    }), {
                        status: 500,
                        headers: {
                            "Content-Type": "application/json",
                            "Access-Control-Allow-Origin": "*"
                        }
                    });
                }
            } catch (error) {
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd uruchamiania Chrome: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint automatyzacji Grailed
        if (url.pathname === "/api/grailed/automate" && req.method === "POST") {
            try {
                const { runGrailedAutomationWithExistingBrowser } = await import('./grailedAutomation');

                // determine user id from cookie/header
                function getUserIdFromReqLocal(r: Request) {
                    const headerUser = r.headers.get('x-user-id');
                    if (headerUser) return headerUser;
                    const cookie = r.headers.get('cookie') || '';
                    const match = cookie.match(/(?:^|; )user_id=([^;]+)/);
                    if (match) return decodeURIComponent(match[1]);
                    return null;
                }

                const userIdForAutomation = getUserIdFromReqLocal(req);

                // run in background, pass scoped userId
                runGrailedAutomationWithExistingBrowser(userIdForAutomation || undefined)
                    .then(() => console.log('✅ Grailed automation completed successfully'))
                    .catch(err => console.error('❌ Grailed automation failed:', err));

                return new Response(JSON.stringify({
                    success: true,
                    message: "Automatyzacja Grailed została uruchomiona"
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            } catch (error) {
                console.error("Grailed automation error:", error);
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd automatyzacji Grailed: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Endpoint automatyzacji zmiany cen Vinted
        if (url.pathname === "/api/vinted/price-automation" && req.method === "POST") {
            try {
                const { runVintedPriceAutomationWithExistingBrowser } = await import('./vintedPriceAutomation');

                // Pobierz parametry z body żądania
                const body = await req.json().catch(() => ({}));
                const profileUrl = body.profileUrl; // Może być undefined
                const startFrom = parseInt(body.startFrom) || 1;
                const limit = body.limit === undefined ? -1 : parseInt(body.limit); // -1 = wszystkie ogłoszenia
                const discount = parseInt(body.discount) || 25; // domyślnie 25%

                console.log('🏷️ Uruchamianie automatyzacji zmiany cen Vinted...');
                if (profileUrl) {
                    // Walidacja URL jeśli podany
                    if (!profileUrl.includes('vinted.pl/member/') || !profileUrl.match(/\/member\/\d+/)) {
                        return new Response(JSON.stringify({
                            success: false,
                            message: 'Nieprawidłowy URL profilu. Powinien być w formacie: https://www.vinted.pl/member/12345678'
                        }), {
                            status: 400,
                            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
                        });
                    }
                    console.log(`🔗 Używam podanego URL profilu: ${profileUrl}`);
                } else {
                    console.log('🔍 Automatyczne wykrywanie profilu zalogowanego użytkownika...');
                }
                
                const limitText = limit === -1 ? 'wszystkie' : `${limit}`;
                console.log(`⚙️ Parametry: start od ${startFrom}, limit ${limitText} ogłoszeń, zniżka ${discount}%`);

                // Uruchom automatyzację w tle z nowymi parametrami
                runVintedPriceAutomationWithExistingBrowser(profileUrl, startFrom, limit, discount)
                    .then(() => console.log('✅ Vinted price automation completed successfully'))
                    .catch(err => console.error('❌ Vinted price automation failed:', err));

                return new Response(JSON.stringify({
                    success: true,
                    message: "Automatyzacja zmiany cen Vinted została uruchomiona"
                }), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            } catch (error) {
                console.error("Vinted price automation error:", error);
                return new Response(JSON.stringify({
                    success: false,
                    message: "Błąd automatyzacji zmiany cen Vinted: " + error
                }), {
                    status: 500,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }
        }

        // Wszystkie nieobsłużone ścieżki /api/* zwracają JSON 404
        if (url.pathname.startsWith('/api/')) {
            return new Response(JSON.stringify({
                success: false,
                message: `Nieznany endpoint API: ${url.pathname}`
            }), {
                status: 404,
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        }

        // Obsługa głównej strony
        if (url.pathname === "/" || url.pathname === "/index.html") {
            return new Response(Bun.file("./index.html"));
        }
        
        // Ignoruj żądania favicon.ico
        if (url.pathname === "/favicon.ico") {
            return new Response(null, { status: 204 });
        }
        
        // Obsługa plików statycznych tylko dla metod odczytu
        if (req.method !== "GET" && req.method !== "HEAD") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        // Obsługa plików statycznych
        let filePath = "." + url.pathname;
        if (url.pathname.startsWith('/src/')) {
            filePath = url.pathname.substring(1); // Usuń początkowy slash
        }
        const file = Bun.file(filePath);
        
        // Ustaw odpowiedni Content-Type
        const headers = new Headers();
        if (url.pathname.endsWith('.css')) {
            headers.set('Content-Type', 'text/css');
        } else if (url.pathname.endsWith('.js')) {
            headers.set('Content-Type', 'application/javascript; charset=utf-8');
            headers.set('Cache-Control', 'no-cache');
        }
        
        return new Response(file, { headers });
    } catch (error) {
        console.error(`Error serving ${url.pathname}:`, error);
        return new Response(JSON.stringify({
            success: false,
            message: "Błąd serwera: " + error
        }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

        // ============= DASHBOARD FRONTEND =============
        
        // Serwowanie dashboard.html
        if (url.pathname === '/dashboard' || url.pathname === '/dashboard.html') {
            try {
                const { promises: fs } = await import('fs');
                const path = await import('path');
                
                const dashboardPath = path.join(process.cwd(), 'dashboard.html');
                const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');
                
                return new Response(dashboardContent, {
                    headers: { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' }
                });
            } catch (error) {
                return new Response('Dashboard not found', { 
                    status: 404,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        }

        // ============= DASHBOARD FRONTEND =============
        
        // Serwowanie dashboard.html
        if (url.pathname === '/dashboard' || url.pathname === '/dashboard.html') {
            try {
                const { promises: fs } = await import('fs');
                const path = await import('path');
                
                const dashboardPath = path.join(process.cwd(), 'dashboard.html');
                const dashboardContent = await fs.readFile(dashboardPath, 'utf-8');
                
                return new Response(dashboardContent, {
                    headers: { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*' }
                });
            } catch (error) {
                return new Response('Dashboard not found', { 
                    status: 404,
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        }

        return new Response("404 Not Found", { status: 404 });
}

// Try to start server on DEFAULT_PORT, retrying with higher ports if occupied
let server: any = null;
let port = DEFAULT_PORT;
const maxAttempts = 10;
// Fetch exchange rate once at startup (best-effort)
fetchAndCacheExchangeRateOnce().catch(err => console.warn('exchange-rate startup fetch failed', err));
for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
        server = serve({ port, fetch: handleFetch });
        break;
    } catch (err) {
        const code = (err as any)?.code;
        if (code === 'EADDRINUSE' || (err as any)?.message?.includes('EADDRINUSE')) {
            console.error(`Port ${port} is in use, trying ${port + 1}...`);
            port++;
            continue;
        }
        console.error('Failed to start server:', err);
        process.exit(1);
    }
}

if (!server) {
    console.error(`Unable to bind to a port after ${maxAttempts} attempts. Exiting.`);
    process.exit(1);
}

// Beautiful server startup message
const { Logger } = await import('./logger');
const logger = Logger.getInstance();

await logger.banner('APLIKACJA DO WSTAWIANIA OGŁOSZEŃ');
await logger.success(`Main App: http://localhost:${port}`);
await logger.separator();
