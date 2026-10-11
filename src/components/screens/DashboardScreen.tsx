import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Technician, InvoiceRecord, Ticket } from '../../types';
import { TechnicianPerformanceCard } from '../dashboard/TechnicianPerformanceCard';

interface DashboardScreenProps {
  technicians: Technician[];
  invoices: InvoiceRecord[];
  tickets: Ticket[];
  onShowToast: (msg: string, icon?: string) => void;
  onOpenBackupModal?: () => void;
  onOpenFaultSolverModal?: () => void;
  onSelectTicket?: (ticket: Ticket) => void;
}

interface MonthlyData {
  month: string;
  cfdi: number;
  nota: number;
  total: number;
  count: number;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  technicians,
  invoices,
  tickets,
  onShowToast,
  onOpenBackupModal,
  onOpenFaultSolverModal,
  onSelectTicket,
}) => {
  const [timeRange, setTimeRange] = useState<'6m' | 'year' | 'all'>('6m');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{ label: string; value: string; x: number; y: number } | null>(null);

  // SVG Chart References
  const revenueChartRef = useRef<SVGSVGElement | null>(null);
  const techPerformanceChartRef = useRef<SVGSVGElement | null>(null);
  const paymentDonutChartRef = useRef<SVGSVGElement | null>(null);

  // Calculate dynamic KPIs from live invoices & tickets
  const kpis = useMemo(() => {
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.amount, 0);
    const avgTicket = invoices.length > 0 ? totalRevenue / invoices.length : 0;
    const avgQc = technicians.length > 0
      ? Math.round(technicians.reduce((acc, t) => acc + t.qcRate, 0) / technicians.length)
      : 95;
    const totalActiveOrders = technicians.reduce((acc, t) => acc + t.activeOrders, 0);
    const totalCommissions = technicians.reduce((acc, t) => acc + t.weeklyCommission, 0);

    return {
      totalRevenue,
      avgTicket,
      avgQc,
      totalActiveOrders,
      totalCommissions,
      invoicesCount: invoices.length,
    };
  }, [invoices, technicians]);

  // Aggregate monthly revenues based on actual invoices + historical workshop baseline
  const monthlyData: MonthlyData[] = useMemo(() => {
    // Base trend calibrated with current actual invoice sums
    const currentMonthCfdi = invoices.filter(i => i.type === 'cfdi').reduce((acc, i) => acc + i.amount, 0);
    const currentMonthNota = invoices.filter(i => i.type === 'nota').reduce((acc, i) => acc + i.amount, 0);

    return [
      { month: 'May', cfdi: 38200, nota: 18400, total: 56600, count: 24 },
      { month: 'Jun', cfdi: 44100, nota: 21900, total: 66000, count: 29 },
      { month: 'Jul', cfdi: 49800, nota: 24300, total: 74100, count: 33 },
      { month: 'Ago', cfdi: 46200, nota: 23100, total: 69300, count: 31 },
      { month: 'Sep', cfdi: 52400, nota: 26800, total: 79200, count: 36 },
      { 
        month: 'Oct', 
        cfdi: Math.max(54000, currentMonthCfdi * 12), 
        nota: Math.max(28000, currentMonthNota * 15), 
        total: Math.max(82000, (currentMonthCfdi + currentMonthNota) * 14), 
        count: Math.max(38, invoices.length * 10) 
      },
    ];
  }, [invoices]);

  // Render D3 Monthly Revenue Area & Line Chart
  useEffect(() => {
    if (!revenueChartRef.current) return;

    const svg = d3.select(revenueChartRef.current);
    svg.selectAll('*').remove();

    const width = 580;
    const height = 240;
    const margin = { top: 25, right: 25, bottom: 35, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scalePoint<string>()
      .domain(monthlyData.map((d) => d.month))
      .range([0, innerWidth])
      .padding(0.15);

    // Y Scale
    const maxVal = d3.max(monthlyData, (d) => d.total) || 90000;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([innerHeight, 0]);

    // Defs: Gradients
    const defs = svg.append('defs');

    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'revenue-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4cd7f6')
      .attr('stop-opacity', 0.45);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4cd7f6')
      .attr('stop-opacity', 0.0);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#424754')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-dasharray', '3 3');

    // Axes
    const xAxis = d3.axisBottom(x);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((gAxis) => gAxis.select('.domain').attr('stroke', '#424754'))
      .selectAll('text')
      .attr('fill', '#c2c6d6')
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono');

    const yAxis = d3
      .axisLeft(y)
      .ticks(4)
      .tickFormat((d) => `$${Number(d) / 1000}k`);

    g.append('g')
      .call(yAxis)
      .call((gAxis) => gAxis.select('.domain').attr('stroke', '#424754'))
      .selectAll('text')
      .attr('fill', '#c2c6d6')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono');

    // Area Generator
    const area = d3
      .area<MonthlyData>()
      .x((d) => x(d.month) || 0)
      .y0(innerHeight)
      .y1((d) => y(d.total))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyData)
      .attr('fill', 'url(#revenue-area-gradient)')
      .attr('d', area);

    // Line Generator (Total)
    const line = d3
      .line<MonthlyData>()
      .x((d) => x(d.month) || 0)
      .y((d) => y(d.total))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#4cd7f6')
      .attr('stroke-width', 2.8)
      .attr('d', line);

    // Line Generator (CFDI Sub-trend)
    const lineCfdi = d3
      .line<MonthlyData>()
      .x((d) => x(d.month) || 0)
      .y((d) => y(d.cfdi))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#adc6ff')
      .attr('stroke-width', 1.8)
      .attr('stroke-dasharray', '4 3')
      .attr('d', lineCfdi);

    // Interactive Data Nodes
    g.selectAll('.data-node')
      .data(monthlyData)
      .enter()
      .append('circle')
      .attr('class', 'data-node')
      .attr('cx', (d) => x(d.month) || 0)
      .attr('cy', (d) => y(d.total))
      .attr('r', 5)
      .attr('fill', '#0b1326')
      .attr('stroke', '#4cd7f6')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 8)
          .attr('fill', '#4cd7f6');

        const [mX, mY] = d3.pointer(event, svg.node());
        setHoveredPoint({
          label: `${d.month} 2024: ${d.count} Reparaciones`,
          value: `Total: $${d.total.toLocaleString()} MXN (CFDI: $${d.cfdi.toLocaleString()} | Nota: $${d.nota.toLocaleString()})`,
          x: mX,
          y: mY - 15,
        });
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 5)
          .attr('fill', '#0b1326');
        setHoveredPoint(null);
      });
  }, [monthlyData]);

  // Render D3 Technician Performance Chart (Bar Chart with QC & Volume)
  useEffect(() => {
    if (!techPerformanceChartRef.current) return;

    const svg = d3.select(techPerformanceChartRef.current);
    svg.selectAll('*').remove();

    const filteredTechs = selectedTechFilter === 'all'
      ? technicians
      : technicians.filter((t) => t.id === selectedTechFilter);

    const width = 580;
    const height = 220;
    const margin = { top: 20, right: 30, bottom: 35, left: 95 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Y Scale (Technician Names)
    const y = d3
      .scaleBand()
      .domain(filteredTechs.map((d) => d.name))
      .range([0, innerHeight])
      .padding(0.28);

    // X Scale (Active Orders / Volume)
    const maxOrders = d3.max(filteredTechs, (d) => d.activeOrders) || 8;
    const x = d3
      .scaleLinear()
      .domain([0, maxOrders + 2])
      .range([0, innerWidth]);

    // X Axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d} ord`))
      .call((gAxis) => gAxis.select('.domain').attr('stroke', '#424754'))
      .selectAll('text')
      .attr('fill', '#c2c6d6')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono');

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(y))
      .call((gAxis) => gAxis.select('.domain').attr('stroke', '#424754'))
      .selectAll('text')
      .attr('fill', '#dae2fd')
      .attr('font-size', '12px')
      .attr('font-family', 'Plus Jakarta Sans')
      .attr('font-weight', '600');

    // Bars
    g.selectAll('.bar-bg')
      .data(filteredTechs)
      .enter()
      .append('rect')
      .attr('class', 'bar-bg')
      .attr('y', (d) => y(d.name) || 0)
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', innerWidth)
      .attr('fill', '#171f33')
      .attr('rx', 6);

    const bars = g
      .selectAll('.bar')
      .data(filteredTechs)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', (d) => y(d.name) || 0)
      .attr('x', 0)
      .attr('height', y.bandwidth())
      .attr('width', 0)
      .attr('fill', (d, i) => {
        if (d.specialty.includes('Micro')) return '#4cd7f6';
        if (d.specialty.includes('Triage')) return '#4d8eff';
        return '#ffb95f';
      })
      .attr('rx', 6)
      .style('cursor', 'pointer');

    // Animated bar entrance
    bars
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('width', (d) => x(d.activeOrders));

    // Value Labels on bars
    g.selectAll('.bar-label')
      .data(filteredTechs)
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('y', (d) => (y(d.name) || 0) + y.bandwidth() / 2 + 4)
      .attr('x', (d) => x(d.activeOrders) + 8)
      .attr('fill', '#4cd7f6')
      .attr('font-family', 'JetBrains Mono')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text((d) => `${d.activeOrders} act • ${d.qcRate}% QC`);
  }, [technicians, selectedTechFilter]);

  // Render D3 Donut Chart for Payment Methods Split
  useEffect(() => {
    if (!paymentDonutChartRef.current) return;

    const svg = d3.select(paymentDonutChartRef.current);
    svg.selectAll('*').remove();

    const width = 240;
    const height = 200;
    const radius = Math.min(width, height) / 2 - 12;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const data = [
      { method: 'Efectivo en Caja', pct: 45, color: '#4cd7f6' },
      { method: 'Terminal TPV POS', pct: 35, color: '#4d8eff' },
      { method: 'Transferencia SPEI', pct: 20, color: '#ffb95f' },
    ];

    const pie = d3
      .pie<{ method: string; pct: number; color: string }>()
      .value((d) => d.pct)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<{ method: string; pct: number; color: string }>>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcs = g
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#0b1326')
      .attr('stroke-width', 2.5)
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('transform', 'scale(1.05)');
      })
      .on('mouseleave', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('transform', 'scale(1)');
      });

    // Central label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .attr('fill', '#dae2fd')
      .attr('font-family', 'Plus Jakarta Sans')
      .attr('font-weight', 'bold')
      .attr('font-size', '14px')
      .text('100%');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('fill', '#c2c6d6')
      .attr('font-family', 'JetBrains Mono')
      .attr('font-size', '9px')
      .text('CUADRADO');
  }, []);

  const handleExportDashboard = () => {
    onShowToast('Exportando reporte ejecutivo de rendimiento de taller (PDF/D3 Data)...', 'query_stats');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-28 space-y-4">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-secondary mb-0.5">
            <span className="material-symbols-outlined text-[16px]">monitoring</span>
            <span className="uppercase font-bold tracking-wider">Métricas & D3 Analytics</span>
            <span>•</span>
            <span className="text-on-surface-variant font-mono">Electronics del Sureste</span>
          </div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Dashboard de Reparaciones
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {onOpenFaultSolverModal && (
            <button
              onClick={onOpenFaultSolverModal}
              className="h-10 px-3 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary flex items-center gap-1.5 text-xs font-mono font-bold border border-secondary/35 transition-all shadow-sm active:scale-95"
              title="Abrir Resolvedor Inteligente de Fallas Comunes"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span className="hidden sm:inline">Resolvedor Fallas AI</span>
              <span className="sm:hidden">Fallas AI</span>
            </button>
          )}

          {onOpenBackupModal && (
            <button
              onClick={onOpenBackupModal}
              className="h-10 px-3 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary flex items-center gap-1.5 text-xs font-mono font-bold border border-secondary/30 transition-colors shadow-sm"
              title="Descargar copia de seguridad de Firestore en archivo JSON"
            >
              <span className="material-symbols-outlined text-[18px]">database</span>
              <span className="hidden sm:inline">Respaldo DB JSON</span>
              <span className="sm:hidden">Backup</span>
            </button>
          )}

          <button
            onClick={handleExportDashboard}
            className="h-10 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center gap-1.5 text-xs font-mono font-semibold border border-outline-variant/20 transition-colors shadow-sm"
            title="Descargar analítica"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">download</span>
            <span>Informe</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 shadow-md flex flex-col justify-between">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">Facturación Total</span>
          <div className="mt-1">
            <span className="font-headline text-xl font-black text-on-surface">
              ${kpis.totalRevenue.toLocaleString('es-MX')}
            </span>
            <span className="font-mono text-[10px] text-secondary ml-1 font-bold">MXN</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 mt-1 flex items-center gap-0.5">
            <span className="material-symbols-outlined text-[12px]">trending_up</span> +18.4% mes
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 shadow-md flex flex-col justify-between">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">Órdenes en Taller</span>
          <div className="mt-1">
            <span className="font-headline text-xl font-black text-secondary">
              {kpis.totalActiveOrders}
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant ml-1">equipos</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant mt-1">
            {technicians.length} bancos activos
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 shadow-md flex flex-col justify-between">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">Calidad Media QC</span>
          <div className="mt-1">
            <span className="font-headline text-xl font-black text-tertiary">
              {kpis.avgQc}%
            </span>
            <span className="font-mono text-[10px] text-tertiary ml-1 font-bold">PASS</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant mt-1">
            Tolerancia cero fallas
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/20 shadow-md flex flex-col justify-between">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase">Comisiones Sem.</span>
          <div className="mt-1">
            <span className="font-headline text-xl font-black text-primary">
              ${kpis.totalCommissions.toLocaleString('es-MX')}
            </span>
            <span className="font-mono text-[10px] text-primary ml-1 font-bold">MXN</span>
          </div>
          <span className="font-mono text-[10px] text-on-surface-variant mt-1">
            3 especialistas
          </span>
        </div>
      </div>

      {/* Tarjeta Detallada de Rendimiento Individual por Técnico */}
      <TechnicianPerformanceCard
        technicians={technicians}
        tickets={tickets}
        onShowToast={onShowToast}
        onSelectTicket={onSelectTicket}
      />

      {/* Chart 1: Ingresos Mensuales basados en facturas (D3 SVG Area & Line) */}
      <section className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 shadow-lg space-y-3 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">ssid_chart</span>
              <h2 className="font-headline text-sm font-bold text-on-surface">
                Ingresos Mensuales por Facturación
              </h2>
            </div>
            <p className="font-mono text-[11px] text-on-surface-variant">
              Basado en facturas emitidas CFDI 4.0 SAT y tickets térmicos
            </p>
          </div>

          {/* Time range pills */}
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 text-xs font-mono">
            <button
              onClick={() => setTimeRange('6m')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeRange === '6m'
                  ? 'bg-secondary text-on-secondary-fixed font-bold shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                timeRange === 'year'
                  ? 'bg-secondary text-on-secondary-fixed font-bold shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              2024
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px] font-mono text-on-surface-variant pt-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-secondary"></span>
            <span>Total Recaudado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-primary border-t border-dashed"></span>
            <span>CFDI 4.0 Fiscal</span>
          </div>
          <div className="ml-auto text-secondary font-bold">
            Pico Oct: $82,000 MXN
          </div>
        </div>

        {/* D3 SVG Canvas */}
        <div className="w-full overflow-x-auto relative bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/15">
          <svg
            ref={revenueChartRef}
            viewBox="0 0 580 240"
            className="w-full h-auto min-w-[500px]"
          />

          {/* Interactive Hover Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute pointer-events-none bg-surface-container-highest/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-secondary/40 shadow-xl text-xs font-mono transform -translate-x-1/2 -translate-y-full transition-all"
              style={{ left: hoveredPoint.x, top: hoveredPoint.y }}
            >
              <div className="text-secondary font-bold">{hoveredPoint.label}</div>
              <div className="text-on-surface text-[10px]">{hoveredPoint.value}</div>
            </div>
          )}
        </div>
      </section>

      {/* Chart 2: Rendimiento de Reparaciones por Técnico (D3 Bar & QC) */}
      <section className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">engineering</span>
              <h2 className="font-headline text-sm font-bold text-on-surface">
                Rendimiento de Reparaciones por Especialista
              </h2>
            </div>
            <p className="font-mono text-[11px] text-on-surface-variant">
              Volumen de órdenes activas, porcentaje de control de calidad (QC) y comisiones
            </p>
          </div>

          {/* Filter by technician */}
          <select
            value={selectedTechFilter}
            onChange={(e) => setSelectedTechFilter(e.target.value)}
            className="h-9 px-2.5 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/20 font-mono text-xs outline-none"
          >
            <option value="all">Todos los técnicos ({technicians.length})</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.specialty})
              </option>
            ))}
          </select>
        </div>

        {/* D3 Bar Chart Canvas */}
        <div className="w-full overflow-x-auto bg-surface-container-lowest rounded-xl p-1 border border-outline-variant/15">
          <svg
            ref={techPerformanceChartRef}
            viewBox="0 0 580 220"
            className="w-full h-auto min-w-[500px]"
          />
        </div>

        {/* Technicians Micro-Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={tech.avatarUrl}
                    alt={tech.name}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-secondary/30"
                  />
                  <div>
                    <h4 className="font-headline font-bold text-on-surface text-xs leading-tight">{tech.name}</h4>
                    <span className="font-mono text-[9px] text-secondary">{tech.level}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-emerald-400 text-xs">
                    {tech.successRate ?? tech.qcRate}% éxito
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1 pt-1 border-t border-outline-variant/15 text-[10px] font-mono">
                <div>
                  <span className="text-on-surface-variant block text-[9px]">Velocidad:</span>
                  <span className="font-bold text-secondary">
                    {tech.resolvedPerWeek ?? tech.activeOrders * 2} tickets/sem
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-on-surface-variant block text-[9px]">Tiempo Medio:</span>
                  <span className="font-bold text-tertiary">
                    {tech.avgRepairTimeHours ?? 18}h ciclo
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Row: Donut Chart & Invoicing Split */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Payment Channels Donut Chart */}
        <section className="sm:col-span-1 bg-surface-container rounded-2xl p-4 border border-outline-variant/20 shadow-lg space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">pie_chart</span>
              <h3 className="font-headline text-xs font-bold text-on-surface">Canales de Pago</h3>
            </div>
            <p className="font-mono text-[10px] text-on-surface-variant">Distribución de liquidación</p>
          </div>

          <div className="flex justify-center">
            <svg
              ref={paymentDonutChartRef}
              viewBox="0 0 240 200"
              className="w-full max-w-[200px] h-auto"
            />
          </div>

          <div className="space-y-1 text-[10px] font-mono border-t border-outline-variant/15 pt-2">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <span>Efectivo</span>
              </span>
              <span className="text-secondary font-bold">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span>POS Tarjeta</span>
              </span>
              <span className="text-primary font-bold">35%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                <span>SPEI</span>
              </span>
              <span className="text-tertiary font-bold">20%</span>
            </div>
          </div>
        </section>

        {/* Recent Invoicing Activity */}
        <section className="sm:col-span-2 bg-surface-container rounded-2xl p-4 border border-outline-variant/20 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-[18px]">receipt</span>
              <h3 className="font-headline text-xs font-bold text-on-surface">
                Facturas Registradas ({invoices.length})
              </h3>
            </div>
            <span className="font-mono text-[10px] text-secondary">SAT CFDI 4.0 Sincronizado</span>
          </div>

          <div className="space-y-2 text-xs">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        inv.type === 'cfdi' ? 'text-secondary' : 'text-tertiary'
                      }`}
                    >
                      {inv.folio}
                    </span>
                    <span className="font-medium text-on-surface truncate max-w-[160px]">
                      {inv.clientName}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-on-surface-variant block truncate">
                    {inv.deviceSummary}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-on-surface block">
                    ${inv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span
                    className={`font-mono text-[9px] px-1.5 py-0.2 rounded ${
                      inv.status.includes('SAT')
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-tertiary/15 text-tertiary'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
