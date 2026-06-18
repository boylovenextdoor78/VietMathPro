# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: parser_engine.py
Description: Translates standard mathematical strings into SymPy AST compatible formats.
             Handles implicit multiplication (e.g., '2x' -> '2*x') and caret conversion.
"""

import re
from typing import Dict, Any, List

class ParserEngine:
    """
    Rigorously parses, cleans and pre-processes mathematical expressions for symbolic representation.
    Produces an AST-compatible clean string that SymPy can load directly.
    """

    @staticmethod
    def preprocess_string(expr_str: str) -> str:
        """
        Transforms common school notation to pure python expression strings:
        - Replaces '^' with '**'
        - Insert implicit multiplication between coefficient and variable (e.g. 2x -> 2*x, (x+1)(x-2) -> (x+1)*(x-2))
        """
        # Lowercase and remove spaces
        processed = expr_str.strip().lower()
        
        # Replace caret with double star
        processed = processed.replace("^", "**")
        
        # Add implicit multiplication: number followed by a letter (e.g. 2x -> 2*x)
        processed = re.sub(r"(\d+)([a-zA-Z])", r"\1*\2", processed)
        
        # Add implicit multiplication: parenthese multiplication (e.g. (x+1)(x-2) -> (x+1)*(x-2))
        processed = re.sub(r"\)\(", r")*(", processed)
        
        # Add implicit multiplication: number before open parenthesis (e.g., 2(x+1) -> 2*(x+1))
        processed = re.sub(r"(\d+)\(", r"\1*(", processed)
        
        # Add implicit multiplication: variable before open parenthesis (e.g., x(x+1) -> x*(x+1))
        # Protect known math functions like abs, sqrt, cbrt, log, ln, exp from implicit multiplication
        def repl_unsupported_var_paren(match):
            word = match.group(1)
            if word in {"abs", "sqrt", "cbrt", "root", "log", "log10", "log2", "ln", "exp", "sin", "cos", "tan"}:
                return f"{word}("
            return f"{word}*("
        processed = re.sub(r"([a-zA-Z]+)\(", repl_unsupported_var_paren, processed)
        
        # Add implicit multiplication: close parenthesis before variable (e.g., (x+1)x -> (x+1)*x)
        processed = re.sub(r"\)([a-zA-Z])", r")*\1", processed)

        # Simplify duplicate operators (e.g. +-, --, etc.)
        processed = re.sub(r"\+\+", "+", processed)
        processed = re.sub(r"\-\+", "-", processed)
        processed = re.sub(r"\+\-", "-", processed)
        processed = re.sub(r"\-\-", "+", processed)
        
        return processed

    @staticmethod
    def inspect_expression_depth(expr_str: str) -> int:
        """
        Inspects bracket nested structure depth to verify composition bounds.
        Prevents infinite recursive symbolic parse or deep composition crashes.
        """
        max_depth = 0
        current_depth = 0
        for char in expr_str:
            if char == '(':
                current_depth += 1
                max_depth = max(max_depth, current_depth)
            elif char == ')':
                current_depth -= 1
        return max_depth
