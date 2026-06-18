# -*- coding: utf-8 -*-
"""
VietMath Pro - Unified Core Package.
Exposes modular symbolic algebraic structures, dispatching orchestrators, and piecewise engines.
"""

from .ast import Expr, Number, Symbol, BinaryOp, Function, Piecewise
from .orchestration import Dispatcher, ExecRouter, CapabilityMap
from .normalization import Canonicalizer, ResultNormalizer
from .engines import PiecewiseEngine
from .external import sympy_bridge, giac_bridge

__all__ = [
    "Expr", "Number", "Symbol", "BinaryOp", "Function", "Piecewise",
    "Dispatcher", "ExecRouter", "CapabilityMap",
    "Canonicalizer", "ResultNormalizer",
    "PiecewiseEngine", "sympy_bridge", "giac_bridge"
]
