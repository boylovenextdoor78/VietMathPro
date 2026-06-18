import { sympyService } from '../src/server/sympyService';

async function run() {
  const code = `
import sympy as sp

x, y = sp.symbols('x y', real=True)
z = x + sp.I*y
z_conj = x - sp.I*y

eq1 = z*z_conj + (1 - 7*sp.I)*z + (-4 + 6*sp.I)*z_conj - 3 + 18*sp.I
eq2 = z + (1 - 8*sp.I)*z_conj - sp.I

r1 = sp.re(eq1).simplify()
i1 = sp.im(eq1).simplify()

r2 = sp.re(eq2).simplify()
i2 = sp.im(eq2).simplify()

print("Eq2 real part:", r2, "= 0")
print("Eq2 imag part:", i2, "= 0")

sol2 = sp.solve([r2, i2], (x, y))
print("Solution from Eq2 alone:", sol2)

if sol2:
    val1_r = r1.subs(sol2)
    val1_i = i1.subs(sol2)
    print("Substitute into Eq1 real part:", val1_r)
    print("Substitute into Eq1 imag part:", val1_i)
    if val1_r == 0 and val1_i == 0:
        print("=> THIS Z SATISFIES BOTH")
    else:
        print("=> DOES NOT SATISFY EQ 1. System has no solution.")
`;
  console.log(await sympyService.runSympyCode(code));
}
run();
