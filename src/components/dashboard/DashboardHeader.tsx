const DashboardHeader = () => {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Production Planning AI Copilot
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capacity • Validation • Bottlenecks • What-If
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></span>
          Data: Synthetic Demo
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-accent-green-light text-accent-green border border-accent-green/20">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-green"></span>
          Latency: 1.2s
        </span>
      </div>
    </header>
  );
};

export default DashboardHeader;
