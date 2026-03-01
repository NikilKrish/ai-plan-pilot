import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { FileSpreadsheet, ArrowLeftRight } from 'lucide-react';

export default function UploadContextBanner() {
  const { activeUpload, clearActiveUpload } = useApp();
  const navigate = useNavigate();

  if (!activeUpload) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted/50 border border-border text-xs mb-4" data-testid="banner-upload-context">
      <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      <span className="font-medium text-foreground truncate max-w-[200px]">{activeUpload.meta.filename}</span>
      {activeUpload.meta.dateStart && activeUpload.meta.dateEnd && (
        <span className="text-muted-foreground hidden sm:inline">{activeUpload.meta.dateStart} → {activeUpload.meta.dateEnd}</span>
      )}
      <span className="text-muted-foreground">{activeUpload.aggregates.plannedUnitsTotal.toLocaleString()} units</span>
      <button
        onClick={() => { clearActiveUpload(); navigate('/'); }}
        className="ml-auto inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-change-file"
      >
        <ArrowLeftRight className="w-3 h-3" />
        Change
      </button>
    </div>
  );
}
