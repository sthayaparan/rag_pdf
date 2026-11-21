$dir = Join-Path (Split-Path $PSScriptRoot -Parent) "backend"
$url = "http://localhost:8000/api/health"

function Test-Up { try { Invoke-RestMethod $url -TimeoutSec 3 | Out-Null; $true } catch { $false } }

if (Test-Up) {
    Write-Host "Backend is already running at http://localhost:8000. Run stop-backend.ps1 first to restart it."
    exit 0
}

Push-Location $dir
uv sync
if ($LASTEXITCODE) { exit 1 }
Pop-Location

$process = Start-Process "uv" -ArgumentList "run", "uvicorn", "app.main:app", "--port", "8000" -WorkingDirectory $dir `
    -WindowStyle Hidden -PassThru -RedirectStandardOutput "$PSScriptRoot\backend.log" -RedirectStandardError "$PSScriptRoot\backend.err.log"

Write-Host "Waiting for the backend (the first start embeds the PDFs and can take several minutes)..."
while (-not (Test-Up)) {
    if ($process.HasExited) {
        Write-Host "Backend exited. See scripts\backend.err.log"
        exit 1
    }
    Start-Sleep -Seconds 2
}
Set-Content "$PSScriptRoot\backend.pid" $process.Id
Write-Host "Backend ready at http://localhost:8000"
