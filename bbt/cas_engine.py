# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: cas_engine.py
Description: The core Symbolic Mathematical Kernel (backed by robust SymPy utilities).
             Exposes standard algebraic primitives used by analytical modules.
"""

import sympy as sp
from typing import Any, List, Union, Tuple, Dict
from parser_engine import ParserEngine

class CASEngine:
    """
    Symbolic layer encapsulating SymPy to act as VietMath's math kernel.
    Safely executes differentiation, factoring, simplification, equations, limits.
    """

    @staticmethod
    def parse_expr(expr_str: str) -> sp.Expr:
        """Parses a string into a symbolic SymPy Expression."""
        processed = ParserEngine.preprocess_string(expr_str)
        # Create symbol x as a real quantity by default for calculus correctness
        x = sp.Symbol('x', real=True)
        local_dict = {
            'x': x,
            'I': sp.I,
            'pi': sp.pi,
            'oo': sp.oo,
            'abs': sp.Abs,
            'Abs': sp.Abs,
            'sqrt': sp.sqrt,
            'cbrt': sp.cbrt,
            'root': sp.root,
            'log': sp.log,
            'log10': lambda arg: sp.log(arg, 10),
            'log2': lambda arg: sp.log(arg, 2),
            'ln': sp.log,
            'exp': sp.exp,
            'sin': sp.sin,
            'cos': sp.cos,
            'tan': sp.tan,
        }
        return sp.parse_expr(processed, local_dict=local_dict)

    @staticmethod
    def get_symbol_x() -> sp.Symbol:
        """Returns the default independent real symbol 'x'."""
        return sp.Symbol('x', real=True)

    @classmethod
    def safe_is_real(cls, val: Any) -> bool:
        """Checks if a sympy value is completely real and non-imaginary."""
        if val is None:
            return False
        if val == sp.zoo or val is sp.zoo:
            return False
        if val in [sp.oo, -sp.oo]:
            return True
        if val is sp.nan:
            return False
        try:
            # Check if has imaginary unit explicitly or under evalf
            ev = val.evalf()
            if ev.has(sp.I):
                return False
            # Check imaginary part
            _, imag_p = ev.as_real_imag()
            if abs(float(imag_p)) > 1e-9:
                return False
            return True
        except Exception:
            return False

    @classmethod
    def safe_float(cls, val: Any, default: float = 0.0) -> float:
        """Converts a SymPy expression safely to a float, returning only the real part to prevent complex float errors."""
        if val is None or val is sp.nan or val == sp.zoo or val is sp.zoo:
            return default
        if val == sp.oo:
            return float('inf')
        if val == -sp.oo:
            return -float('inf')
        try:
            # Safely extract the real part to shield from float conversion crashes
            real_val = sp.re(val.evalf())
            return float(real_val)
        except Exception:
            return default

    @classmethod
    def derivative(cls, expr: sp.Expr) -> sp.Expr:
        """Calculates the simplified symbolic derivative f'(x)."""
        x = cls.get_symbol_x()
        deriv = sp.diff(expr, x)
        return sp.simplify(deriv)

    @classmethod
    def simplify_expr(cls, expr: sp.Expr) -> sp.Expr:
        """Sympy simplifies an expression."""
        return sp.simplify(expr)

    @classmethod
    def factor_expr(cls, expr: sp.Expr) -> sp.Expr:
        """Factors an expression over the rational field."""
        return sp.factor(expr)

    @classmethod
    def solve_equation(cls, expr: sp.Expr) -> List[sp.Expr]:
        """
        Solves expr(x) = 0 for the real symbol x.
        Filters out complex/imaginary roots to ensure mathematical correctness on R.
        """
        x = cls.get_symbol_x()
        try:
            # Solveset or standard solver
            sol_set = sp.solveset(expr, x, domain=sp.S.Reals)
            
            # Unpack finite sets or list of elements
            if isinstance(sol_set, sp.FiniteSet):
                roots = list(sol_set)
            else:
                # Fallback to standard sympy solve
                roots = sp.solve(expr, x)
                roots = [r for r in roots if cls.safe_is_real(r)]
        except Exception:
            try:
                roots = sp.solve(expr, x)
                roots = [r for r in roots if cls.safe_is_real(r)]
            except Exception:
                roots = []
                
        # Deduplicate roots
        unique_roots = []
        for r in roots:
            r_simp = sp.simplify(r)
            if r_simp not in unique_roots and cls.safe_is_real(r_simp):
                unique_roots.append(r_simp)
                
        # Sort roots numerically
        try:
            unique_roots.sort(key=lambda val: cls.safe_float(val))
        except Exception:
            # If analytical sort fails, fallback to unsorted
            pass
            
        return unique_roots

    @classmethod
    def eval_limit(cls, expr: sp.Expr, point: Union[sp.Expr, float, str], direction: str = "both") -> sp.Expr:
        """
        Calculates lim_{x -> point} f(x) from the specified direction.
        Directions: 'both', '+', '-'
        """
        x = cls.get_symbol_x()
        
        # Handle boundary infinite string representation
        if str(point).strip() == "+oo" or point == sp.oo:
            target = sp.oo
            dir_sym = "both"
        elif str(point).strip() == "-oo" or point == -sp.oo:
            target = -sp.oo
            dir_sym = "both"
        else:
            target = sp.simplify(point)
            dir_sym = direction

        # Rewrite exponential components (base**exponent) where base is positive real number (except e)
        # to e**(exponent * ln(base)) to bypass SymPy 1.13.3's limit solver quirk on generic bases
        try:
            expr_rewritten = expr.replace(
                lambda sub: sub.is_Pow and sub.base.is_number and sub.base > 0 and sub.base != sp.E,
                lambda sub: sp.exp(sub.exp * sp.log(sub.base))
            )
        except Exception:
            expr_rewritten = expr

        try:
            # Evaluate using SymPy's powerful limit solver
            if dir_sym in ["+", "-"]:
                # '+' means from right, '-' means from left
                lim_val = sp.limit(expr_rewritten, x, target, dir=dir_sym)
            else:
                lim_val = sp.limit(expr_rewritten, x, target)
            resolved_val = sp.simplify(lim_val)
            
            # Resolve complex infinity (zoo) to +oo or -oo if possible
            if resolved_val == sp.zoo or resolved_val is sp.zoo:
                try:
                    pt_val = cls.safe_float(target)
                    # probe slightly left/right depending on direction selection
                    if dir_sym == "-":
                        probe_pt = pt_val - 1e-7
                    elif dir_sym == "+":
                        probe_pt = pt_val + 1e-7
                    else:
                        probe_pt = pt_val + 1e-7
                    val_at_probe = cls.safe_float(expr_rewritten.subs(x, probe_pt).evalf())
                    return sp.oo if val_at_probe >= 0 else -sp.oo
                except Exception:
                    return sp.oo
            return resolved_val
        except Exception as e:
            # Numerical approximation fallback on limit failure.
            try:
                f_float = sp.lambdify(x, expr_rewritten, 'numpy')
                pt_val = cls.safe_float(target)
                if dir_sym == "-":
                    approx = f_float(pt_val - 1e-7)
                elif dir_sym == "+":
                    approx = f_float(pt_val + 1e-7)
                else:
                    approx = (f_float(pt_val - 1e-7) + f_float(pt_val + 1e-7)) / 2.0
                return sp.Rational(approx).limit_denominator(1000)
            except Exception:
                return sp.nan

    @classmethod
    def evaluate_at(cls, expr: sp.Expr, pt: Union[sp.Expr, float]) -> sp.Expr:
        """Evaluates f(x) at point x = pt."""
        x = cls.get_symbol_x()
        try:
            val = expr.subs(x, pt)
            return sp.simplify(val)
        except Exception:
            return sp.nan
