import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import IngestionTab from './ops/IngestionTab';
import FeaturesTab from './ops/FeaturesTab';
import ModelsTab from './ops/ModelsTab';
import FeedbackTab from './ops/FeedbackTab';
import KpiImpactTab from './ops/KpiImpactTab';

const tabs = [
  { id: 'ingestion', label: 'Ingestion' },
  { id: 'features', label: 'Features' },
  { id: 'models', label: 'Models' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'kpi', label: 'KPI Impact' },
] as const;

type TabId = typeof tabs[number]['id'];

const ReportsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramTab = searchParams.get('tab') as TabId | null;
  const [activeTab, setActiveTab] = useState<TabId>(
    tabs.find(t => t.id === paramTab)?.id ?? 'ingestion'
  );

  // Sync tab from URL
  useEffect(() => {
    if (paramTab && tabs.some(t => t.id === paramTab)) {
      setActiveTab(paramTab);
    }
  }, [paramTab]);

  const switchTab = (id: TabId) => {
    setActiveTab(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', id);
    setSearchParams(newParams, { replace: true });
  };

  // Deep-link props
  const lineParam = searchParams.get('line') ?? undefined;
  const stationParam = searchParams.get('station') ?? undefined;
  const highlightParam = searchParams.get('highlight') ?? undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Ops & Feedback</h2>
      </div>

      {/* Tab bar */}
      <nav className="flex bg-muted rounded-lg p-0.5 gap-0.5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-card shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      {activeTab === 'ingestion' && <IngestionTab />}
      {activeTab === 'features' && <FeaturesTab preselectedLine={lineParam} preselectedStation={stationParam} />}
      {activeTab === 'models' && <ModelsTab highlightModel={highlightParam} />}
      {activeTab === 'feedback' && <FeedbackTab />}
      {activeTab === 'kpi' && <KpiImpactTab />}
    </div>
  );
};

export default ReportsPage;
