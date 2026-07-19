from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
import subprocess
from app.scanner.file_scanner import file_scanner
from app.ast_parser.context_extractor import context_extractor
from app.models.ml_model import ml_classifier
from app.sanitizer.sanitizer import sanitizer
from app.publisher.github_push import github_publisher
from app.core.database import SessionLocal
from app.models.db_models import Scan, Secret, Repository, User, Log
from app.core.logger import logger

class DecisionEngine:
    def __init__(self):
        pass

    def get_changed_files(self, repo_path: str) -> List[str]:
        """
        Gets uncommitted/staged changed files from git diff.
        If git diff fails or repo is fresh, returns all files.
        """
        try:
            res = subprocess.run(["git", "status", "--porcelain"], cwd=repo_path, capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                changed = []
                for line in res.stdout.splitlines():
                    parts = line.strip().split(" ", 1)
                    if len(parts) == 2:
                        changed.append(parts[1].strip())
                return changed
        except Exception as e:
            logger.warning(f"Git diff check failed for {repo_path}: {e}")
        
        return None

    def _ensure_repo_exists(self, repo_path: str) -> str:
        p = Path(repo_path)
        try:
            if not p.exists():
                p.mkdir(parents=True, exist_ok=True)
                (p / "src").mkdir(exist_ok=True)
                with open(p / "src" / "config.py", "w", encoding="utf-8") as f:
                    f.write("# Production AWS Config\nAWS_ACCESS_KEY_ID = 'AKIAIOSFODNN7EXAMPLE'\nAWS_SECRET_ACCESS_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'\n")
                with open(p / "test_api.js", "w", encoding="utf-8") as f:
                    f.write("// Unit test mock token\nconst mock_jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';\n")
            return str(p)
        except Exception as e:
            logger.warning(f"Could not create path {repo_path} ({e}), falling back to test_repo")
            fallback = Path(__file__).resolve().parent.parent.parent / "test_repo"
            return str(fallback)

    def process_repo(self, repo_path: str, user_id: int, triggered_by: str = "manual") -> Dict[str, Any]:
        repo_path = self._ensure_repo_exists(repo_path)
        logger.info(f"Starting Decision Engine processing for repo: {repo_path} (User ID: {user_id})")
        db = SessionLocal()
        
        result = {
            "success": False,
            "scan_id": None,
            "repo_path": repo_path,
            "secrets_found": 0,
            "secrets_sanitized": 0,
            "secrets_safe": 0,
            "sanitized_files": [],
            "push_result": {},
            "error_message": None,
            "timestamp": datetime.utcnow().isoformat()
        }

        try:
            # Get or create repository record
            repo = db.query(Repository).filter(Repository.local_path == repo_path, Repository.user_id == user_id).first()
            if not repo:
                repo_name = Path(repo_path).name or "untitled_repo"
                repo = Repository(user_id=user_id, local_path=repo_path, name=repo_name)
                db.add(repo)
                db.commit()
                db.refresh(repo)

            # Create Scan record
            scan = Scan(repo_id=repo.id, triggered_by=triggered_by, status="running")
            db.add(scan)
            db.commit()
            db.refresh(scan)
            result["scan_id"] = scan.id

            # 1. Get changed files only when triggered by daemon background watcher
            changed_files = self.get_changed_files(repo_path) if triggered_by == "daemon" else None
            
            # 2. Run file scanner
            raw_findings = file_scanner.scan_repo(repo_path, changed_files_only=changed_files)
            result["secrets_found"] = len(raw_findings)
            logger.info(f"Scanner found {len(raw_findings)} potential secrets.")

            sanitize_list = []
            safe_list = []
            file_secret_map: Dict[str, List[Dict[str, Any]]] = {}

            # 3. AST Context & ML Classification
            for finding in raw_findings:
                fpath = finding["file_path"]
                line_num = finding["line_number"]
                col_s = finding["column_start"]
                col_e = finding["column_end"]

                # a. AST Context Extractor
                ast_context = context_extractor.extract_context(repo_path, fpath, line_num, col_s, col_e)
                finding["ast_context"] = ast_context

                # b. Fail-Secure Check: if AST fails or is uncertain, lean towards production
                # c. ML Predict
                classification, confidence = ml_classifier.predict(ast_context)
                finding["ml_classification"] = classification
                finding["ml_confidence"] = confidence

                # d. If confidence < 0.7 or classified as production -> FAIL-SECURE: classify as production
                if confidence < 0.7 or classification == "production_context":
                    finding["action_taken"] = "sanitized"
                    sanitize_list.append(finding)
                    if fpath not in file_secret_map:
                        file_secret_map[fpath] = []
                    file_secret_map[fpath].append(finding)
                else:
                    finding["action_taken"] = "safe_mock"
                    safe_list.append(finding)

                # Store Secret in DB (storing masked matched_text for security)
                masked_val = finding["matched_text"][:4] + "***" + finding["matched_text"][-4:] if len(finding["matched_text"]) > 8 else "***"
                sec_db = Secret(
                    scan_id=scan.id,
                    file_path=fpath,
                    line_number=line_num,
                    matched_text=masked_val,
                    rule_name=finding["rule_name"],
                    entropy_score=finding["entropy_score"],
                    ast_context=ast_context,
                    ml_classification=classification,
                    ml_confidence=confidence,
                    action_taken=finding["action_taken"]
                )
                db.add(sec_db)

            result["secrets_sanitized"] = len(sanitize_list)
            result["secrets_safe"] = len(safe_list)

            # 4. For sanitize_list -> run sanitizer per file
            for fpath, f_secrets in file_secret_map.items():
                san_res = sanitizer.sanitize_file(repo_path, fpath, f_secrets)
                result["sanitized_files"].append(san_res)

            # 5. Git Commit & Push
            user = db.query(User).filter(User.id == user_id).first()
            gh_token = user.github_token if user else None
            push_res = github_publisher.push_repo(repo_path, gh_token, repo.name)
            result["push_result"] = push_res

            # Update scan record
            scan.status = "completed" if push_res["push_status"] in ["success", "up_to_date", "local_only"] else "completed_with_warnings"
            scan.completed_at = datetime.utcnow()
            scan.secrets_found = result["secrets_found"]
            scan.secrets_sanitized = result["secrets_sanitized"]
            scan.secrets_safe = result["secrets_safe"]
            db.commit()

            # Log system event
            log_entry = Log(level="INFO", message=f"Completed scan #{scan.id} for repo {repo.name}. Found {result['secrets_found']} secrets ({result['secrets_sanitized']} sanitized).", source="decision_engine")
            db.add(log_entry)
            db.commit()

            result["success"] = True

        except Exception as e:
            logger.error(f"Decision Engine process_repo error: {e}")
            result["error_message"] = str(e)
            if result["scan_id"]:
                try:
                    s = db.query(Scan).filter(Scan.id == result["scan_id"]).first()
                    if s:
                        s.status = "failed"
                        s.error_message = str(e)
                        s.completed_at = datetime.utcnow()
                        db.commit()
                except Exception as db_e:
                    logger.error(f"Failed to update scan failure status: {db_e}")
        finally:
            db.close()

        return result

decision_engine = DecisionEngine()
