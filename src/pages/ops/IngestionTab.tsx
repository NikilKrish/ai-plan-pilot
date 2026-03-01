import { useState, useMemo, useEffect } from 'react';
import { pipelineHealth, makeIngestionEvents, type IngestionEvent } from '@/data/pipelineData';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

const IngestionTab = () => {
  const { activeUpload } = useApp();

  const baseEvents = useMemo(() => makeIngestionEvents(), []);

  const eventsWithUpload = useMemo(() => {
    if (activeUpload) {
      const uploadEvent: IngestionEvent = {
        id: `EVT_UPLOAD_${activeUpload.meta.uploadId}`,
        ts: activeUpload.meta.createdAt,
        sourceType: 'planning',
        entityType: 'plan_upload',
        lineId: activeUpload.meta.lineIds[0] || 'LINE_A',
        stationId: 'ALL',
        status: 'validated',
      };
      return [uploadEvent, ...baseEvents];
    }
    return baseEvents;
  }, [activeUpload, baseEvents]);

  const [events, setEvents] = useState<IngestionEvent[]>(eventsWithUpload);

  useEffect(() => {
    setEvents(eventsWithUpload);
  }, [eventsWithUpload]);

  const [streaming, setStreaming] = useState(pipelineHealth.streaming);
  const [lineFilter, setLineFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (lineFilter !== 'all' && e.lineId !== lineFilter) return false;
      if (sourceFilter !== 'all' && e.sourceType !== sourceFilter) return false;
      return true;
    });
  }, [events, lineFilter, sourceFilter]);

  const validatedPct = useMemo(() => {
    const valid = events.filter((e) => e.status === 'validated').length;
    return Math.round((valid / events.length) * 100);
  }, [events]);

  const simulateEvent = () => {
    const lineIds = ['LINE_A', 'LINE_B', 'LINE_C'];
    const newEvent: IngestionEvent = {
      id: `EVT_${Date.now()}`,
      ts: new Date().toISOString(),
      sourceType: 'machine',
      entityType: 'cycle_log',
      lineId: lineIds[Math.floor(Math.random() * 3)],
      stationId: `A0${Math.floor(Math.random() * 9) + 1}`,
      status: 'validated',
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 20));
    setStreaming((prev) => ({ ...prev, lastEventTs: newEvent.ts, lagSec: +(Math.random() * 2).toFixed(1) }));
    toast.success('New event ingested & validated');
  };

  const statusColor = (s: string) => s === 'Healthy' ? 'bg-accent-green' : s === 'Degraded' ? 'bg-accent-orange' : 'bg-accent-red';
  const statusBg = (s: string) => s === 'Healthy' ? 'bg-accent-green-light text-accent-green' : s === 'Degraded' ? 'bg-accent-orange-light text-accent-orange' : 'bg-accent-red-light text-accent-red';

  return (
    <div className="space-y-6">
      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streaming */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Streaming Ingestion</h4>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBg(streaming.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor(streaming.status)}`} />
              {streaming.status}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">{streaming.source}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">{streaming.lagSec}s</div>
              <div className="text-[10px] text-muted-foreground">Lag</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{streaming.validationPassPct}%</div>
              <div className="text-[10px] text-muted-foreground">Pass Rate</div>
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">{new Date(streaming.lastEventTs).toLocaleTimeString()}</div>
              <div className="text-[10px] text-muted-foreground">Last Event</div>
            </div>
          </div>
        </div>

        {/* Batch */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">Batch Ingestion</h4>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBg(pipelineHealth.batch.status)}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor(pipelineHealth.batch.status)}`} />
              {pipelineHealth.batch.status}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3">{pipelineHealth.batch.sources.join(', ')}</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-foreground">{pipelineHealth.batch.rowsProcessed.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Rows</div>
            </div>
            <div>
              <div className="text-lg font-bold text-foreground">{pipelineHealth.batch.validationErrors}</div>
              <div className="text-[10px] text-muted-foreground">Errors</div>
            </div>
            <div>
              <div className="text-xs font-medium text-foreground">{new Date(pipelineHealth.batch.lastSyncTs).toLocaleTimeString()}</div>
              <div className="text-[10px] text-muted-foreground">Last Sync</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Simulate */}
      <div className="flex flex-wrap items-center gap-2">
        <select value={lineFilter} onChange={(e) => setLineFilter(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Lines</option>
          <option value="LINE_A">Line A</option>
          <option value="LINE_B">Line B</option>
          <option value="LINE_C">Line C</option>
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="all">All Sources</option>
          <option value="machine">Machine</option>
          <option value="mes">MES</option>
          <option value="planning">Planning</option>
        </select>
        <button onClick={simulateEvent} className="ml-auto px-4 py-2 rounded-xl text-xs font-semibold bg-accent-blue text-primary-foreground hover:opacity-90 transition-opacity">
          Simulate New Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Events table */}
        <div className="lg:col-span-3 bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="grid grid-cols-[120px_80px_100px_80px_60px_80px] gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
              <span>Time</span>
              <span>Source</span>
              <span>Entity</span>
              <span>Line</span>
              <span>Status</span>
              <span>Reason</span>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {filtered.map((e) => (
              <div key={e.id} className="grid grid-cols-[120px_80px_100px_80px_60px_80px] gap-2 items-center px-4 py-2.5 text-xs">
                <span className="text-muted-foreground">{new Date(e.ts).toLocaleTimeString()}</span>
                <span className="text-foreground capitalize">{e.sourceType}</span>
                <span className="text-muted-foreground">{e.entityType.replace(/_/g, ' ')}</span>
                <span className="text-foreground font-medium">{e.lineId.replace('LINE_', '')}</span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${e.status === 'validated' ? 'text-accent-green' : 'text-accent-red'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${e.status === 'validated' ? 'bg-accent-green' : 'bg-accent-red'}`} />
                  {e.status === 'validated' ? '✓' : '✗'}
                </span>
                <span className="text-muted-foreground text-[10px] truncate">{e.reason ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Schema Validation mini-card */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-5">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Schema Validation</h4>
          <div className="text-3xl font-bold text-foreground mb-1">{validatedPct}%</div>
          <div className="text-[10px] text-muted-foreground mb-3">Pass Rate</div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-accent-green transition-all duration-500" style={{ width: `${validatedPct}%` }} />
          </div>
          <div className="mt-4 text-[10px] text-muted-foreground">
            {events.filter(e => e.status === 'validated').length} / {events.length} events validated
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngestionTab;
