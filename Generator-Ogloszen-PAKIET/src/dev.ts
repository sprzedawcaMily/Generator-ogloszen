import { spawn } from 'child_process';
import { execSync } from 'child_process';

function killPort(port: number) {
    try {
        // Znajdź proces na danym porcie
        const cmd = `netstat -ano | findstr :${port}`;
        const output = execSync(cmd).toString();
        
        // Wyciągnij PID z outputu
        const matches = output.match(/LISTENING\s+(\d+)/);
        if (matches && matches[1]) {
            const pid = matches[1];
            console.log(`Killing process ${pid} on port ${port}`);
            execSync(`taskkill /F /PID ${pid}`);
        }
    } catch (error) {
        // Ignoruj błędy jeśli nie znaleziono procesu
        console.log(`No process found on port ${port}`);
    }
}

function startServer() {
    console.log('Starting server...');
    const server = spawn('bun', ['run', 'src/server.ts'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (error) => {
        console.error('Failed to start server:', error);
    });

    // Obsługa CTRL+C
    process.on('SIGINT', () => {
        server.kill();
        process.exit();
    });
}

// Główna funkcja
console.log('Cleaning up port 3001...');
killPort(3001);

// Poczekaj chwilę przed uruchomieniem serwera
setTimeout(() => {
    startServer();
}, 1000);
