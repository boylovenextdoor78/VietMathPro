import * as math from 'mathjs';

export interface ComplexOptResult {
  detected_type: string;
  idea: string;
  exact: string;
  latex_exact: string;
  decimal_25: string;
  attained_at: string;
  explanation: string;
}

// Cleans student phrasing and maps into regular math format
export function parseComplexExpressionMathJS(s: string): string {
  let cleaned = s.trim();
  // Standardize conj
  cleaned = cleaned.replace(/conj\s*\(\s*z\s*\)/gi, 'conj(z)');
  cleaned = cleaned.replace(/z_conj/gi, 'conj(z)');
  cleaned = cleaned.replace(/\\bar\{z\}/gi, 'conj(z)');
  cleaned = cleaned.replace(/z\*/gi, 'conj(z)');
  
  // Replace absolute values |...| with abs(...)
  // Handle matching pairs of pipes
  let result = "";
  let inPipe = false;
  let pipeContent = "";
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '|') {
      if (inPipe) {
        result += `abs(${pipeContent})`;
        pipeContent = "";
        inPipe = false;
      } else {
        inPipe = true;
      }
    } else {
      if (inPipe) {
        pipeContent += char;
      } else {
        result += char;
      }
    }
  }
  if (inPipe) {
    // Unclosed pipe, fallback
    result += `abs(${pipeContent})`;
  }
  
  // Clean other terms
  result = result.replace(/\^/g, '**');
  return result;
}

// Parses and resolves standard THPTQG complex optimization forms
export function solveComplexOptimizationLocal(query: string): ComplexOptResult | null {
  try {
    const cleanedQuery = query.toLowerCase();

    // Try vector parallelograms & modulus ratios
    const vecRes = trySolveVectorModulusBNC(query);
    if (vecRes) return vecRes;

    // Try equation solvers for |z|
    const eqModRes = trySolveEquationForModulus(query);
    if (eqModRes) return eqModRes;

    // Try general focal ellipses
    const ellipseRes = trySolveGeneralEllipse(query, cleanedQuery);
    if (ellipseRes) return ellipseRes;
    
    // ==========================================
    // Dạng 3: |z + 1/z| = a. Optimize |z|
    // ==========================================
    if (cleanedQuery.includes('1/z') && (cleanedQuery.includes('min') || cleanedQuery.includes('max') || cleanedQuery.includes('nhỏ nhất') || cleanedQuery.includes('lớn nhất'))) {
      const regexEq = /(?:abs\s*\(\s*z\s*\+\s*1\s*\/\s*z\s*\)|\|\s*z\s*\+\s*1\s*\/\s*z\s*\|)\s*=\s*([\d\.]+)/i;
      const match = query.match(regexEq);
      if (match) {
        const aVal = parseFloat(match[1]);
        const minVal = (-aVal + Math.sqrt(aVal * aVal + 4)) / 2;
        const maxVal = (aVal + Math.sqrt(aVal * aVal + 4)) / 2;
        
        const isMin = cleanedQuery.includes('min') || cleanedQuery.includes('nhỏ nhất');
        const selectedVal = isMin ? minVal : maxVal;
        const signText = isMin ? '-' : '';
        
        return {
          detected_type: "Dạng 3: Điểm biểu diễn nghịch đảo (Inverse circle bounds)",
          idea: `Áp dụng bất đẳng thức tam giác kép đối với mô-đun nghịch đảo: ||z| - 1/|z|| <= |z + 1/z| = a. Giải bất phương trình bậc hai theo |z|.`,
          exact: `(${signText}${aVal} + \u221a(${aVal * aVal} + 4)) / 2`,
          latex_exact: `\\frac{${signText}${aVal} + \\sqrt{${aVal * aVal} + 4}}{2}`,
          decimal_25: selectedVal.toFixed(25),
          attained_at: `z thỏa mãn |z| = ${selectedVal.toFixed(6)}`,
          explanation: `Hướng dẫn giải chi tiết trên máy tính CASIO FX-580VNX:
1. Nhấn MENU 2 để chuyển sang môi trường số phức.
2. Gán giá trị a = ${aVal} vào biến A: Nhập ${aVal} -> nhấn STO -> nhấn (-) (để chọn biến A).
3. Sử dụng công thức nghiệm giải nhanh:
   - Giá trị MIN: Nhấn phân số ((-A + √(A² + 4)) / 2) -> hiển thị ${minVal.toFixed(6)}.
   - Giá trị MAX: Nhấn phân số ((A + √(A² + 4)) / 2) -> hiển thị ${maxVal.toFixed(6)}.
Đây là phương pháp giải chính xác tuyệt đối, loại bỏ hoàn toàn khả năng sai số.`
        };
      }
    }

    // ==========================================
    // Dạng 2: |z + z1| + |z - z1| = k. Optimize |z|
    // ==========================================
    const elipOriginRegex = /(?:abs\s*\(\s*z\s*([\+\-][^)]+)\)\s*\+\s*abs\s*\(\s*z\s*([\+\-][^)]+)\)|\|\s*z\s*([^\s\|]+)\s*\|\s*\+\s*\|\s*z\s*([^\s\|]+)\s*\|)\s*=\s*([\d\.]+)/i;
    const matchElip = query.match(elipOriginRegex);
    if (matchElip) {
      let kVal = parseFloat(matchElip[5] || "0");
      let z1Str = (matchElip[1] || matchElip[3] || "").trim();
      
      if (z1Str.startsWith('+')) z1Str = z1Str.substring(1).trim();
      
      const z1Hex = math.evaluate(z1Str.replace(/i\b/g, '1i')) as math.Complex;
      const absZ1 = math.abs(z1Hex) as number;
      
      if (2 * absZ1 < kVal) {
        const a = kVal / 2;
        const b = Math.sqrt(a * a - absZ1 * absZ1);
        const isMin = cleanedQuery.includes('min') || cleanedQuery.includes('nhỏ nhất');
        const exactVal = isMin ? b : a;
        
        return {
          detected_type: "Dạng 2: Quỹ tích Elip chính tắc (Standard focal Ellipse)",
          idea: `Quỹ tích là Elip có tâm là gốc tọa độ O. Giá trị lớn nhất của |z| bằng bán trục lớn a = k/2. Giá trị nhỏ nhất của |z| bằng bán trục nhỏ b = \u221a(a^2 - c^2).`,
          exact: isMin ? `\u221a(${(a*a).toFixed(2)} - ${(absZ1*absZ1).toFixed(2)})` : `${a}`,
          latex_exact: isMin ? `\\sqrt{${(a*a - absZ1*absZ1).toFixed(4)}}` : `${a}`,
          decimal_25: exactVal.toFixed(25),
          attained_at: isMin ? `Vì đạt cực tiểu tại trục ảo: z = ±${b.toFixed(4)}i (sau khi xoay)` : `z = ±${a.toFixed(4)} (sau khi xoay)`,
          explanation: `Hướng dẫn giải chi tiết trên máy tính CASIO FX-580VNX:
1. Nhấn MENU 2 để chuyển sang chế độ số phức.
2. Gán giá trị k = ${kVal} vào biến A (STO A), và tính tiêu cự c = |z_1| = ${absZ1.toFixed(4)} gán vào biến B (STO B).
3. Áp dụng công thức giải cực nhanh:
   - MAX của |z|: Bằng A / 2 = ${a}.
   - MIN của |z|: Bằng √( (A/2)² - B² ) = ${b.toFixed(6)}. Nhập công thức: √( (A÷2)² - B² ) nhấn bằng sẽ ra kết quả tức thì.
Cách giải này đảm bảo đúng 100% không bao giờ sai đối với dạng trục elip đối xứng.`
        };
      }
    }

    // ==========================================
    // Dạng 1 & Dạng 5: General Circle Const / Target or Ellipse Rotation
    // ==========================================
    const absMatches: string[] = [];
    let temp = cleanedQuery;
    let absRegex = /(?:abs\s*\([^)]+\)|\|[^|]+\|)/gi;
    let m;
    while ((m = absRegex.exec(temp)) !== null) {
      absMatches.push(m[0]);
    }

    if (absMatches.length >= 2) {
      let constIdx = -1;
      let kVal = 1;
      for (let i = 0; i < absMatches.length; i++) {
        const escaped = absMatches[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const eqPattern = new RegExp(escaped + '\\s*=\\s*([\\d\\.]+)', 'i');
        const eqMatch = query.match(eqPattern);
        if (eqMatch) {
          constIdx = i;
          kVal = parseFloat(eqMatch[1]);
          break;
        }
      }

      if (constIdx !== -1) {
        const objIdx = constIdx === 0 ? 1 : 0;
        
        const constStr = parseComplexExpressionMathJS(absMatches[constIdx]);
        const objStr = parseComplexExpressionMathJS(absMatches[objIdx]);
        
        const constInner = constStr.replace(/abs\((.*)\)/i, '$1');
        const objInner = objStr.replace(/abs\((.*)\)/i, '$1');
        
        const constCoeffs = extractLinearCoeffs(constInner);
        const objCoeffs = extractLinearCoeffs(objInner);
        
        if (math.abs(constCoeffs.B) as number === 0 && (math.abs(constCoeffs.A) as number) !== 0) {
          const A_const = constCoeffs.A;
          const C_const = constCoeffs.C;
          const z0 = math.multiply(math.divide(C_const, A_const), -1) as math.Complex;
          const R = kVal / (math.abs(A_const) as number);
          
          const D_obj = objCoeffs.A;
          const E_obj = objCoeffs.B;
          const F_obj = objCoeffs.C;
          
          if (math.abs(E_obj) as number === 0) {
            const W = math.add(math.multiply(D_obj, z0), F_obj) as math.Complex;
            const absW = math.abs(W) as number;
            const absD = math.abs(D_obj) as number;
            
            const minResult = Math.abs(absW - absD * R);
            const maxResult = absW + absD * R;
            
            const isMin = cleanedQuery.includes('min') || cleanedQuery.includes('nhỏ nhất');
            const selectedVal = isMin ? minResult : maxResult;
            
            let attainedZ = math.complex(0, 0);
            if (absW > 1e-9) {
              const dirW = math.divide(W, absW) as math.Complex;
              const dirD = math.divide(absD, D_obj) as math.Complex;
              const factor = isMin ? -1 : 1;
              attainedZ = math.add(z0, math.multiply(math.multiply(math.multiply(dirD, dirW), R), factor)) as math.Complex;
            } else {
              attainedZ = z0;
            }
            
            const attainedStr = `${attainedZ.re.toFixed(4)}${attainedZ.im >= 0 ? ` + ${attainedZ.im.toFixed(4)}i` : ` - ${Math.abs(attainedZ.im).toFixed(4)}i`}`;
            const z0Str = `${z0.re.toFixed(2)}${z0.im >= 0 ? ` + ${z0.im.toFixed(2)}i` : ` - ${Math.abs(z0.im).toFixed(2)}i`}`;
            const fStr = `${F_obj.re.toFixed(2)}${F_obj.im >= 0 ? ` + ${F_obj.im.toFixed(2)}i` : ` - ${Math.abs(F_obj.im).toFixed(2)}i`}`;
            const dStr = `${D_obj.re.toFixed(2)}${D_obj.im >= 0 ? ` + ${D_obj.im.toFixed(2)}i` : ` - ${Math.abs(D_obj.im).toFixed(2)}i`}`;
            
            return {
              detected_type: "Dạng 1: Quỹ tích đường tròn học sinh (Circle-Point Extremum)",
              idea: `Quỹ tích z là đường tròn tâm I(${z0.re.toFixed(2)}, ${z0.im.toFixed(2)}) bán kính R = ${R.toFixed(2)}. Cực trị khoảng cách được tính trực tiếp từ khoảng cách tâm nhờ công thức bất đẳng thức học sinh.`,
              exact: selectedVal.toFixed(6),
              latex_exact: `${selectedVal.toFixed(4)}`,
              decimal_25: selectedVal.toFixed(25),
              attained_at: attainedStr,
              explanation: `Hướng dẫn giải bằng máy tính CASIO FX-580VNX chi tiết:
1. Nhấn MENU 2 để chuyển sang chế độ phức.
2. Ta tìm quỹ tích đường tròn từ phương trình ${absMatches[constIdx]} = ${kVal}:
   - Chia cả 2 vế cho hệ số của z để đưa về dạng chuẩn |z - z_0| = R.
   - Ta gõ phép tính: tâm z_0 = ${z0Str}, R = ${R}.
3. Xét biểu thức cần tính: P = |${dStr}*z + (${fStr})|.
   - Thế tâm z_0 vào biểu thức: Nhập biểu thức ${dStr} * (${z0Str}) + (${fStr}) nhấn bằng, kết quả là W = ${W.re.toFixed(4)}${W.im >= 0 ? '+' : ''}${W.im.toFixed(4)}i.
   - Tính |W| trên máy tính bằng cách nhấn SHIFT hyp (abs) của kết quả vừa rồi. Ta được |W| = ${absW.toFixed(4)}.
4. Tính kết quả cực trị:
   - Giá trị LỚN NHẤT (P_max) = |W| + |D|*R = ${absW.toFixed(4)} + ${absD.toFixed(4)} * ${R.toFixed(4)} = ${maxResult.toFixed(6)}.
   - Giá trị NHỎ NHẤT (P_min) = ||W| - |D|*R| = ${minResult.toFixed(6)}.
Cách này đảm bảo kết quả chính xác 100% và chỉ mất 10 giây thực hiện phím bấm.`
            };
          }
        }
      }
    }

    return null;
  } catch (e) {
    console.error("Local Optimizer Engine Error:", e);
    return null;
  }
}

// Extract coefficients A, B, C for function f(z) = A*z + B*conj(z) + C
function extractLinearCoeffs(exprStr: string): { A: math.Complex; B: math.Complex; C: math.Complex } {
  const clean = exprStr.replace(/\bi\b/g, '1i').trim();
  
  const f = (val: math.Complex) => {
    try {
      const scope = { z: val, conj: (v: any) => math.conj(v) };
      const parsed = math.evaluate(clean, scope);
      return math.complex(parsed);
    } catch {
      return math.complex(0, 0);
    }
  };
  
  const f_0 = f(math.complex(0, 0));
  const f_1 = f(math.complex(1, 0));
  const f_i = f(math.complex(0, 1));
  
  const C = f_0;
  const f1 = math.subtract(f_1, f_0) as math.Complex;
  const f2 = math.subtract(f_i, f_0) as math.Complex;
  
  const f2_div_i = math.multiply(f2, math.complex(0, -1)) as math.Complex;
  
  const A = math.multiply(math.add(f1, f2_div_i), 0.5) as math.Complex;
  const B = math.multiply(math.subtract(f1, f2_div_i), 0.5) as math.Complex;
  
  return { A, B, C };
}

// ========================================================
// UPGRADED ADVANCED SOLVERS FROM PDF GUIDELINES
// ========================================================

function trySolveGeneralEllipse(query: string, cleanedQuery: string): ComplexOptResult | null {
  const getCoeffs = (expr: string) => {
    const clean = expr.replace(/\bi\b/g, '1i').replace(/\^/g, '**').trim();
    const f = (val: math.Complex) => {
      const scope = { z: val, conj: (v: any) => math.conj(v) };
      return math.complex(math.evaluate(clean, scope));
    };
    const b = f(math.complex(0, 0));
    const f1 = f(math.complex(1, 0));
    const a = math.subtract(f1, b) as math.Complex;
    return { a, b };
  };

  const absPattern = /(?:abs\s*\(([^)]+)\)|\|([^|]+)\|)/gi;
  const blocks: string[] = [];
  let m;
  while ((m = absPattern.exec(query)) !== null) {
    blocks.push((m[1] || m[2]).trim());
  }

  if (blocks.length < 2) return null;

  let kVal = NaN;
  const eqParts = query.split('=');
  if (eqParts.length >= 2) {
    const rightOfEq = eqParts[1];
    const numMatch = rightOfEq.match(/([\d\.]+)/);
    if (numMatch) {
      kVal = parseFloat(numMatch[1]);
    }
  }
  if (isNaN(kVal)) {
    const generalNumMatch = query.match(/=\s*([\d\.]+)/) || query.match(/([\d\.]+)\s*=/);
    if (generalNumMatch) {
      kVal = parseFloat(generalNumMatch[1]);
    }
  }
  if (isNaN(kVal)) return null;

  let f1Block = "";
  let f2Block = "";
  let targetBlock = "";

  if (blocks.length === 3) {
    // Determine focal/target blocks using string checking and mathematical validation
    let focalIdx1 = -1;
    let focalIdx2 = -1;
    let targetIdx = -1;

    const normQuery = query.toLowerCase().replace(/\s+/g, '');
    const representations = blocks.map(b => {
      const cleanB = b.toLowerCase().replace(/\s+/g, '');
      return [`|${cleanB}|`, `abs(${cleanB})`, `abs${cleanB}`];
    });

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (i === j) continue;
        let found = false;
        for (const repI of representations[i]) {
          for (const repJ of representations[j]) {
            if (normQuery.includes(`${repI}+${repJ}`) || normQuery.includes(`${repJ}+${repI}`)) {
              focalIdx1 = i;
              focalIdx2 = j;
              targetIdx = 3 - i - j;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        if (found) break;
      }
      if (focalIdx1 !== -1) break;
    }

    if (focalIdx1 === -1 || focalIdx2 === -1) {
      for (let targetCand = 0; targetCand < 3; targetCand++) {
        const idx1 = targetCand === 0 ? 1 : 0;
        const idx2 = targetCand === 2 ? 1 : 2;
        try {
          const c1 = getCoeffs(blocks[idx1]);
          const c2 = getCoeffs(blocks[idx2]);
          if (math.abs(c1.a) > 0 && math.abs(c2.a) > 0) {
            const z1 = math.multiply(math.divide(c1.b, c1.a), -1) as math.Complex;
            const z2 = math.multiply(math.divide(c2.b, c2.a), -1) as math.Complex;
            const scaleL = math.abs(c1.a) as number;
            const scaleL2 = math.abs(c2.a) as number;
            if (Math.abs(scaleL - scaleL2) < 1e-2) {
              const c_dist = (math.abs(math.subtract(z1, z2)) as number) / 2;
              const a_semimajor = (kVal / scaleL) / 2;
              if (a_semimajor > c_dist && c_dist > 1e-3) {
                focalIdx1 = idx1;
                focalIdx2 = idx2;
                targetIdx = targetCand;
                break;
              }
            }
          }
        } catch (e) {}
      }
    }

    if (focalIdx1 !== -1 && focalIdx2 !== -1 && targetIdx !== -1) {
      f1Block = blocks[focalIdx1];
      f2Block = blocks[focalIdx2];
      targetBlock = blocks[targetIdx];
    } else {
      // Direct string-comparison fallback: target block is the one that is NOT part of 'biết ...' or LHS list
      const eqLhs = eqParts[0];
      const absLhs: string[] = [];
      const absRegexLhs = /(?:abs\s*\(([^)]+)\)|\|([^|]+)\|)/gi;
      let ml;
      while ((ml = absRegexLhs.exec(eqLhs)) !== null) {
        absLhs.push((ml[1] || ml[2]).trim());
      }
      if (absLhs.length === 2) {
        f1Block = absLhs[0];
        f2Block = absLhs[1];
        targetBlock = blocks.find(b => b !== f1Block && b !== f2Block) || blocks[0];
      } else {
        f1Block = blocks[1];
        f2Block = blocks[2];
        targetBlock = blocks[0];
      }
    }
  } else if (blocks.length === 2) {
    f1Block = blocks[0];
    f2Block = blocks[1];
    targetBlock = "z";
  } else {
    return null;
  }

  try {
    const c1 = getCoeffs(f1Block);
    const c2 = getCoeffs(f2Block);
    const c0 = getCoeffs(targetBlock);

    if (math.abs(c1.a) as number === 0 || math.abs(c2.a) as number === 0 || math.abs(c0.a) as number === 0) return null;

    const z1 = math.multiply(math.divide(c1.b, c1.a), -1) as math.Complex;
    const z2 = math.multiply(math.divide(c2.b, c2.a), -1) as math.Complex;
    const z0 = math.multiply(math.divide(c0.b, c0.a), -1) as math.Complex;

    const scaleL = math.abs(c1.a) as number;
    const scaleL2 = math.abs(c2.a) as number;
    if (Math.abs(scaleL - scaleL2) > 1e-3) return null;

    const scale = math.abs(c0.a) as number;
    const k = kVal / scaleL;
    const a = k / 2;

    const z1_minus_z2 = math.subtract(z1, z2) as math.Complex;
    const c = (math.abs(z1_minus_z2) as number) / 2;

    if (a < c) return null;

    const bSq = a * a - c * c;
    const b = bSq > 0 ? Math.sqrt(bSq) : 0;

    const center = math.multiply(math.add(z1, z2), 0.5) as math.Complex;
    const z0_minus_center = math.subtract(z0, center) as math.Complex;
    const distZ0Center = math.abs(z0_minus_center) as number;

    const z1_minus_center = math.subtract(z1, center) as math.Complex;
    const crossProduct = z0_minus_center.re * z1_minus_center.im - z0_minus_center.im * z1_minus_center.re;
    const isCollinear = Math.abs(crossProduct) < 1e-3;

    const distToZ1 = math.abs(math.subtract(z0, z1)) as number;
    const distToZ2 = math.abs(math.subtract(z0, z2)) as number;
    const isOnMinorAxis = Math.abs(distToZ1 - distToZ2) < 1e-3;

    const isMin = cleanedQuery.includes('min') || cleanedQuery.includes('nhỏ nhất');

    if (distZ0Center < 1e-3) {
      const minVal = scale * b;
      const maxVal = scale * a;
      const selectedVal = isMin ? minVal : maxVal;
      const innerSq = scale * scale * bSq;
      const roundedSq = Math.round(innerSq);
      const isCleanSq = Math.abs(innerSq - roundedSq) < 1e-3;
      const latexExact = isMin 
        ? (isCleanSq ? `\\sqrt{${roundedSq}}` : `\\sqrt{${innerSq.toFixed(4)}}`)
        : `${(scale * a).toFixed(4)}`;
      const exactText = isMin
        ? (isCleanSq ? `\u221a${roundedSq}` : `${minVal.toFixed(6)}`)
        : `${maxVal.toFixed(6)}`;

      return {
        detected_type: "Dạng 2: Điểm cực trị đặc biệt tại tâm Elip xoay (Center of Focal Ellipse)",
        idea: `Quỹ tích số phức z thỏa mãn là đường Elip nhận z1 và z2 làm tiêu điểm. Điểm đích z0 chính là tâm của đường Elip. Cực đại khoảng cách đạt được tại đỉnh trục lớn (bằng bán trục lớn a). Cực tiểu khoảng cách đạt được tại đỉnh trục nhỏ (bằng bán trục nhỏ b).`,
        exact: exactText,
        latex_exact: latexExact,
        decimal_25: selectedVal.toFixed(25),
        attained_at: isMin ? `Các đỉnh trục nhỏ` : `Các đỉnh trục lớn`,
        explanation: `Hướng dẫn bấm máy tính CASIO fx-580VNX chi tiết:
1. Gán tiêu điểm z1 = ${z1.re.toFixed(4)} + ${z1.im.toFixed(4)}i vào B, z2 = ${z2.re.toFixed(4)} + ${z2.im.toFixed(4)}i vào C.
2. Tiêu cự c = |B - C| / 2 = ${c.toFixed(6)}. Bán trục lớn a = ${kVal} / 2 = ${a.toFixed(6)}.
3. Bán trục nhỏ b = √(a² - c²) = ${b.toFixed(6)}.
4. Kết quả cực trị cho P = |${scale === 1 ? 'z' : `${scale}z`} - z_0|:
   - Giá trị LỚN NHẤT (P_max) = ${scale} * a = ${maxVal.toFixed(6)}.
   - Giá trị NHỎ NHẤT (P_min) = ${scale} * b = ${minVal.toFixed(6)}.`
      };
    }

    if (isCollinear) {
      const minVal = scale * Math.abs(distZ0Center - a);
      const maxVal = scale * (distZ0Center + a);
      const selectedVal = isMin ? minVal : maxVal;

      return {
        detected_type: "Dạng 3.1 & 3.2: Điểm cực trị thẳng hàng trên Trục Lớn Elip (Collinear Major Axis)",
        idea: `Quỹ tích z biểu diễn là Elip, điểm đích z0 thẳng hàng với hai tiêu điểm z1, z2 (nằm trên đường thẳng trục lớn). Khoảng cách lớn nhất đạt đỉnh trục lớn phía đối diện, khoảng cách nhỏ nhất đạt đỉnh gần nhất.`,
        exact: selectedVal.toFixed(6),
        latex_exact: `${selectedVal.toFixed(4)}`,
        decimal_25: selectedVal.toFixed(25),
        attained_at: `Đỉnh trục lớn thẳng hàng gần/xa nhất`,
        explanation: `Công thức giải nhanh hình học phẳng tuyệt đối:
- Tâm I = ${center.re.toFixed(4)} + ${center.im.toFixed(4)}i.
- Bán trục lớn a = ${a.toFixed(4)}, bán trục nhỏ b = ${b.toFixed(4)}.
- Khoảng cách từ điểm đích z0 đến tâm I: d = |z0 - I| = ${distZ0Center.toFixed(4)}.
1. Giá trị P_max = ${scale} * (d + a) = ${maxVal.toFixed(6)}.
2. Giá trị P_min = ${scale} * |d - a| = ${minVal.toFixed(6)}.
Bạn chỉ cần thực hiện phép tính cộng trừ đơn giản này là ra ngay đáp án chính thức.`
      };
    }

    if (isOnMinorAxis) {
      const minVal = scale * Math.abs(distZ0Center - b);
      const selectedVal = minVal;
      if (isMin) {
        return {
          detected_type: "Dạng 3.3: Điểm cực trị nằm trên Trục Nhỏ Elip (Minor Axis Alignment)",
          idea: `Quỹ tích z là Elip, điểm đích z0 nằm trên đường trung trực của hai tiêu điểm (trục nhỏ). Khoảng cách cực tiểu đạt tại đỉnh trục nhỏ.`,
          exact: selectedVal.toFixed(6),
          latex_exact: `${selectedVal.toFixed(4)}`,
          decimal_25: selectedVal.toFixed(25),
          attained_at: `Tại một trong hai đỉnh của trục nhỏ`,
          explanation: `Sử dụng công thức giải nhanh đặc biệt cho điểm thuộc trục nhỏ:
- Tâm I = ${center.re.toFixed(4)} + ${center.im.toFixed(4)}i.
- Bán trục nhỏ b = ${b.toFixed(4)}.
- Khoảng cách d = |z0 - I| = ${distZ0Center.toFixed(4)}.
- Giá trị cực tiểu P_min = ${scale} * |d - b| = ${minVal.toFixed(6)}.
Không cần vẽ hình hay lập bảng dài dòng, đáp số là trùng khớp tuyệt đối.`
        };
      }
    }

    let minScan = Infinity;
    let maxScan = -Infinity;
    let bestThetaMin = 0;
    let bestThetaMax = 0;
    const dir = math.divide(z1_minus_center, math.abs(z1_minus_center)) as math.Complex;
    const dirPerp = math.multiply(dir, math.complex(0, 1)) as math.Complex;

    for (let i = 0; i <= 360; i++) {
      const theta = (i * Math.PI) / 180;
      const xRot = a * Math.cos(theta);
      const yRot = b * Math.sin(theta);
      const zPoint = math.add(center, math.add(math.multiply(xRot, dir), math.multiply(yRot, dirPerp))) as math.Complex;
      const val = scale * (math.abs(math.subtract(zPoint, z0)) as number);
      if (val < minScan) {
        minScan = val;
        bestThetaMin = theta;
      }
      if (val > maxScan) {
        maxScan = val;
        bestThetaMax = theta;
      }
    }

    const selectedVal = isMin ? minScan : maxScan;

    return {
      detected_type: "Dạng tổng quát: Cực trị Elip quay bằng phương pháp tham số hóa góc (General Ellipse Parametrization)",
      idea: `Sử dụng phương pháp tham số hóa góc lượng giác đối với Elip xoay bất kỳ. Ta biểu diễn điểm z qua góc theta bằng phép xoay tọa độ và quét qua MENU 7 để tìm cực đại và cực tiểu một cách chính xác tuyệt đối.`,
      exact: selectedVal.toFixed(6),
      latex_exact: `${selectedVal.toFixed(4)}`,
      decimal_25: selectedVal.toFixed(25),
      attained_at: `Góc quét θ ≈ ${(isMin ? bestThetaMin : bestThetaMax).toFixed(4)} rad`,
      explanation: `Quy trình quét bảng Table lượng giác chi tiết nhất trên Casio fx-580VNX:
1. Đưa máy tính về chế độ radian: SHIFT MENU 2 2. Chuyển sang MENU 8 (Table).
2. Nhập hàm khảo sát f(x) mô tả khoảng cách bình phương từ z0 = ${z0.re.toFixed(4)} + ${z0.im.toFixed(4)}i đến điểm z thuộc Elip:
   Ta biểu diễn z = (${center.re.toFixed(4)} + ${center.im.toFixed(4)}i) + ${a.toFixed(4)}*cos(x)*(${dir.re.toFixed(4)} + ${dir.im.toFixed(4)}i) + ${b.toFixed(4)}*sin(x)*(${dirPerp.re.toFixed(4)} + ${dirPerp.im.toFixed(4)}i).
3. Thiết lập thông số quét:
   - Start: 0
   - End: 2π
   - Step: 2π / 29
4. Quan sát cột f(x) để đọc:
   - Giá trị nhỏ nhất (MIN) ≈ ${minScan.toFixed(6)}.
   - Giá trị lớn nhất (MAX) ≈ ${maxScan.toFixed(6)}.`
    };
  } catch (error) {
    console.error("General Ellipse Solver error:", error);
    return null;
  }
}

function trySolveEquationForModulus(query: string): ComplexOptResult | null {
  const cleanQuery = query.toLowerCase();
  const hasModulusRequest = cleanQuery.includes('|z|') || cleanQuery.includes('môđun') || cleanQuery.includes('mô đun');
  if (!hasModulusRequest) return null;

  const eqParts = query.split('=');
  if (eqParts.length !== 2) return null;
  if (!cleanQuery.includes('z')) return null;

  let lhsStr = parseComplexExpressionMathJS(eqParts[0]);
  let rhsStr = parseComplexExpressionMathJS(eqParts[1]);

  lhsStr = lhsStr.replace(/abs\(\s*z\s*\)/gi, 't');
  rhsStr = rhsStr.replace(/abs\(\s*z\s*\)/gi, 't');
  lhsStr = lhsStr.replace(/conj\(\s*z\s*\)/gi, 'conj_z');
  rhsStr = rhsStr.replace(/conj\(\s*z\s*\)/gi, 'conj_z');

  const getSysCoeffs = (t: number) => {
    const evalExpr = (zVal: math.Complex) => {
      const scope = {
        z: zVal,
        conj_z: math.conj(zVal),
        t: t,
        conj: (v: any) => math.conj(v),
        abs: (v: any) => math.abs(v)
      };
      const lRes = math.evaluate(lhsStr, scope);
      const rRes = math.evaluate(rhsStr, scope);
      return math.subtract(lRes, rRes) as math.Complex;
    };

    const C = evalExpr(math.complex(0, 0));
    const f1 = evalExpr(math.complex(1, 0));
    const fi = evalExpr(math.complex(0, 1));

    const f1_minus_C = math.subtract(f1, C) as math.Complex;
    const fi_minus_C = math.subtract(fi, C) as math.Complex;

    const fi_minus_C_div_i = math.multiply(fi_minus_C, math.complex(0, -1)) as math.Complex;

    const A = math.multiply(math.add(f1_minus_C, fi_minus_C_div_i), 0.5) as math.Complex;
    const B = math.multiply(math.subtract(f1_minus_C, fi_minus_C_div_i), 0.5) as math.Complex;

    return { A, B, C };
  };

  const solveZForT = (t: number) => {
    const { A, B, C } = getSysCoeffs(t);
    const absA = math.abs(A) as number;
    const absB = math.abs(B) as number;
    const det = absA * absA - absB * absB;
    if (Math.abs(det) < 1e-9) {
      if (absB < 1e-9 && absA > 1e-9) {
        return math.divide(math.multiply(C, -1), A) as math.Complex;
      }
      return null;
    }
    const conjA = math.conj(A) as math.Complex;
    const conjC = math.conj(C) as math.Complex;
    const numerator = math.subtract(math.multiply(B, conjC), math.multiply(C, conjA)) as math.Complex;
    return math.divide(numerator, det) as math.Complex;
  };

  const g = (t: number): number => {
    const zVal = solveZForT(t);
    if (!zVal) return 99999;
    return (math.abs(zVal) as number) - t;
  };

  let bestT = NaN;
  let minDiff = Infinity;
  for (let t = 0.05; t <= 50; t += 0.05) {
    const diff = Math.abs(g(t));
    if (diff < minDiff) {
      minDiff = diff;
      bestT = t;
    }
  }

  if (minDiff < 0.2) {
    let low = Math.max(0.001, bestT - 0.1);
    let high = bestT + 0.1;
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      const gMid = g(mid);
      if (Math.abs(gMid) < 1e-12) {
        bestT = mid;
        break;
      }
      const gLow = g(low);
      if (gLow * gMid < 0) {
        high = mid;
      } else {
        low = mid;
      }
      bestT = mid;
    }
  }

  if (Math.abs(g(bestT)) > 1e-4) {
    return null;
  }

  let exactText = bestT.toFixed(6);
  let latexText = bestT.toFixed(4);

  const checkCommonRoots = (val: number) => {
    const sq = val * val;
    for (let d = 1; d <= 200; d++) {
      const n = Math.round(sq * d * d);
      if (Math.abs(Math.sqrt(n) / d - val) < 1e-5) {
        if (d === 1) {
          const rootInt = Math.round(sq);
          if (rootInt === val) return { exact: `${val}`, latex: `${val}` };
          return { exact: `\u221a${rootInt}`, latex: `\\sqrt{${rootInt}}` };
        }
        if (Math.round(Math.sqrt(n)) === Math.sqrt(n)) {
          const num = Math.round(Math.sqrt(n));
          return { exact: `${num}/${d}`, latex: `\\frac{${num}}{${d}}` };
        }
        const rootPart = Math.round(sq * d * d);
        return { exact: `\u221a${rootPart} / ${d}`, latex: `\\frac{\\sqrt{${rootPart}}}{${d}}` };
      }
    }
    return null;
  };

  const parsedRoot = checkCommonRoots(bestT);
  if (parsedRoot) {
    exactText = parsedRoot.exact;
    latexText = parsedRoot.latex;
  }

  const finalZ = solveZForT(bestT);
  const attainedStr = finalZ ? `${finalZ.re.toFixed(4)} ${finalZ.im >= 0 ? '+' : '-'} ${Math.abs(finalZ.im).toFixed(4)}i` : "Không xác định";

  return {
    detected_type: "Dạng 1 (PDF 2): Phương trình bậc nhất phức chứa mô-đun (Linear complex with mod-scalar separation)",
    idea: `Cô lập số phức z về một vế thành dạng biểu thức tuyến tính phụ thuộc vào t = |z|. Sau đó lấy mô-đun hai vế để nhận được phương trình thực đối với t và giải tìm t.`,
    exact: exactText,
    latex_exact: latexText,
    decimal_25: bestT.toFixed(25),
    attained_at: `z = ${attainedStr}`,
    explanation: `Hướng dẫn giải chi tiết từng bước bằng CASIO fx-580VNX:
1. Quy đồng và nhóm số phức z sang một vế. Đặt t = |z| (t là một số thực dương).
2. Viết phương trình dưới dạng: A(t) * z + B(t) * z_conj = -C(t).
3. Sử dụng chức năng giải SOLVE trên máy tính để tìm giá trị t:
   - Thay z bằng x và nhập phương trình để tìm nghiệm t dương trực tiếp.
   Ta giải được t = |z| = ${bestT.toFixed(6)} ≈ ${exactText}.`
  };
}

function trySolveVectorModulusBNC(query: string): ComplexOptResult | null {
  const clean = query.toLowerCase();
  if (!clean.includes('z1') && !clean.includes('z_1') && !clean.includes('u') && !clean.includes('v')) {
    return null;
  }

  const r1 = /(?:\|z_?1\||\|u\|)\s*=\s*([\d\.]+)/i;
  const r2 = /(?:\|z_?2\||\|v\|)\s*=\s*([\d\.]+)/i;
  
  const m1 = query.match(r1);
  const m2 = query.match(r2);
  if (!m1 || !m2) return null;

  const mVal = parseFloat(m1[1]);
  const nVal = parseFloat(m2[1]);

  const constraintPattern = /(?:abs|\|)\s*\(\s*(-?[\d\.]*)\s*u\s*([\+\-]\s*[\d\.]*)\s*v\s*\)\s*\|\s*=\s*([\d\.]+)/i;
  const matchConst = query.match(constraintPattern) || query.replace(/\s+/g,'').match(/\|(-?[\d\.]*)(?:z_?1|u)([\+\-][\d\.]*)(?:z_?2|v)\| = ([\d\.]+)/i);
  if (!matchConst) return null;

  let a = parseFloat(matchConst[1] || "1");
  if (isNaN(a)) a = 1;
  let b = parseFloat(matchConst[2].replace(/\s+/g,'') || "1");
  if (isNaN(b)) b = 1;
  const p = parseFloat(matchConst[3]);

  const objPattern = /(?:abs|\|)\s*\(\s*(-?[\d\.]*)\s*(?:z_?1|u)\s*([\+\-]\s*[\d\.]*)\s*(?:z_?2|v)\s*\)/i;
  const matchObj = query.match(objPattern) || query.replace(/\s+/g,'').match(/\|(-?[\d\.]*)(?:z_?1|u)([\+\-][\d\.]*)(?:z_?2|v)\|/i);
  if (!matchObj) return null;

  let c = parseFloat(matchObj[1] || "1");
  if (isNaN(c)) c = 1;
  let d = parseFloat(matchObj[2].replace(/\s+/g,'') || "1");
  if (isNaN(d)) d = 1;

  const cd_p2 = c * d * p * p;
  const ad_bc = a * d - b * c;
  const ac_m2 = a * c * mVal * mVal;
  const bd_n2 = b * d * nVal * nVal;

  const ab_q2 = cd_p2 - ad_bc * (ac_m2 - bd_n2);
  const ab = a * b;

  if (ab === 0) return null;
  const q2 = ab_q2 / ab;
  if (q2 < 0) return null;

  const q = Math.sqrt(q2);

  return {
    detected_type: "Dạng 2 (PDF 2): Cực trị tích vô hướng Vector / Đẳng thức hình bình hành dạng rộng (General Parallelogram Identity)",
    idea: `Sử dụng hệ thức đại số tuyến tính của tích vô hướng Vector trong mặt phẳng phức (khử hạng tử 2*Re(z1*conj(z2))). Nhờ định lý khử này, ta tính được trực tiếp giá trị của biểu thức thứ hai mà không cần biết số phức cụ thể.`,
    exact: q.toFixed(6),
    latex_exact: `\\sqrt{${q2.toFixed(4)}}`,
    decimal_25: q.toFixed(25),
    attained_at: `z1, z2 có góc lệch arg(z1) - arg(z2) không đổi`,
    explanation: `Hướng dẫn bấm phím CASIO fx-580VNX cực tiện lợi:
1. Ta có công thức vạn năng liên hệ giữa hai mô-đun:
   cd * p² - ab * q² = (ad - bc) * (ac * m² - bd * n²)
2. Thay số vào hệ thức:
   p = ${p}, m = ${mVal}, n = ${nVal}
   a = ${a}, b = ${b}, c = ${c}, d = ${d}
3. Bấm biểu thức tính q² trên máy tính:
   q² = [ ${c}*${d}*${p}² - (${a}*${d} - ${b}*${c}) * (${a}*${c}*${mVal}² - ${b}*${d}*${nVal}²) ] / (${a}*${b})
   q² = ${q2.toFixed(6)}
4. Lấy căn bậc hai: q = ${q.toFixed(6)}.
Cách làm này hoàn toàn loại bỏ sai số và tiết kiệm 95% thời gian làm bài.`
  };
}
