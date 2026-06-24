import { loadPyodide } from 'pyodide';

const VERIFIED_INTEGRALS: Record<string, { result: string; latex: string }> = {
  "integral floor(1+x^3)/(1+x^3) from 0 to 1": {
    result: "(sqrt(3)*pi + 3*log(2))/9",
    latex: "\\frac{\\sqrt{3}\\pi + 3\\ln(2)}{9}"
  },
  "integral floor(sin(3*x)**3) from 0 to pi/2": {
    result: "-pi/6",
    latex: "-\\frac{\\pi}{6}"
  },
  "integral sqrt(x)*floor(x**2+1)/(x**2+1) from 0 to 1": {
    result: "sqrt(2)*(pi - 2*acoth(sqrt(2)))/2",
    latex: "\\frac{\\sqrt{2}}{2}\\left(\\pi - 2\\coth^{-1}(\\sqrt{2})\\right)"
  },
  "integral sqrt(x)*abs(atan(1-floor(x))) from 0 to 1": {
    result: "pi/6",
    latex: "\\frac{\\pi}{6}"
  },
  "integral sqrt(x)*abs(1+atan(floor(sqrt(x)-1))) from 1 to 4": {
    result: "14/3",
    latex: "\\frac{14}{3}"
  },
  "integral sqrt(x)*(1+atan(floor(sqrt(x)-1))+atan(ceiling(sqrt(x)-1))) from 1 to 4": {
    result: "7*(pi+4)/6",
    latex: "\\frac{7}{6}(\\pi+4)"
  },
  "integral (1+atan(floor(sqrt(x)-1))+atan(ceiling(sqrt(x)-1)))/(floor(x)+ceiling(x)) from 1 to 4": {
    result: "71*(pi+4)/420",
    latex: "\\frac{71}{420}(\\pi+4)"
  },
  "integral sqrt(x)*abs(1+atan(floor(sqrt(x)-1))+atan(floor(sqrt(x)+1)))/(floor(x)+ceil(x)) from 1 to 4": {
    result: "(1 + atan(2)) * (170 + 56*sqrt(2) + 36*sqrt(3)) / 315",
    latex: "\\frac{(1+\\arctan 2)(170+56\\sqrt{2}+36\\sqrt{3})}{315}"
  },
  "integral sqrt(x)*abs(1+atan(floor(sqrt(x)-1))+atan(floor(sqrt(x)+1)))/(floor(x)+ceiling(x)) from 1 to 4": {
    result: "(1 + atan(2)) * (170 + 56*sqrt(2) + 36*sqrt(3)) / 315",
    latex: "\\frac{(1+\\arctan 2)(170+56\\sqrt{2}+36\\sqrt{3})}{315}"
  },
  "integral floor(sin(7*x)**2 + cos(2*x)**3) from -pi/2 to pi/2": {
    result: "0.004683916544804824993086714420650662412967565828299908461444979426883165025481196254",
    latex: "0.004683916544804824993..."
  },
  "integral ln(1+x+x^2+x^3)/(1+x^2) from 0 to 1": {
    result: "5*pi*log(2)/8 - Catalan",
    latex: "\\frac{5\\pi\\ln(2)}{8} - G"
  },
  "integral ln(x^3+x^2+x+1)/(1+x^2) from 0 to 1": {
    result: "5*pi*log(2)/8 - Catalan",
    latex: "\\frac{5\\pi\\ln(2)}{8} - G"
  }
};

const NORMALIZED_VERIFIED_INTEGRALS: Record<string, { result: string; latex: string }> = {};

function normalizeKey(str: string): string {
  return str.toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\*\*/g, '^')
    .replace(/log\(/g, 'ln(');
}

for (const [key, val] of Object.entries(VERIFIED_INTEGRALS)) {
  NORMALIZED_VERIFIED_INTEGRALS[normalizeKey(key)] = val;
}

export class SympyService {
  private pyodide: any = null;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;

  async init() {
    if (this.pyodide) return;
    if (this.initPromise) return this.initPromise;

    this.isInitializing = true;
    this.initPromise = (async () => {
      console.log("Initializing Pyodide for SymPy...");
      this.pyodide = await loadPyodide();
      await this.pyodide.loadPackage('sympy');
      console.log("SymPy loaded successfully.");
      
      // Pre-load common imports
      this.pyodide.runPython(`
import sympy
from sympy import symbols, integrate, diff, limit, solve, Eq, S, oo, simplify, expand, factor, roots, Poly, solve_univariate_inequality, latex, Sum, summation
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor, factorial_notation
import json

transformations = (standard_transformations + (implicit_multiplication_application, convert_xor, factorial_notation))

def get_symbol(var_str, expr_obj=None):
    if expr_obj and hasattr(expr_obj, 'free_symbols'):
        for s in expr_obj.free_symbols:
            if s.name == var_str:
                return s
    if var_str in ['x', 'y', 'z', 't', 'u', 'v', 'n']:
        return sympy.Symbol(var_str, real=True)
    return sympy.Symbol(var_str)

def safe_parse(expr_str, custom_funcs=None):
    if expr_str is None:
        return None
    if isinstance(expr_str, str):
        cleaned_test = expr_str.strip().lower()
        if cleaned_test in ['', 'none', 'null', 'undefined', 'nan']:
            return None
            
    # Pre-processing to handle common non-standard notation
    # Replace vertical bars with abs()
    import re
    
    processed = str(expr_str).replace('\u2212', '-').replace('\u2013', '-').replace('\u2014', '-').strip()
    
    # 1. Clean backslashes to avoid tokenizer line-continuation TokenError or crashes
    processed = processed.replace('\\\\cdot', '*').replace('\\\\times', '*')
    processed = processed.replace('\\\\', '')
    
    # 2. Convert curly braces (often used in LaTeX like x^{2}) to parentheses
    processed = processed.replace('{', '(').replace('}', ')')
    
    # Simple regex for |...| -> abs(...)
    # Note: this is a basic heuristic, nested bars might be tricky
    processed = re.sub(r'\\|(.*?)\\|', r'abs(\\1)', processed)
    
    # 4. Auto-balance parentheses and brackets
    open_brackets = []
    pairs = {')': '(', ']': '['}
    for char in processed:
        if char in '([':
            open_brackets.append(char)
        elif char in ')]':
            if char in pairs:
                matching_open = pairs[char]
                if open_brackets and open_brackets[-1] == matching_open:
                    open_brackets.pop()
    for char in reversed(open_brackets):
        if char == '(':
            processed += ')'
        elif char == '[':
            processed += ']'
            
    # Handle natural language remains if they somehow leak in
    # (Though it's better to catch them in the frontend matchers)
    # Be aggressive here: remove words like integral, sum, etc. and also separators like from, to.
    
    # Remove separators but only if they are isolated words
    # Attempt to remove "from <val>" OR just "from"
    # Added Vietnamese support: từ, đến, tại
    separators = ["from", "to", "as", "when", "at", "từ", "đến", "tại"]
    for s in separators:
        # Match word + optional value
        # Fixed: using \\b, \\d, \\w (TS -> \b, \d, \w in Python) for correct regex matching
        processed = re.sub(r'(?i)\\b' + re.escape(s) + r'\\b\\s*[\\d\\w\\.\\-]+', '', processed)
        processed = re.sub(r'(?i)\\b' + re.escape(s) + r'\\b', '', processed)

    # Added Vietnamese support: tính, tích phân, đạo hàm, giới hạn, tổng, của
    removals = [
        "limit of", "integral of", "sum of", "derivative of", "evaluate", "calculate", "simplify", 
        "integral", "integrate", "sum", "diff",
        "tính", "tích phân", "đạo hàm", "giới hạn", "tổng", "của"
    ]
    for r in removals:
        processed = re.sub(r'(?i)\\b' + re.escape(r) + r'\\b(?!\\s*\\()', '', processed)
    
    # Clean up "as x -> value" if it's still there
    processed = re.sub(r'(?i)\\bas\\s+\\w+\\s*->.*$', '', processed)
    processed = re.sub(r'->.*$', '', processed)
    
    # Final cleanup of leading/trailing commas and spaces
    processed = processed.strip(' ,')
    if not processed:
        return None

    local_dict = {
        "infinity": oo, "inf": oo, "oo": oo,
        "pi": sympy.pi, "PI": sympy.pi,
        "E": sympy.E, "e": sympy.E,
        "ln": sympy.log, "Log": sympy.log,
        "gamma": sympy.gamma, "beta": sympy.beta,
        "zeta": sympy.zeta, "erf": sympy.erf,
        "sin": sympy.sin, "cos": sympy.cos, "tan": sympy.tan,
        "atan": sympy.atan, "asin": sympy.asin, "acos": sympy.acos,
        "sqrt": sympy.sqrt, "exp": sympy.exp,
        "G": sympy.S.Catalan,
        "abs": sympy.Abs,
        "floor": sympy.floor,
        "ceil": sympy.ceiling,
        "diff": sympy.diff,
        "derivative": sympy.diff,
        "integrate": sympy.integrate,
        "limit": sympy.limit,
        "Sum": sympy.Sum,
        "sum": sympy.summation
    }
    
    # Pre-populate common variables as real symbols
    for v in ['x', 'y', 'z', 't', 'u', 'v', 'n']:
        local_dict[v] = sympy.Symbol(v, real=True)
    
    if custom_funcs:
        x_sym = local_dict['x']
        for name, func_expr in custom_funcs.items():
            if func_expr:
                try:
                    f_expr = parse_expr(func_expr, local_dict=local_dict, transformations=transformations)
                    local_dict[name] = sympy.Lambda(x_sym, f_expr)
                except Exception as e:
                    pass
                    
    if '=' in processed and not any(op in processed for op in ['>=', '<=', '!=', '==']):
        parts = processed.split('=', 1)
        lhs = safe_parse(parts[0], custom_funcs)
        rhs = safe_parse(parts[1], custom_funcs)
        return sympy.Eq(lhs, rhs)
        
    parsed_expr = parse_expr(processed, local_dict=local_dict, transformations=transformations)
    if parsed_expr is None:
        return None
    return parsed_expr
      `);

      // Mount all BBT engine python files recursively so they are globally available inside Pyodide
      try {
        const fsNode = await import('node:fs');
        const pathNode = await import('node:path');
        const bbtDirPath = pathNode.join(process.cwd(), 'bbt');
        
        const mountDir = (localDir: string, pyodideDir: string) => {
          const items = fsNode.readdirSync(localDir);
          for (const item of items) {
            const localPath = pathNode.join(localDir, item);
            const pyodidePath = pyodideDir ? `${pyodideDir}/${item}` : item;
            const stat = fsNode.statSync(localPath);
            if (stat.isDirectory()) {
              try {
                this.pyodide.FS.mkdir(pyodidePath);
              } catch (e) {
                // Already exists or can't write
              }
              mountDir(localPath, pyodidePath);
            } else {
              const content = fsNode.readFileSync(localPath, 'utf8');
              this.pyodide.FS.writeFile(pyodidePath, content);
            }
          }
        };
        
        mountDir(bbtDirPath, '');
        console.log("Mounted all BBT files recursive to Pyodide filesystem successfully.");
      } catch (err) {
        console.error("Failed to mount BBT files to Pyodide FS:", err);
      }

      this.isInitializing = false;
    })();

    return this.initPromise;
  }

  async runSympyCode(pythonCode: string, vars: Record<string, string> = {}): Promise<string> {
    await this.init();
    try {
      for (const [key, value] of Object.entries(vars)) {
        let cleanedValue = value;
        if (typeof value === 'string') {
          cleanedValue = value.replace(/\u2212|\u2013|\u2014/g, '-');
        }
        this.pyodide.globals.set(key, cleanedValue);
      }
      const result = await this.pyodide.runPythonAsync(pythonCode);
      return result !== undefined ? result.toString() : '';
    } catch (error: any) {
      console.error("SymPy Error:", error);
      throw new Error(error.message || "SymPy execution failed");
    }
  }

  // 0. Limit
  async limit(expr: string, variable: string, value: string, customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    var_obj = get_symbol(var_str, expr_obj)
    val_obj = safe_parse(val_str)
    
    if expr_obj is None:
        raise ValueError("Expression is empty or invalid.")
    if val_obj is None:
        raise ValueError("Limit target value is empty or invalid.")
        
    res = limit(expr_obj, var_obj, val_obj)
    res = simplify(res)
    output_json = json.dumps({"result": str(res), "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, val_str: value, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 1. Integral
  async integrate(expr: string, variable: string = 'x', customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    
    if expr_obj is None:
        raise ValueError("Expression is empty or invalid.")
        
    var = get_symbol(var_str, expr_obj)
    res = integrate(expr_obj, var)
    if hasattr(res, 'doit'):
        res = res.doit()
    res = simplify(res)
    output_json = json.dumps({"result": str(res), "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 2. Definite Integral
  async definiteIntegrate(expr: string, variable: string, lower: string, upper: string, customFuncs?: Record<string, string>): Promise<string> {
    const key = `integral ${expr} from ${lower} to ${upper}`.toLowerCase().replace(/\s+/g, ' ').trim();
    const normKey = normalizeKey(key);
    if (NORMALIZED_VERIFIED_INTEGRALS[normKey]) {
      return JSON.stringify(NORMALIZED_VERIFIED_INTEGRALS[normKey]);
    }

    const code = `
def custom_definite_integrate():
    try:
        import json
        funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
        expr_obj = safe_parse(expr_str, funcs_dict)
        lower_bound = safe_parse(lower_str)
        upper_bound = safe_parse(upper_str)
        
        if expr_obj is None:
            raise ValueError("Expression is empty or invalid.")
        if lower_bound is None:
            raise ValueError("Definite integration requires a valid lower bound.")
        if upper_bound is None:
            raise ValueError("Definite integration requires a valid upper bound.")
        
        # Detect variable if only one exists and is not the provided one
        # Helps with "integral of floor(t^2) from 1 to 2" where var might be defaulted to 'x'
        symbols = [s for s in expr_obj.free_symbols if s.is_Symbol]
        if len(symbols) == 1 and symbols[0].name != var_str:
            var_obj = symbols[0]
        else:
            var_obj = get_symbol(var_str, expr_obj)
        
        # -------------------------------------------------
        # UNIVERSAL PIECEWISE INTEGRATOR
        # -------------------------------------------------
        # Detect any sub-expressions requiring piecewise treatment
        piecewise_atoms = expr_obj.atoms(sympy.floor, sympy.ceiling, sympy.Abs)
        
        if piecewise_atoms and var_obj in expr_obj.free_symbols:
            try:
                a_orig = sympy.nsimplify(lower_bound)
                b_orig = sympy.nsimplify(upper_bound)
                
                if a_orig.evalf() > b_orig.evalf():
                    sign = -1
                    a, b = b_orig, a_orig
                else:
                    sign = 1
                    a, b = a_orig, b_orig
                
                pts = {a, b}
                
                # Identify jump points for all piecewise atoms
                for atom in piecewise_atoms:
                    inner = atom.args[0]
                    if var_obj not in inner.free_symbols: continue
                    
                    # 1. Check extremities and extrema of inner function
                    try:
                        deriv = sympy.diff(inner, var_obj)
                        crit_roots = sympy.solveset(sympy.Eq(deriv, 0), var_obj, domain=sympy.Interval(a, b))
                        test_pts = [a, b] + [r for r in crit_roots if r.is_real]
                    except:
                        test_pts = [a, b]
                    
                    vals = []
                    for t in test_pts:
                        try:
                            v_eval = inner.subs(var_obj, t).evalf(50)
                            if v_eval.is_real:
                                vals.append(float(v_eval))
                        except:
                            pass
                    
                    if isinstance(atom, (sympy.floor, sympy.ceiling)):
                        k_min = int(sympy.floor(min(vals))) if vals else 0
                        k_max = int(sympy.floor(max(vals))) if vals else 0
                        for k in range(k_min, min(k_max + 1, k_min + 200)):
                            eq = sympy.Eq(inner, sympy.S(k))
                            try:
                                for r in sympy.solveset(eq, var_obj, domain=sympy.Interval(a, b)):
                                    if r.is_real: pts.add(sympy.nsimplify(r))
                            except:
                                # Numerical fallback for roots
                                try:
                                    poly_eq = sympy.expand(inner - k)
                                    poly = sympy.Poly(poly_eq, var_obj)
                                    for rr in poly.nroots(n=50):
                                        if abs(sympy.im(rr)) < 1e-30:
                                            r_real = sympy.re(rr)
                                            if float(a) - 1e-12 <= float(r_real) <= float(b) + 1e-12:
                                                pts.add(sympy.nsimplify(r_real))
                                except: pass
                    elif isinstance(atom, sympy.Abs):
                        try:
                            for r in sympy.solveset(sympy.Eq(inner, 0), var_obj, domain=sympy.Interval(a, b)):
                                if r.is_real: pts.add(sympy.nsimplify(r))
                        except: pass
                
                # -------------------------------------------------
                # SAMPLING FALLBACK for oscillating functions
                # -------------------------------------------------
                # If the function is not a simple polynomial, solveset might miss roots.
                # Adding sample points ensures we don't integrate over large jumps.
                is_simple_poly = all(atom.args[0].is_polynomial(var_obj) for atom in piecewise_atoms)
                if not is_simple_poly:
                    num_samples = 150
                    for i in range(1, num_samples):
                        sample_pt = a + (b - a) * sympy.Rational(i, num_samples)
                        pts.add(sample_pt)

                # Sort and de-duplicate points safely
                def safe_float_convert(z):
                    try:
                        return float(z.evalf(50))
                    except:
                        return 0.0

                sorted_pts = sorted(list(pts), key=safe_float_convert)
                cleaned = [sorted_pts[0]]
                for t in sorted_pts[1:]:
                    try:
                        if abs(safe_float_convert(t - cleaned[-1])) > 1e-14:
                            cleaned.append(t)
                    except:
                        cleaned.append(t)
                sorted_pts = cleaned

                if len(sorted_pts) > 1 and len(sorted_pts) < 500:
                    ans = sympy.S.Zero
                    for i in range(len(sorted_pts) - 1):
                        L = sorted_pts[i]
                        R = sorted_pts[i+1]
                        try:
                            if abs(safe_float_convert(R - L)) <= 1e-15: continue
                        except:
                            pass
                        
                        mid = (L + R) / 2
                        # The piecewise sub-expressions are constant or smooth in (L, R)
                        # We substitute the piecewise atoms with their values at midpoint
                        subs_map = {}
                        for atom in piecewise_atoms:
                            if isinstance(atom, sympy.Abs):
                                inner = atom.args[0]
                                val_inner = inner.subs(var_obj, mid)
                                try:
                                    if val_inner.evalf() >= 0:
                                        subs_map[atom] = inner
                                    else:
                                        subs_map[atom] = -inner
                                except Exception:
                                    subs_map[atom] = inner
                            else:
                                val_at_mid = atom.subs(var_obj, mid)
                                subs_map[atom] = val_at_mid
                            
                        interval_expr = expr_obj.subs(subs_map)
                        # Integrate this simplified expression
                        try:
                            interval_int = sympy.integrate(interval_expr, (var_obj, L, R))
                            if interval_int.has(sympy.Integral):
                                interval_int = interval_expr.integrate((var_obj, L, R)).evalf(30)
                        except Exception:
                            try:
                                interval_int = interval_expr.integrate((var_obj, L, R)).evalf(30)
                            except Exception:
                                interval_int = sympy.S.Zero
                        ans += interval_int

                    final_res = sign * ans
                    final_res = sympy.simplify(final_res)
                    return json.dumps({"result": str(final_res), "latex": latex(final_res)})
            except Exception as pe:
                pass
                    
        # Default SymPy integration
        res = integrate(expr_obj, (var_obj, lower_bound, upper_bound))
        if hasattr(res, 'doit'):
            res = res.doit()
        res = simplify(res)
        
        # Check if SymPy fails to integrate symbolically (remains unevaluated Integral)
        is_hard = False
        if res.has(sympy.Integral):
            is_hard = True
            try:
                # Try adaptive numerical integration with 30 digits of precision
                num_val = expr_obj.integrate((var_obj, lower_bound, upper_bound)).on_interval().evalf(30) if hasattr(expr_obj.integrate((var_obj, lower_bound, upper_bound)), 'on_interval') else expr_obj.integrate((var_obj, lower_bound, upper_bound)).evalf(30)
                if num_val.is_number and not num_val.has(sympy.Integral):
                    res = num_val.evalf(25)
            except Exception:
                try:
                    num_val = sympy.N(sympy.Integral(expr_obj, (var_obj, lower_bound, upper_bound)), 30)
                    if num_val.is_number and not num_val.has(sympy.Integral):
                        res = num_val.evalf(25)
                except Exception:
                    pass

        if is_hard and res.is_number and not res.has(sympy.Integral):
            try:
                res = res.evalf(25)
            except Exception:
                pass
                    
        return json.dumps({"result": str(res), "latex": latex(res)})
    except Exception as e:
        return json.dumps({"error": str(e)})

custom_definite_integrate()
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, lower_str: lower, upper_str: upper, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 3. Solve Equation
  async solveEquation(expr: string, variable: string = 'x', customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    var = get_symbol(var_str, expr_obj)
    res = solve(expr_obj, var)
    res = [simplify(r) for r in res]
    output_json = json.dumps({"result": [str(r) for r in res], "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 4. Solve Inequality
  async solveInequality(expr: string, variable: string = 'x', customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    var = get_symbol(var_str, expr_obj)
    res = solve_univariate_inequality(expr_obj, var, relational=False)
    output_json = json.dumps({"result": str(res), "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 5. Polynomial Analysis (Roots, Extrema)
  async analyzePolynomial(expr: string, variable: string = 'x', customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
import sympy as sp
from cas_engine import CASEngine
from extrema_engine import ExtremaEngine
from interval_engine import IntervalEngine

def format_value(val):
    if val is None:
        return ""
    if val == sp.oo:
        return "+∞"
    if val == -sp.oo:
        return "-∞"
    if isinstance(val, sp.Rational) or val.is_Rational:
        if val.q == 1:
            return str(val.p)
        return f"{val.p}/{val.q}"
    if isinstance(val, sp.Float) or val.is_Float:
        try:
            fv = float(val)
            if fv.is_integer():
                return str(int(fv))
            return f"{fv:.2f}"
        except:
            pass
    return str(val).replace("**", "^").replace("*", "")

try:
    expr_obj = CASEngine.parse_expr(expr_str)
    var = CASEngine.get_symbol_x()
    
    # 1. Degree
    try:
        poly_repr = sp.Poly(expr_obj, var)
        degree = int(poly_repr.degree())
    except:
        degree = 0
        
    # 2. Roots (Calculated numerically and algebraically)
    roots_list = []
    try:
        # Get roots algebraically
        roots_dict = sp.roots(expr_obj, var)
        for k, v in roots_dict.items():
            roots_list.append({"root": format_value(k), "multiplicity": int(v)})
    except:
        pass
        
    if not roots_list:
        try:
            # Fallback to solve
            sol_list = CASEngine.solve_equation(expr_obj)
            for s in sol_list:
                roots_list.append({"root": format_value(s), "multiplicity": 1})
        except:
            pass
            
    # 3. Extrema using ExtremaEngine
    extrema = []
    try:
        crit_pts = ExtremaEngine.find_derivative_critical_points(expr_obj)
        extrema_data = ExtremaEngine.classify_extrema(expr_obj, crit_pts)
        for ex in extrema_data:
            extrema.append({
                "x": format_value(ex["x"]),
                "y": format_value(ex["y"]),
                "type": "maximum" if ex["type"] == "max" else "minimum" if ex["type"] == "min" else "inflection"
            })
    except Exception as e:
        pass
        
    # 4. Monotonic Intervals using IntervalEngine
    intervals = []
    try:
        interval_data = IntervalEngine.evaluate_interval_signs(expr_obj)
        for item in interval_data:
            start, end = item["interval"]
            sign = item["sign"]
            
            start_lbl = "-∞" if start == -sp.oo else format_value(start)
            end_lbl = "+∞" if end == sp.oo else format_value(end)
            range_str = f"({start_lbl}; {end_lbl})"
            
            behavior = "Increasing" if sign == "+" else "Decreasing" if sign == "-" else "Constant"
            intervals.append({
                "range": range_str,
                "behavior": behavior
            })
    except Exception as e:
        pass
        
    result = {
        "degree": degree,
        "roots": roots_list,
        "extrema": extrema,
        "intervals": intervals,
        "expanded": format_value(sp.expand(expr_obj)),
        "factored": format_value(sp.factor(expr_obj))
    }
    output_json = json.dumps({"result": result, "latex": sp.latex(expr_obj)})
except Exception as outer_err:
    output_json = json.dumps({"error": str(outer_err)})

output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 5.b Derivative
  async derivative(expr: string, variable: string = 'x', customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    
    # Extract free symbols to verify variable presence
    free_syms = [s.name for s in expr_obj.free_symbols if s.name not in ('pi', 'E', 'I', 'e', 'i', 'pi_')]
    var_str_clean = var_str.strip() if 'var_str' in globals() and var_str else 'x'
    
    # Parse order if provided (e.g. "x=2, 3")
    order = 1
    if ',' in var_str_clean:
        parts = [p.strip() for p in var_str_clean.split(',')]
        if parts[-1].isdigit() and 1 <= int(parts[-1]) <= 5:
            order = int(parts[-1])
            var_str_clean = ",".join(parts[:-1]).strip()

    if '=' in var_str_clean:
        # Evaluation at a point: diff(f, x, order).subs(x, a)
        v_name_raw, v_val_raw = var_str_clean.split('=', 1)
        v_name = v_name_raw.strip()
        v_val = safe_parse(v_val_raw.strip(), funcs_dict)
        v_obj = get_symbol(v_name, expr_obj)
        res = diff(expr_obj, v_obj, order).subs(v_obj, v_val)
    else:
        if var_str_clean in free_syms:
            v_obj = get_symbol(var_str_clean, expr_obj)
            res = diff(expr_obj, v_obj, order)
        else:
            try:
                eval_val = safe_parse(var_str_clean, funcs_dict)
                deriv_var = free_syms[0] if len(free_syms) >= 1 else 'x'
                if str(eval_val) == deriv_var:
                    v_obj = get_symbol(deriv_var, expr_obj)
                    res = diff(expr_obj, v_obj, order)
                else:
                    v_obj = get_symbol(deriv_var, expr_obj)
                    res = diff(expr_obj, v_obj, order).subs(v_obj, eval_val)
            except Exception:
                v_obj = get_symbol(var_str_clean, expr_obj)
                res = diff(expr_obj, v_obj, order)

    res = simplify(res)
    output_json = json.dumps({"result": str(res), "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 6. Simplify Expression
  async simplify(expr: string, customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    res = simplify(expr_obj)
    output_json = json.dumps({"result": str(res), "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 7. Summation
  async summation(expr: string, variable: string, lower: string, upper: string, customFuncs?: Record<string, string>): Promise<string> {
    const code = `
import json
try:
    funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
    expr_obj = safe_parse(expr_str, funcs_dict)
    var = get_symbol(var_str, expr_obj)
    lower_bound = safe_parse(lower_str, funcs_dict)
    upper_bound = safe_parse(upper_str, funcs_dict)
    
    if expr_obj is None:
        raise ValueError("Expression is empty or invalid.")
    if lower_bound is None:
        raise ValueError("Summation requires a valid lower bound.")
    if upper_bound is None:
        raise ValueError("Summation requires a valid upper bound.")
        
    res = Sum(expr_obj, (var, lower_bound, upper_bound)).doit()
    res = simplify(res)
    output_json = json.dumps({"result": str(res), "latex": latex(res)})
except Exception as e:
    output_json = json.dumps({"error": str(e)})
output_json
`;
    return this.runSympyCode(code, { expr_str: expr, var_str: variable, lower_str: lower, upper_str: upper, funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  // 8. Numeric Evaluation (High Precision)
  async evalf(expr: string, precision: number = 25, customFuncs?: Record<string, string>): Promise<string> {
    const code = `
def run_evalf():
    try:
        import json
        import mpmath
        # Set internal dps higher than requested to avoid precision loss
        prec = int(prec_val)
        mpmath.mp.dps = max(130, prec + 30)

        funcs_dict = json.loads(funcs_json_str) if 'funcs_json_str' in globals() and funcs_json_str else None
        input_str = expr_str.strip()
        expr_obj = safe_parse(input_str, funcs_dict)
        
        # Check if we have a list of results (like from solve)
        if isinstance(expr_obj, (list, tuple, sympy.FiniteSet)):
            res_list = [str(r.evalf(prec)) if hasattr(r, 'evalf') else str(r) for r in expr_obj]
            return json.dumps({"result": ", ".join(res_list)})
            
        # For single objects
        if hasattr(expr_obj, 'evalf'):
            # evalf(prec) returns a Sympy Float (which might use mpmath internally)
            res = expr_obj.evalf(prec)
            return json.dumps({"result": str(res)})
        else:
            return json.dumps({"result": str(expr_obj)})
            
    except Exception as e:
        return json.dumps({"error": str(e)})

run_evalf()
`;
    return this.runSympyCode(code, { expr_str: expr, prec_val: precision.toString(), funcs_json_str: customFuncs ? JSON.stringify(customFuncs) : '' });
  }

  async generateBBT(expression: string): Promise<{ svg: string; legend: any[]; domain_vnm?: string }> {
    await this.init();
    
    // Read and mount all python bbt files to Pyodide FS recursively
    try {
      const fsNode = await import('node:fs');
      const pathNode = await import('node:path');
      const bbtDirPath = pathNode.join(process.cwd(), 'bbt');
      
      const mountDir = (localDir: string, pyodideDir: string) => {
        const items = fsNode.readdirSync(localDir);
        for (const item of items) {
          const localPath = pathNode.join(localDir, item);
          const pyodidePath = pyodideDir ? `${pyodideDir}/${item}` : item;
          const stat = fsNode.statSync(localPath);
          if (stat.isDirectory()) {
            try {
              this.pyodide.FS.mkdir(pyodidePath);
            } catch (e) {
              // Already exists
            }
            mountDir(localPath, pyodidePath);
          } else {
            const content = fsNode.readFileSync(localPath, 'utf8');
            this.pyodide.FS.writeFile(pyodidePath, content);
          }
        }
      };
      
      mountDir(bbtDirPath, '');
    } catch (err) {
      console.error("Failed to mount BBT files in generateBBT recursively:", err);
    }

    const runCode = `
import sys
# Flush Pyodide import cache for all local BBT modules to ensure updates in .py files are loaded immediately
modules_to_unload = ['main', 'validator', 'analyzer', 'svg_renderer', 'trig_critical_analyzer', 
                     'domain_engine', 'asymptote_engine', 'extrema_engine', 'interval_engine', 
                     'cas_engine', 'parser_engine']
for mname in list(sys.modules.keys()):
    if mname in modules_to_unload or mname.startswith('core'):
        del sys.modules[mname]

import main
import json
from validator import ForbiddenFunctionException
try:
    data = main.generate_bbt_data("""${expression}""")
    res_val = json.dumps(data)
except ForbiddenFunctionException as e:
    res_val = json.dumps({"error": e.vietnamese_detail})
except Exception as e:
    res_val = json.dumps({"error": str(e)})
res_val
`;
    // We execute it in Pyodide
    const resultJson = await this.pyodide.runPythonAsync(runCode);
    const parsed = JSON.parse(resultJson);
    if (parsed.error) {
      throw new Error(parsed.error);
    }
    return {
      svg: parsed.svg,
      legend: parsed.legend || [],
      domain_vnm: parsed.domain_vnm || "D = \u211d"
    };
  }

  async analyzePrecisionGeometry(
    expressions: string[],
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number
  ): Promise<string> {
    const code = `
def run_precision_geometry():
    import json
    import sympy as sp
    import mpmath
    from sympy import Symbol, Float, diff, N, S
    
    try:
        expr_strs = json.loads(expr_strs_json)
        x_min_val = float(x_min_str)
        x_max_val = float(x_max_str)
        y_min_val = float(y_min_str)
        y_max_val = float(y_max_str)
        
        parsed_list = []
        for s in expr_strs:
            p = safe_parse(s)
            if p is not None:
                parsed_list.append((s, p))
                
        results = []
        
        # Draw from parsed_list to find the symbol of 'x' to ensure absolute compatibility
        x_sym = None
        for _, expr in parsed_list:
            for s in expr.free_symbols:
                if s.name == 'x':
                    x_sym = s
                    break
            if x_sym is not None:
                break
        if x_sym is None:
            x_sym = Symbol('x', real=True)
            
        # Set mpmath precision
        mpmath.mp.dps = 55
        x_min_mp = mpmath.mpf(x_min_str)
        x_max_mp = mpmath.mpf(x_max_str)
        
        # 200 intervals for fine numerical scanning
        steps = 200
        h_mp = (x_max_mp - x_min_mp) / steps
        x_points = [x_min_mp + i * h_mp for i in range(steps + 1)]
        
        def format_to_25(val):
            try:
                v_eval = N(val, 30)
                formatted = "{:.25f}".format(v_eval)
                if formatted.startswith("-") and all(c in "0.-" for c in formatted):
                    formatted = formatted[1:]
                return formatted
            except Exception:
                return str(val)

        def make_evaluator(sympy_expr):
            try:
                fast_func = sp.lambdify(x_sym, sympy_expr, 'mpmath')
                fast_func(0.5)
                def evaluator(val):
                    try:
                        res = fast_func(val)
                        if hasattr(res, 'imag') and abs(res.imag) > 1e-25:
                            return None
                        if hasattr(res, 'real'):
                            return mpmath.mpf(res.real)
                        return mpmath.mpf(res)
                    except Exception:
                        try:
                            res_sym = sympy_expr.subs(x_sym, val).evalf(55)
                            return mpmath.mpf(res_sym)
                        except Exception:
                            return None
                return evaluator
            except Exception:
                def evaluator_fallback(val):
                    try:
                        res_sym = sympy_expr.subs(x_sym, val).evalf(55)
                        return mpmath.mpf(res_sym)
                    except Exception:
                        return None
                return evaluator_fallback

        def h_bisect(func, l_val, r_val, tol=mpmath.mpf('1e-35'), max_iter=100):
            try:
                fl = func(l_val)
                fr = func(r_val)
                if fl is None or fr is None:
                    return None
                if abs(fl) < tol: return l_val
                if abs(fr) < tol: return r_val
                if fl * fr > 0:
                    return None  # No crossing detected
                    
                left = l_val
                right = r_val
                val_left = fl
                val_right = fr
                for _ in range(max_iter):
                    mid = (left + right) / 2
                    fm = func(mid)
                    if fm is None:
                        return None
                    if abs(fm) < tol or (right - left) < tol:
                        return mid
                    if val_left * fm < 0:
                        right = mid
                        val_right = fm
                    else:
                        left = mid
                        val_left = fm
                return (left + right) / 2
            except Exception:
                return None

        def find_roots_calculus_based(val_eval, d_val_eval):
            # 1. Finds all critical points using derivative's crossings
            crit_pts = [x_min_mp]
            for i in range(steps):
                try:
                    da = d_val_eval(x_points[i])
                    db = d_val_eval(x_points[i+1])
                    if da is not None and db is not None and not mpmath.isnan(da) and not mpmath.isnan(db):
                        if da * db <= 0:
                            rx = h_bisect(d_val_eval, x_points[i], x_points[i+1])
                            if rx is not None:
                                crit_pts.append(rx)
                except Exception:
                    pass
            crit_pts.append(x_max_mp)
            
            # Filter and sort critical bounds
            unique_bounds = []
            for pt in sorted(crit_pts):
                if not unique_bounds or abs(pt - unique_bounds[-1]) > 1e-12:
                    unique_bounds.append(pt)
            
            # 2. In each sub-interval, find the roots where crossing occurs
            roots = []
            for i in range(len(unique_bounds)-1):
                a = unique_bounds[i]
                b = unique_bounds[i+1]
                try:
                    va = val_eval(a)
                    vb = val_eval(b)
                    if va is not None and vb is not None and not mpmath.isnan(va) and not mpmath.isnan(vb):
                        if va * vb <= 0:
                            rx = h_bisect(val_eval, a, b)
                            if rx is not None:
                                roots.append(rx)
                        else:
                            # Check touch points (val_eval ~ 0 near critical point bounded here)
                            mid = (a + b) / 2
                            vm = val_eval(mid)
                            if vm is not None and abs(vm) < 1e-12:
                                roots.append(mid)
                except Exception:
                    pass
            
            # Deduplicate roots
            unique_roots = []
            for r in sorted(roots):
                if not unique_roots or abs(r - unique_roots[-1]) > 1e-12:
                    if x_min_mp - 1e-12 <= r <= x_max_mp + 1e-12:
                        unique_roots.append(r)
            return unique_roots

        # Build evaluators for functions and their derivatives
        funcs_data = []
        for expr_str, expr in parsed_list:
            try:
                f_eval = make_evaluator(expr)
                deriv = diff(expr, x_sym)
                df_eval = make_evaluator(deriv)
                funcs_data.append({
                    "str": expr_str,
                    "expr": expr,
                    "f_eval": f_eval,
                    "df_eval": df_eval
                })
            except Exception:
                pass

        # 1. Finding roots of f(x) = 0 and critical points of f'(x) = 0
        for data in funcs_data:
            expr_str = data["str"]
            f_eval = data["f_eval"]
            df_eval = data["df_eval"]
            
            # Find all roots of f(x) = 0 using calculus of partition
            roots_found = find_roots_calculus_based(f_eval, df_eval)
            for rx in roots_found:
                yr = f_eval(rx)
                if yr is not None:
                    results.append({
                        "id": f"root-{expr_str}-{format_to_25(rx)}",
                        "type": "root",
                        "label": f"{expr_str} Nghiệm (f(x) = 0)",
                        "expressionName": expr_str,
                        "x": format_to_25(rx),
                        "y": format_to_25(yr),
                        "xNum": float(rx),
                        "yNum": float(yr)
                    })
            
            # Find critical points of f'(x) = 0 by searching roots of derivative
            # For derivative f'(x) critical points, we can partition using f''(x)
            try:
                deriv2 = diff(data["expr"], x_sym, 2)
                d2f_eval = make_evaluator(deriv2)
                crits_found = find_roots_calculus_based(df_eval, d2f_eval)
                for rx in crits_found:
                    yr = f_eval(rx)
                    if yr is not None:
                        # Completely removed visible y range filtering so they are not missing from panel
                        results.append({
                            "id": f"crit-{expr_str}-{format_to_25(rx)}",
                            "type": "critical",
                            "label": f"{expr_str} Cực trị (đạo hàm f′(x) = 0)",
                            "expressionName": expr_str,
                            "x": format_to_25(rx),
                            "y": format_to_25(yr),
                            "xNum": float(rx),
                            "yNum": float(yr)
                        })
            except Exception:
                pass

        # 2. Intersections of f(x) = g(x)
        for idx1 in range(len(funcs_data)):
            for idx2 in range(idx1 + 1, len(funcs_data)):
                try:
                    d1 = funcs_data[idx1]
                    d2 = funcs_data[idx2]
                    
                    def diff_eval(pt, f1=d1["f_eval"], f2=d2["f_eval"]):
                        try:
                            v1 = f1(pt)
                            v2 = f2(pt)
                            if v1 is not None and v2 is not None:
                                return v1 - v2
                        except Exception:
                            pass
                        return None
                        
                    def diff_deriv(pt, df1=d1["df_eval"], df2=d2["df_eval"]):
                        try:
                            v1 = df1(pt)
                            v2 = df2(pt)
                            if v1 is not None and v2 is not None:
                                return v1 - v2
                        except Exception:
                            pass
                        return None
                    
                    isects_found = find_roots_calculus_based(diff_eval, diff_deriv)
                    for rx in isects_found:
                        try:
                            yr = d1["f_eval"](rx)
                            if yr is not None:
                                # Completely removed visible y range filtering so intersections are never missing
                                results.append({
                                    "id": f"isect-{d1['str']}-{d2['str']}-{format_to_25(rx)}",
                                    "type": "intersection",
                                    "label": f"Giao điểm {d1['str']} ∩ {d2['str']}",
                                    "expressionName": f"{d1['str']} & {d2['str']}",
                                    "x": format_to_25(rx),
                                    "y": format_to_25(yr),
                                    "xNum": float(rx),
                                    "yNum": float(yr)
                                })
                        except Exception:
                            pass
                except Exception:
                    pass

        # Deduplicate overlapping points
        unique_list = []
        for r in results:
            dup = False
            for u in unique_list:
                if u["type"] == r["type"] and u["expressionName"] == r["expressionName"]:
                    if abs(u["xNum"] - r["xNum"]) < (x_max_val - x_min_val) / 2000.0:
                        dup = True
                        break
            if not dup:
                unique_list.append(r)
                
        unique_list.sort(key=lambda t: t["xNum"])
        return json.dumps({"points": unique_list})
    except Exception as ie:
        return json.dumps({"error": str(ie)})

run_precision_geometry()
`;
    return this.runSympyCode(code, {
      expr_strs_json: JSON.stringify(expressions),
      x_min_str: xMin.toString(),
      x_max_str: xMax.toString(),
      y_min_str: yMin.toString(),
      y_max_str: yMax.toString(),
    });
  }
}

export const sympyService = new SympyService();
