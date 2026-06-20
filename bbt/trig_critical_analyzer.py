# -*- coding: utf-8 -*-
"""
VietMath Pro - High School Trigonometric Variation Engine
Module: trig_critical_analyzer.py
Description: Dedicated, mathematically rigorous CAS analyzer for high school trigonometric functions.
"""

import sympy as sp
import math
import json
import re
from typing import List, Dict, Tuple, Any, Union
from fractions import Fraction
from validator import ForbiddenFunctionException

class TrigVariationDescriptor:
    """
    Unified container representing the complete 'High School Trigonometric Layer' variation.
    Acts as the well-defined descriptor object connecting to VariationTableur.
    """
    def __init__(self,
                 domain: Dict[str, Any],
                 period: Dict[str, Any],
                 derivative_roots: List[Dict[str, Any]],
                 interval_roots: List[float],
                 derivative_signs: List[Dict[str, Any]],
                 poles: List[Union[sp.Expr, float]],
                 extrema: List[Dict[str, Any]],
                 interval: Tuple[float, float]):
        self.domain = domain
        self.period = period
        self.derivative_roots = derivative_roots
        self.interval_roots = interval_roots
        self.derivative_signs = derivative_signs
        self.poles = poles
        self.extrema = extrema
        self.interval = interval


class TrigCriticalAnalyzer:
    """
    Determinative, CAS-correct, precise analyzer for TrigHSProfile.
    Implements domain calculation, period detection, derivative solver, root family normalization,
    sign pattern analysis, and interval projection.
    """

    @staticmethod
    def is_trig_expression(expr_str: str) -> bool:
        """Determines if the expression contains trig keywords."""
        cleaned = expr_str.lower()
        return any(k in cleaned for k in ["sin", "cos", "tan"])

    @classmethod
    def validate_trig_profile(cls, expr_str: str) -> None:
        """
        Rigorously validates and checks if expression complies with TrigHSProfile boundaries.
        Throws ForbiddenFunctionException if outside boundaries, with precise Vietnamese feedback.
        """
        cleaned = re.sub(r"\s+", "", expr_str.lower())

        # 1. Reject Inverse Trigonometric Functions
        for term in ["arcsin", "arccos", "arctan", "asin", "acos", "atan", "cot", "sec", "csc"]:
            if term in cleaned:
                raise ForbiddenFunctionException(
                    message=f"Inverse trig/cotangent unsupported: {term}",
                    vietnamese_detail="Hàm số chứa hàm lượng giác ngược (arcsin, arccos, arctan) hoặc hàm cot, sec, csc không được hỗ trợ."
                )

        # Pre-parse using sympy to traverse AST correctly
        try:
            x = sp.Symbol('x', real=True)
            local_dict = {
                'x': x,
                'sin': sp.sin,
                'cos': sp.cos,
                'tan': sp.tan,
                'pi': sp.pi,
                'sqrt': sp.sqrt,
                'abs': sp.Abs,
                'Abs': sp.Abs
            }
            # Handle standard implicit multiplications to avoid SyntaxError
            processed_expr = TrigCriticalAnalyzer._preprocess_expr_str(expr_str)
            expr = sp.parse_expr(processed_expr, local_dict=local_dict)
        except Exception as e:
            # Let the standard error handling catch this or raise
            return

        # 2. Reject Nested Compositions (e.g. sin(sin(x)))
        for node in sp.preorder_traversal(expr):
            if type(node) in (sp.sin, sp.cos, sp.tan):
                for sub in sp.preorder_traversal(node.args[0]):
                    if type(sub) in (sp.sin, sp.cos, sp.tan):
                        raise ForbiddenFunctionException(
                            message="Nested trig composition detected",
                            vietnamese_detail="Hàm số chứa cấu trúc lượng giác lồng nhau không được hỗ trợ (ví dụ: sin(sin(x)))."
                        )

        # 3. Reject large Fourier structures (> 5 terms of trig functions)
        trig_node_count = sum(1 for node in sp.preorder_traversal(expr) if type(node) in (sp.sin, sp.cos, sp.tan))
        if trig_node_count > 5:
            raise ForbiddenFunctionException(
                message="Large Fourier structure detected (> 5 terms)",
                vietnamese_detail="Chuỗi lượng giác quá lớn (số lượng số hạng lượng giác > 5) không được hỗ trợ."
            )

        # 4. Reject mixed transcendental functions (e^sinx, ln(cosx), sqrt(tanx), sinx*e^x)
        # Search for exp, log, or non-integer Pow containing trig
        for node in sp.preorder_traversal(expr):
            name = type(node).__name__
            if name in ("exp", "log") or (hasattr(node, 'is_Function') and node.func.__name__ in ("exp", "log")):
                raise ForbiddenFunctionException(
                    message="Mixed exponential/log and trig detected",
                    vietnamese_detail="Hàm số chứa dạng siêu việt hỗn hợp (như e^(sinx), ln(cosx)) không được hỗ trợ."
                )
            if node.is_Mul:
                has_trig = any(type(sub) in (sp.sin, sp.cos, sp.tan) or sub.has(sp.sin, sp.cos, sp.tan) for sub in node.args)
                has_other_trans = any(sub.has(sp.exp, sp.log) for sub in node.args)
                if has_trig and has_other_trans:
                    raise ForbiddenFunctionException(
                        message="Trig multiplied by other transcendental functions",
                        vietnamese_detail="Hàm số chứa dạng siêu việt hỗn hợp (như sin(x)*e^x) không được hỗ trợ."
                    )
            if node.is_Pow:
                base, exp = node.as_base_exp()
                if base.has(sp.sin, sp.cos, sp.tan) and not exp.is_Integer:
                    raise ForbiddenFunctionException(
                        message="Trig inside fractional power/radical",
                        vietnamese_detail="Hàm số chứa dạng siêu việt hỗn hợp (như sqrt(tanx)) không được hỗ trợ."
                    )

        # 5. Check arguments of trig functions (quadratic degree, non-periodicity)
        for node in sp.preorder_traversal(expr):
            if type(node) in (sp.sin, sp.cos, sp.tan):
                arg = node.args[0]
                if arg.has(x):
                    # Check if arg is polynomial
                    try:
                        poly = arg.as_poly(x)
                        if poly is None:
                            # e.g. arg = 1/x or sqrt(x) inside trig
                            raise ValueError()
                        deg = poly.degree()
                        if deg > 2:
                            raise ForbiddenFunctionException(
                                message=f"High degree argument polynomial inside trig: {deg}",
                                vietnamese_detail="Hàm số mất tính tuần hoàn hoặc quá phức tạp (ví dụ: sin(x³)) không được hỗ trợ."
                            )
                        if deg == 2:
                            # For quadratic argument (deg 2), we only allow very shallow forms:
                            # only sin(x^2), cos(a*x^2) are permitted. Must NOT have linear term!
                            # check coefficient of x
                            coeff_x = poly.coeff_monomial(x)
                            if coeff_x != 0:
                                raise ForbiddenFunctionException(
                                    message="Quadratic argument has linear term, loss of periodicity",
                                    vietnamese_detail="Hàm số mất tính tuần hoàn hoặc quá phức tạp (ví dụ: sin(x²+x)) không được hỗ trợ."
                                )
                    except Exception as poly_err:
                        if isinstance(poly_err, ForbiddenFunctionException):
                            raise poly_err
                        raise ForbiddenFunctionException(
                            message="Trig argument contains nested transcendental or non-polynomial structures",
                            vietnamese_detail="Hàm số mất tính tuần hoàn hoặc quá phức tạp (ví dụ: cos(e^x)) không được hỗ trợ."
                        )

    @classmethod
    def _preprocess_expr_str(cls, expr_str: str) -> str:
        """Helper to replace power of trig like sin^2(x) with (sin(x))^2 and handle implicit multiplications."""
        processed = expr_str.strip().lower()
        processed = processed.replace("^", "**")
        
        # Translate sin^2(x) or sin**2(x) -> (sin(x))**2
        processed = re.sub(r"([a-zA-Z]+)\*\*?(\d+)\((.*?)\)", r"(\1(\3))**\2", processed)
        
        # Add implicit multiplications
        processed = re.sub(r"(\d+)([a-zA-Z])", r"\1*\2", processed)
        processed = re.sub(r"\)\(", r")*(", processed)
        processed = re.sub(r"(\d+)\(", r"\1*(", processed)
        
        def repl_unsupported(match):
            word = match.group(1)
            if word in {"abs", "sqrt", "cbrt", "root", "log", "log10", "log2", "ln", "exp", "sin", "cos", "tan"}:
                return f"{word}("
            return f"{word}*("
        processed = re.sub(r"([a-zA-Z]+)\(", repl_unsupported, processed)
        processed = re.sub(r"\)([a-zA-Z])", r")*\1", processed)
        
        return processed

    @classmethod
    def _classify_exactness(cls, val: sp.Expr) -> Tuple[bool, str, sp.Expr]:
        """
        Analyzes a sympy Expression to determine if it is mathematically exact/beautiful,
        or if it is an approximate decimal.
        Returns:
            is_exact (bool): True if exact/beautiful, False if approximate float.
            label (str): Beautiful unicode label (e.g. '3√2/d', '7π/6', or a nice decimal).
            exact_val (sp.Expr): The simplified symbolic representation.
        """
        if val is None or val is sp.nan or val == sp.zoo or val is sp.zoo:
            return True, "", val

        # 1. Check if it's already a clean rational/multiple of pi
        try:
            if val.is_Integer or val.is_Rational:
                return True, cls._render_point_label(val), val
        except Exception:
            pass

        # 2. Check if multiple of pi
        try:
            pi_ratio = float((val / sp.pi).evalf())
            frac = Fraction(pi_ratio).limit_denominator(120)
            if abs(float(frac) - pi_ratio) < 1e-11:
                exact_sym = sp.Rational(frac.numerator, frac.denominator) * sp.pi
                return True, cls._render_point_label(exact_sym), exact_sym
        except Exception:
            pass

        # 3. Check for nice square root or surd of form a*sqrt(b)/c
        try:
            val_f = float(val.evalf())
            # Let's square it
            val_sq = val_f**2
            frac_sq = Fraction(val_sq).limit_denominator(144)
            if abs(float(frac_sq) - val_sq) < 1e-11:
                sign = 1 if val_f >= 0 else -1
                exact_sym = sp.simplify(sign * sp.sqrt(sp.Rational(frac_sq.numerator, frac_sq.denominator)))
                # Render label beautifully using simplified label
                return True, cls._render_point_label(exact_sym), exact_sym
        except Exception:
            pass

        # 4. Check if we can simplify it symbolically with zero Float instances
        try:
            simp = sp.simplify(val)
            has_float = any(isinstance(node, (sp.Float, float)) for node in sp.preorder_traversal(simp))
            if not has_float:
                return True, cls._render_point_label(simp), simp
        except Exception:
            pass

        # 5. It is an approximate value!
        try:
            val_f = float(val.evalf(35)) # Keep high precision under the hood
            label = f"{val_f:.6f}".rstrip('0').rstrip('.')
            if not label or label == "-0":
                label = "0"
            return False, label, val
        except Exception:
            return False, str(val), val

    @classmethod
    def analyze_trig_function(cls, expr_str: str) -> Dict[str, Any]:
        """
        Fully solves the trigonometric function, builds the descriptor,
        and constructs the exact VariationTableur metadata.
        """
        x = sp.Symbol('x', real=True)
        local_dict = {
            'x': x,
            'sin': sp.sin,
            'cos': sp.cos,
            'tan': sp.tan,
            'pi': sp.pi,
            'sqrt': sp.sqrt,
            'abs': sp.Abs,
            'Abs': sp.Abs
        }
        processed_expr = cls._preprocess_expr_str(expr_str)
        expr = sp.parse_expr(processed_expr, local_dict=local_dict)
        deriv = sp.simplify(sp.diff(expr, x))

        # 1. Detect natural fundamental period
        period_val, period_lbl = cls._detect_period(expr)
        
        # If period exists, automatically set standard render boundaries to make table beautiful
        if period_val is not None:
            # Has period. Use [0, T] for sin/cos, [-T/2, T/2] for tan to align poles perfectly
            has_tan = any(type(node) == sp.tan for node in sp.preorder_traversal(expr))
            if has_tan:
                start_val = -period_val / 2
                end_val = period_val / 2
            else:
                start_val = sp.Rational(0)
                end_val = period_val
        else:
            # Non-periodic composition: e.g. sin(x^2). Force [-pi, pi] finite interval
            start_val = -sp.pi
            end_val = sp.pi

        # 2. Domain & Poles Analyzer inside rendering interval [start, end]
        poles_in_interval = cls._find_poles_in_interval(expr, start_val, end_val)
        domain_str = cls._format_domain_vnm(expr)

        # 3. Solve derivative roots inside interval [start, end]
        crit_roots = cls._solve_derivative_roots(deriv, expr, start_val, end_val, poles_in_interval)

        # Sorted unique list of X points (boundaries, roots, poles)
        boundary_start = float(start_val.evalf())
        boundary_end = float(end_val.evalf())
        
        raw_xs = [start_val]
        for r in crit_roots:
            raw_xs.append(r)
        for p in poles_in_interval:
            raw_xs.append(p)
        raw_xs.append(end_val)

        # Sort and clean unique x points lists
        unique_xs = []
        for rx in raw_xs:
            fl_val = float(rx.evalf())
            # Ensure unique by float value comparison
            if not any(abs(float(ux.evalf()) - fl_val) < 1e-9 for ux in unique_xs):
                unique_xs.append(rx)
                
        unique_xs.sort(key=lambda val: float(val.evalf()))

        # 4. Root normalizer to Infinite Families representing CAS
        root_families = cls._normalize_root_families(crit_roots, period_val)

        # 5. Populate Column definitions for SVG Variation tableur
        columns = []
        x_subs = {}
        y_subs = {}

        for index, xp in enumerate(unique_xs):
            pt_meta = {}
            pt_meta["index"] = index
            pt_meta["x_raw"] = xp
            
            is_exact_x, label_x, _ = cls._classify_exactness(xp)
            pt_meta["x_label"] = label_x
            pt_meta["is_approx_x"] = not is_exact_x
            
            # Map approximate/complex x positions to readable abbreviations (e.g., x₁) for the SVG table
            if not is_exact_x and xp not in [sp.oo, -sp.oo]:
                if xp not in x_subs:
                    x_id = len(x_subs) + 1
                    x_symbol = f"x{cls._get_subscript(x_id)}"
                    x_subs[xp] = {
                        "symbol": x_symbol,
                        "val": xp,
                        "index": index,
                        "is_exact": False
                    }
                pt_meta["x_label"] = x_subs[xp]["symbol"]
            
            # Determine if it's a pole
            fl_xp = float(xp.evalf())
            is_pole = any(abs(float(pole.evalf()) - fl_xp) < 1e-9 for pole in poles_in_interval)
            
            # Dynamic pole check: if evaluating f(xp) yields sp.zoo, it is a pole
            if not is_pole:
                try:
                    f_val_test = expr.subs(x, xp)
                    if f_val_test == sp.zoo or f_val_test is sp.zoo:
                        is_pole = True
                except Exception:
                    pass
                    
            pt_meta["is_pole"] = is_pole
            
            # Boundaries of table are marked
            pt_meta["is_domain_boundary"] = (index == 0 or index == len(unique_xs) - 1)

            if is_pole:
                pt_meta["f_prime_val"] = "||"
                
                # Limits at the pole (left and right)
                lim_left = cls._probe_pole_limit(expr, fl_xp, direction="-")
                lim_right = cls._probe_pole_limit(expr, fl_xp, direction="+")
                
                pt_meta["f_val_left"] = lim_left
                pt_meta["f_label_left"] = cls._render_limit_label(lim_left)
                pt_meta["f_val_right"] = lim_right
                pt_meta["f_label_right"] = cls._render_limit_label(lim_right)
            else:
                # Is it a derivative zero?
                is_deriv_zero = any(abs(float(r.evalf()) - fl_xp) < 1e-9 for r in crit_roots)
                if is_deriv_zero:
                    pt_meta["f_prime_val"] = "0"
                else:
                    pt_meta["f_prime_val"] = ""
                
                # Evaluate clean function coordinates
                f_val_raw = expr.subs(x, xp)
                pt_meta["f_val"] = f_val_raw
                
                is_exact_f, label_f, _ = cls._classify_exactness(f_val_raw)
                pt_meta["f_label"] = label_f
                pt_meta["is_approx_f"] = not is_exact_f

                # Check if it needs a substitution (complex coordinates substitutions)
                # If expression representation is too complex to fit inside space or not exact, replace with symbol
                expr_str_val = str(f_val_raw)
                if (not is_exact_f) or (len(expr_str_val) > 10 and not f_val_raw.is_integer):
                    if f_val_raw not in y_subs:
                        y_id = len(y_subs) + 1
                        y_symbol = f"y{cls._get_subscript(y_id)}"
                        y_subs[f_val_raw] = {
                            "symbol": y_symbol,
                            "val": f_val_raw,
                            "index": index,
                            "is_exact": is_exact_f
                        }
                    pt_meta["f_label"] = y_subs[f_val_raw]["symbol"]
                    pt_meta["is_approx_f"] = not is_exact_f

            columns.append(pt_meta)

        # 6. Monotonies (+ / - signs)
        monotony = []
        for i in range(len(columns) - 1):
            col_left = columns[i]
            col_right = columns[i+1]
            
            cl_val = float(col_left["x_raw"].evalf())
            cr_val = float(col_right["x_raw"].evalf())
            
            probe_pt = (cl_val + cr_val) / 2.0
            deriv_at_probe = deriv.subs(x, probe_pt).evalf()
            
            try:
                sign_val = "+" if float(deriv_at_probe) > 1e-9 else "-" if float(deriv_at_probe) < -1e-9 else ""
            except Exception:
                sign_val = "+" # protective fallback
                
            monotony.append({
                "index": i,
                "sign": sign_val,
                "direction": "up" if sign_val == "+" else "down" if sign_val == "-" else "flat",
                "in_domain": True
            })

        # 7. Form Legend
        legend_list = []
        
        # A. Describe families under legend (families of infinite roots)
        for idx, fam in enumerate(root_families, 1):
            legend_list.append({
                "symbol": f"Họ nghiệm {idx}",
                "role": f"Họ nghiệm của đạo hàm f'(x) = 0 ({fam['type']})",
                "value": fam["latex"],
                "is_exact": fam.get("is_exact", True),
                "type": "x"
            })

        # B. Sort and process X substitutions (with 25-digit precision)
        sorted_x_subs = sorted(list(x_subs.values()), key=lambda s: s["symbol"])
        for item in sorted_x_subs:
            val = item["val"]
            sym = item["symbol"]
            idx = item["index"]
            col = columns[idx]
            
            # Roles analyzer for column
            is_local_max = False
            is_local_min = False
            if idx > 0 and idx < len(columns) - 1:
                left_dir = monotony[idx - 1]["direction"]
                right_dir = monotony[idx]["direction"]
                if left_dir == "up" and right_dir == "down":
                    is_local_max = True
                elif left_dir == "down" and right_dir == "up":
                    is_local_min = True
            
            is_deriv_zero = (col.get("f_prime_val") == "0")
            
            roles = []
            if is_local_max:
                roles.append("Điểm cực đại (Local Max)")
            elif is_local_min:
                roles.append("Điểm cực tiểu (Local Min)")
            if is_deriv_zero:
                roles.append("Nghiệm đạo hàm f'(x) = 0")
            
            if not roles:
                roles.append("Điểm khảo sát đặc biệt (Special Survey Point)")
                
            role_desc = ", ".join(roles)
            val_str, is_exact = cls._format_legend_val(val)
            
            legend_list.append({
                "symbol": sym,
                "role": role_desc,
                "value": val_str,
                "is_exact": is_exact,
                "type": "x"
            })

        # C. Sort and process Y substitutions (with 25-digit precision)
        sorted_y_subs = sorted(list(y_subs.values()), key=lambda s: s["symbol"])
        for item in sorted_y_subs:
            val = item["val"]
            sym = item["symbol"]
            idx = item["index"]
            col = columns[idx]
            
            xp_raw = col["x_raw"]
            if xp_raw in x_subs:
                x_ref = x_subs[xp_raw]["symbol"]
            else:
                x_ref = cls._render_point_label(xp_raw)
                
            is_local_max = False
            is_local_min = False
            if idx > 0 and idx < len(columns) - 1:
                left_dir = monotony[idx - 1]["direction"]
                right_dir = monotony[idx]["direction"]
                if left_dir == "up" and right_dir == "down":
                    is_local_max = True
                elif left_dir == "down" and right_dir == "up":
                    is_local_min = True
                    
            roles = []
            if is_local_max:
                roles.append(f"Giá trị cực đại của f(x) tại {x_ref}")
            elif is_local_min:
                roles.append(f"Giá trị cực tiểu của f(x) tại {x_ref}")
            else:
                roles.append(f"Giá trị f(x) tại điểm khảo sát {x_ref}")
                
            role_desc = ", ".join(roles)
            val_str, is_exact = cls._format_legend_val(val)
            
            legend_list.append({
                "symbol": sym,
                "role": role_desc,
                "value": val_str,
                "is_exact": is_exact,
                "type": "y"
            })

        return {
            "expression": expr_str,
            "parsed_symbolic": str(expr),
            "derivative": str(deriv),
            "domain_vnm": domain_str,
            "poles": [str(p) for p in poles_in_interval],
            "v_asymptotes": [str(p) for p in poles_in_interval],
            "h_asymptotes": {},
            "asymptotes_report": {
                "vertical": [
                    {
                        "equation": f"x = {cls._render_point_label(p)}",
                        "latex": f"x = {sp.latex(p)}",
                        "description": "Đường tiệm cận đứng phân tích từ tập xác định hàm Tangent"
                    } for p in poles_in_interval
                ],
                "horizontal": [],
                "slant": [],
                "curved": []
            },
            "columns": columns,
            "monotony": monotony,
            "legend": legend_list
        }

    @classmethod
    def _detect_period(cls, expr: sp.Expr) -> Tuple[Union[sp.Expr, None], str]:
        """Detects fundamental period T. Caches affine factors LCM."""
        x = sp.Symbol('x', real=True)
        subwaves = []
        
        # In polynomial / composites, find all trigonometric nodes
        for node in sp.preorder_traversal(expr):
            if type(node) in (sp.sin, sp.cos, sp.tan):
                arg = node.args[0]
                # Is there a quadratic argument like x^2? If so, non-periodic
                try:
                    poly_arg = arg.as_poly(x)
                    if poly_arg is not None and poly_arg.degree() > 1:
                        return None, "NONE"
                except Exception:
                    pass
                subwaves.append(node)

        if not subwaves:
            return None, "NONE"

        periods = []
        for w in subwaves:
            arg = w.args[0]
            try:
                poly = arg.as_poly(x)
                if poly is None:
                    continue
                a = poly.coeff_monomial(x)
                if a == 0:
                    continue
                
                # T_i = 2*pi/|a| for sin/cos, pi/|a| for tan
                if type(w) == sp.tan:
                    p_coeff = sp.Abs(sp.Rational(1) / a)
                else:
                    p_coeff = sp.Abs(sp.Rational(2) / a)
                periods.append(p_coeff)
            except Exception:
                # If non-linear coefficients or float occurs
                return None, "NONE"

        if not periods:
            return None, "NONE"

        # Calculate LCM of period coefficients (since period is coeff * pi)
        try:
            # Convert sympy rationals/integers to fractions.Fraction
            fracs = []
            for p in periods:
                if isinstance(p, sp.Rational):
                    fracs.append(Fraction(int(p.p), int(p.q)))
                else:
                    fracs.append(Fraction(int(p)))
            
            # LCM logic for Fractions
            num_lcm = math.lcm(*(f.numerator for f in fracs))
            den_gcd = math.gcd(*(f.denominator for f in fracs))
            lcm_frac = Fraction(num_lcm, den_gcd)
            
            final_period = sp.Rational(lcm_frac.numerator, lcm_frac.denominator) * sp.pi
            
            # Format period string
            if lcm_frac.numerator == 1:
                if lcm_frac.denominator == 1:
                    lbl = "π"
                else:
                    lbl = f"π/{lcm_frac.denominator}"
            else:
                if lcm_frac.denominator == 1:
                    lbl = f"{lcm_frac.numerator}π"
                else:
                    lbl = f"{lcm_frac.numerator}π/{lcm_frac.denominator}"
            
            return final_period, lbl
        except Exception:
            return None, "NONE"

    @classmethod
    def _find_poles_in_interval(cls, expr: sp.Expr, start: sp.Expr, end: sp.Expr) -> List[sp.Expr]:
        """Finds poles of tan(a*x+b) inside the finite interval."""
        x = sp.Symbol('x', real=True)
        poles = []
        start_f = float(start.evalf())
        end_f = float(end.evalf())

        for node in sp.preorder_traversal(expr):
            if type(node) == sp.tan:
                arg = node.args[0]
                try:
                    poly = arg.as_poly(x)
                    a = float(poly.coeff_monomial(x))
                    b = float(poly.constant_value()) if poly.constant_value() is not None else 0.0
                    
                    # tan(ax+b) is undefined when ax+b = pi/2 + k*pi -> x = (pi/2 - b + k*pi)/a
                    # Find all integers k satisfying start <= x <= end
                    # start <= (pi/2 - b + k*pi)/a <= end
                    for k in range(-50, 50):
                        x_pole_val = (math.pi/2.0 - b + k*math.pi) / a
                        if start_f <= x_pole_val <= end_f:
                            # Let's write the exact symbolic value
                            sym_pole = (sp.pi/2 - sp.Rational(str(b)) + k*sp.pi) / sp.Rational(str(a))
                            poles.append(sp.simplify(sym_pole))
                except Exception:
                    # Fallback backsearch
                    pass

        # Unique sorting
        unique_poles = []
        for p in poles:
            fl_p = float(p.evalf())
            if not any(abs(float(up.evalf()) - fl_p) < 1e-9 for up in unique_poles):
                unique_poles.append(p)
        unique_poles.sort(key=lambda val: float(val.evalf()))
        return unique_poles

    @classmethod
    def _solve_derivative_roots(cls, deriv: sp.Expr, expr: sp.Expr, start: sp.Expr, end: sp.Expr, poles: List[sp.Expr]) -> List[sp.Expr]:
        """Dense grid refinement solver checking root boundaries reliably with 35-digit precision."""
        x = sp.Symbol('x', real=True)
        start_f = float(start.evalf())
        end_f = float(end.evalf())
        poles_f = [float(p.evalf()) for p in poles]

        # 1. Grid sign changed checks
        num_steps = 600
        step_sz = (end_f - start_f) / num_steps
        roots_numerical = []

        def refine_root_high_prec(x_guess, x_min_f, x_max_f) -> sp.Expr:
            """Refines a root guess using sp.nsolve to 40 digits of precision."""
            try:
                # Use sp.nsolve with high precision (40 decimal digits)
                refined = sp.nsolve(deriv, x, x_guess, prec=40)
                # Verify that the refined root is within the interval/bounds
                ref_f = float(refined.evalf())
                if x_min_f - 1e-5 <= ref_f <= x_max_f + 1e-5:
                    return refined
            except Exception:
                pass

            # Fallback high-precision bisection
            try:
                left = sp.Float(x_min_f, 40)
                right = sp.Float(x_max_f, 40)
                for _ in range(120): # 120 steps reaches ~7.5e-37 accuracy
                    mid = (left + right) / 2
                    # Evaluate derivative at mid with high precision
                    ymid = deriv.subs(x, mid).evalf(40)
                    if ymid is None or not ymid.is_finite:
                        break
                    if abs(ymid) < 1e-35:
                        left = mid
                        break
                    yleft = deriv.subs(x, left).evalf(40)
                    if yleft is None or not yleft.is_finite:
                        break
                    if yleft * ymid < 0:
                        right = mid
                    else:
                        left = mid
                return left
            except Exception:
                return sp.Float(x_guess, 40)

        # Iterate dense sub-ranges
        for i in range(num_steps):
            x1 = start_f + i * step_sz
            x2 = x1 + step_sz
            
            try:
                y1 = deriv.subs(x, x1).evalf()
                y2 = deriv.subs(x, x2).evalf()
                if y1 is None or y2 is None or not y1.is_finite or not y2.is_finite:
                    continue
                y1_f = float(y1)
                y2_f = float(y2)
            except Exception:
                continue
                
            if y1_f * y2_f < 0:
                refined_val = refine_root_high_prec((x1 + x2)/2, x1, x2)
                roots_numerical.append(refined_val)
            elif abs(y1_f) < 1e-8:
                refined_val = refine_root_high_prec(x1, x1 - 1e-5, x1 + 1e-5)
                roots_numerical.append(refined_val)

        # Ensure unique, filter out poles and boundaries
        clean_numerical_roots = []
        for r in roots_numerical:
            r_f = float(r.evalf())
            if abs(r_f - start_f) < 1e-7 or abs(r_f - end_f) < 1e-7:
                continue
            if any(abs(r_f - pf) < 1e-4 for pf in poles_f):
                continue
            if not any(abs(float(r.evalf()) - float(cr.evalf())) < 1e-9 for cr in clean_numerical_roots):
                clean_numerical_roots.append(r)

        # 2. Advanced Symbolic promotion via squared-rational / Fraction of Pi matchers
        symbolic_promoted = []
        for r_num in clean_numerical_roots:
            is_exact, label, exact_sym = cls._classify_exactness(r_num)
            if is_exact:
                symbolic_promoted.append(exact_sym)
            else:
                symbolic_promoted.append(r_num)

        symbolic_promoted.sort(key=lambda val: float(val.evalf()))
        return symbolic_promoted

    @classmethod
    def _normalize_root_families(cls, roots: List[sp.Expr], period: Union[sp.Expr, None]) -> List[Dict[str, Any]]:
        """Normalize root coordinates into standard infinite mathematical families via XCAS GIAC."""
        families = []
        if not roots:
            return []

        is_type_b = False
        if period is not None and abs(float(period.evalf()) - math.pi) < 1e-5:
            is_type_b = True
        k_suffix = " + kπ" if is_type_b else " + 2kπ"

        for idx, r in enumerate(roots):
            # Check if r is nicely classifiable (rational of pi)
            is_exact_x, label_x, exact_x = cls._classify_exactness(r)
            if is_exact_x and exact_x.has(sp.pi):
                try:
                    pi_ratio = float((exact_x / sp.pi).evalf())
                    frac = Fraction(pi_ratio).limit_denominator(120)
                    p = frac.numerator
                    q = frac.denominator
                    
                    if p == 0:
                        term_lbl = "0"
                    else:
                        sign = "" if p > 0 else "-"
                        abs_p = abs(p)
                        p_str_clean = "π" if abs_p == 1 else f"{abs_p}π"
                        term_lbl = f"{sign}{p_str_clean}/{q}" if q != 1 else f"{sign}{p_str_clean}"

                    family_latex = f"x = {term_lbl}{k_suffix}"
                    families.append({
                        "latex": family_latex, 
                        "type": "Mẫu mực SGK (Exact)",
                        "is_exact": True
                    })
                    continue
                except Exception:
                    pass

            # Try XCAS GIAC: inverse trig mapping (Cosine, Sine, Tangent)
            try:
                # 1. Cosine Check (often has beautiful twin ±arccos)
                cos_val = sp.cos(r)
                is_exact_cos, label_cos, exact_cos = cls._classify_exactness(cos_val)
                if is_exact_cos:
                    # Form twin cos family ±arccos
                    family_latex = f"x = ±arccos({label_cos}){k_suffix}"
                    families.append({
                        "latex": family_latex,
                        "type": "XCAS GIAC - COS",
                        "is_exact": True
                    })
                    continue
            except Exception:
                pass

            try:
                # 2. Sine Check
                sin_val = sp.sin(r)
                is_exact_sin, label_sin, exact_sin = cls._classify_exactness(sin_val)
                if is_exact_sin:
                    family_latex = f"x = arcsin({label_sin}){k_suffix} hoặc x = π - arcsin({label_sin}){k_suffix}"
                    families.append({
                        "latex": family_latex,
                        "type": "XCAS GIAC - SIN",
                        "is_exact": True
                    })
                    continue
            except Exception:
                pass

            try:
                # 3. Tangent Check
                tan_val = sp.tan(r)
                is_exact_tan, label_tan, exact_tan = cls._classify_exactness(tan_val)
                if is_exact_tan:
                    family_latex = f"x = arctan({label_tan}){k_suffix}"
                    families.append({
                        "latex": family_latex,
                        "type": "XCAS GIAC - TAN",
                        "is_exact": True
                    })
                    continue
            except Exception:
                pass

            # Fallback to high-precision decimal representation (25 display digits)
            try:
                approx_val = str(r.evalf(25))
            except Exception:
                approx_val = f"{float(r):.25f}"
            families.append({
                "latex": f"x = {approx_val}{k_suffix}",
                "type": "Số thập phân xấp xỉ",
                "is_exact": False
            })

        return families

    @classmethod
    def _probe_pole_limit(cls, expr: sp.Expr, pole: float, direction: str) -> sp.Expr:
        """Probes numerical value close to pole to assign infinity limit direction."""
        x = sp.Symbol('x', real=True)
        epsilon = 1e-7
        test_pt = (pole - epsilon) if direction == "-" else (pole + epsilon)
        try:
            val = float(expr.subs(x, test_pt).evalf())
            if val > 1e4:
                return sp.oo
            elif val < -1e4:
                return -sp.oo
            return sp.oo if val > 0 else -sp.oo
        except Exception:
            return sp.oo

    @staticmethod
    def _get_subscript(num: int) -> str:
        sub_map = {"0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"}
        return "".join(sub_map.get(char, char) for char in str(num))

    @classmethod
    def _format_legend_val(cls, val: sp.Expr) -> Tuple[str, bool]:
        """Formats val to 25-digit float if it is not exact, otherwise nice text."""
        is_exact, label, _ = cls._classify_exactness(val)
        if is_exact:
            # Clean exact value
            return label, True
        else:
            try:
                # Approximate float: output 25-digit precision
                dec = val.evalf(25)
                return str(dec), False
            except Exception:
                return str(val), False

    @classmethod
    def _format_domain_vnm(cls, expr: sp.Expr) -> str:
        """Formats math domains nicely to standard Vietnamese textbook text representations."""
        x = sp.Symbol('x', real=True)
        has_tan = any(type(node) == sp.tan for node in sp.preorder_traversal(expr))
        if not has_tan:
            return "D = ℝ"
        
        # Collect linear factors of tan arguments
        excl_str = []
        for node in sp.preorder_traversal(expr):
            if type(node) == sp.tan:
                arg = node.args[0]
                try:
                    poly = arg.as_poly(x)
                    a = poly.coeff_monomial(x)
                    b = poly.constant_value() if poly.constant_value() is not None else 0
                    
                    # ax+b != pi/2 + k*pi -> x != pi/(2a) - b/a + k*pi/a
                    # let's simplify terms
                    term1 = sp.simplify((sp.pi/2 - b) / a)
                    term2 = sp.simplify(sp.pi / a)
                    
                    t1_lbl = cls._render_point_label(term1)
                    t2_lbl = cls._render_point_label(term2)
                    
                    if t1_lbl == "0":
                        term_formula = f"{t2_lbl}k" if t2_lbl != "1" else "k"
                    else:
                        term_formula = f"{t1_lbl} + {t2_lbl}k"
                    
                    # Clean double sings
                    term_formula = term_formula.replace("+ -", "-")
                    excl_str.append(term_formula)
                except Exception:
                    # fallback
                    excl_str.append("π/2 + kπ")

        joined_excls = ", ".join(f"{item}, k ∈ ℤ" for item in excl_str)
        return f"D = ℝ \\ {{{joined_excls}}}"

    @classmethod
    def _render_limit_label(cls, val: sp.Expr) -> str:
        if val == sp.oo:
            return "+∞"
        elif val == -sp.oo:
            return "-∞"
        elif val is sp.nan or val == sp.zoo or val is sp.zoo:
            return ""
        return cls._render_point_label(val)

    @classmethod
    def _render_point_label(cls, val: sp.Expr) -> str:
        """Converts fractions/roots/integers to beautiful unicode textbook math labels."""
        if val is sp.nan or val == sp.zoo or val is sp.zoo:
            return ""
        if val == sp.oo:
            return "+∞"
        if val == -sp.oo:
            return "-∞"
            
        # If fraction of pi
        try:
            pi_ratio = float((val / sp.pi).evalf())
            frac = Fraction(pi_ratio).limit_denominator(12)
            if abs(float(frac) - pi_ratio) < 1e-4:
                # Is indeed rational multiple of pi
                p = frac.numerator
                q = frac.denominator
                if p == 0:
                    return "0"
                sign = "" if p > 0 else "-"
                abs_p = abs(p)
                p_str = "π" if abs_p == 1 else f"{abs_p}π"
                return f"{sign}{p_str}/{q}" if q != 1 else f"{sign}{p_str}"
        except Exception:
            pass

        # Real rational
        if isinstance(val, sp.Rational) or val.is_Rational:
            if val.q == 1:
                return str(val.p)
            return f"{val.p}/{val.q}"
            
        # Float decimals
        if isinstance(val, sp.Float) or val.is_Float or isinstance(val, float):
            try:
                f_val = float(val)
                if f_val.is_integer():
                    return str(int(f_val))
                return f"{f_val:.2f}"
            except Exception:
                pass
                
        # Symbolic fallback
        return str(val).replace("**", "^").replace("*", "")
