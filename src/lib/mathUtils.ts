import Decimal from 'decimal.js';
import Fraction from 'fraction.js';
import * as math from 'mathjs';

// --- Number Theory ---

export function powerSumMod(a: number, N: number): string {
  if (N <= 0) return "0";
  let total = new Decimal(0);
  let aMod = new Decimal(a).mod(N);
  let term = new Decimal(1);
  
  for (let i = 1; i <= N; i++) {
    term = term.mul(aMod).mod(N);
    total = total.add(term).mod(N);
  }
  return total.toString();
}

export function gcdExtended(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (a === 0n) return [b, 0n, 1n];
  const [g, x1, y1] = gcdExtended(b % a, a);
  const x = y1 - (b / a) * x1;
  const y = x1;
  return [g, x, y];
}

export function modInverse(a: bigint, m: bigint): bigint | null {
  const [g, x] = gcdExtended(a, m);
  if (g !== 1n) return null;
  return (x % m + m) % m;
}

export function solveCRT(moduli: bigint[], remainders: bigint[]): { x: string, M: string } | string {
  let x = 0n;
  let M = 1n;
  
  for (let i = 0; i < moduli.length; i++) {
    const mi = moduli[i];
    const ri = remainders[i];
    const g = gcd(M, mi);
    
    if ((ri - x) % g !== 0n) return "No solution: conflict at modulus " + mi;
    
    const M_red = M / g;
    const mi_red = mi / g;
    const inv = modInverse(M_red % mi_red, mi_red);
    
    if (inv === null) return "No modular inverse during merge";
    
    const k = ((ri - x) / g * inv) % mi_red;
    x = x + M * k;
    M = M * mi_red;
    x = (x % M + M) % M;
  }
  
  return { x: x.toString(), M: M.toString() };
}

export interface CRTStep {
  type: 'text' | 'formula' | 'list' | 'step';
  title?: string;
  content: string;
  latex?: string;
}

export interface CRTStepResult {
  success: boolean;
  error?: string;
  steps: CRTStep[];
  solution?: { x: string; M: string };
}

export function solveCRTStepByStep(moduli: bigint[], remainders: bigint[]): CRTStepResult {
  const steps: CRTStep[] = [];
  
  if (moduli.length < 2 || moduli.length !== remainders.length) {
    return {
      success: false,
      error: "Hệ phương trình phải gồm ít nhất 2 dòng dữ liệu đầy đủ.",
      steps: []
    };
  }

  // Check valid inputs
  for (let i = 0; i < moduli.length; i++) {
    if (moduli[i] <= 1n) {
      return {
        success: false,
        error: `Mô-đun m${i+1} = ${moduli[i]} không hợp lệ. Tất cả mô-đun phải lớn hơn 1.`,
        steps: []
      };
    }
  }

  // 1. Sắp xếp theo mô-đun giảm dần
  const equations = moduli.map((m, idx) => ({
    originalIndex: idx + 1,
    mod: m,
    rem: (remainders[idx] % m + m) % m
  })).sort((a, b) => (b.mod > a.mod ? 1 : b.mod < a.mod ? -1 : 0));

  steps.push({
    type: 'step',
    title: "Bước 1: Sắp xếp lại hệ phương trình theo mô-đun giảm dần để tối ưu tốc độ giải",
    content: "Việc bắt đầu từ phương trình có mô-đun lớn nhất giúp bước nhảy tăng nhanh nhất, từ đó giảm số lần duyệt nhẩm và tăng tốc độ hội tụ lời giải."
  });

  steps.push({
    type: 'text',
    content: "Hệ phương trình sau khi sắp xếp lại theo mô-đun giảm dần:\n" + equations.map((eq, i) => `* **Phương trình ${i+1}** (nguồn gốc dòng ${eq.originalIndex}): $x \\equiv ${eq.rem} \\pmod{${eq.mod}}$`).join('\n')
  });

  // Lấy phương trình đầu tiên làm nền tảng
  let current_r = equations[0].rem;
  let current_m = equations[0].mod;

  steps.push({
    type: 'step',
    title: "Khởi dựng biểu thức nền tảng đầu tiên",
    content: `Từ phương trình (1): $x \\equiv ${current_r} \\pmod{${current_m}}$, dưới dạng đại số tuyến tính ta biểu diễn là:`,
    latex: `x = ${current_m}k_1 + ${current_r} \\quad (k_1 \\in \\mathbb{Z})`
  });

  // 2. Thế cuốn chiếu từng cặp một
  for (let i = 1; i < equations.length; i++) {
    const next_r = equations[i].rem;
    const next_m = equations[i].mod;

    steps.push({
      type: 'step',
      title: `Bước ${i+1}: Thế x vào phương trình tiếp theo`,
      content: `Thế biểu thức $x$ ở bước trên vào phương trình tiếp theo: $x \\equiv ${next_r} \\pmod{${next_m}}$, ta thu được đồng dư thức:`,
      latex: `${current_m}k_{${i}} + ${current_r} \\equiv ${next_r} \\pmod{${next_m}}`
    });

    const diff = next_r - current_r;
    const g = gcd(current_m, next_m);
    
    if (diff % g !== 0n) {
      steps.push({
        type: 'text',
        content: `❌ **Hệ vô nghiệm:** Hiệu vế phải $(${next_r} - ${current_r}) = ${diff}$ không chia hết cho ước chung lớn nhất $gcd(${current_m}, ${next_m}) = ${g}$. Đồng dư thức mâu thuẫn và không tồn tại phương án nghiệm.`
      });
      return {
        success: false,
        error: `Không tìm thấy nghiệm do mâu thuẫn đồng dư tại mô-đun ${current_m} và ${next_m}.`,
        steps
      };
    }

    let current_m_prime = current_m;
    let next_m_prime = next_m;
    let target_rem_prime = diff;

    if (g > 1n) {
      current_m_prime = current_m / g;
      next_m_prime = next_m / g;
      target_rem_prime = diff / g;

      steps.push({
        type: 'text',
        content: `Vì $gcd(${current_m}, ${next_m}) = ${g} > 1$, ta rút gọn bằng cách chia cả 2 vế và cả mô-đun cho ${g}:`,
        latex: `${current_m_prime}k_{${i}} \\equiv ${target_rem_prime} \\pmod{${next_m_prime}}`
      });
    } else {
      steps.push({
        type: 'text',
        content: "Chuyển hằng số tự do sang vế phải và rút gọn:",
        latex: `${current_m}k_{${i}} \\equiv ${diff} \\pmod{${next_m}}`
      });
    }

    // Rút gọn hệ số và vế phải theo mô-đun mới
    let coeff = current_m_prime % next_m_prime;
    if (coeff < 0n) coeff += next_m_prime;

    let r_right = target_rem_prime % next_m_prime;
    if (r_right < 0n) r_right += next_m_prime;

    // Áp dụng số dư âm nếu vượt quá m/2
    const m_half = next_m_prime / 2n;
    let opt_coeff = coeff;
    let opt_r = r_right;

    let use_neg_coeff = false;
    let use_neg_r = false;

    if (coeff > m_half) {
      opt_coeff = coeff - next_m_prime;
      use_neg_coeff = true;
    }
    if (r_right > m_half) {
      opt_r = r_right - next_m_prime;
      use_neg_r = true;
    }

    if (use_neg_coeff || use_neg_r) {
      steps.push({
        type: 'text',
        content: `Rút gọn hệ số của $k_{${i}}$ và hằng số về miền số dư âm tối ưu $[- ${next_m_prime}/2, ${next_m_prime}/2]$ nhằm đơn giản hóa việc nhẩm số:`,
        latex: `${opt_coeff}k_{${i}} \\equiv ${opt_r} \\pmod{${next_m_prime}}`
      });
    } else {
      steps.push({
        type: 'text',
        content: `Rút gọn đồng dư thức thành:`,
        latex: `${opt_coeff}k_{${i}} \\equiv ${opt_r} \\pmod{${next_m_prime}}`
      });
    }

    // Nhẩm tìm k_i bằng cách cộng/trừ bội mô-đun
    let jFound = 0n;
    let divisibleValue = opt_r;
    const coeffAbs = opt_coeff < 0n ? -opt_coeff : opt_coeff;
    let found = false;

    for (let j = 0n; j < coeffAbs; j++) {
      // Thử cộng thêm j lần mô-đun
      let valPos = opt_r + j * next_m_prime;
      if (valPos % opt_coeff === 0n) {
        jFound = j;
        divisibleValue = valPos;
        found = true;
        break;
      }
      // Thử trừ đi j lần mô-đun
      let valNeg = opt_r - j * next_m_prime;
      if (valNeg % opt_coeff === 0n) {
        jFound = -j;
        divisibleValue = valNeg;
        found = true;
        break;
      }
    }

    if (!found) {
      const inv = modInverse((opt_coeff % next_m_prime + next_m_prime) % next_m_prime, next_m_prime);
      if (inv === null) {
        return {
          success: false,
          error: "Không thể tìm nghịch đảo mô-đun của hệ thức đồng dư này.",
          steps
        };
      }
      const k_opt_raw = (opt_r * inv) % next_m_prime;
      const k_opt = (k_opt_raw + next_m_prime) % next_m_prime;
      
      steps.push({
        type: 'text',
        content: `Sử dụng nghịch đảo mô-đun, ta tìm đồng dư nghiệm đối với $k_{${i}}$:`,
        latex: `k_{${i}} \\equiv ${k_opt} \\pmod{${next_m_prime}}`
      });

      steps.push({
        type: 'text',
        content: `Biến đổi về dạng đại số đối số mới:`,
        latex: `k_{${i}} = ${next_m_prime}k_{${i+1}} + ${k_opt}`
      });

      const new_m = current_m * next_m_prime;
      const new_r_unreduced = current_m * k_opt + current_r;
      const new_r = (new_r_unreduced % new_m + new_m) % new_m;

      steps.push({
        type: 'text',
        content: `Thế $k_{${i}}$ ngược lại vào hệ thức của $x$:`,
        latex: `x = ${current_m}(${next_m_prime}k_{${i+1}} + ${k_opt}) + ${current_r} = ${new_m}k_{${i+1}} + ${new_r_unreduced}`
      });

      current_m = new_m;
      current_r = new_r;

      steps.push({
        type: 'text',
        content: `Đại số thu gọn của $x$ tại bước này:`,
        latex: `x = ${current_m}k_{${i+1}} + ${current_r} \\quad \\Rightarrow \\quad x \\equiv ${current_r} \\pmod{${current_m}}`
      });

    } else {
      let explanation = "";
      if (jFound > 0n) {
        explanation = `Nhẩm nhanh bằng cách cộng thêm vế phải ${jFound} lần mô-đun ${next_m_prime}: $${opt_r} + ${jFound} \\times ${next_m_prime} = ${divisibleValue}$ chia hết cho hệ số $${opt_coeff}$.`;
      } else if (jFound < 0n) {
        explanation = `Nhẩm nhanh bằng cách bớt đi ở vế phải ${-jFound} lần mô-đun ${next_m_prime}: $${opt_r} - ${-jFound} \\times ${next_m_prime} = ${divisibleValue}$ chia hết cho hệ số $${opt_coeff}$.`;
      } else {
        explanation = `Vế phải $${opt_r}$ đã chia hết cho hệ số $${opt_coeff}$.`;
      }

      const k_opt_raw = divisibleValue / opt_coeff;
      const k_opt = (k_opt_raw % next_m_prime + next_m_prime) % next_m_prime;

      steps.push({
        type: 'text',
        content: `${explanation} Chia cả hai vế cho hệ số $${opt_coeff}$ để lấy nghiệm đồng dư:`,
        latex: `k_{${i}} \\equiv \\frac{${divisibleValue}}{${opt_coeff}} = ${k_opt_raw} \\equiv ${k_opt} \\pmod{${next_m_prime}}`
      });

      steps.push({
        type: 'text',
        content: `Biểu diễn đối số $k_{${i}}$ dưới dạng phương trình đối số mới $k_{${i+1}}$:`,
        latex: `k_{${i}} = ${next_m_prime}k_{${i+1}} + ${k_opt}`
      });

      const new_m = current_m * next_m_prime;
      const new_r_unreduced = current_m * k_opt + current_r;
      const new_r = (new_r_unreduced % new_m + new_m) % new_m;

      steps.push({
        type: 'text',
        content: `Thế ngược $k_{${i}}$ vào biểu thức $x$ ở bước trước:`,
        latex: `x = ${current_m}(${next_m_prime}k_{${i+1}} + ${k_opt}) + ${current_r} = ${new_m}k_{${i+1}} + ${new_r_unreduced}`
      });

      current_m = new_m;
      current_r = new_r;

      steps.push({
        type: 'text',
        content: `Hệ thức đại số thu gọn của $x$ sau bước này:`,
        latex: `x = ${current_m}k_{${i+1}} + ${current_r} \\quad \\Rightarrow \\quad x \\equiv ${current_r} \\pmod{${current_m}}`
      });
    }
  }

  // Kết luận
  steps.push({
    type: 'step',
    title: "Kết luận nghiệm tổng quát của hệ phương trình",
    content: "Sau khi thế cuốn chiếu qua tất cả các phương trình, ta thu được phương án nghiệm duy nhất đồng dư với hệ:"
  });

  return {
    success: true,
    steps,
    solution: { x: current_r.toString(), M: current_m.toString() }
  };
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    a %= b;
    [a, b] = [b, a];
  }
  return a;
}

// --- Factorization ---

function powerMod(base: bigint, exp: bigint, mod: bigint): bigint {
  let res = 1n;
  base = base % mod;
  while (exp > 0n) {
    if (exp % 2n === 1n) res = (res * base) % mod;
    base = (base * base) % mod;
    exp = exp / 2n;
  }
  return res;
}

export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if (n % 2n === 0n || n % 3n === 0n) return false;

  // Miller-Rabin deterministic for 64-bit
  let d = n - 1n;
  let s = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    s++;
  }

  const bases = [2n, 325n, 9375n, 28178n, 450775n, 9780504n, 1795265022n];
  for (const a of bases) {
    if (a % n === 0n) continue;
    let x = powerMod(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let composite = true;
    for (let r = 1n; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        composite = false;
        break;
      }
    }
    if (composite) return false;
  }
  return true;
}

function pollardRho(n: bigint): bigint {
  if (n % 2n === 0n) return 2n;
  if (isPrime(n)) return n;

  let x = 2n;
  let y = 2n;
  let d = 1n;
  let c = 1n;

  const f = (x: bigint, c: bigint, n: bigint) => (x * x + c) % n;

  while (d === 1n) {
    x = f(x, c, n);
    y = f(f(y, c, n), c, n);
    d = gcd(x > y ? x - y : y - x, n);
    if (d === n) {
      // Failure, try different c
      x = 2n;
      y = 2n;
      d = 1n;
      c++;
    }
  }
  return d;
}

export function factorize(n: bigint): Map<string, number> {
  const factors = new Map<string, number>();
  
  const getFactors = (num: bigint) => {
    if (num === 1n) return;
    if (isPrime(num)) {
      factors.set(num.toString(), (factors.get(num.toString()) || 0) + 1);
      return;
    }
    const d = pollardRho(num);
    getFactors(d);
    getFactors(num / d);
  };

  getFactors(n);
  return factors;
}

// --- Multifactorial ---

export function v_p_multifactorial(N: number, m: number, p: number): number {
  if (N < p || m < 1) return 0;
  let total = 0;
  let x = N;
  while (x > 0) {
    let temp = x;
    while (temp % p === 0) {
      total++;
      temp /= p;
    }
    x -= m;
  }
  return total;
}

// --- Dice Probability ---

export function waysSumDice(r: number, n: number, s: number): bigint {
  if (r < n || r > n * s) return 0n;
  let total = 0n;
  const kmax = Math.floor((r - n) / s);
  
  for (let k = 0; k <= kmax; k++) {
    const sign = k % 2 === 1 ? -1n : 1n;
    const comb1 = combinations(BigInt(n), BigInt(k));
    const top = BigInt(r - s * k - 1);
    const bottom = BigInt(n - 1);
    const comb2 = combinations(top, bottom);
    total += sign * comb1 * comb2;
  }
  return total;
}

function combinations(n: bigint, k: bigint): bigint {
  if (k < 0n || k > n) return 0n;
  if (k === 0n || k === n) return 1n;
  if (k > n / 2n) k = n - k;
  
  let res = 1n;
  for (let i = 1n; i <= k; i++) {
    res = res * (n - i + 1n) / i;
  }
  return res;
}

// --- Linear Solver ---

export function solveLinearSystem(matrix: Fraction[][], b: Fraction[]): Fraction[] | null {
  const n = matrix.length;
  const A = matrix.map((row, i) => [...row, b[i]]);
  
  for (let i = 0; i < n; i++) {
    let pivot = i;
    for (let j = i + 1; j < n; j++) {
      if (A[j][i].abs().compare(A[pivot][i].abs()) > 0) pivot = j;
    }
    
    [A[i], A[pivot]] = [A[pivot], A[i]];
    
    if (A[i][i].equals(0)) return null;
    
    for (let j = i + 1; j < n; j++) {
      const factor = A[j][i].div(A[i][i]);
      for (let k = i; k <= n; k++) {
        A[j][k] = A[j][k].sub(factor.mul(A[i][k]));
      }
    }
  }
  
  const x = new Array(n).fill(new Fraction(0));
  for (let i = n - 1; i >= 0; i--) {
    let sum = A[i][n];
    for (let j = i + 1; j < n; j++) {
      sum = sum.sub(A[i][j].mul(x[j]));
    }
    x[i] = sum.div(A[i][i]);
  }
  
  return x;
}

function gcdNum(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) {
    a %= b;
    [a, b] = [b, a];
  }
  return a;
}

function simplifyRadical(n: number): [number, number] {
  if (n < 0) return [1, n];
  if (n === 0) return [0, 0];
  if (n === 1) return [1, 1];
  let coeff = 1;
  let inside = n;
  for (let i = Math.floor(Math.sqrt(inside)); i >= 2; i--) {
    if (inside % (i * i) === 0) {
      coeff *= i;
      inside /= (i * i);
    }
  }
  return [coeff, inside];
}

function getDivisors(n: number): number[] {
  const divs = [];
  const absN = Math.abs(Math.round(n));
  if (absN === 0) return [0];
  for (let i = 1; i * i <= absN; i++) {
    if (absN % i === 0) {
      divs.push(i);
      if (i * i !== absN) divs.push(absN / i);
    }
  }
  return divs;
}

function formatCanonical(a: number, b: number, c: number, d: number, e: number): string {
  // Represents (a*sqrt(b) + c*sqrt(d)) / e
  
  // 1. Simplify radicals (Extract perfect squares)
  let [a_c, b_i] = simplifyRadical(b);
  a *= a_c; b = b_i;
  let [c_c, d_i] = simplifyRadical(d);
  c *= c_c; d = d_i;

  // 2. Combine like radical terms if possible
  if (b === d && b !== 0) {
    a += c;
    c = 0;
    d = 1;
  }
  
  // 3. Handle zero cases and structural normalization
  if (a === 0 && c === 0) return "0";
  if (a === 0) { a = c; b = d; c = 0; d = 1; }
  if (c === 0) { d = 1; }

  // 4. Maintain consistent ordering: asqrt(b) + csqrt(d) with b < d
  if (c !== 0 && b > d) {
    [a, b, c, d] = [c, d, a, b];
  }

  // 5. Fraction normalization (Reduce to lowest terms)
  let common = gcdNum(a, gcdNum(c, e));
  a /= common;
  c /= common;
  e /= common;

  // 6. Sign normalization: Avoid leading negatives in denominator, push to numerator
  if (e < 0) {
    a = -a;
    c = -c;
    e = -e;
  }

  // 7. Formatting with output cleanliness rules
  const formatTerm = (coeff: number, inside: number, isFirst: boolean) => {
    if (coeff === 0) return "";
    let s = "";
    if (coeff < 0) {
      s = isFirst ? "-" : " - ";
    } else if (!isFirst) {
      s = " + ";
    }
    
    let absCoeff = Math.abs(coeff);
    let term = "";
    if (inside === 1) {
      term = absCoeff.toString();
    } else {
      // Remove coefficient 1: 1*sqrt(2) -> sqrt(2)
      let cPart = absCoeff === 1 ? "" : absCoeff.toString();
      term = cPart + "√" + inside;
    }
    return s + term;
  };

  let t1 = formatTerm(a, b, true);
  let t2 = formatTerm(c, d, t1 === "");
  
  let numerator = t1 + t2;
  
  // Denominator constraint: e != 1 must hold in the final output. If e = 1 -> remove it entirely.
  if (e === 1) return numerator;
  
  // Remove redundant parentheses: Only use if numerator has multiple terms
  const isSingleTerm = (a === 0 || c === 0);
  if (isSingleTerm) {
    return `${numerator}/${e}`;
  }
  
  return `(${numerator})/${e}`;
}

function identifyCanonical(x: number): string | null {
  const tolerance = 1e-10;

  // 1. Integer / Simple Fraction a/e
  for (let e = 1; e <= 500; e++) {
    const a = Math.round(x * e);
    if (Math.abs(x - a / e) < tolerance) {
      return formatCanonical(a, 1, 0, 1, e);
    }
  }

  // 2. Simple Radical a*sqrt(b)/e
  const x2 = x * x;
  for (let e = 1; e <= 200; e++) {
    const nVal = x2 * e * e;
    const n = Math.round(nVal);
    if (n > 0 && Math.abs(nVal - n) < tolerance) {
      return formatCanonical(x < 0 ? -1 : 1, n, 0, 1, e);
    }
  }

  // 3. Quadratic form (a + c*sqrt(d)) / e
  for (let e = 1; e <= 150; e++) {
    for (let a = -200; a <= 200; a++) {
      const qVal = Math.pow(e * x - a, 2);
      const q = Math.round(qVal);
      if (q > 0 && Math.abs(qVal - q) < tolerance) {
        // Check if it's actually a good fit
        if (Math.abs(x - (a + Math.sign(e * x - a) * Math.sqrt(q)) / e) < tolerance) {
          return formatCanonical(a, 1, (e * x - a) >= 0 ? 1 : -1, q, e);
        }
      }
    }
  }

  // 4. Two radicals (a*sqrt(b) + c*sqrt(d)) / e
  // Limited range for performance, but covers common textbook cases
  for (let e = 1; e <= 30; e++) {
    for (let b = 2; b <= 30; b++) {
      for (let d = b + 1; d <= 31; d++) {
        const sqrtB = Math.sqrt(b);
        const sqrtD = Math.sqrt(d);
        for (let a = -15; a <= 15; a++) {
          if (a === 0) continue;
          const rem = e * x - a * sqrtB;
          const cVal = rem / sqrtD;
          const c = Math.round(cVal);
          if (c !== 0 && Math.abs(cVal - c) < tolerance) {
            return formatCanonical(a, b, c, d, e);
          }
        }
      }
    }
  }

  return null;
}

export function formatRoot(val: number | Decimal): string {
  const numVal = typeof val === 'number' ? val : val.toNumber();
  const identified = identifyCanonical(numVal);
  if (identified) return identified;
  
  let str = typeof val === 'number' ? val.toFixed(7) : val.toFixed(7);
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  return str;
}

function formatIntervalNotation(inter: any): string {
  const startStr = inter.start === -Infinity ? "-∞" : formatRoot(inter.start);
  const endStr = inter.end === Infinity ? "+∞" : formatRoot(inter.end);
  const startBracket = inter.startClosed ? "[" : "(";
  const endBracket = inter.endClosed ? "]" : ")";
  return `${startBracket}${startStr}, ${endStr}${endBracket}`;
}

function getFactors(n: number): number[] {
  const absN = Math.abs(Math.round(n * 1000) / 1000);
  const factors = new Set<number>();
  for (let i = 1; i <= Math.sqrt(absN); i++) {
    if (absN % i === 0) {
      factors.add(i);
      factors.add(absN / i);
    }
  }
  return Array.from(factors);
}

function solveQuarticNumerical(coeffs: number[]): {re: number, im: number}[] {
  const n = coeffs.length - 1;
  const a = coeffs[0];
  const p = coeffs.map(c => c / a);
  
  let maxCoeff = 0;
  for (let i = 1; i <= n; i++) {
    maxCoeff = Math.max(maxCoeff, Math.abs(p[i]));
  }
  const R = 1 + maxCoeff;

  let z: {re: number, im: number}[] = [];
  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n + 0.1;
    z.push({ re: R * Math.cos(angle), im: R * Math.sin(angle) });
  }

  const evalP = (x: {re: number, im: number}) => {
    let resRe = 0;
    let resIm = 0;
    for (let i = 0; i <= n; i++) {
      const pVal = p[i];
      const pow = n - i;
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < pow; j++) {
        const nextRe = curRe * x.re - curIm * x.im;
        const nextIm = curRe * x.im + curIm * x.re;
        curRe = nextRe;
        curIm = nextIm;
      }
      resRe += pVal * curRe;
      resIm += pVal * curIm;
    }
    return { re: resRe, im: resIm };
  };

  for (let iter = 0; iter < 400; iter++) {
    let maxDiff = 0;
    const nextZ = [...z];
    for (let i = 0; i < n; i++) {
      const pz = evalP(z[i]);
      let denomRe = 1;
      let denomIm = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const diffRe = z[i].re - z[j].re;
        const diffIm = z[i].im - z[j].im;
        const nextDenomRe = denomRe * diffRe - denomIm * diffIm;
        const nextDenomIm = denomRe * diffIm + denomIm * diffRe;
        denomRe = nextDenomRe;
        denomIm = nextDenomIm;
      }
      
      const magSq = denomRe * denomRe + denomIm * denomIm;
      if (magSq < 1e-30) continue;

      const deltaRe = (pz.re * denomRe + pz.im * denomIm) / magSq;
      const deltaIm = (pz.im * denomRe - pz.re * denomIm) / magSq;
      
      nextZ[i] = { re: z[i].re - deltaRe, im: z[i].im - deltaIm };
      maxDiff = Math.max(maxDiff, Math.sqrt(deltaRe * deltaRe + deltaIm * deltaIm));
    }
    z = nextZ;
    if (maxDiff < 1e-15) break;
  }
  return z;
}

export function parseMath(input: string): number {
  if (!input || input.trim() === "") return NaN;
  
  // Pre-process common typos or incomplete functions
  let processed = input.trim().toLowerCase();
  
  // Handle common prefixes to avoid "Undefined symbol" errors during typing
  const commonPrefixes = ["sq", "sqr", "si", "co", "ta", "lo", "ab"];
  if (commonPrefixes.some(p => processed === p)) return NaN;

  try {
    // If it ends with an operator or open paren, it's incomplete
    if (/[+\-*/^(\s]$/.test(processed)) {
      // Try to evaluate the part before the operator
      try {
        const partial = processed.replace(/[+\-*/^(\s]+$/, "");
        if (partial) {
          const res = math.evaluate(partial);
          if (typeof res === 'number') return res;
          if (res && typeof res.toNumber === 'function') return res.toNumber();
        }
      } catch {
        // ignore
      }
      return NaN;
    }

    const res = math.evaluate(processed);
    if (typeof res === 'number') return res;
    if (res && typeof res.toNumber === 'function') return res.toNumber();
    return parseFloat(processed);
  } catch (e) {
    // Check for specific mathjs errors to return NaN instead of throwing/logging
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("Unexpected end of expression") || 
        msg.includes("Undefined symbol") || 
        msg.includes("Parenthesis ) expected") ||
        msg.includes("Unexpected type of argument")) {
      return NaN;
    }
    return parseFloat(input);
  }
}

export function solvePolynomialInequation(coeffs: number[], sign: string): any {
  // Remove leading zeros
  let actualCoeffs = [...coeffs];
  while (actualCoeffs.length > 1 && Math.abs(actualCoeffs[0]) < 1e-12) {
    actualCoeffs.shift();
  }
  
  const degree = actualCoeffs.length - 1;
  if (degree > 4) return null; 
  
  const evalPoly = (x: number) => {
    let res = 0;
    for (let i = 0; i <= degree; i++) {
      res += actualCoeffs[i] * Math.pow(x, degree - i);
    }
    return res;
  };

  if (degree === 0) {
    const val = actualCoeffs[0];
    const isTrue = (sign === ">" && val > 1e-12) || (sign === ">=" && val > -1e-12) || (sign === "<" && val < -1e-12) || (sign === "<=" && val < 1e-12);
    return {
      roots: [],
      symbolic: isTrue ? "x ∈ ℝ" : "∅",
      numeric: isTrue ? "x ∈ ℝ" : "∅",
      intervals: isTrue ? [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false }] : []
    };
  }

  if (degree === 1) {
    Decimal.set({ precision: 30 });
    const a = new Decimal(actualCoeffs[0]);
    const b = new Decimal(actualCoeffs[1]);
    const root = b.negated().dividedBy(a);
    const isGreater = sign.includes(">");
    const isClosed = sign.includes("=");
    const leftTrue = (actualCoeffs[0] > 0 && !isGreater) || (actualCoeffs[0] < 0 && isGreater);
    
    const rootStr = formatRoot(root);
    let symbolic = "";
    let intervals: any[] = [];
    
    if (leftTrue) {
      symbolic = `x ${isClosed ? "≤" : "<"} ${rootStr}`;
      intervals = [{ start: -Infinity, end: root, startClosed: false, endClosed: isClosed }];
    } else {
      symbolic = `x ${isClosed ? "≥" : ">"} ${rootStr}`;
      intervals = [{ start: root, end: Infinity, startClosed: isClosed, endClosed: false }];
    }
    
    return { roots: [root], symbolic, numeric: symbolic, intervals };
  }

  let rootsRaw: any[] = [];

  if (degree === 2) {
    Decimal.set({ precision: 30 });
    const a = new Decimal(actualCoeffs[0]);
    const b = new Decimal(actualCoeffs[1]);
    const c = new Decimal(actualCoeffs[2]);
    const delta = b.times(b).minus(a.times(c).times(4));
    
    if (delta.gte(0)) {
      const sqrtDelta = delta.sqrt();
      const r1 = b.negated().minus(sqrtDelta).dividedBy(a.times(2));
      const r2 = b.negated().plus(sqrtDelta).dividedBy(a.times(2));
      // We can just put them in rootsRaw as numbers to be refined, or as Decimals directly.
      // But the refinement loop expects objects with .re or numbers.
      // Let's just put them as numbers, the refinement loop will handle them.
      rootsRaw = [r1.toNumber(), r2.toNumber()];
    } else {
      rootsRaw = [];
    }
  } else if (degree >= 3) {
    // Try to find rational roots first to deflate the polynomial
    let currentCoeffs = [...actualCoeffs];
    let foundRoots: number[] = [];
    
    const tryDeflate = () => {
      const a0 = Math.abs(currentCoeffs[currentCoeffs.length - 1]);
      const an = Math.abs(currentCoeffs[0]);
      
      if (a0 < 1e-10) {
        foundRoots.push(0);
        currentCoeffs.pop();
        return true;
      }

      // Simple rational root test for small integers
      if (Math.abs(Math.round(a0) - a0) < 1e-9 && Math.abs(Math.round(an) - an) < 1e-9) {
        const p = Math.abs(Math.round(a0));
        const q = Math.abs(Math.round(an));
        const pDivs = getDivisors(p);
        const qDivs = getDivisors(q);
        
        for (const pv of pDivs) {
          for (const qv of qDivs) {
            const candidates = [pv/qv, -pv/qv];
            for (const root of candidates) {
              let val = 0;
              for (let i = 0; i < currentCoeffs.length; i++) {
                val = val * root + currentCoeffs[i];
              }
              if (Math.abs(val) < 1e-10) {
                foundRoots.push(root);
                // Synthetic division
                const nextCoeffs = [currentCoeffs[0]];
                for (let i = 1; i < currentCoeffs.length - 1; i++) {
                  nextCoeffs.push(currentCoeffs[i] + nextCoeffs[i - 1] * root);
                }
                currentCoeffs = nextCoeffs;
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    while (currentCoeffs.length > 3 && tryDeflate());

    if (currentCoeffs.length === 3) {
      Decimal.set({ precision: 30 });
      const a = new Decimal(currentCoeffs[0]);
      const b = new Decimal(currentCoeffs[1]);
      const c = new Decimal(currentCoeffs[2]);
      const delta = b.times(b).minus(a.times(c).times(4));
      if (delta.gte(0)) {
        const sqrtDelta = delta.sqrt();
        foundRoots.push(b.negated().minus(sqrtDelta).dividedBy(a.times(2)).toNumber());
        foundRoots.push(b.negated().plus(sqrtDelta).dividedBy(a.times(2)).toNumber());
      }
    } else if (currentCoeffs.length > 3) {
      // Fallback to numerical for remaining part
      let remainingRoots: any[] = [];
      if (currentCoeffs.length === 4) {
        const rev = [...currentCoeffs].reverse();
        remainingRoots = (math as any).polynomialRoot(...rev);
      } else {
        remainingRoots = solveQuarticNumerical(currentCoeffs);
      }
      remainingRoots.forEach(r => {
        const val = typeof r === 'number' ? r : r.re;
        const im = typeof r === 'number' ? 0 : Math.abs(r.im);
        if (im < 1e-6) foundRoots.push(val);
      });
    }
    rootsRaw = foundRoots;
  } else {
    return null;
  }
  
  // Filter real roots
  const roots: any[] = [];
  rootsRaw.forEach((r: any) => {
    const candidate = typeof r === 'number' ? r : r.re;
    const imPart = typeof r === 'number' ? 0 : Math.abs(r.im);
    
    // Newton refinement for real root using Decimal for 25-digit precision
    Decimal.set({ precision: 30 });
    let refined = new Decimal(candidate);
    let fBig = new Decimal(0);
    for (let i = 0; i < 40; i++) {
      fBig = new Decimal(0);
      let dfBig = new Decimal(0);
      for (let j = 0; j <= degree; j++) {
        const term = refined.pow(degree - j);
        fBig = fBig.plus(term.times(actualCoeffs[j]));
        if (degree - j > 0) {
          dfBig = dfBig.plus(refined.pow(degree - j - 1).times(actualCoeffs[j]).times(degree - j));
        }
      }
      if (dfBig.abs().lt(1e-25)) break;
      const delta = fBig.dividedBy(dfBig);
      refined = refined.minus(delta);
      if (delta.abs().lt(1e-25)) break;
    }
    
    if (fBig.abs().lt(1e-4) || imPart < 1e-3) {
      roots.push(refined as any);
    }
  });
  
  roots.sort((a: any, b: any) => a.minus(b).toNumber());
  
  // Remove duplicates with a tolerance suitable for multiple roots
  const uniqueRoots: any[] = [];
  if (roots.length > 0) {
    uniqueRoots.push(roots[0]);
    for (let i = 1; i < roots.length; i++) {
      if (roots[i].minus(roots[i-1]).abs().toNumber() > 1e-3) {
        uniqueRoots.push(roots[i]);
      }
    }
  }

  const check = (x: any) => {
    let val = new Decimal(0);
    const xBig = new Decimal(x);
    for (let i = 0; i <= degree; i++) {
      val = val.plus(xBig.pow(degree - i).times(actualCoeffs[i]));
    }
    const eps = new Decimal('1e-12');
    if (sign === ">") return val.gt(eps);
    if (sign === ">=") return val.gt(eps.negated());
    if (sign === "<") return val.lt(eps.negated());
    if (sign === "<=") return val.lt(eps);
    return false;
  };

  const isClosed = sign.includes("=");
  const intervals: any[] = [];
  const testPoints: any[] = [];
  
  if (uniqueRoots.length === 0) {
    testPoints.push(0);
  } else {
    testPoints.push(uniqueRoots[0].minus(1));
    for (let i = 0; i < uniqueRoots.length - 1; i++) {
      testPoints.push(uniqueRoots[i].plus(uniqueRoots[i+1]).dividedBy(2));
    }
    testPoints.push(uniqueRoots[uniqueRoots.length - 1].plus(1));
  }

  const results = testPoints.map(p => check(p));
  
  const intervalParts: string[] = [];
  
  if (uniqueRoots.length === 0) {
    if (results[0]) {
      intervals.push({ start: -Infinity, end: Infinity, startClosed: false, endClosed: false });
      intervalParts.push("x ∈ ℝ");
    } else {
      intervalParts.push("∅");
    }
  } else {
    const activeIntervals: {start: any, end: any, startClosed: boolean, endClosed: boolean}[] = [];
    
    // Check (-inf, r0)
    if (results[0]) {
      activeIntervals.push({ start: -Infinity, end: uniqueRoots[0], startClosed: false, endClosed: isClosed });
    }
    
    // Check (ri, ri+1)
    for (let i = 0; i < uniqueRoots.length - 1; i++) {
      if (results[i+1]) {
        activeIntervals.push({ start: uniqueRoots[i], end: uniqueRoots[i+1], startClosed: isClosed, endClosed: isClosed });
      }
    }
    
    // Check (rn, inf)
    if (results[results.length - 1]) {
      activeIntervals.push({ start: uniqueRoots[uniqueRoots.length - 1], end: Infinity, startClosed: isClosed, endClosed: false });
    }

    // Merge adjacent intervals if boundary is included OR detect "x ≠ a"
    const merged: typeof activeIntervals = [];
    if (activeIntervals.length > 0) {
      let current = { ...activeIntervals[0] };
      for (let i = 1; i < activeIntervals.length; i++) {
        const next = activeIntervals[i];
        // If they touch at a root
        const currentEnd = (typeof current.end === 'number' || current.end === Infinity || current.end === -Infinity) ? current.end : current.end.toNumber();
        const nextStart = (typeof next.start === 'number' || next.start === Infinity || next.start === -Infinity) ? next.start : next.start.toNumber();
        if (Math.abs(currentEnd - nextStart) < 1e-10) {
          if (isClosed) {
            // Merge fully: [a, b] + [b, c] = [a, c]
            current.end = next.end;
            current.endClosed = next.endClosed;
          } else {
            // They touch at a point that is EXCLUDED (strict inequality)
            // Keep them separate to allow "x ≠ a" detection later
            merged.push(current);
            current = { ...next };
          }
        } else {
          merged.push(current);
          current = { ...next };
        }
      }
      merged.push(current);
    }

    // Convert merged intervals to symbolic strings
    if (merged.length === 0) {
      // Check if any specific roots satisfy the equation (only for non-strict)
      const satisfyingRoots = isClosed ? uniqueRoots.filter(r => {
        let val = new Decimal(0);
        for (let i = 0; i <= degree; i++) {
          val = val.plus(r.pow(degree - i).times(actualCoeffs[i]));
        }
        return val.abs().lt(1e-9);
      }) : [];
      if (satisfyingRoots.length > 0) {
        const rootStrings = satisfyingRoots.map(r => `x = ${formatRoot(r)}`);
        intervalParts.push(rootStrings.join(", "));
      } else {
        intervalParts.push("∅");
      }
    } else {
      // Detect "x ≠ a" pattern: (-inf, a) U (a, inf)
      const m0End = (typeof merged[0].end === 'number' || merged[0].end === Infinity || merged[0].end === -Infinity) ? merged[0].end : merged[0].end.toNumber();
      const m1Start = (typeof merged[1].start === 'number' || merged[1].start === Infinity || merged[1].start === -Infinity) ? merged[1].start : merged[1].start.toNumber();
      if (merged.length === 2 && merged[0].start === -Infinity && merged[1].end === Infinity && Math.abs(m0End - m1Start) < 1e-10) {
        intervalParts.push(`x ≠ ${formatRoot(merged[0].end)}`);
      } else if (merged.length === 1 && merged[0].start === -Infinity && merged[0].end === Infinity) {
        intervalParts.push("x ∈ ℝ");
      } else {
        // Provide both interval notation and inequality notation if they differ significantly
        // or just use interval notation as it's more canonical for "solution set"
        const intervalStrings = merged.map(inter => formatIntervalNotation(inter));
        intervalParts.push(intervalStrings.join(" ∪ "));
      }
    }
    
    intervals.push(...merged);
  }

  const symbolic = intervalParts.length === 0 ? "∅" : intervalParts.join(" ∪ ");
  
  return {
    roots: uniqueRoots,
    symbolic,
    numeric: symbolic,
    intervals 
  };
}
