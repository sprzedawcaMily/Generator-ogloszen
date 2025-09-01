# Skrypt do uruchamiania Chrome z debug portem
Write-Host "🚀 Uruchamiam Chrome z debug portem..." -ForegroundColor Green

# Zamknij istniejące procesy Chrome
Write-Host "🔄 Zamykam istniejące procesy Chrome..." -ForegroundColor Yellow
try {
    Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} catch {
    # Ignoruj błędy
}

# Utwórz katalog debug
$debugDir = "C:\temp\chrome-debug"
if (-not (Test-Path $debugDir)) {
    Write-Host "📁 Tworzę katalog debug: $debugDir" -ForegroundColor Cyan
    New-Item -Path $debugDir -ItemType Directory -Force | Out-Null
}

# Uruchom Chrome
Write-Host "🔵 Uruchamiam Chrome z debug portem na porcie 9222..." -ForegroundColor Blue
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (Test-Path $chromePath) {
    & $chromePath --remote-debugging-port=9222 --user-data-dir="$debugDir" --no-first-run --no-default-browser-check --disable-default-apps https://www.vinted.pl
    Write-Host "✅ Chrome uruchomiony!" -ForegroundColor Green
    Write-Host "📱 Zaloguj się na Vinted w otwartej przeglądarce" -ForegroundColor Yellow
    Write-Host "🔄 Następnie w innym terminalu uruchom: bun run direct" -ForegroundColor Cyan
} else {
    Write-Host "❌ Nie znaleziono Chrome w: $chromePath" -ForegroundColor Red
    Write-Host "🔍 Sprawdź czy Chrome jest zainstalowany" -ForegroundColor Yellow
}
