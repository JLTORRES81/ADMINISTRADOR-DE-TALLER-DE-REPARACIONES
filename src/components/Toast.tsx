import React from 'react';

interface ToastProps {
  message: string | null;
  icon?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, icon = 'check_circle', onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:max-w-md z-50 p-3.5 rounded-xl bg-surface-container-highest text-on-surface shadow-2xl border border-secondary/30 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
          {icon}
        </span>
        <span className="text-xs sm:text-sm font-medium text-on-surface truncate">
          {message}
        </span>
      </div>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
