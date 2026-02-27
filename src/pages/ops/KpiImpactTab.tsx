import { kpiImpact, kpiMapping } from '@/data/pipelineData';

const categories = [...new Set(kpiImpact.map((k) => k.category))];

const headlines = [
  'Availability improved from 82% → 88% (+6 pp)',
  'Unplanned downtime reduced by 32% (140 → 95 min/shift)',
  'Planned vs actual gap closed from 12% to 4%',
  'Planning cycle time cut by 81% (4 hrs → 45 min)',
  'Overtime costs reduced by 18% (~$9K/mo saved)',
];

const KpiImpactTab = () => {
  return (
    <div className="space-y-6">
      {/* One Slide Summary */}
      <div className="bg-accent-purple-light border border-accent-purple/20 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-foreground mb-3">One-Slide Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {headlines.map((h, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-purple mt-1.5 flex-shrink-0" />
              {h}
            </div>
          ))}
        </div>
      </div>

      {/* KPI Mapping */}
      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">AI Model → KPI Mapping</h3>
        </div>
        <div className="p-4 border-b border-border">
          <div className="grid grid-cols-[1fr_1fr_1.5fr] gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
            <span>AI Model</span>
            <span>Key KPIs</span>
            <span>Business Value</span>
          </div>
        </div>
        <div className="divide-y divide-border">
          {kpiMapping.map((row) => (
            <div key={row.aiModel} className="grid grid-cols-[1fr_1fr_1.5fr] gap-2 items-start px-4 py-3 text-xs">
              <span className="text-foreground font-medium">{row.aiModel}</span>
              <div className="flex flex-wrap gap-1">
                {row.keyKpis.map((kpi) => (
                  <span key={kpi} className="px-1.5 py-0.5 rounded-full bg-muted text-[10px] text-muted-foreground">{kpi}</span>
                ))}
              </div>
              <span className="text-muted-foreground">{row.businessValue}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Before vs After by category */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = kpiImpact.filter((k) => k.category === cat);
          return (
            <div key={cat} className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <h4 className="text-xs font-bold text-foreground">{cat}</h4>
              </div>
              <div className="divide-y divide-border">
                {items.map((item) => (
                  <div key={item.kpi} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center px-4 py-2.5 text-xs">
                    <span className="text-foreground font-medium">{item.kpi}</span>
                    <span className="text-muted-foreground text-center">{item.before}</span>
                    <span className="text-foreground font-semibold text-center">{item.after}</span>
                    <span className="text-accent-green font-semibold text-center">{item.improvement}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default KpiImpactTab;
