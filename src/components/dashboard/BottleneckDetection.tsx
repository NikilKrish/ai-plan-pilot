import { useState, useEffect, useRef } from 'react';

const stations = [
  { id: 'S12', label: 'Station S12 — Cycle Time Variance', color: 'accent-red', width: 92, insights: ['Peak variance: Shift 2', 'Suggested action: rebalance sequencing'] },
  { id: 'S07', label: 'Station S07 — Downtime Spikes', color: 'accent-orange', width: 78, insights: ['Spike frequency: 3x/shift', 'Suggested action: preventive maintenance'] },
  { id: 'S03', label: 'Station S03 — Scrap Loss', color: 'accent-purple', width: 65, insights: ['Scrap rate: 4.2%', 'Suggested action: quality check at input'] },
  { id: 'S15', label: 'Station S15 — Changeover', color: 'accent-blue', width: 51, insights: ['Avg changeover: 18min', 'Suggested action: SMED optimization'] },
];

const BottleneckDetection = () => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -40, y: -40 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBarsAnimated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runAnimation = async () => {
      while (!cancelled) {
        // Reset
        setExpandedRow(null);
        setCursorVisible(false);
        setTooltipVisible(false);
        await delay(1500);
        if (cancelled) return;

        // Show cursor
        setCursorVisible(true);
        setCursorPos({ x: 200, y: 20 });
        await delay(400);
        if (cancelled) return;

        // Animate through first 2 rows
        for (let i = 0; i < 2; i++) {
          if (cancelled) return;
          setCursorPos({ x: 200, y: 38 + i * 56 });
          await delay(600);
          if (cancelled) return;

          setTooltipText('Open Root Cause');
          setTooltipVisible(true);
          await delay(500);
          if (cancelled) return;

          setCursorClick(true);
          await delay(150);
          setCursorClick(false);
          setExpandedRow(i);
          setTooltipVisible(false);
          await delay(1800);
          if (cancelled) return;

          setExpandedRow(null);
          await delay(300);
        }

        setCursorVisible(false);
        await delay(2000);
      }
    };

    runAnimation();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden">
      <div className="h-[280px] bg-visual-area border-b border-border relative p-5 shadow-inner" ref={containerRef}>
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm h-full overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Bottlenecks</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-red-light text-accent-red">Top Constraints</span>
          </div>

          {/* Rows */}
          <div className="space-y-1">
            {stations.map((station, i) => (
              <div key={station.id}>
                <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-[10px] font-bold text-muted-foreground w-6">{i + 1}</span>
                  <span className="text-[11px] font-medium text-foreground flex-1 truncate">{station.label}</span>
                  <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: barsAnimated ? `${station.width}%` : '0%',
                        backgroundColor: `hsl(var(--${station.color}))`,
                        transitionDelay: `${i * 200}ms`,
                      }}
                    />
                  </div>
                </div>
                {/* Expanded drawer */}
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: expandedRow === i ? '60px' : '0' }}
                >
                  <div className="pl-8 pr-2 py-1.5 space-y-0.5">
                    {station.insights.map((insight, j) => (
                      <div key={j} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `hsl(var(--${station.color}))` }} />
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mock cursor */}
          {cursorVisible && (
            <div
              className="mock-cursor"
              style={{
                left: cursorPos.x,
                top: cursorPos.y,
                transform: cursorClick ? 'scale(0.9)' : 'scale(1)',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--accent-blue))" stroke="white" strokeWidth="1.5">
                <path d="M5 3l14 8-7 2-3 7z" />
              </svg>
              <div className={`cursor-tooltip ${tooltipVisible ? 'visible' : ''}`}>{tooltipText}</div>
            </div>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-base">Bottleneck Detection</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Identifies constraint stations early and explains drivers (cycle time, downtime, scrap).
        </p>
      </div>
    </div>
  );
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default BottleneckDetection;
