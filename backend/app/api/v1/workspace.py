from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Repository, User
from app.api.v1.auth import get_current_user
from app.decision.decision_engine import decision_engine

router = APIRouter()

class RepoCreateRequest(BaseModel):
    local_path: str
    remote_url: str = None
    name: str = None

class SyncRequest(BaseModel):
    repo_path: str

@router.get("/repos")
def list_repos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repos = db.query(Repository).filter(Repository.user_id == current_user.id).all()
    data = []
    for r in repos:
        data.append({
            "id": r.id,
            "name": r.name,
            "local_path": r.local_path,
            "remote_url": r.remote_url,
            "is_active": r.is_active,
            "created_at": r.created_at.isoformat()
        })
    return {"success": True, "data": data, "message": "Repositories retrieved", "timestamp": datetime.utcnow().isoformat()}

@router.post("/repos")
def add_repo(req: RepoCreateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = req.name or Path(req.local_path).name or "untitled_repo"
    existing = db.query(Repository).filter(Repository.local_path == req.local_path, Repository.user_id == current_user.id).first()
    if existing:
        return {"success": False, "data": None, "message": "Repository path already added", "timestamp": datetime.utcnow().isoformat()}
    
    new_repo = Repository(
        user_id=current_user.id,
        local_path=req.local_path,
        remote_url=req.remote_url,
        name=name
    )
    db.add(new_repo)
    db.commit()
    db.refresh(new_repo)
    
    return {
        "success": True,
        "data": {"id": new_repo.id, "name": new_repo.name, "local_path": new_repo.local_path},
        "message": "Repository added successfully",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.delete("/repos/{repo_id}")
def delete_repo(repo_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found")
    db.delete(repo)
    db.commit()
    return {"success": True, "data": None, "message": "Repository deleted", "timestamp": datetime.utcnow().isoformat()}

@router.post("/sync")
def trigger_sync(req: SyncRequest, current_user: User = Depends(get_current_user)):
    res = decision_engine.process_repo(req.repo_path, user_id=current_user.id, triggered_by="manual_sync")
    return {"success": res["success"], "data": res, "message": "Scan and sync pipeline completed", "timestamp": datetime.utcnow().isoformat()}
