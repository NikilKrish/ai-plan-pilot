import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useApp } from '@/context/AppContext';
import { stationsByLine, type ScenarioRecord, type Adjustments } from '@/data/sampleData';
import { simulateScenario } from '@/data/mockEngine';
import { buildDashboardSummary } from '@/data/planComparison';
import { toast } from 'sonner';

const scenarios = [
  { title: 'Add 1 Shift', icon: 'plus', color: 'accent-green', tags: ['Utilization +6%', 'OT Cost -8%', 'Feasible'], adjustments: { shiftDelta: 1, workingHoursDelta: 0, downtimeDeltaPct: 0, scrapDeltaPct: 0 } as Adjustments },
  { title: 'Reduce Working Hours', icon: 'clock', color: 'accent-blue', tags: ['Utilization -4%', 'Idle +3%', 'Risk'], adjustments: { shiftDelta: 0, workingHoursDelta: -2, downtimeDeltaPct: 0, scrapDeltaPct: 0 } as Adjustments },
  { title: 'Rebalance Model Mix', icon: 'sliders', color: 'accent-orange', tags: ['Bottleneck -1', 'Stability +', 'Feasible'], adjustments: { shiftDelta: 0, workingHoursDelta: 0, downtimeDeltaPct: -10, scrapDeltaPct: -2 } as Adjustments },
  { title: 'Reduce Waste', icon: 'clock', color: 'accent-purple', tags: ['Scrap -3%', 'Yield +', 'Feasible'], adjustments: { shiftDelta: 0, workingHoursDelta: 0, downtimeDeltaPct: 0, scrapDeltaPct: -3 } as Adjustments },
];

const icons: Record<string, JSX.Element> = {
  plus: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  clock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  sliders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    </svg>
  ),
};

const WhatIfSimulation = () => {
  const navigate = useNavigate();
  const { activePlan, addScenario, activeUpload } = useApp();
  const isContextual = !!activeUpload;
  const summary = isContextual ? buildDashboardSummary(activeUpload) : null;

  const { displayText } = useTypewriter({
    texts: isContextual ? [] : ['Simulate: Line A + Shift 2 + 1250 units', 'What if downtime increases by 10%?'],
    typeSpeed: 50, deleteSpeed: 20, pauseDuration: 3000,
  });

  const [activeTab, setActiveTab] = useState<'scenario' | 'compare'>('scenario');
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [selectedScenario, setSelectedScenario] = useState<number | null>(null);
  const [compareData, setCompareData] = useState<{ label: string; before: number; after: number }[]>([]);
  const [lastRunLabel, setLastRunLabel] = useState('');

  const userInteracted = useRef(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -40, y: -40 });
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);

  const stopDemo = useCallback(() => {
    if (!userInteracted.current) {
      userInteracted.current = true;
      setCursorVisible(false);
      setTooltipVisible(false);
    }
  }, []);

  const runScenario = (adj: Adjustments, label: string) => {
    setRunState('running');
    setLastRunLabel(label);
    setTimeout(() => {
      const stations = stationsByLine[activePlan.lineId];
      const sim = simulateScenario(activePlan, stations, adj);
      const record: ScenarioRecord = {
        id: `SCN_${Date.now()}`,
        timestamp: new Date().toISOString(),
        lineId: activePlan.lineId,
        adjustments: { ...adj },
        result: sim,
      };
      addScenario(record);
      setRunState('done');
      setCompareData([
        { label: 'Utilization', before: 65, after: 65 + sim.utilizationDelta },
        { label: 'Overload', before: 12, after: 12 + sim.overloadDelta },
        { label: 'Bottlenecks', before: 3, after: 3 + sim.bottleneckCountDelta },
      ]);
      toast.success(`"${label}" completed in 1.2s`);
      setActiveTab('compare');
      setTimeout(() => setRunState('idle'), 1500);
    }, 700);
  };

  const handleCardClick = (idx: number) => {
    stopDemo();
    setSelectedScenario(idx);
    const s = scenarios[idx];
    runScenario(s.adjustments, s.title);
  };

  const handleRunButton = () => {
    stopDemo();
    if (selectedScenario !== null) {
      const s = scenarios[selectedScenario];
      runScenario(s.adjustments, s.title);
    } else {
      setSelectedScenario(0);
      runScenario(scenarios[0].adjustments, scenarios[0].title);
    }
  };

  useEffect(() => {
    if (isContextual) return;
    let cancelled = false;
    const runAnimation = async () => {
      await delay(3000);
      if (cancelled || userInteracted.current) return;
      setCursorVisible(true);
      setCursorPos({ x: -30, y: 200 });
      await delay(200);
      if (cancelled || userInteracted.current) return;
      setCursorPos({ x: 100, y: 160 });
      await delay(700);
      if (cancelled || userInteracted.current) return;
      setTooltipText('Click to simulate');
      setTooltipVisible(true);
      await delay(600);
      if (cancelled || userInteracted.current) return;
      setCursorClick(true);
      setSelectedScenario(0);
      setRunState('running');
      setLastRunLabel(scenarios[0].title);
      await delay(200);
      setCursorClick(false);
      setTooltipVisible(false);
      await delay(600);
      if (cancelled || userInteracted.current) return;
      setRunState('done');
      setCompareData([
        { label: 'Utilization', before: 65, after: 71 },
        { label: 'Overload', before: 12, after: 8 },
        { label: 'Bottlenecks', before: 3, after: 2 },
      ]);
      await delay(800);
      if (cancelled || userInteracted.current) return;
      setCursorPos({ x: 130, y: 14 });
      await delay(700);
      if (cancelled || userInteracted.current) return;
      setTooltipText('View results');
      setTooltipVisible(true);
      await delay(500);
      setCursorClick(true);
      await delay(150);
      setCursorClick(false);
      setActiveTab('compare');
      setTooltipVisible(false);
      await delay(2000);
      setCursorVisible(false);
      setRunState('idle');
    };
    runAnimation();
    return () => { cancelled = true; };
  }, [isContextual]);

  return (
    <div
      className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden col-span-1 md:col-span-2 cursor-pointer hover:scale-[1.01] transition-transform"
      onClick={() => { stopDemo(); navigate('/simulations'); }}
      data-testid="card-what-if-simulation"
    >
      <div className="min-h-[280px] bg-visual-area border-b border-border relative p-4 sm:p-5 shadow-inner flex flex-col">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex bg-muted rounded-lg p-0.5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => { stopDemo(); setActiveTab('scenario'); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'scenario' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} data-testid="tab-scenario">Scenario</button>
            <button onClick={() => { stopDemo(); setActiveTab('compare'); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'compare' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`} data-testid="tab-compare">Compare</button>
          </div>
          <div className="flex items-center gap-2">
            {!isContextual && (
              <div className="hidden sm:flex -space-x-1.5">
                {[20, 21].map((n) => (
                  <img key={n} src={`https://i.pravatar.cc/24?img=${n}`} alt="" className="w-6 h-6 rounded-full border-2 border-visual-area" />
                ))}
              </div>
            )}
            <button onClick={(e) => e.stopPropagation()} className="text-[10px] font-medium px-2.5 py-1.5 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">Share</button>
          </div>
        </div>

        {activeTab === 'scenario' ? (
          <div className="flex-1 overflow-hidden relative">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {scenarios.map((s, i) => {
                const isSelected = selectedScenario === i;
                return (
                  <div
                    key={i}
                    onClick={(e) => { e.stopPropagation(); handleCardClick(i); }}
                    className={`w-[170px] sm:w-[190px] flex-shrink-0 bg-card rounded-2xl border p-3 shadow-sm cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.97] snap-start ${isSelected ? 'border-accent-orange ring-2 ring-accent-orange/30' : 'border-border'}`}
                    data-testid={`card-scenario-${i}`}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `hsl(var(--${s.color}-light))`, color: `hsl(var(--${s.color}))` }}>{icons[s.icon] || icons.clock}</div>
                    <div className="text-xs font-semibold text-foreground mb-2">{s.title}</div>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map((tag, j) => (
                        <span key={j} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${tag === 'Risk' ? 'bg-accent-red-light text-accent-red' : tag === 'Feasible' ? 'bg-accent-green-light text-accent-green' : 'bg-muted text-muted-foreground'}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">Click a scenario to simulate instantly</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {lastRunLabel && (
              <div className="text-[11px] font-medium text-muted-foreground mb-2">
                Results for: <span className="text-foreground">{lastRunLabel}</span>
              </div>
            )}
            <div className="flex-1 flex items-end gap-2 sm:gap-4 px-2 sm:px-4 pb-2">
              {(compareData.length > 0 ? compareData : [
                { label: 'Utilization', before: 65, after: 71 },
                { label: 'Overload', before: 12, after: 8 },
                { label: 'Bottlenecks', before: 3, after: 2 },
              ]).map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="w-full flex gap-1 items-end justify-center h-20 sm:h-24">
                    <div className="w-5 sm:w-6 rounded-t transition-all duration-700" style={{ height: `${Math.min(item.before, 100)}%`, backgroundColor: 'hsl(var(--accent-blue))' }} />
                    <div className="w-5 sm:w-6 rounded-t transition-all duration-700" style={{ height: `${Math.min(Math.max(item.after, 0), 100)}%`, backgroundColor: 'hsl(var(--accent-green))' }} />
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium truncate max-w-full text-center">{item.label}</span>
                  <div className="flex gap-1 text-[8px]">
                    <span style={{ color: 'hsl(var(--accent-blue))' }}>{item.before}%</span>
                    <span className="text-muted-foreground">→</span>
                    <span style={{ color: 'hsl(var(--accent-green))' }}>{item.after}%</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); stopDemo(); setActiveTab('scenario'); }}
              className="mt-2 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors self-center"
            >
              ← Back to scenarios
            </button>
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-card rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground truncate">
            {selectedScenario !== null ? (
              <span className="text-foreground font-medium">{scenarios[selectedScenario].title}</span>
            ) : isContextual ? (
              <span className="text-foreground font-medium">Baseline: {summary?.plannedUnitsTotal.toLocaleString()} units</span>
            ) : (
              <>{displayText}<span className="typewriter-cursor" /></>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleRunButton(); }}
            disabled={runState === 'running'}
            className="px-4 sm:px-5 py-2 rounded-xl text-xs font-semibold text-primary-foreground transition-all duration-200 flex-shrink-0 disabled:opacity-70"
            style={{
              backgroundColor: runState === 'done' ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-orange))',
              boxShadow: runState === 'idle' ? '0 0 12px hsla(var(--accent-orange), 0.3)' : 'none',
              transform: runState === 'running' ? 'scale(0.95)' : 'scale(1)',
            }}
            data-testid="button-run-scenario"
          >
            {runState === 'running' ? '...' : runState === 'done' ? '✓' : 'Run'}
          </button>
        </div>

        {!isContextual && cursorVisible && (
          <div className="mock-cursor hidden sm:block" style={{ left: cursorPos.x, top: cursorPos.y, transform: cursorClick ? 'scale(0.9)' : 'scale(1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--accent-green))" stroke="white" strokeWidth="1.5"><path d="M5 3l14 8-7 2-3 7z" /></svg>
            <div className={`cursor-tooltip ${tooltipVisible ? 'visible' : ''}`}>{tooltipText}</div>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <h3 className="font-semibold text-foreground text-base">What-If Engine</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">Click any scenario card to simulate instantly. Compare before/after outcomes side by side.</p>
      </div>
    </div>
  );
};

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export default WhatIfSimulation;
