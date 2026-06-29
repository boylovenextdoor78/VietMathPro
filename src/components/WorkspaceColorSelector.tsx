import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, X, Sparkles, Paintbrush, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';

export const THEME_COLORS = [
  { name: "Classic Concrete", value: "#E4E3E0", desc: "Màu xám xi măng học thuật nguyên bản" },
  { name: "Mint Pastel", value: "#B0D4B8", desc: "Xanh bạc hà dịu mát, xoa dịu đôi mắt" },
  { name: "Muted Terracotta", value: "#DE741C", desc: "Cam đất nung ấm áp, khơi gợi cảm hứng" },
  { name: "Deep Teal", value: "#2D99AE", desc: "Xanh mòng két sâu lắng, tập trung cao độ" },
  { name: "Milk Tea Cream", value: "#F4E1D2", desc: "Màu trà sữa ngọt ngào, tạo cảm giác thư thái" },
  { name: "Dusty Rose", value: "#D4A5A5", desc: "Hồng trầm quý phái, tĩnh lặng và nhã nhặn" },
  { name: "Sage Moss", value: "#A3B18A", desc: "Xanh rêu tĩnh lặng, cân bằng tâm trí" },
  { name: "Sky Dream", value: "#90E0EF", desc: "Xanh da trời khoáng đạt, tự do khám phá" },
  { name: "Lavender Fields", value: "#C8B6FF", desc: "Tím oải hương mộng mơ, kích thích sáng tạo" },
  { name: "Honey Amber", value: "#FFD166", desc: "Vàng mật ong năng lượng, rạng rỡ và tích cực" },
  { name: "Coral Sunset", value: "#F4A261", desc: "Hồng cam san hô rực rỡ, ấm áp và hoài cổ" },
  { name: "Midnight Shadow", value: "#2B2D42", desc: "Xám đen đại dương huyền bí, sâu thẳm chuyên nghiệp" }
];

interface WorkspaceColorSelectorProps {
  currentColor: string;
  onChangeColor: (color: string) => void;
  isMenuMode?: boolean;
  showSidebar?: boolean;
  onToggleSidebar?: () => void;
}

export function WorkspaceColorSelector({ 
  currentColor, 
  onChangeColor,
  isMenuMode = false,
  showSidebar = true,
  onToggleSidebar
}: WorkspaceColorSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<typeof THEME_COLORS[0] | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Handle clicking outside the modal content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  const activePreviewColor = hoveredColor || THEME_COLORS.find(c => c.value.toLowerCase() === currentColor.toLowerCase()) || THEME_COLORS[0];

  return (
    <>
      {/* Main trigger button in the Header */}
      <button
        onClick={() => {
          if (isMenuMode) {
            onToggleSidebar?.();
          } else {
            setIsOpen(true);
          }
        }}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono rounded-sm transition-all uppercase tracking-wider font-semibold shadow-sm focus:outline-none cursor-pointer",
          (isMenuMode ? showSidebar : isOpen)
            ? "bg-[#141414] text-[#E4E3E0] border-[#141414]"
            : "bg-white/40 border-[#141414]/10 text-neutral-800 hover:bg-white hover:border-[#141414]"
        )}
        title={isMenuMode ? (showSidebar ? "Ẩn bảng màu Workspace" : "Hiện bảng màu Workspace") : "Đổi màu nền Workspace"}
        id="btn-workspace-color"
      >
        <Palette className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Màu Nền Workspace</span>
      </button>

      {/* Modern Retro Modal Dialog */}
      {isOpen && (
        <div 
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div 
            ref={modalRef}
            className="bg-white border-4 border-[#141414] w-full max-w-3xl rounded-xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in zoom-in-95 duration-200"
            id="workspace-color-panel"
          >
            {/* Header */}
            <div className="border-b-4 border-[#141414] bg-[#F5F5F3] p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-[#141414]" />
                <h3 className="font-serif italic text-lg font-black uppercase tracking-tight text-[#141414]">
                  Cá Nhân Hóa Workspace
                </h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 border-2 border-transparent hover:border-[#141414] hover:bg-red-100 rounded-md transition-all cursor-pointer"
                title="Đóng panel"
              >
                <X className="w-5 h-5 text-[#141414]" />
              </button>
            </div>

            {/* Horizontal Split Body (40:60 Ratio) */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-10 min-h-0">
              
              {/* LEFT PANEL: 40% Width (md:col-span-4) - Dynamic Color Preview */}
              <div 
                className="md:col-span-4 p-6 border-b-4 md:border-b-0 md:border-r-4 border-[#141414] flex flex-col justify-between transition-colors duration-500 relative"
                style={{ backgroundColor: activePreviewColor.value }}
              >
                {/* Visual grid overlay for a high-fidelity vibe */}
                <div className="absolute inset-0 bg-[radial-gradient(#141414_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  <span className="inline-block px-2.5 py-1 bg-[#141414] text-white text-[9px] font-mono uppercase tracking-widest rounded-sm font-bold">
                    Xem trước màu nền
                  </span>

                  {/* High Fidelity Miniature App Mockup */}
                  <div className="bg-white border-2 border-[#141414] rounded-lg p-3 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-2 select-none">
                    <div className="flex justify-between items-center border-b border-neutral-200 pb-1.5">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-red-400" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                      </div>
                      <span className="text-[8px] font-mono text-neutral-400">vietmath-pro.app</span>
                    </div>

                    {/* Miniature workspace container showing selected color in background */}
                    <div 
                      className="rounded-md border border-[#141414]/15 p-2 transition-all duration-500 flex flex-col gap-1.5"
                      style={{ backgroundColor: activePreviewColor.value }}
                    >
                      <div className="bg-white border border-[#141414] rounded p-1.5 shadow-[1.5px_1.5px_0px_0px_rgba(20,20,20,1)] text-[10px] font-serif italic text-[#141414]">
                        f(x) = ∫ sin(x²) dx
                      </div>
                      <div className="bg-[#141414] text-white text-[8px] font-mono p-1 rounded flex justify-between items-center">
                        <span>ĐÁP ÁN CHÍNH XÁC</span>
                        <span className="text-emerald-400 font-extrabold">✓ OK</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Color information details */}
                <div className="relative z-10 mt-6 md:mt-0 bg-white/90 backdrop-blur-md border-2 border-[#141414] p-4 rounded-lg shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <h4 className="font-serif italic text-base font-extrabold text-[#141414] leading-tight">
                    {activePreviewColor.name}
                  </h4>
                  <div className="text-[10px] font-mono text-[#141414]/70 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full border border-[#141414]/20" style={{ backgroundColor: activePreviewColor.value }} />
                    {activePreviewColor.value}
                  </div>
                  <p className="text-[11px] text-neutral-700 font-sans mt-2 leading-relaxed">
                    {activePreviewColor.desc}
                  </p>
                </div>
              </div>

              {/* RIGHT PANEL: 60% Width (md:col-span-6) - Grid of Colors */}
              <div className="md:col-span-6 p-6 flex flex-col justify-between bg-neutral-50">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                      Bảng 12 màu học thuật gợi ý
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-sm font-sans">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>Rê chuột để xem thử</span>
                    </div>
                  </div>

                  {/* 12-Color Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {THEME_COLORS.map((color) => {
                      const isSelected = currentColor.toLowerCase() === color.value.toLowerCase();
                      return (
                        <button
                          key={color.value}
                          onClick={() => {
                            onChangeColor(color.value);
                          }}
                          onMouseEnter={() => setHoveredColor(color)}
                          onMouseLeave={() => setHoveredColor(null)}
                          className={cn(
                            "flex flex-col items-stretch p-2.5 border-2 rounded-lg text-left transition-all cursor-pointer relative group",
                            isSelected 
                              ? "border-[#141414] bg-white shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]" 
                              : "border-neutral-200 hover:border-[#141414] hover:bg-white hover:shadow-[3px_3px_0px_0px_rgba(20,20,20,0.15)] bg-white/75"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            {/* Color Block Circle */}
                            <div 
                              className="w-5 h-5 rounded-full border border-[#141414]/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200" 
                              style={{ backgroundColor: color.value }}
                            >
                              {isSelected && (
                                <Check className="w-3.5 h-3.5 text-white mix-blend-difference" />
                              )}
                            </div>
                            <span className="text-[11px] font-mono tracking-tight font-extrabold truncate text-neutral-800">
                              {color.name}
                            </span>
                          </div>
                          
                          <span className="text-[9px] text-neutral-400 mt-1.5 font-sans leading-none block truncate">
                            {color.value}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Footer hints */}
                <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-neutral-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Lưu tự động vào trình duyệt của bạn</span>
                  </div>
                  <button 
                    onClick={() => {
                      onChangeColor("#E4E3E0"); // Classic Concrete
                      setIsOpen(false);
                    }}
                    className="hover:text-[#141414] hover:underline font-bold transition-all cursor-pointer text-left"
                  >
                    Đặt lại mặc định
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function WorkspaceColorSidebar({ currentColor, onChangeColor }: WorkspaceColorSelectorProps) {
  return (
    <div 
      className="bg-white border-4 border-[#141414] rounded-xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] p-5 flex flex-col justify-between h-full min-h-[600px]"
      id="workspace-color-sidebar"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b-2 border-dashed border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-[#141414]" />
            <h4 className="font-serif italic text-base font-black uppercase tracking-tight text-[#141414]">
              MÀU NỀN WORKSPACE
            </h4>
          </div>
          <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase tracking-wider">
            Cá nhân hóa bảng học tập
          </p>
        </div>

        {/* Color List */}
        <div className="space-y-1.5 max-h-[550px] overflow-y-auto pr-1 custom-scrollbar">
          {THEME_COLORS.map((color) => {
            const isSelected = currentColor.toLowerCase() === color.value.toLowerCase();
            return (
              <button
                key={color.value}
                onClick={() => onChangeColor(color.value)}
                className={cn(
                  "w-full flex items-center justify-between p-2.5 border-2 rounded-lg text-left transition-all cursor-pointer group",
                  isSelected 
                    ? "border-[#141414] bg-neutral-50 shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] font-bold" 
                    : "border-neutral-100 hover:border-[#141414] hover:bg-neutral-50 bg-white"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Color circle */}
                  <div 
                    className="w-5 h-5 rounded-full border border-[#141414]/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200" 
                    style={{ backgroundColor: color.value }}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white mix-blend-difference" />
                    )}
                  </div>
                  
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-mono tracking-tight text-neutral-800 font-extrabold truncate">
                      {color.name}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-sans truncate leading-none mt-0.5">
                      {color.desc}
                    </span>
                  </div>
                </div>

                <span className="text-[9px] font-mono text-neutral-400 shrink-0 select-none ml-2">
                  {color.value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2 mt-4">
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            Tự động lưu
          </span>
          <button 
            onClick={() => onChangeColor("#E4E3E0")}
            className="hover:text-[#141414] hover:underline font-bold transition-all cursor-pointer"
          >
            Mặc định
          </button>
        </div>
      </div>
    </div>
  );
}
