import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { plans, type Plan, type ScenarioRecord, type Adjustments } from '@/data/sampleData';
import type { UploadContext, UploadMeta } from '@/types/upload';

const UPLOAD_STORAGE_KEY = 'activeUpload';
const UPLOAD_HISTORY_KEY = 'uploadHistory';
const MAX_HISTORY = 5;

interface AppState {
  selectedLineId: string;
  activePlan: Plan;
  scenarioHistory: ScenarioRecord[];
  reducedMotion: boolean;
  persistHistory: boolean;
  pendingAdjustments: Adjustments | null;
  activeUpload: UploadContext | null;
  uploadHistory: UploadMeta[];
}

interface AppContextValue extends AppState {
  setLine: (lineId: string) => void;
  setPlan: (plan: Plan) => void;
  addScenario: (record: ScenarioRecord) => void;
  setReducedMotion: (v: boolean) => void;
  setPersistHistory: (v: boolean) => void;
  setPendingAdjustments: (adj: Adjustments | null) => void;
  setActiveUpload: (ctx: UploadContext) => void;
  clearActiveUpload: () => void;
  loadUpload: (uploadId: string) => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

function loadStoredUpload(): UploadContext | null {
  try {
    const stored = localStorage.getItem(UPLOAD_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function loadStoredHistory(): UploadMeta[] {
  try {
    const stored = localStorage.getItem(UPLOAD_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveUploadToStorage(ctx: UploadContext | null) {
  if (ctx) {
    localStorage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(ctx));
  } else {
    localStorage.removeItem(UPLOAD_STORAGE_KEY);
  }
}

function saveHistoryToStorage(history: UploadMeta[]) {
  localStorage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(history));
}

function getStoredUploadContexts(): Record<string, UploadContext> {
  try {
    const stored = localStorage.getItem('uploadContexts');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveUploadContextToBank(ctx: UploadContext) {
  const bank = getStoredUploadContexts();
  bank[ctx.meta.uploadId] = ctx;
  const keys = Object.keys(bank);
  if (keys.length > MAX_HISTORY) {
    delete bank[keys[0]];
  }
  localStorage.setItem('uploadContexts', JSON.stringify(bank));
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [selectedLineId, setSelectedLineId] = useState('LINE_A');
  const [activePlan, setActivePlan] = useState<Plan>(plans[0]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [persistHistory, setPersistHistory] = useState(false);
  const [pendingAdjustments, setPendingAdjustments] = useState<Adjustments | null>(null);
  const [activeUpload, setActiveUploadState] = useState<UploadContext | null>(loadStoredUpload);
  const [uploadHistory, setUploadHistory] = useState<UploadMeta[]>(loadStoredHistory);

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

  const setActiveUpload = useCallback((ctx: UploadContext) => {
    setActiveUploadState(ctx);
    saveUploadToStorage(ctx);
    saveUploadContextToBank(ctx);
    setUploadHistory((prev) => {
      const filtered = prev.filter((m) => m.uploadId !== ctx.meta.uploadId);
      const updated = [ctx.meta, ...filtered].slice(0, MAX_HISTORY);
      saveHistoryToStorage(updated);
      return updated;
    });
    if (ctx.meta.lineIds.length > 0) {
      setSelectedLineId(ctx.meta.lineIds[0]);
    }
  }, []);

  const clearActiveUpload = useCallback(() => {
    setActiveUploadState(null);
    saveUploadToStorage(null);
  }, []);

  const loadUpload = useCallback((uploadId: string): boolean => {
    const bank = getStoredUploadContexts();
    const ctx = bank[uploadId];
    if (ctx) {
      setActiveUploadState(ctx);
      saveUploadToStorage(ctx);
      if (ctx.meta.lineIds.length > 0) {
        setSelectedLineId(ctx.meta.lineIds[0]);
      }
      return true;
    }
    return false;
  }, []);

  return (
    <AppContext.Provider value={{
      selectedLineId,
      activePlan,
      scenarioHistory,
      reducedMotion,
      persistHistory,
      pendingAdjustments,
      activeUpload,
      uploadHistory,
      setLine: setSelectedLineId,
      setPlan: setActivePlan,
      addScenario,
      setReducedMotion,
      setPersistHistory,
      setPendingAdjustments,
      setActiveUpload,
      clearActiveUpload,
      loadUpload,
    }}>
      {children}
    </AppContext.Provider>
  );
};
