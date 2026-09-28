# Launch FastAPI Backend Server
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "LAUNCHING FASTAPI HYBRID CLOUD-EDGE SURVEILLANCE BACKEND (Port 8000)" -ForegroundColor Green
Write-Host "=========================================================================" -ForegroundColor Cyan
Set-Location $PSScriptRoot
py -3.10 server.py
