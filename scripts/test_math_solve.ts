import { sympyService } from '../src/server/sympyService';

async function run() {
  const code = `
import json
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application

trans = (standard_transformations + (implicit_multiplication_application,))
expr_str = "z*conjugate(z) + (1-7*I)*z + (-4+6*I)*conjugate(z) - 3 + 18*I"
eq = sp.Eq(parse_expr(expr_str, transformations=trans), 0)

try:
    res = sp.solve(eq, 'z', dict=True)
    print("Direct solve for z:", res)
except Exception as e:
    print("Direct solve error:", e)

# How about x, y replacing?
z_val = sp.Symbol('z')
x, y = sp.symbols('x y', real=True)
eq2 = eq.subs('z', x + sp.I*y)
# conjugate(z) doesn't replace well unless we use sympy's conj
eq2 = eq.replace(sp.conjugate, lambda arg: sp.conjugate(arg)).subs('z', x + sp.I*y)
print("Subbed:", eq2)

`;
  console.log(await sympyService.runSympyCode(code));
}
run();
