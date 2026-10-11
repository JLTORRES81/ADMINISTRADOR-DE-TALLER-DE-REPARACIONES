import React, { useState } from 'react';
import { Ticket } from '../../types';
import { generateTicketDiagnosticPdf } from '../../utils/generatePdfReport';

interface TicketDetailModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onOpenLabel: () => void;
  onOpenFaultSolver?: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onOpenLabel,
  onOpenFaultSolver,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateTicketDiagnosticPdf(ticket);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">assignment</span>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                Expediente Técnico #{ticket.id}
              </h3>
              <p className="font-mono text-[10px] text-tertiary">
                Estatus: {ticket.stage.toUpperCase()} • {ticket.estimatedHours}
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

        {/* Scrollable details */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Client summary */}
          <div className="bg-surface-container-low p-3 rounded-xl space-y-1.5 border border-outline-variant/20">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[10px] text-secondary uppercase font-bold">
                Titular del Equipo
              </span>
              {ticket.isRegularClient && (
                <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-mono">
                  Cliente Habitual
                </span>
              )}
            </div>
            <p className="font-bold text-sm text-on-surface">{ticket.clientName}</p>
            <p className="text-on-surface-variant font-mono">{ticket.phone} • {ticket.email}</p>
          </div>

          {/* Device hardware specs */}
          <div className="bg-surface-container-low p-3 rounded-xl space-y-2 border border-outline-variant/20">
            <span className="font-mono text-[10px] text-secondary uppercase font-bold">
              Especificaciones de Hardware
            </span>
            <div className="grid grid-cols-2 gap-2 text-on-surface">
              <div>
                <span className="text-[10px] text-on-surface-variant block">Dispositivo</span>
                <span className="font-semibold">{ticket.deviceModel}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant block">Código Modelo</span>
                <span className="font-mono font-semibold text-secondary">{ticket.modelCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant block">IMEI / Número de Serie</span>
                <span className="font-mono">{ticket.imeiSerial}</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant block">Patrón o Clave</span>
                <span className="font-mono font-bold text-amber-300">
                  {ticket.isFormattedOrNoPin ? 'Sin clave / Formateado' : `*** ${ticket.accessPin}`}
                </span>
              </div>
            </div>
          </div>

          {/* AI DIAGNOSTIC REPORT CARD (Resultados de la IA) */}
          <div className="bg-surface-container-low p-3.5 rounded-xl space-y-2.5 border border-secondary/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                <span className="font-headline font-bold text-xs uppercase tracking-wide">
                  Resultados del Diagnóstico IA
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[10px] font-bold">
                ElectroBot AI • 98.4%
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-on-surface">
              <div className="p-2 rounded-lg bg-surface-container/60 border border-outline-variant/15 space-y-1">
                <div className="flex items-center justify-between font-mono text-[10px]">
                  <span className="text-secondary font-bold">Dictamen Térmico & Rieles:</span>
                  <span className="text-amber-400">Cortocircuito VDD_MAIN</span>
                </div>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Línea principal con caída a 3.4 Ohms. Falla en condensadores cerámicos 0201 adyacentes a PMIC U9001. No compromete microprocesador ni memoria NAND.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-surface-container/60 border border-outline-variant/15">
                  <span className="font-mono text-[10px] text-on-surface-variant block">Plan Sugerido IA</span>
                  <span className="font-semibold text-secondary">
                    {ticket.solutionApplied ? 'Solución Documentada' : 'Micro-fresado + Inyección 1.2V'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-surface-container/60 border border-outline-variant/15">
                  <span className="font-mono text-[10px] text-on-surface-variant block">Riesgo Colateral</span>
                  <span className="font-semibold text-emerald-400">Bajo (&lt;1.0%) • Datos 100% OK</span>
                </div>
              </div>

              {ticket.solutionApplied && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono text-[10px]">
                    <span className="material-symbols-outlined text-[14px]">task_alt</span>
                    <span>Solución de Laboratorio Aplicada:</span>
                  </div>
                  <p className="text-on-surface leading-relaxed">{ticket.solutionApplied}</p>
                </div>
              )}

              {onOpenFaultSolver && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenFaultSolver();
                  }}
                  className="w-full mt-1 h-9 rounded-lg bg-secondary/15 hover:bg-secondary/25 border border-secondary/35 text-secondary text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-98"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  <span>Consultar Resolvedor de Fallas Comunes con IA</span>
                </button>
              )}
            </div>
          </div>

          {/* Diagnostic notes & technician */}
          <div className="bg-surface-container-low p-3 rounded-xl space-y-2 border border-outline-variant/20">
            <span className="font-mono text-[10px] text-secondary uppercase font-bold">
              Diagnóstico de Laboratorio & Técnico
            </span>
            <div className="space-y-1">
              <p className="text-on-surface leading-relaxed">{ticket.declaredFault}</p>
              <div className="flex flex-wrap gap-1 pt-1">
                {ticket.tags.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary text-[10px] font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-outline-variant/20 flex justify-between items-center">
              <div>
                <span className="text-[10px] text-on-surface-variant block">Técnico Asignado</span>
                <span className="font-bold text-on-surface">{ticket.assignedTech}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-on-surface-variant block">Banco de Trabajo</span>
                <span className="font-mono text-secondary">{ticket.assignedBench}</span>
              </div>
            </div>
          </div>

          {/* Warranty & Financials */}
          <div className="bg-surface-container-low p-3 rounded-xl space-y-2 border border-outline-variant/20">
            <span className="font-mono text-[10px] text-secondary uppercase font-bold">
              Póliza de Garantía & Liquidación
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-surface-container">
                <span className="text-[10px] text-on-surface-variant block">Diagnóstico</span>
                <span className="font-mono font-bold">${ticket.diagnosisCost}</span>
              </div>
              <div className="p-2 rounded bg-surface-container">
                <span className="text-[10px] text-on-surface-variant block">Mano de Obra</span>
                <span className="font-mono font-bold text-primary">${ticket.laborCost}</span>
              </div>
              <div className="p-2 rounded bg-surface-container">
                <span className="text-[10px] text-on-surface-variant block">Anticipo</span>
                <span className="font-mono font-bold text-emerald-400">-${ticket.depositReceived}</span>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 pt-1">
              <span className="material-symbols-outlined text-[14px] text-secondary">verified</span>
              <span>Cobertura: {ticket.warrantyPeriod} contra defecto de ensamble.</span>
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-surface-container-low border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="h-10 px-3.5 rounded-xl bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed text-xs font-headline font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md shadow-secondary/20 disabled:opacity-50"
              title="Descargar Reporte PDF con Logo y Resultados IA"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isGeneratingPdf ? 'hourglass_top' : 'picture_as_pdf'}
              </span>
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar Reporte PDF'}</span>
            </button>

            <button
              onClick={onOpenLabel}
              className="h-10 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-secondary text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              <span>Etiqueta QR</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-bold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

