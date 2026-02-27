import { useState, useMemo } from 'react';
import { makeDeviationLog, type Deviation } from '@/data/pipelineData';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const FeedbackTab = () => {
  const { scenarioHistory } = useApp();
  const [deviations, setDeviations] = useState<Deviation[]>(() => makeDeviationLog());

  const summary = useMemo(() => {
    const totalPlanned = deviations.reduce((a, d) => a + d.plannedUnits, 0);
    const totalActual = deviations.reduce((a, d) => a + d.actualUnits, 0);
    const gapPct = totalPlanned > 0 ? +((1 - totalActual / totalPlanned) * 100).toFixed(1) : 0;
    return { totalPlanned, totalActual, gapPct };
  }, [deviations]);

  const markResolved = (id: string) => {
    setDeviations((prev) => prev.map((d) => d.id === id ? { ...d, resolved: true } : d));
    toast.success('Deviation marked as resolved');
  };

  const severityPill = (s: Deviation['severity']) => {
    const map = { high: 'bg-accent-red-light text-accent-red', med: 'bg-accent-orange-light text-accent-orange', low: 'bg-accent-green-light text-accent-green' };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${map[s]}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className="text-2xl font-bold text-foreground">{summary.totalPlanned.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase mt-1">Planned Units</div>
        </div>
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className="text-2xl font-bold text-foreground">{summary.totalActual.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground uppercase mt-1">Actual Units</div>
        </div>
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className={`text-2xl font-bold ${summary.gapPct > 8 ? 'text-accent-red' : summary.gapPct > 4 ? 'text-accent-orange' : 'text-accent-green'}`}>{summary.gapPct}%</div>
          <div className="text-[10px] text-muted-foreground uppercase mt-1">Gap</div>
        </div>
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className="text-2xl font-bold text-foreground">{deviations.filter(d => !d.resolved).length}</div>
          <div className="text-[10px] text-muted-foreground uppercase mt-1">Open Deviations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deviation Log */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-[100px_60px_60px_60px_50px_100px_60px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
              <span>Time</span>
              <span>Line</span>
              <span>Planned</span>
              <span>Actual</span>
              <span>Sev.</span>
              <span>Reason</span>
              <span>Action</span>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {deviations.map((d) => (
              <div key={d.id} className="grid grid-cols-[100px_60px_60px_60px_50px_100px_60px] gap-2 items-center px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">{new Date(d.ts).toLocaleTimeString()}</span>
                <span className="text-foreground font-medium">{d.lineId.replace('LINE_', '')}</span>
                <span className="text-foreground">{d.plannedUnits}</span>
                <span className="text-foreground">{d.actualUnits}</span>
                {severityPill(d.severity)}
                <span className="text-muted-foreground truncate">{d.reasonCode}</span>
                <div>
                  {d.resolved ? (
                    <span className="text-[10px] text-accent-green font-semibold">Resolved</span>
                  ) : (
                    <button onClick={() => markResolved(d.id)} className="text-[10px] text-accent-blue font-semibold hover:underline">Resolve</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Retraining card */}
        <div className="space-y-4">
          <div className="bg-card rounded-3xl shadow-sm border border-border p-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Model Retraining</h4>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[10px] text-muted-foreground">Last Retrain</div>
                <div className="text-foreground font-medium">2 hours ago</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Next Scheduled</div>
                <div className="text-foreground font-medium">In 4 hours</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Data Freshness</div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  <span className="text-foreground font-medium">Current (2 min ago)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-3xl shadow-sm border border-border p-5">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Simulation History</h4>
            <div className="text-2xl font-bold text-foreground">{scenarioHistory.length}</div>
            <div className="text-[10px] text-muted-foreground">Total scenarios run</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTab;
