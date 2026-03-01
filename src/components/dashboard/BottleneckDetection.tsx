import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { stationsByLine, kbSnippets } from '@/data/sampleData';
import { rankBottlenecks } from '@/data/mockEngine';
import { buildDashboardSummary } from '@/data/planComparison';

const BottleneckDetection = () => {
  const { selectedLineId, activeUpload } = useApp();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -40, y: -40 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);
  const [barsAnimated, setBarsAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isContextual = !!activeUpload;
  const summary = isContextual ? buildDashboardSummary(activeUpload) : null;

  const bottlenecks = rankBottlenecks(stationsByLine[selectedLineId]);
  const displayStations = bottlenecks.slice(0, 4).map((b) => ({
    id: b.stationId,
    label: `${b.stationName} — ${b.reason}`,
    color: b.rank === 1 ? 'accent-red' : b.rank <= 3 ? 'accent-orange' : 'accent-blue',
    width: b.impactPct,
    insights: [
      `Effective cycle time: ${b.effectiveCycleTime.toFixed(1)}s`,
      `Impact: ${b.impactPct}%`,
    ],
    reason: b.reason,
  }));

  useEffect(() => { setBarsAnimated(true); }, []);

  useEffect(() => {
    if (isContextual) return;
    let cancelled = false;
    const runAnimation = async () => {
      while (!cancelled) {
        setExpandedRow(null);
        setCursorVisible(false);
        setTooltipVisible(false);
        setRecommendation(null);
        await delay(3000);
        if (cancelled) return;
        setCursorVisible(true);
        setCursorPos({ x: 200, y: 20 });
        await delay(400);
        if (cancelled) return;
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
  }, [isContextual]);

  const handleRowClick = (i: number) => {
    setExpandedRow(expandedRow === i ? null : i);
    setRecommendation(null);
  };

  const handleGenerateRec = (station: typeof displayStations[0]) => {
    const snippet = kbSnippets.find((s) =>
      station.reason.toLowerCase().includes('downtime') ? s.topic.includes('Downtime') :
      station.reason.toLowerCase().includes('scrap') ? s.topic.includes('Scrap') :
      s.topic.includes('Variance')
    );
    setRecommendation(`${station.label}: ${snippet?.content ?? 'Investigate further.'}`);
  };

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden" data-testid="card-bottleneck-detection">
      <div className="h-[280px] bg-visual-area border-b border-border relative p-5 shadow-inner" ref={containerRef}>
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm h-full overflow-hidden relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-foreground">Bottlenecks</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-red-light text-accent-red">
              {isContextual ? `${summary?.bottleneckCount || 0} found` : 'Top Constraints'}
            </span>
          </div>

          <div className="space-y-1">
            {displayStations.map((station, i) => (
              <div key={station.id}>
                <div
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(i)}
                  data-testid={`row-bottleneck-${i}`}
                >
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
                <div className="overflow-hidden transition-all duration-300 ease-out" style={{ maxHeight: expandedRow === i ? '90px' : '0' }}>
                  <div className="pl-8 pr-2 py-1.5 space-y-1">
                    {station.insights.map((insight, j) => (
                      <div key={j} className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full" style={{ backgroundColor: `hsl(var(--${station.color}))` }} />
                        {insight}
                      </div>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleGenerateRec(station); }}
                      className="text-[10px] font-semibold text-accent-purple hover:underline mt-0.5"
                    >
                      Generate Recommendation
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {recommendation && (
            <div className="absolute bottom-2 left-2 right-2 bg-accent-purple-light border border-accent-purple/20 rounded-xl p-2 text-[10px] text-foreground z-30">
              {recommendation}
            </div>
          )}

          {!isContextual && cursorVisible && (
            <div className="mock-cursor" style={{ left: cursorPos.x, top: cursorPos.y, transform: cursorClick ? 'scale(0.9)' : 'scale(1)' }}>
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

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export default BottleneckDetection;
