import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const ReportsPage = () => {
  const { scenarioHistory, persistHistory, setPersistHistory, reducedMotion, setReducedMotion } = useApp();

  const displayHistory = scenarioHistory.slice(0, 10);

  const insights = useMemo(() => {
    if (scenarioHistory.length === 0) return null;
    const best = scenarioHistory.reduce((a, b) => a.result.utilizationDelta > b.result.utilizationDelta ? a : b);
    const feasibleCount = scenarioHistory.filter((s) => s.result.feasibleAfter).length;
    const avgFeasibility = Math.round((feasibleCount / scenarioHistory.length) * 100);
    const bottleneckSum: Record<string, number> = {};
    scenarioHistory.forEach((s) => {
      const key = s.lineId;
      bottleneckSum[key] = (bottleneckSum[key] || 0) + 1;
    });
    const worstLine = Object.entries(bottleneckSum).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

    return { best, avgFeasibility, worstLine };
  }, [scenarioHistory]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(scenarioHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario-history.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('History exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Reports & History</h2>
        <button onClick={handleExport} className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
          Export All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* History table */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-[140px_80px_1fr_100px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
              <span>Timestamp</span>
              <span>Line</span>
              <span>Adjustments</span>
              <span>Result</span>
            </div>
          </div>

          {displayHistory.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No scenarios yet. Run your first simulation.</div>
          ) : (
            <div className="divide-y divide-border">
              {displayHistory.map((s) => (
                <div key={s.id} className="grid grid-cols-[140px_80px_1fr_100px] gap-2 items-center px-4 py-3 text-sm">
                  <span className="text-xs text-muted-foreground">{new Date(s.timestamp).toLocaleString()}</span>
                  <span className="text-foreground font-medium">{s.lineId.replace('LINE_', '')}</span>
                  <div className="flex gap-1 flex-wrap">
                    {s.adjustments.shiftDelta !== 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Shift {s.adjustments.shiftDelta > 0 ? '+' : ''}{s.adjustments.shiftDelta}</span>}
                    {s.adjustments.workingHoursDelta !== 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Hours {s.adjustments.workingHoursDelta > 0 ? '+' : ''}{s.adjustments.workingHoursDelta}</span>}
                    {s.adjustments.downtimeDeltaPct !== 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">DT {s.adjustments.downtimeDeltaPct > 0 ? '+' : ''}{s.adjustments.downtimeDeltaPct}%</span>}
                    {s.adjustments.scrapDeltaPct !== 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Scrap {s.adjustments.scrapDeltaPct > 0 ? '+' : ''}{s.adjustments.scrapDeltaPct}%</span>}
                  </div>
                  <span className={`text-xs font-semibold ${s.result.feasibleAfter ? 'text-accent-green' : 'text-accent-red'}`}>
                    {s.result.feasibleAfter ? 'Feasible' : 'Not Feasible'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insights + Settings */}
        <div className="space-y-6">
          <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
            <h3 className="text-sm font-bold text-foreground mb-3">Insights</h3>
            {insights ? (
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Best Scenario</div>
                  <div className="text-foreground font-medium">Util +{insights.best.result.utilizationDelta}% ({insights.best.lineId.replace('LINE_', '')})</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Most Tested Line</div>
                  <div className="text-foreground font-medium">{insights.worstLine.replace('LINE_', 'Line ')}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase">Feasibility Rate</div>
                  <div className="text-foreground font-medium">{insights.avgFeasibility}%</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Run scenarios to generate insights.</p>
            )}
          </div>

          <div className="bg-card rounded-3xl shadow-sm border border-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Settings</h3>

            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">Persist History</span>
              <button
                onClick={() => setPersistHistory(!persistHistory)}
                className={`w-10 h-6 rounded-full transition-colors relative ${persistHistory ? 'bg-accent-green' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${persistHistory ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-sm text-foreground">Reduced Motion</span>
              <button
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`w-10 h-6 rounded-full transition-colors relative ${reducedMotion ? 'bg-accent-green' : 'bg-border'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${reducedMotion ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
