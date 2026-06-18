# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: validator.py
Description: Validates mathematical expressions, detects forbidden functions, and manages safety rules.
"""

import re
from typing import Set, Tuple

class ForbiddenFunctionException(Exception):
    """Exception raised when a user enters a mathematically forbidden or unsupported function."""
    def __init__(self, message: str, vietnamese_detail: str):
        super().__init__(message)
        self.vietnamese_detail = vietnamese_detail


class ExpressionValidator:
    """
    Rigorously detects forbidden functions and syntax issues in mathematical expressions.
    Provides highly clear, human-centered Vietnamese error reports.
    """
    FORBIDDEN_KEYWORDS: Set[str] = {
        "sin", "cos", "tan", "cot", "sec", "csc",
        "arcsin", "arccos", "arctan", "asin", "acos", "atan",
        "sinh", "cosh", "tanh", "gamma", "zeta", "beta", "erf",
        "floor", "ceil", "round", "frac", "mod", "sign",
        "dirac", "bessel", "lambertw", "fourier", "elliptic",
        "polylog", "factorial", "fibonacci", "piecewise"
    }

    @classmethod
    def validate_expression(cls, expr_str: str) -> Tuple[bool, str]:
        """
        Validates the expression string.
        Returns (True, "OK") if valid, otherwise raises ForbiddenFunctionException or returns (False, error).
        """
        cleaned = re.sub(r"\s+", "", expr_str.lower())
        
        # 1. Search for forbidden function keywords using word boundaries
        for keyword in cls.FORBIDDEN_KEYWORDS:
            pattern = rf"\b{keyword}\b"
            if re.search(pattern, cleaned) or keyword in cleaned:
                # Extra check to prevent substring overlap errors (e.g. "factorial" vs "factor")
                # But to be safe, any mention of trigonometric or advanced functions is blocked.
                msg_vn = f"Hàm số chứa '{keyword}' không thuộc tập hợp các hàm số cơ bản được hỗ trợ bởi Tableur of Function Variation."
                raise ForbiddenFunctionException(
                    message=f"Forbidden function '{keyword}' found in expression.",
                    vietnamese_detail=msg_vn
                )

        # 2. Basic bracket check
        if cleaned.count("(") != cleaned.count(")"):
            return False, "Lỗi cú pháp: Số lượng dấu ngoặc đóng và mở không khớp nhau."
            
        return True, "Hợp lệ"
