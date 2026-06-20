import * as math from 'mathjs';
import Decimal from 'decimal.js';
import { factorize, isPrime } from '../lib/mathUtils';

let cachedPrimes: number[] | null = null;
async function getPrimesList(): Promise<number[]> {
  if (cachedPrimes) return cachedPrimes;
  try {
    const res = await fetch('/api/primes');
    const data = await res.json();
    if (data && Array.isArray(data.primes)) {
      cachedPrimes = data.primes;
      return cachedPrimes!;
    }
  } catch (e) {
    console.error("Failed to fetch primes from server:", e);
  }
  return [];
}

export interface MathResult {
  type: 'success' | 'error';
  content: string;
  data?: any;
}

export async function solveAdvancedMathLocal(prompt: string, mode: string, userFunctions?: { f: string, g: string, h: string }, angleMode: 'rad' | 'deg' = 'rad'): Promise<MathResult> {
  try {
    let expr = prompt.trim();
    const lowerExpr = expr.toLowerCase();

    // 0.a Prime Factorization
    if (lowerExpr.startsWith('factor') || lowerExpr.match(/^factor\s+/i)) {
      const numMatch = expr.match(/^factor\s*\((.*)\)/i) || expr.match(/^factor\s+(.*)/i);
      if (numMatch) {
        const valStr = numMatch[1].trim();
        let val: bigint;
        try {
          // Parse directly if it's a simple number
          val = BigInt(valStr.replace(/[\s_,]/g, ''));
        } catch {
          // If it is an expression, try mathjs first
          try {
            const evaled = math.evaluate(valStr);
            val = BigInt(Math.round(Number(evaled)));
          } catch {
            // Fallback: evaluate expression in SymPy
            const code = `
def compute_val():
    import sympy as sp
    import json
    try:
        from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
        trans = (standard_transformations + (implicit_multiplication_application, convert_xor))
        res = parse_expr('${valStr.replace(/'/g, "\\'")}', transformations=trans)
        res = sp.simplify(res)
        return json.dumps({"val": str(res)})
    except Exception as e:
        return json.dumps({"error": str(e)})
compute_val()
`;
            const sympyRes = await fetch('/api/math/eval', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code })
            });
            const data = await sympyRes.json();
            const parsed = JSON.parse(data.result);
            if (parsed.val) {
              val = BigInt(parsed.val);
            } else {
              throw new Error("Invalid integer expression: " + (parsed.error || ""));
            }
          }
        }

        if (val < 2n) {
          return {
            type: 'error',
            content: `Số nhập vào (${val.toString()}) phải là số nguyên lớn hơn hoặc bằng 2 để phân tích thừa số nguyên tố.`
          };
        }

        const factorMap = factorize(val);
        const factorsList: [bigint, number][] = [];
        for (const [pStr, e] of factorMap.entries()) {
          factorsList.push([BigInt(pStr), e]);
        }
        factorsList.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

        const isPrimeNum = isPrime(val);
        const classification = isPrimeNum ? 'SỐ NGUYÊN TỐ (Prime Number)' : 'HỢP SỐ (Composite Number)';

        const canonicalStr = factorsList.map(([p, e]) => `${p}${e > 1 ? `^${e}` : ''}`).join(' × ');
        
        let plainContent = `Số: ${val.toString()}\n`;
        plainContent += `Phân loại: ${classification}\n\n`;
        plainContent += `Dạng phân tích tiêu chuẩn (Canonical Representation):\n`;
        plainContent += `${val.toString()} = ${canonicalStr}`;

        // LaTeX output
        let latexStr = `${val.toString()} = ` + factorsList.map(([p, e]) => `${p}${e > 1 ? `^{${e}}` : ''}`).join(' \\times ');
        latexStr += `\\quad \\text{(${isPrimeNum ? 'Prime' : 'Composite'})}`;

        return {
          type: 'success',
          content: plainContent,
          data: {
            symbolic: canonicalStr,
            latex: latexStr,
            isPrime: isPrimeNum,
            factors: factorsList.map(([p, e]) => [p.toString(), e])
          }
        };
      }
    }

    // 0.c Solve Prime-counting equation Pi(x) = a
    const solvePiMatch = expr.match(/^(?:solve|giải|tìm\s+x\s+để)\s*(?:pi|pi_x|pi\(x\))\s*=\s*(.*)/i) || expr.match(/^(?:pi|pi_x|pi\(x\))\s*=\s*(.*)/i);
    if (solvePiMatch) {
      const valStr = solvePiMatch[1].trim();
      let a: number;
      try {
        a = Math.floor(Number(math.evaluate(valStr)));
      } catch {
        a = Math.floor(Number(valStr));
      }

      if (isNaN(a) || a < 1) {
        return {
          type: 'error',
          content: `Giá trị a (${valStr}) phải là một số nguyên dương ≥ 1.`
        };
      }

      let p_a: string = "";
      let p_next: string = "";

      // Try local lookup first
      try {
        const primesList = await getPrimesList();
        if (primesList && primesList.length > 0 && a <= primesList.length) {
          p_a = primesList[a - 1].toString();
          if (a + 1 <= primesList.length) {
            p_next = primesList[a].toString();
          }
        }
      } catch (e) {
        console.error("Local primes lookup failed:", e);
      }

      // Fallback/secondary verification if not found or outside pre-calculated boundary
      if (!p_a || !p_next) {
        const code = `
def compute_interval():
    import sympy as sp
    import json
    try:
        p_a = sp.prime(${a})
        p_next = sp.prime(${a + 1})
        return json.dumps({"p_a": str(p_a), "p_next": str(p_next)})
    except Exception as e:
        return json.dumps({"error": str(e)})
compute_interval()
`;
        const sympyRes = await fetch('/api/math/eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const apiData = await sympyRes.json();
        const parsed = JSON.parse(apiData.result);
        if (parsed.p_a && parsed.p_next) {
          p_a = parsed.p_a;
          p_next = parsed.p_next;
        } else {
          return {
            type: 'error',
            content: `Không thể tìm thấy khoảng nghiệm cho a = ${a}. Lỗi: ${parsed.error || "Không xác định"}`
          };
        }
      }

      const plainContent = `Giải phương trình hàm đếm số nguyên tố (Prime-counting equation solver):\n` +
        `π(x) = ${a}\n\n` +
        `Khoảng nghiệm chính xác (Exact Solution Interval):\n` +
        `x ∈ [${p_a}, ${p_next})\n\n` +
        `Giải thích:\n` +
        `- Số nguyên tố thứ ${a} là p_${a} = ${p_a}.\n` +
        `- Số nguyên tố thứ ${a + 1} là p_${a + 1} = ${p_next}.\n` +
        `- Với mọi số thực x trong nửa khoảng [${p_a}, ${p_next}), số lượng các số nguyên tố nhỏ hơn hoặc bằng x đúng bằng ${a}.\n` +
        `- Khi x < ${p_a}, số lượng các số nguyên tố nhỏ hơn hoặc bằng x tối đa là ${a - 1}.\n` +
        `- Khi x ≥ ${p_next}, số lượng các số nguyên tố nhỏ hơn hoặc bằng x tối thiểu là ${a + 1}.\n` +
        `- Do đó, tập nghiệm của phương trình là x ∈ [${p_a}, ${p_next}).`;

      const latexStr = `\\pi(x) = ${a} \\iff x \\in [${p_a}, ${p_next})`;

      return {
        type: 'success',
        content: plainContent,
        data: {
          symbolic: `[${p_a}, ${p_next})`,
          latex: latexStr,
          p_a,
          p_next,
          a
        }
      };
    }

    // 0.b Prime-counting function Pi(x)
    const piRegexMatch = expr.match(/^pi\s*\(([^)]+)\)/i) || expr.match(/^pi\s+(\d+)/i) || expr.match(/^pi_x\s+(.*)/i);
    if (piRegexMatch) {
      const valStr = piRegexMatch[1].trim();
      let val: number;
      try {
        val = Math.floor(Number(math.evaluate(valStr)));
      } catch {
        val = Math.floor(Number(valStr));
      }

      if (isNaN(val) || val < 0) {
        return {
          type: 'error',
          content: `Giá trị đầu vào (${valStr}) phải là một số nguyên dương không âm để đếm số lượng số nguyên tố.`
        };
      }

      let countStr = "";
      if (val <= 1000000) {
        // High efficiency client-side sieve
        const sieve = new Uint8Array(val + 1);
        let c = 0;
        for (let i = 2; i <= val; i++) {
          if (sieve[i] === 0) {
            c++;
            for (let j = i * 2; j <= val; j += i) {
              sieve[j] = 1;
            }
          }
        }
        countStr = c.toString();
      } else {
        // Ultra-fast SymPy primepi in pyodide
        const code = `
def compute_primepi():
    import sympy as sp
    import json
    try:
        res = sp.primepi(${val})
        return json.dumps({"result": str(res)})
    except Exception as e:
        return json.dumps({"error": str(e)})
compute_primepi()
`;
        const sympyRes = await fetch('/api/math/eval', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const apiData = await sympyRes.json();
        const parsed = JSON.parse(apiData.result);
        if (parsed.result) {
          countStr = parsed.result;
        } else {
          throw new Error(parsed.error || "Failed to calculate primepi");
        }
      }

      const plainContent = `Hàm đếm số nguyên tố (Prime-counting function):\nπ(${val}) = ${countStr}\n\nCó tổng cộng ${countStr} số nguyên tố nhỏ hơn hoặc bằng ${val}.`;
      const latexStr = `\\pi(${val}) = ${countStr}`;

      return {
        type: 'success',
        content: plainContent,
        data: {
          symbolic: countStr,
          latex: latexStr
        }
      };
    }

    // Mode 20: Big Integer Digits
    if (mode === 'Integer Digits') {
      const match = expr.match(/Extract leading and trailing\s+(\d+)\s+digits of the integer result of:\s+([\s\S]*?)\.\s+Also provide/i);
      if (match) {
        const n = parseInt(match[1]);
        let expression = match[2].trim();
        expression = expression.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");
        
        let result;
        let isNativeBigInt = false;
        try {
          // Try evaluating perfectly exact via SymPy first 
          const sympyCode = `
import sympy as sp
import json

def get_exact():
    try:
        from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application, convert_xor
        trans = (standard_transformations + (implicit_multiplication_application, convert_xor))
        res = parse_expr('${expression.replace(/'/g, "\\'")}', transformations=trans)
        res = sp.simplify(res)
        if res.is_integer:
            return json.dumps({"exact": str(res)})
        else:
            return json.dumps({"error": "Not an integer"})
    except Exception as e:
        return json.dumps({"error": str(e)})

get_exact()
`;
          const apiRes = await fetch('/api/math/eval', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ code: sympyCode })
          });
          if (!apiRes.ok || !(apiRes.headers.get('content-type') || '').includes('application/json')) {
            const errText = await apiRes.text();
            throw new Error(`Server returned invalid response (${apiRes.status}): ${errText.substring(0, 100)}`);
          }
          const apiData = await apiRes.json();
          if (apiData.result) {
            const parsed = JSON.parse(apiData.result.trim());
            if (parsed.exact) {
               // Exact BigInt from sympy string
               result = BigInt(parsed.exact);
               isNativeBigInt = true;
            } else {
               throw new Error(parsed.error || "Not an integer");
            }
          } else {
             throw new Error("Local Eval failed");
          }
        } catch (nativeErr) {
          // Fallback if the expression contains decimals or unsupported bigint operations
          try {
            // Use mathjs with extremely high precision
            const bigMath = math.create(math.all, { number: 'BigNumber', precision: 5000 });
            result = bigMath.evaluate(expression);
          } catch (err: any) {
            if (err.message && err.message.includes('Precision limit exceeded')) {
              const bigMathFallback = math.create(math.all, { number: 'BigNumber', precision: 1000 });
              result = bigMathFallback.evaluate(expression);
            } else {
              throw err;
            }
          }
        }

        let strResult = "";
        if (isNativeBigInt) {
          strResult = result.toString();
        } else if (result && typeof result.toFixed === 'function') {
           strResult = result.toFixed(0); 
        } else {
           strResult = result.toString().split('.')[0]; // Fallback
        }
        
        const totalLength = strResult.length;
        let leading = strResult;
        let trailing = strResult;
        
        if (totalLength > n * 2) {
          leading = strResult.substring(0, n);
          trailing = strResult.substring(totalLength - n);
        }
        
        return {
          type: 'success',
          content: `Total Length: ${totalLength} digits\n\nLeading ${n} digits: ${leading}\n\nTrailing ${n} digits: ${trailing}`,
          data: { numeric: strResult }
        };
      }
    }

    // Mode 21: Real Digits Analysis
    if (mode === 'Real Analysis') {
      const match = expr.match(/Perform high-precision analysis of:\s+([\s\S]*?)\.\s+Show first\s+(\d+)\s+significant/i);
      if (match) {
        let expression = match[1].trim();
        expression = expression.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");
        let prec = parseInt(match[2]);
        if (prec > 200) prec = 200;
        
        try {
          const apiRes = await fetch('/api/math/evalf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expr: expression, precision: prec })
          });
          if (!apiRes.ok || !(apiRes.headers.get('content-type') || '').includes('application/json')) {
            const errText = await apiRes.text();
            throw new Error(`Server returned invalid response (${apiRes.status}): ${errText.substring(0, 100)}`);
          }
          const apiData = await apiRes.json();

          if (apiData.result) {
            return {
              type: 'success',
              content: `High-Precision Result (${prec} digits):\n${apiData.result}`,
              data: { numeric: apiData.result }
            };
          } else {
             throw new Error(apiData.error || "Failed to evaluate via SymPy");
          }
        } catch (err: any) {
          return {
             type: 'error',
             content: `Evaluation failed: ${err.message}`
          };
        }
      }
    }


    // Use SymPy API for derivatives
    if (lowerExpr.startsWith('derivative of') || lowerExpr.startsWith('diff') || lowerExpr.startsWith('derivative') || lowerExpr.startsWith('đạo hàm')) {
      let workingExpr = expr;
      let order = 1;
      const orderMatch = workingExpr.match(/,\s*([1-5])\s*$/);
      if (orderMatch) {
        order = parseInt(orderMatch[1]);
        workingExpr = workingExpr.replace(/,\s*[1-5]\s*$/, '').trim();
      }
      const workingLower = workingExpr.toLowerCase();

      const match = workingLower.match(/(?:derivative|đạo hàm)\s+(?:of\s+|của\s+)?(.*?)\s+with\s+respect\s+to\s+(.*)/i) || 
                    workingLower.match(/(?:derivative|đạo hàm)\s+(?:of\s+|của\s+)?(.*)/i) ||
                    workingLower.match(/diff\s+(.*?)\s+(.*)/i) ||
                    workingLower.match(/diff\s+(.*)/i);
      
      if (match) {
        let exprText = match[1];
        let variable = 'x';
        let evalPoint: string | undefined = undefined;
        
        if (match[2]) {
          variable = match[2].trim();
        } else if (exprText.includes(',')) {
          const parts = exprText.split(',');
          exprText = parts[0].trim();
          if (parts.length >= 3) {
            variable = parts[1].trim();
            evalPoint = parts[2].trim();
          } else if (parts.length === 2) {
            const second = parts[1].trim();
            if (/^[a-zA-Z]$/.test(second) || second.includes('=')) {
              variable = second;
            } else {
              evalPoint = second;
            }
          }
        }

        // Clean "at" / "tại" / "@" from variable if present
        const atRegex = /\s+(?:at|tại|@)\s+(.*)/i;
        const atMatchVar = variable.match(atRegex);
        if (atMatchVar) {
          evalPoint = atMatchVar[1].trim();
          variable = variable.replace(atRegex, '').trim();
        }

        // Clean "at" / "tại" / "@" from exprText if present
        const atMatchExpr = exprText.match(atRegex);
        if (atMatchExpr) {
          evalPoint = atMatchExpr[1].trim();
          exprText = exprText.replace(atRegex, '').trim();
        }

        // Construct final variable value for SymPy API
        let finalVar = variable;
        if (evalPoint) {
          if (evalPoint.includes('=')) {
            finalVar = evalPoint;
          } else {
            if (/^[a-zA-Z]$/.test(variable)) {
              finalVar = `${variable} = ${evalPoint}`;
            } else {
              finalVar = evalPoint;
            }
          }
        }

        const res = await fetch('/api/math/diff', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expr: exprText, variable: `${finalVar}, ${order}`, functions: userFunctions })
        });
        
        if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
          const text = await res.text();
          throw new Error(`Derivative API error (${res.status}): ${text.substring(0, 100)}`);
        }
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.result) {
          return { type: 'success', content: data.result, data: { symbolic: data.result, latex: data.latex } };
        }
      }
    } 
    // Use SymPy API for integrals
    else if (lowerExpr.includes('integr') || lowerExpr.includes('tích phân') || lowerExpr.includes('tich phan') || lowerExpr.includes('∫')) {
      // Robust helper to extract parsed query information
      const parseIntegration = (query: string) => {
        const s = query.trim();
        let exprText = "";
        let variable = "x";
        let lowerText: string | undefined = undefined;
        let upperText: string | undefined = undefined;

        // Clean out outer command verbs
        let workStr = s.replace(/^(?:calculate|evaluate|compute|find|solve|tính|giải|hãy tính)\s+/i, '');

        // 1. Definite integral from/to bounds: "from [lower] to [upper]" or "từ [lower] đến [upper]" or "cận từ [lower] đến [upper]"
        const boundsRegex = /(?:from|từ|cận từ)\s+([^\s,]+)\s+(?:to|đến)\s+([^\s,]+)/i;
        const boundsMatch = workStr.match(boundsRegex);

        if (boundsMatch) {
          lowerText = boundsMatch[1].trim();
          upperText = boundsMatch[2].trim();

          // Remove the matched bounds part
          workStr = workStr.replace(boundsRegex, '').trim();
          
          // Remove integration commands, prefixes, and filler words
          workStr = workStr.replace(/^(?:integ(?:ral|rate)|tích phân|tich phan)(?:\s+of|\s+của)?/i, '')
                           .replace(/^(?:cận|của)\s+/i, '')
                           .trim();
          workStr = workStr.replace(/\s+(?:của)\s+/i, ' ').trim();

          // Check trailing differential like 'dx', 'dt'
          const diffMatch = workStr.match(/\s+d([a-z])\s*$/i);
          if (diffMatch) {
            variable = diffMatch[1];
            workStr = workStr.replace(/\s+d[a-z]\s*$/i, '');
          }

          exprText = workStr.trim();
          return { exprText, variable, lowerText, upperText };
        }

        // 2. Parentheses function style: integrate(expr, variable, lower, upper) or integrate(expr, lower, upper)
        const funcStyleMatch = s.match(/(?:integ(?:ral|rate)|tích phân)\s*\(([^,]+)\s*,\s*([^,]+)\s*,\s*([^,)]+)(?:\s*,\s*([^)]+))?\)/i);
        if (funcStyleMatch) {
          const p1 = funcStyleMatch[1].trim();
          const p2 = funcStyleMatch[2].trim();
          const p3 = funcStyleMatch[3].trim();
          const p4 = funcStyleMatch[4] ? funcStyleMatch[4].trim() : undefined;

          if (p4 !== undefined) {
            return { exprText: p1, variable: p2, lowerText: p3, upperText: p4 };
          } else {
            // p2 could be variable or lower bound. If p2 is single alphabetic char excluding e, i, it is most likely a symbol
            const isVar = /^[a-mo-z]$/i.test(p2);
            if (isVar) {
              return { exprText: p1, variable: p2, lowerText: p3, upperText: undefined };
            } else {
              return { exprText: p1, variable: 'x', lowerText: p2, upperText: p3 };
            }
          }
        }

        // 3. Indefinite integration
        workStr = workStr.replace(/^(?:integ(?:ral|rate)|tích phân|tich phan)(?:\s+of|\s+của)?/i, '')
                         .replace(/^(?:cận|của)\s+/i, '')
                         .trim();
        
        const diffMatch = workStr.match(/\s+d([a-z])\s*$/i);
        if (diffMatch) {
          variable = diffMatch[1];
          workStr = workStr.replace(/\s+d[a-z]\s*$/i, '');
        }

        exprText = workStr.trim();
        return { exprText, variable };
      };

      const parsed = parseIntegration(expr);
      if (parsed && parsed.exprText) {
        const cleanExpr = parsed.exprText;
        const variable = parsed.variable;
        const lower = parsed.lowerText;
        const upper = parsed.upperText;

        const bodyData: any = { expr: cleanExpr, variable, functions: userFunctions };
        if (lower !== undefined && upper !== undefined) {
          bodyData.lower = lower;
          bodyData.upper = upper;
        }

        const res = await fetch('/api/math/integrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });

        if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
          const text = await res.text();
          throw new Error(`Integral API error (${res.status}): ${text.substring(0, 100)}`);
        }

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.result) {
          return { type: 'success', content: data.result, data: { symbolic: data.result, latex: data.latex } };
        }
      }
    } 
    // Use SymPy API for summation
    else if (lowerExpr.startsWith('sum') || lowerExpr.startsWith('tổng')) {
      const match = lowerExpr.match(/(?:sum(?:mation)?|tổng)(?:\s+of|\s+của)?\s+(.*?)\s+(?:from|từ)\s+(.*?)\s+(?:to|đến)\s+(.*)/i);
      if (match) {
        let exprText = match[1];
        let lowerText = match[2];
        let upperText = match[3];
        let variable = 'n';
        
        // Parse lower bound like "n=1"
        if (lowerText.includes('=')) {
          const parts = lowerText.split('=');
          variable = parts[0].trim();
          lowerText = parts[1].trim();
        }
        
        const res = await fetch('/api/math/sum', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expr: exprText, variable, lower: lowerText, upper: upperText, functions: userFunctions })
        });
        
        if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
          const text = await res.text();
          throw new Error(`Summation API error (${res.status}): ${text.substring(0, 100)}`);
        }
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.result) {
          return { type: 'success', content: data.result, data: { symbolic: data.result, latex: data.latex } };
        }
      }
    }
    // Use SymPy API for limits
    else if (lowerExpr.startsWith('limit') || lowerExpr.startsWith('calculate limit') || lowerExpr.startsWith('giới hạn')) {
      const match = lowerExpr.match(/(?:limit|calculate limit|giới hạn)(?:\s+of|\s+của)?\s+(.*?)\s+(?:as|when|khi)\s+(.*?)\s*(?:->|to|đến|:=|=)\s*(.*)/i);
      
      if (match) {
        const exprText = match[1].trim();
        const variable = match[2].trim();
        const value = match[3].trim();

        const res = await fetch('/api/math/limit', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expr: exprText, variable, value, functions: userFunctions })
        });
        
        if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
          const text = await res.text();
          throw new Error(`Limit API error (${res.status}): ${text.substring(0, 100)}`);
        }
        
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        if (data.result) {
          return { type: 'success', content: data.result, data: { symbolic: data.result, latex: data.latex } };
        }
      }
    }
    // Use SymPy API for solving equations
    else if (lowerExpr.startsWith('solve') || lowerExpr.startsWith('giải')) {
      const match = lowerExpr.match(/(?:solve|giải)\s+(.*)/i);
      if (match) {
        let eq = match[1];
        if (!eq.includes('=')) eq += '=0';
        
        // Check if it's an inequality
        if (eq.includes('>') || eq.includes('<')) {
           const res = await fetch('/api/math/inequality', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expr: eq, functions: userFunctions })
          });
          
          if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
            const text = await res.text();
            throw new Error(`Inequality API error (${res.status}): ${text.substring(0, 100)}`);
          }
          
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          if (data.result) {
            return { type: 'success', content: data.result, data: { symbolic: data.result, latex: data.latex } };
          }
        } else {
          // Equation
          const parts = eq.split('=');
          const sympyEq = `Eq(${parts[0]}, ${parts[1]})`;
          const res = await fetch('/api/math/solve', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ expr: sympyEq, functions: userFunctions })
          });
          
          if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
            const text = await res.text();
            throw new Error(`Solve API error (${res.status}): ${text.substring(0, 100)}`);
          }
          
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          if (data.result) {
            return { type: 'success', content: JSON.stringify(data.result), data: { roots: data.result, latex: data.latex } };
          }
        }
      }
    }

    // Fallback to simplify if no specific command
    const res = await fetch('/api/math/simplify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expr, functions: userFunctions })
    });
    
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
      const text = await res.text();
      throw new Error(`Simplify API error (${res.status}): ${text.substring(0, 100)}`);
    }
    
    const data = await res.json();
    if (data.error) {
      throw new Error(data.error);
    }
    if (data.result) {
      return { type: 'success', content: data.result, data: { symbolic: data.result, latex: data.latex } };
    }

    throw new Error("Could not parse or solve expression locally.");
  } catch (error: any) {
    console.error("Local Math Error:", error);
    return {
      type: 'error',
      content: "Failed to process mathematical request locally: " + error.message
    };
  }
}

export async function analyzePolynomialLocal(coeffsStr: string): Promise<MathResult> {
  try {
    const coeffs = coeffsStr.split(',').map(s => parseFloat(s.trim()));
    const degree = coeffs.length - 1;
    
    let expr = "";
    for (let i = 0; i <= degree; i++) {
      const c = coeffs[i];
      if (c === 0) continue;
      const p = degree - i;
      if (p === 0) expr += `${c > 0 && expr ? '+' : ''}${c}`;
      else if (p === 1) expr += `${c > 0 && expr ? '+' : ''}${c === 1 ? '' : c === -1 ? '-' : c}x`;
      else expr += `${c > 0 && expr ? '+' : ''}${c === 1 ? '' : c === -1 ? '-' : c}x^${p}`;
    }
    if (!expr) expr = "0";

    const res = await fetch('/api/math/polynomial', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expr })
    });
    if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
      const text = await res.text();
      throw new Error(`Polynomial API error (${res.status}): ${text.substring(0, 100)}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    if (data.result) {
      return {
        type: 'success',
        content: "Analysis complete (SymPy).",
        data: {
          expression: expr,
          roots: data.result.roots.map((r: any) => `${r.root}${r.multiplicity > 1 ? ` (x${r.multiplicity})` : ''}`),
          extrema: data.result.extrema,
          inflectionPoints: [],
          intervals: data.result.intervals || [],
          summary: `Polynomial of degree ${data.result.degree}. Roots: ${data.result.roots.map((r: any) => r.root).join(', ')}`,
          latex: data.latex
        }
      };
    }

    throw new Error("Failed to analyze polynomial");
  } catch (error: any) {
    console.error("Local Polynomial Analysis Error:", error);
    return {
      type: 'error',
      content: "Failed to analyze polynomial locally: " + error.message
    };
  }
}
