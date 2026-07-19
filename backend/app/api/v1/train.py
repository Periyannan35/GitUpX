from datetime import datetime
from fastapi import APIRouter, Depends
from app.models.ml_model import ml_classifier
from app.api.v1.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

@router.post("")
def train_ml_model(current_user: User = Depends(get_current_user)):
    res = ml_classifier.train()
    return {
        "success": True,
        "data": res,
        "message": f"ML Model trained successfully with accuracy {res['accuracy']*100:.2f}%",
        "timestamp": datetime.utcnow().isoformat()
    }
