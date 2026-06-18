# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: domain_engine.py
Description: Analyzes topological domains of definition, singularities, poles, and disconnections on R.
"""

import sympy as sp
from typing import List, Tuple, Union, Dict
from cas_engine import CASEngine

class DomainEngine:
    """
    Analyzes the mathematical domain of definition (tập xác định) for VietMath functions.
    Deduces poles (điểm gián đoạn), horizontal/vertical bounds, and isolates disconnected intervals.
    """

    @staticmethod
    def format_val_label(val: sp.Expr) -> str:
        if isinstance(val, sp.Rational) or val.is_Rational:
            if val.q == 1:
                return str(val.p)
            return f"{val.p}/{val.q}"
        if isinstance(val, sp.Float) or val.is_Float:
            f_val = float(val)
            if f_val.is_integer():
                return str(int(f_val))
            return f"{f_val:.2f}"
        return str(val).replace("**", "^").replace("*", "")

    @classmethod
    def format_domain_vnm(cls, expr: sp.Expr) -> str:
        """
        Formats the domain in Vietnamese Textbook custom style, e.g. D = R \ {1} or D = [0; +oo).
        """
        poles = cls.find_singularities(expr)
        intervals = cls.get_valid_domain_intervals(expr)
        
        if not intervals:
            return "D = \u2205 (T\u1eadp r\u1ed7ng)"
            
        has_hard_bounds = False
        for inter in intervals:
            if inter.start != -sp.oo and inter.start not in poles:
                if not any(abs(CASEngine.safe_float(inter.start - p)) < 1e-9 for p in poles):
                    has_hard_bounds = True
            if inter.end != sp.oo and inter.end not in poles:
                if not any(abs(CASEngine.safe_float(inter.end - p)) < 1e-9 for p in poles):
                    has_hard_bounds = True
                    
        if not has_hard_bounds:
            if not poles:
                return "D = \u211d"
            else:
                poles_str = []
                for p in poles:
                    poles_str.append(cls.format_val_label(p))
                return "D = \u211d \\\\ {" + ", ".join(poles_str) + "}"
        
        parts = []
        for inter in intervals:
            start_sym = "[" if inter.left_open == False else "("
            end_sym = "]" if inter.right_open == False else ")"
            
            if inter.start == -sp.oo:
                start_lbl = "-\u221e"
            else:
                start_lbl = cls.format_val_label(inter.start)
                
            if inter.end == sp.oo:
                end_lbl = "+\u221e"
            else:
                end_lbl = cls.format_val_label(inter.end)
                
            parts.append(f"{start_sym}{start_lbl}; {end_lbl}{end_sym}")
            
        return "D = " + " \u222a ".join(parts)

    @classmethod
    def find_singularities(cls, expr: sp.Expr) -> List[sp.Expr]:
        """
        Scans for poles (denominator roots) where the function is mathematically undefined.
        For example: f(x) = (x^2-1)/(x-2) -> x = 2 is undefined.
        """
        x = CASEngine.get_symbol_x()
        singularities = []

        # Find denominators in the expression tree
        # Sympy expressions can be written as fraction: numer, denom = sp.fraction(expr)
        numer, denom = sp.fraction(expr)
        if denom != 1:
            roots = CASEngine.solve_equation(denom)
            for r in roots:
                if r not in singularities:
                    singularities.append(r)

        # Handle sub-elements of powers with negative exponent, which are implicit denominators
        # E.g., (x-1)**(-2) or similar
        for sub_expr in sp.preorder_traversal(expr):
            if isinstance(sub_expr, sp.Pow):
                base, exp = sub_expr.as_base_exp()
                # If exponent is negative, the base cannot be zero
                if exp.is_number and exp < 0:
                    bases_roots = CASEngine.solve_equation(base)
                    for r in bases_roots:
                        if r not in singularities:
                            singularities.append(r)

        # Sort singularities numerically
        try:
            singularities.sort(key=lambda root: CASEngine.safe_float(root))
        except Exception:
            pass

        return singularities

    @classmethod
    def get_valid_domain_intervals(cls, expr: sp.Expr) -> List[sp.Interval]:
        """
        Analyzes constraints (like radicand greater than or equal to zero) and denominator poles,
        returning a list of valid R-domain intervals where the function is defined.
        For example, sqrt(x+1)/(x-1) is defined on [-1, 1) U (1, +oo).
        """
        x = CASEngine.get_symbol_x()
        domain = sp.S.Reals

        # 1. Denominator singularities (exclude them)
        poles = cls.find_singularities(expr)
        for pole in poles:
            domain = domain - sp.FiniteSet(pole)

        # 2. Constraints from functions: log(arg) > 0, -1 <= asin/acos(arg) <= 1, even fractional powers >= 0
        for sub_expr in sp.preorder_traversal(expr):
            # A. Logarithmic constraints: log(u) -> u > 0
            if isinstance(sub_expr, sp.log):
                try:
                    arg = sub_expr.args[0]
                    arg_pos = sp.solve_univariate_inequality(arg > 0, x, relational=False, domain=sp.S.Reals)
                    domain = domain.intersect(arg_pos)
                except Exception:
                    pass

            # B. Inverse trig constraints: asin(u), acos(u) -> -1 <= u <= 1
            elif isinstance(sub_expr, (sp.asin, sp.acos)):
                try:
                    arg = sub_expr.args[0]
                    arg_ge = sp.solve_univariate_inequality(arg >= -1, x, relational=False, domain=sp.S.Reals)
                    arg_le = sp.solve_univariate_inequality(arg <= 1, x, relational=False, domain=sp.S.Reals)
                    domain = domain.intersect(arg_ge).intersect(arg_le)
                except Exception:
                    pass

            # C. Radicando constraints: even fractional powers (e.g., base**(1/2)) must be non-negative
            elif isinstance(sub_expr, sp.Pow) or type(sub_expr).__name__ in ("Pow", "root") or str(sub_expr).startswith("sqrt"):
                if hasattr(sub_expr, "as_base_exp"):
                    base, exp = sub_expr.as_base_exp()
                else:
                    # In case of sp.root
                    try:
                        base = sub_expr.args[0]
                        exp = 1 / sub_expr.args[1] if len(sub_expr.args) > 1 else sp.Rational(1, 2)
                    except Exception:
                        continue

                # If power has an even denominator (like 1/2, 1/4), base >= 0
                is_even_root = False
                if exp.is_Rational:
                    if exp.q % 2 == 0:  # Denominator is even (like 1/2)
                        is_even_root = True
                elif isinstance(exp, sp.Float) or exp.is_Float:
                    # Heuristics for floats like 0.5
                    val = float(exp)
                    if abs(val - 0.5) < 1e-9:
                        is_even_root = True

                if is_even_root:
                    # Solve base >= 0 on Reals
                    try:
                        base_nonneg = sp.solve_univariate_inequality(base >= 0, x, relational=False, domain=sp.S.Reals)
                        domain = domain.intersect(base_nonneg)
                    except Exception:
                        # Fallback: if solveset fails, assume base >= 0 is a simple interval
                        pass

        # Parse Sympy Domain into a simplified list of Interval wrappers
        intervals = []
        if isinstance(domain, sp.Interval):
            intervals.append(domain)
        elif isinstance(domain, sp.Union):
            # Union of disjoint intervals
            for item in domain.args:
                if isinstance(item, sp.Interval):
                    intervals.append(item)
                elif isinstance(item, sp.FiniteSet):
                    # Exclude finite sets
                    pass
        elif hasattr(domain, "args"):
            for arg in domain.args:
                if isinstance(arg, sp.Interval):
                    intervals.append(arg)

        # De-duplicate, simplify and sort
        simplified_intervals = []
        for interval in intervals:
            if not interval.is_empty:
                simplified_intervals.append(interval)
                
        # Sort intervals from left to right
        try:
            simplified_intervals.sort(key=lambda inter: CASEngine.safe_float(inter.start) if inter.start != -sp.oo else -float('inf'))
        except Exception:
            pass

        return simplified_intervals
