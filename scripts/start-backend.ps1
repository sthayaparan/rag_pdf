$dir = Join-Path (Split-Path $PSScriptRoot -Parent) "backend"

Push-Location $dir
uv sync
if ($LASTEXITCODE) { exit 1 }
Pop-Location

$process = Start-Process "uv" -ArgumentList "run", "uvicorn", "app.main:app", "--port", "8000" -WorkingDirectory $dir `
    -WindowStyle Hidden -PassThru -RedirectStandardOutput "$PSScriptRoot\backend.log" -RedirectStandardError "$PSScriptRoot\backend.err.log"
Set-Content "$PSScriptRoot\backend.pid" $process.Id

Write-Host "Waiting for the backend (the first start embeds the PDFs and can take several minutes)..."
while ($true) {
    if ($process.HasExited) {
        Write-Host "Backend exited. See scripts\backend.err.log"
        exit 1
    }
    try {
        Invoke-RestMethod "http://localhost:8000/api/health" | Out-Null
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}
Write-Host "Backend ready at http://localhost:8000"
