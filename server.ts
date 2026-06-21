import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import { PrimesManager } from './src/server/primesManager.ts';
import { GeometryService } from './src/server/geometryService.ts';
import { factorize } from './src/lib/mathUtils.ts';
import { sympyService } from './src/server/sympyService.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`[Server] ${req.method} ${req.url}`);
    next();
  });

  const primesManager = new PrimesManager();
  
  // API Endpoints
  app.get('/api/primes', (req, res) => {
    res.json({ primes: primesManager.getPrimes() });
  });

  app.post('/api/primes/generate', async (req, res) => {
    const count = parseInt(req.body.count as string) || 1;
    const newPrimes = await primesManager.generateNextPrimes(count);
    res.json({ added: newPrimes, total: primesManager.getPrimes().length });
  });

  app.post('/api/primes/generate-upto', async (req, res) => {
    const targetCount = parseInt(req.body.targetCount as string) || 1000;
    // Limit to 2.5 million to prevent excessive resource usage
    const safeTarget = Math.min(targetCount, 2500000);
    const newPrimes = await primesManager.generateUpToCount(safeTarget);
    res.json({ addedCount: newPrimes.length, total: primesManager.getPrimes().length });
  });

  app.post('/api/factorize', (req, res) => {
    const nStr = req.body.n as string;
    try {
      const n = BigInt(nStr);
      if (n < 2n) {
        return res.status(400).json({ error: 'Invalid number' });
      }

      const factorMap = factorize(n);
      const factors: string[] = [];
      for (const [p, e] of factorMap.entries()) {
        for (let i = 0; i < e; i++) {
          factors.push(p);
        }
      }
      // Sort factors numerically
      factors.sort((a, b) => {
        const ba = BigInt(a);
        const bb = BigInt(b);
        return ba < bb ? -1 : ba > bb ? 1 : 0;
      });

      res.json({ n: n.toString(), factors });
    } catch (e) {
      res.status(400).json({ error: 'Invalid integer format' });
    }
  });

  // Geometry API
  app.post('/api/geometry/parse', (req, res) => {
    const { expr } = req.body;
    const val = GeometryService.parseValue(expr);
    res.json({ value: val });
  });

  app.post('/api/geometry/compare-lines', (req, res) => {
    const { l1, l2 } = req.body;
    const result = GeometryService.compareLines(l1, l2);
    res.json({ result });
  });

  app.post('/api/geometry/compare-plane-sphere', (req, res) => {
    const { plane, sphere } = req.body;
    const result = GeometryService.comparePlaneSphere(plane, sphere);
    res.json({ result });
  });

  app.post('/api/geometry/compare-spheres', (req, res) => {
    const { s1, s2 } = req.body;
    const result = GeometryService.compareSpheres(s1, s2);
    res.json({ result });
  });

  app.post('/api/geometry/compare-circles', (req, res) => {
    const { c1, c2 } = req.body;
    const result = GeometryService.compareCircles(c1, c2);
    res.json({ result });
  });

  app.post('/api/geometry/compare-line-circle', (req, res) => {
    const { line, circle } = req.body;
    const result = GeometryService.compareLineCircle(line, circle);
    res.json({ result });
  });

  app.post('/api/geometry/compare-line-plane', (req, res) => {
    const { line, plane } = req.body;
    const result = GeometryService.compareLinePlane(line, plane);
    res.json({ result });
  });

  app.post('/api/geometry/compare-line-sphere', (req, res) => {
    const { line, sphere } = req.body;
    const result = GeometryService.compareLineSphere(line, sphere);
    res.json({ result });
  });

  app.post('/api/geometry/compare-point-plane', (req, res) => {
    const { point, plane } = req.body;
    const result = GeometryService.comparePointPlane(point, plane);
    res.json({ result });
  });

  app.post('/api/geometry/compare-point-line', (req, res) => {
    const { point, line } = req.body;
    const result = GeometryService.comparePointLine(point, line);
    res.json({ result });
  });

  app.post('/api/geometry/compare-points', (req, res) => {
    const { p1, p2, dimension } = req.body;
    const result = GeometryService.comparePoints(p1, p2, dimension);
    res.json({ result });
  });

  app.post('/api/geometry/orthogonal-projection', (req, res) => {
    const { obj1, obj2, dimension } = req.body;
    const result = GeometryService.orthogonalProjection(obj1, obj2, dimension);
    res.json({ result });
  });

  app.post('/api/geometry/intersection', (req, res) => {
    const { obj1, obj2, dimension } = req.body;
    const result = GeometryService.intersection(obj1, obj2, dimension);
    res.json({ result });
  });

  app.post('/api/geometry/parse-volume', (req, res) => {
    const { r } = req.body;
    const volume = GeometryService.formatPiVolume(r);
    res.json({ volume });
  });

  // SymPy API Endpoints
  app.post('/api/math/integrate', async (req, res) => {
    try {
      const { expr, variable, lower, upper, functions } = req.body;
      let resultStr;
      if (lower !== undefined && upper !== undefined) {
        resultStr = await sympyService.definiteIntegrate(expr, variable || 'x', lower, upper, functions);
      } else {
        resultStr = await sympyService.integrate(expr, variable || 'x', functions);
      }
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/solve', async (req, res) => {
    try {
      const { expr, variable, functions } = req.body;
      const resultStr = await sympyService.solveEquation(expr, variable || 'x', functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/inequality', async (req, res) => {
    try {
      const { expr, variable, functions } = req.body;
      const resultStr = await sympyService.solveInequality(expr, variable || 'x', functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/polynomial', async (req, res) => {
    try {
      const { expr, variable, functions } = req.body;
      const resultStr = await sympyService.analyzePolynomial(expr, variable || 'x', functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/limit', async (req, res) => {
    try {
      const { expr, variable, value, functions } = req.body;
      const resultStr = await sympyService.limit(expr, variable || 'x', value || '0', functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/diff', async (req, res) => {
    try {
      const { expr, variable, functions } = req.body;
      const resultStr = await sympyService.derivative(expr, variable || 'x', functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/simplify', async (req, res) => {
    try {
      const { expr, functions } = req.body;
      const resultStr = await sympyService.simplify(expr, functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });
  
  app.post('/api/math/sum', async (req, res) => {
    try {
      const { expr, variable, lower, upper, functions } = req.body;
      const resultStr = await sympyService.summation(expr, variable || 'n', lower, upper, functions);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/evalf', async (req, res) => {
    try {
      const { expr, precision } = req.body;
      const resultStr = await sympyService.evalf(expr, precision || 25);
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/eval', async (req, res) => {
    try {
      const { code } = req.body;
      const resultStr = await sympyService.runSympyCode(code);
      res.json({ result: resultStr });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/precision-geometry', async (req, res) => {
    try {
      const { expressions, xMin, xMax, yMin, yMax } = req.body;
      const resultStr = await sympyService.analyzePrecisionGeometry(
        expressions,
        Number(xMin),
        Number(xMax),
        Number(yMin),
        Number(yMax)
      );
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/math/bbt', async (req, res) => {
    try {
      const { expr } = req.body;
      if (!expr || expr.trim() === '') {
        return res.status(400).json({ error: "Biểu thức không được để trống." });
      }
      const bbtData = await sympyService.generateBBT(expr);
      res.json(bbtData);
    } catch (e: any) {
      res.status(400).json({ error: e.message || "Lỗi xử lý bảng biến thiên bằng CAS engine." });
    }
  });

  app.post('/api/math/complex-solve', async (req, res) => {
    try {
      const { type, a, b, c, d, options } = req.body;
      const code = `
import json
import sympy as sp

def solve_complex():
    try:
        x, y = sp.symbols('x y', real=True)
        z = x + sp.I*y
        z_conj = x - sp.I*y
        
        # safely parse a, b, c, d
        def s_parse(val_str):
            if not val_str: return 0
            # a simple parse using typical math expressions
            from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
            trans = (standard_transformations + (implicit_multiplication_application,))
            # allow complex 'i'
            val_str = val_str.replace('i', 'I')
            return parse_expr(val_str, transformations=trans)

        a_val = s_parse("""${a}""")
        b_val = s_parse("""${b}""")
        c_val = s_parse("""${c}""")
        d_val = s_parse("""${d}""")
        
        eq_type = "${type}"
        term_d = d_val if eq_type in ['C', 'D'] else 0
        
        if eq_type == 'A':
            expr = a_val * z_conj + b_val * z + c_val
        elif eq_type == 'B':
            expr = a_val * z**2 + b_val * z + c_val
        elif eq_type == 'C':
            expr = a_val * z**2 + b_val * z_conj + c_val * z + d_val
        elif eq_type == 'D':
            expr = a_val * z**3 + b_val * z**2 + c_val * z + d_val
        elif eq_type == 'E':
            expr = a_val * z * z_conj + b_val * z + c_val * z_conj + d_val
        else:
            return json.dumps({"error": "Unknown type"})
            
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

        # Eq2 intersection logic if EQ2 is present (requires extra variables)
        eq2_type = "${req.body.eq2Type || ''}"
        if eq_type == 'E' and eq2_type:
            eq2_p = s_parse("""${req.body.eq2_p || '0'}""")
            eq2_q = s_parse("""${req.body.eq2_q || '0'}""")
            eq2_r = s_parse("""${req.body.eq2_r || '0'}""")
            
            if eq2_type == 'A':
                expr2 = eq2_p * z + eq2_q * z_conj + eq2_r
            elif eq2_type == 'B':
                expr2 = eq2_p * z**2 + eq2_q * z + eq2_r
            else:
                expr2 = 0
                
            real_part2 = sp.re(expr2).simplify()
            imag_part2 = sp.im(expr2).simplify()
            # Intersect:
            solve_res = sp.solve([real_part, imag_part, real_part2, imag_part2], (x, y), dict=True)
            # Override original empty list with solutions
            
        roots = []
        roots_decimal = []
        residuals = []
        
        if eq_type in ['B', 'D']:
            # Solve natively in 1D complex variable to ensure perfect performance and exact symbolic
            z_sym = sp.Symbol('z')
            expr_z = expr.subs(z, z_sym)
            solve_res = sp.solve(expr_z, z_sym)
            for r in solve_res:
                root = sp.simplify(r)
                roots.append(root)
                try:
                    num = root.evalf(25)
                    num_x, num_y = sp.re(num), sp.im(num)
                    roots_decimal.append(str(num_x) + (" + " if num_y >= 0 else " - ") + str(abs(num_y)) + "i")
                    
                    # Residual
                    resid = expr_z.subs(z_sym, num).evalf(25)
                    residuals.append(str(sp.Abs(resid).evalf(10)))
                except:
                    roots_decimal.append("")
                    residuals.append("")
        else:
            # Solve system for x and y
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
        
        # Extracted matrix for Case A
        matrix_A = {}
        if eq_type == 'A':
            F_x = real_part.coeff(x)
            F_y = real_part.coeff(y)
            F_const = real_part.subs({x:0, y:0})
            G_x = imag_part.coeff(x)
            G_y = imag_part.coeff(y)
            G_const = imag_part.subs({x:0, y:0})
            matrix_A = {
                "M": [[str(F_x), str(F_y)], [str(G_x), str(G_y)]],
                "B": [str(-F_const), str(-G_const)]
            }
        
        return json.dumps({
            "roots": [str(r) for r in roots],
            "latex_roots": [sp.latex(r) for r in roots],
            "decimal_roots": roots_decimal,
            "residuals": residuals,
            "real_part": str(real_part),
            "imag_part": str(imag_part),
            "matrix_data": matrix_A,
            "locus_data": locus_data,
            "derivation": {
                "expr": str(expr.expand())
            }
        })
    except Exception as e:
        return json.dumps({"error": str(e)})

solve_complex()
`
      const resultStr = await sympyService.runSympyCode(code);
      if (!resultStr) throw new Error("Empty response from SymPy");
      res.json(JSON.parse(resultStr));
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initialize services background
    try {
      await primesManager.init();
      console.log("[Server] PrimesManager initialized.");
    } catch (err) {
      console.error("[Server] PrimesManager init failed:", err);
    }
    
    sympyService.init().catch(err => {
      console.error("[Server] SympyService init failed:", err);
    });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
