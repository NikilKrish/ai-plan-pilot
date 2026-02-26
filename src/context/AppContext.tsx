import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { plans, type Plan, type ScenarioRecord, type Adjustments } from '@/data/sampleData';

interface AppState {
  selectedLineId: string;
  activePlan: Plan;
  scenarioHistory: ScenarioRecord[];
  reducedMotion: boolean;
  persistHistory: boolean;
  pendingAdjustments: Adjustments | null;
}

interface AppContextValue extends AppState {
  setLine: (lineId: string) => void;
  setPlan: (plan: Plan) => void;
  addScenario: (record: ScenarioRecord) => void;
  setReducedMotion: (v: boolean) => void;
  setPersistHistory: (v: boolean) => void;
  setPendingAdjustments: (adj: Adjustments | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLineId, setSelectedLineId] = useState('LINE_A');
  const [activePlan, setActivePlan] = useState<Plan>(plans[0]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [persistHistory, setPersistHistory] = useState(false);
  const [pendingAdjustments, setPendingAdjustments] = useState<Adjustments | null>(null);

  const [scenarioHistory, setScenarioHistory] = useState<ScenarioRecord[]>(() => {
    try {
      const stored = localStorage.getItem('scenarioHistory');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (persistHistory) {
      localStorage.setItem('scenarioHistory', JSON.stringify(scenarioHistory));
    }
  }, [scenarioHistory, persistHistory]);

  const addScenario = useCallback((record: ScenarioRecord) => {
    setScenarioHistory((prev) => [record, ...prev].slice(0, 50));
  }, []);

  return (
    <AppContext.Provider value={{
      selectedLineId,
      activePlan,
      scenarioHistory,
      reducedMotion,
      persistHistory,
      pendingAdjustments,
      setLine: setSelectedLineId,
      setPlan: setActivePlan,
      addScenario,
      setReducedMotion,
      setPersistHistory,
      setPendingAdjustments,
    }}>
      {children}
    </AppContext.Provider>
  );
};
