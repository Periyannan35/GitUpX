import os
import re
import shutil
import uuid
import secrets
from pathlib import Path
from typing import List, Dict, Any, Tuple
from app.core.logger import logger

class Sanitizer:
    def __init__(self):
        pass

    def _generate_mask(self) -> str:
        random_8char = secrets.token_hex(4).upper()
        return f"GITUPX_MASKED_SECRET_{random_8char}"

    def sanitize_file(self, repo_path: str, file_path: str, secrets_list: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Sanitizes a file by rewriting AST byte coordinates or exact regex matches.
        Creates backup: file_path.gitupx.bak
        If syntax becomes invalid -> restores from backup and moves to .gitupx_quarantine/
        """
        full_path = Path(repo_path) / file_path if not Path(file_path).is_absolute() else Path(file_path)
        backup_path = Path(str(full_path) + ".gitupx.bak")
        quarantine_dir = Path(repo_path) / ".gitupx_quarantine"

        result = {
            "file_path": file_path,
            "success_count": 0,
            "fail_count": 0,
            "quarantined": False,
            "backup_created": False
        }

        if not full_path.exists() or not secrets_list:
            return result

        try:
            # 1. Create backup
            shutil.copy2(full_path, backup_path)
            result["backup_created"] = True
            logger.info(f"Created backup for {file_path} at {backup_path.name}")

            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()

            # 2. Sort secrets in reverse order of line/column so replacement doesn't shift earlier indices
            sorted_secrets = sorted(secrets_list, key=lambda x: (x["line_number"], x["column_start"]), reverse=True)

            lines = content.splitlines(keepends=True)

            for sec in sorted_secrets:
                line_idx = sec["line_number"] - 1
                if 0 <= line_idx < len(lines):
                    target_line = lines[line_idx]
                    matched = sec["matched_text"]
                    
                    if matched and matched in target_line:
                        mask = self._generate_mask()
                        # Replace only the target secret in that line
                        new_line = target_line.replace(matched, mask, 1)
                        lines[line_idx] = new_line
                        result["success_count"] += 1
                    else:
                        result["fail_count"] += 1

            new_content = "".join(lines)

            # 3. Write sanitized content
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(new_content)

            # 4. Basic syntax check (e.g., Python compile check if .py file)
            if str(full_path).endswith(".py"):
                try:
                    compile(new_content, str(full_path), "exec")
                except SyntaxError as se:
                    logger.error(f"Syntax error after sanitizing {file_path}: {se}. Restoring and quarantining!")
                    self._quarantine_file(full_path, backup_path, quarantine_dir)
                    result["quarantined"] = True
                    result["success_count"] = 0
                    result["fail_count"] = len(secrets_list)
                    return result

            # If successful, we can optionally clean up backup or keep it
            logger.info(f"Successfully sanitized {result['success_count']} secrets in {file_path}")

        except Exception as e:
            logger.error(f"Failed to sanitize {file_path}: {e}")
            if backup_path.exists():
                shutil.copy2(backup_path, full_path)
            result["fail_count"] = len(secrets_list)

        return result

    def _quarantine_file(self, full_path: Path, backup_path: Path, quarantine_dir: Path):
        try:
            quarantine_dir.mkdir(parents=True, exist_ok=True)
            # Restore original file from backup so repo isn't broken
            shutil.copy2(backup_path, full_path)
            # Move backup to quarantine
            dest = quarantine_dir / f"{full_path.name}.quarantined_{uuid.uuid4().hex[:6]}"
            shutil.move(str(backup_path), str(dest))
            logger.warning(f"File quarantined to: {dest}")
        except Exception as e:
            logger.error(f"Error during quarantine operation: {e}")

sanitizer = Sanitizer()
