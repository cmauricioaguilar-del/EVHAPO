# EVHAPO - Script de inicio (PowerShell)
$pythonExe = "C:\Users\pc\AppData\Local\Python\pythoncore-3.14-64\python.exe"
if (-not (Test-Path $pythonExe)) { $pythonExe = "python" }

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "  EVHAPO - Diagnostico Mental Jugador de Poker" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""

Set-Location "$PSScriptRoot\backend"

Write-Host "Instalando dependencias..." -ForegroundColor Cyan
& $pythonExe -m pip install -r requirements.txt -q

Write-Host ""
Write-Host "Iniciando servidor en http://localhost:5000" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:5000"
& $pythonExe app.py
