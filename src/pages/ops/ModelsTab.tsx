import { useState, useEffect } from 'react';
import { makeModelRuns, type ModelRun } from '@/data/pipelineData';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';

interface Props {
  highlightModel?: string;
}

const ModelsTab = ({ highlightModel }: Props) => {
  const [models, setModels] = useState<ModelRun[]>(() => makeModelRuns());
  const [loading, setLoading] = useState(false);
  const [detailModel, setDetailModel] = useState<ModelRun | null>(null);

  useEffect(() => {
    if (highlightModel) {
      const el = document.getElementById(`model-${highlightModel}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightModel]);

  const runAll = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setModels((prev) =>
      prev.map((m) => ({
        ...m,
        ts: new Date().toISOString(),
        confidence: Math.min(0.99, m.confidence + +(Math.random() * 0.03).toFixed(2)),
        status: 'ok' as const,
      }))
    );
    setLoading(false);
    toast.success('All models updated');
  };

  const statusPill = (status: ModelRun['status']) => {
    const map = {
      ok: 'bg-accent-green-light text-accent-green',
      warning: 'bg-accent-orange-light text-accent-orange',
      stale: 'bg-muted text-muted-foreground',
    };
    const dotMap = { ok: 'bg-accent-green', warning: 'bg-accent-orange', stale: 'bg-muted-foreground' };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${map[status]}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotMap[status]}`} />
        {status}
      </span>
    );
  };

  const driftBadge = (drift: ModelRun['drift']) => {
    const map = { low: 'text-accent-green', med: 'text-accent-orange', high: 'text-accent-red' };
    return <span className={`text-[10px] font-semibold ${map[drift]}`}>Drift: {drift}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">AI / ML Models</h3>
        <button onClick={runAll} disabled={loading} className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-purple text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50">
          {loading ? 'Running…' : 'Run All Models (Mock)'}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-3xl shadow-sm border border-border p-5 space-y-3">
              <Skeleton className="h-4 w-2/3 rounded-xl" />
              <Skeleton className="h-8 w-1/2 rounded-xl" />
              <Skeleton className="h-3 w-full rounded-xl" />
              <Skeleton className="h-3 w-3/4 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((m) => (
            <div
              key={m.id}
              id={`model-${m.id}`}
              className={`bg-card rounded-3xl shadow-sm border p-5 transition-all ${
                highlightModel === m.id ? 'border-accent-purple ring-2 ring-accent-purple/20' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {statusPill(m.status)}
                {driftBadge(m.drift)}
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1">{m.name}</h4>
              <p className="text-[10px] text-muted-foreground mb-3">{m.techniqueLabel}</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <div className="text-lg font-bold text-foreground">{Math.round(m.confidence * 100)}%</div>
                  <div className="text-[10px] text-muted-foreground">Confidence</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-foreground">{new Date(m.ts).toLocaleTimeString()}</div>
                  <div className="text-[10px] text-muted-foreground">Last Run</div>
                </div>
              </div>

              <button onClick={() => setDetailModel(m)} className="w-full py-2 rounded-xl text-[11px] font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                View Run Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <Sheet open={!!detailModel} onOpenChange={(open) => !open && setDetailModel(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{detailModel?.name}</SheetTitle>
            <SheetDescription>{detailModel?.techniqueLabel}</SheetDescription>
          </SheetHeader>
          {detailModel && (
            <div className="mt-6 space-y-5">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Inputs</div>
                <ul className="space-y-1">
                  {detailModel.inputs.map((inp, i) => (
                    <li key={i} className="text-sm text-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-accent-blue" />
                      {inp}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Outputs</div>
                <ul className="space-y-1">
                  {detailModel.outputs.map((out, i) => (
                    <li key={i} className="text-sm text-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-accent-green" />
                      {out}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2 uppercase">Why It Matters</div>
                <ul className="space-y-2">
                  {detailModel.whyItMatters.map((w, i) => (
                    <li key={i} className="text-sm text-foreground bg-visual-area rounded-xl p-3 border border-border">{w}</li>
                  ))}
                </ul>
              </div>
              <div className="text-[11px] text-muted-foreground italic">{detailModel.notes}</div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default ModelsTab;
