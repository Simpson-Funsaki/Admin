'use client';

import { useEffect, useState } from 'react';
import { IconDownload, IconCheck, IconAlertCircle, IconRefresh } from '@tabler/icons-react';

export default function UpdateStatus() {
  const [updateStatus, setUpdateStatus] = useState(null);
  const isElectron = typeof window !== 'undefined' && window.electron;

  useEffect(() => {
    if (!isElectron) return;

    window.electron.onUpdateStatus((status) => {
      setUpdateStatus(status);
      
      // Auto-hide success/error messages after 5 seconds
      if (status.status === 'up-to-date' || status.status === 'error') {
        setTimeout(() => setUpdateStatus(null), 5000);
      }
    });
  }, [isElectron]);

  if (!isElectron || !updateStatus) return null;

  const getIcon = () => {
    switch (updateStatus.status) {
      case 'checking':
        return <IconRefresh className="w-4 h-4 animate-spin" />;
      case 'downloading':
        return <IconDownload className="w-4 h-4 animate-pulse" />;
      case 'up-to-date':
        return <IconCheck className="w-4 h-4" />;
      case 'error':
        return <IconAlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (updateStatus.status) {
      case 'checking':
      case 'downloading':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'up-to-date':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg border backdrop-blur-sm ${getColor()} animate-in slide-in-from-bottom-5`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <p className="text-sm font-medium">{updateStatus.message}</p>
          {updateStatus.progress && (
            <div className="mt-1 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-current transition-all duration-300"
                style={{ width: `${updateStatus.progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}