import { sympyService } from '../src/server/sympyService';

async function run() {
  const code = `
import json
import sympy as sp

a_val = 1
b_val = 1 - 7*sp.I
c_val = -4 + 6*sp.I
d_val = -3 + 18*sp.I

x, y = sp.symbols('x y', real=True)
z = x + sp.I*y
z_conj = x - sp.I*y

expr = a_val * z * z_conj + b_val * z + c_val * z_conj + d_val
real_part = sp.re(expr).simplify()
imag_part = sp.im(expr).simplify()

print(json.dumps({
  "real": str(real_part),
  "imag": str(imag_part)
}))

try:
    solve_res = sp.solve([real_part, imag_part], (x, y), dict=True)
    print("Solve res:", solve_res)
except Exception as e:
    print("Error:", e)
`;
  console.log(await sympyService.runSympyCode(code));
}
run();
