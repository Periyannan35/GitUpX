import os
import re
from pathlib import Path
from typing import List, Dict, Any
from app.scanner.regex_rules import COMPILED_RULES
from app.scanner.entropy import calculate_shannon_entropy, is_high_entropy_secret
from app.scanner.gitleaks_wrapper import gitleaks
from app.core.logger import logger

class FileScanner:
    def __init__(self):
        pass

    def scan_file(self, file_path: Path, rel_path: str) -> List[Dict[str, Any]]:
        findings = []
        try:
            if not file_path.exists() or not file_path.is_file():
                return findings
            
            # Skip binary files or quarantine backups
            if str(file_path).endswith(".gitupx.bak") or ".gitupx_quarantine" in str(file_path):
                return findings

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            for line_idx, line in enumerate(lines):
                line_num = line_idx + 1
                line_matched = False

                # 1. Run regex rules first (fast)
                for rule_name, severity, pattern in COMPILED_RULES:
                    for match in pattern.finditer(line):
                        line_matched = True
                        matched_text = match.group(1) if match.groups() else match.group(0)
                        col_start = match.start(1) if match.groups() else match.start(0)
                        col_end = match.end(1) if match.groups() else match.end(0)
                        
                        entropy = calculate_shannon_entropy(matched_text)
                        
                        findings.append({
                            "file_path": rel_path,
                            "line_number": line_num,
                            "column_start": col_start,
                            "column_end": col_end,
                            "matched_text": matched_text,
                            "rule_name": rule_name,
                            "entropy_score": round(entropy, 2),
                            "severity": severity
                        })

                # 2. Run entropy scan (slow) only on unmatched lines
                if not line_matched:
                    # Tokenize by '=' or ':' or quotes to check candidate strings
                    tokens = re.findall(r"[\"\']([a-zA-Z0-9_\-\.\/+]{16,64})[\"\']", line)
                    for token in tokens:
                        if is_high_entropy_secret(token, threshold=4.5, min_length=16):
                            col_start = line.find(token)
                            col_end = col_start + len(token)
                            entropy = calculate_shannon_entropy(token)
                            findings.append({
                                "file_path": rel_path,
                                "line_number": line_num,
                                "column_start": col_start,
                                "column_end": col_end,
                                "matched_text": token,
                                "rule_name": "High Shannon Entropy String",
                                "entropy_score": round(entropy, 2),
                                "severity": "medium"
                            })

        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {e}")

        return findings

    def scan_repo(self, repo_path: str, changed_files_only: List[str] = None) -> List[Dict[str, Any]]:
        root = Path(repo_path)
        all_findings = []

        # 1. Run gitleaks wrapper first
        gitleaks_findings = gitleaks.scan_directory(repo_path)
        all_findings.extend(gitleaks_findings)

        # 2. Scan files with Python engine
        if changed_files_only is not None:
            files_to_scan = [root / f for f in changed_files_only]
        else:
            files_to_scan = []
            for p in root.rglob("*"):
                if p.is_file() and ".git" not in p.parts and "node_modules" not in p.parts and "venv" not in p.parts:
                    files_to_scan.append(p)

        for fpath in files_to_scan:
            try:
                rel_path = str(fpath.relative_to(root)).replace("\\", "/")
            except ValueError:
                rel_path = str(fpath).replace("\\", "/")
                
            file_findings = self.scan_file(fpath, rel_path)
            
            # Avoid duplicate findings from gitleaks + regex
            for ff in file_findings:
                is_dup = any(
                    gf["file_path"] == ff["file_path"] and gf["line_number"] == ff["line_number"]
                    for gf in all_findings
                )
                if not is_dup:
                    all_findings.append(ff)

        return all_findings

file_scanner = FileScanner()
