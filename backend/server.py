import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.core.logger import logger
from app.daemon.watcher import watcher_daemon
from app.models.ml_model import ml_classifier
from app.api.v1 import auth, dashboard, workspace, scan, train, predict

app = FastAPI(
    title="GitUpX API",
    description="AI-Powered Repository Sanitizer & Secure Auto-Publisher",
    version="1.0.0"
)

# CORS enabled for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(workspace.router, prefix="/api/v1/workspace", tags=["Workspace"])
app.include_router(scan.router, prefix="/api/v1/scans", tags=["Scans"])
app.include_router(train.router, prefix="/api/v1/train", tags=["ML Training"])
app.include_router(predict.router, prefix="/api/v1/predict", tags=["ML Prediction"])

@app.on_event("startup")
def startup_event():
    logger.info("Starting GitUpX Backend Server...")
    init_db()
    
    # Ensure ML model is loaded / auto-trained
    try:
        ml_classifier.load()
    except Exception as e:
        logger.error(f"ML Classifier startup load error: {e}")

    # Start IDE Watcher background thread
    watcher_daemon.start()
    logger.info("GitUpX startup completed successfully.")

@app.on_event("shutdown")
def shutdown_event():
    logger.info("Shutting down GitUpX Backend Server...")
    watcher_daemon.stop()
    logger.info("Shutdown complete.")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "GitUpX", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
