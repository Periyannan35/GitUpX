from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Scan, Secret, Repository, User
from app.api.v1.auth import get_current_user
from app.decision.decision_engine import decision_engine

router = APIRouter()

class ScanTriggerRequest(BaseModel):
    repo_path: str = None

@router.post("/trigger")
def trigger_scan(req: ScanTriggerRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo_path = req.repo_path
    if not repo_path:
        first_repo = db.query(Repository).filter(Repository.user_id == current_user.id).first()
        repo_path = first_repo.local_path if first_repo else "./test_repo"
        
    res = decision_engine.process_repo(repo_path, user_id=current_user.id, triggered_by="manual_sync")
    return {"success": res["success"], "data": res, "message": "Scan and sanitization pipeline completed", "timestamp": datetime.utcnow().isoformat()}

@router.get("")
def get_scans(page: int = Query(1, ge=1), limit: int = Query(20, ge=1, le=100), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_repos = db.query(Repository.id).filter(Repository.user_id == current_user.id).subquery()
    
    query = db.query(Scan).filter(Scan.repo_id.in_(user_repos)).order_by(Scan.started_at.desc())
    total = query.count()
    scans = query.offset((page - 1) * limit).limit(limit).all()
    
    data = []
    for s in scans:
        repo_name = s.repository.name if s.repository else "Unknown Repo"
        data.append({
            "id": s.id,
            "repo_id": s.repo_id,
            "repo_name": repo_name,
            "triggered_by": s.triggered_by,
            "status": s.status,
            "started_at": s.started_at.isoformat(),
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "secrets_found": s.secrets_found,
            "secrets_sanitized": s.secrets_sanitized,
            "secrets_safe": s.secrets_safe,
            "error_message": s.error_message
        })
        
    return {
        "success": True,
        "data": {"scans": data, "total": total, "page": page, "limit": limit},
        "message": "Scans retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/{scan_id}")
def get_scan_detail(scan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan or scan.repository.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    return {
        "success": True,
        "data": {
            "id": scan.id,
            "repo_id": scan.repo_id,
            "repo_name": scan.repository.name,
            "triggered_by": scan.triggered_by,
            "status": scan.status,
            "started_at": scan.started_at.isoformat(),
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "secrets_found": scan.secrets_found,
            "secrets_sanitized": scan.secrets_sanitized,
            "secrets_safe": scan.secrets_safe,
            "error_message": scan.error_message
        },
        "message": "Scan detail retrieved",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/{scan_id}/secrets")
def get_scan_secrets(scan_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan or scan.repository.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    secrets = db.query(Secret).filter(Secret.scan_id == scan_id).all()
    data = []
    for sec in secrets:
        data.append({
            "id": sec.id,
            "file_path": sec.file_path,
            "line_number": sec.line_number,
            "matched_text": sec.matched_text,
            "rule_name": sec.rule_name,
            "entropy_score": sec.entropy_score,
            "ast_context": sec.ast_context,
            "ml_classification": sec.ml_classification,
            "ml_confidence": sec.ml_confidence,
            "action_taken": sec.action_taken,
            "created_at": sec.created_at.isoformat()
        })
        
    return {"success": True, "data": data, "message": "Scan secrets retrieved", "timestamp": datetime.utcnow().isoformat()}
