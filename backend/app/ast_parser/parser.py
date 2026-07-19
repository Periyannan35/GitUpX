import os
from pathlib import Path
from typing import Optional, Any
from app.core.logger import logger

try:
    import tree_sitter
    import tree_sitter_python
    import tree_sitter_javascript
    TREE_SITTER_AVAILABLE = True
except ImportError:
    TREE_SITTER_AVAILABLE = False
    logger.warning("tree-sitter libraries not found. Falling back to regex AST parser.")

class ASTParser:
    def __init__(self):
        self.parsers = {}
        if TREE_SITTER_AVAILABLE:
            try:
                self.parsers["python"] = tree_sitter.Language(tree_sitter_python.language())
                self.parsers["javascript"] = tree_sitter.Language(tree_sitter_javascript.language())
                self.parsers["typescript"] = self.parsers["javascript"]
            except Exception as e:
                logger.warning(f"Error loading tree-sitter languages: {e}")

    def detect_language(self, file_path: str) -> Optional[str]:
        ext = Path(file_path).suffix.lower()
        if ext in [".py"]:
            return "python"
        elif ext in [".js", ".jsx", ".ts", ".tsx"]:
            return "javascript"
        elif ext in [".java"]:
            return "java"
        elif ext in [".go"]:
            return "go"
        elif ext in [".c", ".cpp", ".cc", ".h"]:
            return "c"
        elif ext in [".rs"]:
            return "rust"
        elif ext in [".rb"]:
            return "ruby"
        return None

    def parse_file(self, file_path: str, lang: str) -> Optional[Any]:
        if not TREE_SITTER_AVAILABLE or lang not in self.parsers:
            return None
        try:
            with open(file_path, "rb") as f:
                code = f.read()
            parser = tree_sitter.Parser()
            parser.set_language(self.parsers[lang])
            return parser.parse(code)
        except Exception as e:
            logger.error(f"AST parse error for {file_path}: {e}")
            return None

ast_parser = ASTParser()
