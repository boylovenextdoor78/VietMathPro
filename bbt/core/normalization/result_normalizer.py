# -*- coding: utf-8 -*-
"""
Mathematical Result Normalizer.
Polishes symbolic LaTeX outputs, standardizes decimals, simplifies equation bounds,
and adds Vietnamese translations of mathematical statuses.
"""

import re
from typing import Any, Dict


class ResultNormalizer:
    """Prepares and formatting algebraic outputs for front-end rendering."""

    @staticmethod
    def cleanup_latex(latex_str: str) -> str:
        """Trims redundant parenthesis and standardizes latex expressions for MathJax."""
        cleaned = latex_str
        # Replace redundant multiplication glyphs
        cleaned = cleaned.replace(" * ", " \\cdot ")
        cleaned = re.sub(r'\\left\(\s*(-?\d+(\.\d+)?)\s*\\right\)', r'\1', cleaned)
        # Simplify redundant signs (+ - => -)
        cleaned = cleaned.replace("+ -", "-")
        cleaned = cleaned.replace("- -", "+")
        return cleaned

    @staticmethod
    def normalize_domain_text(restrictions: list, base_set: str = "D = \\mathbb{R}") -> str:
        """Formulates Vietnamese definition domain texts from algebraic restrictions."""
        if not restrictions:
            return base_set
            
        not_equals = []
        inequalities = []
        for rest in restrictions:
            if "!=" in rest or "x !=" in rest:
                val = rest.split("!=")[-1].strip()
                not_equals.append(val)
            else:
                inequalities.append(rest)
                
        terms = []
        if not_equals:
            terms.append(f"\\forall x \\ne {', '.join(not_equals)}")
        if inequalities:
            terms.append(f"\\text{{ với }} {', '.join(inequalities)}")
            
        if not terms:
            return base_set
        return f"D = \\mathbb{{R}} \\setminus \\left\\{{ {', '.join(not_equals)} \\right\\}}" if not_equals and not inequalities else f"\\mathbb{{R}} \\text{{ thỏa mãn }} {', '.join(inequalities)}"
