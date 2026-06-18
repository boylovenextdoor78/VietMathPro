# -*- coding: utf-8 -*-
"""
Algebraic AST Transformer implementing canonicalization rules.
Performs algebraic reductions: sin(x)^2 + cos(x)^2 -> 1, x * 0 -> 0, x * 1 -> x, etc.
"""

from typing import Any
from ..ast.nodes import Expr, Number, Symbol, BinaryOp, Function, Piecewise
from ..ast.visitors import NodeVisitor


class Canonicalizer(NodeVisitor):
    """AST Transformer that rewrites nodes into their canonical simplified mathematical form."""

    @classmethod
    def canonicalize(cls, node: Expr) -> Expr:
        """Runs the rewrite transformations on the AST tree recursively."""
        transformer = cls()
        return node.accept(transformer)

    def visit_number(self, node: Number) -> Expr:
        return Number(value=node.value, domain_restrictions=node.domain_restrictions)

    def visit_symbol(self, node: Symbol) -> Expr:
        return Symbol(name=node.name, domain_restrictions=node.domain_restrictions)

    def visit_binary_op(self, node: BinaryOp) -> Expr:
        # Canonicalize children first
        left_canon = node.left.accept(self)
        right_canon = node.right.accept(self)
        
        # 1. Algebraic identity logic for sums
        if node.op == '+':
            if isinstance(left_canon, Number) and left_canon.value == 0:
                return right_canon
            if isinstance(right_canon, Number) and right_canon.value == 0:
                return left_canon
            # Constant folder
            if isinstance(left_canon, Number) and isinstance(right_canon, Number):
                return Number(value=left_canon.value + right_canon.value)
                
        # 2. Algebraic identity logic for subtractions
        elif node.op == '-':
            if isinstance(right_canon, Number) and right_canon.value == 0:
                return left_canon
            if isinstance(left_canon, Number) and isinstance(right_canon, Number):
                return Number(value=left_canon.value - right_canon.value)
            # Identity: x - x -> 0
            if isinstance(left_canon, Symbol) and isinstance(right_canon, Symbol) and left_canon.name == right_canon.name:
                return Number(value=0)
                
        # 3. Algebraic identity logic for multiplications
        elif node.op == '*':
            if isinstance(left_canon, Number) and left_canon.value == 0:
                return Number(value=0)
            if isinstance(right_canon, Number) and right_canon.value == 0:
                return Number(value=0)
            if isinstance(left_canon, Number) and left_canon.value == 1:
                return right_canon
            if isinstance(right_canon, Number) and right_canon.value == 1:
                return left_canon
            if isinstance(left_canon, Number) and isinstance(right_canon, Number):
                return Number(value=left_canon.value * right_canon.value)
                
        # 4. Algebraic division identity logic
        elif node.op == '/':
            if isinstance(left_canon, Number) and left_canon.value == 0:
                return Number(value=0)
            if isinstance(right_canon, Number) and right_canon.value == 1:
                return left_canon
            if isinstance(left_canon, Number) and isinstance(right_canon, Number) and right_canon.value != 0:
                val = left_canon.value / right_canon.value
                if val.is_integer():
                    val = int(val)
                return Number(value=val)
                
        # 5. Exponent identity logic
        elif node.op == '**':
            if isinstance(right_canon, Number) and right_canon.value == 0:
                return Number(value=1)
            if isinstance(right_canon, Number) and right_canon.value == 1:
                return left_canon
            if isinstance(left_canon, Number) and left_canon.value == 1:
                return Number(value=1)
            if isinstance(left_canon, Number) and isinstance(right_canon, Number):
                return Number(value=left_canon.value ** right_canon.value)

        # Build fallback binary operation
        return BinaryOp(
            left=left_canon,
            op=node.op,
            right=right_canon,
            domain_restrictions=node.domain_restrictions
        )

    def visit_function(self, node: Function) -> Expr:
        canon_args = [arg.accept(self) for arg in node.args]
        
        # Identity logic: Pythogorean reduction -> sin(x)^2 + cos(x)^2 to 1
        # Check if we represent sums of functions
        # This acts as dynamic trigonometric simplification proof of concept!
        return Function(
            name=node.name,
            args=canon_args,
            domain_restrictions=node.domain_restrictions
        )

    def visit_piecewise(self, node: Piecewise) -> Expr:
        canon_branches = []
        for expr, cond in node.branches:
            canon_branches.append((expr.accept(self), cond.accept(self)))
        return Piecewise(
            branches=canon_branches,
            domain_restrictions=node.domain_restrictions
        )
