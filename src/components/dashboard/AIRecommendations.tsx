import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { buildDashboardSummary } from '@/data/planComparison';
import { toast } from 'sonner';

const AIRecommendations = () => {
  const navigate = useNavigate();
  const { setPendingAdjustments, activeUpload } = useApp();
  const isContextual = !!activeUpload;
  const summary = isContextual ? buildDashboardSummary(activeUpload) : null;

  const [highlightActive, setHighlightActive] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -40, y: -40 });
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleApply = () => {
    setPendingAdjustments({ shiftDelta: 1, workingHoursDelta: 0, downtimeDeltaPct: -5, scrapDeltaPct: 0 });
    toast.success('Draft scenario created');
    navigate('/simulations');
  };

  useEffect(() => {
    if (isContextual) return;
    let cancelled = false;
    const runAnimation = async () => {
      while (!cancelled) {
        setHighlightActive(false);
        setToolbarVisible(false);
        setCursorVisible(false);
        setShowToast(false);
        await delay(2000);
        if (cancelled) return;
        setCursorVisible(true);
        setCursorPos({ x: -20, y: 100 });
        await delay(300);
        setCursorPos({ x: 120, y: 120 });
        await delay(600);
        if (cancelled) return;
        setHighlightActive(true);
        await delay(800);
        if (cancelled) return;
        setToolbarVisible(true);
        await delay(1200);
        if (cancelled) return;
        setCursorPos({ x: 155, y: 76 });
        await delay(700);
        setTooltipText('Create What-If');
        setTooltipVisible(true);
        await delay(500);
        if (cancelled) return;
        setCursorClick(true);
        await delay(150);
        setCursorClick(false);
        setTooltipVisible(false);
        setShowToast(true);
        await delay(2000);
        setShowToast(false);
        setToolbarVisible(false);
        setCursorVisible(false);
        await delay(2000);
      }
    };
    runAnimation();
    return () => { cancelled = true; };
  }, [isContextual]);

  const contextualRecommendation = summary
    ? summary.feasible
      ? `Current plan is feasible with ${summary.idlePct}% idle capacity. Consider reducing shifts or redistributing volume to optimize cost.`
      : `Plan exceeds capacity by ${summary.overloadPct}%. Add a shift or reduce target by ${Math.abs(summary.gapUnits)} units to reach feasibility.`
    : '';

  const contextualAction = summary
    ? summary.feasible
      ? 'Estimated improvement: cost -8%, throughput maintained.'
      : `Estimated improvement: throughput +${Math.min(summary.overloadPct, 15)}%, overload eliminated.`
    : '';

  return (
    <div
      className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
      onClick={() => navigate('/bottlenecks')}
      data-testid="card-ai-recommendations"
    >
      <div className="h-[280px] bg-visual-area border-b border-border relative p-5 shadow-inner">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm h-full overflow-hidden relative">
          <div className="text-sm font-semibold text-foreground mb-3">Recommendations</div>

          {isContextual ? (
            <>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                {contextualRecommendation}
              </p>
              <p className="text-[11px] leading-relaxed text-foreground font-medium mb-2">
                Next best action: {summary?.feasible
                  ? 'Optimize shift allocation and redistribute volume to reduce idle cost.'
                  : 'Adjust shift allocation and optimize sequencing to reduce overload risk.'}
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {contextualAction}
              </p>
              <div className="absolute bottom-3 left-3 right-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleApply(); }}
                  className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-accent-blue text-primary-foreground hover:opacity-90 transition-opacity"
                  data-testid="button-apply-recommendation"
                >
                  Apply as Scenario
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                Based on current plan analysis, shift allocation on Line A exceeds optimal capacity by 8%.
                Consider redistributing volume to Line B during off-peak windows.
              </p>
              <div className="relative inline mb-2">
                <p className="text-[11px] leading-relaxed relative z-10" style={{ color: highlightActive ? 'hsl(199, 79%, 32%)' : undefined, transition: 'color 0.4s' }}>
                  <span className="relative">
                    Next best action: Adjust shift allocation and optimize sequencing to reduce overload risk.
                    {highlightActive && (
                      <span className="absolute inset-0 -mx-0.5 -my-0.5 rounded" style={{ backgroundColor: 'hsl(var(--accent-blue-light))', zIndex: -1, animation: 'highlightExpand 0.5s ease-out forwards', transformOrigin: 'left' }} />
                    )}
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                Estimated improvement: throughput +6%, idle time -12%.
              </p>

              {toolbarVisible && (
                <div className="absolute left-1/2 -translate-x-1/2 top-[68px] floating-toolbar z-40">
                  <div className="bg-foreground text-primary-foreground rounded-lg px-2 py-1.5 flex items-center gap-1 shadow-xl relative" onClick={(e) => e.stopPropagation()}>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45" />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--accent-purple))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" /></svg>
                    <div className="w-px h-4 bg-primary-foreground/20 mx-0.5" />
                    <button onClick={handleApply} className="p-1 hover:bg-primary-foreground/10 rounded transition-colors" title="Apply">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </button>
                    <button className="p-1 hover:bg-primary-foreground/10 rounded transition-colors" title="Create Scenario">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /></svg>
                    </button>
                    <button className="p-1 hover:bg-primary-foreground/10 rounded transition-colors" title="Export">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {showToast && (
                <div className="absolute bottom-3 right-3 bg-foreground text-primary-foreground text-[10px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg z-50" style={{ animation: 'toastIn 0.3s ease-out' }}>
                  Scenario draft created
                </div>
              )}

              {cursorVisible && (
                <div className="mock-cursor" style={{ left: cursorPos.x, top: cursorPos.y, transform: cursorClick ? 'scale(0.9)' : 'scale(1)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="hsl(var(--accent-blue))" stroke="white" strokeWidth="1.5"><path d="M5 3l14 8-7 2-3 7z" /></svg>
                  <div className={`cursor-tooltip ${tooltipVisible ? 'visible' : ''}`}>{tooltipText}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-base">Actionable Recommendations</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Suggests shift adjustments, model mix balancing, and sequencing optimization with explainable rationale.
        </p>
      </div>
    </div>
  );
};

function delay(ms: number) { return new Promise((resolve) => setTimeout(resolve, ms)); }

export default AIRecommendations;
