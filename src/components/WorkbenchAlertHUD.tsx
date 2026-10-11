import React, { useEffect, useState } from 'react';
import { WorkbenchNotificationPayload } from '../utils/fcmMessaging';

interface WorkbenchAlertHUDProps {
  onOpenTicket: (ticketId: string) => void;
}

export const WorkbenchAlertHUD: React.FC<WorkbenchAlertHUDProps> = ({ onOpenTicket }) => {
  const [activeAlert, setActiveAlert] = useState<WorkbenchNotificationPayload | null>(null);

  useEffect(() => {
    const handleWorkbenchEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WorkbenchNotificationPayload>;
      if (customEvent.detail) {
        setActiveAlert(customEvent.detail);

        // Auto-dismiss after 9 seconds if not clicked
        const timer = setTimeout(() => {
          setActiveAlert((curr) => (curr?.id === customEvent.detail.id ? null : curr));
        }, 9000);

        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('workbench_push_alert', handleWorkbenchEvent);
    return () => window.removeEventListener('workbench_push_alert', handleWorkbenchEvent);
  }, []);

  if (!activeAlert) return null;

  return (
    <div className="fixed top-18 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-96 z-50 animate-fade-in">
      <div className="bg-[#171f33] rounded-2xl p-4 border-2 border-secondary shadow-[0_12px_36px_rgba(0,0,0,0.6),0_0_20px_rgba(76,215,246,0.35)] flex flex-col gap-2.5 backdrop-blur-xl">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-80"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
            </span>
            <span className="font-mono text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">notifications_active</span>
              FCM ALERTA DE BANCO
            </span>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="w-6 h-6 rounded-lg bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <h4 className="font-headline text-sm font-bold text-on-surface">
              #{activeAlert.ticketId}
            </h4>
            <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono text-[10px] font-bold">
              {activeAlert.bench}
            </span>
          </div>

          <p className="font-medium text-xs text-on-surface truncate">
            {activeAlert.deviceModel}
          </p>

          <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
            Asignado a: <strong className="text-secondary">{activeAlert.technicianName}</strong>. {activeAlert.faultSummary}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-outline-variant/20">
          <button
            onClick={() => {
              setActiveAlert(null);
            }}
            className="h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant text-xs font-mono font-medium transition-colors"
          >
            Entendido
          </button>

          <button
            onClick={() => {
              onOpenTicket(activeAlert.ticketId);
              setActiveAlert(null);
            }}
            className="h-8 rounded-lg bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed text-xs font-headline font-bold flex items-center justify-center gap-1 shadow-md transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[16px]">build</span>
            <span>Ver en Mesa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
