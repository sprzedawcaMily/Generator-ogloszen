$sourcePath = $PSScriptRoot
$zipPath = Join-Path $PSScriptRoot "aplikacja-do-ogloszen.zip"

# Zatrzymaj serwer Bun jeśli działa
taskkill /F /IM bun.exe 2>$null

# Usuń stary plik ZIP jeśli istnieje
if (Test-Path $zipPath) {
    Remove-Item $zipPath
}

# Lista plików i folderów do spakowania
$filesToInclude = @(
    "src",
    "static",
    "package.json",
    "tsconfig.json",
    "INSTRUKCJA.md",
    "instaluj-bun.ps1"
)

# Utwórz tymczasowy folder
$tempFolder = Join-Path $PSScriptRoot "temp_to_zip"
New-Item -ItemType Directory -Path $tempFolder -Force

# Skopiuj potrzebne pliki do tymczasowego folderu
foreach ($item in $filesToInclude) {
    $sourcePath = Join-Path $PSScriptRoot $item
    $destPath = Join-Path $tempFolder $item
    Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
}

# Utwórz archiwum ZIP
Compress-Archive -Path "$tempFolder\*" -DestinationPath $zipPath -Force

# Usuń tymczasowy folder
Remove-Item -Path $tempFolder -Recurse -Force

Write-Host "Plik ZIP został utworzony: $zipPath"

# Uruchom serwer ponownie
try {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Start-Process -NoNewWindow -FilePath "bun.exe" -ArgumentList "run", "dev"
    Write-Host "Serwer został ponownie uruchomiony"
} catch {
    Write-Host "Nie udało się automatycznie uruchomić serwera. Uruchom go ręcznie komendą: bun run dev"
}
