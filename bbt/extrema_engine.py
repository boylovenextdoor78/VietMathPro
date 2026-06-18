# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: extrema_engine.py
Description: Evaluates derivative critical points, locates relative maxima, minima, and local inflection trends.
"""

import sympy as sp
from typing import List, Dict, Tuple, Any
from cas_engine import CASEngine

class ExtremaEngine:
    """
    Rigorously detects local extreme coordinates (cực trị) of a function.
    Matches critical roots x0 of f'(x) = 0 and classifies them using neighboring signs or second derivative tests.
    """

    @classmethod
    def find_derivative_critical_points(cls, expr: sp.Expr) -> List[sp.Expr]:
        """
        Calculates derivative f'(x) and solves f'(x) = 0 to get real critical candidate points.
        """
        deriv = CASEngine.derivative(expr)
        # Solve f'(x) = 0
        roots = CASEngine.solve_equation(deriv)
        return roots

    @classmethod
    def classify_extrema(cls, expr: sp.Expr, critical_pts: List[sp.Expr]) -> List[Dict[str, Any]]:
        """
        Classifies each critical point x0 into "max" or "min" using the neighboring signs.
        Also evaluates the corresponding exact analytical y-value f(x0).
        """
        x = CASEngine.get_symbol_x()
        deriv = CASEngine.derivative(expr)
        extrema = []

        for pt in critical_pts:
            val = CASEngine.safe_float(pt)
            
            # Use sign changing rules in a small neighborhood [pt - epsilon, pt + epsilon]
            # E.g. epsilon = 1e-4
            epsilon = 1e-4
            
            try:
                # Sign of f'(x) on the left
                val_left = CASEngine.safe_float(deriv.subs(x, val - epsilon))
                # Sign of f'(x) on the right
                val_right = CASEngine.safe_float(deriv.subs(x, val + epsilon))
            except Exception:
                try:
                    # Fallback to limit-based sign evaluation if direct substitution fails
                    val_left = CASEngine.safe_float(CASEngine.eval_limit(deriv, pt - epsilon))
                    val_right = CASEngine.safe_float(CASEngine.eval_limit(deriv, pt + epsilon))
                except Exception:
                    val_left = 0
                    val_right = 0
                    
            y_val = CASEngine.evaluate_at(expr, pt)

            # Max: sign changes from + to -
            if val_left > 1e-9 and val_right < -1e-9:
                extrema.append({
                    "x": pt,
                    "y": y_val,
                    "type": "max",
                    "label": "Cực đại (Max)"
                })
            # Min: sign changes from - to +
            elif val_left < -1e-9 and val_right > 1e-9:
                extrema.append({
                    "x": pt,
                    "y": y_val,
                    "type": "min",
                    "label": "Cực tiểu (Min)"
                })
            else:
                # Stationary inflection point (inflection point where f'(x) = 0 but doesn't change sign)
                extrema.append({
                    "x": pt,
                    "y": y_val,
                    "type": "inflection",
                    "label": "Điểm uốn dừng"
                })

        return extrema
