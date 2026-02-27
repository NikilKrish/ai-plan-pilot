import { useState, useMemo } from 'react';
import { buildFeatureSnapshots, type FeatureSnapshot } from '@/data/pipelineData';
import { lines } from '@/data/sampleData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Props {
  preselectedLine?: string;
  preselectedStation?: string;
}

const FeaturesTab = ({ preselectedLine, preselectedStation }: Props) => {
  const [lineId, setLineId] = useState(preselectedLine || 'LINE_A');
  const [drawerStation, setDrawerStation] = useState<FeatureSnapshot | null>(null);

  const snapshots = useMemo(() => buildFeatureSnapshots(), []);

  const stationData = useMemo(() => snapshots.filter((s) => s.lineId === lineId), [snapshots, lineId]);

  const lineAgg = useMemo(() => {
    if (stationData.length === 0) return { avgAvail: 0, avgCycle: 0, avgDt: 0 };
    const avg = (arr: number[]) => +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    return {
      avgAvail: avg(stationData.map((s) => s.availabilityPct)),
      avgCycle: avg(stationData.map((s) => s.effectiveCycleTimeSec)),
      avgDt: avg(stationData.map((s) => s.downtimeNormalizedPct)),
    };
  }, [stationData]);

  // Open drawer for preselected station
  useState(() => {
    if (preselectedStation) {
      const s = stationData.find((st) => st.stationId === preselectedStation);
      if (s) setDrawerStation(s);
    }
  });

  const trendBars = (val: number, max: number) => {
    const w = Math.min((val / max) * 100, 100);
    return (
      <div className="flex items-center gap-1">
        <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-accent-blue transition-all duration-300" style={{ width: `${w}%` }} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Line selector */}
      <div className="flex items-center gap-3">
        <select value={lineId} onChange={(e) => setLineId(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          {lines.map((l) => <option key={l.lineId} value={l.lineId}>{l.name}</option>)}
        </select>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className="text-3xl font-bold text-foreground">{lineAgg.avgAvail}%</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase">Availability</div>
        </div>
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className="text-3xl font-bold text-foreground">{lineAgg.avgCycle}s</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase">Eff. Cycle Time</div>
        </div>
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5 text-center">
          <div className="text-3xl font-bold text-foreground">{lineAgg.avgDt}%</div>
          <div className="text-[10px] text-muted-foreground mt-1 uppercase">Downtime Norm.</div>
        </div>
      </div>

      {/* Station table */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-[1fr_80px_90px_80px_70px_70px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
            <span>Station</span>
            <span>Avail %</span>
            <span>Eff Cycle</span>
            <span>DT Norm</span>
            <span>Scrap</span>
            <span>Trend</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {stationData.map((s) => (
            <button
              key={s.stationId}
              onClick={() => setDrawerStation(s)}
              className="w-full grid grid-cols-[1fr_80px_90px_80px_70px_70px] gap-2 items-center px-4 py-3 hover:bg-muted/50 transition-colors text-left"
            >
              <span className="text-sm font-medium text-foreground">{s.stationName}</span>
              <span className="text-xs text-foreground">{s.availabilityPct}%</span>
              <span className="text-xs text-foreground">{s.effectiveCycleTimeSec}s</span>
              <span className="text-xs text-foreground">{s.downtimeNormalizedPct}%</span>
              <span className="text-xs text-muted-foreground">{s.scrapProxyPct}%</span>
              {trendBars(s.effectiveCycleTimeSec, 35)}
            </button>
          ))}
        </div>
      </div>

      {/* Drawer */}
      <Sheet open={!!drawerStation} onOpenChange={(open) => !open && setDrawerStation(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{drawerStation?.stationName}</SheetTitle>
            <SheetDescription>Station → Line roll-up</SheetDescription>
          </SheetHeader>
          {drawerStation && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Availability', station: `${drawerStation.availabilityPct}%`, line: `${lineAgg.avgAvail}%` },
                  { label: 'Eff. Cycle Time', station: `${drawerStation.effectiveCycleTimeSec}s`, line: `${lineAgg.avgCycle}s` },
                  { label: 'Downtime Norm.', station: `${drawerStation.downtimeNormalizedPct}%`, line: `${lineAgg.avgDt}%` },
                  { label: 'Scrap Proxy', station: `${drawerStation.scrapProxyPct}%`, line: '—' },
                ].map(({ label, station, line }) => (
                  <div key={label} className="bg-visual-area rounded-xl p-3 border border-border">
                    <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
                    <div className="text-sm font-semibold text-foreground">{station}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">Line avg: {line}</div>
                  </div>
                ))}
              </div>
              <div className="bg-visual-area rounded-xl p-3 border border-border">
                <div className="text-[10px] text-muted-foreground mb-1">Roll-up Chain</div>
                <div className="text-sm text-foreground">
                  <span className="font-semibold">{drawerStation.stationName}</span>
                  <span className="text-muted-foreground mx-2">→</span>
                  <span className="font-semibold">{lines.find(l => l.lineId === lineId)?.name}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default FeaturesTab;
