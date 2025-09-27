# Skrypt PowerShell do instalacji Bun na Windows
Write-Host "Pobieranie i instalacja Bun..."

# Pobierz instalator Bun dla Windows (x64)
$bunInstallerUrl = "https://bun.sh/install.ps1"
$installerPath = "$env:TEMP\bun-install.ps1"

Invoke-WebRequest -Uri $bunInstallerUrl -OutFile $installerPath

# Uruchom instalator
Write-Host "Uruchamianie instalatora Bun..."
& powershell -ExecutionPolicy Bypass -File $installerPath

