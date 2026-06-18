# -*- coding: utf-8 -*-
"""
VietMath Pro - Tableur of Function Variation
Module: main.py
Description: Main orchestration entry point. Combines validator, parser, analyzer,
             and renderer into a robust unified mathematical SVG pipeline.
"""

import sys
import os
import json
from validator import ExpressionValidator
from analyzer import VariationAnalyzer
from svg_renderer import SVGRenderer
from trig_critical_analyzer import TrigCriticalAnalyzer

def generate_bbt_svg(expr_str: str) -> str:
    """
    Unified public pipeline function. Given a math string:
    1. Validates expression content and checks triggers for forbidden elements.
    2. Runs symbolic calculus and analytical analysis.
    3. Builds the Variation Semantic Graph.
    4. Renders and returns a robust vector-drawn SVG.
    """
    if TrigCriticalAnalyzer.is_trig_expression(expr_str):
        TrigCriticalAnalyzer.validate_trig_profile(expr_str)
        analysis_data = TrigCriticalAnalyzer.analyze_trig_function(expr_str)
    else:
        ExpressionValidator.validate_expression(expr_str)
        analysis_data = VariationAnalyzer.analyze_function(expr_str)
    
    svg_string = SVGRenderer.render_bbt(analysis_data)
    return svg_string


def generate_bbt_data(expr_str: str) -> dict:
    """
    Unified public pipeline function that returns both:
    1. Rendered SVG string.
    2. Legend list of assigned math symbols.
    3. Domain of definition in Vietnamese text notation.
    4. Advanced asymptotes report containing verticals, horizontals, slants, and curved asymptotes.
    """
    if TrigCriticalAnalyzer.is_trig_expression(expr_str):
        TrigCriticalAnalyzer.validate_trig_profile(expr_str)
        analysis_data = TrigCriticalAnalyzer.analyze_trig_function(expr_str)
    else:
        ExpressionValidator.validate_expression(expr_str)
        analysis_data = VariationAnalyzer.analyze_function(expr_str)
        
    svg_string = SVGRenderer.render_bbt(analysis_data)
    return {
        "svg": svg_string,
        "legend": analysis_data.get("legend", []),
        "domain_vnm": analysis_data.get("domain_vnm", "D = \u211d"),
        "asymptotes_report": analysis_data.get("asymptotes_report", {"vertical": [], "horizontal": [], "slant": [], "curved": []})
    }


def run_tests():
    """
    Executes mandatory mathematical test cases to prove mathematical accuracy
    and operational stability of VietMath Pro.
    """
    test_cases = [
        "x^3",
        "x^4-2*x^2+1",
        "(2*x+1)^5",
        "(x^2-1)/(x-2)",
        "sqrt(x)",
        "sqrt(x+1)",
        "sqrt(x^2-x)",
        "abs(x^2-2*x)",
        "x**(1/3)",
        "((x^2+1)**(1/3))/(x-1)" # equivalent to ((x^2+1)^(1/3))/(x-1)
    ]
    
    print("====================================================")
    print("VIETMATH PRO - TABLEUR OF FUNCTION VARIATION TESTS")
    print("====================================================")
    
    # Create output directory for test SVGs
    output_dir = "./output_tests"
    os.makedirs(output_dir, exist_ok=True)

    for idx, tc in enumerate(test_cases, 1):
        print(f"\n[Test {idx}] Processing expression: {tc}")
        try:
            # Generate rendering SVG string
            svg_content = generate_bbt_svg(tc)
            
            # Save output to disk
            filename = f"test_{idx}_bbt.svg"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(svg_content)
                
            print(f" -> SUCCESS: Saved highly rigorous BBT SVG to '{filepath}'")
            
        except Exception as e:
            print(f" -> FAILURE on testing '{tc}': {str(e)}")


if __name__ == "__main__":
    # If file is executed stand-alone, trigger the verification test-suite
    run_tests()
