import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useApp } from '@/context/AppContext';
import { plans } from '@/data/sampleData';

const targets = [
  'Target: 1,250 units (Line A)',
  'Target: 980 units (Shift 2)',
  'Target: 1,500 units (Weekend OT)',
];

const FeasibilityValidator = () => {
  const navigate = useNavigate();
  const { setPlan } = useApp();
  const { displayText, textIndex } = useTypewriter({ texts: targets, typeSpeed: 60, deleteSpeed: 30, pauseDuration: 2500 });
  const [verdict, setVerdict] = useState<'analyzing' | 'feasible' | 'not-feasible'>('analyzing');
  const [animClass, setAnimClass] = useState('');
  const [cycleCount, setCycleCount] = useState(0);

  // Sync active plan from typewriter cycle
  useEffect(() => {
    if (plans[textIndex]) {
      // Don't call setPlan here to avoid re-renders during animation — only on button click
    }
  }, [textIndex]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVerdict('analyzing');
      setAnimClass('');
      const verdictTimer = setTimeout(() => {
        const isFeasible = textIndex % 2 === 0;
        setVerdict(isFeasible ? 'feasible' : 'not-feasible');
        setAnimClass(isFeasible ? 'animate-glow' : 'animate-shake');
        setCycleCount(c => c + 1);
      }, 1200);
      return () => clearTimeout(verdictTimer);
    }, 400);
    return () => clearTimeout(timer);
  }, [textIndex]);

  const handleOpenPlanner = () => {
    const plan = plans[textIndex % plans.length];
    setPlan(plan);
    navigate('/planner');
  };

  const statusConfig = {
    analyzing: { label: 'Analyzing', bg: 'bg-accent-blue-light', text: 'text-accent-blue', dot: 'bg-accent-blue' },
    feasible: { label: 'Feasible', bg: 'bg-accent-green-light', text: 'text-accent-green', dot: 'bg-accent-green' },
    'not-feasible': { label: 'Not Feasible', bg: 'bg-accent-red-light', text: 'text-accent-red', dot: 'bg-accent-red' },
  };
  const status = statusConfig[verdict];

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border card-lift overflow-hidden">
      <div className="h-[280px] bg-visual-area border-b border-border relative p-5 shadow-inner flex flex-col">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm flex-1 flex flex-col">
          <div className="flex justify-center mb-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${status.bg} ${status.text} ${animClass}`}>
              <span className={`pulse-dot ${status.dot}`} />
              {status.label}
            </div>
          </div>
          <div className="text-sm text-foreground font-medium mb-3 min-h-[20px]">
            {displayText}<span className="typewriter-cursor" />
          </div>
          <div className="flex gap-2 mb-3">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Accuracy ↑ 5–8%</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Manual Effort ↓ 40–50%</span>
          </div>
          <div className="text-xs font-medium mt-auto">
            {cycleCount % 2 === 0 ? (
              <span className="text-accent-orange">Overload Risk: 12%</span>
            ) : (
              <span className="text-accent-blue">Idle Capacity: 9%</span>
            )}
          </div>
          <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
            <button
              onClick={handleOpenPlanner}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-accent-blue text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Open Planner
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-foreground text-base">Plan Validation Engine</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Validates proposed production plans and flags overload / idle capacity before execution.
        </p>
      </div>
    </div>
  );
};

export default FeasibilityValidator;
