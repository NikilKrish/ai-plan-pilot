import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ProtectedRoute() {
  const { activeUpload } = useApp();
  const location = useLocation();

  useEffect(() => {
    if (!activeUpload) {
      toast.info('Upload a plan file first');
    }
  }, []);

  if (!activeUpload) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
