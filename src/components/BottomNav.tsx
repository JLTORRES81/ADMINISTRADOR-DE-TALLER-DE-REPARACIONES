import React from 'react';
import { ScreenTab } from '../types';

interface BottomNavProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const navItems: { id: ScreenTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ssid_chart' },
    { id: 'ordenes', label: 'Órdenes', icon: 'dashboard' },
    { id: 'ingreso', label: 'Ingreso', icon: 'add_circle' },
    { id: 'diagnostico', label: 'Diagnóstico', icon: 'build_circle' },
    { id: 'facturacion', label: 'Facturación', icon: 'receipt_long' },
    { id: 'entregas', label: 'Entregas', icon: 'verified' },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#131b2e]/95 backdrop-blur-xl border-t border-[#424754]/30 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <div className="max-w-lg md:max-w-2xl mx-auto grid grid-cols-6 items-center h-18 px-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 h-14 rounded-xl transition-all relative ${
                isActive
                  ? 'text-secondary bg-surface-container-high/70 shadow-[inset_0_1px_0_0_rgba(76,215,246,0.35)]'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container/40'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(76,215,246,1)]"></span>
              )}
              <span className={`material-symbols-outlined text-[20px] transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="font-mono text-[9px] sm:text-[10px] tracking-tight truncate w-full text-center px-0.5 font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

