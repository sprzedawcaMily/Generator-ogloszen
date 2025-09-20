# Helper script to run the app with minimal steps on Windows PowerShell
# Usage: .\run-app.ps1

param(
    [switch]$NoInstallBun
)

function Write-Info($m) { Write-Host $m -ForegroundColor Cyan }
function Write-Warn($m) { Write-Host $m -ForegroundColor Yellow }
function Write-Err($m) { Write-Host $m -ForegroundColor Red }

Write-Info "Running helper script: run-app.ps1"

# 1) Check for Bun
$bunPath = (Get-Command bun -ErrorAction SilentlyContinue).Path
if (-not $bunPath) {
    Write-Warn "Bun not found in PATH. Please install Bun from https://bun.sh/ and ensure 'bun' is accessible."
    if (-not $NoInstallBun) {
        Write-Info "You can install Bun manually or re-run this script with -NoInstallBun to skip."
        Write-Err "Aborting. Install Bun first and run again."; exit 1
    }
}

# 2) Load .env if present
$envFile = Join-Path (Get-Location) '.env'
if (Test-Path $envFile) {
    Write-Info "Loading .env"
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^\s*#") { continue }
        if ($_ -match "^\s*$") { continue }
        $parts = $_ -split '='
        if ($parts.Length -ge 2) {
            $key = $parts[0].Trim()
            $val = ($parts[1..($parts.Length-1)] -join '=').Trim()
            Write-Info "Setting env $key"
            try {
                Set-Item -Path "Env:$key" -Value $val -ErrorAction Stop
            } catch {
                # fallback to .NET API if Set-Item fails
                [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
            }
        }
    }
} else {
    Write-Warn ".env not found - using defaults or environment variables if set"
}

# 3) Ensure PORT default
if (-not $env:PORT) {
    $env:PORT = '3001'
    Write-Info 'PORT not set - defaulting to 3001'
}
if (-not $env:GRAILED_PRICE_PERCENTAGE) {
    $env:GRAILED_PRICE_PERCENTAGE = '15'
    Write-Info 'GRAILED_PRICE_PERCENTAGE not set - defaulting to 15'
}

# 4) Start the server
Write-Info "Starting server: bun run start"
try {
    bun run start
} catch {
    Write-Err "Failed to start via bun. Ensure Bun is installed and available in PATH."
    exit 1
}
