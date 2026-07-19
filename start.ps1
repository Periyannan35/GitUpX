# GitUpX Production Startup Script (PowerShell for Windows 10/11)
# Highly resilient against Windows Smart App Control and Administrator PATH issues.

$Host.UI.RawUI.WindowTitle = "GitUpX - Production AI Repository Sanitizer"
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location -Path $scriptPath

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "                      GitUpX: AI Repository Sanitizer                          " -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "[System] Working Directory: $pwd" -ForegroundColor Gray
Write-Host ""

# Check Node.js in Path
$nodePath = Get-Command "npm" -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "[Notice] npm not found in system PATH. Checking User AppData paths..." -ForegroundColor Yellow
    $env:PATH += ";$env:APPDATA\npm;$env:LOCALAPPDATA\Programs\node;C:\Program Files\nodejs"
    $nodePath = Get-Command "npm" -ErrorAction SilentlyContinue
}

if (-not $nodePath) {
    Write-Host "[ERROR] Node.js / npm command not found!" -ForegroundColor Red
    Write-Host "If Windows Smart App Control blocked Node.js, or if Node is not installed:" -ForegroundColor Yellow
    Write-Host "Please install Node.js from https://nodejs.org and restart this script." -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit 1
}

# Ensure dependencies installed
if (-not (Test-Path "node_modules\vite")) {
    Write-Host "[Frontend] Installing Node.js dependencies..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Node.js package installation failed! Check Smart App Control or internet." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit 1
    }
}

# Check Python environment
$pythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
if ($pythonCmd) {
    Write-Host "[Backend] Checking Python environment and libraries..." -ForegroundColor Cyan
    python -c "import fastapi, uvicorn, pydantic, sklearn, tree_sitter, github, psutil" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[Backend] Installing required Python libraries..." -ForegroundColor Yellow
        python -m pip install -r requirements.txt
    }
    Write-Host "[Backend] Starting FastAPI engine on port 8000 in background..." -ForegroundColor Green
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.server:app --host 0.0.0.0 --port 8000" -WindowStyle Hidden
} else {
    Write-Host "[WARNING] Python not found in PATH. Using Real-Time Interactive Local Engine!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host "[SUCCESS] All systems initialized! Launching GitUpX UI..." -ForegroundColor Green
Write-Host "[INFO] Your default web browser will open at http://localhost:3000" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Green
Write-Host ""

# Launch Browser
Start-Process "http://localhost:3000"

# Start Vite
npm run dev

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Yellow
Write-Host "[NOTICE] Development server stopped. Press Enter to close window." -ForegroundColor Yellow
Read-Host "Press Enter to exit..."
