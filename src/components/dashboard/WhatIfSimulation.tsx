import { useState, useEffect } from 'react';
import { useTypewriter } from '@/hooks/useTypewriter';

const scenarios = [
  { title: 'Add 1 Shift', icon: 'plus', color: 'accent-green', tags: ['Utilization +6%', 'OT Cost -8%', 'Feasible'] },
  { title: 'Reduce Working Hours', icon: 'clock', color: 'accent-blue', tags: ['Utilization -4%', 'Idle +3%', 'Risk'] },
  { title: 'Rebalance Model Mix', icon: 'sliders', color: 'accent-orange', tags: ['Bottleneck -1', 'Stability +', 'Feasible'] },
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
  const { displayText } = useTypewriter({
    texts: ['Simulate: Line A + Shift 2 + 1250 units', 'What if downtime increases by 10%?'],
    typeSpeed: 50,
    deleteSpeed: 20,
    pauseDuration: 3000,
  });

  const [activeTab, setActiveTab] = useState<'scenario' | 'compare'>('scenario');
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -40, y: -40 });
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [showToast, setShowToast] = useState(false);
  const [showCompare, setShowCompare] = useState(false);

  // Duplicated cards for seamless scroll
  const allScenarios = [...scenarios, ...scenarios];

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      while (!cancelled) {
        setActiveTab('scenario');
        setShowCompare(false);
        setRunState('idle');
        await delay(4000);
        if (cancelled) return;

        // Cursor appears, moves to Run
        setCursorVisible(true);
        setCursorPos({ x: -30, y: 200 });
        await delay(200);
        setCursorPos({ x: 320, y: 250 });
        await delay(700);
        if (cancelled) return;

        setTooltipText('Run Scenario');
        setTooltipVisible(true);
        await delay(500);

        setCursorClick(true);
        setRunState('running');
        await delay(200);
        setCursorClick(false);
        setTooltipVisible(false);
        await delay(600);
        setRunState('done');
        setShowToast(true);
        await delay(2000);
        setShowToast(false);
        setRunState('idle');
        if (cancelled) return;

        // Move to Compare tab
        setCursorPos({ x: 130, y: 14 });
        await delay(700);
        setTooltipText('Compare Scenarios');
        setTooltipVisible(true);
        await delay(500);
        setCursorClick(true);
        await delay(150);
        setCursorClick(false);
        setActiveTab('compare');
        setShowCompare(true);
        setTooltipVisible(false);
        await delay(3000);

        setCursorVisible(false);
        await delay(2000);
      }
    };

    runAnimation();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden col-span-1 md:col-span-2">
      <div className="h-[280px] bg-visual-area border-b border-border relative p-5 shadow-inner flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('scenario')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'scenario' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              Scenario
            </button>
            <button
              onClick={() => setActiveTab('compare')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'compare' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
            >
              Compare
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {[20, 21].map((n) => (
                <img key={n} src={`https://i.pravatar.cc/24?img=${n}`} alt="" className="w-6 h-6 rounded-full border-2 border-visual-area" />
              ))}
            </div>
            <button className="text-[10px] font-medium px-2 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors">
              Share
            </button>
          </div>
        </div>

        {/* Content area */}
        {activeTab === 'scenario' && !showCompare ? (
          <div className="flex-1 overflow-hidden relative">
            <div
              className="flex gap-3 auto-scroll-track"
              style={{
                width: `${allScenarios.length * 216}px`,
                maskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%)',
              }}
            >
              {allScenarios.map((s, i) => (
                <div key={i} className="w-[200px] flex-shrink-0 bg-card rounded-2xl border border-border p-3 shadow-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `hsl(var(--${s.color}-light))`, color: `hsl(var(--${s.color}))` }}>
                    {icons[s.icon]}
                  </div>
                  <div className="text-xs font-semibold text-foreground mb-2">{s.title}</div>
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map((tag, j) => (
                      <span
                        key={j}
                        className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                          tag === 'Risk' ? 'bg-accent-red-light text-accent-red' :
                          tag === 'Feasible' ? 'bg-accent-green-light text-accent-green' :
                          'bg-muted text-muted-foreground'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-end gap-4 px-4 pb-2">
            {['Shift +1', 'Reduce Hrs', 'Rebalance'].map((label, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-1 items-end justify-center h-24">
                  <div
                    className="w-5 rounded-t transition-all duration-700"
                    style={{ height: `${[70, 45, 60][i]}%`, backgroundColor: 'hsl(var(--accent-blue))' }}
                  />
                  <div
                    className="w-5 rounded-t transition-all duration-700"
                    style={{ height: `${[85, 55, 75][i]}%`, backgroundColor: 'hsl(var(--accent-green))' }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground font-medium">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Bottom input bar */}
        <div className="mt-auto pt-3 flex items-center gap-2">
          <div className="flex-1 bg-card rounded-xl border border-border px-3 py-2 text-xs text-muted-foreground">
            {displayText}<span className="typewriter-cursor" />
          </div>
          <button
            className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-foreground transition-all duration-200 flex-shrink-0"
            style={{
              backgroundColor: runState === 'done' ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-orange))',
              boxShadow: runState === 'idle' ? '0 0 12px hsla(var(--accent-orange), 0.3)' : 'none',
              transform: runState === 'running' ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            {runState === 'done' ? '✓' : 'Run'}
          </button>
        </div>

        {/* Toast */}
        {showToast && (
          <div
            className="absolute bottom-16 right-5 bg-foreground text-primary-foreground text-[11px] font-medium px-3 py-2 rounded-lg shadow-lg"
            style={{ animation: 'toastIn 0.3s ease-out' }}
          >
            Scenario completed in 1.2s
          </div>
        )}

        {/* Mock cursor */}
        {cursorVisible && (
          <div
            className="mock-cursor"
            style={{ left: cursorPos.x, top: cursorPos.y, transform: cursorClick ? 'scale(0.9)' : 'scale(1)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--accent-green))" stroke="white" strokeWidth="1.5">
              <path d="M5 3l14 8-7 2-3 7z" />
            </svg>
            <div className={`cursor-tooltip ${tooltipVisible ? 'visible' : ''}`}>{tooltipText}</div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-base">What-If Engine</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Simulate multiple scenarios in seconds (shifts, hours, model mix) and compare outcomes.
        </p>
      </div>
    </div>
  );
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default WhatIfSimulation;
