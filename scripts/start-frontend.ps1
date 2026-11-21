$dir = Join-Path (Split-Path $PSScriptRoot -Parent) "frontend"

Push-Location $dir
npm install
if ($LASTEXITCODE) { exit 1 }
npm run build
if ($LASTEXITCODE) { exit 1 }
Pop-Location

$process = Start-Process "npm.cmd" -ArgumentList "run", "start" -WorkingDirectory $dir `
    -WindowStyle Hidden -PassThru -RedirectStandardOutput "$PSScriptRoot\frontend.log" -RedirectStandardError "$PSScriptRoot\frontend.err.log"
Set-Content "$PSScriptRoot\frontend.pid" $process.Id

while ($true) {
    if ($process.HasExited) {
        Write-Host "Frontend exited. See scripts\frontend.err.log"
        exit 1
    }
    try {
        Invoke-WebRequest "http://localhost:3000" -UseBasicParsing | Out-Null
        break
    } catch {
        Start-Sleep -Seconds 1
    }
}
Write-Host "Frontend ready at http://localhost:3000"
