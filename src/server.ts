import { serve } from "bun";
import { fetchAdvertisements, fetchCompletedAdvertisements, fetchIncompleteAdvertisements, fetchStyles, fetchDescriptionHeaders, fetchStyleByType } from './supabaseFetcher';

const server = serve({
    port: 3001,
    async fetch(req) {
        const url = new URL(req.url);
        console.log(`Otrzymano żądanie: ${url.pathname}`);
        
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
