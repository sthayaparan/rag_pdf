$dir = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"
$url = "http://localhost:3000"

function Test-Up { try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; $true } catch { $false } }

if (Test-Up) {
    Write-Host "Frontend is already running at $url. Run stop-frontend.ps1 first to restart it."
    exit 0
}

Push-Location $dir
npm install
if ($LASTEXITCODE) { exit 1 }
npm run build
if ($LASTEXITCODE) { exit 1 }
Pop-Location

$process = Start-Process "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $dir `
    -WindowStyle Hidden -PassThru -RedirectStandardOutput "$PSScriptRoot\frontend.log" -RedirectStandardError "$PSScriptRoot\frontend.err.log"

while (-not (Test-Up)) {
    if ($process.HasExited) {
        Write-Host "Frontend exited. See scripts\frontend.err.log"
        exit 1
    }
    Start-Sleep -Seconds 1
}
Set-Content "$PSScriptRoot\frontend.pid" $process.Id
Write-Host "Frontend ready at $url"
