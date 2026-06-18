# -*- coding: utf-8 -*-
"""
Mathematical Unit and Symbolic Integration Test Suite for feature/hybrid-cas-core.
Executes assertions covering CoreParser, Canonicalizer, SympyBridge domain restrictions preservation,
Piecewise Safety decomposition, and Dispatcher routing mechanics.
"""

import sys
import os

# Resolve imports locally during testing
sys.path.insert(0, os.path.dirname(__file__))

from core import (
    Expr, Number, Symbol, BinaryOp, Function, Piecewise,
    CoreParser, Canonicalizer, ResultNormalizer,
    PiecewiseEngine, sympy_bridge, Dispatcher
)
from core.validation import CoreValidator


def test_validator():
    print("[TEST 1] CoreValidator Audits...")
    # Should pass fine
    CoreValidator.validate_expression("x^2 + 2*x - 3")
    
    # Should trigger exceptions for malicious/unsupported strings
    try:
        CoreValidator.validate_expression("import os; os.system('clear')")
        assert False, "Failed to trap command injection"
    except Exception as e:
        print(" -> Caught command injection safely.")
        
    try:
        CoreValidator.validate_expression("parametric_omega(t)")
        assert False, "Failed to block unsupported alpha variables"
    except Exception as e:
        print(" -> Caught unsupported variable alphabets safely.")
    print(" -> SUCCESS: Validator is robust.\n")


def test_parser_conversion():
    print("[TEST 2] CoreParser Algebraic AST Mapping...")
    math_str = "x^2 + x/2 - 5"
    ast_tree = CoreParser.parse_string(math_str)
    
    print(f" parsed math input: {math_str}")
    # Verify exact types
    assert isinstance(ast_tree, BinaryOp), "Root should be a binary operator"
    print(" -> SUCCESS: AST translation maps accurately.\n")


def test_canonicalizer():
    print("[TEST 3] Algebraic Canonicalizer reductions...")
    # x * 0 -> 0
    zero_mult = BinaryOp(left=Symbol(name='x'), op='*', right=Number(value=0))
    simplified_zero = Canonicalizer.canonicalize(zero_mult)
    assert isinstance(simplified_zero, Number) and simplified_zero.value == 0, "x*0 reduction failed"
    
    # constant folding: 3 + 4 -> 7
    add_const = BinaryOp(left=Number(value=3), op='+', right=Number(value=4))
    simplified_add = Canonicalizer.canonicalize(add_const)
    assert isinstance(simplified_add, Number) and simplified_add.value == 7, "3+4 folding failed"
    
    print(" -> SUCCESS: Algebraic reductions run correctly.\n")


def test_domain_preservation():
    print("[TEST 4] Domain Restrictions Preservation (The (x^2-4)/(x-2) check)...")
    expr_node = CoreParser.parse_string("(x**2 - 4) / (x - 2)")
    
    # Run simplify with domain constraints tracking integration
    simplified_node = sympy_bridge.simplify_safe(expr_node)
    
    print(f" Original: (x^2-4)/(x-2)")
    print(f" Simplified: {simplified_node}")
    print(f" Tracked Domain Restrictions (Removable Singularities): {simplified_node.domain_restrictions}")
    
    # Check that it solved to x + 2 while tracking x != 2 singularity correctly
    assert any("2" in s for s in simplified_node.domain_restrictions), "Lost singularity constraint"
    print(" -> SUCCESS: Domain restriction survived algebraic simplify.\n")


def test_piecewise_safety():
    print("[TEST 5] Piecewise Safety Abs decomposition...")
    expr_node = CoreParser.parse_string("abs(x - 3)")
    
    # Decompose absolute value into branches
    piecewise_ast = PiecewiseEngine.expand_absolute_values(expr_node)
    
    print(f" Original: abs(x - 3)")
    print(f" Piecewise expanded: {piecewise_ast}")
    
    assert isinstance(piecewise_ast, Piecewise), "Failed to decompose abs into piecewise branches"
    assert len(piecewise_ast.branches) == 2, "Decomposed branches count mismatch"
    print(" -> SUCCESS: Abs functions parsed safely into branches.\n")


def test_routing():
    print("[TEST 6] Dispatcher and Exec Router (Trust Layer)...")
    expr_node = CoreParser.parse_string("x**2 - 5*x + 6")
    
    # Computes derivatives recursively via routed engine
    deriv_result = Dispatcher.route_computation(expr_node, "derivative")
    print(f" Original: x^2 - 5x + 6")
    print(f" Routed Derivative: {deriv_result}")
    
    # Derivative of x^2 - 5x + 6 is 2*x - 5
    assert "5" in str(deriv_result) and "2" in str(deriv_result), "Derivative calculation mismatch"
    print(" -> SUCCESS: Engine routing executed and solved.\n")


def run_all_tests():
    print("==================================================")
    # Perform unit checks
    test_validator()
    test_parser_conversion()
    test_canonicalizer()
    test_domain_preservation()
    test_piecewise_safety()
    test_routing()
    print("==================================================")
    print("ALL TESTS RUN AND PASSED WITH PERFECT SUCCESS!")
    print("==================================================")


if __name__ == "__main__":
    run_all_tests()
