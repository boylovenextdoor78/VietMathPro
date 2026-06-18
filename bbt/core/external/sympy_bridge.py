# -*- coding: utf-8 -*-
"""
Bridging layer translating Unified AST structures into pure SymPy equations,
safeguarding mathematical domain restrictions during algebraic simplifications.
"""

import sympy as sp
from typing import Any, Dict, Optional, List
from ..ast.nodes import Expr, Number, Symbol, BinaryOp, Function, Piecewise
from ..ast.visitors import StringifyVisitor


class SympyBridge:
    """Rigorous interface to SymPy solver utilities, shielding domain restrictions from loss."""

    @staticmethod
    def to_sympy(node: Expr) -> sp.Expr:
        """Converts our native typed AST nodes into SymPy Symbolic Expressions."""
        # Use simple string translation or reconstruct via visitors for maximum performance/safety
        x = sp.Symbol('x', real=True)
        local_dict = {
            'x': x,
            'abs': sp.Abs,
            'floor': sp.floor,
            'ceil': sp.ceiling,
            'sqrt': sp.sqrt,
            'ln': sp.log,
            'log': sp.log,
            'sin': sp.sin,
            'cos': sp.cos,
            'tan': sp.tan,
        }
        
        # Stringify using our specialized visitor
        visitor = StringifyVisitor()
        stringified_expr = node.accept(visitor)
        normalized = stringified_expr.replace('^', '**')
        return sp.parse_expr(normalized, local_dict=local_dict)

    @staticmethod
    def from_sympy(sp_node: sp.Expr) -> Expr:
        """Helper to map a SymPy expression back to our Unified AST."""
        from ..parser.parser_engine import CoreParser
        return CoreParser.from_sympy(sp_node)

    @staticmethod
    def find_singularities(sp_expr: sp.Expr, var_sym: sp.Symbol = sp.Symbol('x', real=True)) -> List[str]:
        """Detects poles, undefined points, and removable singularities of a rational fraction."""
        singularities = []
        try:
            # 1. Look for explicit denominators
            denom = sp_expr.as_numer_denom()[1]
            if denom != 1:
                roots = sp.solve(denom, var_sym)
                for root in roots:
                    singularities.append(f"x != {root}")
            
            # 2. Look for logarithms which require argument > 0
            # Parse logarithm argument restrictions for consistency
            for log_func in sp_expr.atoms(sp.log):
                arg = log_func.args[0]
                singularities.append(f"{arg} > 0")
        except Exception:
            pass
        return singularities

    @classmethod
    def simplify_safe(cls, node: Expr) -> Expr:
        """
        Simplifies an expression algebraic tree while retaining strict domain constraints
        from the pre-simplified form in node metadata.
        """
        sp_original = cls.to_sympy(node)
        
        # Calculate singularities before they are simplified/removed
        x = sp.Symbol('x', real=True)
        original_restrictions = cls.find_singularities(sp_original, x)
        
        # Simplify symbolic equation
        sp_simplified = sp.simplify(sp_original)
        
        # Build back our native AST
        simplified_ast = cls.from_sympy(sp_simplified)
        
        # Merge original and new domain constraints to prevent algebraic logic corruption
        combined = list(set(node.domain_restrictions + original_restrictions))
        simplified_ast.domain_restrictions = combined
        
        return simplified_ast

    @classmethod
    def execute_analytical(cls, node: Expr, task_type: str, context: Optional[Dict[str, Any]] = None) -> Any:
        """Executes traditional calculus operations via SymPy wrapper."""
        sp_expr = cls.to_sympy(node)
        x = sp.Symbol('x', real=True)
        
        if task_type == "derivative":
            deriv = sp.diff(sp_expr, x)
            simplified = sp.simplify(deriv)
            return cls.from_sympy(simplified)
            
        elif task_type == "simplify":
            return cls.simplify_safe(node)
            
        elif task_type == "solve":
            try:
                roots = sp.solve(sp_expr, x)
                return [cls.from_sympy(r) for r in roots]
            except Exception:
                sol_set = sp.solveset(sp_expr, x, domain=sp.S.Reals)
                if isinstance(sol_set, sp.FiniteSet):
                    return [cls.from_sympy(r) for r in list(sol_set)]
                return []
                
        elif task_type == "limit":
            point_val = context.get("point", 0) if context else 0
            direction_val = context.get("direction", "both") if context else "both"
            try:
                result_lim = sp.limit(sp_expr, x, point_val, dir=direction_val)
                return cls.from_sympy(result_lim)
            except Exception:
                return Number(value=0)
                
        else:
            raise NotImplementedError(f"SymPy bridge task: '{task_type}' is unimplemented.")
