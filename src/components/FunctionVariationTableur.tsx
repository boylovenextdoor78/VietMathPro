import React, { useState } from 'react';
import { 
  FunctionSquare, 
  Play, 
  HelpCircle, 
  AlertTriangle,
  Download,
  Flame,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { InlineMath } from 'react-katex';

export default function FunctionVariationTableur() {
  const PRESET_FUNCTIONS = [
    { title: "Lượng giác cơ bản: f(x) = sin(x)", expr: "sin(x)", desc: "Dựng bảng trên chu kỳ tuần hoàn [0, 2π], cực đại/cực tiểu đối xứng" },
    { title: "Lượng giác tuyến tính: f(x) = cos(2x)", expr: "cos(2*x)", desc: "Chu kỳ T = π. Bảng biến thiên thu nhỏ trên [0, π]" },
    { title: "Lượng giác bậc hai: f(x) = 2sin²x - 3sinx + 1", expr: "2*sin(x)^2 - 3*sin(x) + 1", desc: "Hàm đa thức lượng giác bậc 2 (Biên tập cực đặc trị chuẩn xác)" },
    { title: "Lượng giác Tangent: f(x) = tan(x)", expr: "tan(x)", desc: "Nhận diện kép tiệm cận đứng || tại các điểm cực (Poles) -π/2 và π/2" },
    { title: "Bậc 3: f(x) = x³", expr: "x^3", desc: "Hàm số đa thức bậc 3 cơ bản" },
    { title: "Trùng phương: f(x) = x⁴ - 2x² + 1", expr: "x^4-2*x^2+1", desc: "Hàm số đa thức trùng phương" },
    { title: "Hàm hữu tỉ bậc 1/1: f(x) = (2x+3)/(x-1)", expr: "(2*x+3)/(x-1)", desc: "TCĐ: x = 1, TCN: y = 2 tại ±∞" },
    { title: "Hàm hữu tỉ bậc 2/1: f(x) = (x²+x+1)/(x-1)", expr: "(x^2+x+1)/(x-1)", desc: "TCĐ: x = 1, TCX: y = x + 2 tại ±∞" },
    { title: "Hàm chứa căn vô cực: f(x) = √(x²+1)/x", expr: "sqrt(x^2+1)/x", desc: "TCĐ: x = 0, TCN: y = 1 (khi x -> +∞) và y = -1 (khi x -> -∞) " },
    { title: "Căn thức đa thức: f(x) = √(x² - x)", expr: "sqrt(x^2 - x)", desc: "Hàm chứa căn thức bậc hai của đa thức" },
    { title: "Trị tuyệt đối: f(x) = |x² - 2x|", expr: "abs(x^2 - 2*x)", desc: "Trị tuyệt đối của đa thức (Cực trị nhọn không vi phân ||)" }
  ];

  interface AsymptoteItem {
    equation: string;
    latex: string;
    limits_latex?: string;
    description: string;
    direction?: string;
    polynomial_latex?: string;
    degree?: number;
    remainder_latex?: string;
    denominator_latex?: string;
  }

  interface AsymptotesReport {
    vertical: AsymptoteItem[];
    horizontal: AsymptoteItem[];
    slant: AsymptoteItem[];
    curved: AsymptoteItem[];
  }

  const [expression, setExpression] = useState('x^3');
  const [loading, setLoading] = useState(false);
  const [svgResult, setSvgResult] = useState<string | null>(null);
  const [legend, setLegend] = useState<any[]>([]);
  const [domainVnm, setDomainVnm] = useState<string | null>(null);
  const [asymptotesReport, setAsymptotesReport] = useState<AsymptotesReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 1500);
  };

  const handleSolve = async (exprToSolve = expression) => {
    setLoading(true);
    setError(null);
    setSvgResult(null);
    setLegend([]);
    setDomainVnm(null);
    setAsymptotesReport(null);
    try {
      const res = await fetch('/api/math/bbt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expr: exprToSolve })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi server khi lập bảng biến thiên.');
      }
      setSvgResult(data.svg);
      setLegend(data.legend || []);
      setDomainVnm(data.domain_vnm || null);
      setAsymptotesReport(data.asymptotes_report || null);
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý bảng biến thiên bằng CAS engine.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSVG = () => {
    if (!svgResult) return;
    const blob = new Blob([svgResult], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vietmath_bbt_${expression.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#141414] text-[#E4E3E0] p-6 md:p-8 border border-white/10 shadow-2xl rounded-sm font-mono mt-4">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-[#E4E3E0]/20">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FunctionSquare className="text-teal-400 w-6 h-6 animate-pulse" />
            <h2 className="text-2xl font-serif italic text-[#FFFFFF]">Tableur of Function Variation</h2>
          </div>
          <p className="text-xs opacity-50 uppercase tracking-widest mt-1">VietMath Pro • CAS Engine Symbolic Grapher</p>
        </div>
        <div className="bg-[#1c1c1c] border border-white/10 text-teal-400 px-3 py-1.5 text-[9px] uppercase tracking-widest rounded-sm">
          GIAC/xCAS Symbolic Base
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Controller Panel - Expanded to 5 columns for extra horizontal breath */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1a1a1a] p-5 border border-white/5 rounded-sm space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-[#00ffcc] font-bold flex items-center gap-2">
              <Play className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
              Nhập hàm số cần lập BBT
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-white/50 mb-1.5 font-mono">Biểu thức f(x)</label>
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={expression} 
                    onChange={e => setExpression(e.target.value)}
                    placeholder="e.g. (x^2-1)/(x-2)" 
                    className="w-full bg-black text-white px-4 py-2.5 text-base font-semibold font-mono border border-white/20 focus:border-teal-400 outline-none rounded-sm"
                  />
                  
                  {/* Neon green/teal play button positioned clearly beneath the input */}
                  <button
                    onClick={() => handleSolve()}
                    disabled={loading || !expression.trim()}
                    className="w-full py-3 bg-[#00ffcc] text-black font-extrabold uppercase text-xs tracking-widest hover:bg-teal-300 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 rounded-sm shadow-[0_4px_14px_rgba(0,255,204,0.3)]"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ĐANG TÍNH TOÁN CAS...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-black text-black" />
                        CHẠY LẬP BẢNG BIẾN THIÊN
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[10px] opacity-40 italic">Hỗ trợ các hàm hữu tỉ, đa thức, lũy thừa, trị tuyệt đối (abs), căn thức, và hàm lượng giác chuẩn (sin, cos, tan) thuộc hệ thống TrigHSProfile THPTQG.</p>
            </div>
          </div>

          {/* Domain of definition (Tập xác định) clearly shown */}
          <div className="bg-gradient-to-r from-teal-950/20 to-black/40 p-5 border border-teal-500/30 rounded-sm space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-[#00ffcc] font-bold font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ffcc] animate-ping" />
              TẬP XÁC ĐỊNH (DOMAIN OF DEFINITION)
            </div>
            
            <div className="p-3 bg-black/60 border border-teal-500/10 rounded-sm">
              {domainVnm ? (
                <div className="text-lg font-mono italic text-white font-bold select-all">
                  {domainVnm}
                </div>
              ) : (
                <div className="text-xs font-mono text-white/40 italic">
                  Chưa nạp hàm số (Hãy bấm nút chạy lập BBT)
                </div>
              )}
            </div>
            
            <p className="text-[9px] text-white/40 font-sans leading-relaxed">
              Phân tích tự động các điều kiện xác định dưới dấu căn thức (sqrt, cbrt), phân thức và biên tập xác định của hàm số.
            </p>
          </div>

          {/* Test Presets */}
          <div className="bg-[#1a1a1a] p-4 border border-white/5 rounded-sm space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-[#E4E3E0] font-bold mb-2 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" />
              SÁCH GIÁO KHOA - TEST CASES
            </h3>
            <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
              {PRESET_FUNCTIONS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setExpression(preset.expr);
                    handleSolve(preset.expr);
                  }}
                  className="w-full text-left p-2.5 bg-black/40 hover:bg-white/5 border border-white/10 hover:border-teal-400 transition-all rounded-sm group text-xs"
                >
                  <div className="font-bold text-white group-hover:text-teal-400 transition-colors">{preset.title}</div>
                  <div className="text-[10px] opacity-50 mt-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Technical Specs Helper */}
          <div className="text-[10px] space-y-2 opacity-50 border-t border-white/10 pt-4">
            <h4 className="font-bold uppercase text-white/70">Hướng dẫn cài đặt GIAC/xCAS:</h4>
            <p>VietMath Pro chạy Sympy/Giac tích hợp trực tiếp qua lõi Python & Pyodide WASM. Không cần cài thêm thư viện ngoài.</p>
            <p>Hỗ sự chia tập xác định và tiệm cận tự động, dựng double vertical lines <code className="bg-black/50 px-1 py-0.5 border border-white/10 rounded-sm">||</code> đúng chuẩn sách giáo khoa Toán học Việt Nam.</p>
          </div>
        </div>

        {/* Right Column: Visualizer Table Viewer - 7 columns */}
        <div className="lg:col-span-7 flex flex-col min-h-[450px] bg-black border border-white/10 rounded-sm p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <div className="space-y-1">
              <h3 className="text-xs uppercase tracking-widest font-bold text-white/70">Bảng Biến Thiên SVG Output</h3>
              {domainVnm && (
                <div className="text-[11px] text-[#00ffcc] font-mono flex items-center gap-1">
                  <span>Tập xác định:</span>
                  <span className="font-bold bg-teal-950/40 px-2 py-0.5 border border-teal-500/20 rounded-sm">{domainVnm}</span>
                </div>
              )}
            </div>
            {svgResult && (
              <button
                onClick={downloadSVG}
                className="flex items-center gap-1.5 text-xs text-teal-400 px-3 py-1 border border-teal-500/20 hover:bg-teal-500 hover:text-black transition-all rounded-sm uppercase tracking-wider"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file SVG
              </button>
            )}
          </div>

          <div className={`flex-1 flex flex-col bg-[#111111] p-4 rounded-sm border border-white/5 overflow-x-auto min-h-[350px] ${(!svgResult || loading || error) ? 'items-center justify-center' : 'justify-start'}`}>
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-white/50 text-center animate-pulse">CAS engine đang quét topology và lập bảng phân tách đạo hàm...</p>
              </div>
            ) : error ? (
              <div className="max-w-md bg-red-950/20 p-5 border border-red-500/30 rounded-sm space-y-3">
                <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
                  <AlertTriangle className="w-5 h-5" />
                  <span>XẢY RA LỖI BIỂU THỨC</span>
                </div>
                <p className="text-xs text-red-200/80 leading-relaxed font-sans">{error}</p>
                <p className="text-[10px] text-red-400/60 leading-relaxed">Hãy chắc chắn biểu thức nằm trong danh sách hàm được hỗ trợ.</p>
              </div>
            ) : svgResult ? (
              <div className="w-full space-y-6">
                <div 
                  className="w-full flex justify-center text-center max-w-full font-sans text-xs"
                  dangerouslySetInnerHTML={{ __html: svgResult }} 
                />

                {/* Phân tích tiệm cận */}
                {asymptotesReport && (
                  <div className="mt-8 border-t border-white/10 pt-5 space-y-4 text-left">
                    <div className="flex items-center gap-2 text-[#00ffcc]">
                      <Flame className="w-4 h-4 text-[#00ffcc]" />
                      <h4 className="text-xs uppercase tracking-widest font-bold font-mono text-[#00ffcc]">
                        Phân tích Tiệm cận Đồ thị (Asymptotic Line Analysis)
                      </h4>
                    </div>

                    {Math.max(
                      asymptotesReport.vertical?.length || 0,
                      asymptotesReport.horizontal?.length || 0,
                      asymptotesReport.slant?.length || 0,
                      asymptotesReport.curved?.length || 0
                    ) > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tiệm cận đứng */}
                        {asymptotesReport.vertical && asymptotesReport.vertical.length > 0 && (
                          <div className="p-3.5 bg-[#1a1a1a]/40 border border-teal-500/10 rounded-sm space-y-2.5">
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-teal-400 bg-teal-950/40 px-2 py-0.5 rounded-sm border border-teal-500/20 font-mono">
                              Tiệm cận Đứng (TCĐ)
                            </span>
                            <div className="space-y-2">
                              {asymptotesReport.vertical.map((item, idx) => (
                                <div key={idx} className="border-l-2 border-teal-500/30 pl-3 py-1 space-y-1">
                                  <div className="flex items-center gap-2 font-mono text-sm text-white font-bold">
                                    <span>Phương trình:</span>
                                    <span className="bg-black/40 px-2 py-0.5 rounded-sm text-center border border-white/5 inline-flex items-center">
                                      <InlineMath>{item.latex}</InlineMath>
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70">{item.description}</p>
                                  {item.limits_latex && (
                                    <div className="text-[11px] text-teal-400/80 font-serif pt-1 flex items-center gap-1 flex-wrap">
                                      <span>Chứng cứ giới hạn:</span>
                                      <span className="bg-black/30 px-1.5 py-0.5 rounded-sm font-mono"><InlineMath>{item.limits_latex}</InlineMath></span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tiệm cận ngang */}
                        {asymptotesReport.horizontal && asymptotesReport.horizontal.length > 0 && (
                          <div className="p-3.5 bg-[#1a1a1a]/40 border border-sky-500/10 rounded-sm space-y-2.5">
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-sm border border-sky-500/20 font-mono">
                              Tiệm cận Ngang (TCN)
                            </span>
                            <div className="space-y-2">
                              {asymptotesReport.horizontal.map((item, idx) => (
                                <div key={idx} className="border-l-2 border-sky-500/30 pl-3 py-1 space-y-1">
                                  <div className="flex items-center gap-2 font-mono text-sm text-white font-bold">
                                    <span>Phương trình:</span>
                                    <span className="bg-black/40 px-2 py-0.5 rounded-sm text-center border border-white/5 inline-flex items-center">
                                      <InlineMath>{item.latex}</InlineMath>
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70">{item.description}</p>
                                  {item.limits_latex && (
                                    <div className="text-[11px] text-sky-400/80 font-serif pt-1 flex items-center gap-1 flex-wrap">
                                      <span>Chứng cứ giới hạn:</span>
                                      <span className="bg-black/30 px-1.5 py-0.5 rounded-sm font-mono"><InlineMath>{item.limits_latex}</InlineMath></span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tiệm cận xiên */}
                        {asymptotesReport.slant && asymptotesReport.slant.length > 0 && (
                          <div className="p-3.5 bg-[#1a1a1a]/40 border border-indigo-500/10 rounded-sm space-y-2.5">
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-sm border border-indigo-500/20 font-mono">
                              Tiệm cận Xiên (TCX)
                            </span>
                            <div className="space-y-2">
                              {asymptotesReport.slant.map((item, idx) => (
                                <div key={idx} className="border-l-2 border-indigo-500/30 pl-3 py-1 space-y-1">
                                  <div className="flex items-center gap-2 font-mono text-sm text-white font-bold">
                                    <span>Phương trình:</span>
                                    <span className="bg-black/40 px-2 py-0.5 rounded-sm text-center border border-white/5 inline-flex items-center">
                                      <InlineMath>{item.latex}</InlineMath>
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70">{item.description}</p>
                                  {item.limits_latex && (
                                    <div className="text-[11px] text-indigo-400/80 font-serif pt-1 flex items-center gap-1 flex-wrap">
                                      <span>Phân tích hệ số:</span>
                                      <span className="bg-black/30 px-1.5 py-0.5 rounded-sm font-mono"><InlineMath>{item.limits_latex}</InlineMath></span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tiệm cận cong đa thức */}
                        {asymptotesReport.curved && asymptotesReport.curved.length > 0 && (
                          <div className="p-3.5 bg-[#1a1a1a]/40 border border-fuchsia-500/10 rounded-sm space-y-2.5">
                            <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-fuchsia-400 bg-fuchsia-950/40 px-2 py-0.5 rounded-sm border border-fuchsia-500/20 font-mono">
                              Tiệm cận Cong Đa thức (TCC)
                            </span>
                            <div className="space-y-2">
                              {asymptotesReport.curved.map((item, idx) => (
                                <div key={idx} className="border-l-2 border-fuchsia-500/30 pl-3 py-1 space-y-1">
                                  <div className="flex items-center gap-2 font-mono text-sm text-white font-bold">
                                    <span>Đường cong TC:</span>
                                    <span className="bg-black/40 px-2 py-0.5 rounded-sm text-center border border-white/5 inline-flex items-center">
                                      <InlineMath>{item.latex}</InlineMath>
                                    </span>
                                  </div>
                                  <p className="text-xs text-white/70">{item.description}</p>
                                  {item.limits_latex && (
                                    <div className="text-[11px] text-fuchsia-400/80 font-serif pt-1 flex items-center gap-1 flex-wrap">
                                      <span>Phép chia đa thức:</span>
                                      <span className="bg-black/30 px-1.5 py-0.5 rounded-sm font-mono"><InlineMath>{item.limits_latex}</InlineMath></span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-teal-950/10 border border-teal-500/10 rounded-sm text-xs text-teal-400/60 leading-relaxed font-sans">
                        Đồ thị hàm số này không sở hữu bất kỳ đường tiệm cận đứng, ngang, xiên, hoặc tiệm cận cong đa thức nào (hàm số liên tục hoặc tăng nhanh ra vô cực toàn cục).
                      </div>
                    )}
                  </div>
                )}
                
                {legend && legend.length > 0 && (
                  <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
                    <div className="flex items-center gap-2 text-teal-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs uppercase tracking-widest font-bold font-mono">
                        Chú dẫn các ký tự số đã gán (Symbolic Legend)
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {legend.map((item, index) => (
                        <div 
                          key={index}
                          className={`p-3 bg-black/40 border ${!item.is_exact ? 'border-dashed border-amber-500/30' : 'border-white/5'} rounded-sm flex flex-col justify-between space-y-2 hover:border-teal-500/20 transition-all text-left`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-sm font-bold font-serif bg-teal-950/30 border px-2 py-0.5 rounded-sm ${!item.is_exact ? 'border-dashed border-amber-500/40 text-amber-400 font-bold underline decoration-dashed' : 'border-teal-500/20 text-teal-400'}`}>
                                {item.symbol}
                              </span>
                              {!item.is_exact && (
                                <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded-sm font-mono uppercase">
                                  Xấp xỉ
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-mono">
                              {item.type === 'x' ? 'Tọa độ X' : 'Giá trị Y'}
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-sans text-white/80 leading-relaxed font-semibold">
                            {item.role}
                          </div>
                          
                          <div className="pt-2 border-t border-white/5 flex flex-col space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-white/30 font-mono">
                              {item.is_exact ? 'Giá trị chuẩn xác (Exact Symbol):' : 'Giá trị phân tích (25 chữ số - Nhấp để sao chép):'}
                            </span>
                            <div className="relative group/copy">
                              <span 
                                onClick={() => copyToClipboard(item.value, `${item.symbol}-${index}`)}
                                className={`text-xs font-mono break-all select-all bg-black/60 p-2 pr-8 rounded-sm border block cursor-pointer transition-colors active:bg-black/90 ${
                                  !item.is_exact 
                                    ? 'border-dashed border-amber-500/25 hover:border-amber-500/50 text-amber-200 hover:text-amber-100 underline decoration-dashed' 
                                    : 'border-white/10 hover:border-teal-500/30 text-white hover:text-teal-200'
                                }`}
                                title="Click để sao chép tất cả chữ số"
                              >
                                {item.value}
                              </span>
                              <button
                                onClick={() => copyToClipboard(item.value, `${item.symbol}-${index}`)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                title="Sao chép vào clipboard"
                              >
                                {copiedId === `${item.symbol}-${index}` ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center max-w-sm text-center py-12">
                <HelpCircle className="w-12 h-12 text-[#E4E3E0]/20 mb-4" />
                <h4 className="text-sm font-bold text-white/60 mb-1">Chưa có kết quả phân tích</h4>
                <p className="text-xs text-[#E4E3E0]/40 font-sans leading-relaxed">Hãy chọn bất kỳ preset hàm số SGK bên trái, hoặc ghi biểu thức rồi bấm "Chạy" để lập bảng biến thiên.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
