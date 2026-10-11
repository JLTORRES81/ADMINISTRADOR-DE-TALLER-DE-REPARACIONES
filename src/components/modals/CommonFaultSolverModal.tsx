import React, { useState } from 'react';
import { Ticket, FaultResolutionResult } from '../../types';
import { solveCommonFaultWithAI } from '../../utils/aiFaultSolver';

interface CommonFaultSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTicket?: Ticket;
  allTickets: Ticket[];
  onApplySolutionToTicket?: (ticketId: string, solution: string, rootCause: string, parts: string[]) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const CommonFaultSolverModal: React.FC<CommonFaultSolverModalProps> = ({
  isOpen,
  onClose,
  activeTicket,
  allTickets,
  onApplySolutionToTicket,
  onShowToast,
}) => {
  const [deviceModel, setDeviceModel] = useState(activeTicket?.deviceModel || 'Samsung Galaxy S23 Ultra (512GB)');
  const [category, setCategory] = useState(activeTicket?.category || 'smartphone');
  const [faultText, setFaultText] = useState(
    activeTicket?.declaredFault ||
      'El equipo se apagó de repente tras calentamiento excesivo en juego continuo. No responde al cargador oficial de 45W ni muestra indicador LED.'
  );
  const [selectedTicketId, setSelectedTicketId] = useState<string>(activeTicket?.id || allTickets[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FaultResolutionResult | null>(null);

  // Quick preset common faults
  const presetFaults = [
    {
      title: 'Pantalla en blanco / verde fija',
      model: 'iPhone 14 Pro Max',
      category: 'smartphone',
      fault: 'Pantalla en blanco o verde fija tras caída leve. El equipo vibra y recibe llamadas pero no da imagen.',
    },
    {
      title: 'Derrame de líquido & Backlight sin luz',
      model: 'MacBook Pro 14" M2 Pro',
      category: 'laptop',
      fault: 'Líquido derramado sobre teclado hace 2 días. Parpadeo intermitente en backlight del display y ventiladores al máximo.',
    },
    {
      title: 'Sin video por tirón de HDMI',
      model: 'PlayStation 5 Disc Edition',
      category: 'console',
      fault: 'Sin salida de video tras tirón de cable HDMI. Luz azul cambia a blanco normal pero televisor no detecta señal.',
    },
    {
      title: 'No enciende / Consumo congelado en 5V 0A',
      model: 'MacBook Air 13" M1',
      category: 'laptop',
      fault: 'No enciende, consumo congelado en 5V 0.00A en amperímetro USB-C Type-C.',
    },
    {
      title: 'Apagado súbito tras calentamiento excesivo',
      model: 'Samsung Galaxy S23 Ultra',
      category: 'smartphone',
      fault: 'El equipo se apagó de repente tras calentamiento excesivo en juego continuo. No responde al cargador oficial de 45W ni muestra indicador LED.',
    },
  ];

  const handleRunDiagnosis = async () => {
    if (!faultText.trim() || !deviceModel.trim()) {
      onShowToast('Por favor describe la falla y el modelo del equipo', 'warning');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const diagnosisResult = await solveCommonFaultWithAI(faultText, deviceModel, category, allTickets);
      setResult(diagnosisResult);
      onShowToast(
        `Resolución generada con ${diagnosisResult.historicalMatches.length} coincidencias históricas`,
        'psychology'
      );
    } catch {
      onShowToast('Error generando resolución asistida', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToTicket = () => {
    if (!result) return;
    const targetId = selectedTicketId || activeTicket?.id;
    if (!targetId) {
      onShowToast('Selecciona una orden de trabajo para asociar la solución', 'warning');
      return;
    }

    if (onApplySolutionToTicket) {
      onApplySolutionToTicket(
        targetId,
        result.recommendedSteps.join(' | '),
        result.likelyRootCause,
        result.suggestedParts
      );
    }
    onShowToast(`Solución vinculada a la orden #${targetId} y base de conocimiento`, 'check_circle');
    onClose();
  };

  if (!isOpen) return null;

  const resolvedHistoryCount = allTickets.filter((t) => t.solutionApplied && t.solutionApplied.length > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 shadow-2xl max-w-2xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-high/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary shadow-inner">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline font-bold text-base text-on-surface">
                  Resolvedor Inteligente de Fallas Comunes
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-mono text-[10px] font-bold">
                  Gemini AI + Historial
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono">
                Enlace dinámico de síntomas actuales con {resolvedHistoryCount} reparaciones previas documentadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-container hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preset Buttons Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-on-surface-variant">
              <span>Casos recurrentes en taller:</span>
              <span className="text-secondary font-bold">Carga rápida</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presetFaults.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDeviceModel(preset.model);
                    setCategory(preset.category as any);
                    setFaultText(preset.fault);
                    setResult(null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/20 text-[11px] font-mono text-on-surface-variant hover:text-secondary transition-all text-left flex items-center gap-1 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[13px] text-secondary">bolt</span>
                  <span>{preset.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Input Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/20">
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block font-bold">
                Modelo o Placa del Equipo
              </label>
              <input
                type="text"
                value={deviceModel}
                onChange={(e) => setDeviceModel(e.target.value)}
                placeholder="Ej. Samsung Galaxy S23 Ultra / MacBook Pro M2"
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface outline-none focus:border-secondary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block font-bold">
                Asociar a Ticket en Curso
              </label>
              <select
                value={selectedTicketId}
                onChange={(e) => setSelectedTicketId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-mono text-on-surface outline-none focus:border-secondary"
              >
                {allTickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    #{t.id} - {t.deviceModel} ({t.stage})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider block font-bold">
                Síntomas y Falla Declarada (Texto o Comportamiento)
              </label>
              <textarea
                rows={3}
                value={faultText}
                onChange={(e) => setFaultText(e.target.value)}
                placeholder="Describe el síntoma detallado: lecturas de amperímetro, temperatura, caídas de voltaje, comportamiento visual..."
                className="w-full p-2.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface outline-none focus:border-secondary"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-between pt-1">
              <div className="flex items-center gap-2 text-xs font-mono text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px] text-emerald-400">sync_saved_locally</span>
                <span>Base de datos: {resolvedHistoryCount} casos enlazados</span>
              </div>

              <button
                type="button"
                onClick={handleRunDiagnosis}
                disabled={isLoading}
                className="h-10 px-4 rounded-xl bg-secondary text-on-secondary-fixed font-headline text-xs font-bold flex items-center gap-2 shadow-md shadow-secondary/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${isLoading ? 'animate-spin' : ''}`}>
                  {isLoading ? 'progress_activity' : 'auto_fix_high'}
                </span>
                <span>{isLoading ? 'Analizando con IA...' : 'Resolver Falla con IA'}</span>
              </button>
            </div>
          </div>

          {/* AI Result Card */}
          {result && (
            <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border-2 border-secondary/30 animate-in fade-in duration-200">
              {/* Diagnosis Summary Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                    <span className="font-headline font-bold text-sm text-on-surface">
                      Dictamen & Causa Raíz
                    </span>
                  </div>
                  <p className="text-xs text-on-surface font-medium leading-relaxed">
                    {result.diagnosis}
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <span className="font-mono text-sm font-bold text-secondary">
                    {result.confidence}% Certeza
                  </span>
                  <span className="text-[10px] font-mono text-on-surface-variant">
                    Riesgo: {result.riskLevel}
                  </span>
                </div>
              </div>

              {/* Specific Likely Root Cause */}
              <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/20 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                  <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                  <span>Causa Raíz a Nivel Componente / Circuito:</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {result.likelyRootCause}
                </p>
              </div>

              {/* Historical Link Matches */}
              {result.historicalMatches && result.historicalMatches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-secondary">
                    <span className="material-symbols-outlined text-[16px]">history_edu</span>
                    <span>Reparaciones Previas del Taller Coincidentes:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {result.historicalMatches.map((match, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-surface-container border border-secondary/20 flex flex-col justify-between text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-secondary">Ticket #{match.ticketId}</span>
                          <span className="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary text-[10px] font-mono font-bold">
                            {match.similarityScore}% Afinidad
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface font-semibold truncate mt-0.5">
                          {match.deviceModel}
                        </p>
                        <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-1 font-mono">
                          Solución aplicada: {match.solutionApplied}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step by Step Action Plan */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-on-surface">
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">format_list_numbered</span>
                  <span>Protocolo Técnico de Solución Paso a Paso:</span>
                </div>
                <div className="space-y-1">
                  {result.recommendedSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-surface-container flex items-start gap-2 text-xs text-on-surface"
                    >
                      <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Parts and Time */}
              {result.suggestedParts && result.suggestedParts.length > 0 && (
                <div className="p-2.5 rounded-lg bg-surface-container-high/60 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-on-surface-variant">Refacciones sugeridas:</span>
                    <div className="flex flex-wrap gap-1">
                      {result.suggestedParts.map((part, pIdx) => (
                        <span
                          key={pIdx}
                          className="px-2 py-0.5 rounded bg-surface-container text-secondary text-[10px] font-bold"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                  {result.estimatedTimeMinutes && (
                    <span className="text-on-surface-variant">
                      Tiempo estimado: ~{result.estimatedTimeMinutes} min
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-outline-variant/20 flex items-center justify-between bg-surface-container-high/40">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-mono text-xs font-semibold"
          >
            Cerrar
          </button>

          {result && (
            <button
              onClick={handleApplyToTicket}
              className="h-11 px-5 rounded-xl bg-secondary text-on-secondary-fixed font-headline font-bold text-xs flex items-center gap-2 shadow-lg shadow-secondary/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">save_as</span>
              <span>Vincular Solución a Orden #{selectedTicketId || activeTicket?.id}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
