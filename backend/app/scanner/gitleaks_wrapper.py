import subprocess
import shutil
from pathlib import Path
from typing import List, Dict, Any
from app.core.logger import logger

class GitleaksWrapper:
    def __init__(self):
        self.binary_path = shutil.which("gitleaks")
        self.has_binary = self.binary_path is not None
        if self.has_binary:
            logger.info(f"Gitleaks binary detected at: {self.binary_path}")
        else:
            logger.info("Gitleaks binary not found. Using Pure Python regex/entropy engine fallback.")

    def scan_directory(self, repo_path: str) -> List[Dict[str, Any]]:
        """
        Runs gitleaks CLI if available, otherwise returns empty list to allow pure python engine to run.
        """
        if not self.has_binary:
            return []

        try:
            cmd = [
                self.binary_path,
                "detect",
                "--source", str(repo_path),
                "--no-git",
                "--report-format", "json",
                "--report-path", "-"
            ]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if result.stdout:
                import json
                findings = json.loads(result.stdout)
                parsed = []
                for f in findings:
                    parsed.append({
                        "file_path": f.get("File", ""),
                        "line_number": int(f.get("StartLine", 1)),
                        "column_start": int(f.get("StartColumn", 0)),
                        "column_end": int(f.get("EndColumn", 0)),
                        "matched_text": f.get("Secret", ""),
                        "rule_name": f.get("RuleID", "Gitleaks Rule"),
                        "severity": "high"
                    })
                return parsed
        except Exception as e:
            logger.error(f"Gitleaks execution failed: {e}. Falling back to Python scanner.")
        
        return []

gitleaks = GitleaksWrapper()
