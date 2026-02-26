import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CapacityPredictor from '@/components/dashboard/CapacityPredictor';
import FeasibilityValidator from '@/components/dashboard/FeasibilityValidator';
import BottleneckDetection from '@/components/dashboard/BottleneckDetection';
import WhatIfSimulation from '@/components/dashboard/WhatIfSimulation';
import AIRecommendations from '@/components/dashboard/AIRecommendations';

const Index = () => {
  return (
    <div className="min-h-screen mesh-gradient-bg">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CapacityPredictor />
          <FeasibilityValidator />
          <BottleneckDetection />
          <WhatIfSimulation />
          <AIRecommendations />
        </div>
      </div>
    </div>
  );
};

export default Index;
