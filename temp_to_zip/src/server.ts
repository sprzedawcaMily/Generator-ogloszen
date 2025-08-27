import { serve } from "bun";

const server = serve({
    port: 3001,
    fetch(req) {
        const url = new URL(req.url);
        
        try {
            // Ignoruj żądania devtools
            if (url.pathname.includes('.well-known/appspecific/com.chrome.devtools')) {
                return new Response(null, { status: 404 });
            }

            // Obsługa głównej strony
            if (url.pathname === "/" || url.pathname === "/index.html") {
                return new Response(Bun.file("./static/index.html"));
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
