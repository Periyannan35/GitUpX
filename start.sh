#!/bin/bash
# GitUpX Production Startup Script (Linux/macOS)
# Initializes environment, installs python & node dependencies if needed, and boots services.

# Ensure script executes in its own directory
cd "$(dirname "$0")" || exit 1

echo "=========================================================="
echo "       GitUpX: AI-Powered Repository Sanitizer            "
echo "=========================================================="
echo "Checking environment dependencies in: $(pwd)..."
echo ""

# Step 1: Ensure Node.js dependencies are installed properly
if [ ! -d "node_modules/vite" ]; then
    echo "[Frontend] Installing Node.js dependencies (this may take a minute)..."
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[ERROR] Node.js package installation failed!"
        echo "Please ensure you have Node.js installed and an active internet connection."
        exit 1
    fi
fi

# Step 2: Check Python virtual environment or system python
if command -v python3 &>/dev/null; then
    PYTHON_CMD=python3
elif command -v python &>/dev/null; then
    PYTHON_CMD=python
else
    echo "[Warning] Python not found in PATH. Backend API will run in mock/demo fallback mode."
    PYTHON_CMD=""
fi

if [ -n "$PYTHON_CMD" ]; then
    echo "[Backend] Checking Python dependencies..."
    if $PYTHON_CMD -c "import fastapi, uvicorn, pydantic, sklearn, tree_sitter, github, psutil" &>/dev/null; then
        echo "[Backend] All required Python libraries are already installed! Skipping pip install."
    else
        echo "[Backend] Installing required Python libraries from requirements.txt (you will see live download progress)..."
        $PYTHON_CMD -m pip install -r requirements.txt || echo "[Warning] Some Python libraries failed to install. The frontend will operate with Fail-Secure local engine fallback."
    fi
    echo "[Backend] Starting FastAPI server on port 8000..."
    $PYTHON_CMD -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 &
    BACKEND_PID=$!
    echo "[Backend] Server PID: $BACKEND_PID"
fi

echo ""
echo "=========================================================="
echo "[Success] All systems ready! Starting GitUpX UI..."
echo "[Info] Opening your web browser at http://localhost:3000 ..."
echo "=========================================================="
echo ""

# Auto-open browser on macOS or Linux
if command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:3000" &>/dev/null &
elif command -v open &>/dev/null; then
    open "http://localhost:3000" &>/dev/null &
fi

echo "[Frontend] Starting Vite development server on port 3000..."
npm run dev

# Cleanup background processes on exit
if [ -n "$BACKEND_PID" ]; then
    kill -9 $BACKEND_PID 2>/dev/null || true
fi

