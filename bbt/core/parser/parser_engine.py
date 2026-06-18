# -*- coding: utf-8 -*-
"""
Core Parser converting school-level mathematical expressions into our Typed Unified AST.
Uses SymPy's powerful symbol parser to build the base structure, then maps SymPy AST trees
directly to our unified intermediate representation.
"""

import sympy as sp
from typing import Any, Union
from ..ast.nodes import Expr, Number, Symbol, BinaryOp, Function, Piecewise


class CoreParser:
    """Mathematical Parser translating text strings into unified AST structures."""

    @staticmethod
    def parse_string(expr_str: str) -> Expr:
        """
        Main entry point for parsing expression text.
        Leverages SymPy expression structures and models them into the unified AST.
        """
        # Define default symbol and common functions for parsing
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
            'floor': sp.floor,
            'ceiling': sp.ceiling,
        }
        
        # Safe preprocessing of exponents/multiplications
        processed = expr_str.replace('^', '**')
        # Insert implicit multiplications (e.g. 2x -> 2*x) if needed
        # (Usually handled by our legacy parser, here we safeguard with basic pre-parsing)
        try:
            sp_expr = sp.parse_expr(processed, local_dict=local_dict)
        except Exception as e:
            raise ValueError(f"Failed to parse mathematical syntax in CoreParser: {str(e)}")
            
        return CoreParser.from_sympy(sp_expr)

    @staticmethod
    def from_sympy(sp_node: Any) -> Expr:
        """Recursively translates a SymPy expression tree into our native AST nodes."""
        if isinstance(sp_node, sp.Symbol):
            return Symbol(name=sp_node.name)
            
        elif isinstance(sp_node, (sp.Integer, sp.Float, sp.Rational)):
            val = float(sp_node.evalf())
            if val.is_integer():
                val = int(val)
            return Number(value=val)
            
        elif isinstance(sp_node, sp.Add):
            # Parse as nested binary additions: x + y + z -> BinaryOp(BinaryOp(x, "+", y), "+", z)
            args = list(sp_node.args)
            curr = CoreParser.from_sympy(args[0])
            for arg in args[1:]:
                curr = BinaryOp(left=curr, op='+', right=CoreParser.from_sympy(arg))
            return curr
            
        elif isinstance(sp_node, sp.Mul):
            # Parse as nested binary multiplications
            args = list(sp_node.args)
            curr = CoreParser.from_sympy(args[0])
            for arg in args[1:]:
                curr = BinaryOp(left=curr, op='*', right=CoreParser.from_sympy(arg))
            return curr
            
        elif isinstance(sp_node, sp.Pow):
            return BinaryOp(
                left=CoreParser.from_sympy(sp_node.base),
                op='**',
                right=CoreParser.from_sympy(sp_node.exp)
            )
            
        elif isinstance(sp_node, sp.Abs):
            return Function(name='abs', args=[CoreParser.from_sympy(sp_node.args[0])])
            
        elif isinstance(sp_node, sp.floor):
            return Function(name='floor', args=[CoreParser.from_sympy(sp_node.args[0])])
            
        elif isinstance(sp_node, sp.ceiling):
            return Function(name='ceil', args=[CoreParser.from_sympy(sp_node.args[0])])
            
        elif isinstance(sp_node, sp.Piecewise):
            branches = []
            for expr, cond in sp_node.args:
                branches.append((CoreParser.from_sympy(expr), CoreParser.from_sympy(cond)))
            return Piecewise(branches=branches)
            
        elif isinstance(sp_node, sp.AppliedUndef) or isinstance(sp_node, sp.Function):
            name = sp_node.__class__.__name__.lower()
            args = [CoreParser.from_sympy(arg) for arg in sp_node.args]
            return Function(name=name, args=args)
            
        else:
            # Fallback to atomic or string representation
            try:
                val = float(sp_node)
                if val.is_integer():
                    val = int(val)
                return Number(value=val)
            except (TypeError, ValueError):
                return Symbol(name=str(sp_node))
