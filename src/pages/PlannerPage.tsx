import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { lines, stationsByLine, type Plan } from '@/data/sampleData';
import { predictCapacity, validatePlan, type PredictionResult, type ValidationResult } from '@/data/mockEngine';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import UploadContextBanner from '@/components/layout/UploadContextBanner';

const PlannerPage = () => {
  const navigate = useNavigate();
  const { activePlan, setPlan, selectedLineId, setLine, activeUpload } = useApp();

  const uploadLineId = activeUpload?.meta.lineIds[0];
  const uploadPlannedUnits = activeUpload?.aggregates.plannedUnitsTotal;

  const [lineId, setLineId] = useState(uploadLineId || activePlan.lineId || selectedLineId);
  const [workingHours, setWorkingHours] = useState(activePlan.workingHours);
  const [shifts, setShifts] = useState(activePlan.shifts);
  const [plannedUnits, setPlannedUnits] = useState(uploadPlannedUnits || activePlan.plannedUnits);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const currentPlan: Plan = {
    id: 'CUSTOM',
    lineId,
    workingHours,
    shifts,
    plannedUnits,
    taktTimeSec: Math.round((workingHours * 3600 * shifts) / plannedUnits),
    startDate: '2026-03-01',
    endDate: '2026-03-31',
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (plannedUnits < 100) e.plannedUnits = 'Minimum 100 units';
    if (plannedUnits > 5000) e.plannedUnits = 'Maximum 5000 units';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePredict = async () => {
    if (!validate()) return;
    setLoading(true);
    setPrediction(null);
    setValidation(null);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));
    const stations = stationsByLine[lineId];
    const result = predictCapacity(currentPlan, stations);
    setPrediction(result);
    setPlan(currentPlan);
    setLine(lineId);
    setLoading(false);
  };

  const handleValidate = async () => {
    if (!prediction) {
      toast.info('Run prediction first');
      return;
    }
    setLoading(true);
    setValidation(null);
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 300));
    const result = validatePlan(currentPlan, prediction.predictedCapacityUnits);
    setValidation(result);
    setLoading(false);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ plan: currentPlan, prediction, validation }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${lineId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported');
  };

  return (
    <div className="space-y-0">
      <UploadContextBanner />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form card */}
      <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Plan Configuration</h2>

        <div className="space-y-5">
          {/* Line */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Production Line</label>
            <select
              value={lineId}
              onChange={(e) => setLineId(e.target.value)}
              className="w-full rounded-xl border border-border bg-visual-area px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {lines.map((l) => <option key={l.lineId} value={l.lineId}>{l.name}</option>)}
            </select>
          </div>

          {/* Working Hours */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 flex justify-between">
              <span>Working Hours</span>
              <span className="text-foreground">{workingHours}h</span>
            </label>
            <input
              type="range"
              min={6}
              max={12}
              value={workingHours}
              onChange={(e) => setWorkingHours(Number(e.target.value))}
              className="w-full accent-accent-blue"
            />
          </div>

          {/* Shifts */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Shifts</label>
            <div className="flex gap-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  onClick={() => setShifts(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    shifts === s
                      ? 'bg-foreground text-primary-foreground border-foreground'
                      : 'bg-card border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s} Shift{s > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Planned Units */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Planned Units</label>
            <input
              type="number"
              value={plannedUnits}
              onChange={(e) => setPlannedUnits(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-visual-area px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {errors.plannedUnits && <p className="text-xs text-destructive mt-1">{errors.plannedUnits}</p>}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button onClick={handlePredict} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-accent-blue text-primary-foreground hover:opacity-90 transition-opacity">
            Predict Capacity
          </button>
          <button onClick={handleValidate} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-accent-green text-primary-foreground hover:opacity-90 transition-opacity">
            Validate Plan
          </button>
          <button onClick={handleExport} className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
            Export
          </button>
          <button onClick={() => navigate('/reports?tab=models&highlight=capacityPrediction')} className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
            Model Confidence
          </button>
        </div>
      </div>

      {/* Results card */}
      <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-6">Results</h2>

        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-8 w-3/4 rounded-xl" />
            <Skeleton className="h-8 w-1/2 rounded-xl" />
          </div>
        )}

        {!loading && !prediction && (
          <p className="text-sm text-muted-foreground">Run a prediction to see results.</p>
        )}

        {!loading && prediction && (
          <div className="space-y-5">
            {/* Capacity */}
            <div className="bg-visual-area rounded-2xl p-4 border border-border">
              <div className="text-xs text-muted-foreground mb-1">Predicted Capacity</div>
              <div className="text-3xl font-bold text-foreground">{prediction.predictedCapacityUnits.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">units</span></div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(prediction.confidence * 100)}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-accent-green transition-all duration-700" style={{ width: `${prediction.confidence * 100}%` }} />
                </div>
              </div>
            </div>

            {/* Drivers */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground mb-2">Impact Drivers</div>
              <div className="flex gap-2">
                {prediction.drivers.map((d) => (
                  <span key={d.name} className="text-[10px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {d.name}: {d.impactPct}%
                  </span>
                ))}
              </div>
            </div>

            {/* Validation */}
            {validation && (
              <div className="bg-visual-area rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                    validation.feasible
                      ? 'bg-accent-green-light text-accent-green'
                      : 'bg-accent-red-light text-accent-red'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${validation.feasible ? 'bg-accent-green' : 'bg-accent-red'}`} />
                    {validation.feasible ? 'Feasible' : 'Not Feasible'}
                  </span>
                  {validation.overloadPct != null && <span className="text-xs text-accent-red">Overload: {validation.overloadPct}%</span>}
                  {validation.idlePct != null && <span className="text-xs text-accent-blue">Idle: {validation.idlePct}%</span>}
                </div>
                {validation.warnings.length > 0 && (
                  <ul className="space-y-1">
                    {validation.warnings.map((w, i) => (
                      <li key={i} className="text-[11px] text-accent-orange flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-accent-orange" />
                        {w}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default PlannerPage;
