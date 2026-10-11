import React, { useState } from 'react';

interface MicroscopeZoomModalProps {
  photoUrl: string;
  title: string;
  subtitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MicroscopeZoomModal: React.FC<MicroscopeZoomModalProps> = ({
  photoUrl,
  title,
  subtitle,
  isOpen,
  onClose,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showRuler, setShowRuler] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="bg-surface-container rounded-2xl border border-secondary/30 max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">biotech</span>
            </div>
            <div>
              <h3 className="font-headline text-sm font-bold text-on-surface">
                {title}
              </h3>
              <p className="font-mono text-[10px] text-secondary">
                {subtitle} • Microscopio Óptico Trinocular Lab
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Viewport & Controls */}
        <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[320px] select-none">
          {/* Target photo with zoom transform */}
          <div
            className="transition-transform duration-200 ease-out origin-center relative cursor-grab active:cursor-grabbing"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={photoUrl}
              alt={title}
              className="max-h-[60vh] max-w-full object-contain pointer-events-none"
            />

            {/* Overlaid annotations */}
            {showAnnotations && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border border-secondary/70 bg-secondary/10 w-24 h-16 rounded flex items-start justify-end p-1">
                  <span className="bg-secondary text-on-secondary-fixed text-[8px] font-mono px-1 font-bold rounded">
                    ZONA CRÍTICA
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Calibrated Overlay Grid / Crosshairs */}
          {showRuler && (
            <div className="absolute inset-0 pointer-events-none border border-secondary/20">
              <div className="absolute top-1/2 left-0 right-0 h-px bg-secondary/20"></div>
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-secondary/20"></div>
              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-secondary"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-secondary"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-secondary"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-secondary"></div>
            </div>
          )}

          {/* Current Zoom Overlay Badge */}
          <div className="absolute bottom-3 left-3 bg-surface-container-lowest/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-outline-variant/30 text-[10px] font-mono text-secondary flex items-center gap-2">
            <span>AUMENTO: {(zoomLevel * 45).toFixed(0)}x</span>
            <span>• RESOLUCIÓN 4K</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
              className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center"
              title="Reducir Zoom"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_out</span>
            </button>
            <span className="font-mono text-xs w-10 text-center font-bold text-on-surface">
              {zoomLevel}x
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.5))}
              className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright text-on-surface flex items-center justify-center"
              title="Aumentar Zoom"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-mono text-[10px]"
            >
              Reset
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant font-mono text-[11px]">
              <input
                type="checkbox"
                checked={showRuler}
                onChange={(e) => setShowRuler(e.target.checked)}
                className="w-3.5 h-3.5 accent-secondary"
              />
              <span>Retícula</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-on-surface-variant font-mono text-[11px]">
              <input
                type="checkbox"
                checked={showAnnotations}
                onChange={(e) => setShowAnnotations(e.target.checked)}
                className="w-3.5 h-3.5 accent-secondary"
              />
              <span>Marcas QC</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
