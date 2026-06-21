import React, { useState, useEffect, useMemo } from 'react';
import { MathSymbInputPanel } from './components/MathSymbInputPanel';
import ComplexEquationLab from './components/ComplexEquationLab';
import ComplexOptimizationLab from './components/ComplexOptimizationLab';
import FunctionVariationTableur from './components/FunctionVariationTableur';
import { parseFormula, ParseResult } from './lib/formulaParser';
import { Mode22 } from './components/Mode22';
import GeoSurveyPro from './components/geosurvey/GeoSurveyPro';
import { LinearAlgebraToolboxUI } from './components/LinearAlgebraToolboxUI';
import { 
  Calculator, 
  Binary, 
  Hash, 
  Sigma, 
  Dices, 
  Grid3X3, 
  FunctionSquare, 
  Layers, 
  Cpu,
  Atom,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Radiation,
  Beaker,
  FlaskConical,
  Thermometer,
  Zap,
  Wind
} from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { 
  powerSumMod, 
  solveCRT, 
  solveCRTStepByStep,
  CRTStepResult,
  CRTStep,
  factorize, 
  isPrime, 
  v_p_multifactorial, 
  waysSumDice,
  solveLinearSystem,
  solvePolynomialInequation,
  parseMath,
  formatRoot
} from './lib/mathUtils';
import { solveAdvancedMath, analyzePolynomial } from './services/geminiMath';
import Fraction from 'fraction.js';
import Decimal from 'decimal.js';
import * as ss from 'simple-statistics';
import * as math from 'mathjs';
import Plot from 'react-plotly.js';
import 'katex/dist/katex.min.css';
import { useContainerDimensions, getPerfectSquareRange, usePrecisionAnalysis, HighPrecisionGeometryLab } from './components/SquareViewHelper';
import { BlockMath, InlineMath } from 'react-katex';
import { 
  Plus, 
  Minus,
  Maximize2,
  Trash2, 
  Download, 
  Upload, 
  BarChart2, 
  Table as TableIcon,
  Settings2,
  X,
  Map as MapIcon,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Tablet
} from 'lucide-react';

// --- Types ---

type Mode = 
  | 'menu'
  | 'mode1' | 'mode2' | 'mode3' | 'mode4' | 'mode5' 
  | 'mode6' | 'mode7' | 'mode9' | 'mode10' | 'mode11' | 'mode12' | 'mode13' | 'mode14' | 'mode15' | 'mode16' | 'mode17' | 'mode18' | 'mode19' | 'mode20' | 'mode21' | 'mode22' | 'mode23' | 'mode22' | 'mode24' | 'mode25';

interface ModeInfo {
  id: Mode;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const MODES: ModeInfo[] = [
  { id: 'mode24', title: 'Variation Tableur', description: 'CAS Analytical Table of Variation', icon: <FunctionSquare className="w-6 h-6 animate-pulse text-[#ffffff]" />, color: 'bg-teal-600' },
  { id: 'mode25', title: 'Linear Algebra Pro', description: 'Advanced Matrix, Vectors & Decompositions', icon: <Grid3X3 className="w-6 h-6 animate-pulse text-[#ffffff]" />, color: 'bg-teal-500' },
  { id: 'mode1', title: 'S mod N', description: 'Sum of powers modulo N', icon: <Calculator className="w-6 h-6" />, color: 'bg-blue-500' },
  { id: 'mode2', title: 'CRT Solver', description: 'Chinese Remainder Theorem', icon: <Binary className="w-6 h-6" />, color: 'bg-purple-500' },
  { id: 'mode3', title: 'Big Integer Digits', description: 'Extract leading/trailing digits', icon: <Hash className="w-6 h-6" />, color: 'bg-emerald-500' },
  { id: 'mode4', title: 'Real Digits', description: 'High precision real analysis', icon: <Cpu className="w-6 h-6" />, color: 'bg-orange-500' },
  { id: 'mode5', title: 'Dice Probability', description: 'Exact dice sum ways', icon: <Dices className="w-6 h-6" />, color: 'bg-pink-500' },
  { id: 'mode6', title: 'Linear Systems', description: 'Solve matrix equations', icon: <Grid3X3 className="w-6 h-6" />, color: 'bg-cyan-500' },
  { id: 'mode7', title: 'Polynomials', description: 'Roots, extrema, analysis', icon: <FunctionSquare className="w-6 h-6" />, color: 'bg-indigo-500' },
  { id: 'mode9', title: 'Factorization', description: 'Prime factors of N', icon: <Layers className="w-6 h-6" />, color: 'bg-rose-500' },
  { id: 'mode10', title: 'Factorial Analysis', description: 'Prime exponents in N!', icon: <Sigma className="w-6 h-6" />, color: 'bg-violet-500' },
  { id: 'mode11', title: 'Advanced Engine', description: 'Calculus & Symbolic Math', icon: <Cpu className="w-6 h-6" />, color: 'bg-slate-700' },
  { id: 'mode12', title: 'Prime Manager', description: 'Generate & View Primes', icon: <Layers className="w-6 h-6" />, color: 'bg-amber-600' },
  { id: 'mode13', title: 'Geometry Pro', description: 'Lines, Planes & Spheres', icon: <Grid3X3 className="w-6 h-6" />, color: 'bg-blue-600' },
  { id: 'mode14', title: 'Stats Engine', description: 'Advanced Statistical Analysis', icon: <Sigma className="w-6 h-6" />, color: 'bg-teal-600' },
  { id: 'mode15', title: 'ChemPhys Lab', description: 'Periodic Table & Unit Lab', icon: <Beaker className="w-6 h-6" />, color: 'bg-red-700' },
  { id: 'mode16', title: 'Axis Ox Ruler', description: 'Set Operations on Number Line', icon: <Grid3X3 className="w-6 h-6" />, color: 'bg-orange-600' },
  { id: 'mode17', title: 'Base-N Converter', description: 'Dec, Hex, Bin, Oct conversions', icon: <Binary className="w-6 h-6" />, color: 'bg-indigo-600' },
  { id: 'mode18', title: 'Inequation Solver', description: 'Solve deg 2-4 inequations', icon: <Calculator className="w-6 h-6" />, color: 'bg-rose-600' },
  { id: 'mode22', title: 'Abs Inequation', description: 'Polynomials with absolute values', icon: <Calculator className="w-6 h-6" />, color: 'bg-rose-800' },
  { id: 'mode19', title: 'Function Lab', description: 'Define f(x), g(x), h(x) for Engine', icon: <FunctionSquare className="w-6 h-6" />, color: 'bg-emerald-600' },
  { id: 'mode20', title: 'Geogebra Geometry Viewer', description: 'Ultimate 2D/3D/4D Graphing Suite', icon: <Maximize2 className="w-6 h-6" />, color: 'bg-rose-700' },
  { id: 'mode21', title: 'Bonding Lab', description: 'Chemical Bonding & Stability Analysis', icon: <Atom className="w-6 h-6" />, color: 'bg-teal-700' },
  { id: 'mode23', title: 'GeoSurvey Pro X', description: 'Advanced Land Surveying Suite', icon: <MapIcon className="w-6 h-6" />, color: 'bg-yellow-600' },
];

// --- Components ---

export default function App() {
  const [currentMode, setCurrentMode] = useState<Mode>('menu');
  const [isTabletMode, setIsTabletMode] = useState<boolean>(() => {
    return localStorage.getItem('vietmath_tablet_mode') === 'true';
  });
  const [globalBuffer, setGlobalBuffer] = useState<string>('');
  const [userFunctions, setUserFunctions] = useState({
    f: 'x^2',
    g: 'sin(x)',
    h: 'sqrt(x)'
  });

  // --- CLOUDFLARE SECURE WORKSPACE SECURITY STATS & CONTROLS ---
  const [passcode, setPasscode] = useState<string>(() => localStorage.getItem('vietmath_passcode') || '');
  const [isLockedUI, setIsLockedUI] = useState<boolean>(() => {
    const hasPass = !!localStorage.getItem('vietmath_passcode');
    const wasLocked = localStorage.getItem('vietmath_is_locked') === 'true';
    return hasPass && wasLocked;
  });
  const [showSecurityDialog, setShowSecurityDialog] = useState<boolean>(false);
  const [securityDialogMode, setSecurityDialogMode] = useState<'set' | 'manage' | 'confirm_clear'>('set');
  const [secPassInput, setSecPassInput] = useState<string>('');
  const [secPassConfirmInput, setSecPassConfirmInput] = useState<string>('');
  const [secError, setSecError] = useState<string>('');
  
  // Immersive unlock screen state
  const [unlockInput, setUnlockInput] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  // Cooldown countdown loop
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(p => p - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleSetPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setSecError('');
    if (!secPassInput || secPassInput.length < 4) {
      setSecError('Mật khẩu định danh chuyên gia phải từ 4 ký tự trở lên.');
      return;
    }
    if (secPassInput !== secPassConfirmInput) {
      setSecError('Mật khẩu xác nhận không khớp. Hãy điền kỹ lại.');
      return;
    }
    localStorage.setItem('vietmath_passcode', secPassInput);
    localStorage.setItem('vietmath_is_locked', 'true');
    setPasscode(secPassInput);
    setIsLockedUI(true);
    setShowSecurityDialog(false);
    setSecPassInput('');
    setSecPassConfirmInput('');
  };

  const handleLockWorkspace = () => {
    if (passcode) {
      localStorage.setItem('vietmath_is_locked', 'true');
      setIsLockedUI(true);
    } else {
      setSecurityDialogMode('set');
      setShowSecurityDialog(true);
    }
  };

  const handleUnlockWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    if (cooldownTime > 0) {
      setUnlockError(`Quá nhiều lần thử sai! Hệ thống tự khóa tạm thời, hãy đợi ${cooldownTime} giây.`);
      return;
    }
    if (unlockInput === passcode) {
      localStorage.setItem('vietmath_is_locked', 'false');
      setIsLockedUI(false);
      setUnlockInput('');
      setFailedAttempts(0);
    } else {
      const remainingAttempts = 5 - (failedAttempts + 1);
      if (remainingAttempts <= 0) {
        setCooldownTime(120); // Locking for 2 minutes
        setUnlockError('Phát hiện xâm nhập lạ! Hệ thống tự đóng băng 120 giây.');
        setFailedAttempts(0);
      } else {
        setFailedAttempts(p => p + 1);
        setUnlockError(`Mật khẩu không chính xác! Hãy nhập lại thiết đặt ban đầu (Nhập sai thêm ${remainingAttempts} lần sẽ dính khóa đóng băng).`);
      }
    }
  };

  const handleClearPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setSecError('');
    if (secPassInput !== passcode) {
      setSecError('Mật khẩu hiện tại không chính xác. Không thể gỡ bỏ bảo mật.');
      return;
    }
    localStorage.removeItem('vietmath_passcode');
    localStorage.removeItem('vietmath_is_locked');
    setPasscode('');
    setIsLockedUI(false);
    setShowSecurityDialog(false);
    setSecPassInput('');
  };

  return (
    <div className={cn(
      "min-h-screen font-sans selection:bg-[#141414] selection:text-[#E4E3E0] transition-colors duration-300",
      isTabletMode 
        ? "bg-[#1C1B1A] p-4 md:p-8 flex flex-col items-center justify-center min-h-screen" 
        : "bg-[#E4E3E0] text-[#141414]"
    )}>
      <div className={cn(
        "w-full transition-all duration-300 flex flex-col relative",
        isTabletMode 
          ? "max-w-[1280px] h-[90vh] md:h-[800px] bg-[#E4E3E0] text-[#141414] border-[16px] border-[#2E2E2D] rounded-[2.5rem] shadow-2xl overflow-y-auto custom-scrollbar" 
          : "min-h-screen"
      )}>
        {isTabletMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#111] rounded-full z-50 border border-[#444] pointer-events-none" />
        )}
        {/* Header */}
      <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#141414] flex items-center justify-center rounded-sm">
            <Calculator className="text-[#E4E3E0] w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif italic text-2xl leading-none">VietMath Pro</h1>
              {passcode ? (
                <span className="flex items-center px-2 py-0.5 text-[9px] bg-emerald-100 border border-emerald-400 text-emerald-800 rounded font-mono uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3 mr-0.5 inline-block text-emerald-600 animate-pulse" /> Protected
                </span>
              ) : (
                <span className="flex items-center px-2 py-0.5 text-[9px] bg-amber-100 border border-amber-400 text-amber-800 rounded font-mono uppercase tracking-wider">
                  <ShieldAlert className="w-3 h-3 mr-0.5 inline-block text-amber-600 animate-pulse" /> Unprotected
                </span>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-widest opacity-50 font-mono mt-1">Advanced Mathematical Suite • CAS Core</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloudflare Core Shield Control Integration */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-white/40 border border-[#141414]/10 rounded-sm">
            {passcode ? (
              <>
                <button
                  onClick={handleLockWorkspace}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] text-[#E4E3E0] hover:bg-neutral-800 text-xs font-mono rounded-sm transition-colors uppercase tracking-wider font-semibold"
                  title="Đóng băng khóa toàn bộ workspace để không ai vào can thiệp"
                >
                  <Lock className="w-3 h-3 text-red-400" />
                  Khóa Workspace
                </button>
                <button
                  onClick={() => {
                    setSecurityDialogMode('manage');
                    setSecError('');
                    setSecPassInput('');
                    setShowSecurityDialog(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-[#141414]/20 hover:bg-white text-xs font-mono rounded-sm text-neutral-700 transition"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  Gỡ bảo mật
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setSecurityDialogMode('set');
                  setSecError('');
                  setSecPassInput('');
                  setSecPassConfirmInput('');
                  setShowSecurityDialog(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-mono rounded-sm transition uppercase tracking-wider font-semibold shadow-sm"
              >
                <Shield className="w-3.5 h-3.5" />
                Cài Khóa Công Trình
              </button>
            )}
          </div>

          {/* Nút chuyển đổi Giao diện Tablet */}
          <button
            onClick={() => {
              const newValue = !isTabletMode;
              localStorage.setItem('vietmath_tablet_mode', String(newValue));
              setIsTabletMode(newValue);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono rounded-sm transition-all uppercase tracking-wider font-semibold shadow-sm focus:outline-none cursor-pointer",
              isTabletMode 
                ? "bg-[#141414] text-[#E4E3E0] border-[#141414] hover:bg-neutral-800" 
                : "bg-white/40 border-[#141414]/10 text-neutral-800 hover:bg-white hover:border-[#141414]"
            )}
            title={isTabletMode ? "Phóng to toàn màn hình" : "Khung Tablet nằm ngang"}
          >
            <Tablet className="w-3.5 h-3.5" />
            <span>{isTabletMode ? "Màn lớn" : "Tablet Mode"}</span>
          </button>

          {currentMode !== 'menu' && (
            <button 
              onClick={() => {
                if (isLockedUI) return;
                setCurrentMode('menu');
              }}
              className="flex items-center gap-2 px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors text-xs font-mono uppercase tracking-wider"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Menu
            </button>
          )}
        </div>
      </header>

      {/* Security Administration Dialog (Set, Manage active passcode) */}
      {showSecurityDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#E4E3E0] border-2 border-[#141414] w-full max-w-md p-6 relative rounded-sm shadow-xl animate-in fade-in zoom-in duration-150">
            <button 
              onClick={() => setShowSecurityDialog(false)}
              className="absolute top-4 right-4 text-[#141414] hover:bg-black/10 p-1.5 rounded"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#141414] text-[#E4E3E0] rounded">
                <Key className="w-5 h-5" />
              </div>
              <h2 className="font-serif italic text-xl">Cloudflare-Shield Security Locks</h2>
            </div>
            
            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Thiết lập bảo mật ngăn chặn hoàn toàn việc người truy cập thứ hai tự ý sửa đổi, xóa bỏ dữ lưu trữ, tọa độ khảo sát và các công trình Toán học tự chọn của bạn trong Workspace VietMath Pro.
            </p>

            {securityDialogMode === 'set' && (
              <form onSubmit={handleSetPasscode} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">Mật khẩu mới (Tối thiểu 4 ký tự)</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={secPassInput}
                    onChange={e => setSecPassInput(e.target.value)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={secPassConfirmInput}
                    onChange={e => setSecPassConfirmInput(e.target.value)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                {secError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 inline shrink-0" /> {secError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 text-xs font-mono uppercase tracking-widest transition"
                >
                  Kích Hoạt Bảo Vệ Cao Cấp
                </button>
              </form>
            )}

            {securityDialogMode === 'manage' && (
              <form onSubmit={handleClearPasscode} className="space-y-4">
                <p className="text-xs text-amber-800 bg-amber-50 border border-amber-300 p-2 rounded">
                  ⚠️ Cảnh báo: Việc gỡ mật khẩu sẽ huỷ tính năng chống phá hoại từ bên thứ ba. Hãy gõ mật mã hiện tại để hoàn tất quá trình gỡ bỏ.
                </p>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-500 mb-1">Nhập Mật Khẩu Hiện Tại</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={secPassInput}
                    onChange={e => setSecPassInput(e.target.value)}
                    className="w-full bg-white border border-[#141414] px-3 py-2 text-sm font-mono tracking-widest focus:outline-none"
                  />
                </div>
                {secError && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-semibold">
                    <AlertCircle className="w-3.5 h-3.5 inline shrink-0" /> {secError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-mono uppercase tracking-widest transition"
                >
                  Xác Nhận Gỡ Bỏ Khóa
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Master Security Key Lock Immersive Screen Overlay */}
      {isLockedUI ? (
        <div className="fixed inset-0 bg-[#E4E3E0] z-[99] flex flex-col justify-center items-center p-6 select-none animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white border-4 border-[#141414] p-8 rounded-sm shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
            
            {/* High Tech Cyber-themed visualizer */}
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-16 h-16 bg-red-100 border-2 border-red-600 rounded-full flex items-center justify-center text-red-600 animate-bounce">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-serif italic text-2xl text-[#141414]">VIETMATH SECURITY COLD-LOCK</h2>
                <div className="mt-1.5 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-red-600 font-bold">Secure Locked Environment</p>
                </div>
              </div>
              <p className="text-xs text-[#141414]/70 leading-relaxed font-sans max-w-sm">
                Không gian thiết lập bảo mật cấp cao đã kích hoạt. Tránh trường hợp người truy cập khác xóa phá hoại các nghiên cứu hay công trình toán học quý báu của bạn trong Workspace.
              </p>
            </div>

            <form onSubmit={handleUnlockWorkspace} className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Mã khoá của chuyên gia</label>
                  {cooldownTime > 0 && (
                    <span className="text-[10px] font-mono text-red-600 font-bold">Wait {cooldownTime}s</span>
                  )}
                </div>
                <input
                  type="password"
                  required
                  disabled={cooldownTime > 0}
                  placeholder="Nhập khóa để mở công trình..."
                  value={unlockInput}
                  onChange={e => setUnlockInput(e.target.value)}
                  className={`w-full bg-slate-50 border-2 border-slate-300 disabled:opacity-50 px-4 py-3 text-center text-lg font-mono tracking-[0.5em] focus:outline-none focus:border-[#141414] transition-all`}
                  autoFocus
                />
              </div>

              {unlockError && (
                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-600 flex gap-1.5 font-bold rounded-sm my-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{unlockError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={cooldownTime > 0}
                className="w-full py-3 bg-[#141414] text-[#E4E3E0] hover:bg-[#141414]/90 disabled:opacity-50 cursor-pointer text-xs font-mono font-bold uppercase tracking-widest transition shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] active:translate-y-1 active:shadow-none"
              >
                Mở Khóa Toàn Bộ Workspace 🔓
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-dashed border-neutral-300 text-center">
              <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                VietMath Pro Protection Base • Secured via Service-Worker Dynamic Caching Engine
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <AnimatePresence mode="wait">
          {currentMode === 'menu' ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setCurrentMode(mode.id)}
                  className="group relative flex flex-col p-8 bg-white border border-[#141414] hover:bg-[#141414] transition-all duration-300 text-left"
                >
                  <div className={cn("w-12 h-12 flex items-center justify-center mb-6 transition-transform group-hover:scale-110", mode.color)}>
                    <div className="text-white">{mode.icon}</div>
                  </div>
                  <h3 className="font-serif italic text-2xl mb-2 group-hover:text-[#E4E3E0]">{mode.title}</h3>
                  <p className="text-sm opacity-60 group-hover:text-[#E4E3E0] group-hover:opacity-80 font-mono">{mode.description}</p>
                  <ArrowRight className="absolute bottom-8 right-8 w-6 h-6 opacity-0 group-hover:opacity-100 group-hover:text-[#E4E3E0] transition-all transform translate-x-[-10px] group-hover:translate-x-0" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={currentMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white border border-[#141414] p-8 md:p-12 shadow-[12px_12px_0px_0px_rgba(20,20,20,1)]"
            >
              <ModeRenderer 
                mode={currentMode} 
                globalBuffer={globalBuffer} 
                setGlobalBuffer={setGlobalBuffer} 
                userFunctions={userFunctions}
                setUserFunctions={setUserFunctions}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-12 border-t border-[#141414] p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-mono">
          Precision Computation Engine &copy; 2026
        </p>
      </footer>
      </div> {/* Close the inner device container */}
      {isTabletMode && (
        <div className="mt-4 text-xs font-mono text-zinc-500 uppercase tracking-widest text-center select-none animate-pulse">
          Landscape Tablet Pro (1280 x 800) • Camera Lens Center-Top
        </div>
      )}
    </div>
  );
}

const REGRESSION_MODELS = [
  { id: 'linear', label: 'Tuyến tính: y = ax + b' },
  { id: 'quadratic', label: 'Bậc 2: y = ax² + bx + c' },
  { id: 'cubic', label: 'Bậc 3: y = ax³ + bx² + cx + d' },
  { id: 'quartic', label: 'Bậc 4: y = ax⁴ + bx³ + cx² + dx + e' },
  { id: 'quintic', label: 'Bậc 5: y = ax⁵ + bx⁴ + cx³ + dx² + ex + f' },
  { id: 'inverse', label: 'Nghịch đảo: y = a + b/x' },
  { id: 'hyperbolic', label: 'Hyperbol: y = a + b/x + c/x²' },
  { id: 'logarithmic', label: 'Logarit: y = a + b*ln(x)' },
  { id: 'exponential', label: 'Mũ (e): y = a*e^bx' },
  { id: 'power_base', label: 'Mũ (ab): y = a*b^x' },
  { id: 'power_exp', label: 'Lũy thừa: y = a*x^b' },
  { id: 'root', label: 'Căn thức: y = a + b*√x' },
  { id: 'logistic', label: 'Logistic: y = c / (1 + a*e^-bx)' },
  { id: 'quantile', label: 'Trung vị: y = ax + b' },
  { id: 'decision_tree', label: 'Cây Quyết định: y = Tree(x)' },
  { id: 'random_forest', label: 'Random Forest: y = Forest(x)' }
] as const;

// --- Helper for GDPT 2018/2026 Quartiles ---
function calculateQuartilesGDPT(sortedData: number[]) {
  const n = sortedData.length;
  let q1, q2, q3;
  let steps: string[] = [];

  if (n === 0) return { q1: 0, q2: 0, q3: 0, steps: ["Không có dữ liệu"] };

  steps.push(`Tổng số phần tử n = ${n}`);

  // Median Q2
  if (n % 2 !== 0) {
    const pos = (n + 1) / 2;
    q2 = sortedData[pos - 1];
    steps.push(`1. Tìm trung vị Q2: n lẻ (${n}) => Vị trí (n+1)/2 = ${pos}. Q2 = x(${pos}) = ${q2}`);
  } else {
    const pos1 = n / 2;
    const pos2 = n / 2 + 1;
    q2 = (sortedData[pos1 - 1] + sortedData[pos2 - 1]) / 2;
    steps.push(`1. Tìm trung vị Q2: n chẵn (${n}) => Trung bình cộng vị trí n/2 = ${pos1} và n/2+1 = ${pos2}. Q2 = [x(${pos1}) + x(${pos2})]/2 = (${sortedData[pos1 - 1]} + ${sortedData[pos2 - 1]})/2 = ${q2}`);
  }

  // Split halves
  let lowerHalf: number[];
  let upperHalf: number[];
  if (n % 2 !== 0) {
    const midIdx = Math.floor(n / 2);
    lowerHalf = sortedData.slice(0, midIdx);
    upperHalf = sortedData.slice(midIdx + 1);
    steps.push(`2. Chia dãy số: Vì n lẻ, loại bỏ giá trị trung vị Q2. Nửa dưới có ${lowerHalf.length} phần tử, nửa trên có ${upperHalf.length} phần tử.`);
  } else {
    const midIdx = n / 2;
    lowerHalf = sortedData.slice(0, midIdx);
    upperHalf = sortedData.slice(midIdx);
    steps.push(`2. Chia dãy số: Vì n chẵn, chia đôi dãy số tại vị trí giữa ${n / 2} và ${n / 2 + 1}. Mỗi nửa có ${lowerHalf.length} phần tử.`);
  }

  // Q1 (Median of lower half)
  const nL = lowerHalf.length;
  if (nL === 0) {
    q1 = sortedData[0];
    steps.push(`Q1: Nửa dưới rỗng, mặc định Q1 = ${q1}`);
  } else if (nL % 2 !== 0) {
    const pos = (nL + 1) / 2;
    q1 = lowerHalf[pos - 1];
    steps.push(`3. Tìm Q1 (trung vị nửa dưới): n_dưới lẻ (${nL}) => Vị trí ${pos}. Q1 = ${q1}`);
  } else {
    const pos1 = nL / 2;
    const pos2 = nL / 2 + 1;
    q1 = (lowerHalf[pos1 - 1] + lowerHalf[pos2 - 1]) / 2;
    steps.push(`3. Tìm Q1 (trung vị nửa dưới): n_dưới chẵn (${nL}) => Trung bình cộng vị trí ${pos1} và ${pos2}. Q1 = (${lowerHalf[pos1 - 1]} + ${lowerHalf[pos2 - 1]})/2 = ${q1}`);
  }

  // Q3 (Median of upper half)
  const nU = upperHalf.length;
  if (nU === 0) {
    q3 = sortedData[n - 1];
    steps.push(`Q3: Nửa trên rỗng, mặc định Q3 = ${q3}`);
  } else if (nU % 2 !== 0) {
    const pos = (nU + 1) / 2;
    q3 = upperHalf[pos - 1];
    steps.push(`4. Tìm Q3 (trung vị nửa trên): n_trên lẻ (${nU}) => Vị trí ${pos}. Q3 = ${q3}`);
  } else {
    const pos1 = nU / 2;
    const pos2 = nU / 2 + 1;
    q3 = (upperHalf[pos1 - 1] + upperHalf[pos2 - 1]) / 2;
    steps.push(`4. Tìm Q3 (trung vị nửa trên): n_trên chẵn (${nU}) => Trung bình cộng vị trí ${pos1} và ${pos2}. Q3 = (${upperHalf[pos1 - 1]} + ${upperHalf[pos2 - 1]})/2 = ${q3}`);
  }

  return { q1, q2, q3, steps };
}

function Mode14() {
  const [isBivariate, setIsBivariate] = useState(false);
  const [showFreq, setShowFreq] = useState(false);
  const [pendingFreq, setPendingFreq] = useState(false);
  const [showGrouping, setShowGrouping] = useState(false);
  const [pendingGrouping, setPendingGrouping] = useState(false);
  const [regressionType, setRegressionType] = useState<typeof REGRESSION_MODELS[number]['id']>('linear');
  const [showRegressionSelector, setShowRegressionSelector] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<{ x: string; y: string; f: string; from?: string; to?: string }[]>(
    Array(80).fill(null).map(() => ({ x: '', y: '', f: '1', from: '', to: '' }))
  );
  const [groupConfig, setGroupConfig] = useState({
    method: 'basic',
    start: '',
    step: '',
    count: '5',
    maxDepth: '3',
    minSamples: '2',
    nEstimators: '10'
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [savedTables, setSavedTables] = useState<{ id: string; name: string; data: any[] }[]>([]);

  const maxRows = 255;
  const currentRowsCount = rows.length;

  const calculateFontSize = () => {
    if (currentRowsCount <= 80) return 14;
    const newSize = 14 - ((currentRowsCount - 80) * (4 / 175));
    return Math.max(10, Math.round(newSize));
  };

  const fontSize = calculateFontSize();

  const addRows = (count: number) => {
    if (rows.length + count > maxRows) return;
    setRows([...rows, ...Array(count).fill(null).map(() => ({ x: '', y: '', f: '1' }))]);
  };

  const updateRow = (idx: number, field: 'x' | 'y' | 'f' | 'from' | 'to', val: string) => {
    const newRows = [...rows];
    newRows[idx][field] = val;
    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIdx: number, col: 'x' | 'y' | 'f' | 'from' | 'to') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      let nextRow = rowIdx;
      let nextCol: 'x' | 'y' | 'f' | 'from' | 'to' = col;

      if (showGrouping) {
        if (col === 'from') nextCol = 'to';
        else if (col === 'to') {
          if (showFreq) nextCol = 'f';
          else { nextRow++; nextCol = 'from'; }
        } else if (col === 'f') {
          nextRow++; nextCol = 'from';
        }
      } else {
        if (col === 'x') {
          if (isBivariate) nextCol = 'y';
          else if (showFreq) nextCol = 'f';
          else { nextRow++; nextCol = 'x'; }
        } else if (col === 'y') {
          if (showFreq) nextCol = 'f';
          else { nextRow++; nextCol = 'x'; }
        } else if (col === 'f') {
          nextRow++;
          nextCol = 'x';
        }
      }

      if (nextRow < rows.length) {
        const nextInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLInputElement;
        if (nextInput) nextInput.focus();
      } else if (nextRow === rows.length && nextRow < maxRows) {
        addRows(10);
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-row="${nextRow}"][data-col="${nextCol}"]`) as HTMLInputElement;
          if (nextInput) nextInput.focus();
        }, 50);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const newRows = lines.map(line => {
      const parts = line.split(/[\t,;]/);
      return {
        x: parts[0]?.trim() || '',
        y: parts[1]?.trim() || '',
        f: parts[2]?.trim() || '1'
      };
    });
    
    if (newRows.length > 0) {
      setRows(newRows.slice(0, maxRows));
    }
  };

  // Helper for polynomial regression (Least Squares)
  const solvePolynomial = (data: [number, number][], degree: number) => {
    const n = data.length;
    const lhs = Array(degree + 1).fill(0).map(() => Array(degree + 1).fill(new Fraction(0)));
    const rhs = Array(degree + 1).fill(new Fraction(0));

    for (let i = 0; i <= degree; i++) {
      for (let j = 0; j <= degree; j++) {
        let sumX = new Fraction(0);
        for (const [x] of data) {
          sumX = sumX.add(new Fraction(Math.pow(x, i + j)));
        }
        lhs[i][j] = sumX;
      }
      let sumY = new Fraction(0);
      for (const [x, y] of data) {
        sumY = sumY.add(new Fraction(y * Math.pow(x, i)));
      }
      rhs[i] = sumY;
    }

    // Gaussian elimination with Fraction
    const result = solveLinearSystem(lhs, rhs);
    return result; // [c, b, a, ...] for ax^2 + bx + c
  };

  
  const generateGroupTable = () => {
    const bigMath25 = math.create(math.all, { number: 'BigNumber', precision: 25 });
    
    let boundaries: any[] = [];

    if (groupConfig.method === 'basic') {
      const start = parseFloat(groupConfig.start);
      const step = parseFloat(groupConfig.step);
      const count = parseInt(groupConfig.count);

      if (isNaN(start) || isNaN(step) || isNaN(count) || count <= 0 || step <= 0) {
        setError("Vui lòng nhập đúng Bắt đầu, Khoảng chia (>0) và Số nhóm (>0)");
        return;
      }

      let currentStart = bigMath25.bignumber(start);
      const bigStep = bigMath25.bignumber(step);
      
      boundaries.push(currentStart);
      for (let i = 0; i < count; i++) {
        currentStart = bigMath25.add(currentStart, bigStep) as any;
        boundaries.push(currentStart);
      }
    } else {
      // Decision Tree or Random Forest
      const rawData: number[] = [];
      rows.forEach(r => {
        if (r.x && r.x.trim() !== '') {
          const xVal = parseFloat(r.x);
          const fVal = r.f && r.f.trim() !== '' ? parseInt(r.f) : 1;
          if (!isNaN(xVal) && !isNaN(fVal) && fVal > 0) {
            for (let i = 0; i < fVal; i++) rawData.push(xVal);
          }
        }
      });

      if (rawData.length === 0) {
        setError("Vui lòng nhập dữ liệu gốc vào cột X trước khi ghép nhóm bằng Cây quyết định / Random Forest");
        return;
      }

      const maxDepth = parseInt(groupConfig.maxDepth) || 3;
      const minSamples = parseInt(groupConfig.minSamples) || 2;

      const getSplits = (data: number[], depth: number): number[] => {
        if (depth >= maxDepth || data.length < minSamples) return [];
        
        let bestSplit = -1;
        let minSSE = Infinity;
        
        const sorted = [...data].sort((a, b) => a - b);
        const uniqueVals = Array.from(new Set(sorted));
        
        if (uniqueVals.length < 2) return [];

        for (let i = 0; i < uniqueVals.length - 1; i++) {
          const split = (uniqueVals[i] + uniqueVals[i+1]) / 2;
          const L = sorted.filter(x => x < split);
          const R = sorted.filter(x => x >= split);
          
          if (L.length === 0 || R.length === 0) continue;

          const meanL = L.reduce((a, b) => a + b, 0) / L.length;
          const meanR = R.reduce((a, b) => a + b, 0) / R.length;
          
          const sseL = L.reduce((a, b) => a + Math.pow(b - meanL, 2), 0);
          const sseR = R.reduce((a, b) => a + Math.pow(b - meanR, 2), 0);
          const sse = sseL + sseR;
          
          if (sse < minSSE) {
            minSSE = sse;
            bestSplit = split;
          }
        }
        
        if (bestSplit === -1) return [];
        
        const L = sorted.filter(x => x < bestSplit);
        const R = sorted.filter(x => x >= bestSplit);
        
        return [
          bestSplit,
          ...getSplits(L, depth + 1),
          ...getSplits(R, depth + 1)
        ];
      };

      let splits: number[] = [];

      if (groupConfig.method === 'dt') {
        splits = getSplits(rawData, 0);
      } else if (groupConfig.method === 'rf') {
        const nEstimators = parseInt(groupConfig.nEstimators) || 10;
        const allSplits: number[] = [];
        for (let i = 0; i < nEstimators; i++) {
          const sample = Array.from({length: rawData.length}, () => rawData[Math.floor(Math.random() * rawData.length)]);
          allSplits.push(...getSplits(sample, 0));
        }
        
        if (allSplits.length > 0) {
           allSplits.sort((a, b) => a - b);
           const threshold = (Math.max(...rawData) - Math.min(...rawData)) / 20;
           let currentCluster = [allSplits[0]];
           const consensusSplits = [];
           for (let i = 1; i < allSplits.length; i++) {
             if (allSplits[i] - currentCluster[currentCluster.length - 1] < threshold) {
               currentCluster.push(allSplits[i]);
             } else {
               consensusSplits.push(currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length);
               currentCluster = [allSplits[i]];
             }
           }
           consensusSplits.push(currentCluster.reduce((a, b) => a + b, 0) / currentCluster.length);
           splits = consensusSplits;
        }
      }

      splits = Array.from(new Set(splits)).sort((a, b) => a - b);
      
      const minVal = Math.min(...rawData);
      const maxVal = Math.max(...rawData);
      
      boundaries = [bigMath25.bignumber(minVal)];
      splits.forEach(s => {
        if (s > minVal && s < maxVal) boundaries.push(bigMath25.bignumber(s));
      });
      const padding = (maxVal - minVal) * 0.01 || 1;
      boundaries.push(bigMath25.bignumber(maxVal + padding));
    }

    const newRows = [];
    
    const rawData: number[] = [];
    rows.forEach(r => {
      if (r.x && r.x.trim() !== '') {
        const xVal = parseFloat(r.x);
        const fVal = r.f && r.f.trim() !== '' ? parseInt(r.f) : 1;
        if (!isNaN(xVal) && !isNaN(fVal) && fVal > 0) {
          for (let i = 0; i < fVal; i++) rawData.push(xVal);
        }
      }
    });

    const formatTruncate = (val: any) => {
      const str = bigMath25.format(val, { notation: 'fixed', precision: 25 });
      return str; // Keep 25 digits internally
    };

    for (let i = 0; i < boundaries.length - 1; i++) {
      const from = boundaries[i];
      const to = boundaries[i+1];
      
      let freq = 0;
      if (rawData.length > 0) {
         freq = rawData.filter(x => {
           const bx = bigMath25.bignumber(x);
           return bigMath25.largerEq(bx, from) && bigMath25.smaller(bx, to);
         }).length;
      }

      newRows.push({
        x: '', y: '', 
        f: freq > 0 ? freq.toString() : '1',
        from: formatTruncate(from),
        to: formatTruncate(to)
      });
    }
    
    while (newRows.length < maxRows) {
      newRows.push({ x: '', y: '', f: '1', from: '', to: '' });
    }

    setRows(newRows);
    setPendingGrouping(false);
    setError(null);
    setShowFreq(true); // Auto enable freq for grouped data
  };


  const runStats = () => {
    setLoading(true);
    try {
      const bigMath = math.create(math.all, { number: 'BigNumber', precision: 60 });
      
      let xValues: number[] = [];
      let yValues: number[] = [];
      let weightedData: [number, number][] = [];
      let totalFreq = 0;
      let rowCount = 0;

      let sumX = bigMath.bignumber(0);
      let sumX2 = bigMath.bignumber(0);
      let sumX3: any = bigMath.bignumber(0);
      let sumX4: any = bigMath.bignumber(0);
      let sumY = bigMath.bignumber(0);
      let sumY2: any = bigMath.bignumber(0);
      let sumXY = bigMath.bignumber(0);
      let sumX2Y: any = bigMath.bignumber(0);

      let groups: any[] = [];
      let currentCf = 0;
      let maxFreq = -1;
      let modalGroupIndex = -1;

      if (showGrouping) {
        const validRows = rows.filter(r => r.from && r.to && r.from.trim() !== '' && r.to.trim() !== '' && !isNaN(parseFloat(r.from)) && !isNaN(parseFloat(r.to)));
        if (validRows.length === 0) throw new Error("Không có dữ liệu nhóm hợp lệ");
        
        validRows.forEach((r, i) => {
          const L = bigMath.bignumber(r.from!);
          const U = bigMath.bignumber(r.to!);
          const fStr = r.f.trim();
          const count = showFreq ? Math.max(1, Math.round(parseFloat(fStr) || 1)) : 1;
          
          totalFreq += count;
          currentCf += count;
          rowCount++;
          
          const displayL = r.from!.length > 10 ? (Math.trunc(parseFloat(r.from!) * 1e7) / 1e7).toString() : r.from;
          const displayU = r.to!.length > 10 ? (Math.trunc(parseFloat(r.to!) * 1e7) / 1e7).toString() : r.to;
          
          groups.push({ range: `[${displayL} - ${displayU})`, count, cf: currentCf, L, U });
          
          if (count > maxFreq) {
            maxFreq = count;
            modalGroupIndex = i;
          }
          
          const c = bigMath.divide(bigMath.add(L, U), 2);
          const bf = bigMath.bignumber(count);
          
          sumX = bigMath.add(sumX, bigMath.multiply(bf, c)) as any;
          sumX2 = bigMath.add(sumX2, bigMath.multiply(bf, bigMath.pow(c, 2))) as any;
          sumX3 = bigMath.add(sumX3, bigMath.multiply(bf, bigMath.pow(c, 3))) as any;
          sumX4 = bigMath.add(sumX4, bigMath.multiply(bf, bigMath.pow(c, 4))) as any;
        });
        
        let currentCumFr = 0;
        groups.forEach(g => {
          g.fr = g.count / totalFreq;
          currentCumFr += g.fr;
          g.cumFr = currentCumFr;
        });
      } else {
        const validRows = rows.filter(r => {
          const x = r.x.trim();
          const y = r.y.trim();
          if (isBivariate) {
            return x !== '' && !isNaN(parseFloat(x)) && y !== '' && !isNaN(parseFloat(y));
          }
          return x !== '' && !isNaN(parseFloat(x));
        });

        if (validRows.length === 0) throw new Error("Không có dữ liệu hợp lệ (Cần ít nhất 1 giá trị X)");
        rowCount = validRows.length;

        validRows.forEach(r => {
          const xStr = r.x.trim();
          const yStr = r.y.trim();
          const fStr = r.f.trim();
          
          const xNum = parseFloat(xStr);
          const yNum = parseFloat(yStr);
          const fNum = showFreq ? Math.max(1, Math.round(parseFloat(fStr) || 1)) : 1;
          
          const bx = bigMath.bignumber(xStr);
          const by = isBivariate && yStr !== '' ? bigMath.bignumber(yStr) : null;
          const bf = bigMath.bignumber(fNum);
          
          totalFreq += fNum;
          
          sumX = bigMath.add(sumX, bigMath.multiply(bx, bf)) as any;
          sumX2 = bigMath.add(sumX2, bigMath.multiply(bigMath.pow(bx, 2), bf)) as any;
          sumX3 = bigMath.add(sumX3, bigMath.multiply(bigMath.pow(bx, 3), bf)) as any;
          sumX4 = bigMath.add(sumX4, bigMath.multiply(bigMath.pow(bx, 4), bf)) as any;

          if (isBivariate && by !== null) {
            sumY = bigMath.add(sumY, bigMath.multiply(by, bf)) as any;
            sumY2 = bigMath.add(sumY2, bigMath.multiply(bigMath.pow(by, 2), bf)) as any;
            sumXY = bigMath.add(sumXY, bigMath.multiply(bigMath.multiply(bx, by), bf)) as any;
            sumX2Y = bigMath.add(sumX2Y, bigMath.multiply(bigMath.multiply(bigMath.pow(bx, 2), by), bf)) as any;
          }

          for (let i = 0; i < fNum; i++) {
            xValues.push(xNum);
            if (isBivariate && !isNaN(yNum)) {
              yValues.push(yNum);
              weightedData.push([xNum, yNum]);
            }
          }
        });
        
        if (xValues.length === 0) throw new Error("Dữ liệu không hợp lệ");
        xValues.sort((a, b) => a - b);
      }



      let freqTableX: any[] | null = null;
      let medianX = bigMath.bignumber(0);
      let q1X = bigMath.bignumber(0);
      let q3X = bigMath.bignumber(0);
      let quartileStepsX: string[] = [];
      let groupedQuartiles: any = null;
      let modeX = bigMath.bignumber(0);
      let modeStepsX: string[] = [];
      let hasModeX = false;
      let minX = bigMath.bignumber(0);
      let maxX = bigMath.bignumber(0);

      const nBig = bigMath.bignumber(totalFreq);
      let meanX = bigMath.divide(sumX, nBig) as any;
      const meanX2 = bigMath.pow(meanX, 2) as any;
      let popVarX = bigMath.subtract(bigMath.divide(sumX2, nBig), meanX2) as any;
      let popStdX = bigMath.sqrt(bigMath.max(0, popVarX as any) as any) as any;
      
      let varX = bigMath.bignumber(0);
      let stdX = bigMath.bignumber(0);
      if (totalFreq > 1) {
        varX = bigMath.multiply(popVarX, bigMath.divide(nBig, bigMath.subtract(nBig, 1))) as any;
        stdX = bigMath.sqrt(bigMath.max(0, varX as any) as any) as any;
      }

      if (showGrouping) {
        minX = bigMath.bignumber(groups[0].L);
        maxX = bigMath.bignumber(groups[groups.length - 1].U);

        // Grouped data quartiles
        const calculateGroupedQ = (p: number) => {
          const target = (p * totalFreq) / 4;
          let currentCf = 0;
          for (let i = 0; i < groups.length; i++) {
            const prevCf = currentCf;
            currentCf += groups[i].count;
            if (currentCf >= target) {
              const L = groups[i].L;
              const U = groups[i].U;
              const h = bigMath.subtract(U, L);
              const f = groups[i].count;
              if (f === 0) return null;
              
              const targetDiff = bigMath.bignumber(target - prevCf);
              const fBig = bigMath.bignumber(f);
              const q = bigMath.add(L, bigMath.multiply(bigMath.divide(targetDiff, fBig), h));
              
              return { value: q, group: groups[i].range, L, h, f, prevCf, target };
            }
          }
          return null;
        };

        const gQ1 = calculateGroupedQ(1);
        const gQ2 = calculateGroupedQ(2);
        const gQ3 = calculateGroupedQ(3);
        
        if (gQ1 && gQ2 && gQ3) {
          q1X = gQ1.value;
          medianX = gQ2.value;
          q3X = gQ3.value;
          
          const formatDisp = (val: any) => {
            const str = bigMath.format(val, { notation: 'fixed', precision: 25 });
            const parts = str.split('.');
            if (parts.length === 1) return str;
            const truncated = parts[0] + '.' + parts[1].substring(0, 7);
            return truncated.replace(/\.?0+$/, '');
          };
          groupedQuartiles = {
            q1: gQ1,
            q2: gQ2,
            q3: gQ3,
            steps: [
              `Q1: Nhóm chứa Q1 là ${gQ1.group} (vị trí n/4 = ${gQ1.target}). Q1 = ${formatDisp(gQ1.L)} + ((${gQ1.target} - ${gQ1.prevCf}) / ${gQ1.f}) * ${formatDisp(gQ1.h)} = ${formatDisp(gQ1.value)}`,
              `Q2: Nhóm chứa Q2 là ${gQ2.group} (vị trí n/2 = ${gQ2.target}). Q2 = ${formatDisp(gQ2.L)} + ((${gQ2.target} - ${gQ2.prevCf}) / ${gQ2.f}) * ${formatDisp(gQ2.h)} = ${formatDisp(gQ2.value)}`,
              `Q3: Nhóm chứa Q3 là ${gQ3.group} (vị trí 3n/4 = ${gQ3.target}). Q3 = ${formatDisp(gQ3.L)} + ((${gQ3.target} - ${gQ3.prevCf}) / ${gQ3.f}) * ${formatDisp(gQ3.h)} = ${formatDisp(gQ3.value)}`
            ]
          };
        }

        // Calculate Mode for grouped data
        if (modalGroupIndex !== -1) {
          const m_p = groups[modalGroupIndex].count;
          const m_prev = modalGroupIndex > 0 ? groups[modalGroupIndex - 1].count : 0;
          const m_next = modalGroupIndex < groups.length - 1 ? groups[modalGroupIndex + 1].count : 0;
          const L = groups[modalGroupIndex].L;
          const U = groups[modalGroupIndex].U;
          const h = bigMath.subtract(U, L);
          
          const d1 = m_p - m_prev;
          const d2 = m_p - m_next;
          
          if (d1 + d2 > 0) {
            const d1Big = bigMath.bignumber(d1);
            const dSumBig = bigMath.bignumber(d1 + d2);
            const mo = bigMath.add(L, bigMath.multiply(bigMath.divide(d1Big, dSumBig), h));
            modeX = mo as any;
            hasModeX = true;
            
            const formatDisp = (val: any) => {
              const str = bigMath.format(val, { notation: 'fixed', precision: 25 });
              const parts = str.split('.');
              if (parts.length === 1) return str;
              const truncated = parts[0] + '.' + parts[1].substring(0, 7);
              return truncated.replace(/\.?0+$/, '');
            };
            
            modeStepsX = [
              `Nhóm chứa mốt là ${groups[modalGroupIndex].range} với tần số lớn nhất m_p = ${m_p}`,
              `M_o = ${formatDisp(L)} + ((${m_p} - ${m_prev}) / ((${m_p} - ${m_prev}) + (${m_p} - ${m_next}))) * ${formatDisp(h)} = ${formatDisp(mo)}`
            ];
          }
        }
      } else {
        minX = bigMath.bignumber(xValues[0]);
        maxX = bigMath.bignumber(xValues[xValues.length - 1]);

        const freqMapX = new Map<number, number>();
        xValues.forEach(v => freqMapX.set(v, (freqMapX.get(v) || 0) + 1));
        const sortedUniqueX = Array.from<number>(freqMapX.keys()).sort((a: number, b: number) => a - b);
        let cfX = 0;
        freqTableX = sortedUniqueX.map(x => {
          const f = freqMapX.get(x)!;
          cfX += f;
          return { x, f, cf: cfX };
        });

        const quartilesX = calculateQuartilesGDPT(xValues);
        medianX = bigMath.bignumber(quartilesX.q2);
        q1X = bigMath.bignumber(quartilesX.q1);
        q3X = bigMath.bignumber(quartilesX.q3);
        quartileStepsX = quartilesX.steps;
      }

      let meanY = bigMath.bignumber(0), stdY = bigMath.bignumber(0), popStdY = bigMath.bignumber(0), medianY = bigMath.bignumber(0), minY = bigMath.bignumber(0), maxY = bigMath.bignumber(0), q1Y = bigMath.bignumber(0), q3Y = bigMath.bignumber(0);
      let popVarY = bigMath.bignumber(0), varY = bigMath.bignumber(0);

      if (isBivariate && yValues.length > 0) {
        yValues.sort((a, b) => a - b);
        const quartilesY = calculateQuartilesGDPT(yValues);
        
        meanY = bigMath.divide(sumY, nBig) as any;
        const meanY2 = bigMath.pow(meanY, 2) as any;
        popVarY = bigMath.subtract(bigMath.divide(sumY2, nBig), meanY2) as any;
        popStdY = bigMath.sqrt(bigMath.max(0, popVarY as any) as any) as any;
        
        if (totalFreq > 1) {
          varY = bigMath.multiply(popVarY, bigMath.divide(nBig, bigMath.subtract(nBig, 1))) as any;
          stdY = bigMath.sqrt(bigMath.max(0, varY as any) as any) as any;
        }

        medianY = bigMath.bignumber(quartilesY.q2);
        minY = bigMath.bignumber(yValues[0]);
        maxY = bigMath.bignumber(yValues[yValues.length - 1]);
        q1Y = bigMath.bignumber(quartilesY.q1);
        q3Y = bigMath.bignumber(quartilesY.q3);
      }

      let bivariate: any = null;
      if (isBivariate && weightedData.length >= 2) {
        
        const bigData: [any, any][] = weightedData.map(([x, y]) => [bigMath.bignumber(x), bigMath.bignumber(y)]);
        const yMean = bigMath.divide(sumY, nBig) as any;
        let ssTot = bigMath.bignumber(0);
        bigData.forEach(([x, y]) => {
           ssTot = bigMath.add(ssTot, bigMath.pow(bigMath.subtract(y, yMean), 2)) as any;
        });

        const solveLinearRegressionBig = (data: [any, any][]) => {
          let sumX: any = bigMath.bignumber(0);
          let sumY: any = bigMath.bignumber(0);
          let sumXY: any = bigMath.bignumber(0);
          let sumX2: any = bigMath.bignumber(0);
          let n = bigMath.bignumber(data.length);
          data.forEach(([x, y]) => {
            sumX = bigMath.add(sumX, x) as any;
            sumY = bigMath.add(sumY, y) as any;
            sumXY = bigMath.add(sumXY, bigMath.multiply(x, y)) as any;
            sumX2 = bigMath.add(sumX2, bigMath.pow(x, 2)) as any;
          });
          const num = bigMath.subtract(bigMath.multiply(n, sumXY), bigMath.multiply(sumX, sumY)) as any;
          const den = bigMath.subtract(bigMath.multiply(n, sumX2), bigMath.pow(sumX, 2)) as any;
          let b: any = bigMath.bignumber(0);
          let a: any = bigMath.bignumber(0);
          if (!bigMath.equal(den, 0)) {
            b = bigMath.divide(num, den) as any;
            a = bigMath.divide(bigMath.subtract(sumY, bigMath.multiply(b, sumX)), n) as any;
          }
          return { a, b };
        };

        const solvePolynomialBig = (data: [any, any][], degree: number) => {
          const n = degree + 1;
          const A = Array(n).fill(0).map(() => Array(n).fill(bigMath.bignumber(0)));
          const B = Array(n).fill(bigMath.bignumber(0));

          for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
              let sum = bigMath.bignumber(0);
              for (let k = 0; k < data.length; k++) {
                sum = bigMath.add(sum, bigMath.pow(data[k][0], i + j)) as any;
              }
              A[i][j] = sum;
            }
            let sumY = bigMath.bignumber(0);
            for (let k = 0; k < data.length; k++) {
              sumY = bigMath.add(sumY, bigMath.multiply(data[k][1], bigMath.pow(data[k][0], i))) as any;
            }
            B[i] = sumY;
          }
          try {
            const res = bigMath.lusolve(A, B);
            return res.map((row: any) => bigMath.bignumber(row[0])) as any;
          } catch (e) {
            return Array(n).fill(bigMath.bignumber(0)) as any;
          }
        };

        const calcR2 = (data: [any, any][], predict: (x: any) => any) => {
          let ssRes: any = bigMath.bignumber(0);
          data.forEach(([x, y]) => {
            const yHat = predict(x);
            ssRes = bigMath.add(ssRes, bigMath.pow(bigMath.subtract(y, yHat), 2)) as any;
          });
          if (bigMath.equal(ssTot, 0)) return bigMath.bignumber(1) as any;
          return bigMath.subtract(1, bigMath.divide(ssRes, ssTot)) as any;
        };

        let formulaNode: React.ReactNode = null;
        let coeffsObj: any = {};
        let r2: any = bigMath.bignumber(0);
        let r: any = bigMath.bignumber(0);

        if (regressionType === 'linear') {
          const { a, b } = solveLinearRegressionBig(bigData);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={b}/>x + <StatValue value={a}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(a, bigMath.multiply(b, x)));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
          if (b < 0) r = bigMath.multiply(r, -1) as any;
        } else if (regressionType === 'quadratic') {
          const c = solvePolynomialBig(bigData, 2);
          coeffsObj = { a: c[0], b: c[1], c: c[2] };
          formulaNode = <span>y = <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.multiply(c[2], bigMath.pow(x, 2)))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'cubic') {
          const c = solvePolynomialBig(bigData, 3);
          coeffsObj = { a: c[0], b: c[1], c: c[2], d: c[3] };
          formulaNode = <span>y = <StatValue value={c[3]}/>x³ + <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.multiply(c[3], bigMath.pow(x, 3))))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'quartic') {
          const c = solvePolynomialBig(bigData, 4);
          coeffsObj = { a: c[0], b: c[1], c: c[2], d: c[3], e: c[4] };
          formulaNode = <span>y = <StatValue value={c[4]}/>x⁴ + <StatValue value={c[3]}/>x³ + <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.add(bigMath.multiply(c[3], bigMath.pow(x, 3)), bigMath.multiply(c[4], bigMath.pow(x, 4)))))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'quintic') {
          const c = solvePolynomialBig(bigData, 5);
          coeffsObj = { a: c[0], b: c[1], c: c[2], d: c[3], e: c[4], f: c[5] };
          formulaNode = <span>y = <StatValue value={c[5]}/>x⁵ + <StatValue value={c[4]}/>x⁴ + <StatValue value={c[3]}/>x³ + <StatValue value={c[2]}/>x² + <StatValue value={c[1]}/>x + <StatValue value={c[0]}/></span>;
          r2 = calcR2(bigData, (x) => bigMath.add(c[0], bigMath.add(bigMath.multiply(c[1], x), bigMath.add(bigMath.multiply(c[2], bigMath.pow(x, 2)), bigMath.add(bigMath.multiply(c[3], bigMath.pow(x, 3)), bigMath.add(bigMath.multiply(c[4], bigMath.pow(x, 4)), bigMath.multiply(c[5], bigMath.pow(x, 5))))))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'hyperbolic') {
          const transformed = bigData.filter(([x]) => !bigMath.equal(x, 0)).map(([x, y]) => {
            return [bigMath.divide(1, x), bigMath.divide(1, bigMath.pow(x, 2)), y];
          });
          if (transformed.length < 3) throw new Error("Cần ít nhất 3 giá trị X khác 0 cho hồi quy Hyperbol");
          
          const n = transformed.length;
          const A = Array(3).fill(0).map(() => Array(3).fill(bigMath.bignumber(0)));
          const B = Array(3).fill(bigMath.bignumber(0));
          
          const basis = transformed.map(d => [bigMath.bignumber(1), d[0], d[1]]);
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              let sum = bigMath.bignumber(0);
              for (let k = 0; k < n; k++) sum = bigMath.add(sum, bigMath.multiply(basis[k][i] as any, basis[k][j] as any)) as any;
              A[i][j] = sum;
            }
            let sumY = bigMath.bignumber(0);
            for (let k = 0; k < n; k++) sumY = bigMath.add(sumY, bigMath.multiply(transformed[k][2] as any, basis[k][i] as any)) as any;
            B[i] = sumY;
          }
          
          let c = Array(3).fill(bigMath.bignumber(0));
          try {
            const sol = bigMath.lusolve(A, B);
            c = sol.map((row: any) => bigMath.bignumber(row[0]));
          } catch (e) {}
          
          coeffsObj = { a: c[0], b: c[1], c: c[2] };
          formulaNode = <span>y = <StatValue value={c[0]}/> + <StatValue value={c[1]}/>/x + <StatValue value={c[2]}/>/x²</span>;
          r2 = calcR2(bigData, (x) => bigMath.equal(x, 0) ? bigMath.bignumber(0) : bigMath.add(c[0], bigMath.add(bigMath.divide(c[1], x), bigMath.divide(c[2], bigMath.pow(x, 2)))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'root') {
          const transformed = bigData.filter(([x]) => x >= 0).map(([x, y]) => [bigMath.sqrt(x), y]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X ≥ 0 cho hồi quy Căn thức");
          const { a, b } = solveLinearRegressionBig(transformed as any);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> + <StatValue value={b}/>√x</span>;
          r2 = calcR2(bigData, (x) => x < 0 ? bigMath.bignumber(0) : bigMath.add(a, bigMath.multiply(b, bigMath.sqrt(x))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'inverse') {
          const transformed = bigData.filter(([x]) => !bigMath.equal(x, 0)).map(([x, y]) => [bigMath.divide(1, x), y]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X khác 0 cho hồi quy nghịch đảo");
          const { a, b } = solveLinearRegressionBig(transformed as any);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> + <StatValue value={b}/>/x</span>;
          r2 = calcR2(bigData, (x) => bigMath.equal(x, 0) ? bigMath.bignumber(0) : bigMath.add(a, bigMath.divide(b, x)));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'logarithmic') {
          const transformed = bigData.filter(([x]) => x > 0).map(([x, y]) => [bigMath.log(x), y]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X > 0 cho hồi quy Logarit");
          const { a, b } = solveLinearRegressionBig(transformed as any);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> + <StatValue value={b}/>ln(x)</span>;
          r2 = calcR2(bigData, (x) => x <= 0 ? bigMath.bignumber(0) : bigMath.add(a, bigMath.multiply(b, bigMath.log(x))));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'exponential') {
          const transformed = bigData.filter(([, y]) => y > 0).map(([x, y]) => [x, bigMath.log(y)]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị Y > 0 cho hồi quy Mũ");
          const { a: lnA, b } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.exp(lnA);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> * exp(<StatValue value={b}/>x)</span>;
          r2 = calcR2(bigData, (x) => bigMath.multiply(a, bigMath.exp(bigMath.multiply(b, x) as any)) as any);
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'power_base') {
          const transformed = bigData.filter(([, y]) => y > 0).map(([x, y]) => [x, bigMath.log(y)]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị Y > 0 cho hồi quy Lũy thừa (Cơ số b)");
          const { a: lnA, b: lnB } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.exp(lnA);
          const b = bigMath.exp(lnB);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> * <StatValue value={b}/>^x</span>;
          r2 = calcR2(bigData, (x) => bigMath.multiply(a, bigMath.pow(b, x)));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'power_exp') {
          const transformed = bigData.filter(([x, y]) => x > 0 && y > 0).map(([x, y]) => [bigMath.log(x), bigMath.log(y)]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị X, Y > 0 cho hồi quy Lũy thừa (Số mũ b)");
          const { a: lnA, b } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.exp(lnA);
          coeffsObj = { a, b };
          formulaNode = <span>y = <StatValue value={a}/> * x^<StatValue value={b}/></span>;
          r2 = calcR2(bigData, (x) => x <= 0 ? bigMath.bignumber(0) : bigMath.multiply(a, bigMath.pow(x, b)));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'logistic') {
          const transformed = bigData.filter(([, y]) => y > 0 && y < 1).map(([x, y]) => [x, bigMath.log(bigMath.subtract(bigMath.divide(1, y), 1))]);
          if (transformed.length < 2) throw new Error("Cần ít nhất 2 giá trị Y trong khoảng (0, 1) cho hồi quy Logistic");
          const { a: negA, b: negB } = solveLinearRegressionBig(transformed as any);
          const a = bigMath.multiply(negA, -1);
          const b = bigMath.multiply(negB, -1);
          coeffsObj = { a, b };
          formulaNode = <span>y = 1 / (1 + exp(-(<StatValue value={a}/> + <StatValue value={b}/>x)))</span>;
          r2 = calcR2(bigData, (x) => bigMath.divide(1, bigMath.add(1, bigMath.exp(bigMath.multiply(-1, bigMath.add(a, bigMath.multiply(b, x)) as any) as any)) as any) as any);
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'quantile') {
          // Simple Median Regression (Quantile 0.5) using IRLS
          let b_q = bigMath.divide(sumY, nBig);
          let a_q = bigMath.bignumber(0);
          for (let iter = 0; iter < 10; iter++) {
            let sumW = bigMath.bignumber(0);
            let sumWX = bigMath.bignumber(0);
            let sumWY = bigMath.bignumber(0);
            let sumWXX = bigMath.bignumber(0);
            let sumWXY = bigMath.bignumber(0);
            
            bigData.forEach(([x, y]) => {
              const residual = bigMath.subtract(y, bigMath.add(bigMath.multiply(a_q, x), b_q));
              const absRes = bigMath.abs(residual as any);
              const w = bigMath.divide(1, bigMath.max(0.0001, absRes as any) as any);
              sumW = bigMath.add(sumW, w) as any;
              sumWX = bigMath.add(sumWX, bigMath.multiply(w as any, x)) as any;
              sumWY = bigMath.add(sumWY, bigMath.multiply(w as any, y)) as any;
              sumWXX = bigMath.add(sumWXX, bigMath.multiply(w as any, bigMath.pow(x, 2) as any)) as any;
              sumWXY = bigMath.add(sumWXY, bigMath.multiply(w as any, bigMath.multiply(x, y) as any)) as any;
            });
            
            const denom = bigMath.subtract(bigMath.multiply(sumW, sumWXX), bigMath.pow(sumWX, 2));
            if (bigMath.abs(denom as any) < 1e-10) break;
            a_q = bigMath.divide(bigMath.subtract(bigMath.multiply(sumW, sumWXY), bigMath.multiply(sumWX, sumWY)), denom) as any;
            b_q = bigMath.divide(bigMath.subtract(bigMath.multiply(sumWXX, sumWY), bigMath.multiply(sumWX, sumWXY)), denom) as any;
          }
          coeffsObj = { a: b_q, b: a_q };
          formulaNode = <span>y = <StatValue value={a_q}/>x + <StatValue value={b_q}/> (Hồi quy Trung vị)</span>;
          r2 = calcR2(bigData, (x) => bigMath.add(bigMath.multiply(a_q, x), b_q));
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
        } else if (regressionType === 'decision_tree') {
          // Keep standard numbers for decision tree
          const buildTree = (data: [number, number][], depth: number): any => {
            if (depth >= 3 || data.length < 5) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            let bestSplit = -1, minSSE = Infinity, bestL: [number, number][] = [], bestR: [number, number][] = [];
            const sorted = [...data].sort((a, b) => a[0] - b[0]);
            for (let i = 0; i < sorted.length - 1; i++) {
              const split = (sorted[i][0] + sorted[i+1][0]) / 2;
              const L = sorted.slice(0, i + 1), R = sorted.slice(i + 1);
              const sse = ss.sumSimple(L.map(d => Math.pow(d[1] - ss.mean(L.map(l => l[1])), 2))) +
                          ss.sumSimple(R.map(d => Math.pow(d[1] - ss.mean(R.map(r => r[1])), 2)));
              if (sse < minSSE) { minSSE = sse; bestSplit = split; bestL = L; bestR = R; }
            }
            if (bestSplit === -1) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            return { split: bestSplit, left: buildTree(bestL, depth + 1), right: buildTree(bestR, depth + 1) };
          };
          const tree = buildTree(weightedData, 0);
          const predict = (node: any, x: number): number => node.pred !== undefined ? node.pred : (x < node.split ? predict(node.left, x) : predict(node.right, x));
          formulaNode = <span>y = Tree(x) (Cây Quyết định)</span>;
          const ssRes = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - predict(tree, x), 2), 0);
          const ssTotNum = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - parseFloat((yMean as any).toString()), 2), 0);
          r2 = bigMath.bignumber(1 - (ssRes / ssTotNum)) as any;
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
          coeffsObj = { tree };
          
          const getLeaves = (node: any, path: string = ""): any[] => {
            if (node.pred !== undefined) return [{ range: path || "Toàn bộ", count: node.count }];
            return [
              ...getLeaves(node.left, path + (path ? " & " : "") + `x < ${node.split.toFixed(2)}`),
              ...getLeaves(node.right, path + (path ? " & " : "") + `x ≥ ${node.split.toFixed(2)}`)
            ];
          };
          groups = getLeaves(tree);
        } else if (regressionType === 'random_forest') {
          const buildTree = (data: [number, number][], depth: number): any => {
            if (depth >= 3 || data.length < 5) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            let bestSplit = -1, minSSE = Infinity, bestL: [number, number][] = [], bestR: [number, number][] = [];
            const sorted = [...data].sort((a, b) => a[0] - b[0]);
            for (let i = 0; i < sorted.length - 1; i++) {
              const split = (sorted[i][0] + sorted[i+1][0]) / 2;
              const L = sorted.slice(0, i + 1), R = sorted.slice(i + 1);
              const sse = ss.sumSimple(L.map(d => Math.pow(d[1] - ss.mean(L.map(l => l[1])), 2))) +
                          ss.sumSimple(R.map(d => Math.pow(d[1] - ss.mean(R.map(r => r[1])), 2)));
              if (sse < minSSE) { minSSE = sse; bestSplit = split; bestL = L; bestR = R; }
            }
            if (bestSplit === -1) return { pred: ss.mean(data.map(d => d[1])), count: data.length };
            return { split: bestSplit, left: buildTree(bestL, depth + 1), right: buildTree(bestR, depth + 1) };
          };
          const forest = Array(10).fill(0).map(() => {
            const sample = Array(weightedData.length).fill(0).map(() => weightedData[Math.floor(Math.random() * weightedData.length)]);
            return buildTree(sample, 0);
          });
          const predict = (node: any, x: number): number => node.pred !== undefined ? node.pred : (x < node.split ? predict(node.left, x) : predict(node.right, x));
          const predForest = (x: number) => ss.mean(forest.map(t => predict(t, x)));
          formulaNode = <span>y = Forest(x) (Random Forest)</span>;
          const ssRes = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - predForest(x), 2), 0);
          const ssTotNum = weightedData.reduce((acc, [x, y]) => acc + Math.pow(y - parseFloat((yMean as any).toString()), 2), 0);
          r2 = bigMath.bignumber(1 - (ssRes / ssTotNum)) as any;
          r = bigMath.sqrt(bigMath.max(0, r2 as any) as any) as any;
          coeffsObj = { forest };

          const getLeaves = (node: any, path: string = ""): any[] => {
            if (node.pred !== undefined) return [{ range: path || "Toàn bộ", count: node.count }];
            return [
              ...getLeaves(node.left, path + (path ? " & " : "") + `x < ${node.split.toFixed(2)}`),
              ...getLeaves(node.right, path + (path ? " & " : "") + `x ≥ ${node.split.toFixed(2)}`)
            ];
          };
          groups = getLeaves(forest[0]);
        }

        bivariate = {
          type: regressionType,
          formulaNode,
          r,
          r2,
          coeffs: coeffsObj
        };
      }

      


      setResults({
        n: rowCount,
        N: totalFreq,
        meanX, stdX, popStdX, medianX, minX, maxX, q1X, q3X,
        sumX, sumX2, sumX3, sumX4,
        meanY, stdY, popStdY, medianY, minY, maxY, q1Y, q3Y,
        sumY, sumY2, sumXY, sumX2Y,
        bivariate,
        groups,
        quartileStepsX,
        freqTableX,
        groupedQuartiles,
        modeX,
        hasModeX,
        modeStepsX
      });
      setShowRegressionSelector(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveTable = (name: string) => {
    if (!results || results.groups.length === 0) return;
    const newTable = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || `Bảng ${String.fromCharCode(65 + savedTables.length)}`,
      data: results.groups
    };
    setSavedTables([...savedTables, newTable]);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-[#141414] pb-4">
        <div>
          <h2 className="font-serif italic text-4xl">Statistics Engine</h2>
          <p className="font-mono text-xs opacity-50 mt-2">Advanced Data Analysis & Regression</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {pendingFreq ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1 animate-in fade-in slide-in-from-right-2">
              <span className="text-[9px] font-mono uppercase text-amber-800">Mở cột FREQ?</span>
              <button 
                onClick={() => { setShowFreq(true); setPendingFreq(false); }}
                className="text-[9px] font-mono bg-amber-600 text-white px-2 py-0.5 hover:bg-amber-700"
              >
                CÓ
              </button>
              <button 
                onClick={() => setPendingFreq(false)}
                className="text-[9px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 hover:bg-gray-300"
              >
                KHÔNG
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                if (!showFreq) {
                  setPendingFreq(true);
                } else {
                  setShowFreq(false);
                }
              }}
              className={cn(
                "px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest transition-all",
                showFreq ? "bg-[#141414] text-white" : "hover:bg-gray-100"
              )}
            >
              {showFreq ? "Tắt FREQ" : "Mở FREQ"}
            </button>
          )}

          {pendingGrouping ? (
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1 animate-in fade-in slide-in-from-right-2">
              <span className="text-[9px] font-mono uppercase text-teal-800">Bật Ghép Nhóm?</span>
              <button 
                onClick={() => { setShowGrouping(true); setPendingGrouping(false); setShowFreq(true); }}
                className="text-[9px] font-mono bg-teal-600 text-white px-2 py-0.5 hover:bg-teal-700"
              >
                CÓ
              </button>
              <button 
                onClick={() => setPendingGrouping(false)}
                className="text-[9px] font-mono bg-gray-200 text-gray-700 px-2 py-0.5 hover:bg-gray-300"
              >
                KHÔNG
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (!showGrouping) {
                    setPendingGrouping(true);
                  } else {
                    setShowGrouping(false);
                  }
                }}
                className={cn(
                  "px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest transition-all",
                  showGrouping ? "bg-teal-600 text-white border-teal-600" : "hover:bg-gray-100"
                )}
              >
                {showGrouping ? "Tắt Ghép Nhóm" : "Ghép Nhóm"}
              </button>
              
              <button 
                onClick={() => {
                  setRegressionType('decision_tree');
                  if (!showGrouping) setPendingGrouping(true);
                }}
                className="px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest transition-all hover:bg-gray-100"
              >
                Ghép nhóm Cây Quyết định
              </button>
              
              <button 
                onClick={() => {
                  setRegressionType('random_forest');
                  if (!showGrouping) setPendingGrouping(true);
                }}
                className="px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest transition-all hover:bg-gray-100"
              >
                Ghép nhóm Random Forest
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsBivariate(!isBivariate)}
            className={cn(
              "px-4 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest transition-all",
              isBivariate ? "bg-[#141414] text-white" : "hover:bg-gray-100"
            )}
          >
            {isBivariate ? "Chế độ 2 biến (X, Y)" : "Chế độ 1 biến (X)"}
          </button>
          
          <button 
            onClick={runStats}
            className="px-6 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-opacity-90 transition-all flex items-center gap-2"
          >
            <BarChart2 className="w-4 h-4" />
            Tính toán
          </button>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-center gap-3"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto opacity-50 hover:opacity-100">✕</button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Data Input Section */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <TableIcon className="w-3 h-3" />
                Bảng dữ liệu ({currentRowsCount}/{maxRows})
              </h3>
              <button 
                onClick={() => addRows(20)}
                disabled={currentRowsCount >= maxRows}
                className="text-[9px] font-mono border border-[#141414] px-2 py-1 hover:bg-[#141414] hover:text-white transition-all disabled:opacity-30 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Thêm 20 hàng
              </button>
            </div>
            <div className="text-[9px] font-mono opacity-40 italic">
              Tip: Dán từ Excel/CSV trực tiếp vào bảng
            </div>
          </div>

          <div 
            className="border border-[#141414] h-[500px] overflow-auto bg-gray-50/50"
            onPaste={handlePaste}
          >
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#141414] text-[#E4E3E0] text-[10px] font-mono uppercase tracking-widest">
                <tr>
                  <th className="p-2 text-left border-r border-white/10 w-12">STT</th>
                  {showGrouping ? (
                    <>
                      <th className="p-2 text-left border-r border-white/10">[FROM</th>
                      <th className="p-2 text-left border-r border-white/10">TO)</th>
                    </>
                  ) : (
                    <th className="p-2 text-left border-r border-white/10">Giá trị X</th>
                  )}
                  {isBivariate && !showGrouping && <th className="p-2 text-left border-r border-white/10">Giá trị Y</th>}
                  {showFreq && <th className="p-2 text-left">FREQ</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#141414]/10 hover:bg-white transition-colors">
                    <td className="p-1 text-center border-r border-[#141414]/10 font-mono opacity-40" style={{ fontSize: `${fontSize}px` }}>
                      {idx + 1}
                    </td>
                    {showGrouping ? (
                      <>
                        <td className="p-0 border-r border-[#141414]/10">
                          <input 
                            type="text"
                            value={row.from ? (row.from.length > 10 ? (Math.trunc(parseFloat(row.from) * 1e7) / 1e7).toString() : row.from) : ''}
                            onChange={(e) => updateRow(idx, 'from', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 'from')}
                            data-row={idx}
                            data-col="from"
                            className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                            style={{ fontSize: `${fontSize}px` }}
                          />
                        </td>
                        <td className="p-0 border-r border-[#141414]/10">
                          <input 
                            type="text"
                            value={row.to ? (row.to.length > 10 ? (Math.trunc(parseFloat(row.to) * 1e7) / 1e7).toString() : row.to) : ''}
                            onChange={(e) => updateRow(idx, 'to', e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, idx, 'to')}
                            data-row={idx}
                            data-col="to"
                            className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                            style={{ fontSize: `${fontSize}px` }}
                          />
                        </td>
                      </>
                    ) : (
                      <td className="p-0 border-r border-[#141414]/10">
                        <input 
                          type="text"
                          value={row.x}
                          onChange={(e) => updateRow(idx, 'x', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'x')}
                          data-row={idx}
                          data-col="x"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                          style={{ fontSize: `${fontSize}px` }}
                        />
                      </td>
                    )}
                    {isBivariate && !showGrouping && (
                      <td className="p-0 border-r border-[#141414]/10">
                        <input 
                          type="text"
                          value={row.y}
                          onChange={(e) => updateRow(idx, 'y', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'y')}
                          data-row={idx}
                          data-col="y"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono"
                          style={{ fontSize: `${fontSize}px` }}
                        />
                      </td>
                    )}
                    {showFreq && (
                      <td className="p-0">
                        <input 
                          type="text"
                          value={((showGrouping && row.from?.trim() !== '') || (!showGrouping && row.x.trim() !== '')) ? row.f : ''}
                          onChange={(e) => updateRow(idx, 'f', e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, idx, 'f')}
                          placeholder={((showGrouping && row.from?.trim() !== '') || (!showGrouping && row.x.trim() !== '')) ? '1' : ''}
                          data-row={idx}
                          data-col="f"
                          className="w-full p-2 bg-transparent focus:bg-white focus:ring-0 border-none font-mono text-blue-600 font-bold"
                          style={{ fontSize: `${fontSize}px` }}
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Controls & Results Section */}
        <div className="lg:col-span-5 space-y-6">
          {/* Results Display */}
          <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] font-mono overflow-auto min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 opacity-40">
                <Info className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-widest">Statistical Output</span>
              </div>
              <div className="flex gap-2">
                {results && results.bivariate && !showRegressionSelector && (
                  <button 
                    onClick={() => setShowRegressionSelector(true)}
                    className="text-[9px] uppercase tracking-widest border border-white/20 px-2 py-1 hover:bg-white hover:text-[#141414] transition-all"
                  >
                    Đổi mô hình
                  </button>
                )}
                {results && results.groups.length > 0 && (
                  <button 
                    onClick={() => saveTable("")}
                    className="text-[9px] uppercase tracking-widest border border-white/20 px-2 py-1 hover:bg-white hover:text-[#141414] transition-all"
                  >
                    Lưu bảng
                  </button>
                )}
              </div>
            </div>

            {results ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-400/20 pb-1">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest">Biến thống kê (X)</h4>
                    <span className="text-[10px] font-mono opacity-40">11 Biến</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">n (Số hàng):</span> <StatValue value={results.n} isInteger={true} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">N (Tổng tần số):</span> <StatValue value={results.N} isInteger={true} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">x̄:</span> <StatValue value={results.meanX} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx:</span> <StatValue value={results.sumX} isInteger={true} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx²:</span> <StatValue value={results.sumX2} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">σx:</span> <StatValue value={results.popStdX} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">σ²x:</span> <StatValue value={math.pow(results.popStdX, 2)} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">sx:</span> <StatValue value={results.stdX} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">s²x:</span> <StatValue value={math.pow(results.stdX, 2)} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">minX:</span> <StatValue value={results.minX} isInteger={true} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Q1:</span> <StatValue value={results.q1X} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Med:</span> <StatValue value={results.medianX} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Q3:</span> <StatValue value={results.q3X} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">maxX:</span> <StatValue value={results.maxX} isInteger={true} /></div>
                    {results.hasModeX && (
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Mốt (Mo):</span> <StatValue value={results.modeX} /></div>
                    )}
                  </div>
                </div>

                {results.freqTableX && (
                  <div className="space-y-2">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest border-b border-teal-400/20 pb-1">Bảng tần số & Tần số tích lũy (X)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px] font-mono">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-1 opacity-50">Giá trị (x)</th>
                            <th className="text-right py-1 opacity-50">Tần số (f)</th>
                            <th className="text-right py-1 opacity-50">Tích lũy (cf)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.freqTableX.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-white/5">
                              <td className="py-1">{item.x}</td>
                              <td className="text-right py-1">{item.f}</td>
                              <td className="text-right py-1 text-teal-400">{item.cf}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {results.quartileStepsX && (
                  <div className="space-y-2">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest border-b border-teal-400/20 pb-1">Chi tiết tính Tứ phân vị (Chuẩn 2026)</h4>
                    <div className="space-y-1 text-[9px] font-mono opacity-80 leading-relaxed bg-white/5 p-3 border border-white/10">
                      {results.quartileStepsX.map((step: string, i: number) => (
                        <p key={i}>{step}</p>
                      ))}
                    </div>
                  </div>
                )}

                {results.hasModeX && results.modeStepsX && (
                  <div className="space-y-2">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest border-b border-teal-400/20 pb-1">Chi tiết tính Mốt (Dữ liệu ghép nhóm)</h4>
                    <div className="space-y-1 text-[9px] font-mono opacity-80 leading-relaxed bg-white/5 p-3 border border-white/10">
                      {results.modeStepsX.map((step: string, i: number) => (
                        <p key={i}>{step}</p>
                      ))}
                    </div>
                  </div>
                )}

                {isBivariate && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-teal-400/20 pb-1">
                      <h4 className="text-teal-400 text-[10px] uppercase tracking-widest">Biến thống kê (Y)</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">ȳ:</span> <StatValue value={results.meanY} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σy:</span> <StatValue value={results.sumY} isInteger={true} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σy²:</span> <StatValue value={results.sumY2} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">σy:</span> <StatValue value={results.popStdY} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">σ²y:</span> <StatValue value={math.pow(results.popStdY, 2)} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">sy:</span> <StatValue value={results.stdY} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">s²y:</span> <StatValue value={math.pow(results.stdY, 2)} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">minY:</span> <StatValue value={results.minY} isInteger={true} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">maxY:</span> <StatValue value={results.maxY} isInteger={true} /></div>
                      <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σxy:</span> <StatValue value={results.sumXY} isInteger={true} /></div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-teal-400/20 pb-1">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest">Các phép tính tổng</h4>
                    <span className="text-[10px] font-mono opacity-40">8 Phép tính</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx:</span> <StatValue value={results.sumX} isInteger={true} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx²:</span> <StatValue value={results.sumX2} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx³:</span> <StatValue value={results.sumX3} isInteger={true} /></div>
                    <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx⁴:</span> <StatValue value={results.sumX4} isInteger={true} /></div>
                    {isBivariate && (
                      <>
                        <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σy:</span> <StatValue value={results.sumY} isInteger={true} /></div>
                        <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σy²:</span> <StatValue value={results.sumY2} /></div>
                        <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σxy:</span> <StatValue value={results.sumXY} isInteger={true} /></div>
                        <div className="flex justify-between border-b border-white/5"><span className="opacity-50">Σx²y:</span> <StatValue value={results.sumX2Y} isInteger={true} /></div>
                      </>
                    )}
                  </div>
                </div>

                {results.bivariate && (
                  <div className="space-y-2">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest border-b border-teal-400/20 pb-1">Phân tích hồi quy ({results.bivariate.type})</h4>
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <span className="opacity-50">Hệ số tương quan (r):</span>
                      <div className="text-right"><StatValue value={results.bivariate.r} /></div>
                      <span className="opacity-50">Hệ số xác định (R²):</span>
                      <div className="text-right"><StatValue value={results.bivariate.r2} /></div>
                      <span className="opacity-50 col-span-2">Phương trình:</span>
                      <div className="col-span-2 text-right italic text-teal-300 font-bold">{results.bivariate.formulaNode}</div>
                    </div>
                  </div>
                )}

                {results.groups.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest border-b border-teal-400/20 pb-1">Bảng tần số ghép nhóm</h4>
                    <div className="space-y-1 text-xs">
                      <div className="grid grid-cols-5 gap-2 border-b border-white/10 py-1 font-mono text-[9px] opacity-50 text-right">
                        <span className="text-left">Khoảng giá trị</span>
                        <span>f</span>
                        <span>fr</span>
                        <span>F (cf)</span>
                        <span>Fr</span>
                      </div>
                      {results.groups.map((g: any, i: number) => (
                        <div key={i} className="grid grid-cols-5 gap-2 border-b border-white/5 py-1 text-right font-mono text-[10px]">
                          <span className="opacity-50 text-left">{g.range}</span>
                          <span className="font-bold">{g.count}</span>
                          <span className="text-teal-200">{(g.fr * 100).toFixed(2)}%</span>
                          <span className="font-bold text-teal-400">{g.cf}</span>
                          <span className="text-teal-500">{(g.cumFr * 100).toFixed(2)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {results.groupedQuartiles && (
                  <div className="space-y-2">
                    <h4 className="text-teal-400 text-[10px] uppercase tracking-widest border-b border-teal-400/20 pb-1">Tứ phân vị dữ liệu ghép nhóm</h4>
                    <div className="space-y-1 text-[9px] font-mono opacity-80 leading-relaxed bg-white/5 p-3 border border-white/10">
                      {results.groupedQuartiles.steps.map((step: string, i: number) => (
                        <p key={i}>{step}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                <Sigma className="w-12 h-12 mb-4" />
                <p className="text-[10px] uppercase tracking-widest">Nhập dữ liệu và nhấn tính toán</p>
              </div>
            )}
          </div>

          {/* Regression Config (Bivariate only) */}
          {isBivariate && showRegressionSelector && (
            <div className="p-6 border border-[#141414] space-y-4 bg-gray-50/30 animate-in slide-in-from-top-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <FunctionSquare className="w-3 h-3" />
                Mô hình hồi quy
              </h3>
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {REGRESSION_MODELS.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setRegressionType(type.id as any)}
                    className={cn(
                      "text-left p-2 font-mono text-[10px] border transition-all",
                      regressionType === type.id 
                        ? "bg-[#141414] text-white border-[#141414]" 
                        : "border-[#141414]/10 hover:border-[#141414]"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          
          {/* Grouping Config */}
          {showGrouping && (
            <div className="p-6 border border-[#141414] space-y-4 animate-in slide-in-from-top-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Settings2 className="w-3 h-3" />
                Cấu hình chia nhóm
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[9px] font-mono uppercase opacity-50">Phương pháp</label>
                  <select 
                    value={groupConfig.method}
                    onChange={e => setGroupConfig({...groupConfig, method: e.target.value})}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0 bg-white"
                  >
                    <option value="basic">Ghép nhóm căn bản</option>
                    <option value="dt">Cây quyết định (Decision Tree)</option>
                    <option value="rf">Random Forest</option>
                  </select>
                </div>

                {groupConfig.method === 'basic' && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Bắt đầu (Start)</label>
                      <input 
                        type="text"
                        placeholder="Giá trị bắt đầu"
                        value={groupConfig.start}
                        onChange={e => setGroupConfig({...groupConfig, start: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Khoảng cách (Dist)</label>
                      <input 
                        type="text"
                        placeholder="Khoảng cách"
                        value={groupConfig.step}
                        onChange={e => setGroupConfig({...groupConfig, step: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Số nhóm (Groups)</label>
                      <select 
                        value={groupConfig.count}
                        onChange={e => setGroupConfig({...groupConfig, count: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0 bg-white"
                      >
                        {Array.from({length: 20}, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>{n} nhóm</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {(groupConfig.method === 'dt' || groupConfig.method === 'rf') && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Max Depth</label>
                      <input 
                        type="number"
                        placeholder="3"
                        value={groupConfig.maxDepth}
                        onChange={e => setGroupConfig({...groupConfig, maxDepth: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono uppercase opacity-50">Min Samples</label>
                      <input 
                        type="number"
                        placeholder="2"
                        value={groupConfig.minSamples}
                        onChange={e => setGroupConfig({...groupConfig, minSamples: e.target.value})}
                        className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                      />
                    </div>
                  </>
                )}

                {groupConfig.method === 'rf' && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono uppercase opacity-50">N Estimators</label>
                    <input 
                      type="number"
                      placeholder="10"
                      value={groupConfig.nEstimators}
                      onChange={e => setGroupConfig({...groupConfig, nEstimators: e.target.value})}
                      className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                    />
                  </div>
                )}

                <div className="col-span-2 mt-2">
                  <button 
                    onClick={generateGroupTable}
                    className="w-full bg-[#141414] text-white p-2 font-mono text-xs uppercase tracking-widest hover:bg-black transition-colors"
                  >
                    Tạo bảng ghép nhóm
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Results Display Area was moved up */}

          {/* Saved Tables */}
          {savedTables.length > 0 && (
            <div className="p-6 border border-[#141414] space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Bảng đã lưu
              </h3>
              <div className="space-y-4">
                {savedTables.map(table => (
                  <div key={table.id} className="border border-[#141414]/10 p-3 space-y-2">
                    <div className="flex justify-between items-center border-b border-[#141414]/10 pb-1">
                      <span className="font-mono text-[10px] font-bold">{table.name}</span>
                      <button 
                        onClick={() => setSavedTables(savedTables.filter(t => t.id !== table.id))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 text-[9px] font-mono">
                      {table.data.map((g, i) => (
                        <React.Fragment key={i}>
                          <span className="opacity-50">{g.range}</span>
                          <span className="text-right">{g.count}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function ModeRenderer({ mode, globalBuffer, setGlobalBuffer, userFunctions, setUserFunctions }: { 
  mode: Mode, 
  globalBuffer: string, 
  setGlobalBuffer: (v: string) => void,
  userFunctions: { f: string, g: string, h: string },
  setUserFunctions: React.Dispatch<React.SetStateAction<{ f: string, g: string, h: string }>>
}) {
  switch (mode) {
    case 'mode1': return <Mode1 />;
    case 'mode2': return <Mode2 />;
    case 'mode3': return <Mode3 />;
    case 'mode4': return <Mode4 />;
    case 'mode5': return <Mode5 />;
    case 'mode6': return <Mode6 />;
    case 'mode7': return <Mode7 />;
    case 'mode9': return <Mode9 />;
    case 'mode10': return <Mode10 />;
    case 'mode11': return <Mode11 initialQuery={globalBuffer} userFunctions={userFunctions} />;
    case 'mode12': return <Mode12 />;
    case 'mode13': return <Mode13 />;
    case 'mode14': return <Mode14 />;
    case 'mode15': return <Mode15 onExportToMode11={(v) => { setGlobalBuffer(v); }} />;
    case 'mode16': return <Mode16 />;
    case 'mode17': return <Mode17 />;
    case 'mode18': return <Mode18 />;
    case 'mode19': return <Mode19 userFunctions={userFunctions} setUserFunctions={setUserFunctions} />;
    case 'mode20': return <Mode20 />;
    case 'mode21': return <Mode21 />;
    case 'mode22': return <Mode22 />;
    case 'mode23': return <GeoSurveyPro />;
    case 'mode24': return <FunctionVariationTableur />;
    case 'mode25': return <LinearAlgebraToolboxUI />;
    default: return null;
  }
}

// --- Mode Components ---

function Mode1() {
  const [a, setA] = useState('');
  const [n, setN] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);
    setResult(null);

    if (!a.trim() || !n.trim()) {
      setError("Please enter both base and modulo values.");
      return;
    }

    const base = parseInt(a);
    const mod = parseInt(n);

    if (isNaN(base)) {
      setError("Base (a) must be a valid integer.");
      return;
    }

    if (isNaN(mod)) {
      setError("Modulo (N) must be a valid integer.");
      return;
    }

    if (mod <= 0) {
      setError("Modulo (N) must be a positive integer.");
      return;
    }

    if (mod > 1000000) {
      setError("Modulo (N) is too large for this computation (max 1,000,000).");
      return;
    }

    const res = powerSumMod(base, mod);
    setResult(res);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Sum of Powers Modulo N</h2>
        <p className="font-mono text-xs opacity-50 mt-2">S = a + a² + a³ + ... + aⁿ (mod N)</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50">Base (a)</label>
          <input 
            type="number" 
            value={a} 
            onChange={e => setA(e.target.value)}
            className="w-full p-4 border border-[#141414] font-mono focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
            placeholder="Enter a"
          />
          <label className="block font-mono text-[10px] uppercase tracking-widest opacity-50">Modulo (N)</label>
          <input 
            type="number" 
            value={n} 
            onChange={e => setN(e.target.value)}
            className="w-full p-4 border border-[#141414] font-mono focus:outline-none focus:ring-2 focus:ring-[#141414]/10"
            placeholder="Enter N"
          />
          <button 
            onClick={calculate}
            className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Compute
          </button>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 font-mono text-xs mt-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
        <div className="bg-[#F5F5F5] p-8 border border-[#141414] flex flex-col justify-center items-center">
          <span className="font-mono text-[10px] uppercase tracking-widest opacity-50 mb-4">Result</span>
          {result ? (
            <div className="text-center">
              <span className="text-6xl font-serif italic">{result}</span>
              <p className="text-[10px] font-mono opacity-50 mt-4">MOD {n}</p>
            </div>
          ) : (
            <span className="text-sm font-mono opacity-30 italic">
              {error ? "Invalid input" : "Awaiting input..."}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Mode2() {
  const [inputs, setInputs] = useState([{ mod: '', rem: '' }, { mod: '', rem: '' }]);
  const [result, setResult] = useState<{ x: string, M: string } | string | null>(null);
  const [stepsResult, setStepsResult] = useState<CRTStepResult | null>(null);
  const [showDetailedSteps, setShowDetailedSteps] = useState(false);

  const addRow = () => setInputs([...inputs, { mod: '', rem: '' }]);
  const calculate = () => {
    const mods = inputs.map(i => BigInt(i.mod || '0'));
    const rems = inputs.map(i => BigInt(i.rem || '0'));
    
    const res = solveCRT(mods, rems);
    setResult(res);

    const stepsRes = solveCRTStepByStep(mods, rems);
    setStepsResult(stepsRes);
    setShowDetailedSteps(true);
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed text-neutral-700 font-sans">
        {lines.map((line, lIdx) => {
          let isBullet = false;
          let cleanLine = line;
          if (line.trim().startsWith('* ')) {
            isBullet = true;
            cleanLine = line.trim().substring(2);
          }
          
          const parts = cleanLine.split('$');
          const renderedContent = parts.map((part, index) => {
            if (index % 2 === 1) {
              return <InlineMath key={index}>{part}</InlineMath>;
            }
            const subParts = part.split('**');
            return (
              <span key={index}>
                {subParts.map((sp, idx) => (
                  idx % 2 === 1 ? <strong key={idx} className="font-semibold text-neutral-900">{sp}</strong> : sp
                ))}
              </span>
            );
          });

          if (isBullet) {
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-4">
                <span className="text-purple-600 mt-1 shrink-0 text-xs">•</span>
                <span>{renderedContent}</span>
              </div>
            );
          }
          return <p key={lIdx} className="my-1.5">{renderedContent}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">CRT Solver</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Chinese Remainder Theorem: x ≡ rᵢ (mod mᵢ)</p>
      </div>
      <div className="space-y-4">
        {inputs.map((input, idx) => (
          <div key={idx} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="font-mono text-[10px] uppercase opacity-50">Remainder (r{idx+1})</label>
              <input 
                type="number" 
                value={input.rem} 
                onChange={e => {
                  const newInputs = [...inputs];
                  newInputs[idx].rem = e.target.value;
                  setInputs(newInputs);
                }}
                className="w-full p-3 border border-[#141414] font-mono"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="font-mono text-[10px] uppercase opacity-50">Modulus (m{idx+1})</label>
              <input 
                type="number" 
                value={input.mod} 
                onChange={e => {
                  const newInputs = [...inputs];
                  newInputs[idx].mod = e.target.value;
                  setInputs(newInputs);
                }}
                className="w-full p-3 border border-[#141414] font-mono"
              />
            </div>
          </div>
        ))}
        <div className="flex gap-4">
          <button onClick={addRow} className="flex-1 py-3 border border-[#141414] font-mono text-xs uppercase hover:bg-gray-100">Add Row</button>
          <button onClick={calculate} className="flex-1 py-3 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase">Solve</button>
        </div>
      </div>
      {result && (
        <div className="space-y-6">
          <div className="bg-[#F5F5F5] p-6 border border-[#141414] font-mono">
            {typeof result === 'string' ? (
              <p className="text-red-500">{result}</p>
            ) : (
              <div className="space-y-2">
                <p className="text-2xl">x ≡ <span className="font-serif italic font-bold">{result.x}</span></p>
                <p className="text-sm opacity-50">(mod {result.M})</p>
              </div>
            )}
          </div>

          {stepsResult && (
            <div className="border border-[#141414] bg-white rounded-sm overflow-hidden shadow-sm">
              <button 
                onClick={() => setShowDetailedSteps(!showDetailedSteps)}
                className="w-full flex items-center justify-between px-6 py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-wider text-left transition-all hover:bg-neutral-800"
              >
                <span className="flex items-center gap-2">
                  <Binary className="w-4 h-4 text-purple-400" />
                  Hiển thị lời giải chi tiết từng bước (Step-by-Step)
                </span>
                <span className="text-sm font-semibold font-mono">
                  {showDetailedSteps ? 'Đóng ▲' : 'Xem ▼'}
                </span>
              </button>
              
              {showDetailedSteps && (
                <div className="p-6 bg-purple-50/10 border-t border-[#141414]/10 space-y-6 max-h-[600px] overflow-y-auto w-full max-w-full">
                  {stepsResult.steps.map((step, sIdx) => {
                    if (step.type === 'step') {
                      return (
                        <div key={sIdx} className="border-l-4 border-purple-600 pl-4 py-1 space-y-1 my-4">
                          <h4 className="font-serif italic text-lg text-purple-950 font-bold">{step.title}</h4>
                          <p className="text-sm text-neutral-600">{step.content}</p>
                          {step.latex && (
                            <div className="py-2 overflow-x-auto">
                              <BlockMath>{step.latex}</BlockMath>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return (
                      <div key={sIdx} className="space-y-2 pl-1">
                        {step.content && renderFormattedText(step.content)}
                        {step.latex && (
                          <div className="py-2 overflow-x-auto bg-[#141414]/5 rounded p-3 my-2 border border-[#141414]/10">
                            <BlockMath>{step.latex}</BlockMath>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {stepsResult.solution && (
                    <div className="mt-8 p-4 bg-emerald-50 border border-emerald-400 text-emerald-950 rounded-sm">
                      <p className="font-serif italic text-base font-bold">Nghiệm tổng quát thu được:</p>
                      <div className="py-2">
                        <BlockMath>{`x \\equiv ${stepsResult.solution.x} \\pmod{${stepsResult.solution.M}}`}</BlockMath>
                      </div>
                      <p className="text-xs font-mono opacity-80 mt-1">Được giải gọn gàng bằng thuật toán Thế cuốn chiếu & Tối ưu số dư âm.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Mode3() {
  const [expr, setExpr] = useState('');
  const [n, setN] = useState('10');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    setLoading(true);
    const res = await solveAdvancedMath(`Extract leading and trailing ${n} digits of the integer result of: ${expr}. Also provide total length.`, 'Integer Digits');
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Big Integer Digits</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Extract specific digits from massive integer expressions</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Expression (e.g. 2^1000 + 3^500)</label>
          <textarea 
            value={expr} 
            onChange={e => setExpr(e.target.value)}
            className="w-full p-4 border border-[#141414] font-mono h-32 resize-none"
            placeholder="Enter expression..."
          />
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="font-mono text-[10px] uppercase opacity-50">Number of Digits (N)</label>
            <input 
              type="number" 
              value={n} 
              onChange={e => setN(e.target.value)}
              className="w-full p-3 border border-[#141414] font-mono"
            />
          </div>
          <button 
            onClick={calculate} 
            disabled={loading}
            className="flex-1 py-3 bg-[#141414] text-[#E4E3E0] font-mono uppercase disabled:opacity-50"
          >
            {loading ? 'Computing...' : 'Analyze'}
          </button>
        </div>
      </div>
      {result && (
        <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] font-mono overflow-auto max-h-96">
          <div className="prose prose-invert prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-xs">{result.content}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function Mode4() {
  const [expr, setExpr] = useState('');
  const [prec, setPrec] = useState('50');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    setLoading(true);
    const res = await solveAdvancedMath(`Perform high-precision analysis of: ${expr}. Show first ${prec} significant digits and decimal part.`, 'Real Analysis');
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Real Digits Analysis</h2>
        <p className="font-mono text-xs opacity-50 mt-2">High-precision floating point computation</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Expression (e.g. sin(pi/7) * e^sqrt(2))</label>
          <textarea 
            value={expr} 
            onChange={e => setExpr(e.target.value)}
            className="w-full p-4 border border-[#141414] font-mono h-32 resize-none"
            placeholder="Enter expression..."
          />
        </div>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-2">
            <label className="font-mono text-[10px] uppercase opacity-50">Significant Digits (15 - 200)</label>
            <input
              type="number"
              min="15"
              max="200"
              value={prec} 
              onChange={e => {
                const val = parseInt(e.target.value);
                if (isNaN(val)) setPrec('');
                else setPrec(Math.min(200, Math.max(1, val)).toString());
              }}
              className="w-full p-3 border border-[#141414] font-mono bg-transparent text-[#141414]"
              placeholder="50"
            />
          </div>
          <button 
            onClick={calculate} 
            disabled={loading}
            className="flex-1 py-3 bg-[#141414] text-[#E4E3E0] font-mono uppercase disabled:opacity-50"
          >
            {loading ? 'Computing...' : 'Analyze'}
          </button>
        </div>
      </div>
      {result && (
        <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] font-mono overflow-auto">
          <pre className="whitespace-pre-wrap text-xs">{result.content}</pre>
        </div>
      )}
    </div>
  );
}

function Mode5() {
  const [r, setR] = useState('');
  const [n, setN] = useState('');
  const [s, setS] = useState('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const ways = waysSumDice(parseInt(r), parseInt(n), parseInt(s));
    const total = BigInt(parseInt(s)) ** BigInt(parseInt(n));
    const prob = (Number(ways) / Number(total)) * 100;
    setResult({ ways: ways.toString(), total: total.toString(), prob: prob.toFixed(10) });
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Dice Probability</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Exact ways to get sum R with N dice of S sides</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Target Sum (R)</label>
          <input type="number" value={r} onChange={e => setR(e.target.value)} className="w-full p-3 border border-[#141414] font-mono" />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Number of Dice (N)</label>
          <input type="number" value={n} onChange={e => setN(e.target.value)} className="w-full p-3 border border-[#141414] font-mono" />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Sides per Die (S)</label>
          <input type="number" value={s} onChange={e => setS(e.target.value)} className="w-full p-3 border border-[#141414] font-mono" />
        </div>
      </div>
      <button onClick={calculate} className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono uppercase">Calculate</button>
      {result && (
        <div className="bg-[#F5F5F5] p-8 border border-[#141414] space-y-4 font-mono">
          <div className="flex justify-between border-b border-[#141414]/10 pb-2">
            <span className="opacity-50">Ways:</span>
            <span className="font-bold">{result.ways}</span>
          </div>
          <div className="flex justify-between border-b border-[#141414]/10 pb-2">
            <span className="opacity-50">Total Outcomes:</span>
            <span className="font-bold">{result.total}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-50">Probability:</span>
            <span className="text-2xl font-serif italic">{result.prob}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

const StatValue = ({ value, isInteger }: { value: any, isInteger?: boolean }) => {
  let fullStr = '';
  if (value && value.isBigNumber) {
    fullStr = math.format(value, { notation: 'fixed', precision: 30 });
    const parts = fullStr.split('.');
    if (parts.length === 2) {
      fullStr = parts[0] + '.' + parts[1].substring(0, 25);
      if (isInteger) {
        fullStr = fullStr.replace(/\.0+$/, '');
      } else {
        fullStr = fullStr.replace(/0+$/, '').replace(/\.$/, '');
      }
    }
  } else if (typeof value === 'number') {
    fullStr = value.toString();
    if (fullStr.includes('e')) {
      // Avoid scientific notation for simple display if possible, but standard toString is fine for now
    }
  } else {
    fullStr = String(value);
  }

  let displayStr = fullStr;
  if (!isInteger && fullStr.includes('.')) {
    const parts = fullStr.split('.');
    if (parts[1].length > 7) {
      displayStr = parts[0] + '.' + parts[1].substring(0, 7);
    }
  }

  return (
    <div className="group relative inline-block cursor-pointer" onClick={() => navigator.clipboard.writeText(fullStr)}>
      <span className="border-b border-dashed border-white/30 hover:text-teal-300 transition-colors">{displayStr}</span>
      <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block z-50">
        <div className="bg-[#E4E3E0] text-[#141414] text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold">
          {fullStr} (Click to copy)
        </div>
      </div>
    </div>
  );
};

function Mode6() {
  const [n, setN] = useState(2);
  const [matrix, setMatrix] = useState<string[][]>(Array(2).fill(0).map(() => Array(2).fill('')));
  const [b, setB] = useState<string[]>(Array(2).fill(''));
  const [result, setResult] = useState<Fraction[] | null | 'error'>(null);

  const updateN = (val: number) => {
    const size = Math.max(2, Math.min(6, val));
    setN(size);
    setMatrix(Array(size).fill(0).map(() => Array(size).fill('')));
    setB(Array(size).fill(''));
    setResult(null);
  };

  const calculate = () => {
    try {
      const mFrac = matrix.map(row => row.map(v => new Fraction(v || '0')));
      const bFrac = b.map(v => new Fraction(v || '0'));
      const res = solveLinearSystem(mFrac, bFrac);
      setResult(res);
    } catch (e) {
      setResult('error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Linear Systems</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Solve Ax = B using Gaussian elimination (Fractions)</p>
      </div>
      <div className="flex items-center gap-4 mb-8">
        <span className="font-mono text-xs uppercase opacity-50">Variables:</span>
        {[2, 3, 4, 5, 6].map(v => (
          <button 
            key={v} 
            onClick={() => updateN(v)}
            className={cn("w-10 h-10 border border-[#141414] font-mono", n === v ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-gray-100")}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase opacity-50 block mb-2">Matrix A</span>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${n}, minmax(60px, 1fr))` }}>
            {matrix.map((row, i) => row.map((val, j) => (
              <input 
                key={`${i}-${j}`}
                value={val}
                onChange={e => {
                  const newM = [...matrix];
                  newM[i][j] = e.target.value;
                  setMatrix(newM);
                }}
                className="w-full p-2 border border-[#141414] font-mono text-center text-sm"
              />
            )))}
          </div>
        </div>
        <div className="flex items-center pt-6">
          <span className="font-serif italic text-2xl">x =</span>
        </div>
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase opacity-50 block mb-2">Vector B</span>
          <div className="grid gap-2">
            {b.map((val, i) => (
              <input 
                key={i}
                value={val}
                onChange={e => {
                  const newB = [...b];
                  newB[i] = e.target.value;
                  setB(newB);
                }}
                className="w-20 p-2 border border-[#141414] font-mono text-center text-sm"
              />
            ))}
          </div>
        </div>
      </div>
      <button onClick={calculate} className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono uppercase">Solve System</button>
      {result && (
        <div className="bg-[#F5F5F5] p-8 border border-[#141414] font-mono">
          {result === 'error' ? (
            <p className="text-red-500">Invalid input format.</p>
          ) : result === null ? (
            <p className="text-red-500">No unique solution (Singular matrix).</p>
          ) : (
            <div className="space-y-4">
              <span className="block text-[10px] uppercase opacity-50 mb-4">Solution Vector x</span>
              {result.map((val, i) => (
                <div key={i} className="flex items-center gap-4 text-xl">
                  <span className="opacity-30">x{i+1} =</span>
                  <span className="font-serif italic font-bold">{val.toFraction()}</span>
                  <span className="text-xs opacity-50">({val.valueOf().toFixed(4)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Mode7() {
  const [coeffs, setCoeffs] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    setLoading(true);
    const res = await analyzePolynomial(coeffs);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Polynomial Analysis</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Roots, extrema, and behavior (Degree ≤ 5)</p>
      </div>
      <div className="space-y-4">
        <label className="font-mono text-[10px] uppercase opacity-50">Coefficients (Comma separated, high to low)</label>
        <input 
          value={coeffs} 
          onChange={e => setCoeffs(e.target.value)}
          className="w-full p-4 border border-[#141414] font-mono"
          placeholder="e.g. 1, 0, -4 (for x² - 4)"
        />
        <button 
          onClick={calculate} 
          disabled={loading}
          className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono uppercase disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Polynomial'}
        </button>
      </div>
      {result && result.data && (
        <div className="space-y-8">
          <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] font-mono">
            <h3 className="text-cyan-400 text-xs uppercase tracking-widest mb-4">Expression</h3>
            <p className="text-3xl font-serif italic">{result.data.expression}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-[#141414] p-6">
              <h4 className="font-mono text-[10px] uppercase opacity-50 mb-4">Roots</h4>
              <ul className="space-y-2">
                {result.data.roots.map((r: string, i: number) => (
                  <li key={i} className="font-serif italic text-lg border-b border-[#141414]/10 pb-1">{r}</li>
                ))}
              </ul>
            </div>
            <div className="border border-[#141414] p-6">
              <h4 className="font-mono text-[10px] uppercase opacity-50 mb-4">Extrema</h4>
              <ul className="space-y-4">
                {result.data.extrema.map((e: any, i: number) => (
                  <li key={i} className="border-b border-[#141414]/10 pb-2">
                    <span className="text-[10px] uppercase font-mono bg-[#141414] text-white px-2 py-0.5 mr-2">{e.type}</span>
                    <span className="font-serif italic">({e.x}, {e.y})</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="bg-[#F5F5F5] p-8 border border-[#141414] font-mono text-sm">
            <h4 className="text-[10px] uppercase opacity-50 mb-4">Monotonic Intervals</h4>
            {result.data.intervals.map((int: any, i: number) => (
              <div key={i} className="flex justify-between py-2 border-b border-[#141414]/10">
                <span>{int.range}</span>
                <span className="italic opacity-70">{int.behavior}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Mode9() {
  const [n, setN] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/factorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ n: n })
      });
      
      if (!response.ok) throw new Error('Failed to factorize');
      
      const data = await response.json();
      
      // Group factors
      const factorMap = new Map<string, number>();
      data.factors.forEach((f: string) => {
        factorMap.set(f, (factorMap.get(f) || 0) + 1);
      });
      
      setResult({ 
        factors: Array.from(factorMap.entries()), 
        isPrime: data.factors.length === 1 && data.factors[0] === n.toString()
      });
    } catch (e) {
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Prime Factorization</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Decompose N into its prime components</p>
      </div>
      <div className="space-y-4">
        <label className="font-mono text-[10px] uppercase opacity-50">Integer (N)</label>
        <input 
          value={n} 
          onChange={e => setN(e.target.value)}
          className="w-full p-4 border border-[#141414] font-mono"
          placeholder="Enter a large integer..."
        />
        <button onClick={calculate} className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono uppercase">Factorize</button>
      </div>
      {result && (
        <div className="bg-[#F5F5F5] p-8 border border-[#141414] font-mono">
          {result === 'error' ? (
            <p className="text-red-500">Invalid integer.</p>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                {result.isPrime ? (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold uppercase text-xs tracking-widest">Prime Number</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-rose-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold uppercase text-xs tracking-widest">Composite Number</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-4">
                {result.factors.map(([p, e]: [string, number], i: number) => (
                  <div key={i} className="bg-white border border-[#141414] p-4 min-w-[80px] text-center">
                    <span className="text-3xl font-serif italic">{p}</span>
                    {e > 1 && <sup className="text-sm font-mono ml-1">{e}</sup>}
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-[#141414]/10">
                <p className="text-xs opacity-50 uppercase tracking-widest mb-2">Canonical Form</p>
                <p className="text-xl font-serif italic">
                  {result.factors.map(([p, e]: [string, number], i: number) => (
                    <React.Fragment key={i}>
                      {p}{e > 1 ? <sup>{e}</sup> : ''}
                      {i < result.factors.length - 1 ? ' × ' : ''}
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPrimesUpTo(limit: number): number[] {
  if (limit < 2) return [];
  const sieve = new Uint8Array(limit + 1);
  const primes: number[] = [];
  for (let i = 2; i <= limit; i++) {
    if (sieve[i] === 0) {
      primes.push(i);
      for (let j = i * 2; j <= limit; j += i) {
        sieve[j] = 1;
      }
    }
  }
  return primes;
}

const primeCache: number[] = [2];
function getKthPrime(k: number): number {
  if (k <= 0) return 2;
  if (k <= primeCache.length) {
    return primeCache[k - 1];
  }
  let candidate = primeCache[primeCache.length - 1];
  while (primeCache.length < k) {
    candidate += (candidate === 2 ? 1 : 2);
    let isP = true;
    const limit = Math.sqrt(candidate);
    for (let i = 0; i < primeCache.length; i++) {
      const p = primeCache[i];
      if (p > limit) break;
      if (candidate % p === 0) {
        isP = false;
        break;
      }
    }
    if (isP) {
      primeCache.push(candidate);
    }
  }
  return primeCache[k - 1];
}

interface PrimeQuery {
  id: string;
  ordinal: number;
}

function Mode10() {
  const [n, setN] = useState('');
  const [m, setM] = useState('1');
  const [result, setResult] = useState<any>(null);
  const [errorMess, setErrorMess] = useState<string>('');
  const [primeQueries, setPrimeQueries] = useState<PrimeQuery[]>([
    { id: '1', ordinal: 1 }
  ]);

  const addQueryRow = () => {
    const lastOrdinal = primeQueries.length > 0 ? primeQueries[primeQueries.length - 1].ordinal : 0;
    const nextOrdinal = lastOrdinal + 1;
    setPrimeQueries([
      ...primeQueries,
      { id: String(Date.now() + Math.random()), ordinal: nextOrdinal }
    ]);
  };

  const updateQueryOrdinal = (id: string, value: number) => {
    setPrimeQueries(prev => prev.map(q => {
      if (q.id === id) {
        return { ...q, ordinal: value };
      }
      return q;
    }));
  };

  const removeQueryRow = (id: string) => {
    setPrimeQueries(prev => prev.filter(q => q.id !== id));
  };

  const calculate = () => {
    setErrorMess('');
    const num = parseInt(n);
    const step = parseInt(m);

    if (isNaN(num) || num < 2) {
      setErrorMess('Vui lòng nhập số nguyên N ≥ 2. / Please enter an integer N ≥ 2.');
      setResult(null);
      return;
    }
    if (isNaN(step) || step < 1) {
      setErrorMess('Vui lòng nhập bước nhảy m ≥ 1. / Please enter step m ≥ 1.');
      setResult(null);
      return;
    }
    if (step === 1 && num > 9999) {
      setErrorMess('Ứng dụng chỉ hỗ trợ N lên tới 9999 khi m = 1 để tránh quá tải trình duyệt. / N is limited to 9999 when m = 1 to prevent browser slowdown.');
      setResult(null);
      return;
    }
    if (step > 1 && num > 100000) {
      setErrorMess('Khi m > 1, ứng dụng giới hạn N tối đa là 100,000 để bảo vệ tài nguyện hệ thống. / N is limited to 100,000 when m > 1 to protect browser resources.');
      setResult(null);
      return;
    }

    try {
      const primes = getPrimesUpTo(num);
      const table = primes.map(p => ({
        p,
        v: v_p_multifactorial(num, step, p)
      })).filter(item => item.v > 0);
      setResult(table);
    } catch (e) {
      console.error(e);
      setErrorMess('Đã xảy ra lỗi trong quá trình tính toán. / An error occurred during calculation.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Factorial Analysis</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Exponent of prime P in N! or N!⁽ᵐ⁾</p>
      </div>

      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 font-sans text-xs text-amber-900 space-y-1">
        <p className="font-semibold">⚠️ Giới hạn hỗ trợ của hệ thống / System Operating Limits:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li><strong>Nếu m = 1:</strong> Hệ thống chỉ hỗ trợ <strong>N ≤ 9999</strong> để tối ưu hóa hiệu năng tính toán.</li>
          <li><strong>Nếu m &gt; 1:</strong> N có thể hoạt động xa hơn nhiều so với 9999, tối đa lên tới <strong>100,000</strong>.</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">N</label>
          <input
            type="number"
            value={n}
            onChange={e => setN(e.target.value)}
            className="w-full p-3 border border-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Ví dụ: 100"
          />
        </div>
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Step (m)</label>
          <input
            type="number"
            value={m}
            onChange={e => setM(e.target.value)}
            className="w-full p-3 border border-[#141414] font-mono focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Mặc định m = 1 (Factorial)"
          />
        </div>
      </div>

      <button onClick={calculate} className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono uppercase tracking-wider hover:bg-neutral-800 transition-colors">
        Analyze Factorial
      </button>

      {/* --- QUICK ORDINAL PRIME EXPONENT LOOKUP --- */}
      <div className="border-2 border-[#141414] p-5 bg-stone-50 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#141414]/10 pb-3 gap-2">
          <div>
            <h3 className="font-serif italic text-lg font-bold text-neutral-900 flex items-center gap-1.5">
              <span>🔍</span> Tra Cứu Số Mũ Theo Thứ Tự SNT
            </h3>
            <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest mt-0.5">
              Prime Index Exponent lookup (Supports any huge N)
            </p>
          </div>
          <button
            onClick={addQueryRow}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border-2 border-emerald-800 hover:bg-emerald-100 transition-colors font-mono text-xs font-bold flex items-center gap-1"
            title="Thêm số thứ tự nguyên tố tiếp theo / Add next prime index"
          >
            <span className="text-sm font-black">+</span> SNT tiếp theo
          </button>
        </div>

        <div className="space-y-2.5 max-h-[350px] overflow-y-auto custom-scrollbar pr-1">
          {primeQueries.map((q, index) => {
            const p = getKthPrime(q.ordinal);
            const numVal = parseInt(n);
            const stepVal = parseInt(m) || 1;
            let exponentValue = 0;
            const hasValidN = !isNaN(numVal) && numVal >= 2;
            
            if (hasValidN && p <= numVal) {
              exponentValue = v_p_multifactorial(numVal, stepVal, p);
            }

            return (
              <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-[#141414]/20 hover:border-black transition-all">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-neutral-400">Trạng thái #{index + 1}:</span>
                  <span className="font-serif italic text-xs font-medium">SNT thứ (k =):</span>
                  <input
                    type="number"
                    min="1"
                    max="1000000"
                    value={q.ordinal}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      updateQueryOrdinal(q.id, Math.max(1, val));
                    }}
                    className="w-16 p-1 border border-[#141414] font-mono text-center text-sm focus:outline-none focus:ring-1 focus:ring-black bg-stone-50"
                  />
                </div>

                <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 border border-[#141414]/15 rounded-sm font-mono text-xs">
                    <span className="text-neutral-500">SNT tương ứng:</span>
                    <span className="font-serif italic text-sm font-bold text-black font-semibold">p = {p}</span>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    <div className="font-mono text-xs text-neutral-600">
                      Số mũ <span className="font-serif italic text-sm font-semibold">v_p</span> :{" "}
                      {hasValidN ? (
                        p > numVal ? (
                          <span className="text-red-500 font-bold">0 (p &gt; N)</span>
                        ) : (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 border border-emerald-300 rounded-sm">
                            {exponentValue}
                          </span>
                        )
                      ) : (
                        <span className="text-neutral-400 italic">Nhập N để tính / Enter N</span>
                      )}
                    </div>
                    {hasValidN && exponentValue > 0 && (
                      <span className="font-mono text-[11px] text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                        {p}<sup>{exponentValue}</sup>
                      </span>
                    )}
                    {primeQueries.length > 1 && (
                      <button
                        onClick={() => removeQueryRow(q.id)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-800 transition-colors border border-transparent hover:border-red-200 text-xs font-mono font-bold"
                        title="Xóa dòng tra cứu / Remove row"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {errorMess && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-sans flex items-start gap-2 rounded-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMess}</span>
        </div>
      )}

      {result && result.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="font-mono text-xs text-neutral-500">
              Tổng số ước nguyên tố / Divisors found: <span className="font-bold text-neutral-800 font-serif italic text-base">{result.length}</span>
            </span>
          </div>
          
          <div className="bg-[#F5F5F5] border border-[#141414] max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left font-mono text-sm relative">
              <thead className="bg-[#141414] text-[#E4E3E0] uppercase text-[10px] tracking-widest sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="p-4 bg-[#141414]">Prime (p)</th>
                  <th className="p-4 bg-[#141414]">Exponent (v_p)</th>
                  <th className="p-4 bg-[#141414]">Contribution</th>
                </tr>
              </thead>
              <tbody>
                {result.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-[#141414]/10 hover:bg-white/40 transition-colors">
                    <td className="p-4 font-serif italic text-xl">{item.p}</td>
                    <td className="p-4 font-semibold">{item.v}</td>
                    <td className="p-4 opacity-50 font-sans text-xs">{item.p}<sup>{item.v}</sup></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.length === 0 && (
        <p className="text-center font-serif italic py-8 text-neutral-500">
          Không tìm thấy ước nguyên tố nào với N và m đã nhập.
        </p>
      )}
    </div>
  );
}

function Mode12() {
  const [primes, setPrimes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState('10');

  const fetchPrimes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/primes');
      const data = await res.json();
      setPrimes(data.primes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generatePrimes = async () => {
    setLoading(true);
    try {
      await fetch('/api/primes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: parseInt(count) })
      });
      await fetchPrimes();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateUpTo25M = async () => {
    if (!confirm('This will generate up to 2.5 million primes. It may take some time. Continue?')) return;
    setLoading(true);
    try {
      await fetch('/api/primes/generate-upto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCount: 2500000 })
      });
      await fetchPrimes();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPrimes();
  }, []);

  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Prime Manager</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Manage and generate prime numbers in the persistent store</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="font-mono text-[10px] uppercase opacity-50">Generate More Primes</label>
            <div className="flex gap-2">
              <input 
                type="number" 
                value={count} 
                onChange={e => setCount(e.target.value)}
                className="flex-1 p-3 border border-[#141414] font-mono"
                placeholder="Count"
              />
              <button 
                onClick={generatePrimes}
                disabled={loading}
                className="px-6 bg-[#141414] text-[#E4E3E0] font-mono uppercase text-xs disabled:opacity-50"
              >
                {loading ? '...' : 'Generate'}
              </button>
            </div>
            <button 
              onClick={generateUpTo25M}
              disabled={loading}
              className="w-full py-3 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Auto-Generate up to 2.5M Primes'}
            </button>
          </div>
          
          <div className="bg-[#F5F5F5] p-6 border border-[#141414]">
            <h3 className="font-mono text-[10px] uppercase opacity-50 mb-4">Stats</h3>
            <div className="flex justify-between items-end">
              <span className="text-sm font-mono">Total Primes:</span>
              <span className="text-4xl font-serif italic">{primes.length}</span>
            </div>
            <div className="flex justify-between items-end mt-4">
              <span className="text-sm font-mono">Largest Prime:</span>
              <span className="text-2xl font-serif italic">{primes[primes.length - 1] || 'N/A'}</span>
            </div>
            
            <button 
              onClick={() => {
                const blob = new Blob([JSON.stringify({ primes, metadata: { count: primes.length, lastUpdated: new Date().toISOString() } }, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'primes_store.json';
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="w-full mt-6 py-3 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
            >
              Download Full JSON
            </button>
          </div>
        </div>
        
        <div className="border border-[#141414] p-6 h-[400px] overflow-y-auto bg-white relative">
          <h3 className="font-mono text-[10px] uppercase opacity-50 mb-4 sticky top-0 bg-white pb-2 z-10">
            Prime List (Showing last 1000)
          </h3>
          {loading && primes.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <span className="font-mono text-xs animate-pulse italic opacity-50">Loading primes...</span>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {primes.slice(-1000).reverse().map((p, i) => (
                <div key={i} className="p-2 border border-[#141414]/10 text-center font-mono text-xs hover:bg-gray-50">
                  {p}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Mode11({ initialQuery, userFunctions }: { initialQuery?: string, userFunctions?: { f: string, g: string, h: string } }) {
  const [subMode, setSubMode] = useState<'main' | 'complex' | 'complexopt'>('main');
  const [query, setQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showApprox, setShowApprox] = useState(false);
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad');

  const [showDMS, setShowDMS] = useState(false);
  const [dmsX, setDmsX] = useState('');
  const [dmsY, setDmsY] = useState('');
  const [dmsZ, setDmsZ] = useState('');
  const [dmsError, setDmsError] = useState('');

  const [history, setHistory] = useState<{ query: string, result: any, time: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMathSymb, setShowMathSymb] = useState(false);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleInsertAtCursor = (textToInsert: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setQuery(prev => prev + textToInsert);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const originalText = textarea.value;
    const newText = originalText.substring(0, start) + textToInsert + originalText.substring(end);
    setQuery(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleInsertDMS = () => {
    const x = parseInt(dmsX);
    if (isNaN(x)) { setDmsError('x (Độ) phải là số nguyên'); return; }
    
    const y = parseInt(dmsY);
    if (isNaN(y) || y < 0) { setDmsError('y (Phút) phải là số tự nhiên'); return; }
    
    const zStr = dmsZ.trim();
    const z = parseFloat(zStr);
    if (isNaN(z) || z < 0) { setDmsError('z (Giây) phải là số thực không âm'); return; }
    
    const zParts = zStr.split('.');
    if (zParts.length === 2 && zParts[1].length > 8) {
      setDmsError('z (Giây) chỉ cho phép tối đa 8 chữ số sau dấu phẩy');
      return;
    }

    const dmsString = `${x}° ${y}' ${zStr}"`;
    setQuery(prev => prev + dmsString);
    setShowDMS(false);
    setDmsX(''); setDmsY(''); setDmsZ(''); setDmsError('');
  };

  const calculateQuery = async (queryToUse: string) => {
    setLoading(true);
    setShowApprox(true);
    const res = await solveAdvancedMath(queryToUse, 'Advanced Symbolic Engine', userFunctions, angleMode);
    
    setResult(res);
    setHistory(prev => [{ query: queryToUse, result: res, time: new Date().toLocaleTimeString() }, ...prev]);
    
    // Auto-calculate numeric approx
    if (res.type === 'success') {
      await convertToNumeric(res);
    }
    
    setLoading(false);
  };

  const calculate = () => calculateQuery(query);

  const exportToLaTeX = () => {
    if (!result) return;
    const latex = `\\documentclass{article}\n\\usepackage{amsmath}\n\\begin{document}\n\n\\textbf{Query:}\n\\[ \\text{${query}} \\]\n\n\\textbf{Result:}\n\\[ ${result.content.replace(/\n/g, ' \\\\ ')} \\]\n\n\\end{document}`;
    const blob = new Blob([latex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'solution.tex';
    a.click();
  };

  const convertToNumeric = async (targetResult?: any) => {
    const currentResult = targetResult || result;
    if (!currentResult || !currentResult.content) return;
    
    try {
      let finalNumeric = "";

      // 1. Try mathjs if expression is available
      if (currentResult.data?.mathjs_expression) {
        try {
          const bigMath = math.create(math.all, { number: 'BigNumber', precision: 100 });
          
          const computeGamma = (zStr: any) => {
            const z = bigMath.bignumber(zStr);
            const a = 200;
            const pi = bigMath.pi;
            const c0 = bigMath.sqrt(bigMath.multiply(2, pi));
            let sum = bigMath.bignumber(c0 as any);
            let fact = bigMath.bignumber(1);
            for (let k = 1; k < a; k++) {
              if (k > 1) fact = bigMath.multiply(fact, k - 1) as any;
              const sign = (k - 1) % 2 === 0 ? 1 : -1;
              const base = bigMath.bignumber(a - k);
              const exponent = bigMath.bignumber(k - 0.5);
              const term1 = bigMath.pow(base, exponent);
              const term2 = bigMath.exp(base);
              let ck = bigMath.multiply(term1, term2);
              ck = bigMath.divide(ck, fact);
              if (sign < 0) ck = bigMath.unaryMinus(ck);
              const denom = bigMath.add(z, k - 1);
              const fraction = bigMath.divide(ck, denom);
              sum = bigMath.add(sum, fraction) as any;
            }
            const z_plus_a_minus_1 = bigMath.add(z, a - 1);
            const z_minus_half = bigMath.subtract(z, 0.5);
            const part1 = bigMath.pow(z_plus_a_minus_1, z_minus_half);
            const minus_z_minus_a_plus_1 = bigMath.subtract(bigMath.subtract(1, a), z);
            const part2 = bigMath.exp(minus_z_minus_a_plus_1);
            let resG = bigMath.multiply(sum, part1);
            resG = bigMath.multiply(resG, part2);
            return resG;
          };

          bigMath.import({
            G: bigMath.bignumber('0.9159655941772190150546035149323841107741493742816721342664981196'),
            ln: bigMath.log,
            gamma: computeGamma
          }, { override: true });

          const val = bigMath.evaluate(currentResult.data.mathjs_expression);
          const strVal = bigMath.format(val, { notation: 'fixed', precision: 30 });
          const parts = strVal.split('.');
          finalNumeric = parts.length === 2 ? parts[0] + '.' + parts[1].substring(0, 25) : strVal;
        } catch (e) {
          console.warn("MathJS fallback triggered:", e);
        }
      }

      // 2. Fallback to SymPy API (CRITICAL for pi^2/6 etc)
      if (!finalNumeric) {
        // Use symbolic if available, otherwise content
        const exprToEval = currentResult.data?.symbolic || currentResult.content;
        
        const hasUnbalancedBrackets = (str: string) => {
          let openSquare = 0, openParen = 0, openCurly = 0;
          for (const char of str) {
            if (char === '[') openSquare++;
            else if (char === ']') openSquare--;
            else if (char === '(') openParen++;
            else if (char === ')') openParen--;
            else if (char === '{') openCurly++;
            else if (char === '}') openCurly--;
          }
          return openSquare !== 0 || openParen !== 0 || openCurly !== 0;
        };

        const isUnsuitableStr = (str: string) => {
          const s = str.trim();
          if (!s || s.length > 500) return true;
          if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(s)) {
            return true;
          }
          if (s.includes('∈') || s.includes('→') || s.includes('\\in')) return true;
          if (hasUnbalancedBrackets(s)) return true;
          
          const words = s.split(/\s+/).filter(w => w.length > 1);
          const mathWords = new Set(['pi', 'sin', 'cos', 'tan', 'log', 'exp', 'ln', 'sqrt', 'oo', 'inf', 'infinity', 'theta']);
          const nonMathWords = words.filter(w => !mathWords.has(w.toLowerCase()) && !/^[0-9xXyYzZtTuUvVnN\-\+\*\/\^()\[\],\.=!><]+$/.test(w));
          if (nonMathWords.length > 0) return true;
          
          return false;
        };

        if (isUnsuitableStr(exprToEval)) {
          console.log("Filtered out unsuitable string for EvalF:", exprToEval);
          return;
        }

        const res = await fetch('/api/math/evalf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expr: exprToEval, precision: 25 })
        });
        
        if (!res.ok) {
          const text = await res.text();
          console.warn(`SymPy EvalF API error (${res.status}): ${text.substring(0, 100)}`);
          return;
        }

        const data = await res.json();
        if (data.result) {
          finalNumeric = data.result;
        } else if (data.error) {
          console.warn("SymPy EvalF failed:", data.error);
        }
      }

      if (finalNumeric) {
        setResult((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            data: {
              ...(prev.data || {}),
              numeric: finalNumeric
            }
          };
        });
        setShowApprox(true);
      }
    } catch (e) {
      console.error("Numeric conversion error:", e);
    }
  };

  const examples = [
    "Derivative of sin(x^2) * e^x",
    "Integral of 1/(1+x^2) from 0 to infinity",
    "Solve x^3 - 5x + 2 = 0",
    "Sum of 1/n^2 from n=1 to infinity",
    "Limit of (sin x)/x as x -> 0",
    "Factor 1000003",
    "Pi(1000)"
  ];

  return (
    <div className="space-y-8 relative">
      <div className="border-b border-[#141414] pb-4 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-serif italic text-4xl">Advanced Math Engine</h2>
            <p className="font-mono text-xs opacity-50 mt-2">Calculus, Symbolic Algebra, and Limits</p>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="text-[10px] font-mono uppercase tracking-wider px-4 py-2 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
          >
            {showHistory ? 'Hide History' : 'Show History'}
          </button>
        </div>
        <div className="flex border border-[#141414] w-fit flex-wrap">
          <button onClick={() => setSubMode('main')} className={`px-4 py-2 text-xs font-mono uppercase transition-colors ${subMode==='main'?'bg-[#141414] text-white':'hover:bg-gray-200'}`}>Main Engine</button>
          <button onClick={() => setSubMode('complex')} className={`px-4 py-2 text-xs font-mono uppercase transition-colors ${subMode==='complex'?'bg-[#141414] text-white':'hover:bg-gray-200'}`}>Complex Equation Lab</button>
          <button onClick={() => setSubMode('complexopt')} className={`px-4 py-2 text-xs font-mono uppercase transition-colors ${subMode==='complexopt'?'bg-[#141414] bg-teal-600 text-white':'hover:bg-gray-200 text-teal-800 font-bold'}`}>Complex Optimization Lab NEW</button>
        </div>
      </div>

      {subMode === 'complex' ? (
        <ComplexEquationLab />
      ) : subMode === 'complexopt' ? (
        <ComplexOptimizationLab />
      ) : (
      <>
      {showHistory && history.length > 0 && (
        <div className="bg-gray-100 p-4 border border-[#141414] max-h-64 overflow-y-auto mb-6">
          <h3 className="font-mono text-[10px] uppercase tracking-widest mb-4 opacity-50">Computation History</h3>
          <div className="space-y-4">
            {history.map((item, idx) => (
              <div key={idx} className="border-b border-[#141414]/10 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-xs font-bold">{item.query}</span>
                  <span className="font-mono text-[10px] opacity-50">{item.time}</span>
                </div>
                <div className="font-mono text-xs text-gray-600 truncate">
                  {item.result.data?.latex ? (
                    <div className="overflow-hidden max-h-12">
                      <BlockMath math={item.result.data.latex} />
                    </div>
                  ) : (
                    item.result.content
                  )}
                </div>
                <button 
                  onClick={() => { setQuery(item.query); setResult(item.result); setShowHistory(false); }}
                  className="text-[10px] uppercase text-blue-600 hover:underline mt-1"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-mono text-[10px] uppercase opacity-50">Natural Language Query or Expression</label>
          <div className="relative">
            <textarea 
              ref={textareaRef}
              value={query} 
              onChange={e => setQuery(e.target.value)}
              className="w-full p-6 border border-[#141414] font-mono h-40 resize-none text-lg focus:ring-0"
              placeholder="What would you like to compute?"
            />
            <button 
              onClick={calculate} 
              disabled={loading || !query}
              className="absolute bottom-4 right-4 p-4 bg-[#141414] text-[#E4E3E0] hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Cpu className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {examples.map((ex, i) => (
            <button 
              key={i} 
              onClick={() => setQuery(ex)}
              className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 border border-[#141414]/20 hover:border-[#141414] transition-colors"
            >
              {ex}
            </button>
          ))}
          <div className="relative">
            <button 
              onClick={() => setShowDMS(!showDMS)}
              className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 border border-[#141414]/20 hover:border-[#141414] transition-colors bg-white"
            >
              [x°y'z"]
            </button>
            {showDMS && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[#141414] p-4 shadow-lg z-10 w-64">
                <div className="text-[10px] font-mono uppercase tracking-wider mb-3 opacity-50">Nhập Độ Phút Giây</div>
                <div className="flex items-center gap-2 mb-2">
                  <input type="number" value={dmsX} onChange={e => setDmsX(e.target.value)} placeholder="x" className="w-16 p-1 border border-[#141414] text-sm text-center" />
                  <span>°</span>
                  <input type="number" value={dmsY} onChange={e => setDmsY(e.target.value)} placeholder="y" className="w-16 p-1 border border-[#141414] text-sm text-center" min="0" />
                  <span>'</span>
                  <input type="number" value={dmsZ} onChange={e => setDmsZ(e.target.value)} placeholder="z" className="w-20 p-1 border border-[#141414] text-sm text-center" min="0" step="0.00000001" />
                  <span>"</span>
                </div>
                {dmsError && <div className="text-red-500 text-[10px] mb-2">{dmsError}</div>}
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowDMS(false)} className="text-[10px] px-2 py-1 border border-transparent hover:bg-gray-100">Hủy</button>
                  <button onClick={handleInsertDMS} className="text-[10px] px-2 py-1 bg-[#141414] text-white">Chèn</button>
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setAngleMode(m => m === 'rad' ? 'deg' : 'rad')}
            className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 border border-[#141414]/20 hover:border-[#141414] transition-colors bg-white font-bold"
          >
            {angleMode === 'rad' ? 'RAD' : 'DEG'}
          </button>
          <button 
            onClick={() => setQuery("Factor 1000003")}
            className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 border border-rose-500/30 text-rose-600 hover:border-rose-500 hover:bg-rose-50 transition-colors bg-white font-bold"
          >
            Factor
          </button>
          <button 
            onClick={() => setQuery("Pi(1000)")}
            className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 border border-indigo-500/30 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 transition-colors bg-white font-bold"
          >
            Pi(x)
          </button>
          <button 
            onClick={() => setQuery("Solve Pi(x) = 7")}
            className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 border border-emerald-500/30 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50 transition-colors bg-white font-bold"
          >
            Số nguyên tố thứ n
          </button>
          <button 
            onClick={() => setShowMathSymb(!showMathSymb)}
            className={`text-[10px] font-mono uppercase tracking-wider px-3 py-1 border transition-colors font-bold ${
              showMathSymb 
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50 shadow-inner'
                : 'border-indigo-500/30 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 bg-white'
            }`}
          >
            {showMathSymb ? 'Math Symb Input ▲' : 'Math Symb Input ▼'}
          </button>
        </div>

        {showMathSymb && (
          <div className="mt-4 border-t border-[#141414]/10 pt-4">
            <MathSymbInputPanel 
              onInsert={(expr) => {
                handleInsertAtCursor(expr);
                setShowMathSymb(false);
              }} 
            />
          </div>
        )}
      </div>
      
      {result && (
        <div className="bg-[#141414] text-[#E4E3E0] p-8 border border-[#141414] font-mono overflow-auto relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 opacity-40">
              <Info className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-widest">Computation Result</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={exportToLaTeX}
                className="text-[10px] uppercase tracking-widest px-3 py-1 border border-[#E4E3E0]/20 hover:border-[#E4E3E0] transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> LaTeX
              </button>
              
              <button 
                onClick={() => setShowApprox(!showApprox)}
                className="text-[10px] uppercase tracking-widest px-3 py-1 border border-[#E4E3E0]/20 hover:border-[#E4E3E0] transition-colors"
              >
                {showApprox ? 'Hide Approx' : 'Show Approx'}
              </button>
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            {result.data?.latex ? (
              <div className="p-4 rounded overflow-x-auto text-[#E4E3E0]">
                <BlockMath math={result.data.latex} />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-lg leading-relaxed">{result.content}</pre>
            )}
            {showApprox && result.data?.numeric && (
              <div className="mt-4 pt-4 border-t border-[#E4E3E0]/20">
                <div className="text-[10px] uppercase tracking-widest opacity-40 mb-2">25-Digit Precision (Truncated)</div>
                <div className="text-xl text-[#E4E3E0] break-all font-serif italic">{result.data.numeric}</div>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

function Mode13() {
  const [dimension, setDimension] = useState<'2D' | '3D'>('3D');
  const [activeTab, setActiveTab] = useState<'lines' | 'circles' | 'planes' | 'spheres' | 'points'>('lines');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState<'compare' | 'projection' | 'intersection'>('compare');

  // States for up to 4 of each
  const [lines, setLines] = useState(Array(4).fill(null).map(() => ({ 
    form: 'parametric' as 'general' | 'parametric',
    a: '0', b: '1', c: '0', d: '0', e: '0', f: '0' 
  })));
  const [circles, setCircles] = useState(Array(4).fill(null).map(() => ({ x0: '0', y0: '0', r: '1' })));
  const [planes, setPlanes] = useState(Array(4).fill(null).map(() => ({ a: '1', b: '0', c: '0', d: '0' })));
  const [spheres, setSpheres] = useState(Array(4).fill(null).map(() => ({ x0: '0', y0: '0', z0: '0', r: '1' })));
  const [points, setPoints] = useState(Array(4).fill(null).map(() => ({ x: '0', y: '0', z: '0' })));
  const [sphereVolumes, setSphereVolumes] = useState<string[]>(Array(4).fill(''));

  // Comparison selection
  const [comp1, setComp1] = useState<{ type: string, index: number }>({ type: 'L', index: 0 });
  const [comp2, setComp2] = useState<{ type: string, index: number }>({ type: 'L', index: 1 });

  const parseValue = async (expr: string) => {
    const r = await fetch('/api/geometry/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expr })
    });
    const data = await r.json();
    return data.value;
  };

  const handleCompare = async () => {
    setLoading(true);
    try {
      const getParsed = async (type: string, idx: number) => {
        if (type === 'L') {
          const l = lines[idx];
          const a = await parseValue(l.a);
          const b = await parseValue(l.b);
          const c = await parseValue(l.c);
          const d = await parseValue(l.d);
          const e = await parseValue(l.e);
          const f = await parseValue(l.f);

          if (dimension === '2D') {
            if (l.form === 'general') {
              return { type: '2D', a, b, c };
            } else {
              // Parametric: x = a + bt, y = c + dt
              // Convert to General: dt*x - bt*y + (bt*c - dt*a) = 0
              // ax + by + c = 0 => a=d, b=-b, c=b*c-d*a
              return { type: '2D', a: d, b: -b, c: b * c - d * a };
            }
          } else {
            // 3D
            if (l.form === 'general') {
              // For 3D, "General" usually means Symmetric: (x-a)/b = (y-c)/d = (z-e)/f
              // Which is same as Parametric: x = a + bt, y = c + dt, z = e + ft
              return { type: '3D', a, b, c, d, e, f };
            }
            return { type: '3D', a, b, c, d, e, f };
          }
        }
        if (type === 'C') {
          const c = circles[idx];
          return { x0: await parseValue(c.x0), y0: await parseValue(c.y0), r: await parseValue(c.r) };
        }
        if (type === 'P') {
          const p = planes[idx];
          return { a: await parseValue(p.a), b: await parseValue(p.b), c: await parseValue(p.c), d: await parseValue(p.d) };
        }
        if (type === 'S') {
          const s = spheres[idx];
          return { x0: await parseValue(s.x0), y0: await parseValue(s.y0), z0: await parseValue(s.z0), r: await parseValue(s.r) };
        }
        if (type === 'A') {
          const p = points[idx];
          return { x: await parseValue(p.x), y: await parseValue(p.y), z: await parseValue(p.z) };
        }
      };

      const obj1 = await getParsed(comp1.type, comp1.index);
      const obj2 = await getParsed(comp2.type, comp2.index);

      let endpoint = '';
      let body: any = {};

      if (analysisType === 'projection') {
        endpoint = '/api/geometry/orthogonal-projection';
        body = { obj1, obj2, dimension };
      } else if (analysisType === 'intersection') {
        endpoint = '/api/geometry/intersection';
        body = { obj1, obj2, dimension };
      } else {
        if (comp1.type === 'L' && comp2.type === 'L') {
          endpoint = '/api/geometry/compare-lines';
          body = { l1: obj1, l2: obj2 };
        } else if (comp1.type === 'P' && comp2.type === 'S') {
          endpoint = '/api/geometry/compare-plane-sphere';
          body = { plane: obj1, sphere: obj2 };
        } else if (comp1.type === 'S' && comp2.type === 'P') {
          endpoint = '/api/geometry/compare-plane-sphere';
          body = { plane: obj2, sphere: obj1 };
        } else if (comp1.type === 'S' && comp2.type === 'S') {
          endpoint = '/api/geometry/compare-spheres';
          body = { s1: obj1, s2: obj2 };
        } else if (comp1.type === 'C' && comp2.type === 'C') {
          endpoint = '/api/geometry/compare-circles';
          body = { c1: obj1, c2: obj2 };
        } else if (comp1.type === 'L' && comp2.type === 'C') {
          endpoint = '/api/geometry/compare-line-circle';
          body = { line: obj1, circle: obj2 };
        } else if (comp1.type === 'C' && comp2.type === 'L') {
          endpoint = '/api/geometry/compare-line-circle';
          body = { line: obj2, circle: obj1 };
        } else if (comp1.type === 'L' && comp2.type === 'P') {
          endpoint = '/api/geometry/compare-line-plane';
          body = { line: obj1, plane: obj2 };
        } else if (comp1.type === 'P' && comp2.type === 'L') {
          endpoint = '/api/geometry/compare-line-plane';
          body = { line: obj2, plane: obj1 };
        } else if (comp1.type === 'L' && comp2.type === 'S') {
          endpoint = '/api/geometry/compare-line-sphere';
          body = { line: obj1, sphere: obj2 };
        } else if (comp1.type === 'S' && comp2.type === 'L') {
          endpoint = '/api/geometry/compare-line-sphere';
          body = { line: obj2, sphere: obj1 };
        } else if (comp1.type === 'A' && comp2.type === 'P') {
          endpoint = '/api/geometry/compare-point-plane';
          body = { point: obj1, plane: obj2 };
        } else if (comp1.type === 'P' && comp2.type === 'A') {
          endpoint = '/api/geometry/compare-point-plane';
          body = { point: obj2, plane: obj1 };
        } else if (comp1.type === 'A' && comp2.type === 'L') {
          endpoint = '/api/geometry/compare-point-line';
          body = { point: obj1, line: obj2 };
        } else if (comp1.type === 'L' && comp2.type === 'A') {
          endpoint = '/api/geometry/compare-point-line';
          body = { point: obj2, line: obj1 };
        } else if (comp1.type === 'A' && comp2.type === 'A') {
          endpoint = '/api/geometry/compare-points';
          body = { p1: obj1, p2: obj2, dimension };
        } else {
          setResult("Chế độ so sánh này chưa được hỗ trợ.");
          setLoading(false);
          return;
        }
      }

      const r = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await r.json();
      setResult(data.result);
    } catch (e) {
      setResult("Lỗi tính toán. Kiểm tra lại biểu thức.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-[#141414] pb-4">
        <div>
          <h2 className="font-serif italic text-4xl">Geometry Pro</h2>
          <p className="font-mono text-xs opacity-50 mt-2">Phân tích đa đối tượng 2D/3D</p>
        </div>
        <div className="flex border border-[#141414] p-1">
          {(['2D', '3D'] as const).map(d => (
            <button
              key={d}
              onClick={() => { setDimension(d); setActiveTab(d === '2D' ? 'lines' : activeTab); }}
              className={cn(
                "px-4 py-1 font-mono text-[10px] uppercase tracking-widest transition-all",
                dimension === d ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-gray-100"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 border-b border-[#141414]/10">
        {[
          { id: 'lines', label: 'Đường thẳng (L)', dim: ['2D', '3D'] },
          { id: 'circles', label: 'Hình tròn (C)', dim: ['2D'] },
          { id: 'planes', label: 'Mặt phẳng (P)', dim: ['3D'] },
          { id: 'spheres', label: 'Mặt cầu (S)', dim: ['3D'] },
          { id: 'points', label: 'Điểm (A)', dim: ['2D', '3D'] }
        ].filter(t => t.dim.includes(dimension)).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "pb-4 px-2 font-mono text-[10px] uppercase tracking-widest transition-all relative",
              activeTab === tab.id ? "opacity-100" : "opacity-30 hover:opacity-100"
            )}
          >
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[0, 1, 2, 3].map(idx => (
              <div key={idx} className="p-4 border border-[#141414]/10 space-y-4 bg-gray-50/50">
                <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40">
                  {activeTab === 'lines' ? `L${idx+1}` : activeTab === 'circles' ? `C${idx+1}` : activeTab === 'planes' ? `P${idx+1}` : activeTab === 'spheres' ? `S${idx+1}` : `A${idx+1}`}
                </h3>
                
                {activeTab === 'lines' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-mono opacity-60 italic">
                        {dimension === '2D' 
                          ? (lines[idx].form === 'general' ? 'Dạng: ax + by + c = 0' : 'Dạng: x=x0+at, y=y0+bt')
                          : (lines[idx].form === 'general' ? 'Dạng chính tắc: (x-x0)/a = (y-y0)/b = (z-z0)/c' : 'Dạng: x=x0+at, y=y0+bt, z=z0+ct')
                        }
                      </p>
                      <div className="flex gap-2">
                        <select 
                          className="text-[9px] font-mono border border-[#141414] px-1 bg-transparent"
                          onChange={async (e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const [p1Idx, p2Idx] = val.split('-').map(Number);
                            const p1 = points[p1Idx];
                            const p2 = points[p2Idx];
                            
                            const newLines = [...lines];
                            if (dimension === '2D') {
                              // Line through (x1, y1) and (x2, y2)
                              // (y1-y2)x + (x2-x1)y + x1y2 - x2y1 = 0
                              const a = `(${p1.y} - ${p2.y})`;
                              const b = `(${p2.x} - ${p1.x})`;
                              const c = `(${p1.x} * ${p2.y} - ${p2.x} * ${p1.y})`;
                              newLines[idx] = { ...newLines[idx], form: 'general', a, b, c };
                            } else {
                              // Parametric: x = x1 + (x2-x1)t
                              newLines[idx] = { 
                                ...newLines[idx], 
                                form: 'parametric',
                                a: p1.x, b: `(${p2.x} - ${p1.x})`,
                                c: p1.y, d: `(${p2.y} - ${p1.y})`,
                                e: p1.z, f: `(${p2.z} - ${p1.z})`
                              };
                            }
                            setLines(newLines);
                          }}
                        >
                          <option value="">Viết qua điểm...</option>
                          <option value="0-1">Qua A1, A2</option>
                          <option value="0-2">Qua A1, A3</option>
                          <option value="1-2">Qua A2, A3</option>
                          <option value="2-3">Qua A3, A4</option>
                        </select>
                        <button 
                          onClick={() => {
                            const newLines = [...lines];
                            newLines[idx].form = newLines[idx].form === 'general' ? 'parametric' : 'general';
                            setLines(newLines);
                          }}
                          className="text-[9px] font-mono border border-[#141414] px-2 py-0.5 hover:bg-[#141414] hover:text-white transition-colors"
                        >
                          Đổi dạng
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {dimension === '2D' ? (
                        lines[idx].form === 'general' ? (
                          ['a', 'b', 'c'].map(k => (
                            <div key={k}>
                              <label className="text-[9px] font-mono opacity-40 uppercase">{k}</label>
                              <input 
                                value={(lines[idx] as any)[k]} 
                                onChange={e => {
                                  const newLines = [...lines];
                                  newLines[idx] = { ...newLines[idx], [k]: e.target.value };
                                  setLines(newLines);
                                }}
                                className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                              />
                            </div>
                          ))
                        ) : (
                          ['a', 'b', 'c', 'd'].map((k, i) => (
                            <div key={k}>
                              <label className="text-[9px] font-mono opacity-40 uppercase">
                                {k === 'a' ? 'x0' : k === 'b' ? 'a' : k === 'c' ? 'y0' : 'b'}
                              </label>
                              <input 
                                value={(lines[idx] as any)[k]} 
                                onChange={e => {
                                  const newLines = [...lines];
                                  newLines[idx] = { ...newLines[idx], [k]: e.target.value };
                                  setLines(newLines);
                                }}
                                className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                              />
                            </div>
                          ))
                        )
                      ) : (
                        // 3D
                        lines[idx].form === 'general' ? (
                          ['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => (
                            <div key={k}>
                              <label className="text-[9px] font-mono opacity-40 uppercase">
                                {k === 'a' ? 'x0' : k === 'b' ? 'a' : k === 'c' ? 'y0' : k === 'd' ? 'b' : k === 'e' ? 'z0' : 'c'}
                              </label>
                              <input 
                                value={(lines[idx] as any)[k]} 
                                onChange={e => {
                                  const newLines = [...lines];
                                  newLines[idx] = { ...newLines[idx], [k]: e.target.value };
                                  setLines(newLines);
                                }}
                                className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                              />
                            </div>
                          ))
                        ) : (
                          ['a', 'b', 'c', 'd', 'e', 'f'].map((k, i) => (
                            <div key={k}>
                              <label className="text-[9px] font-mono opacity-40 uppercase">
                                {k === 'a' ? 'x0' : k === 'b' ? 'a' : k === 'c' ? 'y0' : k === 'd' ? 'b' : k === 'e' ? 'z0' : 'c'}
                              </label>
                              <input 
                                value={(lines[idx] as any)[k]} 
                                onChange={e => {
                                  const newLines = [...lines];
                                  newLines[idx] = { ...newLines[idx], [k]: e.target.value };
                                  setLines(newLines);
                                }}
                                className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                              />
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'circles' && (
                  <div className="grid grid-cols-3 gap-2">
                    {['x0', 'y0', 'r'].map(k => (
                      <div key={k}>
                        <label className="text-[9px] font-mono opacity-40 uppercase">{k}</label>
                        <input 
                          value={(circles[idx] as any)[k]} 
                          onChange={e => {
                            const newCircles = [...circles];
                            newCircles[idx] = { ...newCircles[idx], [k]: e.target.value };
                            setCircles(newCircles);
                          }}
                          className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'planes' && (
                  <div className="grid grid-cols-2 gap-2">
                    {['a', 'b', 'c', 'd'].map(k => (
                      <div key={k}>
                        <label className="text-[9px] font-mono opacity-40 uppercase">{k}</label>
                        <input 
                          value={(planes[idx] as any)[k]} 
                          onChange={e => {
                            const newPlanes = [...planes];
                            newPlanes[idx] = { ...newPlanes[idx], [k]: e.target.value };
                            setPlanes(newPlanes);
                          }}
                          className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'spheres' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {['x0', 'y0', 'z0', 'r'].map(k => (
                        <div key={k}>
                          <label className="text-[9px] font-mono opacity-40 uppercase">{k}</label>
                          <input 
                            value={(spheres[idx] as any)[k]} 
                            onChange={e => {
                              const newSpheres = [...spheres];
                              newSpheres[idx] = { ...newSpheres[idx], [k]: e.target.value };
                              setSpheres(newSpheres);
                            }}
                            className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="p-2 bg-blue-50/50 border border-blue-100 rounded">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] font-mono text-blue-800">
                          Volume: <span className="font-bold">V = 4/3 * π * R³</span>
                        </p>
                        <button 
                          onClick={async () => {
                            const rVal = await parseValue(spheres[idx].r);
                            const r = await fetch('/api/geometry/parse-volume', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ r: rVal })
                            });
                            const data = await r.json();
                            const newVols = [...sphereVolumes];
                            newVols[idx] = data.volume;
                            setSphereVolumes(newVols);
                          }}
                          className="text-[9px] font-mono bg-blue-100 px-2 py-0.5 rounded hover:bg-blue-200"
                        >
                          Tính nhanh
                        </button>
                      </div>
                      {sphereVolumes[idx] && (
                        <p className="text-[11px] font-mono text-blue-900 mt-1 font-bold break-all">
                          = {sphereVolumes[idx]}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'points' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {['x', 'y', 'z'].map(k => (
                        <div key={k} className={dimension === '2D' && k === 'z' ? 'hidden' : ''}>
                          <label className="text-[9px] font-mono opacity-40 uppercase">{k}</label>
                          <input 
                            value={(points[idx] as any)[k]} 
                            onChange={e => {
                              const newPoints = [...points];
                              newPoints[idx] = { ...newPoints[idx], [k]: e.target.value };
                              setPoints(newPoints);
                            }}
                            className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Section */}
        <div className="space-y-6">
          <div className="p-6 border border-[#141414] space-y-6">
            <div className="flex justify-between items-center bg-transparent">
              <h3 className="font-mono text-xs uppercase tracking-widest">Phân tích Hình Học</h3>
            </div>
            
            <div className="flex border border-[#141414]/15 p-1 rounded-sm gap-1 bg-gray-50/50">
              {[
                { id: 'compare', label: 'So sánh' },
                { id: 'projection', label: 'Hình chiếu' },
                { id: 'intersection', label: 'Giao tuyến' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setAnalysisType(opt.id as any); setResult(null); }}
                  className={cn(
                    "flex-1 py-1.5 px-1 text-center font-sans font-medium text-[8px] sm:text-[9.5px] uppercase tracking-wider transition-all rounded-sm border",
                    analysisType === opt.id 
                      ? "bg-[#141414] text-white border-transparent shadow-sm" 
                      : "text-gray-500 hover:text-black hover:bg-white border-transparent"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {analysisType === 'projection' && (
              <p className="text-[9.5px] text-[#A0522D] font-mono italic bg-amber-50/50 border border-amber-100/60 px-3 py-2 rounded-sm leading-relaxed">
                ℹ️ Vui lòng chọn 1 Điểm (A) và 1 Đường thẳng (L) hoặc 1 Mặt phẳng (P).
              </p>
            )}
            {analysisType === 'intersection' && (
              <p className="text-[9.5px] text-[#A0522D] font-mono italic bg-amber-50/50 border border-amber-100/60 px-3 py-2 rounded-sm leading-relaxed">
                ℹ️ Vui lòng chọn 2 Đường thẳng (L) hoặc 2 Mặt phẳng (P).
              </p>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase">Đối tượng 1</label>
                  <select 
                    value={`${comp1.type}${comp1.index}`}
                    onChange={e => setComp1({ type: e.target.value[0], index: parseInt(e.target.value[1]) })}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  >
                    {[0,1,2,3].map(i => <option key={i} value={`L${i}`}>L{i+1}</option>)}
                    {[0,1,2,3].map(i => <option key={i} value={`A${i}`}>A{i+1}</option>)}
                    {dimension === '2D' && [0,1,2,3].map(i => <option key={i} value={`C${i}`}>C{i+1}</option>)}
                    {dimension === '3D' && [0,1,2,3].map(i => <option key={i} value={`P${i}`}>P{i+1}</option>)}
                    {dimension === '3D' && [0,1,2,3].map(i => <option key={i} value={`S${i}`}>S{i+1}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono opacity-40 uppercase">Đối tượng 2</label>
                  <select 
                    value={`${comp2.type}${comp2.index}`}
                    onChange={e => setComp2({ type: e.target.value[0], index: parseInt(e.target.value[1]) })}
                    className="w-full p-2 border border-[#141414] font-mono text-xs focus:ring-0"
                  >
                    {[0,1,2,3].map(i => <option key={i} value={`L${i}`}>L{i+1}</option>)}
                    {[0,1,2,3].map(i => <option key={i} value={`A${i}`}>A{i+1}</option>)}
                    {dimension === '2D' && [0,1,2,3].map(i => <option key={i} value={`C${i}`}>C{i+1}</option>)}
                    {dimension === '3D' && [0,1,2,3].map(i => <option key={i} value={`P${i}`}>P{i+1}</option>)}
                    {dimension === '3D' && [0,1,2,3].map(i => <option key={i} value={`S${i}`}>S{i+1}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCompare}
                disabled={loading}
                className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-[#141414]/90 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Cpu className="w-4 h-4 animate-spin" /> : "Phân tích"}
              </button>
            </div>

            <div className="bg-[#141414] text-[#E4E3E0] p-6 min-h-[150px] flex flex-col">
              <div className="flex items-center gap-2 mb-4 opacity-40">
                <Info className="w-4 h-4" />
                <span className="text-[9px] uppercase tracking-widest">Kết quả</span>
              </div>
              {result ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center w-full space-y-4 overflow-hidden">
                  {typeof result === 'string' ? (
                    <p className="text-xl font-serif italic whitespace-pre-wrap break-words">{result}</p>
                  ) : result && result.type === 'distance' ? (
                    <div className="w-full text-left space-y-4 font-mono text-xs overflow-hidden">
                      <p className="text-sm font-sans italic opacity-85 leading-relaxed text-center whitespace-pre-wrap break-words">{result.message}</p>
                      
                      <div className="p-4 bg-white/5 border border-white/10 rounded space-y-2 text-center w-full max-w-full overflow-hidden">
                        <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold block">1) Kết quả đại số chuẩn (LaTeX)</span>
                        <div className="py-2 text-white w-full overflow-x-auto scrollbar-thin scrollbar-thumb-white/15 scrollbar-track-transparent">
                          <div className="inline-block min-w-full align-middle px-2">
                            <BlockMath math={result.exactLatex} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 border border-white/10 rounded space-y-2 w-full max-w-full overflow-hidden">
                        <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold block">2) Kết quả thập phân chính xác (25 chữ số)</span>
                        <p className="font-mono text-xs text-white tracking-wider select-all break-all font-semibold p-2 bg-black/40 rounded border border-black/20 whitespace-pre-wrap">{result.decimal25}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xl font-serif italic whitespace-pre-wrap break-words">{JSON.stringify(result)}</p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center opacity-20">
                  <p className="text-[10px] font-mono uppercase tracking-widest">Chưa có kết quả</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border border-[#141414]/10 space-y-2">
            <h4 className="font-mono text-[9px] uppercase tracking-widest opacity-50">Ghi chú</h4>
            <p className="text-[9px] font-mono opacity-40 leading-relaxed">
              - Đường thẳng (L): Tham số t.<br/>
              - Hình tròn/Cầu (C/S): Tâm và Bán kính.<br/>
              - Mặt phẳng (P): Ax + By + Cz + D = 0.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Mode 16: Axis Ox Ruler ---

interface Interval {
  start: number;
  end: number;
  startClosed: boolean;
  endClosed: boolean;
  label?: string;
  domain?: 'R' | 'Z' | 'N' | 'Q' | 'C' | 'I';
}

// --- VIETMATH PRO AST ENGINE ---
type ASTNode = { type: string; value?: number; name?: string; op?: string; left?: ASTNode; right?: ASTNode };

class ParseError extends Error {}

function parseVietMath(expr: string, treatEqualsAsIff: boolean = false): ASTNode {
  const normExpr = expr.replace(/\s+/g, '');
  const tokens: string[] = [];
  let i = 0;
  while (i < normExpr.length) {
    let handled = false;
    for (let op of ['<=>', '<=', '>=', '!=', '==', '=>', '&&', '||']) {
      if (normExpr.startsWith(op, i)) { tokens.push(op); i += op.length; handled = true; break; }
    }
    if (handled) continue;
    
    if (/[0-9.]/.test(normExpr[i])) {
      let numStr = '';
      while (i < normExpr.length && /[0-9.]/.test(normExpr[i])) { numStr += normExpr[i]; i++; }
      tokens.push(numStr); continue;
    }
    
    if (/[a-zA-Z]/.test(normExpr[i])) {
      let varStr = '';
      while (i < normExpr.length && /[a-zA-Z]/.test(normExpr[i])) { varStr += normExpr[i]; i++; }
      tokens.push(varStr); continue;
    }
    
    tokens.push(normExpr[i]); i++;
  }

  const normTokens = tokens.map(t => {
    switch(t) {
      case '∧': case '&': case '·': case '∩': return '&&';
      case '∨': case '|': case '∪': case 'U': return '||'; 
      case '¬': case '~': case '!': return 'NOT';
      case '⊕': case 'xor': return 'XOR';
      case '=>': case '→': return 'IMPLIES';
      case '<=>': case '↔': case '≡': case '⊙': return 'IFF';
      case '↑': return 'NAND';
      case '↓': return 'NOR';
      case '≤': return '<=';
      case '≥': return '>=';
      case '≠': return '!=';
      case '=': case '==': return treatEqualsAsIff ? 'IFF' : '==';
      case '∖': case '\\': return 'MINUS';
      case '∈': case '⊆': case '⊂': return 'SUBSET';
      default: return t;
    }
  });

  let pos = 0;
  function match(expected: string) {
    if (pos < normTokens.length && normTokens[pos] === expected) { pos++; return true; }
    return false;
  }
  
  function parseIff(): ASTNode {
     let node = parseImplies();
     while (match('IFF')) { node = { type: 'Bool', op: 'IFF', left: node, right: parseImplies() }; }
     return node;
  }
  function parseImplies(): ASTNode {
     let node = parseOr();
     while (match('IMPLIES')) { node = { type: 'Bool', op: 'IMPLIES', left: node, right: parseOr() }; }
     return node;
  }
  function parseOr(): ASTNode {
     let node = parseXor();
     while (match('||') || match('NOR') || match('MINUS')) {
       let op = normTokens[pos-1];
       node = { type: 'Bool', op: op, left: node, right: parseXor() }; 
     }
     return node;
  }
  function parseXor(): ASTNode {
     let node = parseAnd();
     while (match('XOR')) { node = { type: 'Bool', op: 'XOR', left: node, right: parseAnd() }; }
     return node;
  }
  function parseAnd(): ASTNode {
     let node = parseComp();
     while (match('&&') || match('NAND')) { 
        let op = normTokens[pos-1];
        node = { type: 'Bool', op: op, left: node, right: parseComp() }; 
     }
     return node;
  }
  function parseComp(): ASTNode {
     let node = parseAdd();
     if (match('<') || match('>') || match('<=') || match('>=') || match('==') || match('!=') || match('SUBSET')) {
       let op = normTokens[pos-1];
       node = { type: 'Comp', op: op, left: node, right: parseAdd() };
     }
     return node;
  }
  function parseAdd(): ASTNode {
     let node = parseMult();
     while (match('+') || match('-')) {
       let op = normTokens[pos-1];
       node = { type: 'Math', op: op, left: node, right: parseMult() };
     }
     return node;
  }
  function parseMult(): ASTNode {
     let node = parseUnary();
     while (match('*') || match('/') || match('^')) {
       let op = normTokens[pos-1];
       node = { type: 'Math', op: op, left: node, right: parseUnary() };
     }
     return node;
  }
  function parseUnary(): ASTNode {
     if (match('NOT')) { return { type: 'Bool', op: 'NOT', left: parseUnary() }; }
     if (match('-')) { return { type: 'Math', op: 'NEG', left: parseUnary() }; }
     return parsePrimary();
  }
  function parsePrimary(): ASTNode {
     if (match('(')) {
        let node = parseIff();
        if (!match(')')) throw new ParseError("Missing closing parenthesis");
        return node;
     }
     if (pos >= normTokens.length) throw new ParseError("Unexpected end of expression");
     let t = normTokens[pos++];
     if (/^[0-9.]+$/.test(t)) return { type: 'Num', value: parseFloat(t) };
     if (/^[a-zA-Z]+$/.test(t)) return { type: 'Var', name: t };
     throw new ParseError("Unexpected token: " + t);
  }

  let ast = parseIff();
  if (pos < normTokens.length) throw new ParseError("Extra tokens detected");
  return ast;
}

function evaluateAST(node: ASTNode, row: Record<string, boolean | number>): boolean | number {
  switch (node.type) {
    case 'Num': return node.value!;
    case 'Var': 
       if (!(node.name! in row)) throw new ParseError(`Variable \${node.name} not assigned`);
       return row[node.name!];
    case 'Math': {
       let l = evaluateAST(node.left!, row);
       if (node.op === 'NEG') {
           if (typeof l !== 'number') throw new ParseError("Math '-' requires a number");
           return -l;
       }
       let r = evaluateAST(node.right!, row);
       if (typeof l !== 'number' || typeof r !== 'number') throw new ParseError(`Math '\${node.op}' requires numbers`);
       if (node.op === '+') return l + r;
       if (node.op === '-') return l - r;
       if (node.op === '*') return l * r;
       if (node.op === '/') return l / r;
       if (node.op === '^') return Math.pow(l, r);
       break;
    }
    case 'Comp': {
       let l = evaluateAST(node.left!, row);
       let r = evaluateAST(node.right!, row);
       if (typeof l !== 'number' || typeof r !== 'number') throw new ParseError(`Comparison '\${node.op}' requires numbers`);
       if (node.op === '<') return l < r;
       if (node.op === '>') return l > r;
       if (node.op === '<=') return l <= r;
       if (node.op === '>=') return l >= r;
       if (node.op === '==') return l === r;
       if (node.op === '!=') return l !== r;
       break;
    }
    case 'Bool': {
       let l = evaluateAST(node.left!, row);
       if (node.op === 'NOT') {
           if (typeof l !== 'boolean') throw new ParseError("Logic NOT requires boolean");
           return !l;
       }
       let r = evaluateAST(node.right!, row);
       if (typeof l !== 'boolean' || typeof r !== 'boolean') throw new ParseError(`Logic '\${node.op}' requires booleans`);
       if (node.op === '&&') return l && r;
       if (node.op === '||') return l || r;
       if (node.op === 'XOR') return l !== r;
       if (node.op === 'NAND') return !(l && r);
       if (node.op === 'NOR') return !(l || r);
       if (node.op === 'IMPLIES') return (!l) || r;
       if (node.op === 'IFF') return l === r;
       if (node.op === 'MINUS') return l && !r;
       break;
    }
  }
  throw new ParseError("Unknown evaluation state");
}

function evaluateBooleanSafely(expr: string, row: Record<string, boolean | number>): { isError: boolean, value?: any, errorMsg?: string } {
  if (!expr.trim()) return { isError: true, errorMsg: 'Empty expression' };
  
  let lastError: any = null;
  
  // Pass 1: Try parse with "=" acting as IFF (Lowest Precedence - Logic Equivalence)
  // This satisfies strict logic math like (A U B) = A U B strictly without explicit parentheses
  try {
     const ast1 = parseVietMath(expr, true);
     const res1 = evaluateAST(ast1, row);
     return { isError: false, value: res1 };
  } catch(e: any) {
     lastError = e;
  }
  
  // Pass 2: Fallback to "=" acting as COMP (High Precedence - Math Equality)
  // This satisfies typical algebraic matching like x > 3 && x = 5
  try {
     const ast2 = parseVietMath(expr, false);
     const res2 = evaluateAST(ast2, row);
     return { isError: false, value: res2 };
  } catch(e: any) {
     return { isError: true, errorMsg: lastError.message + " / " + e.message };
  }
}

function extractBooleanVars(expr: string): string[] {
  const matches: string[] = expr.match(/[A-Za-z]/g) || [];
  const standardVars = matches.filter(v => !['x', 'y', 'v'].includes(v.toLowerCase()));
  const uppercaseVars: string[] = expr.match(/[A-Z]/g) || [];
  return Array.from(new Set(uppercaseVars.length > 0 ? uppercaseVars : matches)).sort();
}

function Mode16() {
  const [sets, setSets] = useState<string[]>(['[2, 7)', '(4, 10]', '', '', '']);
  type OperationType = 'intersection' | 'union' | 'difference' | 'complement' | 'subset' | 'custom';
  const [operation, setOperation] = useState<OperationType>('intersection');
  const [diffTarget, setDiffTarget] = useState<number>(0);
  const [diffSubtrahend, setDiffSubtrahend] = useState<number>(1);
  const [subsetTarget, setSubsetTarget] = useState<number>(0);
  const [subsetContainer, setSubsetContainer] = useState<number>(1);
  const [complementTarget, setComplementTarget] = useState<number>(0);
  const [customSetExpr, setCustomSetExpr] = useState<string>('(A ∪ B) \\ C');
  const [selectedSetLabel, setSelectedSetLabel] = useState<string | null>(null);
  
  // BOOLEAN EXPANSION 2026 STATES
  const [compactViewport, setCompactViewport] = useState(true);
  const [showBooleanPanel, setShowBooleanPanel] = useState(true);
  const [showTruthTable, setShowTruthTable] = useState(true);
  const [boolExpr, setBoolExpr] = useState('');
  const [xTestValue, setXTestValue] = useState('0');
  
  // Viewport State
  const [viewRange, setViewRange] = useState<{ min: number; max: number }>({ min: -10, max: 10 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastX, setLastX] = useState(0);

  const PHYSICAL_GUARD = { min: -500, max: 500 };

  const parseSet = (s: string): Interval | null => {
    const trimmed = s.trim().replace(/\s/g, '');
    
    // Support {a} for a discrete point
    const discretePointMatch = trimmed.match(/^\{([-+]?\d*\.?\d+)\}$/);
    if (discretePointMatch) {
      const val = parseFloat(discretePointMatch[1]);
      return { start: val, end: val, startClosed: true, endClosed: true };
    }

    const pattern = /^([\[\(])([-+]?(?:oo|∞|\d*\.?\d+)),([-+]?(?:oo|∞|\d*\.?\d+))([\]\)])$/;
    const match = trimmed.match(pattern);
    if (!match) return null;

    const [_, startBracket, startVal, endVal, endBracket] = match;
    const start = (startVal.includes('oo') || startVal.includes('∞')) ? -Infinity : parseFloat(startVal);
    const end = (endVal.includes('oo') || endVal.includes('∞')) ? Infinity : parseFloat(endVal);

    if (start > end) return null;

    return {
      start,
      end,
      startClosed: startBracket === '[',
      endClosed: endBracket === ']',
    };
  };

  const parsedSets = useMemo(() => {
    return sets.map((s, i) => {
      const p = parseSet(s);
      if (p) p.label = String.fromCharCode(65 + i);
      return p;
    }).filter((s): s is Interval => s !== null);
  }, [sets]);

  const intersect = (a: Interval, b: Interval): Interval | null => {
    const start = Math.max(a.start, b.start);
    const end = Math.min(a.end, b.end);

    if (start > end) return null;
    if (start === end) {
      const aStartOk = start === a.start ? a.startClosed : true;
      const bStartOk = start === b.start ? b.startClosed : true;
      const aEndOk = end === a.end ? a.endClosed : true;
      const bEndOk = end === b.end ? b.endClosed : true;
      if (aStartOk && bStartOk && aEndOk && bEndOk) {
        return { start, end, startClosed: true, endClosed: true };
      }
      return null;
    }

    let startClosed = true;
    if (start === a.start && !a.startClosed) startClosed = false;
    if (start === b.start && !b.startClosed) startClosed = false;

    let endClosed = true;
    if (end === a.end && !a.endClosed) endClosed = false;
    if (end === b.end && !b.endClosed) endClosed = false;

    return { start, end, startClosed, endClosed };
  };

  const isSubset = (a: Interval, b: Interval): boolean => {
    // Check if A is a subset of B
    if (a.start < b.start) return false;
    if (a.start === b.start) {
      if (a.startClosed && !b.startClosed) return false;
    }
    if (a.end > b.end) return false;
    if (a.end === b.end) {
      if (a.endClosed && !b.endClosed) return false;
    }
    return true;
  };

  const union = (intervals: Interval[]): Interval[] => {
    if (intervals.length === 0) return [];
    const sorted = [...intervals].sort((a, b) => a.start - b.start || (a.startClosed ? -1 : 1));
    const result: Interval[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const last = result[result.length - 1];
      const curr = sorted[i];

      if (curr.start < last.end || (curr.start === last.end && (last.endClosed || curr.startClosed))) {
        if (curr.end > last.end || (curr.end === last.end && curr.endClosed)) {
          last.end = curr.end;
          last.endClosed = curr.endClosed;
        }
      } else {
        result.push(curr);
      }
    }
    return result;
  };

  const difference = (a: Interval, b: Interval): Interval[] => {
    // A \ B
    const inter = intersect(a, b);
    if (!inter) return [a];

    const result: Interval[] = [];

    // Left part
    if (a.start < inter.start) {
      result.push({
        start: a.start,
        end: inter.start,
        startClosed: a.startClosed,
        endClosed: !inter.startClosed
      });
    }

    // Right part
    if (a.end > inter.end) {
      result.push({
        start: inter.end,
        end: a.end,
        startClosed: !inter.endClosed,
        endClosed: a.endClosed
      });
    }

    return result.filter(r => r.start < r.end || (r.start === r.end && r.startClosed && r.endClosed));
  };

  const intersectionArrays = (arrA: Interval[], arrB: Interval[]): Interval[] => {
    const result: Interval[] = [];
    for (const a of arrA) {
      for (const b of arrB) {
        const inter = intersect(a, b);
        if (inter) result.push(inter);
      }
    }
    return union(result);
  };

  const differenceArrays = (arrA: Interval[], arrB: Interval[]): Interval[] => {
    let result = [...arrA];
    for (const b of arrB) {
      let nextResult: Interval[] = [];
      for (const a of result) {
        nextResult.push(...difference(a, b));
      }
      result = union(nextResult);
    }
    return result;
  };

  const evaluateSetAST = (node: ASTNode, setMap: Record<string, Interval[]>): Interval[] | boolean => {
    if (node.type === 'Var') {
        const val = setMap[node.name?.toUpperCase() || ''];
        if (!val) throw new Error(`Set ${node.name} not found`);
        return val;
    }
    if (node.type === 'Comp' && node.op === 'SUBSET') {
        const left = evaluateSetAST(node.left!, setMap) as Interval[];
        const right = evaluateSetAST(node.right!, setMap) as Interval[];
        if (typeof left === 'boolean' || typeof right === 'boolean') throw new Error("Invalid subset comparison");
        
        if (right.length === 1 && right[0].domain) {
            const domain = right[0].domain;
            for (const inter of left) {
                if (inter.start > inter.end) continue;
                if (inter.start !== inter.end) {
                    if (domain === 'Z' || domain === 'N' || domain === 'I') return false;
                } else {
                    const val = inter.start;
                    if (domain === 'Z' && !Number.isInteger(val)) return false;
                    if (domain === 'N' && (!Number.isInteger(val) || val < 0)) return false;
                }
            }
            return true;
        }

        const diff = differenceArrays(left, right);
        return diff.length === 0;
    }
    if (node.type === 'Comp' && node.op === '==') {
        const left = evaluateSetAST(node.left!, setMap) as Interval[];
        const right = evaluateSetAST(node.right!, setMap) as Interval[];
        if (typeof left === 'boolean' || typeof right === 'boolean') throw new Error("Invalid equality comparison");
        const diff1 = differenceArrays(left, right);
        const diff2 = differenceArrays(right, left);
        return diff1.length === 0 && diff2.length === 0;
    }
    if (node.type === 'Bool') {
        const left = evaluateSetAST(node.left!, setMap) as Interval[];
        const right = evaluateSetAST(node.right!, setMap) as Interval[];
        if (node.op === '&&') return intersectionArrays(left, right);
        if (node.op === '||') return union([...left, ...right]);
        if (node.op === 'MINUS') return differenceArrays(left, right);
        if (node.op === 'IFF') {
            const diff1 = differenceArrays(left, right);
            const diff2 = differenceArrays(right, left);
            return diff1.length === 0 && diff2.length === 0;
        }
    }
    if (node.type === 'Bool' && node.op === 'NOT') {
        const right = evaluateSetAST(node.right!, setMap) as Interval[];
        return differenceArrays([{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false }], right);
    }
    throw new Error('Invalid or unsupported set expression');
  };

  const resultIntervals = useMemo((): Interval[] | boolean => {
    if (parsedSets.length === 0) return [];
    if (operation === 'intersection') {
      let res: Interval | null = parsedSets[0];
      for (let i = 1; i < parsedSets.length; i++) {
        if (!res) break;
        res = intersect(res, parsedSets[i]);
      }
      return res ? [res] : [];
    } else if (operation === 'union') {
      return union(parsedSets);
    } else if (operation === 'difference') {
      const a = parsedSets[diffTarget];
      const b = parsedSets[diffSubtrahend];
      if (!a || !b) return [];
      return difference(a, b);
    } else if (operation === 'complement') {
      const a = parsedSets[complementTarget];
      if (!a) return [];
      return difference({ start: -Infinity, end: Infinity, startClosed: false, endClosed: false }, a);
    } else if (operation === 'subset') {
      const a = parsedSets[subsetTarget];
      const b = parsedSets[subsetContainer];
      if (!a || !b) return [];
      // Visualize the intersection for the subset check
      const res = intersect(a, b);
      return res ? [res] : [];
    } else if (operation === 'custom') {
      try {
        if (!customSetExpr.trim()) return [];
        let modifiedExpr = customSetExpr;
        const setMap: Record<string, Interval[]> = {};
        parsedSets.forEach(s => setMap[s.label!] = [s]);

        // Find inline sets
        const inlineSetRegex = /([\[\(]\s*[-+]?(?:oo|∞|\d*\.?\d+)\s*,\s*[-+]?(?:oo|∞|\d*\.?\d+)\s*[\]\)]|\{\s*[-+]?\d*\.?\d+\s*\}|∅|empty|ℝ|ℤ|ℕ|ℚ|ℂ|I|R|Z|N|Q|C|<mi[^>]*>.*?<\/mi>)/gi;
        let inlineIdx = 0;
        modifiedExpr = modifiedExpr.replace(inlineSetRegex, (match) => {
           let parsedArray: Interval[] = [];
           const upperMatch = match.toUpperCase();
           const isMathR = /<mi[^>]*>R<\/mi>/i.test(match);
           const isMathZ = /<mi[^>]*>Z<\/mi>/i.test(match);
           const isMathN = /<mi[^>]*>N<\/mi>/i.test(match);
           const isMathQ = /<mi[^>]*>Q<\/mi>/i.test(match);
           const isMathC = /<mi[^>]*>C<\/mi>/i.test(match);

           if (match === '∅' || upperMatch === 'EMPTY') {
               parsedArray = [];
           } else if (match === 'ℝ' || upperMatch === 'R' || isMathR) {
               parsedArray = [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false, domain: 'R' }];
           } else if (match === 'ℤ' || upperMatch === 'Z' || isMathZ) {
               parsedArray = [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false, domain: 'Z' }];
           } else if (match === 'ℕ' || upperMatch === 'N' || isMathN) {
               parsedArray = [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false, domain: 'N' }];
           } else if (match === 'ℚ' || upperMatch === 'Q' || isMathQ) {
               parsedArray = [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false, domain: 'Q' }];
           } else if (match === 'ℂ' || upperMatch === 'C' || isMathC) {
               parsedArray = [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false, domain: 'C' }];
           } else if (upperMatch === 'I') {
               parsedArray = [{ start: -Infinity, end: Infinity, startClosed: false, endClosed: false, domain: 'I' }];
           } else {
               const parsed = parseSet(match);
               if (parsed) {
                   parsedArray = [parsed];
               } else {
                   return match; // Failed to parse
               }
           }
           
           const varName = `INLINESET` + String.fromCharCode(65 + inlineIdx++);
           setMap[varName] = parsedArray;
           return varName;
        });

        const ast = parseVietMath(modifiedExpr, true);
        return evaluateSetAST(ast, setMap);
      } catch (e) {
        return [];
      }
    }
    return [];
  }, [parsedSets, operation, diffTarget, diffSubtrahend, complementTarget, customSetExpr]);

  const allPoints = useMemo(() => {
    const pts: number[] = [];
    const resArr = Array.isArray(resultIntervals) ? resultIntervals : [];
    [...parsedSets, ...resArr].forEach(s => {
      if (isFinite(s.start)) pts.push(s.start);
      if (isFinite(s.end)) pts.push(s.end);
    });
    return pts.length > 0 ? pts : [-10, 10];
  }, [parsedSets, resultIntervals]);

  // Auto-zoom on initialization or set change
  useEffect(() => {
    const minP = Math.min(...allPoints);
    const maxP = Math.max(...allPoints);
    const range = maxP - minP || 20;
    const padding = range * 0.3;
    
    let newMin = Math.max(PHYSICAL_GUARD.min, minP - padding);
    let newMax = Math.min(PHYSICAL_GUARD.max, maxP + padding);
    
    // Ensure minimum view width
    if (newMax - newMin < 2) {
      newMin -= 1;
      newMax += 1;
    }

    if (!isDragging) {
      setViewRange({ min: newMin, max: newMax });
    }
  }, [parsedSets.length, operation]); // Only re-zoom when sets are added/removed or operation changes

  // Truth Table Generator
  const truthTableData = useMemo(() => {
    if (!boolExpr.trim()) return null;
    const vars = extractBooleanVars(boolExpr);
    if (vars.length === 0 || vars.length > 6) return null; // limit to 64 rows
    
    // Check syntax safely before generating rows
    // Since we have a dual-pass evaluation, we just run a mock check with the dual evaluator.
    const dummyRow: Record<string, boolean | number> = {};
    vars.forEach(v => dummyRow[v] = true);
    if(boolExpr.includes('x')) dummyRow['x'] = 1;
    
    if (evaluateBooleanSafely(boolExpr, dummyRow).isError) {
        return null; // Don't show truth table if invalid AST
    }

    const rows = [];
    const numRows = Math.pow(2, vars.length);
    for (let i = 0; i < numRows; i++) {
        const row: Record<string, boolean> = {};
        for(let v = 0; v < vars.length; v++) {
            row[vars[v]] = Boolean((i >> (vars.length - 1 - v)) & 1);
        }
        
        const evalRes = evaluateBooleanSafely(boolExpr, row);
        
        rows.push({ 
           ...row, 
           RESULT: evalRes.isError ? false : Boolean(evalRes.value),
           IS_ERROR: evalRes.isError,
           IS_NUM: typeof evalRes.value === 'number'
        });
    }
    return { vars, rows };
  }, [boolExpr]);

  const scale = (x: number) => {
    const clampedX = Math.max(viewRange.min, Math.min(viewRange.max, x));
    return ((clampedX - viewRange.min) / (viewRange.max - viewRange.min)) * 1000;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastX(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - lastX;
    const range = viewRange.max - viewRange.min;
    const moveAmount = (dx / 1000) * range;
    
    let newMin = viewRange.min - moveAmount;
    let newMax = viewRange.max - moveAmount;

    // Boundary Bounce / Snap back
    if (newMin < PHYSICAL_GUARD.min) {
      newMin = PHYSICAL_GUARD.min;
      newMax = newMin + range;
    }
    if (newMax > PHYSICAL_GUARD.max) {
      newMax = PHYSICAL_GUARD.max;
      newMin = newMax - range;
    }

    setViewRange({ min: newMin, max: newMax });
    setLastX(e.clientX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const range = viewRange.max - viewRange.min;
    const newRange = range * zoomFactor;
    
    // Limit zoom
    if (newRange < 0.1 || newRange > 1000) return;

    const mid = (viewRange.min + viewRange.max) / 2;
    let newMin = mid - newRange / 2;
    let newMax = mid + newRange / 2;

    // Clamp to guard
    if (newMin < PHYSICAL_GUARD.min) newMin = PHYSICAL_GUARD.min;
    if (newMax > PHYSICAL_GUARD.max) newMax = PHYSICAL_GUARD.max;

    setViewRange({ min: newMin, max: newMax });
  };

  const zoomIn = () => {
    const range = viewRange.max - viewRange.min;
    const newRange = range * 0.8;
    if (newRange < 0.1) return;
    const mid = (viewRange.min + viewRange.max) / 2;
    setViewRange({ min: mid - newRange / 2, max: mid + newRange / 2 });
  };

  const zoomOut = () => {
    const range = viewRange.max - viewRange.min;
    const newRange = range * 1.2;
    if (newRange > 1000) return;
    const mid = (viewRange.min + viewRange.max) / 2;
    let newMin = mid - newRange / 2;
    let newMax = mid + newRange / 2;
    if (newMin < PHYSICAL_GUARD.min) newMin = PHYSICAL_GUARD.min;
    if (newMax > PHYSICAL_GUARD.max) newMax = PHYSICAL_GUARD.max;
    setViewRange({ min: newMin, max: newMax });
  };

  const resetView = () => {
    const minP = Math.min(...allPoints);
    const maxP = Math.max(...allPoints);
    const range = maxP - minP || 20;
    const padding = range * 0.3;
    setViewRange({ 
      min: Math.max(PHYSICAL_GUARD.min, minP - padding), 
      max: Math.min(PHYSICAL_GUARD.max, maxP + padding) 
    });
  };
const downloadMode16Guide = async () => {
  try {
    const response = await fetch('./HDSD_Mode16.md', {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Cannot fetch guide');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'HDSD_Mode16_VietMathPro.md';
    document.body.appendChild(a);
    a.click();
    a.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('Không thể tải file hướng dẫn.');
  }
};
  return (
    <div className="flex flex-col h-full bg-[#E4E3E0] text-[#141414] overflow-hidden select-none">
      <div className="p-8 border-b border-[#141414] flex justify-between items-center bg-white shadow-sm z-10 relative">
        <div>
          <h2 className="text-3xl font-serif italic tracking-tight">Mode 16: Axis Ox Ruler</h2>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-50 mt-1">Set Operations & Boolean Logic 2026</p>
        </div>
        <div className="flex gap-4 items-center">
          
          <button
            onClick={downloadMode16Guide}
            className="flex items-center gap-2 border border-[#141414] bg-orange-100 hover:bg-orange-200 text-orange-900 transition-colors px-3 py-1.5 rounded-sm shadow-sm"
            title="Tải về Hướng dẫn sử dụng Mode 16  ( tải về nhớ đổi phần mở rộng file md thành html rồi mở bằng Chrome nhé)"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest hidden md:inline">
              HDSD Mode 16
            </span>
          </button>

          {/* Pro Settings 2026 Toggle */}
          <div className="flex items-center gap-2 border border-[#141414] bg-[#fdfdfd] p-1 rounded-sm">
            <button 
              onClick={() => setCompactViewport(!compactViewport)}
              className={`text-[9px] font-mono uppercase px-2 py-1 transition-colors ${compactViewport ? 'bg-[#141414] text-white' : 'hover:bg-gray-200'}`}
              title="Compact Viewport (Shrink viewport to save space)"
            >
              Compact
            </button>
            <button 
              onClick={() => setShowBooleanPanel(!showBooleanPanel)}
              className={`text-[9px] font-mono uppercase px-2 py-1 transition-colors ${showBooleanPanel ? 'bg-[#141414] text-white' : 'hover:bg-gray-200'}`}
              title="Boolean Expansion Layer"
            >
              Boolean Panel
            </button>
          </div>

          <div className="flex bg-white border border-[#141414] rounded-sm overflow-hidden ml-4">
            <button onClick={zoomIn} className="p-2 hover:bg-orange-50 border-r border-[#141414]" title="Zoom In">
              <Plus className="w-4 h-4" />
            </button>
            <button onClick={zoomOut} className="p-2 hover:bg-orange-50 border-r border-[#141414]" title="Zoom Out">
              <Minus className="w-4 h-4" />
            </button>
            <button onClick={resetView} className="p-2 hover:bg-orange-50" title="Reset View">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <select 
            value={operation}
            onChange={(e) => setOperation(e.target.value as any)}
            className="bg-transparent border-b border-[#141414] font-mono text-xs outline-none p-1"
          >
            <option value="intersection">Tất cả giao nhau (A ∩ B ∩ C...)</option>
            <option value="union">Tất cả hợp nhau (A ∪ B ∪ C...)</option>
            <option value="difference">Hiệu (A \ B)</option>
            <option value="complement">Phần bù (∁ℝ(A))</option>
            <option value="subset">Subset Check (A ⊆ B ?)</option>
            <option value="custom">Công thức tùy chỉnh (e.g. A ∪ B \ C)</option>
          </select>
        </div>
      </div>

      <div className={`flex-1 flex flex-col md:flex-row overflow-hidden`}>
        {/* Legacy Inputs */}
        <div className={`border-r border-[#141414] p-8 space-y-6 overflow-y-auto custom-scrollbar shrink-0 transition-all duration-300
          ${compactViewport && showBooleanPanel ? 'md:w-[25%] bg-[#fdfdfd]' : 'md:w-[33.33%] bg-white'}`}>
          <div className="space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40">Declare Sets (A-E)</h3>
            <div className="space-y-2">
              {sets.map((s, i) => (
                <div key={i} className="flex items-center gap-2 w-full">
                  <div className="w-7 h-7 flex items-center justify-center bg-[#141414] text-white font-serif italic text-sm rounded-md shrink-0">
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className="font-mono text-xs opacity-50 shrink-0">=</span>
                  <input 
                    value={s}
                    onChange={(e) => {
                      const newSets = [...sets];
                      newSets[i] = e.target.value;
                      setSets(newSets);
                    }}
                    placeholder="e.g. [2, 7)"
                    className="flex-1 min-w-0 bg-white border border-[#141414] p-1.5 px-2 font-mono text-xs focus:ring-1 focus:ring-orange-400 outline-none rounded-md transition-all shadow-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {operation === 'difference' && (
            <div className="pt-6 border-t border-[#141414]/10 space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40">Difference Config</h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <select value={diffTarget} onChange={e => setDiffTarget(Number(e.target.value))} className="bg-transparent border-b border-[#141414]">
                  {parsedSets.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
                <span>\</span>
                <select value={diffSubtrahend} onChange={e => setDiffSubtrahend(Number(e.target.value))} className="bg-transparent border-b border-[#141414]">
                  {parsedSets.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {operation === 'complement' && (
            <div className="pt-6 border-t border-[#141414]/10 space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40">Complement Config</h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span>∁ℝ</span>
                <select value={complementTarget} onChange={e => setComplementTarget(Number(e.target.value))} className="bg-transparent border-b border-[#141414]">
                  {parsedSets.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {operation === 'subset' && (
            <div className="pt-6 border-t border-[#141414]/10 space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40">Subset Check Config</h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <select value={subsetTarget} onChange={e => setSubsetTarget(Number(e.target.value))} className="bg-transparent border-b border-[#141414]">
                  {parsedSets.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
                <span>⊆</span>
                <select value={subsetContainer} onChange={e => setSubsetContainer(Number(e.target.value))} className="bg-transparent border-b border-[#141414]">
                  {parsedSets.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}

          {operation === 'custom' && (
            <div className="pt-6 border-t border-[#141414]/10 space-y-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40">Custom Formula Config</h3>
              <input 
                type="text" 
                value={customSetExpr}
                onChange={e => setCustomSetExpr(e.target.value)}
                className="w-full bg-white border border-[#141414] p-1.5 px-2 font-mono text-xs focus:ring-1 focus:ring-orange-400 outline-none rounded-md transition-all shadow-sm"
                placeholder="(A ∪ B) \ C"
              />
            </div>
          )}

          <div className="pt-6 border-t border-[#141414]/10">
            <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 mb-2">Result Notation</h3>
            <div className="p-4 bg-white border border-[#141414] font-mono text-sm text-red-600">
              {operation === 'subset' ? (
                (() => {
                  const a = parsedSets[subsetTarget];
                  const b = parsedSets[subsetContainer];
                  if (!a || !b) return 'N/A';
                  const res = isSubset(a, b);
                  return `${a.label} ⊆ ${b.label}: ${res ? 'TRUE (ĐÚNG)' : 'FALSE (SAI)'}`;
                })()
              ) : typeof resultIntervals === 'boolean' ? (
                <div className="flex flex-col gap-2">
                  <div className="break-all opacity-80">
                    {customSetExpr
                      .replace(/\{\s*([-+]?\d*\.?\d+)\s*\}\s*∈/g, '$1 ∈')
                      .replace(/<mi\s+mathvariant="double-struck">R<\/mi>/gi, 'ℝ')
                      .replace(/<mi\s+mathvariant="double-struck">Z<\/mi>/gi, 'ℤ')
                      .replace(/<mi\s+mathvariant="double-struck">N<\/mi>/gi, 'ℕ')
                      .replace(/<mi\s+mathvariant="double-struck">Q<\/mi>/gi, 'ℚ')
                      .replace(/<mi\s+mathvariant="double-struck">C<\/mi>/gi, 'ℂ')
                      .replace(/(\(-\s*(?:oo|∞)\s*,\s*\+?\s*(?:oo|∞)\s*\))/gi, 'ℝ (Real Set)')}
                  </div>
                  {parsedSets.length > 0 && (
                    <div className="break-all">
                      = <strong className="text-[#141414] ml-1">
                          {resultIntervals ? 'TRUE (ĐÚNG) - Mệnh đề tập hợp chính xác' : 'FALSE (SAI) - Mệnh đề tập hợp sai'}
                      </strong>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="break-all opacity-80">
                    {parsedSets.length > 0 && operation !== 'custom' && parsedSets.map(s => s.label).join(
                      operation === 'intersection' ? ' ∩ ' : 
                      operation === 'union' ? ' ∪ ' : 
                      operation === 'difference' ? ' \\ ' : ''
                    )}
                    {operation === 'custom' && customSetExpr
                      .replace(/\{\s*([-+]?\d*\.?\d+)\s*\}\s*∈/g, '$1 ∈')
                      .replace(/<mi\s+mathvariant="double-struck">R<\/mi>/gi, 'ℝ')
                      .replace(/<mi\s+mathvariant="double-struck">Z<\/mi>/gi, 'ℤ')
                      .replace(/<mi\s+mathvariant="double-struck">N<\/mi>/gi, 'ℕ')
                      .replace(/<mi\s+mathvariant="double-struck">Q<\/mi>/gi, 'ℚ')
                      .replace(/<mi\s+mathvariant="double-struck">C<\/mi>/gi, 'ℂ')
                      .replace(/(\(-\s*(?:oo|∞)\s*,\s*\+?\s*(?:oo|∞)\s*\))/gi, 'ℝ (Real Set)')}
                    {operation === 'difference' && parsedSets.length > 2 && ' (Chỉ tính 2 tập target)'}
                    {operation === 'complement' && `∁ℝ(${parsedSets[complementTarget]?.label || '?'})`}
                  </div>
                  {parsedSets.length > 0 && (
                    <div className="break-all">
                      = <strong className="text-[#141414] ml-1">
                        {(resultIntervals as Interval[]).length > 0 ? (resultIntervals as Interval[]).map(r => {
                          const s = r.startClosed ? '[' : '(';
                          const e = r.endClosed ? ']' : ')';
                          const sv = r.start === -Infinity ? '-∞' : r.start;
                          const ev = r.end === Infinity ? '+∞' : r.end;
                          return `${s}${sv}, ${ev}${e}`;
                        }).join(' ∪ ') : '∅ (Empty Set)'}
                      </strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div 
          className={`bg-white overflow-hidden flex flex-col cursor-grab active:cursor-grabbing transition-all duration-300 relative
          ${compactViewport && showBooleanPanel ? 'md:w-[45%]' : 'flex-1'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          {/* Optional Overlay to show shrink is active */}
          {compactViewport && showBooleanPanel && (
            <div className="absolute top-2 left-2 z-10 bg-orange-100 text-orange-800 text-[9px] font-mono px-2 py-1 border border-orange-200 rounded opacity-60">
              [Viewport Shrinking 30% - Legacy Output Protected]
            </div>
          )}
          
          <div className="flex-1 relative p-8">
            <svg viewBox="0 0 1000 600" className="w-full h-full drop-shadow-sm">
              {/* Ox Axis */}
              <line x1="0" y1="500" x2="980" y2="500" stroke="#141414" strokeWidth="2" />
              <polygon points="980,495 1000,500 980,505" fill="#141414" />
              <text x="980" y="530" className="font-mono text-2xl font-bold">Ox</text>

              {/* Ticks - Progressive Rendering */}
              {(() => {
                const ticks = [];
                const range = viewRange.max - viewRange.min;
                // Calculate appropriate step based on range
                let step = 1;
                if (range > 200) step = 50;
                else if (range > 100) step = 20;
                else if (range > 50) step = 10;
                else if (range > 20) step = 5;
                else if (range > 10) step = 2;
                else if (range > 5) step = 1;
                else if (range > 2) step = 0.5;
                else if (range > 1) step = 0.2;
                else step = 0.1;

                const startTick = Math.ceil(viewRange.min / step) * step;
                for (let x = startTick; x <= viewRange.max; x += step) {
                  const xPos = scale(x);
                  ticks.push(
                    <g key={x}>
                      <line x1={xPos} y1="490" x2={xPos} y2="510" stroke="#141414" strokeWidth="1.5" />
                      <text x={xPos} y="540" textAnchor="middle" className="font-mono text-2xl font-bold fill-[#141414]">{Number(x.toFixed(2))}</text>
                    </g>
                  );
                }
                return ticks;
              })()}

              {/* Sets */}
              {parsedSets.map((s, i) => {
                const y = 400 - (i * 60);
                const isSelected = selectedSetLabel === s.label;
                const color = isSelected ? '#ea580c' : `hsl(${i * 60}, 70%, 40%)`;
                const strokeWidth = isSelected ? "4" : "1.5";
                
                // Graphical Clipping at Physical Guard
                const drawStart = Math.max(s.start, PHYSICAL_GUARD.min);
                const drawEnd = Math.min(s.end, PHYSICAL_GUARD.max);
                
                const x1 = scale(drawStart);
                const x2 = scale(drawEnd);

                const isStartOffLeft = s.start < viewRange.min;
                const isEndOffRight = s.end > viewRange.max;
                const isStartInf = s.start === -Infinity;
                const isEndInf = s.end === Infinity;

                return (
                  <g 
                    key={i} 
                    className="cursor-pointer transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSetLabel(isSelected ? null : s.label || null);
                    }}
                  >
                    <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={strokeWidth} />
                    <text x={Math.max(10, x1 - 25)} y={y + 5} className={`font-serif italic ${isSelected ? 'text-lg font-bold' : 'text-sm'}`} fill={color}>{s.label}</text>
                    
                    {/* Start Marker / Arrow */}
                    {(isStartOffLeft || isStartInf) ? (
                      <polygon points={`${x1},${y-6} ${x1-12},${y} ${x1},${y+6}`} fill={color} />
                    ) : isFinite(s.start) && (
                      <circle 
                        cx={x1} cy={y} r={isSelected ? "6" : "4"} 
                        fill={s.startClosed ? color : 'white'} 
                        stroke={color} strokeWidth={isSelected ? "2" : "1"} 
                      />
                    )}

                    {/* End Marker / Arrow */}
                    {(isEndOffRight || isEndInf) ? (
                      <polygon points={`${x2},${y-6} ${x2+12},${y} ${x2},${y+6}`} fill={color} />
                    ) : isFinite(s.end) && (
                      <circle 
                        cx={x2} cy={y} r={isSelected ? "6" : "4"} 
                        fill={s.endClosed ? color : 'white'} 
                        stroke={color} strokeWidth={isSelected ? "2" : "1"} 
                      />
                    )}
                  </g>
                );
              })}

              {/* Result */}
              {(Array.isArray(resultIntervals) ? resultIntervals : []).map((r, i) => {
                const y = 80;
                const isSelected = selectedSetLabel === 'Result';
                const color = isSelected ? '#991b1b' : '#ef4444';
                const strokeWidth = isSelected ? "6" : "3";
                
                const drawStart = Math.max(r.start, PHYSICAL_GUARD.min);
                const drawEnd = Math.min(r.end, PHYSICAL_GUARD.max);
                
                const x1 = scale(drawStart);
                const x2 = scale(drawEnd);

                const isStartOffLeft = r.start < viewRange.min;
                const isEndOffRight = r.end > viewRange.max;
                const isStartInf = r.start === -Infinity;
                const isEndInf = r.end === Infinity;

                return (
                  <g 
                    key={i}
                    className="cursor-pointer transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSetLabel(isSelected ? null : 'Result');
                    }}
                  >
                    <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth={strokeWidth} />
                    {i === 0 && <text x="20" y={y - 20} className={`font-mono uppercase tracking-widest ${isSelected ? 'text-xs font-bold' : 'text-[10px]'}`} fill={color}>Result: {operation}</text>}
                    
                    {/* Start Marker / Arrow */}
                    {(isStartOffLeft || isStartInf) ? (
                      <polygon points={`${x1},${y-8} ${x1-14},${y} ${x1},${y+8}`} fill={color} />
                    ) : isFinite(r.start) && (
                      <circle 
                        cx={x1} cy={y} r={isSelected ? "8" : "6"} 
                        fill={r.startClosed ? color : 'white'} 
                        stroke={color} strokeWidth={isSelected ? "3" : "2"} 
                      />
                    )}

                    {/* End Marker / Arrow */}
                    {(isEndOffRight || isEndInf) ? (
                      <polygon points={`${x2},${y-8} ${x2+14},${y} ${x2},${y+8}`} fill={color} />
                    ) : isFinite(r.end) && (
                      <circle 
                        cx={x2} cy={y} r={isSelected ? "8" : "6"} 
                        fill={r.endClosed ? color : 'white'} 
                        stroke={color} strokeWidth={isSelected ? "3" : "2"} 
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          
          <div className="mt-8 p-6 bg-[#141414] text-[#E4E3E0] rounded-sm m-8">
            <div className="flex items-center gap-3 mb-4">
              <Info className="w-4 h-4 text-orange-400" />
              <h4 className="font-mono text-[10px] uppercase tracking-widest">Navigation & Viewport</h4>
            </div>
            <p className="text-xs font-serif italic opacity-80 leading-relaxed">
              Drag to pan the axis. Scroll to zoom. The axis is guarded between -500 and 500. 
              Arrows at the edge of intervals indicate that the endpoint is currently off-screen.
            </p>
          </div>
        </div>

        {/* BOOLEAN EXPANSION LAYER 2026 */}
        {showBooleanPanel && (
          <div className={`border-l border-[#141414] bg-[#f4f4f4] overflow-y-auto custom-scrollbar flex flex-col shrink-0 transition-all duration-300
            ${compactViewport ? 'md:w-[30%]' : 'hidden'}
          `}>
            <div className="p-6 border-b border-[#141414]">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-orange-600 font-bold mb-1">Boolean Full Pack 2026</h3>
              <p className="text-[10px] font-mono opacity-50">Smart Keyboard & Truth Tables</p>
            </div>

            <div className="p-6 space-y-6">
              {/* X Test Mode */}
              {boolExpr && (boolExpr.includes('x') || /[<>=]/.test(boolExpr)) && (
                <div className="bg-white border border-[#141414] shadow-sm p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">X-Value Testing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm italic">x =</span>
                    <input 
                      type="number"
                      value={xTestValue}
                      onChange={e => setXTestValue(e.target.value)}
                      className="w-16 border-b border-[#141414] font-mono text-sm outline-none text-center"
                    />
                    {(() => {
                      const evalRes = evaluateBooleanSafely(boolExpr, { x: Number(xTestValue) || 0 });
                      const isOk = !evalRes.isError && typeof evalRes.value === 'boolean';
                      return (
                        <div className={`flex-1 text-center font-mono font-bold text-sm p-2 border border-[#141414]/20 ${!isOk ? 'bg-gray-100 text-gray-500' : (evalRes.value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}`}>
                          {!isOk ? (evalRes.isError ? 'ERROR' : 'NON-BOOLEAN') : (evalRes.value ? 'TRUE (ĐÚNG)' : 'FALSE (SAI)')}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Truth Value Result Box / Truth Table */}
              {showTruthTable && boolExpr && !(boolExpr.includes('x') || /[<>=]/.test(boolExpr)) && (
                <div className="bg-white border border-[#141414] shadow-sm">
                  <div className="p-2 border-b border-[#141414] bg-[#141414] text-white flex justify-between items-center">
                    <span className="text-[10px] font-mono uppercase tracking-wider">Truth Table Result</span>
                    {truthTableData && (
                      <span className="text-[9px] font-mono opacity-80">{truthTableData.rows.length} rows</span>
                    )}
                  </div>
                  
                  {truthTableData ? (
                    <div className="overflow-x-auto max-h-[250px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-gray-100 sticky top-0 border-b border-[#141414]">
                          <tr>
                            {truthTableData.vars.map(v => (
                              <th key={v} className="p-2 border-r border-[#141414]/20 text-center">{v}</th>
                            ))}
                            <th className="p-2 text-center text-orange-700 font-bold">Res</th>
                          </tr>
                        </thead>
                        <tbody>
                          {truthTableData.rows.map((row, idx) => (
                            <tr key={idx} className="border-b border-[#141414]/10 hover:bg-orange-50">
                              {truthTableData.vars.map(v => (
                                <td key={v} className="p-2 border-r border-[#141414]/20 text-center opacity-70">
                                  {row[v] ? '1' : '0'}
                                </td>
                              ))}
                              <td className={`p-2 text-center font-bold ${row.IS_ERROR || row.IS_NUM ? 'text-gray-500 bg-gray-100' : (row.RESULT ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50')}`}>
                                {row.IS_ERROR ? 'ERR' : (row.IS_NUM ? 'NaN' : (row.RESULT ? 'T' : 'F'))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 text-[10px] font-mono opacity-50 text-center italic">
                      Waiting for valid expression (A-Z)
                    </div>
                  )}
                </div>
              )}

              {/* Symbol Palette 2026 */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                   <h4 className="text-[10px] font-mono uppercase opacity-60">Smart Keyboard Pack</h4>
                </div>
                
                {/* Logic Pack */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {['∧', '∨', '¬', '=>', '<=>'].map(s => (
                    <button key={s} onClick={() => setBoolExpr(p => p + s)} className="py-1.5 text-xs border border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-colors">{s}</button>
                  ))}
                  {['⊕', '⊙', '↑', '↓', '≡'].map(s => (
                    <button key={s} onClick={() => setBoolExpr(p => p + s)} className="py-1.5 text-[10px] border border-[#141414] bg-gray-50 hover:bg-orange-500 hover:text-white transition-colors">{s}</button>
                  ))}
                </div>

                {/* Relations & Sets */}
                <div className="grid grid-cols-5 gap-1 mb-2">
                  {['<', '>', '≤', '≥', '≠'].map(s => (
                    <button key={s} onClick={() => setBoolExpr(p => p + s)} className="py-1.5 text-xs border border-[#141414] bg-[#f9f9f9] hover:bg-blue-500 hover:text-white transition-colors">{s}</button>
                  ))}
                  {['∪', '∩', '∈', '⊆', '∖'].map(s => (
                    <button key={s} onClick={() => setBoolExpr(p => p + s)} className="py-1.5 text-xs border border-[#141414] bg-[#f9f9f9] hover:bg-blue-500 hover:text-white transition-colors">{s}</button>
                  ))}
                </div>

                {/* Vars & Numbers */}
                <div className="grid grid-cols-5 gap-1">
                  {['(', ')', 'x', '0', '1'].map(s => (
                    <button key={s} onClick={() => setBoolExpr(p => p + s)} className="py-1.5 text-xs border border-[#141414] bg-white font-bold hover:bg-[#141414] hover:text-white transition-colors">{s}</button>
                  ))}
                  {['A', 'B', 'P', 'Q', '='].map(s => (
                    <button key={s} onClick={() => setBoolExpr(p => p + s)} className="py-1.5 text-xs border border-[#141414] bg-orange-50 text-orange-900 font-bold hover:bg-orange-600 hover:text-white transition-colors">{s}</button>
                  ))}
                </div>
              </div>

              {/* Boolean Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase opacity-60 text-orange-600 font-bold">Logic Expression</label>
                <div className="flex items-stretch gap-2 w-full">
                  <input
                    value={boolExpr}
                    onChange={e => setBoolExpr(e.target.value)}
                    placeholder="e.g. (P ∧ Q) ∨ ¬R"
                    className="flex-1 min-w-0 bg-white border border-[#141414] p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 shadow-inner"
                  />
                  <button 
                    onClick={() => setBoolExpr('')} 
                    className="shrink-0 p-3 border border-[#141414] bg-white hover:bg-gray-100 flex items-center justify-center transition-colors"
                    title="Clear"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Variables Note */}
              <div className="p-3 bg-white border border-[#141414] text-[9px] font-mono opacity-60">
                Variables are auto-detected from uppercase letters. Use <b>x</b> for intervals test. <b>=&gt;</b> (Imply), <b>≡</b> (Eqv), <b>∖</b> (Set Minus).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


const getElementColor = (num: number) => {
  const sBlock = [1, 2, 3, 4, 11, 12, 19, 20, 37, 38, 55, 56, 87, 88, 119, 120];
  const pBlock = [5, 6, 7, 8, 9, 10, 13, 14, 15, 16, 17, 18, 31, 32, 33, 34, 35, 36, 49, 50, 51, 52, 53, 54, 81, 82, 83, 84, 85, 86, 113, 114, 115, 116, 117, 118];
  
  // f-block as per prompt (including 71 and 103)
  const isFBlock = (num >= 57 && num <= 71) || (num >= 89 && num <= 103);

  // d-block (excluding 71 and 103 as per latest correction)
  const dBlock = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 72, 73, 74, 75, 76, 77, 78, 79, 80, 104, 105, 106, 107, 108, 109, 110, 111, 112];

  if (sBlock.includes(num)) return '#FFD1DC'; // light magenta
  if (isFBlock) return '#98FB98'; // pale green
  if (dBlock.includes(num)) return '#3b82f6'; // blue
  if (pBlock.includes(num)) return '#FFFFE0'; // slightly light yellow
  return 'white';
};

const ZigzagBorders = ({ num }: { num: number }) => {
  const borders: Record<number, string> = {
    3: "border-t-2",
    4: "border-t-2",
    5: "border-l-2 border-b-2",
    13: "border-r-2",
    14: "border-b-2",
    32: "border-r-2",
    33: "border-b-2",
    51: "border-r-2",
    52: "border-b-2",
    84: "border-r-2",
    85: "border-b-2",
    117: "border-r-2",
    118: "border-b-2"
  };

  if (!borders[num]) return null;

  return (
    <div 
      className={cn("absolute inset-0 pointer-events-none border-dashed border-black z-20", borders[num])} 
      style={{ margin: '-1px' }} 
    />
  );
};

const getCustomElementInfo = (num: number) => {
  const data: Record<number, { category: string, description: string, vnName: string, toxicity?: string }> = {
    1: { category: "Nhóm IA (Kim loại kiềm)", description: "H: Hi-đrô. Phi kim duy nhất trong nhóm IA, vai trò sinh học quan trọng.", vnName: "Hi-đrô" },
    3: { category: "Nhóm IA (Kim loại kiềm)", description: "Li: Li-ti. Kim loại nhẹ nhất.", vnName: "Li-ti" },
    11: { category: "Nhóm IA (Kim loại kiềm)", description: "Na: Na-tri. Kim loại hoạt động mạnh.", vnName: "Na-tri" },
    19: { category: "Nhóm IA (Kim loại kiềm)", description: "K: Ka-li. Quan trọng cho tế bào sinh học.", vnName: "Ka-li" },
    37: { category: "Nhóm IA (Kim loại kiềm)", description: "Rb: Ru-bi-đi. Kim loại mềm.", vnName: "Ru-bi-đi" },
    55: { category: "Nhóm IA (Kim loại kiềm)", description: "Cs: Xe-xi. Kim loại hoạt động hóa học cực mạnh.", vnName: "Xe-xi" },
    87: { category: "Nhóm IA (Kim loại kiềm)", description: "Fr: Fran-xi. Nguyên tố phóng xạ hiếm.", vnName: "Fran-xi" },
    4: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Be: Bê-ri. Kim loại cứng, màu xám.", vnName: "Bê-ri" },
    12: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Mg: Ma-giê. Cháy với ánh sáng trắng chói.", vnName: "Ma-giê" },
    20: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Ca: Can-xi. Thành phần chính của xương.", vnName: "Can-xi" },
    38: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Sr: Stron-ti. Dùng trong pháo hoa đỏ.", vnName: "Stron-ti" },
    56: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Ba: Ba-ri. Dùng trong y tế.", vnName: "Ba-ri", toxicity: "Độc tính thấp hơn. Các hợp chất tan của Bari rất độc với tim, nhưng Bari sulfat (không tan) lại dùng được trong y tế." },
    88: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Ra: Ra-đi. Nguyên tố phóng xạ mạnh.", vnName: "Ra-đi" },
    5: { category: "Nhóm IIIA (Nhóm Boron)", description: "B: Bo. Nguyên tố đầu tiên, phổ biến trong thủy tinh chịu nhiệt.", vnName: "Bo" },
    13: { category: "Nhóm IIIA (Nhóm Boron)", description: "Al: Nhôm. Kim loại nhẹ, dẫn điện tốt.", vnName: "Nhôm" },
    31: { category: "Nhóm IIIA (Nhóm Boron)", description: "Ga: Ga-li. Nóng chảy ở nhiệt độ phòng.", vnName: "Ga-li" },
    49: { category: "Nhóm IIIA (Nhóm Boron)", description: "In: In-đi. Kim loại mềm.", vnName: "In-đi" },
    81: { category: "Nhóm IIIA (Nhóm Boron)", description: "Tl: Tha-li. Rất độc.", vnName: "Tha-li", toxicity: "Độc tính tích lũy nguy hiểm. Được mệnh danh là 'thuốc độc của kẻ đầu độc'. Nó không màu, không mùi, không vị và gây rụng tóc, liệt thần kinh." },
    113: { category: "Nhóm IIIA (Nhóm Boron)", description: "Nh: Ni-hô-ni. Nguyên tố siêu nặng.", vnName: "Ni-hô-ni" },
    6: { category: "Nhóm IVA (Nhóm Carbon)", description: "C: Các-bon (Than). Cơ sở của sự sống, vai trò sinh học quan trọng.", vnName: "Các-bon (Than)" },
    14: { category: "Nhóm IVA (Nhóm Carbon)", description: "Si: Si-líc. Thành phần cốt lõi của vi mạch, điện tử.", vnName: "Si-líc" },
    32: { category: "Nhóm IVA (Nhóm Carbon)", description: "Ge: Géc-ma-ni. Dùng trong sợi quang và quang phổ hồng ngoại.", vnName: "Géc-ma-ni" },
    50: { category: "Nhóm IVA (Nhóm Carbon)", description: "Sn: Thiếc. Dùng để mạ sắt thép.", vnName: "Thiếc" },
    82: { category: "Nhóm IVA (Nhóm Carbon)", description: "Pb: Chì. Kim loại nặng.", vnName: "Chì", toxicity: "Độc tính tích lũy nguy hiểm. Tích lũy trong xương, gây suy giảm trí tuệ (đặc biệt ở trẻ em), thiếu máu và hỏng thận." },
    114: { category: "Nhóm IVA (Nhóm Carbon)", description: "Fl: Phlê-rô-vi. Nguyên tố siêu nặng.", vnName: "Phlê-rô-vi" },
    7: { category: "Nhóm VA (Nhóm Nitơ)", description: "N: Ni-tơ. Chiếm 78% khí quyển, vai trò sinh học quan trọng.", vnName: "Ni-tơ" },
    15: { category: "Nhóm VA (Nhóm Nitơ)", description: "P: Phốt-pho. Quan trọng cho sự trao đổi chất, vai trò sinh học quan trọng.", vnName: "Phốt-pho" },
    33: { category: "Nhóm VA (Nhóm Nitơ)", description: "As: A-xen (Thạch tín). Sử dụng trong bán dẫn và hợp kim.", vnName: "A-xen (Thạch tín)", toxicity: "Độc tính tích lũy nguy hiểm. Gây ngộ độc cấp tính (nôn mửa, tiêu chảy) và mãn tính (ung thư, thương tổn da)." },
    51: { category: "Nhóm VA (Nhóm Nitơ)", description: "Sb: An-ti-mon. Dùng làm chất chống cháy và hợp kim.", vnName: "An-ti-mon", toxicity: "Độc tính thấp hơn. Độc tính tương tự asen nhưng nhẹ hơn một chút." },
    83: { category: "Nhóm VA (Nhóm Nitơ)", description: "Bi: Bít-mút. Kim loại nặng ít độc.", vnName: "Bít-mút" },
    115: { category: "Nhóm VA (Nhóm Nitơ)", description: "Mc: Mát-cô-vi. Nguyên tố siêu nặng.", vnName: "Mát-cô-vi" },
    8: { category: "Nhóm VIA (Nhóm Oxi/Chalcogen)", description: "O: Ô-xi. Duy trì sự hô hấp, vai trò sinh học quan trọng.", vnName: "Ô-xi" },
    16: { category: "Nhóm VIA (Nhóm Oxi/Chalcogen)", description: "S: Lưu huỳnh. Có mùi đặc trưng, vai trò sinh học quan trọng.", vnName: "Lưu huỳnh" },
    34: { category: "Nhóm VIA (Nhóm Oxi/Chalcogen)", description: "Se: Se-len. Chất bán dẫn, vai trò sinh học quan trọng.", vnName: "Se-len" },
    52: { category: "Nhóm VIA (Nhóm Oxi/Chalcogen)", description: "Te: Te-lu. Sử dụng trong các thiết bị nhiệt điện và kim hợp lý.", vnName: "Te-lu" },
    84: { category: "Nhóm VIA (Nhóm Oxi/Chalcogen)", description: "Po: Pô-lô-ni. Nguyên tố phóng xạ.", vnName: "Pô-lô-ni", toxicity: "Nhóm 'Tử thần' (Cực độc). Là nguyên tố phóng xạ cực mạnh. Chỉ cần một lượng nhỏ bằng hạt bụi cũng đủ gây tử vong nhanh chóng do phá hủy tế bào từ bên trong." },
    116: { category: "Nhóm VIA (Nhóm Oxi/Chalcogen)", description: "Lv: Li-vơ-mô-ri. Nguyên tố siêu nặng.", vnName: "Li-vơ-mô-ri" },
    9: { category: "Nhóm VIIA (Nhóm Halogen)", description: "F: Flo. Tính oxi hóa mạnh, hoạt động hóa học cao.", vnName: "Flo", toxicity: "Gây bỏng và ngạt cấp tính. Khí cực độc, ăn mòn cực mạnh, có thể phá hủy mô và xương ngay lập tức khi tiếp xúc." },
    17: { category: "Nhóm VIIA (Nhóm Halogen)", description: "Cl: Clo. Tính oxi hóa mạnh, hoạt động hóa học cao.", vnName: "Clo", toxicity: "Gây bỏng và ngạt cấp tính. Ở dạng khí nồng độ cao gây phù phổi và tử vong nhanh chóng (từng dùng làm vũ khí hóa học)." },
    35: { category: "Nhóm VIIA (Nhóm Halogen)", description: "Br: Brom. Tính oxi hóa mạnh, hoạt động hóa học cao.", vnName: "Brom", toxicity: "Gây bỏng và ngạt cấp tính. Dạng lỏng và hơi gây bỏng hóa chất nặng và hỏng hệ hô hấp." },
    53: { category: "Nhóm VIIA (Nhóm Halogen)", description: "I: I-ốt. Tính oxi hóa mạnh, hoạt động hóa học cao.", vnName: "I-ốt" },
    85: { category: "Nhóm VIIA (Nhóm Halogen)", description: "At: A-ta-tin. Tính oxi hóa mạnh, hoạt động hóa học cao.", vnName: "A-ta-tin" },
    117: { category: "Nhóm VIIA (Nhóm Halogen)", description: "Ts: Ten-nét-xin. Nguyên tố siêu nặng.", vnName: "Ten-nét-xin" },
    2: { category: "Nhóm VIIIA (Khí hiếm)", description: "He: Hê-li. Rất kiên cố, gần như không phản ứng.", vnName: "Hê-li" },
    10: { category: "Nhóm VIIIA (Khí hiếm)", description: "Ne: Nê-on. Rất kiên cố, gần như không phản ứng.", vnName: "Nê-on" },
    18: { category: "Nhóm VIIIA (Khí hiếm)", description: "Ar: Ag-gon. Rất kiên cố, gần như không phản ứng.", vnName: "Ag-gon" },
    36: { category: "Nhóm VIIIA (Khí hiếm)", description: "Kr: Kờ-ríp-tôn. Rất kiên cố, gần như không phản ứng.", vnName: "Kờ-ríp-tôn" },
    54: { category: "Nhóm VIIIA (Khí hiếm)", description: "Xe: Xe-nôn. Rất kiên cố, gần như không phản ứng.", vnName: "Xe-nôn" },
    86: { category: "Nhóm VIIIA (Khí hiếm)", description: "Rn: Ra-đôn. Rất kiên cố, gần như không phản ứng.", vnName: "Ra-đôn" },
    118: { category: "Nhóm VIIIA (Khí hiếm)", description: "Og: Ô-ga-nét-xôn. Nguyên tố cuối cùng.", vnName: "Ô-ga-nét-xôn" },
    29: { category: "Transition Metal", description: "Copper: Đồng. Kim loại dẫn điện, dẫn nhiệt tốt.", vnName: "Đồng", toxicity: "Độc tính thấp hơn. Là vi chất cần thiết cho cơ thể, nhưng nếu hấp thụ quá liều lượng lớn sẽ gây ngộ độc kim loại, nôn mửa." },
    30: { category: "Transition Metal", description: "Zinc: Kẽm. Kim loại quan trọng cho miễn dịch.", vnName: "Kẽm", toxicity: "Độc tính thấp hơn. Là vi chất cần thiết cho cơ thể, nhưng nếu hấp thụ quá liều lượng lớn sẽ gây ngộ độc kim loại, nôn mửa." },
    48: { category: "Transition Metal", description: "Cadmium: Cadimi. Kim loại nặng.", vnName: "Cadimi", toxicity: "Độc tính tích lũy nguy hiểm. Gây giòn xương (bệnh Itai-itai) và suy thận nghiêm trọng." },
    80: { category: "Transition Metal", description: "Mercury: Thuỷ ngân. Kim loại duy nhất ở thể lỏng ở nhiệt độ phòng.", vnName: "Thuỷ ngân", toxicity: "Độc tính tích lũy nguy hiểm. Đặc biệt độc ở dạng hơi và dạng hữu cơ (Methyl thủy ngân). Phá hủy hệ thần kinh trung ương và thận." },
    79: { category: "Transition Metal", description: "Gold: Vàng. Kim loại quý, không bị oxi hóa.", vnName: "Vàng" },
    47: { category: "Transition Metal", description: "Silver: Bạc. Kim loại dẫn điện tốt nhất.", vnName: "Bạc" },
    24: { category: "Transition Metal", description: "Chromium: Crôm. Kim loại cứng nhất.", vnName: "Crôm" },
    94: { category: "Actinide", description: "Plutonium: Plutoni. Kim loại phóng xạ siêu nặng.", vnName: "Plutoni", toxicity: "Nhóm 'Tử thần' (Cực độc). Kim loại phóng xạ, cực kỳ độc nếu hít phải bụi của nó, gây ung thư xương và phổi." },
    119: { category: "Nhóm IA (Kim loại kiềm)", description: "Uue: U-un-en-ni-um. Nguyên tố đầu tiên của chu kỳ 8, kim loại kiềm cực kỳ hiếm và không bền. Dự đoán có tính chất tương tự Franci nhưng hoạt động hóa học mạnh hơn.", vnName: "U-un-en-ni-um" },
    120: { category: "Nhóm IIA (Kim loại kiềm thổ)", description: "Ubn: Un-bi-ni-li-um. Nguyên tố thứ hai của chu kỳ 8. Dự đoán là kim loại kiềm thổ siêu nặng, cực kỳ kém bền. Khả năng tổng hợp bằng cách bắn phá Curium-248 bằng Chromium-54.", vnName: "Un-bi-ni-li-um" },
  };
  return data[num] || null;
};

const getRadioactivityInfo = (num: number) => {
  if (num === 120) return { type: 'danger', text: "Unbinilium (Ubn): ĐỘ PHÓNG XẠ MẠNH NHẤT TRONG CÁC DỰ ĐOÁN KHOA HỌC (mạnh hơn cả Ununennium). Cực kỳ kém bền, thời gian bán rã dự kiến chỉ vài micro giây. Chủ yếu phân rã Alpha để biến đổi thành Copernici (112) hoặc Flerovi (114)." };
  if (num === 119) return { type: 'danger', text: "Ununennium (Uue): Độ phóng xạ cực mạnh, phân rã cực nhanh (nhanh hơn Oganesson nhiều lần). Là kim loại kiềm có tính phóng xạ cực đoan, kém bền hơn hầu hết các nguyên tố siêu nặng khác." };
  if (num >= 104 && num <= 118) return { type: 'danger', text: "Nguyên tử siêu nặng (Phóng xạ cực mạnh, tồn tại trong vài giây). Đây là các nguyên tố nhân tạo ở cuối bảng tuần hoàn, chúng cực kỳ kém bền và phân rã ngay lập tức." };
  if ((num >= 84 && num <= 89) || (num >= 94 && num <= 103)) {
    const specific: Record<number, string> = {
      84: "Poloni (Po): Cực độc, phát xạ alpha mạnh.",
      85: "Atatin (At): Rất hiếm, phóng xạ rất mạnh.",
      86: "Radon (Rn): Khí phóng xạ gây ung thư phổi.",
      87: "Fransi (Fr): Cực kỳ kém bền.",
      88: "Radi (Ra): Phóng xạ mạnh, từng dùng trong dạ quang.",
      89: "Actini (Ac): Nguồn phát tia alpha.",
      94: "Plutoni (Pu): Nguyên liệu vũ khí hạt nhân.",
      95: "Americi (Am): Dùng trong máy báo cháy."
    };
    return { type: 'danger', text: specific[num] || "Nguyên tố phóng xạ tự nhiên và nhân tạo điển hình (Rất nguy hiểm). Các nguyên tố này có tính phóng xạ mạnh, thường gặp trong nghiên cứu và năng lượng hạt nhân." };
  }
  if (num >= 90 && num <= 92) {
    const specific: Record<number, string> = {
      92: "Urani (U): Nhiên liệu hạt nhân phổ biến nhất.",
      90: "Thori (Th): Phóng xạ yếu hơn Urani nhưng phổ biến trong tự nhiên.",
      91: "Protactini (Pa): Sản phẩm trung gian của Urani."
    };
    return { type: 'warning', text: specific[num] || "Phóng xạ tồn tại lâu dài (Nguy hiểm trung bình). Các nguyên tố này có chu kỳ bán rã rất dài (hàng tỷ năm), ít 'dữ dội' hơn nhưng vẫn phát ra bức xạ liên tục." };
  }
  if (num === 43) return { type: 'warning', text: "Tecneti (Tc): Nguyên tố nhẹ nhất không có đồng vị bền (dùng trong y tế)." };
  if (num === 61) return { type: 'warning', text: "Prometi (Pm): Nguyên tố hiếm đất, tất cả đồng vị đều phóng xạ." };
  if (num >= 1 && num <= 82) return { type: 'safe', text: "Nguyên tố bền (Không phóng xạ). Đây là các nguyên tố an toàn, không tự phân rã bức xạ trong điều kiện bình thường." };
  return null;
};

function Mode15({ onExportToMode11 }: { onExportToMode11: (v: string) => void }) {
  const [elements, setElements] = useState<any[]>([]);
  const [codataConstants, setCodataConstants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chemistry' | 'physics'>('chemistry');
  const [constantsSearch, setConstantsSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "Universal": true,
    "Electromagnetic": true,
    "Atomic": true,
    "Other": true
  });
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<any>(null);

  // Unit Converter State
  const [convValue, setConvValue] = useState<string>('1');
  const [convCategory, setConvCategory] = useState<string>('length');
  const [fromUnit, setFromUnit] = useState<string>('m');
  const [toUnit, setToUnit] = useState<string>('km');
  const [convResult, setConvResult] = useState<number | null>(null);

  // pH State
  const [hConc, setHConc] = useState<string>('1e-7');
  const [phResult, setPhResult] = useState<number | null>(null);

  // Formula Parser State
  const [formula, setFormula] = useState<string>('K4[Fe(CN)6]');
  const [parseResult, setParseResult] = useState<ParseResult>(parseFormula('K4[Fe(CN)6]'));

  useEffect(() => {
    setParseResult(parseFormula(formula));
  }, [formula]);

  useEffect(() => {
    // Fetch Periodic Table
    const fetchPT = fetch('https://raw.githubusercontent.com/Bowserinator/Periodic-Table-JSON/master/PeriodicTableJSON.json')
      .then(res => res.json())
      .then(data => {
        const allElements = [...data.elements];
        // Add Ununennium (119) if not present
        if (!allElements.find(e => e.number === 119)) {
          allElements.push({
            name: "Ununennium",
            appearance: "unknown, probably silvery-white or grey metallic",
            atomic_mass: 315,
            boil: 900,
            category: "alkali metal",
            density: 3.7,
            discovered_by: "not yet discovered",
            melt: 273,
            molar_heat: null,
            named_by: null,
            number: 119,
            period: 8,
            phase: "Solid",
            source: "https://en.wikipedia.org/wiki/Ununennium",
            spectral_img: null,
            summary: "Ununennium, also known as eka-francium or element 119, is the hypothetical chemical element with symbol Uue and atomic number 119.",
            symbol: "Uue",
            xpos: 1,
            ypos: 8, // Period 8, Group 1. ypos is 1-indexed for rows.
            shells: [2, 8, 18, 32, 32, 18, 8, 1],
            electron_configuration: "1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6 6s2 4f14 5d10 6p6 7s2 5f14 6d10 7p6 8s1",
            electron_configuration_semantic: "[Og] 8s1",
            electron_affinity: 43.87,
            electronegativity_pauling: 0.22,
            ionization_energies: [463.1],
            oxidation_states: "+1"
          });
        }
        if (!allElements.find(e => e.number === 120)) {
          allElements.push({
            name: "Unbinilium",
            appearance: "unknown, probably silvery-white or grey metallic",
            atomic_mass: 300,
            boil: 1970,
            category: "alkaline earth metal",
            density: 7.0,
            discovered_by: "not yet discovered",
            melt: 950,
            molar_heat: null,
            named_by: null,
            number: 120,
            period: 8,
            phase: "Solid",
            source: "https://en.wikipedia.org/wiki/Unbinilium",
            spectral_img: null,
            summary: "Unbinilium, also known as eka-radium or element 120, is the hypothetical chemical element with symbol Ubn and atomic number 120.",
            symbol: "Ubn",
            xpos: 2,
            ypos: 8,
            shells: [2, 8, 18, 32, 32, 18, 8, 2],
            electron_configuration: "1s2 2s2 2p6 3s2 3p6 4s2 3d10 4p6 5s2 4d10 5p6 6s2 4f14 5d10 6p6 7s2 5f14 6d10 7p6 8s2",
            electron_configuration_semantic: "[Og] 8s2",
            electron_affinity: null,
            electronegativity_pauling: 0.9,
            ionization_energies: [560],
            oxidation_states: "+2"
          });
        }
        setElements(allElements);
      });

    // Fetch CODATA Constants with multi-source fallback
    const sources = [
      'https://cdn.jsdelivr.net/gh/piinalpin/codata-data/data/codata-2018.json',
      'https://raw.githubusercontent.com/piinalpin/codata-data/master/data/codata-2018.json',
      'https://raw.githubusercontent.com/joshua-gould/codata/master/codata/data/codata_2018.json'
    ];

    const fetchWithFallback = async (urls: string[]): Promise<any> => {
      for (const url of urls) {
        try {
          const res = await fetch(url);
          if (res.ok) return await res.json();
        } catch (e) {
          console.warn(`Failed to fetch from ${url}, trying next...`);
        }
      }
      throw new Error("All sources failed");
    };

    const fetchCodata = fetchWithFallback(sources)
      .then(data => {
        const symbolMap: Record<string, string> = {
          "speed of light in vacuum": "c",
          "elementary charge": "e",
          "planck constant": "h",
          "gravitational constant": "G",
          "boltzmann constant": "k_B",
          "avogadro constant": "N_A",
          "electron mass": "m_e",
          "proton mass": "m_p",
          "molar gas constant": "R",
          "stefan-boltzmann constant": "σ",
          "fine-structure constant": "α"
        };
        const categoryMap: Record<string, string> = {
          "speed of light in vacuum": "Universal",
          "elementary charge": "Electromagnetic",
          "planck constant": "Universal",
          "gravitational constant": "Universal",
          "boltzmann constant": "Universal",
          "avogadro constant": "Atomic",
          "electron mass": "Atomic",
          "proton mass": "Atomic",
          "molar gas constant": "Universal",
          "stefan-boltzmann constant": "Universal",
          "fine-structure constant": "Electromagnetic"
        };
        
        // Handle different JSON structures if necessary (standardizing to quantity/value/uncertainty/unit)
        const rawList = Array.isArray(data) ? data : (data.constants || []);
        
        const processed = rawList
          .sort((a: any, b: any) => (a.quantity || a.name || "").localeCompare(b.quantity || b.name || ""))
          .map((item: any, idx: number) => {
            const name = item.quantity || item.name;
            const valRaw = (item.value || "").toString();
            return {
              stt: idx + 1,
              name: name,
              symbol: symbolMap[name.toLowerCase()] || "",
              value: valRaw.replace(/\s/g, '').replace(/\.\.\./g, ''),
              uncertainty: item.uncertainty,
              unit: item.unit,
              category: categoryMap[name.toLowerCase()] || "Other"
            };
          });
        setCodataConstants(processed);
        setFetchError(null);
      })
      .catch(err => {
        console.warn("CODATA live sources unreachable, switching to high-precision offline core.");
        setFetchError("Live sources blocked. Using high-precision offline core (47 constants).");
        // Comprehensive high-precision fallback (47 constants)
        const fallback = [
          { stt: 1, name: "Speed of light in vacuum", symbol: "c", value: "299792458", unit: "m s^-1", category: "Universal" },
          { stt: 2, name: "Planck constant", symbol: "h", value: "6.62607015e-34", unit: "J s", category: "Universal" },
          { stt: 3, name: "Planck constant over 2 pi", symbol: "ħ", value: "1.054571817e-34", unit: "J s", category: "Universal" },
          { stt: 4, name: "Elementary charge", symbol: "e", value: "1.602176634e-19", unit: "C", category: "Electromagnetic" },
          { stt: 5, name: "Gravitational constant", symbol: "G", value: "6.67430e-11", unit: "m^3 kg^-1 s^-2", category: "Universal" },
          { stt: 6, name: "Boltzmann constant", symbol: "k_B", value: "1.380649e-23", unit: "J K^-1", category: "Universal" },
          { stt: 7, name: "Avogadro constant", symbol: "N_A", value: "6.02214076e23", unit: "mol^-1", category: "Atomic" },
          { stt: 8, name: "Molar gas constant", symbol: "R", value: "8.314462618", unit: "J mol^-1 K^-1", category: "Universal" },
          { stt: 9, name: "Electron mass", symbol: "m_e", value: "9.1093837015e-31", unit: "kg", category: "Atomic" },
          { stt: 10, name: "Proton mass", symbol: "m_p", value: "1.67262192369e-27", unit: "kg", category: "Atomic" },
          { stt: 11, name: "Neutron mass", symbol: "m_n", value: "1.67492749804e-27", unit: "kg", category: "Atomic" },
          { stt: 12, name: "Fine-structure constant", symbol: "α", value: "7.2973525693e-3", unit: "", category: "Electromagnetic" },
          { stt: 13, name: "Stefan-Boltzmann constant", symbol: "σ", value: "5.670374419e-8", unit: "W m^-2 K^-4", category: "Universal" },
          { stt: 14, name: "Rydberg constant", symbol: "R_inf", value: "10973731.568160", unit: "m^-1", category: "Atomic" },
          { stt: 15, name: "Bohr radius", symbol: "a_0", value: "5.29177210903e-11", unit: "m", category: "Atomic" },
          { stt: 16, name: "Magnetic constant", symbol: "μ_0", value: "1.25663706212e-6", unit: "N A^-2", category: "Electromagnetic" },
          { stt: 17, name: "Electric constant", symbol: "ε_0", value: "8.8541878128e-12", unit: "F m^-1", category: "Electromagnetic" },
          { stt: 18, name: "Faraday constant", symbol: "F", value: "96485.33212", unit: "C mol^-1", category: "Electromagnetic" },
          { stt: 19, name: "Atomic mass unit", symbol: "u", value: "1.66053906660e-27", unit: "kg", category: "Atomic" },
          { stt: 20, name: "Standard gravity", symbol: "g_n", value: "9.80665", unit: "m s^-2", category: "Universal" },
          { stt: 21, name: "Bohr magneton", symbol: "μ_B", value: "9.2740100783e-24", unit: "J T^-1", category: "Atomic" },
          { stt: 22, name: "Nuclear magneton", symbol: "μ_N", value: "5.0507837461e-27", unit: "J T^-1", category: "Atomic" },
          { stt: 23, name: "Wien wavelength displacement constant", symbol: "b", value: "2.897771955e-3", unit: "m K", category: "Universal" },
          { stt: 24, name: "Proton-electron mass ratio", symbol: "m_p/m_e", value: "1836.15267343", unit: "", category: "Atomic" },
          { stt: 25, name: "Neutron-electron mass ratio", symbol: "m_n/m_e", value: "1838.68366173", unit: "", category: "Atomic" },
          { stt: 26, name: "Muon mass", symbol: "m_mu", value: "1.883531627e-28", unit: "kg", category: "Atomic" },
          { stt: 27, name: "Tau mass", symbol: "m_tau", value: "3.16754e-27", unit: "kg", category: "Atomic" },
          { stt: 28, name: "Josephson constant", symbol: "K_J", value: "483597.8484e9", unit: "Hz V^-1", category: "Electromagnetic" },
          { stt: 29, name: "Von Klitzing constant", symbol: "R_K", value: "25812.80745", unit: "ohm", category: "Electromagnetic" },
          { stt: 30, name: "Conductance quantum", symbol: "G_0", value: "7.748091729e-5", unit: "S", category: "Electromagnetic" },
          { stt: 31, name: "Magnetic flux quantum", symbol: "Φ_0", value: "2.067833848e-15", unit: "Wb", category: "Electromagnetic" },
          { stt: 32, name: "Electron magnetic moment", symbol: "μ_e", value: "-9.2847647043e-24", unit: "J T^-1", category: "Magnetic Moments" },
          { stt: 33, name: "Proton magnetic moment", symbol: "μ_p", value: "1.41060679736e-26", unit: "J T^-1", category: "Magnetic Moments" },
          { stt: 34, name: "Neutron magnetic moment", symbol: "μ_n", value: "-0.96623651e-26", unit: "J T^-1", category: "Magnetic Moments" },
          { stt: 35, name: "Muon magnetic moment", symbol: "μ_mu", value: "-4.49044830e-26", unit: "J T^-1", category: "Magnetic Moments" },
          { stt: 36, name: "Proton gyromagnetic ratio", symbol: "γ_p", value: "2.6752218744e8", unit: "s^-1 T^-1", category: "Magnetic Moments" },
          { stt: 37, name: "Molar volume of ideal gas", symbol: "V_m", value: "22.41396954e-3", unit: "m^3 mol^-1", category: "Physico-chemical" },
          { stt: 38, name: "Loschmidt constant", symbol: "n_0", value: "2.686780111e25", unit: "m^-3", category: "Physico-chemical" },
          { stt: 39, name: "Sackur-Tetrode constant", symbol: "S_0/R", value: "-1.1648708", unit: "", category: "Physico-chemical" },
          { stt: 40, name: "Fermi coupling constant", symbol: "G_F", value: "1.1663787e-5", unit: "GeV^-2", category: "Physico-chemical" },
          { stt: 41, name: "Weak mixing angle", symbol: "sin²θ_W", value: "0.22290", unit: "", category: "Physico-chemical" },
          { stt: 42, name: "Higgs mass", symbol: "m_H", value: "125.10", unit: "GeV c^-2", category: "Physico-chemical" },
          { stt: 43, name: "Top quark mass", symbol: "m_t", value: "172.76", unit: "GeV c^-2", category: "Physico-chemical" },
          { stt: 44, name: "W boson mass", symbol: "m_W", value: "80.379", unit: "GeV c^-2", category: "Physico-chemical" },
          { stt: 45, name: "Z boson mass", symbol: "m_Z", value: "91.1876", unit: "GeV c^-2", category: "Physico-chemical" },
          { stt: 46, name: "Characteristic impedance of vacuum", symbol: "Z_0", value: "376.730313668", unit: "ohm", category: "Universal" },
          { stt: 47, name: "First radiation constant", symbol: "c_1", value: "3.741771852e-16", unit: "W m^2", category: "Universal" }
        ];
        setCodataConstants(fallback);
      });

    Promise.all([fetchPT, fetchCodata])
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const eChargeStr = codataConstants.find(c => c.name.toLowerCase() === "elementary charge")?.value || "1.602176634e-19";
    const eCharge = parseFloat(eChargeStr);
    
    return {
      length: {
        m: 1.0, in: 0.0254, cm: 0.01, ft: 0.3048, yd: 0.9144, mile: 1609.344, km: 1000.0, pc: 3.08567758e16, ly: 9.46073047e15
      },
      area: {
        m2: 1.0, ha: 10000.0, acre: 4046.8564224
      },
      volume: {
        L: 1.0, gal_us: 3.785411784, gal_uk: 4.54609
      },
      mass: {
        kg: 1.0, ng: 1e-12, mg: 1e-6, g: 1e-3, oz: 0.028349523125, lb: 0.45359237
      },
      velocity: {
        "m/s": 1.0, "km/h": 1/3.6
      },
      pressure: {
        Pa: 1.0, kPa: 1000.0, atm: 101325.0, mmHg: 133.322387415, "kgf/cm2": 98066.5, psi: 6894.757293168
      },
      energy: {
        J: 1.0, eV: eCharge, cal: 4.184, "kgf.m": 9.80665
      },
      power: {
        W: 1.0, kW: 1000.0, hp: 745.69987158227
      }
    };
  }, [codataConstants]);

  const groupedConstants = useMemo(() => {
    const filtered = codataConstants.filter(c => 
      c.name.toLowerCase().includes(constantsSearch.toLowerCase()) || 
      c.symbol.toLowerCase().includes(constantsSearch.toLowerCase()) ||
      c.stt.toString() === constantsSearch
    );

    const groups: Record<string, any[]> = {};
    filtered.forEach(c => {
      if (!groups[c.category]) groups[c.category] = [];
      groups[c.category].push(c);
    });
    return groups as Record<string, any[]>;
  }, [codataConstants, constantsSearch]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  const handleConvert = () => {
    const val = parseFloat(convValue);
    if (isNaN(val)) return;

    if (convCategory === 'temperature') {
      let k;
      if (fromUnit === 'C') k = val + 273.15;
      else if (fromUnit === 'F') k = (val - 32) * 5/9 + 273.15;
      else k = val;

      let res;
      if (toUnit === 'C') res = k - 273.15;
      else if (toUnit === 'F') res = (k - 273.15) * 9/5 + 32;
      else res = k;
      setConvResult(res);
    } else {
      const cat = (categories as any)[convCategory];
      const res = val * cat[fromUnit] / cat[toUnit];
      setConvResult(res);
    }
  };

  const handlePh = () => {
    const val = parseFloat(hConc);
    if (isNaN(val) || val <= 0) setPhResult(null);
    else setPhResult(-Math.log10(val));
  };

  const constants = [
    { symbol: 'c', name: 'Speed of Light', value: '299,792,458', unit: 'm/s' },
    { symbol: 'G', name: 'Gravitational Constant', value: '6.67430 × 10⁻¹¹', unit: 'm³/(kg·s²)' },
    { symbol: 'h', name: 'Planck Constant', value: '6.62607 × 10⁻³⁴', unit: 'J·s' },
    { symbol: 'e', name: 'Elementary Charge', value: '1.60218 × 10⁻¹⁹', unit: 'C' },
    { symbol: 'k_B', name: 'Boltzmann Constant', value: '1.38065 × 10⁻²³', unit: 'J/K' },
    { symbol: 'N_A', name: 'Avogadro Number', value: '6.02214 × 10²³', unit: 'mol⁻¹' },
    { symbol: 'R', name: 'Gas Constant', value: '8.31446', unit: 'J/(mol·K)' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-[#141414] pb-4">
        <div>
          <h2 className="font-serif italic text-4xl">ChemPhys Lab</h2>
          <p className="font-mono text-xs opacity-50 mt-2">Periodic Table & Physical Analysis</p>
        </div>
        <div className="flex border border-[#141414]">
          <button 
            onClick={() => setActiveTab('chemistry')}
            className={cn(
              "px-6 py-2 font-mono text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'chemistry' ? "bg-[#141414] text-white" : "hover:bg-gray-100"
            )}
          >
            Chemistry
          </button>
          <button 
            onClick={() => setActiveTab('physics')}
            className={cn(
              "px-6 py-2 font-mono text-[10px] uppercase tracking-widest transition-all",
              activeTab === 'physics' ? "bg-[#141414] text-white" : "hover:bg-gray-100"
            )}
          >
            Physics & Units
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'chemistry' ? (
          <motion.div 
            key="chem"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Periodic Table Grid */}
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-2 opacity-40 mb-4">
                <Beaker className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Periodic Table of Elements</span>
              </div>
              
              {loading ? (
                <div className="h-[600px] flex items-center justify-center border border-[#141414]/10">
                  <Cpu className="w-8 h-8 animate-spin opacity-20" />
                </div>
              ) : (
                <div className="grid grid-cols-[30px_repeat(18,minmax(0,1fr))] gap-1 overflow-auto p-4 border border-[#141414] bg-gray-50/30">
                  {/* Group Labels IA-VIIIA */}
                  <div style={{ gridColumn: 2, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">IA</div>
                  <div style={{ gridColumn: 3, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">IIA</div>
                  <div style={{ gridColumn: 14, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">IIIA</div>
                  <div style={{ gridColumn: 15, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">IVA</div>
                  <div style={{ gridColumn: 16, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">VA</div>
                  <div style={{ gridColumn: 17, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">VIA</div>
                  <div style={{ gridColumn: 18, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">VIIA</div>
                  <div style={{ gridColumn: 19, gridRow: 1 }} className="text-[10px] font-bold text-center opacity-50 flex items-end justify-center pb-1">VIIIA</div>

                  {/* Period Labels 1-8 */}
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                    <div key={p} style={{ gridColumn: 1, gridRow: p + 1 }} className="text-[10px] font-bold opacity-50 flex items-center justify-center">
                      {p}
                    </div>
                  ))}

                  {elements.map((el) => {
                    const bgColor = getElementColor(el.number);
                    const isSelected = selectedElement?.number === el.number;
                    
                    return (
                      <button
                        key={el.number}
                        onClick={() => setSelectedElement(el)}
                        className={cn(
                          "aspect-square border border-[#141414]/10 flex flex-col items-center justify-center transition-all hover:scale-110 hover:z-10 hover:shadow-lg relative",
                          isSelected ? "bg-[#141414] text-white" : ""
                        )}
                        style={{ 
                          gridColumn: el.xpos + 1, 
                          gridRow: el.ypos + 1,
                          backgroundColor: isSelected ? undefined : bgColor,
                          borderColor: isSelected ? '#141414' : undefined
                        }}
                      >
                        <ZigzagBorders num={el.number} />
                        <span className="text-[8px] opacity-50 z-10">{el.number}</span>
                        <span className="text-xs font-bold z-10">{el.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chemical Formula Analyzer - NEW SECTION */}
            <div className="lg:col-span-8 space-y-6 mt-8">
              <div className="flex items-center gap-2 opacity-40 mb-4">
                <FlaskConical className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Chemical Formula Analyzer</span>
              </div>
              
              <div className="border border-[#141414] p-6 bg-white shadow-sm space-y-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] uppercase tracking-widest opacity-50">Enter Formula (e.g. (NH4)2SO4, K4[Fe(CN)6])</label>
                  <input 
                    type="text"
                    value={formula}
                    onChange={(e) => setFormula(e.target.value)}
                    placeholder="Enter chemical formula..."
                    className="w-full bg-gray-50 border border-[#141414]/20 p-4 font-serif text-2xl focus:outline-none focus:border-[#141414] transition-all"
                  />
                </div>

                {parseResult.error ? (
                  <div className="p-4 bg-red-50 border border-red-200 flex items-center gap-3 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-mono">{parseResult.error}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 border border-[#141414]/10 space-y-1">
                        <span className="font-mono text-[9px] uppercase opacity-50">Total Molar Mass</span>
                        <p className="text-3xl font-serif italic">{parseResult.totalMass} <span className="text-sm not-italic opacity-50">g/mol</span></p>
                      </div>

                      <div className="space-y-2">
                        <span className="font-mono text-[9px] uppercase opacity-50">Element Breakdown</span>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(parseResult.elementDetail).map(([el, count]) => (
                            <div key={el} className="p-2 border border-[#141414]/5 bg-white flex justify-between items-center">
                              <span className="font-bold">{el}</span>
                              <span className="font-mono text-xs opacity-50">x{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <span className="font-mono text-[9px] uppercase opacity-50">Ions Detected</span>
                        <div className="space-y-2">
                          {parseResult.ionDetected.length > 0 ? (
                            parseResult.ionDetected.map((ion, idx) => (
                              <div key={idx} className="p-3 border border-[#141414]/10 bg-blue-50/30 flex flex-col gap-1">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-blue-900">{ion.formula}</span>
                                  <span className="text-[10px] font-mono opacity-50">{ion.name}</span>
                                </div>
                                <span className="text-[10px] font-mono text-blue-700/70">{ion.mass} g/mol</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs font-mono opacity-30 italic">No specific ions detected from dictionary.</p>
                          )}
                        </div>
                      </div>

                      {parseResult.compoundInfo && (
                        <div className={cn(
                          "p-4 border space-y-3",
                          parseResult.compoundInfo.safetyLevel === 'Danger' ? "bg-red-50 border-red-200" : 
                          parseResult.compoundInfo.safetyLevel === 'Warning' ? "bg-orange-50 border-orange-200" : 
                          "bg-green-50 border-green-200"
                        )}>
                          <div className="flex items-center gap-2">
                            {parseResult.compoundInfo.safetyLevel === 'Danger' ? (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            ) : parseResult.compoundInfo.safetyLevel === 'Warning' ? (
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                            <span className={cn(
                              "font-bold uppercase text-xs tracking-wider",
                              parseResult.compoundInfo.safetyLevel === 'Danger' ? "text-red-700" : 
                              parseResult.compoundInfo.safetyLevel === 'Warning' ? "text-orange-700" : 
                              "text-green-700"
                            )}>
                              {parseResult.compoundInfo.safetyLevel} - {parseResult.compoundInfo.name}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            {parseResult.compoundInfo.commonName && (
                              <p><span className="font-bold opacity-70">Tên thông dụng:</span> {parseResult.compoundInfo.commonName}</p>
                            )}
                            <p><span className="font-bold opacity-70">Mô tả:</span> {parseResult.compoundInfo.description}</p>
                            {parseResult.compoundInfo.toxicity && (
                              <p className="text-red-700/80"><span className="font-bold">Độc tính:</span> {parseResult.compoundInfo.toxicity}</p>
                            )}
                            {parseResult.compoundInfo.usage && (
                              <p><span className="font-bold opacity-70">Ứng dụng:</span> {parseResult.compoundInfo.usage}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Element Details */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0] min-h-[500px]">
                {selectedElement ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-6"
                  >
                    <div className="border-b border-white/20 pb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-serif italic text-4xl">{selectedElement.name}</h3>
                        <span className="text-4xl font-bold opacity-20">{selectedElement.symbol}</span>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mt-1">
                        {getCustomElementInfo(selectedElement.number)?.category || selectedElement.category}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      {getCustomElementInfo(selectedElement.number)?.vnName && (
                        <div className="col-span-2 space-y-1">
                          <span className="opacity-40 uppercase text-[9px]">Vietnamese Name</span>
                          <p className="text-sm font-bold text-yellow-400">{getCustomElementInfo(selectedElement.number)?.vnName}</p>
                        </div>
                      )}
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Atomic Number</span>
                        <p>{selectedElement.number}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Atomic Mass</span>
                        <p>{selectedElement.atomic_mass.toFixed(4)} u</p>
                      </div>
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Electronegativity</span>
                        <p>{selectedElement.electronegativity_pauling || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Phase</span>
                        <p>{selectedElement.phase}</p>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Electron Config</span>
                        <p className="text-[10px]">{selectedElement.electron_configuration}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Melting Point</span>
                        <p>{selectedElement.melt ? `${selectedElement.melt} K` : 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Boiling Point</span>
                        <p>{selectedElement.boil ? `${selectedElement.boil} K` : 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="opacity-40 uppercase text-[9px]">Oxidation States</span>
                        <p>{selectedElement.oxidation_states || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-4">
                      {getRadioactivityInfo(selectedElement.number) && (
                        <div className={cn(
                          "p-3 rounded flex gap-3 border",
                          getRadioactivityInfo(selectedElement.number)?.type === 'danger' ? "bg-red-900/30 border-red-500/50" :
                          getRadioactivityInfo(selectedElement.number)?.type === 'warning' ? "bg-yellow-900/30 border-yellow-500/50" :
                          "bg-green-900/30 border-green-500/50"
                        )}>
                          <Radiation className={cn(
                            "w-5 h-5 shrink-0",
                            getRadioactivityInfo(selectedElement.number)?.type === 'danger' ? "text-red-500" :
                            getRadioactivityInfo(selectedElement.number)?.type === 'warning' ? "text-yellow-500" :
                            "text-green-500"
                          )} />
                          <div className="space-y-1">
                            <span className={cn(
                              "text-[10px] uppercase font-bold",
                              getRadioactivityInfo(selectedElement.number)?.type === 'danger' ? "text-red-400" :
                              getRadioactivityInfo(selectedElement.number)?.type === 'warning' ? "text-yellow-400" :
                              "text-green-400"
                            )}>
                              {getRadioactivityInfo(selectedElement.number)?.type === 'safe' ? 'Tính ổn định' : 'Cảnh báo phóng xạ'}
                            </span>
                            <p className={cn(
                              "text-[11px] leading-relaxed",
                              getRadioactivityInfo(selectedElement.number)?.type === 'danger' ? "text-red-200" :
                              getRadioactivityInfo(selectedElement.number)?.type === 'warning' ? "text-yellow-200" :
                              "text-green-200"
                            )}>
                              {getRadioactivityInfo(selectedElement.number)?.text}
                            </p>
                          </div>
                        </div>
                      )}
                      {getCustomElementInfo(selectedElement.number)?.toxicity && (
                        <div className="bg-red-900/30 border border-red-500/50 p-3 rounded flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-red-400">Cảnh báo độc tính</span>
                            <p className="text-[11px] leading-relaxed text-red-200">
                              {getCustomElementInfo(selectedElement.number)?.toxicity}
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-[11px] leading-relaxed opacity-80 italic">
                        {getCustomElementInfo(selectedElement.number)?.description || selectedElement.summary}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center">
                    <Beaker className="w-12 h-12 mb-4" />
                    <p className="text-[10px] uppercase tracking-widest">Select an element to view details</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="phys"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Unit Converter & pH */}
            <div className="lg:col-span-7 space-y-8">
              <div className="p-8 border border-[#141414] space-y-6 bg-white">
                <div className="flex items-center gap-2 opacity-40">
                  <Zap className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">High-Precision Unit Converter</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono opacity-40 uppercase">Category</label>
                    <select 
                      value={convCategory}
                      onChange={e => {
                        setConvCategory(e.target.value);
                        const units = e.target.value === 'temperature' ? ['C', 'F', 'K'] : Object.keys((categories as any)[e.target.value]);
                        setFromUnit(units[0]);
                        setToUnit(units[1] || units[0]);
                        setConvResult(null);
                      }}
                      className="w-full p-3 border border-[#141414] font-mono text-sm focus:ring-0"
                    >
                      <option value="length">Length</option>
                      <option value="area">Area</option>
                      <option value="volume">Volume</option>
                      <option value="mass">Mass</option>
                      <option value="velocity">Velocity</option>
                      <option value="pressure">Pressure</option>
                      <option value="energy">Energy</option>
                      <option value="power">Power</option>
                      <option value="temperature">Temperature</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono opacity-40 uppercase">Value</label>
                    <input 
                      type="text"
                      value={convValue}
                      onChange={e => setConvValue(e.target.value)}
                      className="w-full p-3 border border-[#141414] font-mono text-sm focus:ring-0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono opacity-40 uppercase">From</label>
                    <select 
                      value={fromUnit}
                      onChange={e => setFromUnit(e.target.value)}
                      className="w-full p-3 border border-[#141414] font-mono text-sm focus:ring-0"
                    >
                      {(convCategory === 'temperature' ? ['C', 'F', 'K'] : Object.keys((categories as any)[convCategory])).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono opacity-40 uppercase">To</label>
                    <select 
                      value={toUnit}
                      onChange={e => setToUnit(e.target.value)}
                      className="w-full p-3 border border-[#141414] font-mono text-sm focus:ring-0"
                    >
                      {(convCategory === 'temperature' ? ['C', 'F', 'K'] : Object.keys((categories as any)[convCategory])).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleConvert}
                  className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-[#141414]/90 transition-all"
                >
                  Convert
                </button>

                {convResult !== null && (
                  <div className="p-6 bg-gray-50 border border-[#141414]/10 text-center">
                    <p className="text-[10px] font-mono opacity-40 uppercase mb-1">Result</p>
                    <p className="text-2xl font-serif italic">{convResult.toLocaleString(undefined, { maximumFractionDigits: 10 })} {toUnit}</p>
                  </div>
                )}
              </div>

              {/* pH Calculator */}
              <div className="p-8 border border-[#141414] space-y-6 bg-white">
                <div className="flex items-center gap-2 opacity-40">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-mono text-[10px] uppercase tracking-widest">pH Calculator</span>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono opacity-40 uppercase">[H⁺] Concentration (mol/L)</label>
                    <input 
                      type="text"
                      value={hConc}
                      onChange={e => setHConc(e.target.value)}
                      placeholder="e.g. 1e-7"
                      className="w-full p-3 border border-[#141414] font-mono text-sm focus:ring-0"
                    />
                  </div>
                  <button 
                    onClick={handlePh}
                    className="w-full py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-[#141414]/90 transition-all"
                  >
                    Calculate pH
                  </button>
                  {phResult !== null && (
                    <div className="p-6 bg-gray-50 border border-[#141414]/10 text-center">
                      <p className="text-[10px] font-mono opacity-40 uppercase mb-1">pH Value</p>
                      <p className="text-3xl font-serif italic text-red-700">{phResult.toFixed(2)}</p>
                      <p className="text-[10px] font-mono mt-2 opacity-60">
                        {phResult < 7 ? 'Acidic' : phResult > 7 ? 'Basic' : 'Neutral'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Physical Constants */}
            <div className="lg:col-span-5">
              <div className="border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0] space-y-6 h-full flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 opacity-40">
                    <Wind className="w-4 h-4" />
                    <span className="font-mono text-[10px] uppercase tracking-widest">Fundamental Constants</span>
                  </div>
                  <input 
                    type="text"
                    placeholder="Search constants..."
                    value={constantsSearch}
                    onChange={e => setConstantsSearch(e.target.value)}
                    className="bg-transparent border-b border-white/20 font-mono text-[10px] focus:border-teal-400 outline-none px-2 py-1 w-32"
                  />
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar scroll-smooth">
                  {loading ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-20">
                      <Cpu className="w-8 h-8 animate-spin mb-2" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Fetching Data...</p>
                    </div>
                  ) : Object.keys(groupedConstants).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-4">
                      <AlertCircle className="w-8 h-8 mb-2" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">No constants found</p>
                      <p className="text-[9px] mt-1 italic">Try searching for 'h', 'c', or '001'</p>
                    </div>
                  ) : (
                    (Object.entries(groupedConstants) as [string, any[]][]).map(([category, items]) => (
                      <div key={category} className="space-y-1">
                        <button 
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center gap-2 p-2 hover:bg-white/5 transition-colors group border-b border-white/5"
                        >
                          {expandedCategories[category] ? (
                            <ChevronDown className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                          ) : (
                            <ChevronRight className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                          )}
                          <span className="font-mono text-[9px] uppercase tracking-widest text-teal-400/60 group-hover:text-teal-400 transition-colors">
                            {category} ({items.length})
                          </span>
                        </button>

                        <AnimatePresence initial={false}>
                          {expandedCategories[category] && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden space-y-1 pl-2"
                            >
                              {items.map((c) => (
                                <button 
                                  key={c.stt} 
                                  onClick={() => setExportTarget(c)}
                                  className="w-full flex justify-between items-start border-b border-white/5 pb-2 hover:bg-white/5 transition-colors p-2 rounded text-left group"
                                >
                                  <div className="flex gap-3">
                                    <span className="text-[9px] font-mono opacity-20 mt-1">{c.stt.toString().padStart(3, '0')}</span>
                                    <div>
                                      <p className="text-xs font-bold text-teal-100 group-hover:text-teal-300 transition-colors">{c.name}</p>
                                      <p className="text-[10px] opacity-50 font-mono italic">{c.symbol}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-mono break-all">{c.value}</p>
                                    <p className="text-[9px] opacity-40">{c.unit}</p>
                                  </div>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>

                {fetchError && !loading && (
                  <div className="absolute top-14 right-8 flex items-center gap-2 text-[8px] font-mono text-amber-400 opacity-60">
                    <AlertCircle className="w-3 h-3" />
                    <span>{fetchError}</span>
                  </div>
                )}

                <AnimatePresence>
                  {exportTarget && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="absolute inset-x-0 bottom-0 bg-teal-900 p-6 border-t border-teal-400/30 shadow-2xl z-20"
                    >
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-teal-100">
                          <Info className="w-4 h-4" />
                          <p className="text-xs font-mono uppercase tracking-widest">Export to Advanced Engine?</p>
                        </div>
                        <div className="bg-black/20 p-4 rounded space-y-2">
                          <div className="flex justify-between text-[10px] font-mono opacity-60">
                            <span>NAME</span>
                            <span>CATEGORY</span>
                          </div>
                          <div className="flex justify-between font-serif italic">
                            <span>{exportTarget.name}</span>
                            <span className="text-teal-400 uppercase text-[9px] font-mono not-italic">{exportTarget.category}</span>
                          </div>
                          <div className="pt-2 border-t border-white/5">
                            <p className="text-[10px] font-mono opacity-60 uppercase mb-1">VALUE</p>
                            <p className="text-sm font-mono break-all">{exportTarget.value}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              onExportToMode11(exportTarget.value);
                              setExportTarget(null);
                            }}
                            className="flex-1 py-3 bg-teal-400 text-teal-950 font-mono text-[10px] uppercase tracking-widest font-bold hover:bg-teal-300 transition-colors"
                          >
                            Confirm Export
                          </button>
                          <button 
                            onClick={() => setExportTarget(null)}
                            className="px-6 py-3 border border-teal-400/30 text-teal-100 font-mono text-[10px] uppercase tracking-widest hover:bg-white/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="pt-4 opacity-40 text-[9px] font-mono italic">
                  * High-precision values from CODATA 2018.
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Mode17() {
  const [input, setInput] = useState('0');
  const [base, setBase] = useState<'DEC' | 'HEX' | 'BIN' | 'OCT'>('DEC');
  const [bitSize, setBitSize] = useState<16 | 32 | 64>(64);

  const results = useMemo(() => {
    try {
      let num: bigint;
      const cleanInput = input.trim();
      if (!cleanInput) return null;
      
      if (base === 'DEC') num = BigInt(cleanInput);
      else if (base === 'HEX') num = BigInt('0x' + cleanInput);
      else if (base === 'BIN') num = BigInt('0b' + cleanInput);
      else num = BigInt('0o' + cleanInput);

      // 2's complement for display
      const mask = (1n << BigInt(bitSize)) - 1n;
      const masked = num & mask;

      return {
        DEC: num.toString(10),
        HEX: masked.toString(16).toUpperCase(),
        BIN: masked.toString(2).padStart(bitSize, '0'),
        OCT: masked.toString(8),
        RAW: num
      };
    } catch (e) {
      return null;
    }
  }, [input, base, bitSize]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-[#141414] pb-4">
        <div>
          <h2 className="font-serif italic text-4xl">Base-N Converter</h2>
          <p className="font-mono text-xs opacity-50 mt-2">Binary, Octal, Decimal, Hexadecimal</p>
        </div>
        <div className="flex border border-[#141414]">
          {[16, 32, 64].map(size => (
            <button 
              key={size}
              onClick={() => setBitSize(size as any)}
              className={cn(
                "px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all",
                bitSize === size ? "bg-[#141414] text-white" : "hover:bg-gray-100"
              )}
            >
              {size}-BIT
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-8 border border-[#141414] bg-white space-y-6">
            <div className="flex items-center gap-2 opacity-40">
              <Binary className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Input Value</span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {['DEC', 'HEX', 'BIN', 'OCT'].map(b => (
                  <button
                    key={b}
                    onClick={() => setBase(b as any)}
                    className={cn(
                      "py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest transition-all",
                      base === b ? "bg-[#141414] text-white" : "hover:bg-gray-100"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <input 
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                className="w-full p-4 border border-[#141414] font-mono text-2xl focus:ring-0"
                placeholder={`Enter ${base} value...`}
              />
            </div>
          </div>

          <div className="p-8 border border-[#141414] bg-[#141414] text-[#E4E3E0] space-y-6">
            <div className="flex items-center gap-2 opacity-40">
              <Info className="w-4 h-4" />
              <span className="font-mono text-[10px] uppercase tracking-widest">Conversion Logic</span>
            </div>
            <p className="text-xs font-serif italic opacity-80 leading-relaxed">
              Converts between different number bases. Supports signed 64-bit integers. 
              Binary and Hexadecimal views use 2's complement representation for the selected bit size.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {results ? (
            ['DEC', 'HEX', 'BIN', 'OCT'].map(b => (
              <div key={b} className="p-6 border border-[#141414] bg-white group hover:bg-[#141414] hover:text-white transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-40 group-hover:text-white group-hover:opacity-60">{b}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText((results as any)[b]);
                    }}
                    className="text-[10px] font-mono opacity-0 group-hover:opacity-100 hover:underline"
                  >
                    COPY
                  </button>
                </div>
                <p className="font-mono text-xl break-all">{(results as any)[b]}</p>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-[#141414] border-dashed opacity-20 p-12 text-center">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest">Invalid Input for {base}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Mode18() {
  const [coeffs, setCoeffs] = useState({ a: '3', b: '-5', c: '-11', d: '0', e: '0' });
  const [sign, setSign] = useState<'>' | '<' | '>=' | '<='>('>=');
  const [degree, setDegree] = useState<2 | 3 | 4>(2);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNumeric, setShowNumeric] = useState(false);

  const polyStrPreview = useMemo(() => {
    const { a, b, c, d, e } = coeffs;
    if (degree === 2) return `${a}x² ${parseMath(b) >= 0 ? '+' : ''}${b}x ${parseMath(c) >= 0 ? '+' : ''}${c}`;
    if (degree === 3) return `${a}x³ ${parseMath(b) >= 0 ? '+' : ''}${b}x² ${parseMath(c) >= 0 ? '+' : ''}${c}x ${parseMath(d) >= 0 ? '+' : ''}${d}`;
    return `${a}x⁴ ${parseMath(b) >= 0 ? '+' : ''}${b}x³ ${parseMath(c) >= 0 ? '+' : ''}${c}x² ${parseMath(d) >= 0 ? '+' : ''}${d}x ${parseMath(e) >= 0 ? '+' : ''}${e}`;
  }, [coeffs, degree]);

  const runFullAnalysis = async () => {
    setAnalyzing(true);
    try {
      const { a, b, c, d, e } = coeffs;
      let coeffStr = "";
      if (degree === 2) coeffStr = `${a}, ${b}, ${c}`;
      else if (degree === 3) coeffStr = `${a}, ${b}, ${c}, ${d}`;
      else coeffStr = `${a}, ${b}, ${c}, ${d}, ${e}`;
      
      const res = await analyzePolynomial(coeffStr);
      if (res.type === 'success') {
        setAnalysis(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const solveInequation = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);

    const { a, b, c, d, e } = coeffs;
    const aNum = parseMath(a);
    const bNum = parseMath(b);
    const cNum = parseMath(c);
    const dNum = parseMath(d);
    const eNum = parseMath(e);

    if (isNaN(aNum) || isNaN(bNum) || isNaN(cNum) || (degree >= 3 && isNaN(dNum)) || (degree >= 4 && isNaN(eNum))) {
      setError("Please enter valid coefficients.");
      setLoading(false);
      return;
    }

    const currentCoeffs = degree === 2 ? [aNum, bNum, cNum] : 
                         degree === 3 ? [aNum, bNum, cNum, dNum] : 
                         [aNum, bNum, cNum, dNum, eNum];

    // Use local solver for all degrees (2-4) for instant results
    const local = solvePolynomialInequation(currentCoeffs, sign);
    if (local) {
      setResult(local);
      setLoading(false);
      return;
    }

    setError("Failed to solve locally.");
    setLoading(false);
  };

  const refineSymbolic = async () => {
    if (!result || result.roots.length === 0) return;
    setLoading(true);
    try {
      const { a, b, c, d, e } = coeffs;
      const polyStr = degree === 2 ? `${a}x^2 + ${b}x + ${c}` : 
                      degree === 3 ? `${a}x^3 + ${b}x^2 + ${c}x + ${d}` : 
                      `${a}x^4 + ${b}x^3 + ${c}x^2 + ${d}x + ${e}`;
      
      const query = `Solve the inequation ${polyStr} ${sign} 0 exactly.
      Provide the roots and intervals in exact symbolic form:
      - Integers: 5
      - Fractions: 3/4
      - Radicals: a√b/c
      - Complex Radicals: (a√b + c√d)/e
      
      Ensure all expressions are fully simplified.
      Format the output as a JSON object with:
      - "symbolic": "The exact symbolic solution string"
      - "roots": ["root1", "root2", ...] (as exact strings)
      `;

      const response = await solveAdvancedMath(query, "Symbolic Refiner");
      if (response.type === 'error') throw new Error(response.content);
      
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const refined = JSON.parse(jsonMatch[0]);
        setResult({ ...result, symbolic: refined.symbolic, refinedRoots: refined.roots });
      }
    } catch (err: any) {
      setError("Refinement failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b border-[#141414] pb-4">
        <div>
          <h2 className="font-serif italic text-4xl">Inequation Solver</h2>
          <p className="font-mono text-xs opacity-50 mt-2">Degree 2-4 Polynomial Inequations</p>
        </div>
        <div className="flex border border-[#141414]">
          {[2, 3, 4].map(deg => (
            <button 
              key={deg}
              onClick={() => {
                setDegree(deg as any);
                setResult(null);
              }}
              className={cn(
                "px-6 py-2 font-mono text-[10px] uppercase tracking-widest transition-all",
                degree === deg ? "bg-[#141414] text-white" : "hover:bg-gray-100"
              )}
            >
              DEG {deg}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 border border-[#141414] bg-white space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 opacity-40">
                <Calculator className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Coefficients</span>
              </div>
              <div className="font-serif italic text-sm text-teal-600">
                {polyStrPreview} {sign} 0
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono opacity-40 uppercase">a (x^{degree})</label>
                <input type="text" value={coeffs.a} onChange={e => setCoeffs({...coeffs, a: e.target.value})} className="w-full p-3 border border-[#141414] font-mono text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono opacity-40 uppercase">b (x^{degree-1})</label>
                <input type="text" value={coeffs.b} onChange={e => setCoeffs({...coeffs, b: e.target.value})} className="w-full p-3 border border-[#141414] font-mono text-sm" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono opacity-40 uppercase">c (x^{degree-2})</label>
                <input type="text" value={coeffs.c} onChange={e => setCoeffs({...coeffs, c: e.target.value})} className="w-full p-3 border border-[#141414] font-mono text-sm" />
              </div>
              {degree >= 3 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-40 uppercase">d (x^{degree-3})</label>
                  <input type="text" value={coeffs.d} onChange={e => setCoeffs({...coeffs, d: e.target.value})} className="w-full p-3 border border-[#141414] font-mono text-sm" />
                </div>
              )}
              {degree >= 4 && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono opacity-40 uppercase">e (const)</label>
                  <input type="text" value={coeffs.e} onChange={e => setCoeffs({...coeffs, e: e.target.value})} className="w-full p-3 border border-[#141414] font-mono text-sm" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-mono opacity-40 uppercase">Sign</label>
                <select value={sign} onChange={e => setSign(e.target.value as any)} className="w-full p-3 border border-[#141414] font-mono text-sm">
                  <option value=">">{'>'}</option>
                  <option value="<">{'<'}</option>
                  <option value=">=">{'≥'}</option>
                  <option value="<=">{'≤'}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={solveInequation}
                disabled={loading}
                className="flex-1 py-4 bg-[#141414] text-[#E4E3E0] font-mono text-xs uppercase tracking-widest hover:bg-[#141414]/90 transition-all disabled:opacity-50"
              >
                {loading ? 'Solving...' : 'Solve Inequation'}
              </button>
              <button 
                onClick={runFullAnalysis}
                disabled={analyzing}
                className="px-4 py-4 border border-[#141414] text-[#141414] font-mono text-xs uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
                title="Run Full Polynomial Analysis"
              >
                {analyzing ? '...' : <Info className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0] min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 opacity-40">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Solution</span>
              </div>
              {result && (
                <button 
                  onClick={() => setShowNumeric(!showNumeric)}
                  className="px-4 py-1 border border-white/20 font-mono text-[9px] uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  {showNumeric ? 'Show Symbolic' : 'Convert to Numeric (25 Digits)'}
                </button>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-400 p-4 bg-red-400/10 border border-red-400/20">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm font-mono">{error}</p>
              </div>
            )}

            {result ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center items-center gap-4">
                    <p className="text-[10px] font-mono opacity-40 uppercase tracking-[0.3em]">Resulting Interval</p>
                    <button 
                      onClick={refineSymbolic}
                      disabled={loading}
                      className="px-3 py-1 border border-white/20 text-[8px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Refining...' : 'Refine Symbolic'}
                    </button>
                  </div>
                  <div className="text-3xl md:text-4xl font-serif italic leading-relaxed">
                    {(() => {
                      const displayStr = showNumeric ? result.numeric : result.symbolic;
                      const rootMap = new Map<string, string>();
                      const rootsList = result.refinedRoots || result.roots;
                      
                      if (!rootsList || rootsList.length === 0) return displayStr;
                      
                      rootsList.forEach((r: any) => {
                        const isDecimal = typeof r === 'object' && r !== null && typeof r.toNumber === 'function';
                        const isNumber = typeof r === 'number';
                        const shortVal = isDecimal || isNumber ? formatRoot(r) : r;
                        const fullVal = isDecimal ? r.toFixed(25) : isNumber ? r.toString() : r;
                        rootMap.set(shortVal, fullVal);
                      });

                      const sortedRoots = Array.from<string>(rootMap.keys()).sort((a: string, b: string) => b.length - a.length);
                      if (sortedRoots.length === 0) return displayStr;

                      const escapedRoots = sortedRoots.map((r: string) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
                      const regex = new RegExp(`(${escapedRoots.join('|')})`, 'g');
                      
                      const parts = displayStr.split(regex);
                      
                      return parts.map((part: string, i: number) => {
                        if (rootMap.has(part)) {
                          const fullVal = rootMap.get(part)!;
                          return (
                            <span key={i} className="group relative inline-block cursor-pointer mx-0.5" onClick={() => navigator.clipboard.writeText(fullVal)}>
                              <span className="border-b border-dashed border-white/30 hover:text-rose-300 transition-colors">
                                {part}
                              </span>
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                                <span className="bg-[#E4E3E0] text-[#141414] text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap font-bold font-sans not-italic">
                                  {fullVal} (Click to copy)
                                </span>
                              </span>
                            </span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      });
                    })()}
                  </div>
                </motion.div>

                {result.intervals && (
                  <div className="w-full pt-8 border-t border-white/10">
                    <div className="flex justify-center gap-4 flex-wrap">
                      {result.intervals.map((interval: any, i: number) => {
                        const startStr = interval.start === -Infinity ? '-∞' : formatRoot(interval.start);
                        const endStr = interval.end === Infinity ? '+∞' : formatRoot(interval.end);
                        return (
                          <div key={i} className="px-4 py-2 bg-white/5 border border-white/10 rounded-sm font-mono text-xs">
                            {interval.startClosed ? '[' : '('}
                            {startStr}
                            {', '}
                            {endStr}
                            {interval.endClosed ? ']' : ')'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="w-full pt-8 border-t border-white/10">
                  <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest mb-4">Roots</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(result.refinedRoots || result.roots).map((r: any, idx: number) => {
                      const isDecimal = typeof r === 'object' && r !== null && typeof r.toNumber === 'function';
                      const isNumber = typeof r === 'number';
                      const displayVal = isDecimal || isNumber ? formatRoot(r) : r;
                      const fullVal = isDecimal ? r.toFixed(25) : isNumber ? r.toString() : r;
                      
                      return (
                        <div key={idx} className="p-3 border border-white/5 bg-white/5 space-y-1" title={fullVal}>
                          <div className="font-mono text-[8px] opacity-40 uppercase tracking-widest">x_{idx+1}</div>
                          <div className="font-serif italic text-sm">
                            {displayVal}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {analysis && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full pt-8 border-t border-white/10 space-y-6 text-left"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Roots (Analysis)</p>
                        <div className="space-y-1">
                          {analysis.roots.map((r: string, i: number) => (
                            <div key={i} className="text-xs font-serif italic border-b border-white/5 pb-1">{r}</div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Extrema</p>
                        <div className="space-y-1">
                          {analysis.extrema.map((e: any, i: number) => (
                            <div key={i} className="text-xs font-serif italic border-b border-white/5 pb-1">
                              <span className="text-[8px] uppercase font-mono bg-white/10 px-1 mr-2">{e.type}</span>
                              ({e.x}, {e.y})
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-mono opacity-40 uppercase tracking-widest">Behavior Summary</p>
                      <p className="text-xs opacity-70 leading-relaxed">{analysis.summary}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : !loading && (
              <div className="flex-1 flex flex-col items-center justify-center opacity-20 text-center">
                <Calculator className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-widest">Enter coefficients and solve</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Mode19({ userFunctions, setUserFunctions }: { 
  userFunctions: { f: string, g: string, h: string }, 
  setUserFunctions: React.Dispatch<React.SetStateAction<{ f: string, g: string, h: string }>> 
}) {
  return (
    <div className="space-y-8">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-4xl">Mode 19: Function Lab</h2>
        <p className="font-mono text-xs opacity-50 mt-2">Define f(x), g(x), h(x) for use in Advanced Engine</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {(['f', 'g', 'h'] as const).map((func) => (
          <div key={func} className="space-y-4 p-6 border border-[#141414] bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center font-serif italic text-xl rounded-sm">
                {func}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Function Definition</span>
            </div>
            
            <div className="space-y-2">
              <label className="block font-mono text-[10px] uppercase opacity-60">{func}(x) =</label>
              <input 
                type="text"
                value={userFunctions[func]}
                onChange={(e) => setUserFunctions(prev => ({ ...prev, [func]: e.target.value }))}
                className="w-full p-4 border border-[#141414] font-mono text-lg focus:ring-0 bg-gray-50"
                placeholder={`Enter ${func}(x) formula...`}
              />
            </div>
            
            <div className="pt-4 border-t border-[#141414]/10">
              <p className="text-[9px] font-mono opacity-40 leading-relaxed uppercase">
                Supports Python/WolframAlpha syntax. Use 'x' as the variable.
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 border border-[#141414] bg-[#141414] text-[#E4E3E0] space-y-4">
        <div className="flex items-center gap-2 opacity-40">
          <Info className="w-4 h-4" />
          <span className="font-mono text-[10px] uppercase tracking-widest">Usage Instructions</span>
        </div>
        <div className="space-y-2 text-sm font-serif italic opacity-80">
          <p>1. Define your functions f(x), g(x), and h(x) above.</p>
          <p>2. Switch to <span className="font-bold">Mode 11: Advanced Engine</span>.</p>
          <p>3. Use them in your expressions, e.g., <span className="font-mono bg-white/10 px-2 rounded">f(g(h(2)))</span> or <span className="font-mono bg-white/10 px-2 rounded">Derivative of f(g(x))</span>.</p>
          <p>4. The engine supports up to 3 levels of nesting as requested.</p>
        </div>
      </div>
    </div>
  );
}

type Expression = { id: string; text: string; color: string; visible: boolean; error?: string };

const COLORS = ['#4338ca', '#b91c1c', '#047857', '#b45309', '#6d28d9', '#0f766e'];

function Mode20() {
  const [activeTab, setActiveTab] = useState<'2d' | '3d' | '4d'>('4d');
  const [visType4d, setVisType4d] = useState<'manifold' | 'scalar'>('manifold');
  
  const [exprs2d, setExprs2d] = useState<Expression[]>([{ id: '1', text: 'sin(x)', color: COLORS[0], visible: true }]);
  const [exprs3d, setExprs3d] = useState<Expression[]>([{ id: '1', text: 'sin(x) * cos(y)', color: COLORS[0], visible: true }]);
  const [exprs4d, setExprs4d] = useState<Expression[]>([{ id: '1', text: 'cos(x) * sin(y) * cos(z)', color: COLORS[0], visible: true }]);
  
  const [resolution, setResolution] = useState(30);
  const [range, setRange] = useState(5);

  const [range2d, setRange2d] = useState({ x: [-5, 5], y: [-5, 5] });
  const [range3d, setRange3d] = useState({ x: [-5, 5], y: [-5, 5], z: [-5, 5] });

  const containerRef2d = React.useRef<HTMLDivElement>(null);
  const dims2d = useContainerDimensions(containerRef2d);
  const adjustedRange2d = useMemo(() => {
    return getPerfectSquareRange(range2d, dims2d.width, dims2d.height);
  }, [range2d, dims2d]);

  const { items: precItems, loading: precLoading, error: precError } = usePrecisionAnalysis(exprs2d, adjustedRange2d);

  // Deformation parameters for 4D Manifold
  const [epsilon, setEpsilon] = useState(0.2);
  const [k, setK] = useState(1.5);
  const [lambda0, setLambda0] = useState(1.2);
  const [r5, setR5] = useState(0.8);
  const [alpha, setAlpha] = useState(2.5);
  const [ls, setLs] = useState(1.5);
  const [nModes, setNModes] = useState(5);
  
  const [showHyperbolic, setShowHyperbolic] = useState(true);
  const [showKK, setShowKK] = useState(true);
  const [showString, setShowString] = useState(true);
  const [showFractal, setShowFractal] = useState(true);
  const [showPrimes, setShowPrimes] = useState(false);
  const [primes, setPrimes] = useState<number[]>([]);

  useEffect(() => {
    fetch('/api/primes').then(res => res.json()).then(data => setPrimes(data.primes)).catch(() => {});
  }, []);

  const isPrimeFast = (n: number) => {
    if (n < 2) return false;
    if (primes.length > 0 && n <= primes[primes.length - 1]) {
      return primes.includes(n);
    }
    for (let i = 2; i * i <= n; i++) {
      if (n % i === 0) return false;
    }
    return true;
  };

  const project4dTo3d = (x: number, y: number, z: number, w: number, theta = 0.6, phi = 0.8, scale = 0.4) => {
    const x2 = x * Math.cos(theta) - w * Math.sin(theta);
    const w2 = x * Math.sin(theta) + w * Math.cos(theta);
    const y2 = y * Math.cos(phi) - w2 * Math.sin(phi);
    const w3 = y * Math.sin(phi) + w2 * Math.cos(phi);
    const factor = 1 / (1 + scale * w3);
    return { x: x2 * factor, y: y2 * factor, z: z * factor, w: w3 };
  };

  const projectToSubspace = (x: number, y: number, z: number, w: number, subspace: 'Oxyz' | 'Oxzt' | 'Oxyt' | 'Oyzt') => {
    switch (subspace) {
      case 'Oxyz': return { x, y, z };
      case 'Oxzt': return { x, y: z, z: w };
      case 'Oxyt': return { x, y, z: w };
      case 'Oyzt': return { x: y, y: z, z: w };
    }
  };

  const applyDeformations = (x: number, y: number, z: number, w: number) => {
    const r = Math.sqrt(x*x + y*y + z*z + w*w);
    let dx = 0, dy = 0, dz = 0, dw = 0;
    
    if (showHyperbolic) {
      const hyp = epsilon * Math.sinh(k * r / 10);
      dx += hyp; dy += hyp; dz += hyp; dw += Math.cosh(k * r / 10) * epsilon;
    }
    if (showKK) {
      const kk = Math.exp(-(r5*r5) / alpha) * epsilon;
      dx += x * kk; dy += y * kk; dz += z * kk; dw += w * kk;
    }
    if (showString) {
      for (let n = 1; n <= nModes; n++) {
        const arg = (2 * Math.PI * n / ls) * r;
        const factor = epsilon / (n * 2);
        dx += Math.cos(arg) * x * factor;
        dy += Math.cos(arg) * y * factor;
        dz += Math.sin(arg) * z * factor;
        dw += Math.sin(arg) * w * factor;
      }
    }
    if (showFractal) {
      const c = lambda0 + epsilon * Math.sin(2 * Math.PI * r);
      const J = Math.exp(-r / 5) * Math.cos(c * r);
      dx += x * epsilon * J;
      dy += y * epsilon * J;
      dz += z * epsilon * J;
      dw += w * epsilon * J;
    }
    if (showPrimes) {
      const radiusInt = Math.floor(r * 10);
      if (isPrimeFast(radiusInt)) {
        const pFactor = epsilon * 0.5;
        dx += x * pFactor;
        dy += y * pFactor;
        dz += z * pFactor;
        dw += w * pFactor;
      }
    }
    return { x: x + dx, y: y + dy, z: z + dz, w: w + dw };
  };

  const generateData = useMemo(() => {
    const steps = resolution;
    const results: any = {
      plots2d: [],
      plots3d: [],
      slice1: { x: [], y: [], z: [], t: [] },
      slice2: { x: [], y: [], t: [] },
      slice3: { x: [], z: [], t: [] },
      slice4: { y: [], z: [], t: [] },
      manifold: {
        Oxyz: { x: [], y: [], z: [], w: [] },
        Oxzt: { x: [], y: [], z: [], w: [] },
        Oxyt: { x: [], y: [], z: [], w: [] },
        Oyzt: { x: [], y: [], z: [], w: [] }
      }
    };

    if (activeTab === '2d') {
      const xMin = adjustedRange2d.x[0], xMax = adjustedRange2d.x[1];
      const uLong = Array.from({ length: steps * 4 }, (_, i) => xMin + (i * (xMax - xMin)) / (steps * 4 - 1));
      
      const findRootsOfExpr = (compiled: any, start: number, end: number) => {
        const checkSteps = 120;
        const pts = [];
        const stepSize = (end - start) / checkSteps;
        let prevX = start;
        let prevY = NaN;
        try {
          prevY = compiled.evaluate({ x: prevX });
        } catch {}

        for (let i = 1; i <= checkSteps; i++) {
          const currX = start + i * stepSize;
          let currY = NaN;
          try {
            currY = compiled.evaluate({ x: currX });
          } catch {
            continue;
          }

          if (isNaN(currY) || !isFinite(currY)) {
            prevX = currX;
            prevY = currY;
            continue;
          }

          if (Math.abs(prevY) < 1e-12) {
            pts.push(prevX);
          }

          if (!isNaN(prevY) && isFinite(prevY) && prevY * currY < 0) {
            let left = prevX;
            let right = currX;
            for (let b = 0; b < 8; b++) {
              const mid = (left + right) / 2;
              let yMid = NaN;
              try {
                yMid = compiled.evaluate({ x: mid });
              } catch {
                break;
              }
              if (Math.abs(yMid) < 1e-14) {
                left = mid;
                break;
              }
              if (yMid * prevY < 0) {
                right = mid;
              } else {
                left = mid;
              }
            }
            pts.push((left + right) / 2);
          }

          prevX = currX;
          prevY = currY;
        }

        if (Math.abs(prevY) < 1e-12) {
          pts.push(prevX);
        }

        const uniqueRoots: number[] = [];
        pts.forEach(r => {
          if (uniqueRoots.length === 0 || Math.abs(r - uniqueRoots[uniqueRoots.length - 1]) > (end - start) / 500) {
            uniqueRoots.push(r);
          }
        });
        return uniqueRoots;
      };

      exprs2d.forEach(expr => {
        if (!expr.visible || !expr.text.trim()) return;
        try {
          const compiled = math.compile(expr.text);
          const yVals = uLong.map(x => compiled.evaluate({ x }));
          results.plots2d.push({ x: uLong, y: yVals, color: expr.color, name: expr.text });

          const roots = findRootsOfExpr(compiled, xMin, xMax);
          if (roots.length > 0) {
            results.plots2d.push({
              x: roots,
              y: roots.map(() => 0),
              isRoot: true,
              color: expr.color,
              name: `Nghiệm ${expr.text} = 0`
            });
          }
        } catch (e) {
          // Ignore invalid expressions
        }
      });
    } else if (activeTab === '3d') {
      const xMin = range3d.x[0], xMax = range3d.x[1];
      const yMin = range3d.y[0], yMax = range3d.y[1];
      const u = Array.from({ length: steps }, (_, i) => xMin + (i * (xMax - xMin)) / (steps - 1));
      const v = Array.from({ length: steps }, (_, i) => yMin + (i * (yMax - yMin)) / (steps - 1));
      
      exprs3d.forEach(expr => {
        if (!expr.visible || !expr.text.trim()) return;
        try {
          const compiled = math.compile(expr.text);
          const zGrid: number[][] = [];
          for (const yi of v) {
            const row: number[] = [];
            for (const xi of u) {
              row.push(compiled.evaluate({ x: xi, y: yi }));
            }
            zGrid.push(row);
          }
          results.plots3d.push({ x: u, y: v, z: zGrid, color: expr.color, name: expr.text });
        } catch (e) {
          // Ignore invalid expressions
        }
      });
    } else {
      const expr = exprs4d.find(e => e.visible && e.text.trim());
      if (expr) {
        try {
          const compiled = math.compile(expr.text);
          
          if (visType4d === 'scalar') {
            const x = Array.from({ length: steps }, (_, i) => -range + (i * 2 * range) / (steps - 1));
            const y = Array.from({ length: steps }, (_, i) => -range + (i * 2 * range) / (steps - 1));
            const z = Array.from({ length: steps }, (_, i) => -range + (i * 2 * range) / (steps - 1));

            const stepVol = Math.max(2, Math.floor(steps / 2));
            const xVol = Array.from({ length: stepVol }, (_, i) => -range + (i * 2 * range) / (stepVol - 1));
            const yVol = Array.from({ length: stepVol }, (_, i) => -range + (i * 2 * range) / (stepVol - 1));
            const zVol = Array.from({ length: stepVol }, (_, i) => -range + (i * 2 * range) / (stepVol - 1));

            for (let i = 0; i < stepVol; i++) {
              for (let j = 0; j < stepVol; j++) {
                for (let k = 0; k < stepVol; k++) {
                  const xi = xVol[i], yi = yVol[j], zi = zVol[k];
                  const ti = compiled.evaluate({ x: xi, y: yi, z: zi });
                  results.slice1.x.push(xi);
                  results.slice1.y.push(yi);
                  results.slice1.z.push(zi);
                  results.slice1.t.push(ti);
                }
              }
            }

            for (let i = 0; i < steps; i++) {
              const rowX = [], rowY = [], rowT = [];
              for (let j = 0; j < steps; j++) {
                const xi = x[i], yi = y[j], zi = 0;
                const ti = compiled.evaluate({ x: xi, y: yi, z: zi });
                rowX.push(xi);
                rowY.push(yi);
                rowT.push(ti);
              }
              results.slice2.x.push(rowX);
              results.slice2.y.push(rowY);
              results.slice2.t.push(rowT);
            }

            for (let i = 0; i < steps; i++) {
              const rowX = [], rowZ = [], rowT = [];
              for (let j = 0; j < steps; j++) {
                const xi = x[i], yi = 0, zi = z[j];
                const ti = compiled.evaluate({ x: xi, y: yi, z: zi });
                rowX.push(xi);
                rowZ.push(zi);
                rowT.push(ti);
              }
              results.slice3.x.push(rowX);
              results.slice3.z.push(rowZ);
              results.slice3.t.push(rowT);
            }

            for (let i = 0; i < steps; i++) {
              const rowY = [], rowZ = [], rowT = [];
              for (let j = 0; j < steps; j++) {
                const xi = 0, yi = y[i], zi = z[j];
                const ti = compiled.evaluate({ x: xi, y: yi, z: zi });
                rowY.push(yi);
                rowZ.push(zi);
                rowT.push(ti);
              }
              results.slice4.y.push(rowY);
              results.slice4.z.push(rowZ);
              results.slice4.t.push(rowT);
            }
          } else {
            // Manifold
            const xMin = range3d.x[0], xMax = range3d.x[1];
            const yMin = range3d.y[0], yMax = range3d.y[1];
            const zMin = range3d.z[0], zMax = range3d.z[1];
            
            const u = Array.from({ length: steps }, (_, i) => xMin + (i * (xMax - xMin)) / (steps - 1));
            const v = Array.from({ length: steps }, (_, i) => yMin + (i * (yMax - yMin)) / (steps - 1));
            
            const sliceCount = 8;
            const wSlices = Array.from({ length: sliceCount }, (_, i) => zMin + (i * (zMax - zMin)) / (sliceCount - 1));
            
            const subspaces: ('Oxyz' | 'Oxzt' | 'Oxyt' | 'Oyzt')[] = ['Oxyz', 'Oxzt', 'Oxyt', 'Oyzt'];

            for (const zi_coord of wSlices) {
              const sliceData: any = {
                Oxyz: { x: [], y: [], z: [], w: [] },
                Oxzt: { x: [], y: [], z: [], w: [] },
                Oxyt: { x: [], y: [], z: [], w: [] },
                Oyzt: { x: [], y: [], z: [], w: [] }
              };
              
              for (const yi of v) {
                for (const xi of u) {
                  const wi = compiled.evaluate({ x: xi, y: yi, z: zi_coord });
                  const def = applyDeformations(xi, yi, zi_coord, wi);
                  
                  for (const sub of subspaces) {
                    const proj = projectToSubspace(def.x, def.y, def.z, def.w, sub);
                    sliceData[sub].x.push(proj.x);
                    sliceData[sub].y.push(proj.y);
                    sliceData[sub].z.push(proj.z);
                    sliceData[sub].w.push(def.w);
                  }
                }
              }

              for (const sub of subspaces) {
                results.manifold[sub].x.push(sliceData[sub].x);
                results.manifold[sub].y.push(sliceData[sub].y);
                results.manifold[sub].z.push(sliceData[sub].z);
                results.manifold[sub].w.push(sliceData[sub].w);
              }
            }
          }
        } catch (e) {
          console.error("Math error:", e);
        }
      }
    }
    return results;
  }, [resolution, range, activeTab, visType4d, exprs2d, exprs3d, exprs4d, adjustedRange2d, range3d, epsilon, k, lambda0, r5, alpha, ls, nModes, showHyperbolic, showKK, showString, showFractal, showPrimes]);

  const axes4d = useMemo(() => {
    const scale = Math.max(Math.abs(range3d.x[0]), Math.abs(range3d.x[1])) * 1.5;
    const axes = [
      { p: [scale, 0, 0, 0], color: 'blue', label: 'Ox' },
      { p: [0, scale, 0, 0], color: 'green', label: 'Oy' },
      { p: [0, 0, scale, 0], color: 'orange', label: 'Oz' },
      { p: [0, 0, 0, scale], color: 'red', label: 'Ot', dash: 'dash' }
    ];
    return axes.map(a => {
      const proj = project4dTo3d(a.p[0], a.p[1], a.p[2], a.p[3]);
      return {
        x: [0, proj.x], y: [0, proj.y], z: [0, proj.z],
        mode: 'lines+text', type: 'scatter3d',
        line: { color: a.color, width: 4, dash: a.dash || 'solid' },
        text: ['', a.label], name: a.label, showlegend: false
      };
    });
  }, [range3d]);

  const handleRelayout2d = (event: any) => {
    if (event['xaxis.range[0]'] !== undefined) {
      setRange2d({
        x: [event['xaxis.range[0]'], event['xaxis.range[1]']],
        y: [event['yaxis.range[0]'], event['yaxis.range[1]']]
      });
    } else if (event['xaxis.autorange'] || event['yaxis.autorange']) {
      setRange2d({ x: [-5, 5], y: [-5, 5] });
    }
  };

  const handleRelayout3d = (event: any) => {
    if (event['scene.xaxis.range[0]'] !== undefined) {
      setRange3d({
        x: [event['scene.xaxis.range[0]'], event['scene.xaxis.range[1]']],
        y: [event['scene.yaxis.range[0]'], event['scene.yaxis.range[1]']],
        z: [event['scene.zaxis.range[0]'], event['scene.zaxis.range[1]']]
      });
    } else if (event['scene.autorange']) {
      setRange3d({ x: [-5, 5], y: [-5, 5], z: [-5, 5] });
    }
  };

  const handleZoom = (factor: number) => {
    if (activeTab === '2d') {
      setRange2d(prev => ({
        x: [Math.max(-50, prev.x[0] * factor), Math.min(50, prev.x[1] * factor)],
        y: [Math.max(-50, prev.y[0] * factor), Math.min(50, prev.y[1] * factor)]
      }));
    } else if (activeTab === '3d') {
      setRange3d(prev => ({
        x: [Math.max(-50, prev.x[0] * factor), Math.min(50, prev.x[1] * factor)],
        y: [Math.max(-50, prev.y[0] * factor), Math.min(50, prev.y[1] * factor)],
        z: [Math.max(-50, prev.z[0] * factor), Math.min(50, prev.z[1] * factor)]
      }));
    } else {
      setRange(prev => Math.min(50, prev * factor));
    }
  };

  const handleZoomIn = () => handleZoom(0.8);
  const handleZoomOut = () => handleZoom(1.25);

  const resetView = () => {
    setRange2d({ x: [-5, 5], y: [-5, 5] });
    setRange3d({ x: [-5, 5], y: [-5, 5], z: [-5, 5] });
    setRange(5);
  };

  const getCommonLayout = (xRange: number[], yRange: number[], zRange: number[], xTitle = 'X', yTitle = 'Y', zTitle = 'Z'): any => ({
    autosize: true,
    margin: { l: 0, r: 0, b: 0, t: 30 },
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      aspectmode: 'cube',
      xaxis: { title: xTitle, gridcolor: '#ccc', gridwidth: 1, range: xRange, griddash: 'dot', dtick: (xRange[1] - xRange[0]) / 10 },
      yaxis: { title: yTitle, gridcolor: '#ccc', gridwidth: 1, range: yRange, griddash: 'dot', dtick: (yRange[1] - yRange[0]) / 10 },
      zaxis: { title: zTitle, gridcolor: '#ccc', gridwidth: 1, range: zRange, griddash: 'dot', dtick: (zRange[1] - zRange[0]) / 10 },
      camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } }
    }
  });

  const tesseractSlice = (color = 'rgba(0,0,0,0.1)') => ({
    type: 'mesh3d',
    x: [-1, 1, 1, -1, -1, 1, 1, -1],
    y: [-1, -1, 1, 1, -1, -1, 1, 1],
    z: [-1, -1, -1, -1, 1, 1, 1, 1],
    i: [7, 0, 0, 0, 4, 4, 6, 6, 4, 0, 3, 2],
    j: [3, 4, 1, 2, 5, 6, 5, 2, 0, 1, 6, 3],
    k: [0, 7, 2, 3, 6, 7, 1, 1, 5, 5, 7, 6],
    opacity: 0.1,
    color: color,
    showscale: false,
    hoverinfo: 'none'
  });

  const addExpression = () => {
    const newExpr = { id: Math.random().toString(36).substring(7), text: '', color: COLORS[Math.floor(Math.random() * COLORS.length)], visible: true };
    if (activeTab === '2d') setExprs2d([...exprs2d, newExpr]);
    else if (activeTab === '3d') setExprs3d([...exprs3d, newExpr]);
    else setExprs4d([...exprs4d, newExpr]);
  };

  const updateExpression = (id: string, text: string) => {
    if (activeTab === '2d') setExprs2d(exprs2d.map(e => e.id === id ? { ...e, text } : e));
    else if (activeTab === '3d') setExprs3d(exprs3d.map(e => e.id === id ? { ...e, text } : e));
    else setExprs4d(exprs4d.map(e => e.id === id ? { ...e, text } : e));
  };

  const toggleVisibility = (id: string) => {
    if (activeTab === '2d') setExprs2d(exprs2d.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
    else if (activeTab === '3d') setExprs3d(exprs3d.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
    else setExprs4d(exprs4d.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
  };

  const removeExpression = (id: string) => {
    if (activeTab === '2d') setExprs2d(exprs2d.filter(e => e.id !== id));
    else if (activeTab === '3d') setExprs3d(exprs3d.filter(e => e.id !== id));
    else setExprs4d(exprs4d.filter(e => e.id !== id));
  };

  const currentExprs = activeTab === '2d' ? exprs2d : activeTab === '3d' ? exprs3d : exprs4d;

  const currentExprsWithErrors = currentExprs.map(expr => {
    let error = undefined;
    if (expr.text.trim()) {
      try {
        math.compile(expr.text);
      } catch (e: any) {
        error = e.message;
      }
    }
    return { ...expr, error };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#141414] pb-6">
        <div>
          <h2 className="font-serif italic text-4xl text-rose-700">Geogebra Geometry Viewer</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-50 font-mono mt-2">Ultimate 2D, 3D, and 4D Graphing Suite</p>
        </div>
        <div className="flex bg-[#F8F7F4] border border-[#141414] p-1">
          {(['2d', '3d', '4d'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 text-[10px] font-mono uppercase tracking-widest transition-all",
                activeTab === tab ? "bg-[#141414] text-white" : "hover:bg-black/5"
              )}
            >
              {tab} Environment
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="p-4 border border-[#141414] bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col h-[600px]">
            <div className="flex items-center justify-between opacity-40 mb-4">
              <div className="flex items-center gap-2">
                <FunctionSquare className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">Algebra View</span>
              </div>
              <button onClick={addExpression} className="hover:text-rose-700 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {currentExprsWithErrors.map((expr, index) => (
                <div key={expr.id} className="flex flex-col p-2 border border-[#141414] bg-[#F8F7F4] group">
                  <div className="flex items-start gap-2">
                    <button 
                      onClick={() => toggleVisibility(expr.id)}
                      className="mt-1 w-4 h-4 rounded-full border border-[#141414] flex-shrink-0 transition-colors"
                      style={{ backgroundColor: expr.visible ? expr.color : 'transparent' }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif italic text-sm text-rose-700">
                          {activeTab === '2d' ? `f_${index + 1}(x) =` : activeTab === '3d' ? `f_${index + 1}(x,y) =` : `f(x,y,z) =`}
                        </span>
                        <button onClick={() => removeExpression(expr.id)} className="opacity-0 group-hover:opacity-50 hover:!opacity-100 ml-auto">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={expr.text} 
                        onChange={e => updateExpression(expr.id, e.target.value)}
                        placeholder="Enter expression..."
                        className="w-full bg-transparent border-b border-transparent focus:border-[#141414] font-mono text-xs outline-none py-1"
                      />
                    </div>
                  </div>
                  {expr.error && (
                    <div className="text-[10px] text-red-600 font-mono mt-1 ml-6">
                      Error: {expr.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-[#141414]/10 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-mono">
                  <span>Resolution</span>
                  <span>{resolution}</span>
                </div>
                <input type="range" min="10" max="60" step="1" value={resolution} onChange={e => setResolution(parseInt(e.target.value))} className="w-full accent-rose-700" />
              </div>
              
              {activeTab === '4d' && visType4d === 'scalar' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span>Range (±)</span>
                    <span>{range.toFixed(2)}</span>
                  </div>
                  <input type="range" min="1" max="10" step="0.1" value={range} onChange={e => setRange(parseFloat(e.target.value))} className="w-full accent-rose-700" />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleZoomIn}
                className="flex-1 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-all"
              >
                Zoom In (+)
              </button>
              <button 
                onClick={handleZoomOut}
                className="flex-1 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-all"
              >
                Zoom Out (-)
              </button>
            </div>
            <button 
              onClick={resetView}
              className="w-full mt-2 py-2 border border-[#141414] font-mono text-[10px] uppercase tracking-widest hover:bg-[#141414] hover:text-white transition-all"
            >
              Reset Viewport
            </button>
          </div>

          {activeTab === '4d' && (
            <div className="p-6 border border-[#141414] bg-white space-y-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
              <div className="flex items-center gap-2 opacity-40">
                <Layers className="w-4 h-4" />
                <span className="font-mono text-[10px] uppercase tracking-widest">4D Mode</span>
              </div>
              <div className="flex bg-[#F8F7F4] border border-[#141414] p-1">
                {(['manifold', 'scalar'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setVisType4d(type)}
                    className={cn(
                      "flex-1 py-2 text-[10px] font-mono uppercase tracking-widest transition-all",
                      visType4d === type ? "bg-[#141414] text-white" : "hover:bg-black/5"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {visType4d === 'manifold' && (
                <>
                  <div className="space-y-4 pt-4 border-t border-[#141414]/10">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>ε (Deformation)</span>
                        <span>{epsilon.toFixed(2)}</span>
                      </div>
                      <input type="range" min="0" max="1" step="0.01" value={epsilon} onChange={e => setEpsilon(parseFloat(e.target.value))} className="w-full accent-rose-700" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>k (Hyperbolic)</span>
                        <span>{k.toFixed(1)}</span>
                      </div>
                      <input type="range" min="0.1" max="5" step="0.1" value={k} onChange={e => setK(parseFloat(e.target.value))} className="w-full accent-rose-700" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span>λ₀ (Fractal)</span>
                        <span>{lambda0.toFixed(1)}</span>
                      </div>
                      <input type="range" min="0" max="3" step="0.1" value={lambda0} onChange={e => setLambda0(parseFloat(e.target.value))} className="w-full accent-rose-700" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#141414]/10">
                    {[
                      { id: 'hyp', label: 'Hyperbolic', state: showHyperbolic, set: setShowHyperbolic },
                      { id: 'kk', label: 'Kaluza-Klein', state: showKK, set: setShowKK },
                      { id: 'str', label: 'String Modes', state: showString, set: setShowString },
                      { id: 'frac', label: 'Fractal Coupling', state: showFractal, set: setShowFractal },
                      { id: 'primes', label: 'Prime Perturbation', state: showPrimes, set: setShowPrimes }
                    ].map(layer => (
                      <label key={layer.id} className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          onClick={() => layer.set(!layer.state)}
                          className={cn(
                            "w-4 h-4 border border-[#141414] flex items-center justify-center transition-all",
                            layer.state ? "bg-rose-700 border-rose-700" : "bg-white"
                          )}
                        >
                          {layer.state && <div className="w-1.5 h-1.5 bg-white" />}
                        </div>
                        <span className="text-xs font-mono opacity-70 group-hover:opacity-100 transition-opacity">{layer.label}</span>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Visualization Panel */}
        <div className="lg:col-span-9">
          <div ref={containerRef2d} className="border border-[#141414] bg-[#F8F7F4] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden h-[500px] relative">
            {activeTab === '2d' && (
              <Plot
                data={generateData.plots2d.map((plot: any) => {
                  if (plot.isRoot) {
                    return {
                      x: plot.x,
                      y: plot.y,
                      mode: 'markers+text',
                      type: 'scatter',
                      marker: {
                        color: '#E11D48',
                        size: 9,
                        line: { color: '#141414', width: 2 }
                      },
                      text: plot.x.map((xVal: number) => `x ≈ ${xVal.toFixed(2)}`),
                      textposition: 'top center',
                      textfont: {
                        family: 'JetBrains Mono, monospace',
                        size: 10,
                        color: '#E11D48'
                      },
                      name: plot.name
                    };
                  }
                  return {
                    x: plot.x,
                    y: plot.y,
                    mode: 'lines',
                    type: 'scatter',
                    line: { color: plot.color, width: 2 },
                    name: plot.name
                  };
                })}
                layout={{
                  autosize: true,
                  margin: { l: 40, r: 20, b: 40, t: 20 },
                  paper_bgcolor: 'rgba(0,0,0,0)',
                  plot_bgcolor: 'rgba(0,0,0,0)',
                  xaxis: { title: 'X', gridcolor: '#ccc', gridwidth: 1, zerolinecolor: '#141414', range: adjustedRange2d.x, griddash: 'dot', dtick: (adjustedRange2d.x[1] - adjustedRange2d.x[0]) / 10 },
                  yaxis: { title: 'Y', gridcolor: '#ccc', gridwidth: 1, zerolinecolor: '#141414', range: adjustedRange2d.y, scaleanchor: 'x', scaleratio: 1, griddash: 'dot', dtick: (adjustedRange2d.y[1] - adjustedRange2d.y[0]) / 10 },
                  dragmode: 'pan',
                  showlegend: true,
                  legend: { x: 0, y: 1, bgcolor: 'rgba(255,255,255,0.8)' }
                }}
                onRelayout={handleRelayout2d}
                className="w-full h-full"
                config={{ responsive: true, scrollZoom: true }}
              />
            )}

            {activeTab === '3d' && (
              <Plot
                data={generateData.plots3d.map((plot: any) => ({
                  x: plot.x,
                  y: plot.y,
                  z: plot.z,
                  type: 'surface',
                  lighting: { ambient: 0.6, diffuse: 0.8, roughness: 0.5, specular: 0.5 },
                  colorscale: [
                    [0, 'rgba(255,255,255,0.2)'],
                    [1, plot.color]
                  ],
                  showscale: false,
                  name: plot.name
                }))}
                layout={getCommonLayout(range3d.x, range3d.y, range3d.z)}
                onRelayout={handleRelayout3d}
                className="w-full h-full"
                config={{ responsive: true }}
              />
            )}

            {activeTab === '4d' && visType4d === 'scalar' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full overflow-y-auto">
                <div className="bg-white border border-[#141414] p-2 flex flex-col">
                  <h3 className="font-mono text-[10px] uppercase opacity-50 mb-1">Slice 1: Oxyz (Color = t)</h3>
                  <div className="flex-1 min-h-[250px]">
                    <Plot
                      data={[
                        {
                          x: generateData.slice1.x,
                          y: generateData.slice1.y,
                          z: generateData.slice1.z,
                          value: generateData.slice1.t,
                          type: 'volume',
                          isomin: Math.min(...(generateData.slice1.t.length ? generateData.slice1.t : [0])),
                          isomax: Math.max(...(generateData.slice1.t.length ? generateData.slice1.t : [1])),
                          opacity: 0.1,
                          surface: { count: 15 },
                          colorscale: 'Viridis',
                          showscale: true,
                          colorbar: { title: 't', thickness: 10, len: 0.5 },
                          name: 'Field'
                        },
                        tesseractSlice()
                      ]}
                      layout={{ ...getCommonLayout([-range, range], [-range, range], [-range, range]), title: 'Oxyz Space' }}
                      className="w-full h-full"
                      config={{ responsive: true }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#141414] p-2 flex flex-col">
                  <h3 className="font-mono text-[10px] uppercase opacity-50 mb-1">Slice 2: Oxyt (z=0, Height = t)</h3>
                  <div className="flex-1 min-h-[250px]">
                    <Plot
                      data={[
                        {
                          x: generateData.slice2.x,
                          y: generateData.slice2.y,
                          z: generateData.slice2.t,
                          type: 'surface',
                          lighting: { ambient: 0.6, diffuse: 0.8, roughness: 0.5, specular: 0.5 },
                          colorscale: 'Viridis',
                          showscale: false
                        },
                        tesseractSlice()
                      ]}
                      layout={{ 
                        ...getCommonLayout([-range, range], [-range, range], [-range, range], 'X', 'Y', 'Ot'), 
                        title: 'Oxyt Slice (z=0)'
                      }}
                      className="w-full h-full"
                      config={{ responsive: true }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#141414] p-2 flex flex-col">
                  <h3 className="font-mono text-[10px] uppercase opacity-50 mb-1">Slice 3: Oxzt (y=0, Height = t)</h3>
                  <div className="flex-1 min-h-[250px]">
                    <Plot
                      data={[
                        {
                          x: generateData.slice3.x,
                          y: generateData.slice3.z,
                          z: generateData.slice3.t,
                          type: 'surface',
                          lighting: { ambient: 0.6, diffuse: 0.8, roughness: 0.5, specular: 0.5 },
                          colorscale: 'Viridis',
                          showscale: false
                        },
                        tesseractSlice()
                      ]}
                      layout={{ 
                        ...getCommonLayout([-range, range], [-range, range], [-range, range], 'X', 'Oz', 'Ot'), 
                        title: 'Oxzt Slice (y=0)'
                      }}
                      className="w-full h-full"
                      config={{ responsive: true }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-[#141414] p-2 flex flex-col">
                  <h3 className="font-mono text-[10px] uppercase opacity-50 mb-1">Slice 4: Oyzt (x=0, Height = t)</h3>
                  <div className="flex-1 min-h-[250px]">
                    <Plot
                      data={[
                        {
                          x: generateData.slice4.y,
                          y: generateData.slice4.z,
                          z: generateData.slice4.t,
                          type: 'surface',
                          lighting: { ambient: 0.6, diffuse: 0.8, roughness: 0.5, specular: 0.5 },
                          colorscale: 'Viridis',
                          showscale: false
                        },
                        tesseractSlice()
                      ]}
                      layout={{ 
                        ...getCommonLayout([-range, range], [-range, range], [-range, range], 'Oy', 'Oz', 'Ot'), 
                        title: 'Oyzt Slice (x=0)'
                      }}
                      className="w-full h-full"
                      config={{ responsive: true }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === '4d' && visType4d === 'manifold' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 h-full overflow-y-auto">
                {(['Oxyz', 'Oxzt', 'Oxyt', 'Oyzt'] as const).map((sub) => (
                  <div key={sub} className="border border-[#141414] bg-white relative flex flex-col">
                    <div className="absolute top-2 left-2 z-10 bg-[#141414] text-white px-2 py-1 text-[8px] font-mono uppercase tracking-widest">
                      Subspace: {sub}
                    </div>
                    <div className="flex-1 min-h-[250px]">
                      <Plot
                        data={[
                          ...generateData.manifold[sub].x.map((sliceX: any, i: number) => ({
                            x: sliceX,
                            y: generateData.manifold[sub].y[i],
                            z: generateData.manifold[sub].z[i],
                            mode: 'lines',
                            type: 'scatter3d',
                            line: { 
                              color: `rgba(225, 29, 72, ${0.2 + 0.8 * (i / generateData.manifold[sub].x.length)})`, 
                              width: 2 
                            },
                            name: `Slice ${i}`,
                            showlegend: false
                          })),
                          ...axes4d.map(a => {
                            const labels = sub.substring(1).split('');
                            const isRelevant = a.name === 'O' + labels[0] || a.name === 'O' + labels[1] || a.name === 'O' + labels[2];
                            return { ...a, opacity: isRelevant ? 1 : 0.1 };
                          })
                        ]}
                        layout={{
                          ...getCommonLayout([-range, range], [-range, range], [-range, range], sub[1], sub[2], sub[3]),
                          title: sub
                        }}
                        className="w-full h-full"
                        config={{ responsive: true }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          {activeTab === '2d' && (
            <HighPrecisionGeometryLab items={precItems} loading={precLoading} error={precError} />
          )}
        </div>
      </div>
    </div>
  );
}


function Mode21() {
  const [showAuDiagram, setShowAuDiagram] = useState(false);
  const sections = [
    {
      title: "1. Chi tiết về các Nguyên tố Vô cơ (Inorganic)",
      items: [
        {
          name: "Nhóm Khí hiếm (He, Ne, Ar, Kr)",
          reason: "Vỏ electron đã bão hòa (s²p⁶). Chúng không có xu hướng chia sẻ electron để tạo liên kết cộng hóa trị với Oxy.",
          exception: "Xenon (Xe) có thể tạo hợp chất với Oxy (XeO₃, XeO₄) nhưng không tồn tại dạng hydroxit bền.",
          icon: <Wind className="w-5 h-5 text-blue-400" />
        },
        {
          name: "Các Kim loại kiềm mạnh (Li, Na, K, Rb, Cs)",
          reason: "Độ âm điện rất thấp. Khi kết hợp với nhóm OH, chúng tạo ra liên kết ion (Na⁺[OH]⁻).",
          note: "Đây là các bazơ tan (hydroxide ion), không phải nhóm chức -OH cộng hóa trị.",
          icon: <Zap className="w-5 h-5 text-yellow-400" />
        },
        {
          name: "Flo (Fluorine)",
          reason: "Flo 'tham lam' electron hơn cả Oxy. Hợp chất duy nhất HOF cực kỳ kém bền, phân hủy ở nhiệt độ phòng.",
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />
        }
      ]
    },
    {
      title: "2. Chi tiết về các Hợp chất Hữu cơ (Organic)",
      items: [
        {
          name: "Hydrocacbon (Chỉ có C và H)",
          desc: "Ankan, Anken, Ankin chỉ gồm liên kết C-C và C-H. Hoàn toàn không có Oxy.",
          note: "Aren (Benzen, Naphtalen) nếu gắn thêm -OH sẽ biến thành Phenol.",
          icon: <FlaskConical className="w-5 h-5 text-emerald-400" />
        },
        {
          name: "Dẫn xuất Halogen (R-X)",
          desc: "Thay thế H bằng Halogen (F, Cl, Br, I). Ví dụ: CHCl₃, C₂H₅Br. Không chứa Oxy.",
          icon: <Beaker className="w-5 h-5 text-rose-400" />
        },
        {
          name: "Hợp chất chứa Oxy 'khóa' liên kết",
          subItems: [
            { name: "Ete (R-O-R')", desc: "Oxy đóng vai trò cầu nối, dùng hết hóa trị cho C." },
            { name: "Este (R-CO-O-R')", desc: "Nhóm -OH của axit bị thay thế bởi gốc -OR'." },
            { name: "Anđehit & Xeton", desc: "Oxy liên kết đôi với Cacbon (C=O). Không có liên kết O-H đơn." }
          ],
          icon: <Layers className="w-5 h-5 text-indigo-400" />
        },
        {
          name: "Hợp chất chứa Nitơ",
          desc: "Nitro (R-NO₂) Oxy liên kết trực tiếp với Nitơ. Nitrin (Xyanua - R-CN) không có Oxy.",
          icon: <Radiation className="w-5 h-5 text-purple-400" />
        }
      ]
    },
    {
      title: "3. Tại sao một số chất 'ép' không cho có nhóm -OH?",
      items: [
        {
          name: "Tính kém bền (Enol)",
          desc: "Dạng Enol (C=C-OH) lập tức tự chuyển hóa thành dạng Xeton (C=O) bền hơn.",
          icon: <Thermometer className="w-5 h-5 text-orange-400" />
        },
        {
          name: "Quy tắc Erlenmeyer",
          desc: "Một nguyên tử Cacbon thường không thể giữ cùng lúc 2 nhóm -OH; chúng sẽ tự tách nước tạo C=O.",
          icon: <AlertCircle className="w-5 h-5 text-red-500" />
        }
      ]
    },
    {
      title: "4. Các nguyên tố không thể đi một mình với H, F, Cl",
      items: [
        {
          name: "Khí hiếm nhẹ (He, Ne, Ar)",
          reason: "Cấu hình electron bão hòa. Không tồn tại các phân tử như HeH, NeF, ArCl.",
          icon: <Wind className="w-5 h-5 text-blue-300" />
        },
        {
          name: "Kim loại cực kém hoạt động (Au, Pt)",
          reason: "Không tạo hidrua bền. Hydro chỉ hòa tan vào mạng tinh thể chứ không tạo liên kết hóa học thực thụ.",
          icon: <Zap className="w-5 h-5 text-amber-500" />
        },
        {
          name: "Gốc hữu cơ bão hòa",
          reason: "Ankan đã bão hòa (như CH₄) không thể nhận thêm H đơn lẻ để tạo CH₅.",
          icon: <Atom className="w-5 h-5 text-teal-500" />
        }
      ]
    },
    {
      title: "5. Nhóm Axit Phức Chất Kim Loại Quý",
      items: [
        {
          name: "Axit Cloauric (HAuCl₄)",
          desc: "Hình thành từ Vàng (Au) trong nước cường toan. Tinh thể vàng cam, rất háo nước.",
          note: "Ứng dụng: Sản xuất vàng Nano, mạ vàng linh kiện.",
          icon: <Zap className="w-5 h-5 text-yellow-500" />
        },
        {
          name: "Axit Chloroplatinic (H₂PtCl₆)",
          desc: "Hình thành từ Bạch kim (Pt). Tinh thể đỏ sẫm, tan cực tốt trong nước.",
          note: "Ứng dụng: Xúc tác quan trọng, sản xuất thuốc Cisplatin.",
          icon: <Layers className="w-5 h-5 text-red-500" />
        }
      ]
    },
    {
      title: "6. Nhóm Siêu Axit (Superacids)",
      items: [
        {
          name: "Axit Fluoroantimonic (HSbF₆)",
          reason: "Mạnh gấp 10 triệu tỷ lần H₂SO₄ đậm đặc. Ăn mòn thủy tinh, đá và hữu cơ.",
          note: "Chỉ bảo quản được trong bình nhựa Teflon (PTFE).",
          icon: <Radiation className="w-5 h-5 text-purple-600" />
        },
        {
          name: "Axit Ma thuật (Magic Acid)",
          reason: "Hòa tan được cả nến parafin (hydrocacbon) - điều axit thường không làm được.",
          icon: <Zap className="w-5 h-5 text-blue-600" />
        }
      ]
    }
  ];

  return (
    <div className="space-y-12">
      <div className="border-b border-[#141414] pb-6">
        <h2 className="font-serif italic text-5xl">Bonding & Stability Lab</h2>
        <p className="font-mono text-xs opacity-50 mt-3 uppercase tracking-[0.2em]">Phân tích bản chất liên kết & Nhóm chức -OH</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-6">
            <h3 className="font-mono text-[10px] uppercase tracking-widest opacity-40 border-b border-[#141414]/10 pb-2">{section.title}</h3>
            <div className="space-y-4">
              {section.items.map((item, iIdx) => (
                <motion.div 
                  key={iIdx}
                  whileHover={{ x: 5 }}
                  className="p-6 bg-white border border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <h4 className="font-serif italic text-lg">{item.name}</h4>
                  </div>
                  {item.reason && <p className="text-xs opacity-70 leading-relaxed font-mono">{item.reason}</p>}
                  {item.desc && <p className="text-xs opacity-70 leading-relaxed font-mono">{item.desc}</p>}
                  {item.exception && (
                    <div className="p-2 bg-blue-50 border-l-2 border-blue-400 text-[10px] font-mono italic">
                      Ngoại lệ: {item.exception}
                    </div>
                  )}
                  {item.note && (
                    <div className="p-2 bg-gray-50 border-l-2 border-gray-400 text-[10px] font-mono opacity-60">
                      Lưu ý: {item.note}
                    </div>
                  )}
                  {item.subItems && (
                    <div className="space-y-2 pt-2 border-t border-[#141414]/5">
                      {item.subItems.map((sub, subIdx) => (
                        <div key={subIdx} className="text-[10px] font-mono">
                          <span className="font-bold opacity-80">{sub.name}:</span> <span className="opacity-60">{sub.desc}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-[#141414] text-[#E4E3E0] border border-[#141414] space-y-8">
        <div className="space-y-6">
          <div className="flex items-center gap-2 opacity-40">
            <Info className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Bảng tổng hợp Axit Phức Chất Kim Loại Quý</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-4 text-left opacity-50">Tên Axit</th>
                  <th className="p-4 text-left opacity-50">Công thức</th>
                  <th className="p-4 text-left opacity-50">Kim loại chính</th>
                  <th className="p-4 text-left opacity-50">Đặc điểm nhận dạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                <tr>
                  <td className="p-4 font-bold">Axit Cloauric</td>
                  <td className="p-4">HAuCl₄</td>
                  <td className="p-4">Vàng (Au)</td>
                  <td className="p-4">Tinh thể vàng cam, rất háo nước</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Axit Chloroplatinic</td>
                  <td className="p-4">H₂PtCl₆</td>
                  <td className="p-4">Bạch kim (Pt)</td>
                  <td className="p-4">Tinh thể đỏ sẫm, tan cực tốt</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Axit Chloropalladic</td>
                  <td className="p-4">H₂PdCl₄</td>
                  <td className="p-4">Palladium (Pd)</td>
                  <td className="p-4">Dung dịch màu nâu, kém bền</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold">Axit Perrhenic</td>
                  <td className="p-4">HReO₄</td>
                  <td className="p-4">Rhenium (Re)</td>
                  <td className="p-4">Chất lỏng không màu, oxy hóa mạnh</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/10 pt-8">
          <div className="flex items-center gap-2 opacity-40">
            <Layers className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Tóm tắt khả năng "Fusion"</span>
          </div>
          <p className="text-xs font-serif italic opacity-80 leading-relaxed max-w-3xl">
            Các axit này không tồn tại sẵn trong tự nhiên mà là kết quả của việc "cưỡng ép" các nguyên tố bền vững nhất (như Vàng, Bạch kim) hoặc các khí độc (Flo) kết hợp với nhau. Chúng đại diện cho giới hạn cực đoan của hóa học về cả giá trị kinh tế (axit vàng/platin) và sức mạnh hủy diệt (siêu axit).
          </p>
          <div className="pt-4">
            <button 
              onClick={() => setShowAuDiagram(true)}
              className="px-6 py-3 border border-white/20 hover:bg-white hover:text-[#141414] transition-all font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 group"
            >
              Xem sơ đồ bẻ gãy liên kết Au trong nước cường toan
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAuDiagram && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              onClick={() => setShowAuDiagram(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-5xl w-full bg-white p-2 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setShowAuDiagram(false)}
                  className="absolute -top-12 right-0 text-white hover:text-red-400 transition-colors flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest"
                >
                  Đóng <X className="w-5 h-5" />
                </button>
                <div className="relative w-full overflow-hidden bg-[#141414] rounded-t-lg flex items-center justify-center min-h-[300px]">
                  <img 
                    src="/aqua-regia.png" 
                    alt="Sơ đồ bẻ gãy liên kết Au trong nước cường toan"
                    className="w-full h-auto max-h-[70vh] object-contain relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-4 bg-white border-t border-gray-100">
                  <h3 className="font-serif italic text-xl text-[#141414]">Cơ chế hòa tan Vàng trong Nước cường toan (Aqua Regia)</h3>
                  <p className="text-[10px] font-mono opacity-60 mt-1 uppercase tracking-widest">Phản ứng tạo phức chất Chloroauric Acid (HAuCl₄)</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6 border-t border-white/10 pt-8">
          <div className="flex items-center gap-2 opacity-40">
            <Info className="w-4 h-4" />
            <span className="font-mono text-[10px] uppercase tracking-widest">Bảng đối chiếu hợp chất nhị phân (H, F, Cl)</span>
          </div>
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px] border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4 text-left opacity-50">Đối tượng</th>
                <th className="p-4 text-left opacity-50">Với Hydro (H)</th>
                <th className="p-4 text-left opacity-50">Với Flo (F) / Clo (Cl)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              <tr>
                <td className="p-4 font-bold">Khí hiếm (He, Ne)</td>
                <td className="p-4">Tuyệt đối không</td>
                <td className="p-4">Tuyệt đối không</td>
              </tr>
              <tr>
                <td className="p-4 font-bold">Kim loại quý (Au, Pt)</td>
                <td className="p-4">Không tạo hidrua bền</td>
                <td className="p-4">Có thể tạo muối (AuCl₃, PtF₆)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold">Gốc hữu cơ bão hòa</td>
                <td className="p-4">Không thể nhận thêm</td>
                <td className="p-4">Không thể nhận thêm (phải phản ứng thế)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold">Nitơ (N₂)</td>
                <td className="p-4">Cần xúc tác mạnh (NH₃)</td>
                <td className="p-4">Rất khó tạo hợp chất đơn lẻ bền</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
}


