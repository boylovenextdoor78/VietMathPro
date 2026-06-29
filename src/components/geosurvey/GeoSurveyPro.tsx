import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, Compass, Crosshair, Grid, Layers, 
  FileText, Settings, Navigation, Activity,
  Calculator, ArrowRight, Layers3
} from 'lucide-react';
import ForwardModule from './ForwardModule';
import InverseModule from './InverseModule';
import TraverseModule from './TraverseModule';
import IntersectionModule from './IntersectionModule';
import LayoutModule from './LayoutModule';
import { ProjectProvider, useProject } from './ProjectContext';
import { EPSG_OPTIONS } from '../../lib/epsgDefs';

import CoordinatesModule from './CoordinatesModule';
import CelestialSurveyModule from './CelestialSurveyModule';
import ControlPointsModule from './ControlPointsModule';
import MapSheetModule from './MapSheetModule';

type TabId = 'forward' | 'inverse' | 'traverse' | 'resection' | 'intersection' | 'adjustment' | 'coordinates' | 'mapsheet' | 'celestial' | 'curves' | 'area' | 'layout' | 'reports' | 'control';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'control', label: 'Control Pts', icon: <Map className="w-4 h-4" /> },
  { id: 'forward', label: 'Forward', icon: <ArrowRight className="w-4 h-4" /> },
  { id: 'inverse', label: 'Inverse', icon: <Compass className="w-4 h-4" /> },
  { id: 'traverse', label: 'Traverse', icon: <Activity className="w-4 h-4" /> },
  { id: 'resection', label: 'Resection', icon: <Crosshair className="w-4 h-4" /> },
  { id: 'intersection', label: 'Intersection', icon: <Calculator className="w-4 h-4" /> },
  { id: 'adjustment', label: 'Adjustment', icon: <Grid className="w-4 h-4" /> },
  { id: 'coordinates', label: 'Coordinates', icon: <Map className="w-4 h-4" /> },
  { id: 'mapsheet', label: 'Mảnh VN2000', icon: <Layers3 className="w-4 h-4" /> },
  { id: 'celestial', label: 'Celestial', icon: <Compass className="w-4 h-4" /> },
  { id: 'curves', label: 'Curves', icon: <Navigation className="w-4 h-4" /> },
  { id: 'area', label: 'Area/Vol', icon: <Layers className="w-4 h-4" /> },
  { id: 'layout', label: 'Layout Map', icon: <Map className="w-4 h-4" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
];

// Error Boundary for Modules
class ModuleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border-4 border-red-600 bg-red-50 text-black font-mono">
          <h2 className="text-sm font-bold text-red-600 mb-2 uppercase tracking-wider">ĐÃ XẢY RA LỖI RENDER MODULE (MODULE RENDER ERROR)</h2>
          <p className="text-xs font-bold mb-2">Chi tiết lỗi / Error details:</p>
          <pre className="p-4 bg-white border border-red-600 text-xs overflow-auto font-bold max-h-[250px] text-black">
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })} 
            className="mt-4 px-4 py-2 bg-yellow-400 text-black font-bold border-2 border-black uppercase text-xs hover:bg-yellow-500 cursor-pointer"
          >
            Thử tải lại (Retry)
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Placeholder for unimplemented modules
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-black">
    <Settings className="w-12 h-12 mb-4 opacity-30 animate-spin-slow" />
    <h3 className="text-lg font-mono font-bold uppercase tracking-widest">{title}</h3>
    <p className="text-xs mt-2 opacity-80 font-bold">Module under development for GeoSurvey Pro X</p>
  </div>
);

function GeoSurveyApp() {
  const [activeTab, setActiveTab] = useState<TabId>('forward');
  const { epsg, setEpsg, standardsPreset, setStandardsPreset } = useProject();

  return (
    <div className="flex flex-col w-full bg-white text-[#141414] font-mono rounded-sm border-2 border-[#141414] shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
      {/* Header */}
      <div className="bg-[#f5f5f4] p-4 border-b-2 border-[#141414] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 p-2 rounded-sm border-2 border-[#141414]">
            <Map className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-black">GeoSurvey Pro X</h1>
            <p className="text-[10px] text-gray-600 uppercase tracking-wider">Advanced Land Surveying & Geodetic Intelligence Suite</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-black font-bold">
          <div className="flex items-center gap-2">
            <span className="text-black font-bold">Standard:</span>
            <select 
              value={standardsPreset} 
              onChange={(e) => setStandardsPreset(e.target.value as any)}
              className="bg-white border-2 border-[#141414] px-2 py-1 text-black font-bold focus:outline-none focus:bg-yellow-100"
            >
              <option value="vietnam">VN Common Practice</option>
              <option value="cadastral">Cadastral Mode</option>
              <option value="engineering">Engineering Const.</option>
              <option value="international">Intl Generic</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black font-bold">CRS:</span>
            <select 
              value={epsg} 
              onChange={(e) => setEpsg(e.target.value)}
              className="bg-white border-2 border-[#141414] px-2 py-1 text-black font-bold focus:outline-none focus:bg-yellow-100"
            >
              {EPSG_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <span className="border-l-2 border-[#141414] pl-4 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-600"></div> System Ready</span>
          <span className="border-l-2 border-[#141414] pl-4">Precision: Float64 / 1e-12</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-row min-h-[600px] overflow-hidden">
        {/* Sidebar Tabs - ALWAYS on the left */}
        <div className="w-14 sm:w-44 bg-[#f5f5f4] border-r-2 border-[#141414] overflow-y-auto custom-scrollbar shrink-0 flex flex-col justify-between select-none">
          <div className="p-1.5 sm:p-2 flex flex-col gap-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`flex items-center justify-center sm:justify-start gap-2 px-2 py-2 sm:py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all rounded-sm cursor-pointer w-full text-left ${
                  activeTab === tab.id 
                    ? 'bg-yellow-400 text-black border-2 border-[#141414] shadow-[1px_1px_0px_0px_rgba(20,20,20,1)] sm:shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]' 
                    : 'text-gray-700 hover:bg-stone-200 hover:text-black border border-transparent'
                }`}
              >
                <span className="shrink-0 w-4 h-4 flex items-center justify-center">{tab.icon}</span>
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </button>
            ))}
          </div>
          
          <div className="p-1.5 sm:p-2 border-t border-gray-300 bg-[#ebebe9]">
            <div className="text-[8px] sm:text-[9px] uppercase tracking-wider font-bold text-gray-500 text-center">
              <span className="hidden sm:inline">V.2.6-PRO</span>
              <span className="sm:hidden">V2</span>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 bg-white p-4 sm:p-6 text-black min-h-0 overflow-x-auto">
          <div className="w-full">
            <ModuleErrorBoundary>
              {activeTab === 'control' && <ControlPointsModule />}
              {activeTab === 'forward' && <ForwardModule />}
              {activeTab === 'inverse' && <InverseModule />}
              {activeTab === 'traverse' && <TraverseModule />}
              {activeTab === 'resection' && <ComingSoon title="Resection / Free Station" />}
              {activeTab === 'intersection' && <IntersectionModule />}
              {activeTab === 'adjustment' && <ComingSoon title="Network Adjustment" />}
              {activeTab === 'coordinates' && <CoordinatesModule />}
              {activeTab === 'mapsheet' && <MapSheetModule />}
              {activeTab === 'celestial' && <CelestialSurveyModule />}
              {activeTab === 'curves' && <ComingSoon title="Curves & Roads" />}
              {activeTab === 'area' && <ComingSoon title="Area & Volume" />}
              {activeTab === 'layout' && <LayoutModule />}
              {activeTab === 'reports' && <ComingSoon title="Reporting Engine" />}
            </ModuleErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GeoSurveyPro() {
  return (
    <ProjectProvider>
      <GeoSurveyApp />
    </ProjectProvider>
  );
}
