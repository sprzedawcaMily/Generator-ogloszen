# Export script for "Aplikacja do wstawiania ogloszen"
# Creates a zip archive of the project suitable for sending to another user.
# Usage: .\export.ps1 -OutFile "app-export.zip"
param(
    [string]$OutFile = "app-export.zip",
    [string]$ProjectRoot = (Get-Location).Path
)

Write-Output "Packaging project from: $ProjectRoot"

# Paths to exclude
$exclude = @('.git','node_modules','bun.lock','temp','dist','logs','*.zip')

# Collect files
$files = Get-ChildItem -Path $ProjectRoot -Recurse -File | Where-Object {
    $full = $_.FullName
    foreach ($e in $exclude) {
        if ($full -like "*$e*") { return $false }
    }
    return $true
}

if (Test-Path $OutFile) { Remove-Item $OutFile -Force }

# Create temporary staging folder
$staging = Join-Path $env:TEMP ([Guid]::NewGuid().ToString())
New-Item -Path $staging -ItemType Directory | Out-Null

foreach ($f in $files) {
    $target = Join-Path $staging ($f.FullName.Substring($ProjectRoot.Length).TrimStart('\'))
    $tDir = Split-Path $target -Parent
    if (!(Test-Path $tDir)) { New-Item -Path $tDir -ItemType Directory -Force | Out-Null }
    Copy-Item $f.FullName -Destination $target -Force
}

# Create zip
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $OutFile -Force

# Clean up
Remove-Item $staging -Recurse -Force

Write-Output "Created $OutFile"
