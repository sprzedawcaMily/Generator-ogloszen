import { serve } from "bun";
import { fetchAdvertisements, fetchCompletedAdvertisements, fetchIncompleteAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType } from './supabaseFetcher';

const server = serve({
    port: 3001,
    async fetch(req) {
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

            // Endpoint dla ukończonych reklam (domyślnie)
            if (url.pathname === "/api/advertisements") {
                const data = await fetchCompletedAdvertisements();
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint dla wszystkich reklam z Supabase
            if (url.pathname === "/api/advertisements/all") {
                const data = await fetchAdvertisements();
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint dla ukończonych reklam z Supabase
            if (url.pathname === "/api/advertisements/completed") {
                const data = await fetchCompletedAdvertisements();
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint dla nieukończonych reklam z Supabase
            if (url.pathname === "/api/advertisements/incomplete") {
                const data = await fetchIncompleteAdvertisements();
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
                });
            }

            // Endpoint dla automatyzacji Vinted
            if (url.pathname === "/api/vinted/automate" && req.method === "POST") {
                try {
                    console.log('🚀 Starting Vinted automation from web interface...');
                    
                    // Import dynamically to avoid issues
                    const { runVintedAutomationWithExistingBrowser } = await import('./vintedAutomation');
                    
                    // Run automation in background
                    runVintedAutomationWithExistingBrowser()
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
                    
                    const { runVintedAutomationWithExistingBrowser } = await import('./vintedAutomation');
                    
                    // Run automation in background
                    runVintedAutomationWithExistingBrowser()
                        .then(() => {
                            console.log('✅ Vinted automation completed successfully');
                        })
                        .catch((error) => {
                            console.error('❌ Vinted automation failed:', error);
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

            // Endpoint dla stylów z Supabase
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

            // Endpoint dla nagłówków opisów z Supabase
            if (url.pathname === "/api/description-headers") {
                const data = await fetchDescriptionHeaders();
                return new Response(JSON.stringify(data), {
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "*"
                    }
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
                        message: "Błąd uruchomienia Chrome: " + error 
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
                    const result = await runGrailedAutomationWithExistingBrowser();
                    
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

            // Obsługa głównej strony
            if (url.pathname === "/" || url.pathname === "/index.html") {
                return new Response(Bun.file("./index.html"));
            }
            
            // Ignoruj żądania favicon.ico
            if (url.pathname === "/favicon.ico") {
                return new Response(null, { status: 204 });
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
            return new Response("404 Not Found", { status: 404 });
        }
    },
});

console.log(`Serwer uruchomiony na http://localhost:${server.port}`);

console.log(`Serwer uruchomiony na http://localhost:${server.port}`);
