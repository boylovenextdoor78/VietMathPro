# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: asymptote_engine.py
Description: Rigorously detects vertical, horizontal, slant, and curved polynomial asymptotes using symbolic limits and polynomial bounds.
"""

import sympy as sp
from typing import List, Tuple, Dict, Any, Optional
from cas_engine import CASEngine
from domain_engine import DomainEngine

class AsymptoteEngine:
    """
    Rigorously detects asymptotes (tiệm cận) of the function.
    Supports:
    - Vertical Asymptotes (TCĐ)
    - Horizontal Asymptotes (TCN) with custom directional limits at +-oo
    - Slant Asymptotes (TCX)
    - Curved Polynomial Asymptotes (Tiệm cận cong đa thức)
    """

    @classmethod
    def detect_vertical_asymptotes(cls, expr: sp.Expr) -> List[sp.Expr]:
        """
        Vertical Asymptotes (TCĐ) occur at poles x0 where lim_{x -> x0} f(x) = +-oo.
        """
        x = CASEngine.get_symbol_x()
        candidates = DomainEngine.find_singularities(expr)
        tc_d = []

        for c in candidates:
            # Check left and right limits
            limit_left = CASEngine.eval_limit(expr, c, direction="-")
            limit_right = CASEngine.eval_limit(expr, c, direction="+")
            
            # If left or right limit diverges to infinity, x = c is a vertical asymptote
            if limit_left in [sp.oo, -sp.oo] or limit_right in [sp.oo, -sp.oo]:
                if c not in tc_d:
                    tc_d.append(c)
                    
        return tc_d

    @classmethod
    def detect_horizontal_asymptotes(cls, expr: sp.Expr) -> Dict[str, Optional[sp.Expr]]:
        """
        Horizontal Asymptotes (TCN) y = L occur if lim_{x -> +-oo} f(x) = L (where L is finite).
        Returns dict for left (-oo) and right (+oo).
        """
        tcn_data = {"+oo": None, "-oo": None}
        
        # Limit at +oo
        lim_pos = CASEngine.eval_limit(expr, sp.oo)
        if lim_pos is not sp.nan and not lim_pos.has(sp.oo, -sp.oo) and lim_pos.is_number and CASEngine.safe_is_real(lim_pos):
            tcn_data["+oo"] = lim_pos

        # Limit at -oo
        lim_neg = CASEngine.eval_limit(expr, -sp.oo)
        if lim_neg is not sp.nan and not lim_neg.has(sp.oo, -sp.oo) and lim_neg.is_number and CASEngine.safe_is_real(lim_neg):
            tcn_data["-oo"] = lim_neg

        return tcn_data

    @classmethod
    def detect_slant_asymptotes(cls, expr: sp.Expr) -> Dict[str, Optional[Tuple[sp.Expr, sp.Expr]]]:
        """
        Slant Asymptotes (TCX) y = ax + b occur if lim_{x -> +-oo} (f(x)/x) = a (nonzero, finite)
        and lim_{x -> +-oo} (f(x) - ax) = b (finite).
        """
        x = CASEngine.get_symbol_x()
        slant_data = {"+oo": None, "-oo": None}

        for direction, inf_val in [("+oo", sp.oo), ("-oo", -sp.oo)]:
            # Compute slope a = lim f(x)/x
            slope = CASEngine.eval_limit(expr / x, inf_val)
            if slope is not sp.nan and slope != 0 and not slope.has(sp.oo, -sp.oo) and slope.is_number and CASEngine.safe_is_real(slope):
                # Compute intercept b = lim (f(x) - a*x)
                intercept = CASEngine.eval_limit(expr - slope * x, inf_val)
                if intercept is not sp.nan and not intercept.has(sp.oo, -sp.oo) and intercept.is_number and CASEngine.safe_is_real(intercept):
                    slant_data[direction] = (slope, intercept)

        return slant_data

    @classmethod
    def detect_curved_asymptotes(cls, expr: sp.Expr) -> List[sp.Expr]:
        """
        Detects Curved Polynomial Asymptotes (Tiệm cận cong đa thức) y = C(x) of degree >= 2
        for rational functions P(x)/Q(x) where degree(P) - degree(Q) >= 2.
        """
        x = CASEngine.get_symbol_x()
        curved_asymptotes = []
        
        try:
            expr_simp = sp.cancel(expr)
            num, den = sp.fraction(expr_simp)
            if den != 1 and num.is_polynomial(x) and den.is_polynomial(x):
                q, r = sp.div(num, den, x)
                deg = sp.degree(q, x)
                if deg >= 2 and r != 0:
                    curved_asymptotes.append(q)
        except Exception:
            pass
            
        return curved_asymptotes

    @classmethod
    def get_detailed_asymptotes_report(cls, expr: sp.Expr) -> Dict[str, Any]:
        """
        Generates a highly structured, mathematically rigorous report of all asymptotes:
        - Verticals (TCĐ)
        - Horizontals (TCN) supporting asymmetric limits at +-oo
        - Slants (TCX)
        - Curved Polynomials (TCC)
        """
        x = CASEngine.get_symbol_x()
        
        v_report = []
        h_report = []
        s_report = []
        c_report = []
        
        # 1. Vertical Asymptotes (TCĐ)
        candidates = DomainEngine.find_singularities(expr)
        for c in candidates:
            limit_left = CASEngine.eval_limit(expr, c, direction="-")
            limit_right = CASEngine.eval_limit(expr, c, direction="+")
            
            is_va = False
            if limit_left in [sp.oo, -sp.oo] or limit_right in [sp.oo, -sp.oo]:
                is_va = True
                
            if is_va:
                desc = f"Đường thẳng x = {sp.latex(c)} là tiệm cận đứng"
                reasons = []
                if limit_left in [sp.oo, -sp.oo]:
                    reasons.append(f"\\lim_{{x \\to {sp.latex(c)}^-}} f(x) = {sp.latex(limit_left)}")
                if limit_right in [sp.oo, -sp.oo]:
                    reasons.append(f"\\lim_{{x \\to {sp.latex(c)}^+}} f(x) = {sp.latex(limit_right)}")
                
                v_report.append({
                    "equation": f"x = {sp.latex(c)}",
                    "value": str(c),
                    "latex": f"x = {sp.latex(c)}",
                    "limits_latex": ", ".join(reasons),
                    "description": desc
                })
                
        # 2. Horizontal Asymptotes (TCN)
        lim_pos = CASEngine.eval_limit(expr, sp.oo)
        lim_neg = CASEngine.eval_limit(expr, -sp.oo)
        
        has_pos_ha = lim_pos is not sp.nan and not lim_pos.has(sp.oo, -sp.oo) and lim_pos.is_number and CASEngine.safe_is_real(lim_pos)
        has_neg_ha = lim_neg is not sp.nan and not lim_neg.has(sp.oo, -sp.oo) and lim_neg.is_number and CASEngine.safe_is_real(lim_neg)
        
        if has_pos_ha and has_neg_ha:
            if sp.simplify(lim_pos - lim_neg) == 0:
                h_report.append({
                    "equation": f"y = {sp.latex(lim_pos)}",
                    "direction": "both",
                    "latex": f"y = {sp.latex(lim_pos)}",
                    "limits_latex": f"\\lim_{{x \\to \\pm\\infty}} f(x) = {sp.latex(lim_pos)}",
                    "description": f"Đường thẳng y = {sp.latex(lim_pos)} là tiệm cận ngang khi $x \\to \\pm\\infty$"
                })
            else:
                h_report.append({
                    "equation": f"y = {sp.latex(lim_pos)}",
                    "direction": "+oo",
                    "latex": f"y = {sp.latex(lim_pos)}",
                    "limits_latex": f"\\lim_{{x \\to +\\infty}} f(x) = {sp.latex(lim_pos)}",
                    "description": f"Đường thẳng y = {sp.latex(lim_pos)} là tiệm cận ngang khi $x \\to +\\infty$"
                })
                h_report.append({
                    "equation": f"y = {sp.latex(lim_neg)}",
                    "direction": "-oo",
                    "latex": f"y = {sp.latex(lim_neg)}",
                    "limits_latex": f"\\lim_{{x \\to -\\infty}} f(x) = {sp.latex(lim_neg)}",
                    "description": f"Đường thẳng y = {sp.latex(lim_neg)} là tiệm cận ngang khi $x \\to -\\infty$"
                })
        elif has_pos_ha:
            h_report.append({
                "equation": f"y = {sp.latex(lim_pos)}",
                "direction": "+oo",
                "latex": f"y = {sp.latex(lim_pos)}",
                "limits_latex": f"\\lim_{{x \\to +\\infty}} f(x) = {sp.latex(lim_pos)}",
                "description": f"Đường thẳng y = {sp.latex(lim_pos)} là tiệm cận ngang khi $x \\to +\\infty$"
            })
        elif has_neg_ha:
            h_report.append({
                "equation": f"y = {sp.latex(lim_neg)}",
                "direction": "-oo",
                "latex": f"y = {sp.latex(lim_neg)}",
                "limits_latex": f"\\lim_{{x \\to -\\infty}} f(x) = {sp.latex(lim_neg)}",
                "description": f"Đường thẳng y = {sp.latex(lim_neg)} là tiệm cận ngang khi $x \\to -\\infty$"
            })
            
        # 3. Slant Asymptotes (TCX)
        slant_dirs = [("+oo", sp.oo), ("-oo", -sp.oo)]
        s_data = {}
        for direction, inf_val in slant_dirs:
            slope = CASEngine.eval_limit(expr / x, inf_val)
            if slope is not sp.nan and slope != 0 and not slope.has(sp.oo, -sp.oo) and slope.is_number and CASEngine.safe_is_real(slope):
                intercept = CASEngine.eval_limit(expr - slope * x, inf_val)
                if intercept is not sp.nan and not intercept.has(sp.oo, -sp.oo) and intercept.is_number and CASEngine.safe_is_real(intercept):
                    s_data[direction] = (slope, intercept)
                    
        if "+oo" in s_data and "-oo" in s_data:
            s_pos = s_data["+oo"]
            s_neg = s_data["-oo"]
            if sp.simplify(s_pos[0] - s_neg[0]) == 0 and sp.simplify(s_pos[1] - s_neg[1]) == 0:
                eq_latex = f"y = {sp.latex(s_pos[0] * x + s_pos[1])}" if s_pos[1] != 0 else f"y = {sp.latex(s_pos[0] * x)}"
                s_report.append({
                    "equation": eq_latex,
                    "direction": "both",
                    "latex": eq_latex,
                    "slope": str(s_pos[0]),
                    "intercept": str(s_pos[1]),
                    "limits_latex": f"\\lim_{{x \\to \\pm\\infty}} \\frac{{f(x)}}{{x}} = {sp.latex(s_pos[0])}, \\lim_{{x \\to \\pm\\infty}} (f(x) - {sp.latex(s_pos[0])}x) = {sp.latex(s_pos[1])}",
                    "description": f"Đường thẳng {eq_latex} là tiệm cận xiên khi $x \\to \\pm\\infty$"
                })
            else:
                for direction in ["+oo", "-oo"]:
                    s_val = s_data[direction]
                    dir_text = "+\\infty" if direction == "+oo" else "-\\infty"
                    eq_latex = f"y = {sp.latex(s_val[0] * x + s_val[1])}" if s_val[1] != 0 else f"y = {sp.latex(s_val[0] * x)}"
                    s_report.append({
                        "equation": eq_latex,
                        "direction": direction,
                        "latex": eq_latex,
                        "slope": str(s_val[0]),
                        "intercept": str(s_val[1]),
                        "limits_latex": f"\\lim_{{x \\to {dir_text}}} \\frac{{f(x)}}{{x}} = {sp.latex(s_val[0])}, \\lim_{{x \\to {dir_text}}} (f(x) - {sp.latex(s_val[0])}x) = {sp.latex(s_val[1])}",
                        "description": f"Đường thẳng {eq_latex} là tiệm cận xiên khi $x \\to {dir_text}$"
                    })
        elif "+oo" in s_data:
            s_val = s_data["+oo"]
            eq_latex = f"y = {sp.latex(s_val[0] * x + s_val[1])}" if s_val[1] != 0 else f"y = {sp.latex(s_val[0] * x)}"
            s_report.append({
                "equation": eq_latex,
                "direction": "+oo",
                "latex": eq_latex,
                "slope": str(s_val[0]),
                "intercept": str(s_val[1]),
                "limits_latex": f"\\lim_{{x \\to +\\infty}} \\frac{{f(x)}}{{x}} = {sp.latex(s_val[0])}, \\lim_{{x \\to +\\infty}} (f(x) - {sp.latex(s_val[0])}x) = {sp.latex(s_val[1])}",
                "description": f"Đường thẳng {eq_latex} là tiệm cận xiên khi $x \\to +\\infty$"
            })
        elif "-oo" in s_data:
            s_val = s_data["-oo"]
            eq_latex = f"y = {sp.latex(s_val[0] * x + s_val[1])}" if s_val[1] != 0 else f"y = {sp.latex(s_val[0] * x)}"
            s_report.append({
                "equation": eq_latex,
                "direction": "-oo",
                "latex": eq_latex,
                "slope": str(s_val[0]),
                "intercept": str(s_val[1]),
                "limits_latex": f"\\lim_{{x \\to -\\infty}} \\frac{{f(x)}}{{x}} = {sp.latex(s_val[0])}, \\lim_{{x \\to -\\infty}} (f(x) - {sp.latex(s_val[0])}x) = {sp.latex(s_val[1])}",
                "description": f"Đường thẳng {eq_latex} là tiệm cận xiên khi $x \\to -\\infty$"
            })
            
        # 4. Curved Polynomial Asymptotes (Tiệm Cận Cong Đa Thức - TCC)
        try:
            expr_simp = sp.cancel(expr)
            num, den = sp.fraction(expr_simp)
            if den != 1 and num.is_polynomial(x) and den.is_polynomial(x):
                q, r = sp.div(num, den, x)
                deg = sp.degree(q, x)
                if deg >= 2 and r != 0:
                    eq_latex = f"y = {sp.latex(q)}"
                    c_report.append({
                        "equation": eq_latex,
                        "polynomial_latex": sp.latex(q),
                        "degree": int(deg),
                        "remainder_latex": sp.latex(r),
                        "denominator_latex": sp.latex(den),
                        "latex": eq_latex,
                        "limits_latex": f"f(x) = {sp.latex(q)} + \\frac{{{sp.latex(r)}}}{{{sp.latex(den)}}}, \\text{{ trong đó }} \\lim_{{x \\to \\pm\\infty}} \\frac{{{sp.latex(r)}}}{{{sp.latex(den)}}} = 0",
                        "description": f"Đường cong {eq_latex} (bậc {deg}) là tiệm cận cong của đồ thị"
                    })
        except Exception:
            pass
            
        return {
            "vertical": v_report,
            "horizontal": h_report,
            "slant": s_report,
            "curved": c_report
        }
