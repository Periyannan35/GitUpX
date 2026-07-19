@echo off
setlocal
title GitUpX - Production AI Repository Sanitizer
color 0B

REM ==============================================================================
REM GitUpX Production Startup Script for Windows (10/11)
REM Resilient against Smart App Control, Defender, and Admin PATH issues.
REM ==============================================================================

REM Step 0: Set correct working directory to script location
cd /d "%~dp0"

echo ==============================================================================
echo                      GitUpX: AI Repository Sanitizer                          
echo ==============================================================================
echo [System] Current Working Directory: %CD%
echo.

REM Step 1: Check if Windows Smart App Control or Defender blocked execution
if not exist "package.json" (
    color 0C
    echo [ERROR] package.json not found in current directory!
    echo If you ran this as Administrator, Windows may have redirected the folder.
    echo Please right-click start.bat -^> Properties -^> check "Unblock" -^> OK.
    echo.
    pause
    exit /b 1
)

REM Step 2: Check Node.js and NPM in Admin PATH (check user directories if missing)
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [Notice] npm not found in default PATH. Searching local user directories...
    if exist "%APPDATA%\npm\npm.cmd" set "PATH=%PATH%;%APPDATA%\npm"
    if exist "%LOCALAPPDATA%\Programs\node\npm.cmd" set "PATH=%PATH%;%LOCALAPPDATA%\Programs\node"
    if exist "C:\Program Files\nodejs\npm.cmd" set "PATH=%PATH%;C:\Program Files\nodejs"
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    color 0E
    echo [WARNING] Node.js / npm command not found!
    echo If Windows Smart App Control blocked Node.js, or if Node is not installed:
    echo Please install Node.js from https://nodejs.org and restart this script.
    echo.
    pause
    exit /b 1
)

REM Step 3: Install Node.js packages if vite is missing
if not exist "node_modules\vite" goto :install_node
goto :check_python

:install_node
echo [Frontend] Installing Node.js dependencies (this may take a minute)...
call npm install
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Node.js package installation failed!
    echo Possible causes:
    echo 1. Windows Smart App Control or Antivirus blocked npm.
    echo 2. No internet connection.
    echo Solution: Right-click start.bat -^> Properties -^> Unblock, then run again.
    echo.
    pause
    exit /b 1
)

:check_python
echo [Backend] Checking Python environment...
where python >nul 2>nul
if %errorlevel% neq 0 goto :python_missing

echo [Backend] Checking required Python libraries...
python -c "import fastapi, uvicorn, pydantic, sklearn, tree_sitter, github, psutil" >nul 2>nul
if %errorlevel% equ 0 goto :start_backend

echo [Backend] Installing required Python libraries from requirements.txt...
echo [Backend] You will see live download progress below...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    color 0E
    echo.
    echo [WARNING] Some Python libraries failed to install or were blocked by Smart App Control.
    echo The frontend UI will operate in Real-Time Interactive Local Engine mode!
    echo.
    goto :start_frontend
)

:start_backend
echo [Backend] Starting FastAPI AI Engine on port 8000 in background...
start /B "GitUpX Backend" python -m uvicorn backend.server:app --host 0.0.0.0 --port 8000
goto :start_frontend

:python_missing
color 0E
echo [WARNING] Python not found in system PATH.
echo GitUpX UI will automatically use the Real-Time Interactive Local Engine!
echo.

:start_frontend
echo ==============================================================================
echo [SUCCESS] All systems initialized! Launching GitUpX UI...
echo [INFO] Your default web browser will open automatically at http://localhost:3000
echo ==============================================================================
echo.

REM Open web browser after 2 second delay
start "" "http://localhost:3000"

echo [Frontend] Starting Vite development server on port 3000...
call npm run dev

color 0C
echo.
echo ==============================================================================
echo [NOTICE] The Vite development server has stopped or closed.
echo If Windows Smart App Control closed it immediately:
echo 1. Go to Windows Security -^> App ^& browser control -^> Smart App Control settings.
echo 2. Set Smart App Control to 'Evaluation' or 'Off' or Unblock the project folder.
echo ==============================================================================
echo.
pause


