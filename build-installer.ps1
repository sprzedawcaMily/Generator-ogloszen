# Automatyczny build instalatora - Generator Ogloszen
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  GENERATOR OGLOSZEN - BUILD" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Sprawdz czy Inno Setup jest zainstalowany
$innoSetupPath = "C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
$innoSetupPath2 = "C:\Program Files\Inno Setup 6\ISCC.exe"

if (Test-Path $innoSetupPath) {
    $compiler = $innoSetupPath
} elseif (Test-Path $innoSetupPath2) {
    $compiler = $innoSetupPath2
} else {
    Write-Host "[BLAD] Inno Setup nie jest zainstalowany!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Pobierz i zainstaluj z: https://jrsoftware.org/isdl.php" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "[OK] Znaleziono Inno Setup" -ForegroundColor Green
Write-Host "Sciezka: $compiler" -ForegroundColor Gray
Write-Host ""

# Sprawdz plik installer.iss
if (!(Test-Path "installer.iss")) {
    Write-Host "[BLAD] Brak pliku installer.iss!" -ForegroundColor Red
    pause
    exit 1
}

# Utworz folder wyjsciowy
if (!(Test-Path "installer-output")) {
    New-Item -Path "installer-output" -ItemType Directory | Out-Null
    Write-Host "[OK] Utworzono folder installer-output/" -ForegroundColor Green
}

# Kompiluj
Write-Host "[INFO] Kompilowanie instalatora..." -ForegroundColor Cyan
Write-Host ""

try {
    & $compiler "installer.iss"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host "  SUKCES!" -ForegroundColor Green
        Write-Host "=====================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Instalator gotowy:" -ForegroundColor Green
        Write-Host "installer-output\GeneratorOgloszen-Setup.exe" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Mozesz teraz:" -ForegroundColor Yellow
        Write-Host "1. Wyslac plik GeneratorOgloszen-Setup.exe" -ForegroundColor White
        Write-Host "2. Uzytkownicy klikna 2x i zainstaluja" -ForegroundColor White
        Write-Host "3. Ikonka pojawi sie na pulpicie" -ForegroundColor White
        Write-Host ""
        
        # Otworz folder
        Start-Process "installer-output"
    } else {
        Write-Host ""
        Write-Host "[BLAD] Kompilacja nie powiodla sie!" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "[BLAD] Problem:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
pause
