import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

// ==================== THAY ĐỔI API KEY Ở ĐÂY ====================
// Bạn chỉ cần sửa dòng này để chuyển sang API key khác

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ================================================================

export interface MathResult {
  type: 'success' | 'error';
  content: string;
  data?: any;
}

async function withRetry<T>(fn: (model: string) => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  let currentModel = "gemini-3.1-pro-preview";
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn(currentModel);
    } catch (error: any) {
      lastError = error;
      const errorStr = JSON.stringify(error);
      
      // Handle 429 Quota Exceeded specifically
      if (errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED")) {
        console.warn("Gemini API Quota Exceeded (429). Switching to Flash model fallback...", error);
        if (currentModel === "gemini-3.1-pro-preview") {
          currentModel = "gemini-3-flash-preview";
          i--; 
          continue;
        }
        throw new Error("QUOTA_EXCEEDED");
      }

      if (errorStr.includes("Rpc failed") || errorStr.includes("500") || errorStr.includes("503") || errorStr.includes("xhr error")) {
        console.warn(`Gemini API attempt ${i + 1} failed, retrying...`, error);
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

import { solveAdvancedMathLocal, analyzePolynomialLocal } from './localMath';
import { solveComplexOptimizationLocal } from './complexOptSolver';

export async function solveAdvancedMath(
  prompt: string, 
  mode: string, 
  userFunctions?: { f: string, g: string, h: string }, 
  angleMode: 'rad' | 'deg' = 'rad'
): Promise<MathResult> {
  
  try {
    // Try local solver first to completely bypass API key
    const localResult = await solveAdvancedMathLocal(prompt, mode, userFunctions, angleMode);
    if (localResult && localResult.type === 'success') {
      return localResult;
    }
  } catch (e) {
    console.error("Local solver failed, falling back to Gemini if available", e);
  }

  try {
    // Tạo chuỗi rules với angleMode đã được thay thế
    const advancedIntegrationRules = `
CRITICAL INTEGRATION RULES (Apply these exactly for the specific forms):
For definite integrals from a to b (where b > a >= 0):

1) Integral of 1/(x+m)^2:
Result MUST be the fraction (b-a)/((a+m)*(b+m)).
If m=1, result is (b-a)/((a+1)*(b+1)).
Always reduce the fraction A/B where A=b-a, B=(a+m)*(b+m) to its simplest form (gcd(A,B)=1). If gcd >= 2, divide both by gcd.

2) Integral of 1/(x^2+m^2):
Result MUST be exactly: 1/m * (arctan(b/m) - arctan(a/m))
Expanded as: arctan(b/m)/m - arctan(a/m)/m
If m=1, result MUST be: arctan(b) - arctan(a).

3) Integral of 1/(m*x^2+n*x+p):
- If Delta < 0: Convert to form 1/(x^2+m^2) and apply rule 2.
- If Delta = 0: Convert to form 1/(x+m)^2 and apply rule 1.
- If Delta > 0: Apply standard partial fractions.

4) Integral of ln(x)^n:
The antiderivative MUST be exactly:
x * [ ln(x)^n - n*ln(x)^(n-1) + n*(n-1)*ln(x)^(n-2) - ... + (-1)^n * n! ] + Const

5) Logarithmic Simplification with Radicals:
When the result contains ln((A + B*sqrt(C)) / D), ALWAYS check if (A + B*sqrt(C)) can be written as (a + b*sqrt(c))^n and simplify accordingly.

6) Special Log-Trig Integrals and Catalan's Constant (G):
- ∫ ln(1+x)/(1+x^2) dx from 0 to 1 = pi*ln(2)/8
- ∫ ln(1+x^2)/(1+x^2) dx from 0 to 1 = pi*ln(2)/2 - G
- ∫ ln(1+x+x^2+x^3)/(1+x^2) dx from 0 to 1 = (5*pi*ln(2))/8 - G

7) Parseable MathJS Expression:
Provide a strictly valid mathjs expression in the \`mathjs_expression\` field.
Use '*' for multiplication, 'G' for Catalan's constant.

8) Angle Mode:
The user's current calculator Angle Mode is: **${angleMode.toUpperCase()}**.
- If Angle Mode is DEG: Treat trig arguments as degrees. Append ' deg' in mathjs_expression if needed.
- If Angle Mode is RAD: Treat as radians.
- DMS format (x° y' z"): Always treat as degrees.
`;

    let fullPrompt = `Mode: ${mode}\nTask: ${prompt}\n${advancedIntegrationRules}`;
    
    if (userFunctions) {
      fullPrompt = `User-defined functions:\nf(x) = ${userFunctions.f}\ng(x) = ${userFunctions.g}\nh(x) = ${userFunctions.h}\n\n${fullPrompt}`;
    }

    const response = await withRetry((model) => ai.models.generateContent({
      model: model,
      contents: fullPrompt,
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symbolic: { type: Type.STRING, description: "The exact symbolic solution (radicals, fractions)" },
            latex: { type: Type.STRING, description: "The LaTeX representation of the symbolic solution. Do NOT wrap in $ or \\[ \\]. Example: '\\\\frac{x^2}{2} + C'" },
            mathjs_expression: { type: Type.STRING, description: "A strictly valid mathjs expression for the exact result. Example: '(sqrt(3)*(2*ln(8+3*sqrt(3)) - ln(37)))/12'" },
            numeric: { type: Type.STRING, description: "The high-precision numeric solution matching the requested number of significant digits" },
            roots: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: "Numeric roots found" },
            intervals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  start: { type: Type.NUMBER },
                  end: { type: Type.NUMBER },
                  startClosed: { type: Type.BOOLEAN },
                  endClosed: { type: Type.BOOLEAN }
                }
              }
            }
          },
          required: ["symbolic", "latex", "mathjs_expression", "numeric", "intervals", "roots"]
        }
      }
    }));

    const data = JSON.parse(response.text || "{}");
    let content = data.symbolic || "No symbolic result";
    
    if (mode === 'Real Analysis' && data.numeric) {
      content = `High-Precision Result:\n${data.numeric}`;
    } else if (mode === 'Integer Digits' && data.numeric) {
      content = `Result digits:\n${data.numeric}`;
    }

    return {
      type: 'success',
      content: content,
      data: data
    };
  } catch (error: any) {
    console.error("Gemini Math Error:", error);
    const content = error.message === "QUOTA_EXCEEDED" 
      ? "API Quota Exceeded. Please wait a minute before trying again, or check your API key settings."
      : "Failed to process mathematical request. Please try again later.";
    
    return {
      type: 'error',
      content: content,
    };
  }
}

export async function solveComplexOptimization(tab: string, query: string, difficulty: string): Promise<any> {
  try {
    const localResult = solveComplexOptimizationLocal(query);
    if (localResult) {
      return localResult;
    }
    
    const rules = `
You are the \`ComplexOptimizationEngine\`, an expert Math Olympiad / High School Advanced Mathematics (Vietnamese THPTQG) solver focusing on Complex Numbers MIN/MAX optimization.

Target problem: ${query}
Category: ${tab}
Difficulty Strategy: ${difficulty}

You MUST follow the EXACT logic of the following Python engine to solve the problem. Do NOT use generic heuristics, you MUST trace this exact algorithm step-by-step:

\`\`\`python
# ===== BASIC SYMBOLIC OBJECTS =====

class ComplexVar:
    def __init__(self, name): self.name = name

z1 = ComplexVar("z1"); z2 = ComplexVar("z2")

class LinExpr:
    # a*z1 + b*z2 + c
    def __init__(self, a=0, b=0, c=0):
        self.a = complex(a); self.b = complex(b); self.c = complex(c)

class Constraint: pass
class AbsEqualsConst(Constraint): pass # |L| = R
class AbsEqualsAbs(Constraint): pass # |L1| = k|L2|
class SumAbsEqualsAbs(Constraint): pass # |A| + |B| = |A+B|

class ComplexOptimizationEngine:
    def __init__(self, objective, constraints):
        self.obj = objective
        self.constraints = constraints

    def solve(self):
        self.normalize()
        structure = self.detect_structure()
        reduced = self.reduce(structure)
        geo = self.to_geometry(reduced)
        result = self.optimize_exact(geo)
        result = self.validate_and_refine(result)
        return result

    def normalize(self):
        # Normalize all expressions to the form: |a*z1 + b*z2 + c|
        # For AbsEqualsAbs: normalize k >= 0 (if k < 0, take abs(k))

    def detect_structure(self):
        # score priorities:
        # PHASE_LOCK (|A| + |B| = |A+B|): +10 priority
        # RATIO (|A| = k|B|): +5 priority
        # CIRCLE (|A| = R): +3 priority
        # Sort constraints by priority (PHASE_LOCK > RATIO > CIRCLE)

    def apply_phase_lock_exact(self):
        # |A| + |B| = |A+B| → solve for A = t*B (t >= 0 real)
        # (a1 - t*a2)z1 + (b1 - t*b2)z2 + (c1 - t*c2) = 0
        # Reduce to a linear relation z1 = f(t)*z2 + g(t)

    def apply_ratio_exact(self):
        # |X| = k|Y| → substitute X = k * e^{iθ} * Y

    def to_geometry(self, reduced):
        # Convert reduced forms to purely geometric primitives:
        # If matches "|z - z0| = R", return Circle(center=z0, radius=R)
        # If matches "|A*z + B|", return AffineCircle(A, B)
        # If matches "|A*exp(iθ) + B|", return RotationForm(A, B)

    def optimize_point_circle(center, radius, A, B):
        # Optimize |A*z + B| subject to |z - center| = radius
        # w = z - center → |A*(w+center) + B| = |A*w + (A*center + B)|
        # Let C = A*center + B
        # min_val = abs(abs(C) - abs(A)*radius)
        # max_val = abs(C) + abs(A)*radius
        return min_val, max_val

    def optimize_rotation(A, B):
        # Optimize |A e^{iθ} + B|
        # min_val = abs(abs(B) - abs(A))
        # max_val = abs(A) + abs(B)
        return min_val, max_val

    def optimize_symbolic_theta(expr):
        # Fallback: Substitute e^{iθ}, take f = abs(expr(θ))^2
        # df/dθ = 0, solve for θ, return sqrt(min), sqrt(max)

RULES_OF_ENGINE = [
    "1. Ưu tiên phase-lock: if |A| + |B| = |A+B| → enforce A = tB (t >= 0)",
    "2. Giảm số biến: reduce z1,z2 → 1 variable ASAP using the highest priority constraint",
    "3. Tránh Re/Im: NEVER split into Re/Im (x + yi) unless absolutely forced",
    "4. Ưu tiên hình học: convert to circle / rotation forms to use exact formulas",
    "5. Nếu stuck: use θ-parametrization - Ellipse angle rotation trick: (X - A) * e^{-i*arg(B)} so you can scan theta in table mode MENU 7",
    "6. Luôn check dấu =: alignment condition required (validate_and_refine)"
]
\`\`\`

You MUST return a JSON with the following structure:
{
  "detected_type": "string (Identify the locus based on detect_structure, e.g. CIRCLE, PHASE_LOCK, ELLIPSE_ROTATION)",
  "idea": "string (Explain how the engine reduces/solves this specific problem, avoiding Re/Im splits)",
  "exact": "string (The exact answer, e.g. sqrt(15) - 2)",
  "latex_exact": "string (The LaTeX representation of the exact answer, e.g. \\sqrt{15} - 2)",
  "decimal_25": "string (Strictly 25-digit floating point format if irrational)",
  "attained_at": "string (The point z where it is attained, strictly checked for alignment)",
  "explanation": "string (A step-by-step rigorous explanation natively mapped to Vietnamese THPTQG context utilizing the provided Engine's Logic, and ALSO MUST INCLUDE detailed instructions on how to set up and solve this exact problem on the CASIO fx-580VNX calculator step-by-step using precise keys, e.g., MENU 2, MENU 7, STO, STO A, STO B, STO C, Shift hyp for abs, and the Ellipse Rotation syntax if applicable)"
}
Ensure the "decimal_25" field contains exactly 25 digits after the decimal point if it is an irrational number.
`;

    const response = await withRetry((model) => ai.models.generateContent({
      model: model,
      contents: rules,
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_type: { type: Type.STRING },
            idea: { type: Type.STRING },
            exact: { type: Type.STRING },
            latex_exact: { type: Type.STRING },
            decimal_25: { type: Type.STRING },
            attained_at: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["detected_type", "idea", "exact", "latex_exact", "decimal_25", "attained_at", "explanation"]
        }
      }
    }));

    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    console.error("Gemini Complex Opt Error:", error);
    return { error: error.message };
  }
}

export async function analyzePolynomial(coeffs: string): Promise<MathResult> {
  try {
    const localResult = await analyzePolynomialLocal(coeffs);
    if (localResult && localResult.type === 'success') {
      return localResult;
    }
  } catch (e) {
    console.error("Local polynomial analysis failed, falling back to Gemini if available", e);
  }

  try {
    const response = await withRetry((model) => ai.models.generateContent({
      model: model,
      contents: `Analyze the polynomial with coefficients (highest degree to constant): ${coeffs}.`,
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            expression: { type: Type.STRING },
            roots: { type: Type.ARRAY, items: { type: Type.STRING } },
            extrema: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.STRING },
                  y: { type: Type.STRING },
                  type: { type: Type.STRING }
                }
              }
            },
            inflectionPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.STRING },
                  y: { type: Type.STRING }
                }
              }
            },
            intervals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  range: { type: Type.STRING },
                  behavior: { type: Type.STRING }
                }
              }
            },
            summary: { type: Type.STRING }
          }
        }
      }
    }));

    const data = JSON.parse(response.text || "{}");
    return {
      type: 'success',
      content: data.summary || "Analysis complete.",
      data: data
    };
  } catch (error: any) {
    console.error("Gemini Polynomial Error:", error);
    const content = error.message === "QUOTA_EXCEEDED" 
      ? "API Quota Exceeded. Please wait a minute before trying again, or check your API key settings."
      : "Failed to analyze polynomial. Please try again later.";
    
    return {
      type: 'error',
      content: content,
    };
  }
}