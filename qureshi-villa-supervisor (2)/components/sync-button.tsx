import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SyncButtonProps {
  onClick: () => void;
  isLoading: boolean;
  className?: string;
  size?: number;
}

export const SyncButton: React.FC<SyncButtonProps> = ({ onClick, isLoading, className = "", size = 20 }) => {
  return (
    <button 
      onClick={onClick} 
      disabled={isLoading}
      className={`p-2 rounded-xl border transition-all ${isLoading ? 'bg-slate-100 text-slate-400' : 'bg-white border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 shadow-sm'} ${className}`}
      title="Sync with Google Sheets"
    >
      <RefreshCw size={size} className={isLoading ? 'animate-spin' : ''} />
    </button>
  );
};
