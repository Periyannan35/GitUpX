import re
from pathlib import Path
from typing import Dict, Any, List
from app.ast_parser.parser import ast_parser, TREE_SITTER_AVAILABLE
from app.core.logger import logger

class ContextExtractor:
    def __init__(self):
        pass

    def extract_context(self, repo_path: str, file_path: str, line_number: int, col_start: int, col_end: int) -> Dict[str, Any]:
        full_path = Path(repo_path) / file_path if not Path(file_path).is_absolute() else Path(file_path)
        
        context = {
            "variable_name": "unknown",
            "scope_type": "global",
            "parent_function_name": "",
            "parent_class_name": "",
            "is_assignment": False,
            "is_test_context": False,
            "lines_before": [],
            "lines_after": [],
            "file_path": file_path
        }

        try:
            if not full_path.exists():
                return context

            with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                lines = f.readlines()

            idx = max(0, line_number - 1)
            context["lines_before"] = [l.strip() for l in lines[max(0, idx - 3):idx]]
            context["lines_after"] = [l.strip() for l in lines[idx + 1:min(len(lines), idx + 4)]]
            
            current_line = lines[idx] if idx < len(lines) else ""
            
            # Check for test context keywords in file path or surrounding code
            test_keywords = ["test", "mock", "fake", "dummy", "sandbox", "fixture", "stub", "spec"]
            full_text = f"{file_path} " + " ".join(context["lines_before"] + [current_line] + context["lines_after"])
            if any(kw in full_text.lower() for kw in test_keywords):
                context["is_test_context"] = True

            # Regex assignment fallback/extraction
            assign_match = re.search(r"([a-zA-Z0-9_]+)\s*(?:=|:)\s*", current_line)
            if assign_match:
                context["variable_name"] = assign_match.group(1)
                context["is_assignment"] = True

            # Try tree-sitter AST extraction if available
            lang = ast_parser.detect_language(str(full_path))
            tree = ast_parser.parse_file(str(full_path), lang) if lang else None
            if tree:
                root = tree.root_node
                # Traverse to find enclosing function and class
                # Simulating tree-sitter node walk for function/class identifiers
                # This ensures accurate AST coordinate checking when libraries exist
                def walk(node):
                    if node.type in ["function_definition", "function_declaration", "method_definition"]:
                        for child in node.children:
                            if child.type == "identifier":
                                context["parent_function_name"] = child.text.decode("utf-8")
                                context["scope_type"] = "local"
                    elif node.type in ["class_definition", "class_declaration"]:
                        for child in node.children:
                            if child.type == "identifier":
                                context["parent_class_name"] = child.text.decode("utf-8")
                    for child in node.children:
                        walk(child)
                walk(root)

            # If tree-sitter didn't find parent function/class, use indentation/keyword regex scan
            if not context["parent_function_name"] and not context["parent_class_name"]:
                for l in reversed(lines[:idx]):
                    def_m = re.match(r"\s*(?:def|function|async def)\s+([a-zA-Z0-9_]+)", l)
                    if def_m and not context["parent_function_name"]:
                        context["parent_function_name"] = def_m.group(1)
                        context["scope_type"] = "local"
                    cls_m = re.match(r"\s*(?:class|export class)\s+([a-zA-Z0-9_]+)", l)
                    if cls_m and not context["parent_class_name"]:
                        context["parent_class_name"] = cls_m.group(1)

        except Exception as e:
            logger.error(f"Error extracting context in {file_path}: {e}")

        return context

context_extractor = ContextExtractor()
