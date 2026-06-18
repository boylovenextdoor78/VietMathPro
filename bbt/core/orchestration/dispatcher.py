# -*- coding: utf-8 -*-
"""
Decentralized Orchestrator & Dispatcher.
Inspects expression features using a specialized AST Feature Scanner,
maps capabilities to prioritized execution targets, and routes computations with solid fallback.
Implements the crucial mathematical Trust Layer.
"""

from typing import Dict, Any, List, Set, Optional
from enum import Enum
from ..ast.nodes import Expr, Number, Symbol, BinaryOp, Function, Piecewise
from ..ast.visitors import NodeVisitor


class EngineID(Enum):
    """Available Symbolic and Analytical CAS Engines in VietMath."""
    INTERNAL = "internal_engine"
    PIECEWISE = "piecewise_engine"
    GIAC = "giac_engine"
    SYMPY = "sympy_engine"


class AstFeatureScanner(NodeVisitor):
    """Scans the Unified AST to flag math operations to determine engine compatibility."""

    def __init__(self) -> None:
        self.features: Set[str] = set()

    def scan(self, node: Expr) -> Set[str]:
        self.features.clear()
        node.accept(self)
        return self.features

    def visit_number(self, node: Number) -> Any:
        pass

    def visit_symbol(self, node: Symbol) -> Any:
        pass

    def visit_binary_op(self, node: BinaryOp) -> Any:
        if node.op == '/':
            self.features.add("rational")
        node.left.accept(self)
        node.right.accept(self)

    def visit_function(self, node: Function) -> Any:
        func_name = node.name.lower()
        if func_name in ["abs", "floor", "ceil", "sign"]:
            self.features.add("piecewise_discontinuous")
        elif func_name in ["sin", "cos", "tan", "cot"]:
            self.features.add("trigonometric")
        elif func_name in ["log", "ln"]:
            self.features.add("transcendental")
        for arg in node.args:
            arg.accept(self)

    def visit_piecewise(self, node: Piecewise) -> Any:
        self.features.add("piecewise_discontinuous")
        for expr, cond in node.branches:
            expr.accept(self)
            cond.accept(self)


class CapabilityMap:
    """Stores prioritized mappings of math capabilities to symbolic engines."""

    @staticmethod
    def get_preferred_engine(features: Set[str], task_type: str) -> EngineID:
        """Determines the most accurate engine for a specific combination of features."""
        # Hard piece-wise or discontinuous functions MUST go through the Piecewise Engine
        if "piecewise_discontinuous" in features:
            return EngineID.PIECEWISE
            
        # Hard trigonometry or general algebraic solves of polynomial equations benefit from GIAC/SymPy
        if task_type == "solve" and ("trigonometric" in features or "transcendental" in features):
            return EngineID.GIAC
            
        # Standard graphing, sign tables, derivative analysis are best suited to Internal analytical modules
        return EngineID.INTERNAL


class ExecRouter:
    """The Trust Layer executing instructions on the preferred engines with safe fallback logic."""

    def __init__(self) -> None:
        self._cache: Dict[str, Any] = {}

    def route_computation(self, node: Expr, task_type: str, context: Optional[Dict[str, Any]] = None) -> Any:
        """
        Routes algebraic task to the optimal engine, handles runtime errors, and
        applies sequential fallback triggers to guarantee reliability in educational environments.
        """
        # Feature scanning
        scanner = AstFeatureScanner()
        features = scanner.scan(node)
        
        # Determine prioritised dispatch execution targets
        primary_engine = CapabilityMap.get_preferred_engine(features, task_type)
        
        # Engine dispatch checklist
        eval_order = [
            primary_engine,
            EngineID.INTERNAL,  # Primary safe fallback
            EngineID.SYMPY,     # Symbolic math solver fallback
        ]
        
        errors: List[str] = []
        for engine in eval_order:
            try:
                res = self._execute_on_engine(engine, node, task_type, context)
                if res is not None:
                    return res
            except Exception as e:
                errors.append(f"{engine.value} failed: {str(e)}")
                
        raise RuntimeError(f"All CAS engines failed to solve this request. Trace: {', '.join(errors)}")

    def _execute_on_engine(self, engine: EngineID, node: Expr, task_type: str, context: Optional[Dict[str, Any]]) -> Any:
        # Mock execution logic showcasing modular integration bridges:
        if engine == EngineID.PIECEWISE:
            # Invokes the specific piecewise handlers
            from ..engines.piecewise_engine import PiecewiseEngine
            return PiecewiseEngine.process_ast(node, task_type, context)
            
        elif engine == EngineID.INTERNAL:
            # Delegate to standard built-in modules
            from ..external.sympy_bridge import SympyBridge
            return SympyBridge.execute_analytical(node, task_type, context)
            
        elif engine == EngineID.GIAC:
            # High-performance solver fallback
            from ..external.giac_bridge import GiacBridge
            return GiacBridge.solve_advanced(node, task_type, context)
            
        elif engine == EngineID.SYMPY:
            from ..external.sympy_bridge import SympyBridge
            return SympyBridge.execute_analytical(node, task_type, context)
            
        return None


# Global Orchestrator instance
Dispatcher = ExecRouter()
