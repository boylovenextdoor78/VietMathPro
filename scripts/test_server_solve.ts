import { sympyService } from '../src/server/sympyService';

async function run() {
  const req = {
    body: {
      type: 'E',
      a: '1',
      b: '1-7i',
      c: '-4+6i',
      d: '-3+18i',
    }
  };

  const code = `
import json
import sympy as sp

def solve_complex():
    try:
        x, y = sp.symbols('x y', real=True)
        z = x + sp.I*y
        z_conj = x - sp.I*y
        
        def s_parse(val_str):
            if not val_str: return 0
            from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
            trans = (standard_transformations + (implicit_multiplication_application,))
            val_str = val_str.replace('i', 'I')
            return parse_expr(val_str, transformations=trans)

        a_val = s_parse("""${req.body.a}""")
        b_val = s_parse("""${req.body.b}""")
        c_val = s_parse("""${req.body.c}""")
        d_val = s_parse("""${req.body.d}""")
        
        eq_type = "${req.body.type}"
        expr = a_val * z * z_conj + b_val * z + c_val * z_conj + d_val
        
        real_part = sp.re(expr).simplify()
        imag_part = sp.im(expr).simplify()
        
        # Determine Locus characteristics for pure type E without Eq2
        locus_data = None
        if eq_type == 'E':
            h = x**2 + y**2
            bx_Re = sp.re((b_val + c_val) * x)
            by_Im = sp.im((b_val - c_val) * sp.I * y)  # Just real expansion
            # Center of the circle logic
            # A(x^2 + y^2) + Kx + Ly + M = 0
            A_co = sp.re(a_val)
            # The simplified circle cartesian form
            real_part_circle = real_part.expand().collect([x, y])
            try:
               xc = real_part_circle.coeff(x)
               yc = real_part_circle.coeff(y)
               # Try extracting A by subs
               A_val = sp.expand(real_part_circle.subs({x:1, y:0}) - xc - real_part_circle.subs({x:0, y:0}))
               M_c = real_part_circle.subs({x:0, y:0})
               if not A_val.is_zero and not a_val.has(sp.I):
                   center_x = -xc / (2*A_val)
                   center_y = -yc / (2*A_val)
                   R_sq = center_x**2 + center_y**2 - M_c/A_val
                   locus_data = {
                       "type": "circle",
                       "center": str(sp.simplify(center_x + sp.I * center_y)),
                       "center_x": str(sp.simplify(center_x)),
                       "center_y": str(sp.simplify(center_y)),
                       "r_sq": str(sp.simplify(R_sq))
                   }
               elif A_val.is_zero:
                   # It's a line: xc*x + yc*y + M_c = 0
                   locus_data = {
                       "type": "line",
                       "xc": str(sp.simplify(xc)),
                       "yc": str(sp.simplify(yc)),
                       "Mc": str(sp.simplify(M_c))
                   }
            except:
               pass
            
        roots = []
        roots_decimal = []
        residuals = []
        
        solve_res = sp.solve([real_part, imag_part], (x, y), dict=True)
        for s in solve_res:
            x_val = sp.simplify(s.get(x, x))
            y_val = sp.simplify(s.get(y, y))
            root = x_val + sp.I * y_val
            roots.append(root)
            try:
                num_x = s[x].evalf(25) if x in s else x
                num_y = s[y].evalf(25) if y in s else y
                # If x or y is free variable, we can't numeric eval completely
                if num_x.is_number and num_y.is_number:
                    roots_decimal.append(str(num_x) + (" + " if num_y >= 0 else " - ") + str(abs(num_y)) + "i")
                    resid = expr.subs({x: num_x, y: num_y}).evalf(25)
                    residuals.append(str(sp.Abs(resid).evalf(10)))
                else:
                    roots_decimal.append("")
                    residuals.append("")
            except:
                roots_decimal.append("")
                residuals.append("")

        return json.dumps({
            "roots": [str(r) for r in roots],
            "latex_roots": [sp.latex(r) for r in roots],
            "decimal_roots": roots_decimal,
            "residuals": residuals,
            "real_part": str(real_part),
            "imag_part": str(imag_part),
            "locus_data": locus_data,
            "derivation": {
                "expr": str(expr.expand())
            }
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

print(solve_complex())
`;
  console.log(await sympyService.runSympyCode(code));
}
run();
