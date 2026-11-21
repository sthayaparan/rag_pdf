$pidFile = "$PSScriptRoot\backend.pid"
if (Test-Path $pidFile) {
    taskkill /PID (Get-Content $pidFile) /T /F | Out-Null
    Remove-Item $pidFile
    Write-Host "Stopped backend"
}
