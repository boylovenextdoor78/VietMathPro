import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Placeholder for unimplemented modules
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
    <Settings className="w-12 h-12 mb-4 opacity-20 animate-spin-slow" />
    <h3 className="text-xl font-mono uppercase tracking-widest">{title}</h3>
    <p className="text-sm mt-2 opacity-60">Module under development for GeoSurvey Pro X</p>
  </div>
);

function GeoSurveyApp() {
  const [activeTab, setActiveTab] = useState<TabId>('forward');
  const { epsg, setEpsg, standardsPreset, setStandardsPreset } = useProject();

  return (
    <div className="flex flex-col h-full bg-[#141414] text-[#e0e0e0] font-mono rounded-sm border border-[#333] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a1a] p-4 border-b border-[#333] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2 rounded-sm">
            <Map className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-yellow-500">GeoSurvey Pro X</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Advanced Land Surveying & Geodetic Intelligence Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-bold">Standard:</span>
            <select 
              value={standardsPreset} 
              onChange={(e) => setStandardsPreset(e.target.value as any)}
              className="bg-[#111] border border-[#444] px-2 py-1 text-gray-300 focus:outline-none focus:border-yellow-500"
            >
              <option value="vietnam">VN Common Practice</option>
              <option value="cadastral">Cadastral Mode</option>
              <option value="engineering">Engineering Const.</option>
              <option value="international">Intl Generic</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 font-bold">CRS:</span>
            <select 
              value={epsg} 
              onChange={(e) => setEpsg(e.target.value)}
              className="bg-[#111] border border-[#444] px-2 py-1 text-gray-300 focus:outline-none focus:border-yellow-500"
            >
              {EPSG_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <span className="border-l border-[#333] pl-4 flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> System Ready</span>
          <span className="border-l border-[#333] pl-4">Precision: Float64 / 1e-12</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-48 bg-[#1a1a1a] border-b md:border-b-0 md:border-r border-[#333] overflow-x-auto md:overflow-y-auto custom-scrollbar shrink-0">
          <div className="p-2 flex md:flex-col gap-1 whitespace-nowrap md:whitespace-normal">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 text-[11px] uppercase tracking-wider transition-colors rounded-sm cursor-pointer shrink-0 md:w-full ${
                  activeTab === tab.id 
                    ? 'bg-yellow-500 text-black font-bold' 
                    : 'text-gray-400 hover:bg-[#222] hover:text-gray-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Module Content */}
        <div className="flex-1 overflow-y-auto bg-[#111] p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
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
            </motion.div>
          </AnimatePresence>
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
