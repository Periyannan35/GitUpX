from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.ml_model import ml_classifier
from app.api.v1.auth import get_current_user
from app.models.db_models import User

router = APIRouter()

class PredictRequest(BaseModel):
    variable_name: str
    parent_function_name: str = ""
    parent_class_name: str = ""
    file_path: str = "src/config.py"
    lines_before: List[str] = []
    lines_after: List[str] = []

@router.post("")
def predict_secret_context(req: PredictRequest, current_user: User = Depends(get_current_user)):
    context_dict = req.model_dump()
    classification, confidence = ml_classifier.predict(context_dict)
    
    return {
        "success": True,
        "data": {
            "classification": classification,
            "confidence": round(confidence, 4),
            "action_recommended": "sanitize_and_mask" if classification == "production_context" else "safe_bypass"
        },
        "message": "Prediction completed",
        "timestamp": datetime.utcnow().isoformat()
    }
