import { solveAdvancedMathLocal, analyzePolynomialLocal } from './localMath';
import { solveComplexOptimizationLocal } from './complexOptSolver';

export interface MathResult {
  type: 'success' | 'error';
  content: string;
  data?: any;
}

// Client-side helper to check Gemini rate limit status
export async function getGeminiRateLimitStatus(): Promise<any> {
  try {
    const response = await fetch('/api/math/gemini/limit-status');
    if (!response.ok) throw new Error("Failed to load limit status");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch limit status:", error);
    return null;
  }
}

export async function solveAdvancedMath(
  prompt: string, 
  mode: string, 
  userFunctions?: { f: string, g: string, h: string }, 
  angleMode: 'rad' | 'deg' = 'rad'
): Promise<MathResult> {
  
  try {
    // Try local solver first to completely bypass API key and network requests
    const localResult = await solveAdvancedMathLocal(prompt, mode, userFunctions, angleMode);
    if (localResult && localResult.type === 'success') {
      return localResult;
    }
  } catch (e) {
    console.error("Local solver failed, falling back to server-side Gemini", e);
  }

  try {
    // Call server-side secure Gemini endpoint
    const response = await fetch('/api/math/gemini/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, mode, userFunctions, angleMode })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        return {
          type: 'error',
          content: errData.error || "Hạn mức API hôm nay đã hết. Vui lòng quay lại vào ngày mai!"
        };
      }
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Server-side Gemini Math Error:", error);
    return {
      type: 'error',
      content: error.message || "Failed to process mathematical request. Please try again later.",
    };
  }
}

export async function solveComplexOptimization(tab: string, query: string, difficulty: string): Promise<any> {
  try {
    const localResult = solveComplexOptimizationLocal(query);
    if (localResult) {
      return localResult;
    }
  } catch (e) {
    console.error("Local complex optimization solver failed, falling back to server-side Gemini", e);
  }

  try {
    // Call server-side secure Gemini endpoint
    const response = await fetch('/api/math/gemini/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ tab, query, difficulty })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        return {
          error: errData.error || "Hạn mức API hôm nay đã hết. Vui lòng quay lại vào ngày mai!"
        };
      }
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Server-side Gemini Complex Opt Error:", error);
    return { error: error.message || "Failed to process complex optimization request. Please try again later." };
  }
}

export async function analyzePolynomial(coeffs: string): Promise<MathResult> {
  try {
    const localResult = await analyzePolynomialLocal(coeffs);
    if (localResult && localResult.type === 'success') {
      return localResult;
    }
  } catch (e) {
    console.error("Local polynomial analysis failed, falling back to server-side Gemini", e);
  }

  try {
    // Call server-side secure Gemini endpoint
    const response = await fetch('/api/math/gemini/polynomial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ coeffs })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 429) {
        return {
          type: 'error',
          content: errData.error || "Hạn mức API hôm nay đã hết. Vui lòng quay lại vào ngày mai!"
        };
      }
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Server-side Gemini Polynomial Error:", error);
    return {
      type: 'error',
      content: error.message || "Failed to analyze polynomial. Please try again later.",
    };
  }
}
