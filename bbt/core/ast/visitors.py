# -*- coding: utf-8 -*-
"""
Visitor specifications for mathematical tree traversal, evaluation, and serialization.
"""

from typing import Any, Dict
import math
from .nodes import Expr, Number, Symbol, BinaryOp, Function, Piecewise


class NodeVisitor:
    """Abstract Visitor Pattern Interface."""

    def visit_number(self, node: Number) -> Any:
        raise NotImplementedError()

    def visit_symbol(self, node: Symbol) -> Any:
        raise NotImplementedError()

    def visit_binary_op(self, node: BinaryOp) -> Any:
        raise NotImplementedError()

    def visit_function(self, node: Function) -> Any:
        raise NotImplementedError()

    def visit_piecewise(self, node: Piecewise) -> Any:
        raise NotImplementedError()


class StringifyVisitor(NodeVisitor):
    """Translates AST back to a clean parser-friendly string representation."""

    def visit_number(self, node: Number) -> str:
        return str(node.value)

    def visit_symbol(self, node: Symbol) -> str:
        return node.name

    def visit_binary_op(self, node: BinaryOp) -> str:
        # Wrap in parenthesis if needed to assure operator precedence is preserved
        op_map = {'+': 1, '-': 1, '*': 2, '/': 2, '**': 3}
        left_str = node.left.accept(self)
        right_str = node.right.accept(self)
        
        # Check if left or right operands need parentheses
        if isinstance(node.left, BinaryOp) and op_map.get(node.left.op, 0) < op_map.get(node.op, 0):
            left_str = f"({left_str})"
        if isinstance(node.right, BinaryOp) and op_map.get(node.right.op, 0) <= op_map.get(node.op, 0):
            right_str = f"({right_str})"
            
        return f"{left_str} {node.op} {right_str}"

    def visit_function(self, node: Function) -> str:
        args_str = ", ".join(arg.accept(self) for arg in node.args)
        return f"{node.name}({args_str})"

    def visit_piecewise(self, node: Piecewise) -> str:
        branches_str = []
        for expr, cond in node.branches:
            branches_str.append(f"({expr.accept(self)} if {cond.accept(self)})")
        return f"piecewise({', '.join(branches_str)})"


class EvaluatorVisitor(NodeVisitor):
    """Numerically evaluates a mathematical AST using a symbol lookup table."""

    def __init__(self, lookup: Dict[str, float]):
        self.lookup = lookup

    def visit_number(self, node: Number) -> float:
        return float(node.value)

    def visit_symbol(self, node: Symbol) -> float:
        if node.name in self.lookup:
            return self.lookup[node.name]
        raise ValueError(f"Missing variable valuation for '{node.name}'")

    def visit_binary_op(self, node: BinaryOp) -> float:
        left_val = node.left.accept(self)
        right_val = node.right.accept(self)
        if node.op == '+':
            return left_val + right_val
        elif node.op == '-':
            return left_val - right_val
        elif node.op == '*':
            return left_val * right_val
        elif node.op == '/':
            if abs(right_val) < 1e-15:
                raise ZeroDivisionError("Numerical division by zero inside expression AST evaluation")
            return left_val / right_val
        elif node.op == '**':
            return float(left_val ** right_val)
        raise ValueError(f"Unsupported binary operator '{node.op}'")

    def visit_function(self, node: Function) -> float:
        evaluated_args = [arg.accept(self) for arg in node.args]
        
        funcs = {
            'abs': abs,
            'sqrt': lambda x: math.sqrt(x) if x >= 0 else float('nan'),
            'floor': lambda x: float(math.floor(x)),
            'ceil': lambda x: float(math.ceil(x)),
            'sin': math.sin,
            'cos': math.cos,
            'tan': math.tan,
            'log': lambda x, base=math.e: math.log(x, base) if x > 0 else float('nan'),
            'ln': lambda x: math.log(x) if x > 0 else float('nan'),
        }
        
        if node.name.lower() in funcs:
            return funcs[node.name.lower()](*evaluated_args)
        raise NotImplementedError(f"Numerical function '{node.name}' evaluation not registered")

    def visit_piecewise(self, node: Piecewise) -> float:
        for expr, cond in node.branches:
            if cond.accept(self):
                return expr.accept(self)
        return float('nan')
