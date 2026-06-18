# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: interval_engine.py
Description: Partitions the domain of definition into ordered intervals based on poles & critical points.
             Computes derivative signs (+/-) inside each partition.
"""

import sympy as sp
from typing import List, Dict, Tuple, Any, Union
from cas_engine import CASEngine
from domain_engine import DomainEngine
from extrema_engine import ExtremaEngine

class IntervalEngine:
    """
    Rigorously partitions the domain into intervals of monotonicity.
    Tests signs on intermediate probe points to discover intervals of increase (+) or decrease (-).
    """

    @classmethod
    def get_partition_nodes(cls, expr: sp.Expr) -> List[sp.Expr]:
        """
        Gathers all critical partition boundaries on R:
        - poles (singularities / vertical asymptotes)
        - critical points where f'(x) = 0 or f'(x) is undefined but in domain
        Returns a sorted real numerical unique list.
        """
        x = CASEngine.get_symbol_x()
        nodes = []

        # 1. Singularities
        poles = DomainEngine.find_singularities(expr)
        for p in poles:
            if p not in nodes:
                nodes.append(p)

        # 2. Critical points
        crit_pts = ExtremaEngine.find_derivative_critical_points(expr)
        for cp in crit_pts:
            if cp not in nodes:
                nodes.append(cp)

        # 2.5 Non-differentiable roots (Abs arguments, bases of fractional or negative exponents)
        for sub_expr in sp.preorder_traversal(expr):
            name = type(sub_expr).__name__
            if name == "Abs":
                arg = sub_expr.args[0]
                roots = CASEngine.solve_equation(arg)
                for r in roots:
                    if r not in nodes:
                        nodes.append(r)
            elif name in ("Pow", "root") or str(sub_expr).startswith("sqrt"):
                if hasattr(sub_expr, "as_base_exp"):
                    base, exp = sub_expr.as_base_exp()
                else:
                    try:
                        base = sub_expr.args[0]
                        exp = 1 / sub_expr.args[1] if len(sub_expr.args) > 1 else sp.Rational(1, 2)
                    except Exception:
                        continue
                try:
                    if not exp.is_integer:
                        roots = CASEngine.solve_equation(base)
                        for r in roots:
                            if r not in nodes:
                                nodes.append(r)
                except Exception:
                    pass

        # 3. Add boundaries of domain (like under sqrt where constraint is x >= -1, node -1 is a boundary)
        intervals = DomainEngine.get_valid_domain_intervals(expr)
        for inter in intervals:
            for bound in [inter.start, inter.end]:
                if bound not in [sp.oo, -sp.oo] and bound not in nodes:
                    nodes.append(bound)

        # Filter nodes to ensure they are real
        nodes = [pt for pt in nodes if CASEngine.safe_is_real(pt)]

        # Sort all nodes numerically
        try:
            nodes.sort(key=lambda item: CASEngine.safe_float(item))
        except Exception:
            pass

        return nodes

    @classmethod
    def decompose_intervals(cls, expr: sp.Expr) -> List[Tuple[Union[sp.Expr, float], Union[sp.Expr, float]]]:
        """
        Slices the real domain into disjoint intervals bounded by our partition nodes.
        Filters out intervals that lie completely outside the function's domain.
        """
        nodes = cls.get_partition_nodes(expr)
        
        # Add infinite bounds
        all_points = [-sp.oo] + nodes + [sp.oo]
        
        intervals = []
        for i in range(len(all_points) - 1):
            start = all_points[i]
            end = all_points[i+1]
            intervals.append((start, end))

        # Filter intervals to ensure they intersect with the function's valid domain
        domain_intervals = DomainEngine.get_valid_domain_intervals(expr)
        valid_partitions = []

        for start, end in intervals:
            # Create a sympy interval for testing
            try:
                # Determine standard open interval for internal probe
                test_interval = sp.Interval(start, end, True, True)
                
                # Check intersection with valid domain
                intersects = False
                for dom in domain_intervals:
                    # If intersection is an interval that is not empty
                    inter_sect = dom.intersect(test_interval)
                    if not inter_sect.is_empty and not isinstance(inter_sect, sp.FiniteSet):
                        intersects = True
                        break
                
                if intersects:
                    valid_partitions.append((start, end))
            except Exception:
                # If error, default preserve the interval safely
                valid_partitions.append((start, end))

        return valid_partitions

    @classmethod
    def evaluate_interval_signs(cls, expr: sp.Expr) -> List[Dict[str, Any]]:
        """
        Determines the analytical sign (+/-) of the derivative f'(x) within each partition.
        E.g. chooses a mid-point probe inside (start, end) and evaluates f'(probe).
        """
        x = CASEngine.get_symbol_x()
        deriv = CASEngine.derivative(expr)
        partitions = cls.decompose_intervals(expr)
        results = []

        for start, end in partitions:
            # 1. Choose a probe point inside the open interval
            if start == -sp.oo and end == sp.oo:
                probe = sp.Integer(0)
            elif start == -sp.oo:
                probe = end - sp.Integer(1)
            elif end == sp.oo:
                probe = start + sp.Integer(1)
            else:
                probe = (start + end) / 2

            # 2. Evaluate derivative at the probe point
            try:
                probe_val = CASEngine.safe_float(probe)
                sign_val = CASEngine.safe_float(deriv.subs(x, probe_val))
            except Exception:
                # Symbolic limit check if numeric subst fails (e.g. for some complex rational expressions)
                try:
                    sign_val = CASEngine.safe_float(CASEngine.eval_limit(deriv, probe))
                except Exception:
                    sign_val = 0.0

            # 3. Classify sign
            if sign_val > 1e-9:
                sign_label = "+"
            elif sign_val < -1e-9:
                sign_label = "-"
            else:
                sign_label = "0"

            results.append({
                "interval": (start, end),
                "probe": probe,
                "deriv_val_at_probe": sign_val,
                "sign": sign_label
            })

        return results
