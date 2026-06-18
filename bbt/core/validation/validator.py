# -*- coding: utf-8 -*-
"""
Input Expression and Symbolic Consistency Validator.
Safeguards computations against mathematical syntax risks (e.g. malformed variables),
invalid operators, or un-evaluable nested functions.
"""

import re
from typing import Any, List, Set, Tuple


class ExpressionValidationException(Exception):
    """Signals that an expression has failed structural or mathematical correctness audits."""
    def __init__(self, message: str, vietnamese_detail: str) -> None:
        super().__init__(message)
        self.vietnamese_detail = vietnamese_detail


class CoreValidator:
    """Rigorous validator verifying the formal correctness of high-school math strings."""

    @staticmethod
    def inspect_syntax(expr_str: str) -> Tuple[bool, str]:
        """Runs fast regex and bracket audits on raw math input strings."""
        if not expr_str.strip():
            return False, "Biểu thức không được để trống."
            
        # Bracket balance check
        stack = []
        for char in expr_str:
            if char in "([{":
                stack.append(char)
            elif char in ")]}":
                if not stack:
                    return False, "Dấu ngoặc đóng mở không khớp nhau."
                stack.pop()
        if stack:
            return False, "Biểu thức bị thiếu dấu ngoặc đóng."
            
        # Disallow prohibited unsafe symbols/commands to defend against remote executions
        unsafe_patterns = [r"__", r"import", r"eval", r"exec", r"os\.", r"sys\."]
        for pattern in unsafe_patterns:
            if re.search(pattern, expr_str):
                return False, "Biểu thức chứa ký tự hoặc từ khóa không an toàn."
                
        return True, ""

    @classmethod
    def validate_expression(cls, expr_str: str) -> None:
        """Thoroughly checks and validates a math string, raising clean exceptions upon failure."""
        is_ok, err_msg = cls.inspect_syntax(expr_str)
        if not is_ok:
            raise ExpressionValidationException(
                f"Syntax validation failed: {err_msg}",
                vietnamese_detail=err_msg
            )
            
        # Ensure only common school variables (x, t, y, z, u, v) are accepted, default is x
        all_symbols = re.findall(r"[a-zA-Z]+", expr_str)
        allowed_alphabets = {"x", "y", "z", "t", "u", "v", "pi", "e", "abs", "floor", "ceil", "sin", "cos", "tan", "ln", "log", "sqrt"}
        for sym in all_symbols:
            if sym.lower() not in allowed_alphabets:
                raise ExpressionValidationException(
                    f"Unsupported variable/function token: '{sym}'",
                    vietnamese_detail=f"Biểu thức chứa biến hoặc hàm '{sym}' không được hỗ trợ trong chương trình phổ thông."
                )
