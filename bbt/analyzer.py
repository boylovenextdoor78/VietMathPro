# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: analyzer.py
Description: The semantic engine. Combines algebraic and topology inputs to produce
             the Variation Semantic Graph. Returns structured table metadata.
"""

import sympy as sp
from typing import List, Dict, Tuple, Any, Union
from cas_engine import CASEngine
from domain_engine import DomainEngine
from extrema_engine import ExtremaEngine
from interval_engine import IntervalEngine
from asymptote_engine import AsymptoteEngine

class VariationAnalyzer:
    """
    Builds the structured Variation Semantic Graph.
    Connects intervals, signs, extrema, and asymptotes to form a complete mathematical representation
    for drawing Vietnamese Textbook Style Function Variation Tables.
    """

    @classmethod
    def analyze_function(cls, expr_str: str) -> Dict[str, Any]:
        """
        Orchestrates full symp-algebraic pipeline of a function.
        Returns a dictionary of metadata for rendering.
        """
        expr = CASEngine.parse_expr(expr_str)
        x = CASEngine.get_symbol_x()

        # 1. Natural domain and poles
        domain_intervals = DomainEngine.get_valid_domain_intervals(expr)
        poles = DomainEngine.find_singularities(expr)

        def is_point_in_domain(pt, domain_ints):
            try:
                pt_f = CASEngine.safe_float(pt)
            except Exception:
                return True
            if not domain_ints:
                return True
            for inter in domain_ints:
                try:
                    s_val = -float('inf') if inter.start == -sp.oo else CASEngine.safe_float(inter.start)
                    e_val = float('inf') if inter.end == sp.oo else CASEngine.safe_float(inter.end)
                    if inter.left_open:
                        left_ok = pt_f > s_val + 1e-9
                    else:
                        left_ok = pt_f >= s_val - 1e-9
                    if inter.right_open:
                        right_ok = pt_f < e_val - 1e-9
                    else:
                        right_ok = pt_f <= e_val + 1e-9
                    if left_ok and right_ok:
                        return True
                except Exception:
                    pass
            return False

        # 2. Get sorted x-axis nodes for the first row of BBT
        partition_nodes = IntervalEngine.get_partition_nodes(expr)
        
        # Standard table row x centers (excluding infinite extremes)
        # Unique and sorted list of mathematical points
        x_centers = sorted(list(set(partition_nodes)), key=lambda pt: CASEngine.safe_float(pt))

        # Complete list of x points starting with -oo (if valid) and ending with +oo (if valid)
        has_neg_inf = False
        has_pos_inf = False
        if domain_intervals:
            has_neg_inf = any(inter.start == -sp.oo for inter in domain_intervals)
            has_pos_inf = any(inter.end == sp.oo for inter in domain_intervals)
        else:
            has_neg_inf = True
            has_pos_inf = True

        x_points = []
        if has_neg_inf:
            x_points.append("-oo")
        for pt in x_centers:
            x_points.append(pt)
        if has_pos_inf:
            x_points.append("+oo")

        # 3. Analyze derivative values & signs on intervals
        interval_data = IntervalEngine.evaluate_interval_signs(expr)
        deriv = CASEngine.derivative(expr)

        # 4. Asymptotes
        v_asymptotes = AsymptoteEngine.detect_vertical_asymptotes(expr)
        h_asymptotes = AsymptoteEngine.detect_horizontal_asymptotes(expr)

        # 5. Build detailed column details for BBT
        columns = []
        for index, xp in enumerate(x_points):
            pt_meta: Dict[str, Any] = {}
            pt_meta["index"] = index
            pt_meta["x_raw"] = xp
            
            # Label in standard Vietnam latex format
            if xp == "-oo":
                pt_meta["x_label"] = "-∞"
                pt_meta["is_pole"] = False
                pt_meta["is_domain_boundary"] = True
                
                # Limits at -oo
                lim_val = CASEngine.eval_limit(expr, -sp.oo)
                if not CASEngine.safe_is_real(lim_val):
                    lim_val = sp.nan
                pt_meta["f_val"] = lim_val
                pt_meta["f_label"] = cls._render_limit_label(lim_val)
                pt_meta["f_prime_val"] = ""
                
            elif xp == "+oo":
                pt_meta["x_label"] = "+∞"
                pt_meta["is_pole"] = False
                pt_meta["is_domain_boundary"] = True
                
                # Limits at +oo
                lim_val = CASEngine.eval_limit(expr, sp.oo)
                if not CASEngine.safe_is_real(lim_val):
                    lim_val = sp.nan
                pt_meta["f_val"] = lim_val
                pt_meta["f_label"] = cls._render_limit_label(lim_val)
                pt_meta["f_prime_val"] = ""
                
            else:
                # Actual real point
                lbl = cls._render_point_label(xp)
                pt_meta["x_label"] = lbl
                
                # Check if it's a pole (singularity where function is undefined) or not in the domain definition
                is_pole = (xp in poles 
                           or any(abs(CASEngine.safe_float(xp - pole)) < 1e-9 for pole in poles)
                           or not is_point_in_domain(xp, domain_intervals))
                           
                # Dynamic pole check: if evaluating f(xp) yields sp.zoo, it is a pole
                if not is_pole:
                    try:
                        f_val_test = expr.subs(CASEngine.get_symbol_x(), xp)
                        if f_val_test == sp.zoo or f_val_test is sp.zoo:
                            is_pole = True
                    except Exception:
                        pass
                pt_meta["is_pole"] = is_pole
                
                # Check if it's on a domain boundary (e.g. x = -1 for sqrt(x+1))
                is_boundary = cls._is_domain_endpoint(xp, domain_intervals)
                pt_meta["is_domain_boundary"] = is_boundary

                if is_pole:
                    pt_meta["f_prime_val"] = "||"  # double line on f' row
                    
                    # Compute left and right limits for f row at this pole only if the domain exists there
                    lim_left = sp.nan
                    lim_right = sp.nan
                    
                    if is_point_in_domain(xp - sp.Rational(1, 100), domain_intervals):
                        lim_left = CASEngine.eval_limit(expr, xp, direction="-")
                        if not CASEngine.safe_is_real(lim_left):
                            lim_left = sp.nan
                            
                    if is_point_in_domain(xp + sp.Rational(1, 100), domain_intervals):
                        lim_right = CASEngine.eval_limit(expr, xp, direction="+")
                        if not CASEngine.safe_is_real(lim_right):
                            lim_right = sp.nan
                            
                    pt_meta["f_val_left"] = lim_left
                    pt_meta["f_label_left"] = cls._render_limit_label(lim_left)
                    pt_meta["f_val_right"] = lim_right
                    pt_meta["f_label_right"] = cls._render_limit_label(lim_right)
                else:
                    # Regular defined point: evaluate f(xp) and f'(xp)
                    fp_val = CASEngine.evaluate_at(deriv, xp)
                    if fp_val.is_number and abs(CASEngine.safe_float(fp_val)) < 1e-9:
                        pt_meta["f_prime_val"] = "0"
                    elif f_prime_is_undefined(expr, deriv, xp):
                        pt_meta["f_prime_val"] = "||"
                    else:
                        pt_meta["f_prime_val"] = "" # let signs guide it
                    
                    actual_val = CASEngine.evaluate_at(expr, xp)
                    if not CASEngine.safe_is_real(actual_val):
                        actual_val = sp.nan
                    pt_meta["f_val"] = actual_val
                    pt_meta["f_label"] = cls._render_point_label(actual_val)

            columns.append(pt_meta)

        # 6. Monotonic intermediate intervals (drawn between columns)
        # For N columns, there are N-1 intervals of signs and directions
        monotony: List[Dict[str, Any]] = []
        for i in range(len(columns) - 1):
            col_left = columns[i]
            col_right = columns[i+1]
            
            # Left boundary and right boundary
            left_node = col_left["x_raw"]
            right_node = col_right["x_raw"]
            
            # Check if this interval is in the domain
            is_in_domain = True
            if domain_intervals:
                if left_node == "-oo" and right_node == "+oo":
                    probe = sp.Integer(0)
                elif left_node == "-oo":
                    probe = right_node - sp.Integer(1)
                elif right_node == "+oo":
                    probe = left_node + sp.Integer(1)
                else:
                    probe = (left_node + right_node) / 2
                    
                is_in_domain = is_point_in_domain(probe, domain_intervals)

            mid_sign = ""
            if is_in_domain:
                for res in interval_data:
                    istart, iend = res["interval"]
                    
                    # Robust check matching string bounds with symbolic SymPy bounds at -oo/oo
                    match_left = False
                    if (istart == -sp.oo or istart == "-oo") and (left_node == -sp.oo or left_node == "-oo"):
                        match_left = True
                    elif istart != -sp.oo and left_node != "-oo":
                        try:
                            match_left = abs(CASEngine.safe_float(istart) - CASEngine.safe_float(left_node)) < 1e-9
                        except Exception:
                            match_left = (istart == left_node)
                            
                    match_right = False
                    if (iend == sp.oo or iend == "+oo") and (right_node == sp.oo or right_node == "+oo"):
                        match_right = True
                    elif iend != sp.oo and right_node != "+oo":
                        try:
                            match_right = abs(CASEngine.safe_float(iend) - CASEngine.safe_float(right_node)) < 1e-9
                        except Exception:
                            match_right = (iend == right_node)
                            
                    if match_left and match_right:
                        mid_sign = res["sign"]
                        break
                        
                if not mid_sign:
                    # Safe fallback sign detection
                    mid_sign = cls._detect_safe_sign_between(deriv, left_node, right_node)
            else:
                mid_sign = ""

            monotony.append({
                "index": i,
                "sign": mid_sign,
                "direction": "up" if mid_sign == "+" else "down" if mid_sign == "-" else "flat" if is_in_domain else "empty",
                "in_domain": is_in_domain
            })

        # --- SYMBOL SUBSTITUTION FOR COMPLEX COORDINATES ---
        x_subs = {}   # maps SymPy expressions to { "symbol": "x₁", "val": xp, "index": index }
        y_subs = {}   # maps SymPy expressions to { "symbol": "y₁", "val": y_val, "index": index }
        
        def get_subscript(num: int) -> str:
            sub_map = {"0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄", "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉"}
            return "".join(sub_map.get(char, char) for char in str(num))

        def is_simple_algebraic(val: sp.Expr) -> bool:
            if not isinstance(val, sp.Basic):
                return False
            if val in [sp.oo, -sp.oo, sp.nan]:
                return True
            if not val.is_number:
                return False
            if val.has(sp.I):
                return False
                
            # Verify if there is any Pow with a denominator of exponent >= 3 (cubic roots, etc)
            for sub in sp.preorder_traversal(val):
                if sub.is_Pow:
                    _, s_exp = sub.as_base_exp()
                    if isinstance(s_exp, sp.Rational) and s_exp.q >= 3:
                        return False
                        
            # String length: if string representation is >15 and has complex structure, it is not simple
            s_str = str(val).replace("**", "^").replace("*", "")
            if len(s_str) > 15:
                return False
            return True

        def is_complex_value(val: sp.Expr) -> bool:
            return not is_simple_algebraic(val)

        def format_val_str(val: sp.Expr) -> Tuple[str, bool]:
            if is_simple_algebraic(val):
                s = str(val).replace("**", "^").replace("*", "")
                return s, True
            else:
                try:
                    dec = val.evalf(25)
                    return str(dec), False
                except Exception:
                    return str(val), False

        # Scan and assign X substitutions
        for index, col in enumerate(columns):
            xp = col["x_raw"]
            if isinstance(xp, sp.Basic) and xp not in [sp.oo, -sp.oo]:
                if is_complex_value(xp):
                    if xp not in x_subs:
                        x_id = len(x_subs) + 1
                        symbol_name = f"x{get_subscript(x_id)}"
                        x_subs[xp] = {
                            "symbol": symbol_name,
                            "val": xp,
                            "index": index
                        }
                    col["x_label"] = x_subs[xp]["symbol"]

        # Scan and assign Y substitutions
        for index, col in enumerate(columns):
            if col["is_pole"]:
                if "f_val_left" in col:
                    y_l = col["f_val_left"]
                    if isinstance(y_l, sp.Basic) and y_l not in [sp.oo, -sp.oo] and is_complex_value(y_l):
                        if y_l not in y_subs:
                            y_id = len(y_subs) + 1
                            symbol_name = f"y{get_subscript(y_id)}"
                            y_subs[y_l] = {
                                "symbol": symbol_name,
                                "val": y_l,
                                "index": index,
                                "pole_side": "left"
                            }
                        col["f_label_left"] = y_subs[y_l]["symbol"]
                if "f_val_right" in col:
                    y_r = col["f_val_right"]
                    if isinstance(y_r, sp.Basic) and y_r not in [sp.oo, -sp.oo] and is_complex_value(y_r):
                        if y_r not in y_subs:
                            y_id = len(y_subs) + 1
                            symbol_name = f"y{get_subscript(y_id)}"
                            y_subs[y_r] = {
                                "symbol": symbol_name,
                                "val": y_r,
                                "index": index,
                                "pole_side": "right"
                            }
                        col["f_label_right"] = y_subs[y_r]["symbol"]
            else:
                if "f_val" in col:
                    y_val = col["f_val"]
                    if isinstance(y_val, sp.Basic) and y_val not in [sp.oo, -sp.oo] and is_complex_value(y_val):
                        if y_val not in y_subs:
                            y_id = len(y_subs) + 1
                            symbol_name = f"y{get_subscript(y_id)}"
                            y_subs[y_val] = {
                                "symbol": symbol_name,
                                "val": y_val,
                                "index": index,
                                "pole_side": None
                            }
                        col["f_label"] = y_subs[y_val]["symbol"]

        # Now construct the legend
        legend_list = []
        sorted_x_subs = sorted(list(x_subs.values()), key=lambda s: s["symbol"])
        sorted_y_subs = sorted(list(y_subs.values()), key=lambda s: s["symbol"])
        
        # Process X replacements
        for item in sorted_x_subs:
            val = item["val"]
            sym = item["symbol"]
            idx = item["index"]
            col = columns[idx]
            
            val_str, is_exact = format_val_str(val)
            
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
            is_deriv_undefined = (col.get("f_prime_val") == "||")
            
            is_f_zero = False
            if not col["is_pole"] and "f_val" in col:
                try:
                    is_f_zero = abs(float(col["f_val"].evalf())) < 1e-9
                except Exception:
                    pass
            
            roles = []
            if is_local_max:
                if is_deriv_undefined:
                    roles.append("Cực đại nhọn (Local Max, đạo hàm không xác định)")
                else:
                    roles.append("Điểm cực đại (Local Max)")
            elif is_local_min:
                if is_deriv_undefined:
                    roles.append("Cực tiểu nhọn (Local Min, đạo hàm không xác định)")
                else:
                    roles.append("Điểm cực tiểu (Local Min)")
                    
            if is_deriv_zero:
                roles.append("Nghiệm của đạo hàm (nghiệm phương trình f'(x) = 0)")
            if is_f_zero:
                roles.append("Nghiệm của hàm số (nghiệm phương trình f(x) = 0)")
                
            if not roles:
                roles.append("Điểm đặc biệt trên tập xác định")
                
            role_desc = ", ".join(roles)
            if role_desc:
                role_desc = role_desc[0].upper() + role_desc[1:]
                
            legend_list.append({
                "symbol": sym,
                "role": role_desc,
                "value": val_str,
                "is_exact": is_exact,
                "type": "x"
            })
            
        # Process Y replacements
        for item in sorted_y_subs:
            val = item["val"]
            sym = item["symbol"]
            idx = item["index"]
            col = columns[idx]
            
            val_str, is_exact = format_val_str(val)
            
            xp_raw = col["x_raw"]
            if xp_raw in x_subs:
                x_ref = x_subs[xp_raw]["symbol"]
            else:
                x_ref = str(xp_raw).replace("**", "^").replace("*", "")
                
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
                roles.append(f"Giá trị cực đại (Local Max) của hàm số tại {x_ref}")
            elif is_local_min:
                roles.append(f"Giá trị cực tiểu (Local Min) của hàm số tại {x_ref}")
            else:
                side_str = ""
                if "pole_side" in item and item["pole_side"] == "left":
                    side_str = " (giới hạn bên trái)"
                elif "pole_side" in item and item["pole_side"] == "right":
                    side_str = " (giới hạn bên phải)"
                roles.append(f"Giá trị hàm số tại {x_ref}{side_str}")
                
            role_desc = ", ".join(roles)
            if role_desc:
                role_desc = role_desc[0].upper() + role_desc[1:]
                
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
            "domain_vnm": DomainEngine.format_domain_vnm(expr),
            "poles": [str(p) for p in poles],
            "v_asymptotes": [str(v) for v in v_asymptotes],
            "h_asymptotes": {k: (str(v) if v else None) for k, v in h_asymptotes.items()},
            "asymptotes_report": AsymptoteEngine.get_detailed_asymptotes_report(expr),
            "columns": columns,
            "monotony": monotony,
            "legend": legend_list
        }

    @staticmethod
    def _render_limit_label(val: sp.Expr) -> str:
        """Translates infinite limits to Vietnamese textbook notations (+∞, -∞)."""
        if val == sp.oo:
            return "+∞"
        elif val == -sp.oo:
            return "-∞"
        elif val is sp.nan or val == sp.zoo or val is sp.zoo:
            return ""
        return VariationAnalyzer._render_point_label(val)

    @staticmethod
    def _render_point_label(val: sp.Expr) -> str:
        """Converts fractions/roots/integers to nice localized visual labels."""
        if val is sp.nan or val == sp.zoo or val is sp.zoo:
            return ""
        # Handle simple fractions mathematically
        if isinstance(val, sp.Rational) or val.is_Rational:
            # E.g. 1/3 as simple string fraction
            if val.q == 1:
                return str(val.p)
            return f"{val.p}/{val.q}"
        
        # Round decimals to clean strings if they are floating
        if isinstance(val, sp.Float) or val.is_Float:
            f_val = float(val)
            if f_val.is_integer():
                return str(int(f_val))
            return f"{f_val:.2f}"
            
        # Symbolic representation fallback
        return str(val).replace("**", "^").replace("*", "")

    @staticmethod
    def _is_domain_endpoint(xp: sp.Expr, intervals: List[sp.Interval]) -> bool:
        """Determines if the given x-point is exactly a hard boundary under radicals."""
        for inter in intervals:
            if inter.start == xp and xp != -sp.oo:
                return True
            if inter.end == xp and xp != sp.oo:
                return True
        return False

    @classmethod
    def _detect_safe_sign_between(cls, deriv: sp.Expr, left: Union[sp.Expr, str], right: Union[sp.Expr, str]) -> str:
        """Safely estimates derivative sign if interval overlap dictionary fails."""
        x = CASEngine.get_symbol_x()
        try:
            # Determine probe numeric value
            if (left == "-oo" or left == -sp.oo) and (right == "+oo" or right == sp.oo):
                probe = 0.0
            elif left == "-oo" or left == -sp.oo:
                r_val = CASEngine.safe_float(right)
                probe = r_val - 1.0
            elif right == "+oo" or right == sp.oo:
                l_val = CASEngine.safe_float(left)
                probe = l_val + 1.0
            else:
                l_val = CASEngine.safe_float(left)
                r_val = CASEngine.safe_float(right)
                probe = (l_val + r_val) / 2.0
            
            val = CASEngine.safe_float(deriv.subs(x, probe))
            if val > 1e-9:
                return "+"
            elif val < -1e-9:
                return "-"
        except Exception:
            pass
        return "+" # default fallback to positive trend if error


def f_prime_is_undefined(expr: sp.Expr, deriv: sp.Expr, pt: sp.Expr) -> bool:
    """Checks if derivative is undefined at a point (like sharp corner under absolute value or root)."""
    x = CASEngine.get_symbol_x()
    
    # 1. Inspect if evaluation of derivative itself yields non-real, infinity, nan, or raises error
    try:
        fp_val = deriv.subs(x, pt)
        if fp_val is sp.nan or not fp_val.is_finite or not CASEngine.safe_is_real(fp_val):
            return True
    except Exception:
        return True

    # 2. Check roots of Abs arguments and bases of fractional/negative powers
    for sub in sp.preorder_traversal(expr):
        name = type(sub).__name__
        if name == "Abs":
            arg = sub.args[0]
            try:
                if abs(CASEngine.safe_float(arg.subs(x, pt))) < 1e-9:
                    return True
            except Exception:
                pass
        elif name in ("Pow", "root") or str(sub).startswith("sqrt"):
            if hasattr(sub, "as_base_exp"):
                base, exp = sub.as_base_exp()
            else:
                try:
                    base = sub.args[0]
                    exp = 1 / sub.args[1] if len(sub.args) > 1 else sp.Rational(1, 2)
                except Exception:
                    continue
            try:
                if not exp.is_integer:
                    if abs(CASEngine.safe_float(base.subs(x, pt))) < 1e-9:
                        return True
            except Exception:
                pass

    # 3. Traditional division-by-zero checks in the derivative
    try:
        num, den = sp.fraction(deriv)
        if den != 1:
            if abs(CASEngine.safe_float(den.subs(x, pt))) < 1e-9:
                return True
    except Exception:
        pass
        
    return False
