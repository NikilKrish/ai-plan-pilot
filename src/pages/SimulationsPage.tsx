import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { stationsByLine, type Adjustments, type ScenarioRecord } from '@/data/sampleData';
import { simulateScenario, predictCapacity, validatePlan } from '@/data/mockEngine';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const SimulationsPage = () => {
  const { activePlan, addScenario, pendingAdjustments, setPendingAdjustments } = useApp();

  const [adjustments, setAdj] = useState<Adjustments>(
    pendingAdjustments ?? { shiftDelta: 1, workingHoursDelta: 0, downtimeDeltaPct: 0, scrapDeltaPct: 0 }
  );

  const [result, setResult] = useState<{
    utilizationDelta: number;
    overloadDelta: number;
    bottleneckCountDelta: number;
    feasibleAfter: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const stations = stationsByLine[activePlan.lineId];

  const baseline = useMemo(() => {
    const pred = predictCapacity(activePlan, stations);
    const val = validatePlan(activePlan, pred.predictedCapacityUnits);
    return { capacity: pred.predictedCapacityUnits, feasible: val.feasible, utilization: Math.round((pred.predictedCapacityUnits / activePlan.plannedUnits) * 100) };
  }, [activePlan, stations]);

  const handleRun = async () => {
    setLoading(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 300));
    const sim = simulateScenario(activePlan, stations, adjustments);
    setResult(sim);

    const record: ScenarioRecord = {
      id: `SCN_${Date.now()}`,
      timestamp: new Date().toISOString(),
      lineId: activePlan.lineId,
      adjustments: { ...adjustments },
      result: sim,
    };
    addScenario(record);
    setPendingAdjustments(null);
    setLoading(false);
    toast.success('Scenario completed in 1.2s');
  };

  const adj = (key: keyof Adjustments, delta: number) => {
    setAdj((prev) => ({ ...prev, [key]: prev[key] + delta }));
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">Scenario Simulation</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-6 space-y-5">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Baseline Plan</div>
            <div className="bg-visual-area rounded-2xl p-4 border border-border text-sm text-foreground grid grid-cols-2 gap-2">
              <div>Line: <span className="font-semibold">{activePlan.lineId.replace('LINE_', '')}</span></div>
              <div>Shifts: <span className="font-semibold">{activePlan.shifts}</span></div>
              <div>Hours: <span className="font-semibold">{activePlan.workingHours}h</span></div>
              <div>Target: <span className="font-semibold">{activePlan.plannedUnits} units</span></div>
              <div>Capacity: <span className="font-semibold">{baseline.capacity}</span></div>
              <div>Utilization: <span className="font-semibold">{baseline.utilization}%</span></div>
            </div>
          </div>

          <div className="text-xs font-semibold text-muted-foreground">Adjustments</div>

          {[
            { label: 'Shift', key: 'shiftDelta' as const, step: 1 },
            { label: 'Working Hours', key: 'workingHoursDelta' as const, step: 1 },
            { label: 'Downtime %', key: 'downtimeDeltaPct' as const, step: 5 },
            { label: 'Scrap %', key: 'scrapDeltaPct' as const, step: 1 },
          ].map(({ label, key, step }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{label}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => adj(key, -step)} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center text-sm font-bold">−</button>
                <span className="w-12 text-center text-sm font-semibold text-foreground">
                  {adjustments[key] > 0 ? '+' : ''}{adjustments[key]}{key.includes('Pct') ? '%' : ''}
                </span>
                <button onClick={() => adj(key, step)} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center justify-center text-sm font-bold">+</button>
              </div>
            </div>
          ))}

          <button onClick={handleRun} className="w-full py-3 rounded-xl text-sm font-semibold bg-accent-orange text-primary-foreground hover:opacity-90 transition-opacity">
            Run Scenario
          </button>
        </div>

        {/* Results */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Comparison</h3>

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          )}

          {!loading && !result && <p className="text-sm text-muted-foreground">Adjust parameters and run a scenario to compare.</p>}

          {!loading && result && (
            <div className="space-y-5">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                result.feasibleAfter ? 'bg-accent-green-light text-accent-green' : 'bg-accent-red-light text-accent-red'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${result.feasibleAfter ? 'bg-accent-green' : 'bg-accent-red'}`} />
                {result.feasibleAfter ? 'Feasible After' : 'Still Not Feasible'}
              </div>

              {/* Delta bars */}
              {[
                { label: 'Utilization', value: result.utilizationDelta, suffix: '%' },
                { label: 'Overload', value: result.overloadDelta, suffix: '%' },
                { label: 'Bottleneck Count', value: result.bottleneckCountDelta, suffix: '' },
              ].map(({ label, value, suffix }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-semibold ${value > 0 ? 'text-accent-green' : value < 0 ? 'text-accent-red' : 'text-muted-foreground'}`}>
                      {value > 0 ? '+' : ''}{value}{suffix}
                    </span>
                  </div>
                  <div className="h-3 bg-border rounded-full overflow-hidden relative">
                    <div className="absolute left-1/2 top-0 w-px h-full bg-muted-foreground/30" />
                    <div
                      className="h-full rounded-full transition-all duration-700 absolute"
                      style={{
                        width: `${Math.min(Math.abs(value) * 2, 50)}%`,
                        left: value >= 0 ? '50%' : undefined,
                        right: value < 0 ? '50%' : undefined,
                        backgroundColor: value >= 0 ? 'hsl(var(--accent-green))' : 'hsl(var(--accent-red))',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulationsPage;
