import React, { createContext, useContext, useState } from 'react';

export interface SurveyPoint {
  id: string;
  name: string;
  x: number;
  y: number;
  source: string;
  type?: 'known' | 'computed';
  isControl?: boolean;
  locked?: boolean;
  pointClass?: string;
  
  // Data Provenance
  sourceMethod?: string;
  parentControls?: string[];
  observationsUsed?: number;
  precisionClass?: string;
  timestamp?: string;
  adjusted?: boolean;
}

export interface SurveyLine {
  id: string;
  startPointId: string;
  endPointId: string;
  type: 'baseline' | 'traverse' | 'adjusted' | 'error' | 'observation';
}

export type StandardsPreset = 'vietnam' | 'international' | 'engineering' | 'cadastral';

interface ProjectContextType {
  epsg: string;
  setEpsg: (epsg: string) => void;
  standardsPreset: StandardsPreset;
  setStandardsPreset: (preset: StandardsPreset) => void;
  points: SurveyPoint[];
  lines: SurveyLine[];
  addPoint: (point: Omit<SurveyPoint, 'id'>) => string;
  updatePoint: (id: string, updates: Partial<SurveyPoint>) => void;
  addLine: (line: Omit<SurveyLine, 'id'>) => void;
  clearPoints: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [epsg, setEpsg] = useState<string>('EPSG:9210'); // Default to HCM
  const [standardsPreset, setStandardsPreset] = useState<StandardsPreset>('vietnam');
  const [points, setPoints] = useState<SurveyPoint[]>([]);
  const [lines, setLines] = useState<SurveyLine[]>([]);

  const addPoint = (point: Omit<SurveyPoint, 'id'>): string => {
    let newId = '';
    setPoints(prev => {
      const exists = prev.find(p => p.name === point.name && p.x === point.x && p.y === point.y);
      if (exists) {
        newId = exists.id;
        // If it exists, we might want to update it if it's now marked as control, but let's keep it simple for now
        return prev;
      }
      newId = `${Date.now()}-${Math.random()}`;
      const timestamp = point.timestamp || new Date().toISOString();
      const precisionClass = point.precisionClass || (point.source === 'Manual Control' || point.source === 'Manual Entry' ? 'Unverified' : 'Computed');
      return [...prev, { ...point, id: newId, timestamp, precisionClass }];
    });
    return newId;
  };

  const updatePoint = (id: string, updates: Partial<SurveyPoint>) => {
    setPoints(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addLine = (line: Omit<SurveyLine, 'id'>) => {
    setLines(prev => {
      const exists = prev.find(l => 
        (l.startPointId === line.startPointId && l.endPointId === line.endPointId) ||
        (l.startPointId === line.endPointId && l.endPointId === line.startPointId)
      );
      if (exists) return prev;
      return [...prev, { ...line, id: `${Date.now()}-${Math.random()}` }];
    });
  };

  const clearPoints = () => {
    setPoints([]);
    setLines([]);
  };

  return (
    <ProjectContext.Provider value={{ 
      epsg, 
      setEpsg, 
      standardsPreset,
      setStandardsPreset,
      points, 
      lines, 
      addPoint, 
      updatePoint,
      addLine, 
      clearPoints 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProject must be used within a ProjectProvider");
  return context;
};
