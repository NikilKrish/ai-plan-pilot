import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { buildDashboardSummary } from '@/data/planComparison';

const pills = [
  {
    label: 'Line Capacity (Realistic)',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20"/>
        <path d="M12 6v6l4 2"/>
        <path d="M2 12h2"/>
        <path d="M20 12h2"/>
      </svg>
    ),
    color: 'accent-green',
  },
  {
    label: 'Downtime Impact',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    color: 'accent-orange',
  },
  {
    label: 'Scrap Loss',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10"/>
        <path d="M22 12c0-5.52-4.48-10-10-10"/>
        <path d="M13 11l5 5"/>
        <path d="M18 11l-5 5"/>
      </svg>
    ),
    color: 'accent-red',
  },
];

const posClasses = [
  { y: 0, scale: 1, opacity: 1, blur: 0, z: 30 },
  { y: 70, scale: 0.98, opacity: 0.8, blur: 1, z: 20 },
  { y: 140, scale: 0.96, opacity: 0.5, blur: 2, z: 10 },
];

const CapacityPredictor = () => {
  const navigate = useNavigate();
  const { activeUpload } = useApp();
  const [positions, setPositions] = useState([0, 1, 2]);
  const [transitioning, setTransitioning] = useState<number | null>(null);

  const isContextual = !!activeUpload;
  const summary = isContextual ? buildDashboardSummary(activeUpload) : null;

  useEffect(() => {
    if (isContextual) return;
    const interval = setInterval(() => {
      setPositions((prev) => {
        const newPos = [...prev];
        const lastIdx = newPos.findIndex((p) => p === 2);
        setTransitioning(lastIdx);
        return newPos.map((p) => (p === 0 ? 1 : p === 1 ? 2 : 0));
      });
      setTimeout(() => setTransitioning(null), 50);
    }, 3000);
    return () => clearInterval(interval);
  }, [isContextual]);

  return (
    <div
      className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden cursor-pointer hover:scale-[1.01] transition-transform"
      onClick={() => navigate(isContextual ? '/planner' : '/planner')}
      data-testid="card-capacity-predictor"
    >
      <div className="h-[280px] bg-visual-area border-b border-border relative p-6 shadow-inner">
        {isContextual && summary ? (
          <div className="h-full flex flex-col justify-center items-center text-center gap-4">
            <div className="text-3xl font-bold tracking-tight text-foreground" data-testid="text-predicted-capacity">
              {summary.predictedCapacity.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Predicted Capacity (units)</div>
            <div className="flex gap-6 mt-2">
              {summary.capacityDrivers.map((d) => (
                <div key={d.name} className="text-center">
                  <div className="text-sm font-semibold">{d.impactPct}%</div>
                  <div className="text-[10px] text-muted-foreground">{d.name}</div>
                </div>
              ))}
            </div>
            <div className="w-full max-w-[200px]">
              <div className="text-[10px] text-muted-foreground mb-1 font-medium">Confidence {Math.round(summary.capacityConfidence * 100)}%</div>
              <div className="h-1.5 rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${summary.capacityConfidence * 100}%`,
                    background: `linear-gradient(90deg, hsl(var(--accent-green)), hsl(var(--accent-blue)))`,
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {pills.map((pill, i) => {
              const pos = positions[i];
              const pc = posClasses[pos];
              const isTransitioning = transitioning === i && pos === 0;
              return (
                <div
                  key={i}
                  className="absolute left-0 right-0 mx-auto w-[85%] spring-transition"
                  style={{
                    transform: isTransitioning
                      ? `translateY(-70px) scale(1)`
                      : `translateY(${pc.y}px) scale(${pc.scale})`,
                    opacity: isTransitioning ? 0 : pc.opacity,
                    filter: `blur(${isTransitioning ? 0 : pc.blur}px)`,
                    zIndex: pc.z,
                    transition: isTransitioning ? 'none' : undefined,
                  }}
                >
                  <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `hsl(var(--${pill.color}-light))`, color: `hsl(var(--${pill.color}))` }}
                    >
                      {pill.icon}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{pill.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!isContextual && (
          <div className="absolute bottom-4 left-6 right-6">
            <div className="text-[10px] text-muted-foreground mb-1 font-medium">Forecast Confidence</div>
            <div className="h-1.5 rounded-full bg-border shimmer-bar">
              <div
                className="h-full rounded-full"
                style={{
                  width: '75%',
                  background: `linear-gradient(90deg, hsl(var(--accent-green)), hsl(var(--accent-blue)))`,
                }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-base">Realistic Capacity Predictor</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Predicts actual achievable line capacity using historical cycle time, downtime and scrap signals.
        </p>
      </div>
    </div>
  );
};

export default CapacityPredictor;
