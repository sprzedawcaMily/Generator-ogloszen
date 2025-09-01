Write-Host "🚀 Uruchamianie Chrome z debug portem..." -ForegroundColor Green
Write-Host ""
Write-Host "📋 To jest skrypt pomocniczy do uruchomienia Chrome" -ForegroundColor Yellow
Write-Host "   w trybie debug, który pozwoli Puppeteer się połączyć" -ForegroundColor Yellow
Write-Host ""

# Zamknij wszystkie procesy Chrome
Write-Host "🔄 Zamykanie istniejących procesów Chrome..." -ForegroundColor Cyan
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Utwórz folder tymczasowy jeśli nie istnieje
if (!(Test-Path "C:\temp")) { New-Item -ItemType Directory -Path "C:\temp" -Force | Out-Null }
if (!(Test-Path "C:\temp\chrome-debug")) { New-Item -ItemType Directory -Path "C:\temp\chrome-debug" -Force | Out-Null }

# Ścieżka do Chrome
$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"

if (!(Test-Path $chromePath)) {
    Write-Host "❌ Nie znaleziono Chrome w standardowej lokalizacji!" -ForegroundColor Red
    Write-Host "   Sprawdź czy Chrome jest zainstalowany w: $chromePath" -ForegroundColor Red
    Read-Host "Naciśnij Enter aby kontynuować"
    exit 1
}

# Uruchom Chrome z debug portem
Write-Host "🌐 Uruchamianie Chrome z debug portem..." -ForegroundColor Green
Write-Host ""
Write-Host "✅ Chrome zostanie uruchomiony z portem debug 9222" -ForegroundColor Green
Write-Host "✅ Możesz teraz zalogować się na Vinted" -ForegroundColor Green
Write-Host "✅ Potem uruchom: bun run vinted-existing" -ForegroundColor Green
Write-Host ""

Start-Process -FilePath $chromePath -ArgumentList @(
    "--remote-debugging-port=9222",
    "--user-data-dir=C:\temp\chrome-debug",
    "https://www.vinted.pl"
)

Write-Host "📝 Chrome został uruchomiony!" -ForegroundColor Green
Write-Host "💡 Zaloguj się na Vinted, a potem uruchom: " -NoNewline -ForegroundColor Yellow
Write-Host "bun run vinted-existing" -ForegroundColor Cyan
Write-Host ""
Read-Host "Naciśnij Enter aby zamknąć to okno"
