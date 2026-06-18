# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: svg_renderer.py
Description: The SVH (Semantic Vector Hybrid) layout engine. Automatically renders high quality,
             responsive, textbook-grade SVGs matching Vietnamese academic conventions.
"""

from typing import Dict, Any, List, Tuple
import math

class SVGRenderer:
    """
    Renders the analyzed mathematical Variation Semantic Graph to raw inline SVG.
    Enforces collision avoidance, precise double lines, marker arrows, dynamic vertical heights,
    STIX / Cambria style web font vectors.
    """

    @classmethod
    def render_bbt(cls, data: Dict[str, Any]) -> str:
        """
        Main drawing entry. Computes grids, positions, arrows and returns SVG XML string.
        """
        columns = data["columns"]
        monotony = data["monotony"]
        
        # Dimensions & layout parameters
        total_cols = len(columns)
        
        # Width configurations
        label_col_width = 80
        col_width = 110 # wide spacing to avoid text collisions
        dw_width = label_col_width + (total_cols * col_width)
        
        # Row heights
        x_row_h = 45
        prime_row_h = 45
        f_row_h = 140 # large height for visible arrow steepness
        header_y_offset = 0
        
        table_height = x_row_h + prime_row_h + f_row_h
        
        # Check if the function is a non-trivial, irreducible rational function P(x)/Q(x)
        # and retrieve its plain text asymptotes.
        expr_str = data.get("expression", "")
        asymptote_lines = cls._check_and_get_asymptote_lines(expr_str) if expr_str else []
        
        if asymptote_lines:
            asymptote_section_height = 45 + (len(asymptote_lines) * 24) + 26
            total_height = table_height + asymptote_section_height
        else:
            total_height = table_height
        
        # 1. Compute coordinate levels for each f(x) point
        # This resolves the height positioning of arrows
        y_levels = cls._compute_f_vertical_levels(columns)

        # SVG header wrapper
        svg_parts = []
        svg_parts.append(
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {dw_width} {total_height}" '
            f'width="100%" height="{total_height}" style="background-color: #141414; font-family: \'STIX General\', \'Cambria Math\', serif; font-size: 13px;">'
        )
        
        # Grid/Defs markers for arrowhead and styling
        svg_parts.append(
            '<defs>'
            '  <style>'
            '    .grid-line { stroke: rgba(228, 227, 224, 0.25); stroke-width: 1.5px; }'
            '    .text-lbl { fill: #E4E3E0; text-anchor: middle; dominant-baseline: middle; }'
            '    .text-title { fill: #E4E3E0; text-anchor: start; dominant-baseline: middle; font-weight: bold; font-family: monospace; font-size: 11px; opacity: 0.6; }'
            '    .arrow-path { stroke: #6EE7B7; stroke-width: 2.2px; fill: none; stroke-linecap: round; }'
            '    .double-bar { stroke: #EF4444; stroke-width: 1.5px; opacity: 0.85; }'
            '  </style>'
            '  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
            '    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#6EE7B7"/>'
            '  </marker>'
            '</defs>'
        )

        # --- DRAWING TABLE GRID LINES ---
        # Draw background container borders
        svg_parts.append(f'<rect width="{dw_width}" height="{total_height}" fill="#141414" stroke="rgba(228, 227, 224, 0.1)" stroke-width="1"/>')
        
        # Horizontal lines
        line_y1 = x_row_h
        line_y2 = x_row_h + prime_row_h
        svg_parts.append(f'<line x1="0" y1="{line_y1}" x2="{dw_width}" y2="{line_y1}" class="grid-line" />')
        svg_parts.append(f'<line x1="0" y1="{line_y2}" x2="{dw_width}" y2="{line_y2}" class="grid-line" />')
        
        # Label separator vertical column line
        svg_parts.append(f'<line x1="{label_col_width}" y1="0" x2="{label_col_width}" y2="{table_height}" class="grid-line" />')

        # --- DRAWING ROW LABELS (1st Column) ---
        svg_parts.append(f'<text x="25" y="{x_row_h / 2}" class="text-title">x</text>')
        svg_parts.append(f'<text x="25" y="{x_row_h + (prime_row_h / 2)}" class="text-title">f\'(x)</text>')
        svg_parts.append(f'<text x="25" y="{x_row_h + prime_row_h + (f_row_h / 2)}" class="text-title">f(x)</text>')

        # --- DRAWING COLUMNS & X LABELS ---
        col_x_coords = []
        for i, col in enumerate(columns):
            cx = label_col_width + (i * col_width) + (col_width / 2)
            col_x_coords.append(cx)
            
            # X row text
            label_x = col["x_label"]
            svg_parts.append(f'<text x="{cx}" y="{x_row_h / 2}" class="text-lbl" font-weight="600">{label_x}</text>')
            if col.get("is_approx_x", False):
                lbl_len = len(label_x)
                text_w = max(15, lbl_len * 6.5)
                y_under = (x_row_h / 2) + 6
                svg_parts.append(
                    f'<line x1="{cx - text_w/2}" y1="{y_under}" x2="{cx + text_w/2}" y2="{y_under}" '
                    f'stroke="rgba(228, 227, 224, 0.45)" stroke-dasharray="2,2" stroke-width="1.2" />'
                )

            # Prime row element (0 or ||)
            pr_val = col["f_prime_val"]
            if pr_val == "||":
                # Draw double vertical lines stretching all the way down for domain singularities
                dx1 = cx - 2
                dx2 = cx + 2
                # Start double line from x limit row border down to the end of f(x) row
                svg_parts.append(f'<line x1="{dx1}" y1="{x_row_h}" x2="{dx1}" y2="{table_height}" class="double-bar" />')
                svg_parts.append(f'<line x1="{dx2}" y1="{x_row_h}" x2="{dx2}" y2="{table_height}" class="double-bar" />')
            elif pr_val == "0":
                # Draw zero center
                py = x_row_h + (prime_row_h / 2)
                svg_parts.append(f'<text x="{cx}" y="{py}" class="text-lbl">{pr_val}</text>')

        # --- DRAWING INTERMEDIATE SIGNS (+ / -) in f'(x) Row ---
        for r_index, mid in enumerate(monotony):
            cx_left = col_x_coords[r_index]
            cx_right = col_x_coords[r_index+1]
            sign_x = (cx_left + cx_right) / 2
            sign_y = x_row_h + (prime_row_h / 2)
            sign_label = mid["sign"]
            
            # Draw math signs with lighter color accent
            svg_parts.append(f'<text x="{sign_x}" y="{sign_y}" class="text-lbl" fill="#A7F3D0" font-size="14px" font-weight="bold">{sign_label}</text>')

        # --- DRAWING THE FUNCTION VALUE LABELS AND VARIATION ARROWS ---
        # Anchor points for routing paths
        arrow_anchors = [] # list of (x, y) coordinates for each column position in f(x) row
        
        for i, col in enumerate(columns):
            cx = col_x_coords[i]
            
            if col["is_pole"]:
                # Left side and right side limits
                y_lvl_left = y_levels[i]["left"]
                y_lvl_right = y_levels[i]["right"]
                
                # Transform to absolute SVG pixel coordinate
                # Row 3 starts at: x_row_h + prime_row_h
                # We add padding to avoid overlapping the borders
                pad = 14
                y_abs_left = x_row_h + prime_row_h + pad + (y_lvl_left * (f_row_h - 2 * pad))
                y_abs_right = x_row_h + prime_row_h + pad + (y_lvl_right * (f_row_h - 2 * pad))
                
                # Draw separate labels on both sides of the double red bar
                label_left = col["f_label_left"]
                label_right = col["f_label_right"]
                
                svg_parts.append(f'<text x="{cx - 15}" y="{y_abs_left}" class="text-lbl" font-size="11px">{label_left}</text>')
                svg_parts.append(f'<text x="{cx + 15}" y="{y_abs_right}" class="text-lbl" font-size="11px">{label_right}</text>')
                
                arrow_anchors.append({
                    "type": "pole",
                    "x_left": cx - 18,
                    "y_left": y_abs_left,
                    "x_right": cx + 18,
                    "y_right": y_abs_right
                })
            else:
                # Normal element
                y_lvl = y_levels[i]["center"]
                pad = 18
                y_abs = x_row_h + prime_row_h + pad + (y_lvl * (f_row_h - 2 * pad))
                
                # Draw label
                label_val = col["f_label"]
                
                # Highlight local extrema with white color, others with gray-ish
                text_color = "#FFFFFF" if col["f_prime_val"] == "0" else "#E4E3E0"
                svg_parts.append(f'<text x="{cx}" y="{y_abs}" class="text-lbl" fill="{text_color}" font-weight="600">{label_val}</text>')
                if col.get("is_approx_f", False):
                    lbl_len = len(label_val)
                    text_w = max(15, lbl_len * 6.5)
                    y_under = y_abs + 6
                    svg_parts.append(
                        f'<line x1="{cx - text_w/2}" y1="{y_under}" x2="{cx + text_w/2}" y2="{y_under}" '
                        f'stroke="rgba(228, 227, 224, 0.45)" stroke-dasharray="2,2" stroke-width="1.2" />'
                    )
                
                arrow_anchors.append({
                    "type": "normal",
                    "x": cx,
                    "y": y_abs
                })

        # --- ROUTING ARROW PATHS ---
        # We loop over intervals to draw arrows from i to i+1
        for i in range(total_cols - 1):
            left_anchor = arrow_anchors[i]
            right_anchor = arrow_anchors[i+1]
            
            # Start position (x1, y1)
            if left_anchor["type"] == "pole":
                x1 = left_anchor["x_right"]
                y1 = left_anchor["y_right"]
            else:
                x1 = left_anchor["x"]
                y1 = left_anchor["y"]
                
            # End position (x2, y2)
            if right_anchor["type"] == "pole":
                x2 = right_anchor["x_left"]
                y2 = right_anchor["y_left"]
            else:
                x2 = right_anchor["x"]
                y2 = right_anchor["y"]
                
            # Compute slope offset to prevent text collision
            # Shrink arrow path length slightly at borders so it doesn't cross over the labels
            dx = x2 - x1
            dy = y2 - y1
            length = math.sqrt(dx*dx + dy*dy)
            
            if length > 0:
                # Pull back beginning and end by margin pixels
                start_margin = 18
                end_margin = 22 # larger pull back on end to fit arrowhead beautifully
                
                # Calculate coordinates
                x_start = x1 + (dx / length) * start_margin
                y_start = y1 + (dy / length) * start_margin
                
                x_end = x2 - (dx / length) * end_margin
                y_end = y2 - (dy / length) * end_margin
                
                # Draw arrow curve or line
                # High steepness monotonic path
                if monotony[i].get("in_domain", True) and monotony[i].get("direction") != "empty":
                    svg_parts.append(
                        f'<line x1="{x_start}" y1="{y_start}" x2="{x_end}" y2="{y_end}" '
                        f'class="arrow-path" marker-end="url(#arrow)" />'
                    )

        # Draw the asymptote panel if present
        if asymptote_lines:
            # Separation line between table and asymptote list
            svg_parts.append(f'<line x1="0" y1="{table_height}" x2="{dw_width}" y2="{table_height}" stroke="rgba(228, 227, 224, 0.15)" stroke-width="1.5" />')
            
            # Title for the section
            title_y = table_height + 25
            svg_parts.append(f'<text x="20" y="{title_y}" class="text-title" font-size="11px" fill="#00FFCC" opacity="0.95">CÁC ĐƯỜNG TIỆM CẬN ĐỒ THỊ (ASYMPTOTES):</text>')
            
            # Draw each line
            for idx, line in enumerate(asymptote_lines):
                line_y = title_y + 24 * (idx + 1)
                # Bullet circle
                svg_parts.append(f'<circle cx="30" cy="{line_y}" r="3" fill="#6EE7B7" />')
                # Text description
                svg_parts.append(f'<text x="44" y="{line_y}" fill="#E4E3E0" font-size="12px" dominant-baseline="middle" font-family="\'STIX General\', \'Cambria Math\', serif">{line}</text>')

            # Add Notepad equation at the very bottom
            formula_y = title_y + 24 * (len(asymptote_lines) + 1)
            svg_parts.append(f'<circle cx="30" cy="{formula_y}" r="3" fill="#FBBF24" />')
            formula_clean = expr_str.replace('**', '^')
            svg_parts.append(f'<text x="44" y="{formula_y}" fill="#FBBF24" font-size="12px" dominant-baseline="middle" font-family="\'STIX General\', \'Cambria Math\', serif" font-weight="600">Công thức nhập (Notepad): f(x) = {formula_clean}</text>')

        svg_parts.append('</svg>')
        return "\n".join(svg_parts)

    @classmethod
    def _check_and_get_asymptote_lines(cls, expr_str: str) -> List[str]:
        """
        Only detects and formats asymptotes if the expression is a non-trivial, irreducible 
        rational function of form P(x)/Q(x) where both are polynomials of x, Q(x) is of degree >= 1, 
        and no common factors exist that fully cancel the denominator.
        """
        import sympy as sp
        import re
        from cas_engine import CASEngine
        from asymptote_engine import AsymptoteEngine
        
        def format_math_expr(expr) -> str:
            if expr is None:
                return ""
            s = str(expr)
            s = s.replace('**', '^')
            # Replace '*' with empty space under specific circumstances:
            # - Number followed by word or parenthesis: e.g., '2*x' -> '2x', '2*(x)' -> '2(x)'
            # - Word/Parenthesis followed by '*' and word/parenthesis: e.g., 'x*(x+1)' -> 'x(x+1)'
            s = re.sub(r'(\d+)\*(?=[a-zA-Z\(])', r'\1', s)
            s = re.sub(r'([a-zA-Z\)])\*(?=[a-zA-Z\(])', r'\1', s)
            # Standard cleanup for remaining/stray '*' symbols
            s = s.replace('*', '')
            return s
        
        try:
            expr = CASEngine.parse_expr(expr_str)
            x = CASEngine.get_symbol_x()
            
            # Helper to check if the expression contains only polynomial-rational operations in x
            def is_rational_expr(e) -> bool:
                if e == x or e.is_number:
                    return True
                if e.is_Add or e.is_Mul:
                    return all(is_rational_expr(arg) for arg in e.args)
                if e.is_Pow:
                    base, exp = e.as_base_exp()
                    if not exp.is_integer:
                        return False
                    return is_rational_expr(base)
                return False
                
            if not is_rational_expr(expr):
                return []
                
            expr_simp = sp.cancel(expr)
            num, den = sp.fraction(expr_simp)
            
            if not num.is_polynomial(x) or not den.is_polynomial(x):
                return []
                
            if den.is_number or den == 1 or sp.degree(den, x) < 1:
                return []
                
            # If validated as irreducible rational, get asymptotes
            v = AsymptoteEngine.detect_vertical_asymptotes(expr)
            h = AsymptoteEngine.detect_horizontal_asymptotes(expr)
            s = AsymptoteEngine.detect_slant_asymptotes(expr)
            c = AsymptoteEngine.detect_curved_asymptotes(expr)
            
            plain_lines = []
            
            # Format nicely
            # 1. TCĐ
            if v:
                v_eqs = [f"x = {format_math_expr(val)}" for val in v]
                plain_lines.append(f"Tiệm cận đứng (TCĐ): {', '.join(v_eqs)}")
                
            # 2. TCN
            h_pos = h.get("+oo")
            h_neg = h.get("-oo")
            if h_pos is not None and h_neg is not None:
                if sp.simplify(h_pos - h_neg) == 0:
                    plain_lines.append(f"Tiệm cận ngang (TCN): y = {format_math_expr(h_pos)}")
                else:
                    h_pos_str = format_math_expr(h_pos)
                    h_neg_str = format_math_expr(h_neg)
                    plain_lines.append(f"Tiệm cận ngang (TCN): y = {h_pos_str} (khi x -> +oo), y = {h_neg_str} (khi x -> -oo)")
            elif h_pos is not None:
                plain_lines.append(f"Tiệm cận ngang (TCN): y = {format_math_expr(h_pos)} (khi x -> +oo)")
            elif h_neg is not None:
                plain_lines.append(f"Tiệm cận ngang (TCN): y = {format_math_expr(h_neg)} (khi x -> -oo)")
                
            # 3. TCX
            s_pos = s.get("+oo")
            s_neg = s.get("-oo")
            if s_pos is not None and s_neg is not None:
                if sp.simplify(s_pos[0] - s_neg[0]) == 0 and sp.simplify(s_pos[1] - s_neg[1]) == 0:
                    m, n = s_pos
                    r_eq = sp.simplify(m*x + n)
                    eq_str = format_math_expr(r_eq)
                    plain_lines.append(f"Tiệm cận xiên (TCX): y = {eq_str}")
                else:
                    m1, n1 = s_pos
                    eq_str1 = format_math_expr(sp.simplify(m1*x + n1))
                    m2, n2 = s_neg
                    eq_str2 = format_math_expr(sp.simplify(m2*x + n2))
                    plain_lines.append(f"Tiệm cận xiên (TCX): y = {eq_str1} (khi x -> +oo), y = {eq_str2} (khi x -> -oo)")
            elif s_pos is not None:
                m, n = s_pos
                eq_str = format_math_expr(sp.simplify(m*x + n))
                plain_lines.append(f"Tiệm cận xiên (TCX): y = {eq_str} (khi x -> +oo)")
            elif s_neg is not None:
                m, n = s_neg
                eq_str = format_math_expr(sp.simplify(m*x + n))
                plain_lines.append(f"Tiệm cận xiên (TCX): y = {eq_str} (khi x -> -oo)")
                
            # 4. TCC
            if c:
                c_eqs = [f"y = {format_math_expr(val)}" for val in c]
                plain_lines.append(f"Tiệm cận cong đa thức (TCC): {', '.join(c_eqs)}")
                
            return plain_lines
        except Exception:
            return []

    @classmethod
    def _compute_f_vertical_levels(cls, columns: List[Dict[str, Any]]) -> List[Dict[str, float]]:
        """
        Calculates normalized heights (0.0 to 1.0) for function values in table.
        Highest mathematical values -> 0.0 (drawn at top)
        Lowest mathematical values -> 1.0 (drawn at bottom)
        This is done by analyzing values and limit directions.
        """
        import sympy as sp
        
        levels = []
        
        # First, query all mathematical y values to extract finite points for scaling
        all_vals: List[float] = []
        
        for col in columns:
            if col["is_pole"]:
                for bound in [col["f_val_left"], col["f_val_right"]]:
                    if bound not in [sp.oo, -sp.oo, sp.nan] and bound.is_number:
                        try:
                            val_real = float(sp.re(bound.evalf()))
                            all_vals.append(val_real)
                        except Exception:
                            pass
            else:
                val = col["f_val"]
                if val not in [sp.oo, -sp.oo, sp.nan] and val.is_number:
                    try:
                        val_real = float(sp.re(val.evalf()))
                        all_vals.append(val_real)
                    except Exception:
                        pass
                    
        # Find min/max boundaries of finite values to map intermediate points
        if all_vals:
            max_finite = max(all_vals)
            min_finite = min(all_vals)
            finite_range = max_finite - min_finite if max_finite != min_finite else 1.0
        else:
            max_finite = 0.0
            min_finite = 0.0
            finite_range = 1.0

        for col in columns:
            levels_meta = {}
            if col["is_pole"]:
                # Left limit
                v_l = col["f_val_left"]
                if v_l == sp.oo:
                    levels_meta["left"] = 0.0  # topmost
                elif v_l == -sp.oo:
                    levels_meta["left"] = 1.0  # bottommost
                else:
                    try:
                        f_v = float(sp.re(v_l.evalf()))
                        if math.isnan(f_v):
                            levels_meta["left"] = 0.5
                        else:
                            # scale between 0.2 (high) and 0.8 (low)
                            levels_meta["left"] = 0.8 - (0.6 * (f_v - min_finite) / finite_range)
                    except Exception:
                        levels_meta["left"] = 0.5
                
                # Right limit
                v_r = col["f_val_right"]
                if v_r == sp.oo:
                    levels_meta["right"] = 0.0
                elif v_r == -sp.oo:
                    levels_meta["right"] = 1.0
                else:
                    try:
                        f_v = float(sp.re(v_r.evalf()))
                        if math.isnan(f_v):
                            levels_meta["right"] = 0.5
                        else:
                            levels_meta["right"] = 0.8 - (0.6 * (f_v - min_finite) / finite_range)
                    except Exception:
                        levels_meta["right"] = 0.5
            else:
                # Normal point
                v = col["f_val"]
                if v == sp.oo:
                    levels_meta["center"] = 0.0
                elif v == -sp.oo:
                    levels_meta["center"] = 1.0
                else:
                    try:
                        f_v = float(sp.re(v.evalf()))
                        if math.isnan(f_v):
                            levels_meta["center"] = 0.5
                        else:
                            # scale between 0.15 (high) and 0.85 (low) for maximum contrast
                            levels_meta["center"] = 0.85 - (0.7 * (f_v - min_finite) / finite_range)
                    except Exception:
                        levels_meta["center"] = 0.5
                        
            levels.append(levels_meta)
            
        return levels
