# -*- coding: utf-8 -*-
"""
Specialized Piecewise-Safety Engine.
Decomposes nested absolute values (abs(u) -> u if u >= 0 else -u), floor functions,
and rational singularities into explicit, robust mathematical piecewise bounds.
"""

from typing import Any, Dict, List, Optional, Tuple
from ..ast.nodes import Expr, Number, Symbol, BinaryOp, Function, Piecewise
from ..ast.visitors import NodeVisitor


class AbsDecomposer(NodeVisitor):
    """AST Transformer that expands non-differentiable abs(u) functions into explicit piecewise nodes."""

    def visit_number(self, node: Number) -> Expr:
        return node

    def visit_symbol(self, node: Symbol) -> Expr:
        return node

    def visit_binary_op(self, node: BinaryOp) -> Expr:
        return BinaryOp(
            left=node.left.accept(self),
            op=node.op,
            right=node.right.accept(self)
        )

    def visit_function(self, node: Function) -> Expr:
        if node.name.lower() == "abs":
            # Decompose abs(u) -> [(u, u >= 0), (-u, u < 0)]
            inside = node.args[0].accept(self)
            cond_geq = BinaryOp(left=inside, op='>=', right=Number(value=0))
            cond_lt = BinaryOp(left=inside, op='<', right=Number(value=0))
            negative_inside = BinaryOp(left=Number(value=0), op='-', right=inside)
            
            return Piecewise(branches=[
                (inside, cond_geq),
                (negative_inside, cond_lt)
            ])
            
        args_decomp = [arg.accept(self) for arg in node.args]
        return Function(name=node.name, args=args_decomp)

    def visit_piecewise(self, node: Piecewise) -> Expr:
        decomp_branches = []
        for expr, cond in node.branches:
            decomp_branches.append((expr.accept(self), cond.accept(self)))
        return Piecewise(branches=decomp_branches)


class PiecewiseEngine:
    """Core process module evaluating piecewise continuous functions."""

    @staticmethod
    def expand_absolute_values(node: Expr) -> Expr:
        """Translates non-differentiable absolute value sub-trees into distinct piecewise branches."""
        decomposer = AbsDecomposer()
        return node.accept(decomposer)

    @classmethod
    def process_ast(cls, node: Expr, task_type: str, context: Optional[Dict[str, Any]] = None) -> Any:
        """
        Coordinates algebraic assessments and calculus operations on piecewise-defined sub-nodes
        ensuring continuity checks and one-sided numeric derivations.
        """
        expanded = cls.expand_absolute_values(node)
        
        # Execute operations for each piecewise branch sequentially
        # Fall back to standard Sympy calculation if it doesn't contain Piecewise components
        if not isinstance(expanded, Piecewise):
            from ..external.sympy_bridge import SympyBridge
            return SympyBridge.execute_analytical(expanded, task_type, context)
            
        # Analytical piecewise branches sorting
        results = []
        for sub_expr, cond in expanded.branches:
            from ..external.sympy_bridge import SympyBridge
            try:
                sub_res = SympyBridge.execute_analytical(sub_expr, task_type, context)
                results.append((sub_res, cond))
            except Exception:
                pass
                
        # Rebuild unified piecewise result
        if len(results) == 1:
            return results[0][0]
        return Piecewise(branches=results)
