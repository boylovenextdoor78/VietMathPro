# -*- coding: utf-8 -*-
"""
Production-grade Abstract Syntax Tree (AST) Nodes for symbolic mathematics.
Leverages Python 3.13 type hinting, standard dataclasses, and visitor pattern.
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Any, Dict, Optional, Union


@dataclass
class Expr:
    """Base Abstract Syntax Node for all mathematical symbolic expressions."""
    
    # Track domain constraints associated with the current expression subtree to prevent loss of domain restrictions (e.g. x != 2)
    domain_restrictions: List[str] = field(default_factory=list, compare=False)

    def accept(self, visitor: "NodeVisitor") -> Any:
        """Visitor pattern dispatcher."""
        raise NotImplementedError("AST nodes must override accept()")


@dataclass
class Number(Expr):
    """Represents a numeric constant (integer or float)."""
    value: Union[int, float]

    def accept(self, visitor: "NodeVisitor") -> Any:
        return visitor.visit_number(self)


@dataclass
class Symbol(Expr):
    """Represents an algebraic symbol / variable (e.g. 'x')."""
    name: str

    def accept(self, visitor: "NodeVisitor") -> Any:
        return visitor.visit_symbol(self)


@dataclass
class BinaryOp(Expr):
    """Represents a binary mathematical operator (+, -, *, /, **)."""
    left: Expr
    op: str
    right: Expr

    def accept(self, visitor: "NodeVisitor") -> Any:
        return visitor.visit_binary_op(self)


@dataclass
class Function(Expr):
    """Represents a mathematical function call (e.g. ln(x), floor(x), abs(x))."""
    name: str
    args: List[Expr]

    def accept(self, visitor: "NodeVisitor") -> Any:
        return visitor.visit_function(self)


@dataclass
class Piecewise(Expr):
    """
    Represents a piecewise defined function with conditional branches.
    Each branch is a tuple of (Expression, ConditionExpression).
    """
    branches: List[Tuple[Expr, Expr]]  # list of (expr, cond)

    def accept(self, visitor: "NodeVisitor") -> Any:
        return visitor.visit_piecewise(self)
