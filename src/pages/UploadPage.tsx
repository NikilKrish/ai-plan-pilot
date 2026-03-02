import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, ArrowRight, Clock, Trash2, ChevronRight, Loader2, FileUp, FileDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { parsePlanUpload } from '@/lib/excel/parsePlanUpload';
import type { UploadContext } from '@/types/upload';

type UploadState = 'idle' | 'parsing' | 'success' | 'error';

const STEPS = ['Uploading', 'Validating', 'Normalizing', 'Building dashboard'];

export default function UploadPage() {
  const navigate = useNavigate();
  const { setActiveUpload, uploadHistory, loadUpload } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<UploadState>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [parsedContext, setParsedContext] = useState<UploadContext | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const processFile = useCallback(async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setState('error');
      setErrorMessage('Please upload an Excel file (.xlsx, .xls) or CSV file.');
      return;
    }

    setState('parsing');
    setCurrentStep(0);

    await delay(400);
    setCurrentStep(1);
    await delay(300);
    setCurrentStep(2);

    const result = await parsePlanUpload(file);

    if (!result.success) {
      setState('error');
      setErrorMessage(result.error.message);
      return;
    }

    setCurrentStep(3);
    await delay(400);

    setParsedContext(result.context);
    setState('success');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  }, [processFile]);

  const handleContinue = useCallback(() => {
    if (parsedContext) {
      setActiveUpload(parsedContext);
      toast.success('Plan uploaded successfully');
      navigate('/dashboard');
    }
  }, [parsedContext, setActiveUpload, navigate]);

  const handleHistoryLoad = useCallback((uploadId: string) => {
    const loaded = loadUpload(uploadId);
    if (loaded) {
      toast.success('Previous upload restored');
      navigate('/dashboard');
    } else {
      toast.error('Could not restore this upload — data may have been cleared.');
    }
  }, [loadUpload, navigate]);

  const handleReset = useCallback(() => {
    setState('idle');
    setParsedContext(null);
    setErrorMessage('');
    setCurrentStep(0);
  }, []);

  return (
    <div className="mesh-gradient-bg min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-[1320px] mx-auto px-6 h-14 flex items-center gap-3">
          <FileSpreadsheet className="w-5 h-5 text-foreground" />
          <span className="font-semibold text-sm tracking-tight" data-testid="text-app-title">
            Production Planning AI Copilot
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center pt-12 pb-16 px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-upload-heading">
              Upload Production Plan
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Import your Excel plan to activate contextual insights across capacity, bottlenecks, and simulations.
            </p>
          </div>

          {state === 'idle' && (
            <Card className="rounded-3xl card-lift border-dashed border-2 overflow-hidden">
              <CardContent className="p-0">
                <div
                  ref={dropRef}
                  data-testid="dropzone-upload"
                  className={`
                    flex flex-col items-center justify-center py-16 px-8 cursor-pointer
                    transition-all duration-300 ease-out
                    ${dragOver
                      ? 'bg-accent-green/5 border-accent-green scale-[1.01]'
                      : 'hover:bg-muted/30'
                    }
                  `}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className={`
                    w-16 h-16 rounded-2xl flex items-center justify-center mb-5
                    transition-all duration-300
                    ${dragOver
                      ? 'bg-[hsl(var(--accent-green))]/10 text-[hsl(var(--accent-green))]'
                      : 'bg-muted text-muted-foreground'
                    }
                  `}>
                    <FileUp className="w-7 h-7" />
                  </div>

                  <p className="font-semibold text-sm mb-1" data-testid="text-dropzone-title">
                    {dragOver ? 'Drop your file here' : 'Drag & drop your plan file'}
                  </p>
                  <p className="text-xs text-muted-foreground mb-5">
                    Supports .xlsx, .xls, and .csv — with date columns in YYYY-MM-DD format
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="button-browse-file"
                    className="rounded-full px-6"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Browse file
                  </Button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={handleFileSelect}
                    data-testid="input-file-upload"
                  />

                  <a
                    href="/sample-production-plan.xlsx"
                    download
                    onClick={(e) => e.stopPropagation()}
                    data-testid="download-sample-link"
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium mt-5
                      bg-[hsl(var(--accent-blue))]/10 text-[hsl(var(--accent-blue))]
                      hover:bg-[hsl(var(--accent-blue))]/20 transition-colors"
                  >
                    <FileDown className="w-4 h-4" />
                    Download sample template
                  </a>
                </div>
              </CardContent>
            </Card>
          )}

          {state === 'parsing' && (
            <Card className="rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Loader2 className="w-5 h-5 animate-spin text-[hsl(var(--accent-blue))]" />
                  <span className="font-semibold text-sm" data-testid="text-parsing-status">Processing your file…</span>
                </div>
                <div className="space-y-3">
                  {STEPS.map((step, i) => (
                    <div key={step} className="flex items-center gap-3" data-testid={`step-${i}`}>
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold
                        transition-all duration-300
                        ${i < currentStep
                          ? 'bg-[hsl(var(--accent-green))] text-white'
                          : i === currentStep
                            ? 'bg-[hsl(var(--accent-blue))] text-white'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}>
                        {i < currentStep ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className={`text-sm ${i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                <Progress
                  value={(currentStep / STEPS.length) * 100}
                  className="mt-6 h-1.5 shimmer-bar"
                  data-testid="progress-parsing"
                />
              </CardContent>
            </Card>
          )}

          {state === 'success' && parsedContext && (
            <Card className="rounded-3xl overflow-hidden border-[hsl(var(--accent-green))]/30">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent-green))]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent-green))]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" data-testid="text-success-title">Plan imported successfully</p>
                    <p className="text-xs text-muted-foreground">{parsedContext.meta.filename}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <MetricTile label="Total Units" value={parsedContext.aggregates.plannedUnitsTotal.toLocaleString()} testId="metric-total-units" />
                  <MetricTile label="Date Range" value={`${parsedContext.meta.dateStart?.slice(5) || '?'} → ${parsedContext.meta.dateEnd?.slice(5) || '?'}`} testId="metric-date-range" />
                  <MetricTile label="Lines" value={String(parsedContext.meta.lineIds.length || 1)} testId="metric-lines" />
                  <MetricTile label="Data Rows" value={parsedContext.meta.rowCount.toLocaleString()} testId="metric-rows" />
                </div>

                {parsedContext.meta.lineIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {parsedContext.meta.lineIds.map((line) => (
                      <Badge key={line} variant="secondary" className="text-xs" data-testid={`badge-line-${line}`}>{line}</Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleContinue}
                    className="rounded-full px-6"
                    data-testid="button-continue-dashboard"
                  >
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="rounded-full"
                    data-testid="button-upload-another"
                  >
                    Upload another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {state === 'error' && (
            <Card className="rounded-3xl overflow-hidden border-destructive/30">
              <CardContent className="p-8">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" data-testid="text-error-title">Import failed</p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-error-message">{errorMessage}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="rounded-full"
                  data-testid="button-try-again"
                >
                  Try again
                </Button>
              </CardContent>
            </Card>
          )}

          {uploadHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1" data-testid="text-history-heading">
                Recent Uploads
              </h2>
              <div className="space-y-2">
                {uploadHistory.map((meta) => (
                  <Card
                    key={meta.uploadId}
                    className="rounded-2xl card-lift cursor-pointer group"
                    onClick={() => handleHistoryLoad(meta.uploadId)}
                    data-testid={`card-history-${meta.uploadId}`}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-history-filename-${meta.uploadId}`}>
                          {meta.filename}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(meta.createdAt).toLocaleDateString()}</span>
                          <span>·</span>
                          <span>{meta.rowCount.toLocaleString()} rows</span>
                          {meta.dateStart && meta.dateEnd && (
                            <>
                              <span>·</span>
                              <span>{meta.dateStart.slice(5)} → {meta.dateEnd.slice(5)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricTile({ label, value, testId }: { label: string; value: string; testId: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-3 text-center flex flex-col justify-center min-h-[72px]" data-testid={testId}>
      <p className="text-lg font-bold tracking-tight whitespace-nowrap">{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
