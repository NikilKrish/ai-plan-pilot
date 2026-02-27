import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { lines, stationsByLine, kbSnippets } from '@/data/sampleData';
import { rankBottlenecks, type BottleneckResult } from '@/data/mockEngine';

const BottlenecksPage = () => {
  const navigate = useNavigate();
  const { selectedLineId, setLine } = useApp();
  const [lineId, setLineId] = useState(selectedLineId);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const bottlenecks = useMemo(() => rankBottlenecks(stationsByLine[lineId]), [lineId]);

  const handleLineChange = (id: string) => {
    setLineId(id);
    setLine(id);
    setExpandedIdx(null);
    setRecommendation(null);
  };

  const generateRecommendation = (b: BottleneckResult) => {
    const snippet = kbSnippets.find((s) =>
      b.reason.toLowerCase().includes('downtime') ? s.topic.includes('Downtime') :
      b.reason.toLowerCase().includes('scrap') ? s.topic.includes('Scrap') :
      s.topic.includes('Variance')
    );
    const text = `${b.stationName} is ranked #${b.rank} due to "${b.reason}" (effective cycle time: ${b.effectiveCycleTime.toFixed(1)}s, impact: ${b.impactPct}%). ${snippet?.content ?? 'Consider investigating further.'}`;
    setRecommendation(text);
  };

  const colorForRank = (rank: number) => {
    if (rank === 1) return 'accent-red';
    if (rank <= 3) return 'accent-orange';
    return 'accent-blue';
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-bold text-foreground">Bottleneck Analysis</h2>
        <select
          value={lineId}
          onChange={(e) => handleLineChange(e.target.value)}
          className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {lines.map((l) => <option key={l.lineId} value={l.lineId}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-[40px_1fr_120px_100px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
              <span>Rank</span>
              <span>Station</span>
              <span>Reason</span>
              <span>Impact</span>
            </div>
          </div>

          <div className="divide-y divide-border">
            {bottlenecks.map((b, i) => {
              const color = colorForRank(b.rank);
              return (
                <div key={b.stationId}>
                  <button
                    onClick={() => { setExpandedIdx(expandedIdx === i ? null : i); setRecommendation(null); }}
                    className="w-full grid grid-cols-[40px_1fr_120px_100px] gap-2 items-center px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <span className={`text-sm font-bold text-${color}`}>#{b.rank}</span>
                    <span className="text-sm font-medium text-foreground">{b.stationName}</span>
                    <span className="text-xs text-muted-foreground">{b.reason}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.impactPct}%`, backgroundColor: `hsl(var(--${color}))` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-8 text-right">{b.impactPct}%</span>
                    </div>
                  </button>

                  {/* Expanded detail */}
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expandedIdx === i ? '200px' : '0' }}>
                    <div className="px-4 pb-4 pt-1 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-[11px]">
                        <div className="bg-visual-area rounded-xl p-3 border border-border">
                          <div className="text-muted-foreground">Eff. Cycle Time</div>
                          <div className="text-foreground font-semibold">{b.effectiveCycleTime.toFixed(1)}s</div>
                        </div>
                        <div className="bg-visual-area rounded-xl p-3 border border-border">
                          <div className="text-muted-foreground">Reason</div>
                          <div className="text-foreground font-semibold">{b.reason}</div>
                        </div>
                        <div className="bg-visual-area rounded-xl p-3 border border-border">
                          <div className="text-muted-foreground">Impact</div>
                          <div className="text-foreground font-semibold">{b.impactPct}%</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => generateRecommendation(b)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold bg-accent-purple text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          Generate Recommendation
                        </button>
                        <button
                          onClick={() => navigate(`/reports?tab=features&line=${lineId}`)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors"
                        >
                          View Feature Drivers
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendation panel */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-6">
          <h3 className="text-sm font-bold text-foreground mb-3">AI Recommendation</h3>
          {recommendation ? (
            <div className="bg-accent-purple-light border border-accent-purple/20 rounded-2xl p-4 text-sm text-foreground leading-relaxed">
              {recommendation}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Click a bottleneck row, then "Generate Recommendation" to see AI-grounded insights.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BottlenecksPage;
