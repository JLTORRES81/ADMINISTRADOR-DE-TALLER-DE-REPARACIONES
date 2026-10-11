import React, { useState, useMemo } from 'react';
import { Technician, Ticket } from '../../types';

interface TechnicianPerformanceCardProps {
  technicians: Technician[];
  tickets: Ticket[];
  onShowToast: (msg: string, icon?: string) => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

type SortField = 'successRate' | 'resolvedPerWeek' | 'avgRepairTime' | 'activeOrders';

interface ComputedTechStats {
  id: string;
  name: string;
  avatarUrl: string;
  level: string;
  role: string;
  specialty: string;
  bench: string;
  activeOrders: number;
  qcRate: number;
  weeklyCommission: number;
  // Key Required Metrics:
  successRate: number; // %
  resolvedPerWeek: number; // tickets / week
  weeklyTarget: number; // tickets / week target
  avgRepairTimeHours: number; // hours
  reworkRate: number; // %
  // Contextual live ticket metrics:
  assignedTicketsCount: number;
  completedTicketsCount: number;
  inProgressTicketsCount: number;
  assignedTickets: Ticket[];
  slaComplianceRate: number; // %
  statusEvaluation: 'Sobresaliente' | 'Óptimo' | 'En Meta' | 'Atención';
}

export const TechnicianPerformanceCard: React.FC<TechnicianPerformanceCardProps> = ({
  technicians,
  tickets,
  onShowToast,
  onSelectTicket,
}) => {
  const [selectedTechId, setSelectedTechId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('successRate');
  const [expandedTechId, setExpandedTechId] = useState<string | null>(null);

  // Compute live performance metrics for each technician
  const computedTechs: ComputedTechStats[] = useMemo(() => {
    return technicians.map((tech) => {
      // Find all tickets assigned to this technician in the system
      const assigned = tickets.filter((t) => {
        const namePart = tech.name.toLowerCase().split(' ')[0];
        return (
          t.assignedTech.toLowerCase().includes(tech.name.toLowerCase()) ||
          t.assignedTech.toLowerCase().includes(namePart)
        );
      });

      const completed = assigned.filter(
        (t) => t.stage === 'entregado' || t.stage === 'qc' || Boolean(t.solutionApplied)
      );
      const inProgress = assigned.filter(
        (t) => t.stage === 'reparacion' || t.stage === 'triage' || t.stage === 'ingreso'
      );

      // Baseline or dynamically calibrated metrics
      const successRate =
        tech.successRate ??
        Math.min(99.2, Math.max(88.0, Number((tech.qcRate * 0.98 + (completed.length > 0 ? 1.5 : 0)).toFixed(1))));

      const weeklyTarget = tech.weeklyTarget ?? 10;
      const resolvedPerWeek =
        tech.resolvedPerWeek ??
        Math.max(6, Math.round(tech.activeOrders * 1.8 + completed.length * 2));

      const avgRepairTimeHours =
        tech.avgRepairTimeHours ??
        Number(
          (tech.specialty.toLowerCase().includes('micro')
            ? 18.2
            : tech.specialty.toLowerCase().includes('triage')
            ? 13.5
            : 21.4
          ).toFixed(1)
        );

      const reworkRate = tech.reworkRate ?? Number((100 - successRate).toFixed(1));

      // Calculate SLA compliance (default ~95%+)
      const slaComplianceRate = Math.min(
        100,
        Math.round(92 + (successRate - 90) * 0.8)
      );

      let statusEvaluation: 'Sobresaliente' | 'Óptimo' | 'En Meta' | 'Atención' = 'Óptimo';
      if (successRate >= 96 && resolvedPerWeek >= weeklyTarget) {
        statusEvaluation = 'Sobresaliente';
      } else if (successRate >= 93) {
        statusEvaluation = 'Óptimo';
      } else if (successRate >= 90) {
        statusEvaluation = 'En Meta';
      } else {
        statusEvaluation = 'Atención';
      }

      return {
        id: tech.id,
        name: tech.name,
        avatarUrl: tech.avatarUrl,
        level: tech.level,
        role: tech.role,
        specialty: tech.specialty,
        bench: tech.bench,
        activeOrders: tech.activeOrders,
        qcRate: tech.qcRate,
        weeklyCommission: tech.weeklyCommission,
        successRate,
        resolvedPerWeek,
        weeklyTarget,
        avgRepairTimeHours,
        reworkRate,
        assignedTicketsCount: assigned.length,
        completedTicketsCount: completed.length,
        inProgressTicketsCount: inProgress.length,
        assignedTickets: assigned,
        slaComplianceRate,
        statusEvaluation,
      };
    });
  }, [technicians, tickets]);

  // Workshop global benchmarks
  const workshopBenchmarks = useMemo(() => {
    if (computedTechs.length === 0) {
      return { avgSuccess: 95.5, avgWeekly: 11.5, avgHours: 17.5 };
    }
    const avgSuccess =
      computedTechs.reduce((sum, t) => sum + t.successRate, 0) / computedTechs.length;
    const avgWeekly =
      computedTechs.reduce((sum, t) => sum + t.resolvedPerWeek, 0) / computedTechs.length;
    const avgHours =
      computedTechs.reduce((sum, t) => sum + t.avgRepairTimeHours, 0) / computedTechs.length;

    return {
      avgSuccess: Number(avgSuccess.toFixed(1)),
      avgWeekly: Number(avgWeekly.toFixed(1)),
      avgHours: Number(avgHours.toFixed(1)),
    };
  }, [computedTechs]);

  // Sorted and filtered list
  const displayTechs = useMemo(() => {
    let list = [...computedTechs];

    if (selectedTechId !== 'all') {
      list = list.filter((t) => t.id === selectedTechId);
    }

    list.sort((a, b) => {
      if (sortBy === 'successRate') return b.successRate - a.successRate;
      if (sortBy === 'resolvedPerWeek') return b.resolvedPerWeek - a.resolvedPerWeek;
      if (sortBy === 'avgRepairTime') return a.avgRepairTimeHours - b.avgRepairTimeHours; // lower is better
      if (sortBy === 'activeOrders') return b.activeOrders - a.activeOrders;
      return 0;
    });

    return list;
  }, [computedTechs, selectedTechId, sortBy]);

  const toggleExpand = (techId: string) => {
    setExpandedTechId((prev) => (prev === techId ? null : techId));
  };

  return (
    <section className="bg-surface-container rounded-2xl p-4 sm:p-5 border border-outline-variant/25 shadow-xl space-y-4 relative overflow-hidden">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-secondary via-primary to-tertiary opacity-80" />

      {/* Header with Title and Global Benchmarks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">
              military_tech
            </span>
            <h2 className="font-headline text-base font-bold text-on-surface tracking-tight">
              Rendimiento Individual por Especialista
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-mono font-bold uppercase border border-secondary/30">
              Live KPIs
            </span>
          </div>
          <p className="font-mono text-[11px] text-on-surface-variant mt-0.5">
            Métricas de tasa de éxito, ritmo semanal de resolución y tiempo promedio de ciclo técnico
          </p>
        </div>

        {/* Workshop Global Averages Badge */}
        <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20 font-mono text-[11px] shrink-0">
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[9px] uppercase font-bold">
              Promedio Taller
            </span>
            <div className="flex items-center gap-3 text-on-surface">
              <span title="Tasa de éxito promedio global">
                Éxito: <strong className="text-emerald-400">{workshopBenchmarks.avgSuccess}%</strong>
              </span>
              <span>•</span>
              <span title="Tickets resueltos por semana promedio">
                Ritmo: <strong className="text-secondary">{workshopBenchmarks.avgWeekly}/sem</strong>
              </span>
              <span>•</span>
              <span title="Tiempo medio de reparación">
                Tiempo: <strong className="text-tertiary">{workshopBenchmarks.avgHours}h</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Filter by Tech and Sort Pills */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-outline-variant/15">
        {/* Technician Select Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs font-mono">
          <button
            onClick={() => setSelectedTechId('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              selectedTechId === 'all'
                ? 'bg-secondary text-on-secondary-fixed font-bold shadow'
                : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">group</span>
            <span>Todos ({computedTechs.length})</span>
          </button>
          {computedTechs.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setSelectedTechId(tech.id)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                selectedTechId === tech.id
                  ? 'bg-secondary text-on-secondary-fixed font-bold shadow'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border border-outline-variant/20'
              }`}
            >
              <img
                src={tech.avatarUrl}
                alt={tech.name}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span>{tech.name}</span>
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-1.5 text-xs font-mono ml-auto">
          <span className="text-[10px] text-on-surface-variant uppercase">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="h-8 px-2 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant/20 text-xs font-mono outline-none"
          >
            <option value="successRate">Tasa de Éxito (%)</option>
            <option value="resolvedPerWeek">Resueltos / Semana</option>
            <option value="avgRepairTime">Tiempo Promedio</option>
            <option value="activeOrders">Órdenes Activas</option>
          </select>
        </div>
      </div>

      {/* Technician Detailed Cards Grid */}
      <div className="grid grid-cols-1 gap-3.5">
        {displayTechs.map((tech) => {
          const isExpanded = expandedTechId === tech.id;
          const weeklyProgressPct = Math.min(
            150,
            Math.round((tech.resolvedPerWeek / tech.weeklyTarget) * 100)
          );

          return (
            <div
              key={tech.id}
              className="rounded-2xl bg-surface-container-low border border-outline-variant/25 p-4 sm:p-4.5 space-y-3.5 hover:border-secondary/40 transition-all shadow-sm"
            >
              {/* Technician Identity Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={tech.avatarUrl}
                      alt={tech.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-secondary/40 shadow"
                    />
                    <span
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface-container-low flex items-center justify-center"
                      title="Activo en banco"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline text-sm sm:text-base font-bold text-on-surface">
                        {tech.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-secondary/15 text-secondary text-[10px] font-mono font-bold border border-secondary/25">
                        {tech.level}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                          tech.statusEvaluation === 'Sobresaliente'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : tech.statusEvaluation === 'Óptimo'
                            ? 'bg-secondary/15 text-secondary border-secondary/30'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {tech.statusEvaluation}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-on-surface-variant mt-0.5">
                      <span>{tech.specialty}</span>
                      <span>•</span>
                      <span className="text-secondary/90">{tech.bench}</span>
                    </div>
                  </div>
                </div>

                {/* Right Quick Summary Badges */}
                <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant uppercase block">
                      En Banco
                    </span>
                    <span className="font-bold text-on-surface text-sm">
                      {tech.activeOrders} órdenes
                    </span>
                  </div>
                  <div className="h-7 w-px bg-outline-variant/30" />
                  <div className="text-right">
                    <span className="text-[10px] text-on-surface-variant uppercase block">
                      Comisión Sem.
                    </span>
                    <span className="font-bold text-primary text-sm">
                      ${tech.weeklyCommission.toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              </div>

              {/* THREE MAIN REQUIRED METRICS ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* 1. Tasa de Éxito */}
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-emerald-400">
                        verified
                      </span>
                      Tasa de Éxito
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      QC {tech.qcRate}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-2xl font-black text-emerald-400 tracking-tight">
                      {tech.successRate}%
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      efectividad
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, tech.successRate)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                      <span>Retrabajo: {tech.reworkRate}%</span>
                      <span className="text-emerald-400 font-bold">Garantías OK</span>
                    </div>
                  </div>
                </div>

                {/* 2. Tickets Resueltos por Semana */}
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-secondary">
                        task_alt
                      </span>
                      Resueltos / Sem.
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                        weeklyProgressPct >= 100
                          ? 'bg-secondary/15 text-secondary border border-secondary/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {weeklyProgressPct}% meta
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-2xl font-black text-secondary tracking-tight">
                      {tech.resolvedPerWeek}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      tickets / sem
                    </span>
                  </div>

                  {/* Progress bar vs weekly target */}
                  <div className="space-y-1">
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-secondary to-primary rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(100, weeklyProgressPct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                      <span>Meta: {tech.weeklyTarget} sem</span>
                      <span className="text-secondary font-bold">
                        {tech.resolvedPerWeek >= tech.weeklyTarget
                          ? `+${tech.resolvedPerWeek - tech.weeklyTarget} sobre cuota`
                          : `${tech.weeklyTarget - tech.resolvedPerWeek} restantes`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Tiempo Promedio de Reparación */}
                <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">
                        schedule
                      </span>
                      Tiempo Promedio
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-tertiary/15 text-tertiary border border-tertiary/30">
                      SLA {tech.slaComplianceRate}%
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-headline text-2xl font-black text-tertiary tracking-tight">
                      {tech.avgRepairTimeHours}h
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-variant">
                      (~{(tech.avgRepairTimeHours / 12).toFixed(1)} días lab.)
                    </span>
                  </div>

                  {/* SLA progress indicator */}
                  <div className="space-y-1">
                    <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-tertiary to-amber-400 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, Math.max(25, (24 / tech.avgRepairTimeHours) * 75))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant">
                      <span>Límite SLA: 24.0h</span>
                      <span className="text-emerald-400 font-bold">
                        {tech.avgRepairTimeHours < 24
                          ? `-${(24 - tech.avgRepairTimeHours).toFixed(1)}h vs SLA`
                          : 'En límite SLA'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row to toggle live tickets assigned to this technician */}
              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/15 text-xs font-mono">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    receipt_long
                  </span>
                  <span>
                    Órdenes vinculadas en el sistema: <strong>{tech.assignedTicketsCount}</strong>
                    {' '}
                    ({tech.completedTicketsCount} completadas / {tech.inProgressTicketsCount} en proceso)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onShowToast(
                        `Reporte de ${tech.name}: ${tech.successRate}% éxito • ${tech.resolvedPerWeek} resueltos/sem • ${tech.avgRepairTimeHours}h ciclo`,
                        'query_stats'
                      );
                    }}
                    className="h-7 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/20 flex items-center gap-1 transition-all"
                    title="Exportar informe técnico"
                  >
                    <span className="material-symbols-outlined text-[14px]">share</span>
                    <span className="hidden sm:inline">Compartir</span>
                  </button>

                  <button
                    onClick={() => toggleExpand(tech.id)}
                    className="h-7 px-3 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 font-bold flex items-center gap-1 transition-all"
                  >
                    <span>{isExpanded ? 'Ocultar Tickets' : 'Ver Tickets Asignados'}</span>
                    <span className="material-symbols-outlined text-[16px]">
                      {isExpanded ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Expandable Live Assigned Tickets Section */}
              {isExpanded && (
                <div className="mt-2 p-3 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-secondary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">inventory_2</span>
                      Órdenes Asignadas a {tech.name}
                    </span>
                    <span className="text-[10px] text-on-surface-variant">
                      Total: {tech.assignedTickets.length} registros
                    </span>
                  </div>

                  {tech.assignedTickets.length === 0 ? (
                    <div className="p-3 text-center text-xs font-mono text-on-surface-variant bg-surface-container-low rounded-lg">
                      No hay tickets activos asignados actualmente a este especialista.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {tech.assignedTickets.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => onSelectTicket && onSelectTicket(t)}
                          className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/15 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-secondary/40 transition-colors cursor-pointer text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-secondary text-[11px]">
                                {t.id}
                              </span>
                              <span className="font-bold text-on-surface">
                                {t.deviceModel}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-bold ${
                                  t.stage === 'entregado'
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : t.stage === 'qc'
                                    ? 'bg-secondary/15 text-secondary'
                                    : t.stage === 'reparacion'
                                    ? 'bg-primary/15 text-primary'
                                    : 'bg-amber-500/15 text-amber-400'
                                }`}
                              >
                                {t.stage}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-on-surface-variant truncate max-w-md mt-0.5">
                              {t.solutionApplied || t.declaredFault}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono text-[11px]">
                            <span className="text-on-surface-variant">
                              Presupuesto: <strong>${t.laborCost + t.partsCost}</strong>
                            </span>
                            <span className="material-symbols-outlined text-secondary text-[15px]">
                              chevron_right
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
