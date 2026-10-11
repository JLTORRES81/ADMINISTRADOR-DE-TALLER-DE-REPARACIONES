import React, { useState } from 'react';
import { Technician } from '../../types';
import { triggerWorkbenchPushNotification } from '../../utils/fcmMessaging';

interface OrdenesFinanzasScreenProps {
  technicians: Technician[];
  onToggleTechWorkload: (techId: string, isActive: boolean) => void;
  onAddTechnician: (newTech: Technician) => void;
  onShowToast: (msg: string, icon?: string) => void;
  onTriggerTestPrint: () => void;
  onOpenBackupModal?: () => void;
}

export const OrdenesFinanzasScreen: React.FC<OrdenesFinanzasScreenProps> = ({
  technicians,
  onToggleTechWorkload,
  onAddTechnician,
  onShowToast,
  onTriggerTestPrint,
  onOpenBackupModal,
}) => {
  const [period, setPeriod] = useState<'hoy' | 'semana' | 'mes'>('semana');
  const [showAddTechModal, setShowAddTechModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'80mm' | '58mm'>('80mm');
  const [printChecks, setPrintChecks] = useState({
    logo: true,
    qr: true,
    whatsapp: true,
    terms: true,
  });

  // Modal form states
  const [techName, setTechName] = useState('');
  const [techSpecialty, setTechSpecialty] = useState('Microsoldadura & Reballing');
  const [techCommission, setTechCommission] = useState(25);
  const [techStatus, setTechStatus] = useState('Activo');
  const [techCanQc, setTechCanQc] = useState(true);
  const [techCanParts, setTechCanParts] = useState(true);

  // Period values
  const getMetrics = () => {
    switch (period) {
      case 'hoy':
        return {
          total: '$3,920',
          anticipos: '$1,400',
          anticiposCount: '2 recibidos',
          pendientes: '$1,200',
          pendientesCount: '2 entregas',
          revision: '$350',
          growth: '+8.2%',
          peak: 'Pico: Hoy $3,920',
          bars: [20, 30, 45, 95, 20, 10, 5],
        };
      case 'mes':
        return {
          total: '$76,800',
          anticipos: '$24,100',
          anticiposCount: '28 recibidos',
          pendientes: '$18,300',
          pendientesCount: '19 entregas',
          revision: '$6,800',
          growth: '+24.6%',
          peak: 'Pico: Sem 2 $22,400',
          bars: [45, 65, 80, 95, 85, 60, 25],
        };
      case 'semana':
      default:
        return {
          total: '$18,450',
          anticipos: '$6,300',
          anticiposCount: '7 recibidos',
          pendientes: '$4,850',
          pendientesCount: '5 entregas',
          revision: '$1,750',
          growth: '+18.4%',
          peak: 'Pico: Jue $4,210',
          bars: [40, 60, 75, 95, 85, 55, 20],
        };
    }
  };

  const metrics = getMetrics();

  const handlePeriodSwitch = (p: 'hoy' | 'semana' | 'mes') => {
    setPeriod(p);
    onShowToast(`Resumen financiero cambiado a: ${p.toUpperCase()}`, 'query_stats');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!techName.trim()) return;

    const newTech: Technician = {
      id: `tech-${Date.now()}`,
      name: techName.trim(),
      level: 'NIVEL 2',
      role: techSpecialty,
      specialty: techSpecialty,
      activeOrders: 1,
      qcRate: 95,
      weeklyCommission: 0,
      bench: 'Banco B-01 asignado',
      isWorkloadActive: techStatus === 'Activo',
      avatarUrl:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      canApproveQc: techCanQc,
      canTakeParts: techCanParts,
    };

    onAddTechnician(newTech);
    setShowAddTechModal(false);
    setTechName('');
    onShowToast(`Técnico ${newTech.name} registrado en nómina y banco de trabajo`, 'check_circle');
  };

  const handleCalibrate = () => {
    onShowToast('Calibrando sensor óptico de gap en impresora rotuladora 58mm...', 'tune');
  };

  const handleExportReport = () => {
    onShowToast('Exportando balance de flujo de caja consolidado (PDF/Excel)...', 'download');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-28 space-y-4">
      {/* Breadcrumb & Mode Banner */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary-container/20 text-secondary">
            <span className="material-symbols-outlined text-[16px]">shield_person</span>
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-secondary font-bold">
            Modo Taller Pro
          </span>
          <span className="text-outline-variant font-mono">•</span>
          <span className="font-mono text-[10px] text-on-surface-variant">Sede Principal</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high border border-outline-variant/20">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-mono text-[10px] text-on-surface font-semibold">Caja Cuadrada</span>
        </div>
      </div>

      {/* Section 1: Executive Financial Summary */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
              Gestión & Finanzas
            </h2>
            <p className="font-mono text-xs text-on-surface-variant">
              Balance de flujo de caja y liquidaciones de taller
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onOpenBackupModal && (
              <button
                onClick={onOpenBackupModal}
                aria-label="Copia de Seguridad Firestore"
                title="Copia de Seguridad Firestore (JSON)"
                className="w-10 h-10 rounded-xl bg-secondary/15 hover:bg-secondary/25 flex items-center justify-center text-secondary transition-colors border border-secondary/30"
              >
                <span className="material-symbols-outlined text-[20px]">database</span>
              </button>
            )}
            <button
              onClick={handleExportReport}
              aria-label="Exportar informe"
              className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[20px]">download</span>
            </button>
          </div>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="grid grid-cols-3 gap-1 bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/20">
          <button
            onClick={() => handlePeriodSwitch('hoy')}
            className={`py-2 px-3 rounded-lg text-center font-mono text-xs transition-all ${
              period === 'hoy'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => handlePeriodSwitch('semana')}
            className={`py-2 px-3 rounded-lg text-center font-mono text-xs transition-all ${
              period === 'semana'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Esta Semana
          </button>
          <button
            onClick={() => handlePeriodSwitch('mes')}
            className={`py-2 px-3 rounded-lg text-center font-mono text-xs transition-all ${
              period === 'mes'
                ? 'bg-primary-container text-on-primary-container font-bold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Este Mes
          </button>
        </div>

        {/* Master Cash Flow Bento Grid */}
        <div className="bg-surface-container rounded-2xl p-4 shadow-lg border border-outline-variant/20 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-secondary font-bold">
                Ingresos Totales Cobrados
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
                  {metrics.total}
                </span>
                <span className="font-mono text-xs text-secondary font-bold">MXN</span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container/20 text-secondary font-mono text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              {metrics.growth}
            </span>
          </div>

          {/* Quick Metrics Ribbon */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/15 flex flex-col justify-between">
              <span className="font-mono text-[10px] text-on-surface-variant truncate">Anticipos</span>
              <span className="font-headline text-base text-on-surface font-bold mt-1">
                {metrics.anticipos}
              </span>
              <span className="font-mono text-[10px] text-secondary truncate">{metrics.anticiposCount}</span>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/15 flex flex-col justify-between">
              <span className="font-mono text-[10px] text-on-surface-variant truncate">Por Cobrar</span>
              <span className="font-headline text-base text-tertiary font-bold mt-1">
                {metrics.pendientes}
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant truncate">{metrics.pendientesCount}</span>
            </div>
            <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/15 flex flex-col justify-between">
              <span className="font-mono text-[10px] text-on-surface-variant truncate">Revisión/Diag</span>
              <span className="font-headline text-base text-primary font-bold mt-1">
                {metrics.revision}
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant truncate">Cobradas</span>
            </div>
          </div>

          {/* Payment Method Split Bar */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                Canal de Cobro
              </span>
              <span className="font-mono text-[10px] text-on-surface-variant">100% Cuadrado</span>
            </div>
            <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden flex shadow-inner">
              <div className="h-full bg-secondary" style={{ width: '45%' }} title="Efectivo 45%"></div>
              <div className="h-full bg-primary-container" style={{ width: '35%' }} title="POS 35%"></div>
              <div className="h-full bg-tertiary" style={{ width: '20%' }} title="SPEI 20%"></div>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-1 text-center text-xs">
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0"></span>
                <span className="font-mono text-[10px] text-on-surface truncate">Efectivo 45%</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-primary-container shrink-0"></span>
                <span className="font-mono text-[10px] text-on-surface truncate">POS 35%</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <span className="w-2 h-2 rounded-full bg-tertiary shrink-0"></span>
                <span className="font-mono text-[10px] text-on-surface truncate">SPEI 20%</span>
              </div>
            </div>
          </div>

          {/* Weekly Cash Velocity Chart */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
                Flujo Diario (Lun - Dom)
              </span>
              <span className="font-mono text-xs text-secondary font-bold">{metrics.peak}</span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 items-end h-22 pt-3 px-2 bg-surface-container-lowest rounded-xl border border-outline-variant/15">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => {
                const heightPct = metrics.bars[idx];
                const isHighlight = day === 'J';
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end group">
                    <div
                      className={`w-full rounded-t transition-all ${
                        isHighlight
                          ? 'bg-secondary shadow-[0_0_10px_rgba(76,215,246,0.5)]'
                          : 'bg-surface-container-high group-hover:bg-secondary/70'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    <span
                      className={`font-mono text-[10px] ${
                        isHighlight ? 'text-secondary font-extrabold' : 'text-on-surface-variant'
                      }`}
                    >
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Technical Staff Management */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Staff Técnico</h3>
            <p className="font-mono text-xs text-on-surface-variant">
              {technicians.filter((t) => t.isWorkloadActive).length} especialistas en turno • Banco activo
            </p>
          </div>
          <button
            onClick={() => setShowAddTechModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-container text-on-primary-container font-headline text-xs font-bold shadow-md active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>+ Alta Técnico</span>
          </button>
        </div>

        {/* Technicians Roster Cards */}
        <div className="space-y-3">
          {technicians.map((tech) => (
            <div
              key={tech.id}
              className="bg-surface-container rounded-2xl p-3.5 space-y-3 relative overflow-hidden border border-outline-variant/20 shadow-md"
            >
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  tech.specialty.includes('Micro')
                    ? 'bg-secondary'
                    : tech.specialty.includes('Triage')
                    ? 'bg-primary-container'
                    : 'bg-tertiary'
                }`}
              ></div>

              <div className="flex items-start justify-between pl-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={tech.avatarUrl}
                      alt={tech.name}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-secondary/30"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-on-secondary">
                      <span className="material-symbols-outlined text-[10px]">build</span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-headline text-sm font-bold text-on-surface leading-tight">
                        {tech.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono text-[9px] uppercase font-bold">
                        {tech.level}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant font-medium">{tech.role}</p>
                  </div>
                </div>

                {/* Dispatch Load Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tech.isWorkloadActive}
                    onChange={(e) => {
                      onToggleTechWorkload(tech.id, e.target.checked);
                      onShowToast(
                        e.target.checked
                          ? `Carga de trabajo activada para ${tech.name}`
                          : `Carga pausada para ${tech.name}`,
                        e.target.checked ? 'toggle_on' : 'toggle_off'
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-on-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </label>
              </div>

              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-2.5 rounded-xl pl-3.5 border border-outline-variant/15 text-xs">
                <div>
                  <span className="font-mono text-[10px] text-on-surface-variant block">Órdenes</span>
                  <span className="font-mono text-sm text-on-surface font-bold">
                    {tech.activeOrders} activas
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-on-surface-variant block">Calidad QC</span>
                  <span className="font-mono text-sm text-secondary font-bold">
                    {tech.qcRate}%
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-on-surface-variant block">Comisión Sem.</span>
                  <span className="font-mono text-sm text-tertiary font-bold">
                    ${tech.weeklyCommission}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-on-surface-variant pt-0.5 px-1 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="material-symbols-outlined text-[15px] text-secondary">memory</span>
                  <span>{tech.bench}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerWorkbenchPushNotification(
                        tech.name,
                        tech.bench,
                        'EF-2024-892',
                        'Samsung Galaxy S23 Ultra',
                        'Prioridad alta: Reballing y validación de corto en línea principal.'
                      );
                      onShowToast(`Push FCM enviado a ${tech.name} (${tech.bench})`, 'notifications_active');
                    }}
                    className="font-mono text-[10px] text-secondary hover:text-on-surface bg-surface-container-high px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                    title="Enviar notificación push de prueba al banco"
                  >
                    <span className="material-symbols-outlined text-[13px]">cell_tower</span>
                    <span>Push FCM</span>
                  </button>
                  <button
                    onClick={() => onShowToast(`Bitácora técnica de ${tech.name} abierta`, 'history')}
                    className="font-mono text-[11px] text-primary hover:underline flex items-center gap-0.5"
                  >
                    <span>Ver bitácora</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Hardware Diagnostics & Thermal Printer Pipeline */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline text-lg font-bold text-on-surface">Periféricos & Impresoras</h3>
            <p className="font-mono text-xs text-on-surface-variant">
              Conexión ESC/POS directa y rotuladoras de taller
            </p>
          </div>
          <span className="material-symbols-outlined text-secondary text-[24px]">print</span>
        </div>

        {/* Active Hardware Cards */}
        <div className="space-y-2">
          {/* Printer 1: POS 80mm Counter */}
          <div className="bg-surface-container rounded-2xl p-3.5 space-y-2.5 border border-outline-variant/20 shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[22px]">receipt_long</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline text-sm font-semibold text-on-surface">Térmica Mostrador</h4>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-secondary font-mono text-[10px] font-bold">
                      80mm
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Protocolo ESC/POS • USB/LAN/BT</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Conectada
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-xl font-mono text-[10px] text-on-surface-variant border border-outline-variant/15">
              <span>IP: 192.168.1.140</span>
              <span>Buffer: OK (0ms)</span>
              <span className="text-secondary font-bold">Papel: 85%</span>
            </div>
          </div>

          {/* Printer 2: QR & Barcode 58mm Labeler */}
          <div className="bg-surface-container rounded-2xl p-3.5 space-y-2.5 border border-outline-variant/20 shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline text-sm font-semibold text-on-surface">Rotuladora QR/Barras</h4>
                    <span className="px-2 py-0.5 rounded bg-surface-container-highest text-primary font-mono text-[10px] font-bold">
                      58mm
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">Bandeja antiestática (#01 - #20)</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-mono text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                En línea
              </span>
            </div>
            <div className="flex items-center justify-between bg-surface-container-low p-2 rounded-xl font-mono text-[10px] text-on-surface-variant border border-outline-variant/15">
              <span>Bluetooth: EDS-LABEL-58</span>
              <span className="text-secondary font-bold">Sensor Gap: Calibrado</span>
            </div>
          </div>
        </div>

        {/* Ticket Format Configuration Panel */}
        <div className="bg-surface-container rounded-2xl p-4 space-y-4 border border-outline-variant/20 shadow-md">
          <div className="flex items-center justify-between">
            <span className="font-headline text-sm font-bold text-on-surface">Configuración de Formato</span>
            <span className="font-mono text-[10px] text-secondary uppercase font-bold tracking-wider">
              Plantilla Oficial
            </span>
          </div>

          {/* Dimension Selector */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedFormat === '80mm'
                  ? 'bg-surface-container-high border-secondary text-secondary'
                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ticket-format"
                  checked={selectedFormat === '80mm'}
                  onChange={() => setSelectedFormat('80mm')}
                  className="accent-secondary"
                />
                <span className="font-medium">80mm Estándar</span>
              </div>
              <span className="font-mono text-[10px] text-secondary">Mostrador</span>
            </label>

            <label
              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                selectedFormat === '58mm'
                  ? 'bg-surface-container-high border-secondary text-secondary'
                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ticket-format"
                  checked={selectedFormat === '58mm'}
                  onChange={() => setSelectedFormat('58mm')}
                  className="accent-secondary"
                />
                <span className="font-medium">58mm Compacto</span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant">Móvil</span>
            </label>
          </div>

          {/* Inclusions Checklist */}
          <div className="space-y-2 pt-1 text-xs">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">
              Campos obligatorios impresos
            </span>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                <span className="text-on-surface">Logotipo Electronics del Sureste</span>
              </div>
              <input
                type="checkbox"
                checked={printChecks.logo}
                onChange={(e) => setPrintChecks({ ...printChecks, logo: e.target.checked })}
                className="w-4 h-4 rounded accent-secondary"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">qr_code</span>
                <span className="text-on-surface">Código QR de Seguimiento en Vivo</span>
              </div>
              <input
                type="checkbox"
                checked={printChecks.qr}
                onChange={(e) => setPrintChecks({ ...printChecks, qr: e.target.checked })}
                className="w-4 h-4 rounded accent-secondary"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">chat</span>
                <span className="text-on-surface">WhatsApp Oficial de Notificaciones</span>
              </div>
              <input
                type="checkbox"
                checked={printChecks.whatsapp}
                onChange={(e) => setPrintChecks({ ...printChecks, whatsapp: e.target.checked })}
                className="w-4 h-4 rounded accent-secondary"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">gavel</span>
                <span className="text-on-surface">Políticas de Garantía & Términos (90 días)</span>
              </div>
              <input
                type="checkbox"
                checked={printChecks.terms}
                onChange={(e) => setPrintChecks({ ...printChecks, terms: e.target.checked })}
                className="w-4 h-4 rounded accent-secondary"
              />
            </label>
          </div>

          {/* Action Buttons for Hardware */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onTriggerTestPrint}
              className="h-12 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-headline text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 border border-outline-variant/25 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">print</span>
              <span>Imprimir Prueba</span>
            </button>
            <button
              onClick={handleCalibrate}
              className="h-12 rounded-xl bg-primary-container hover:bg-primary-container/90 text-on-primary-container font-headline text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Calibrar Papel</span>
            </button>
          </div>
        </div>
      </section>

      {/* Modal: Alta de Técnico */}
      {showAddTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-surface-container rounded-2xl border border-outline-variant/30 p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-primary-container/20 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">badge</span>
                </span>
                <h3 className="font-headline text-base font-bold text-on-surface">Alta de Técnico</h3>
              </div>
              <button
                onClick={() => setShowAddTechModal(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                  Nombre Completo del Especialista
                </label>
                <input
                  type="text"
                  required
                  value={techName}
                  onChange={(e) => setTechName(e.target.value)}
                  placeholder="Ej. Roberto Méndez"
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/25 outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                  Especialidad Principal de Taller
                </label>
                <select
                  value={techSpecialty}
                  onChange={(e) => setTechSpecialty(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/25 outline-none focus:border-secondary"
                >
                  <option value="Microsoldadura & Reballing">Microsoldadura & Reballing</option>
                  <option value="Pantallas & Cristales Ópticos">Pantallas & Cristales Ópticos</option>
                  <option value="Software, Firmware & Triage">Software, Firmware & Triage</option>
                  <option value="Consolas de Videojuegos & Placas">Consolas de Videojuegos & Placas</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                    % Comisión por Reparación
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={techCommission}
                      onChange={(e) => setTechCommission(Number(e.target.value))}
                      className="w-full h-11 px-3 pr-8 rounded-xl bg-surface-container-low text-on-surface font-mono border border-outline-variant/25 outline-none focus:border-secondary"
                    />
                    <span className="absolute right-3 top-3 text-on-surface-variant font-mono">%</span>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                    Estado Operativo
                  </label>
                  <select
                    value={techStatus}
                    onChange={(e) => setTechStatus(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/25 outline-none focus:border-secondary"
                  >
                    <option value="Activo">Activo (En turno)</option>
                    <option value="Inactivo">Inactivo / Licencia</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <span className="font-mono text-[10px] text-secondary uppercase tracking-wider block font-bold">
                  Permisos de Banco de Trabajo
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                    <input
                      type="checkbox"
                      checked={techCanQc}
                      onChange={(e) => setTechCanQc(e.target.checked)}
                      className="rounded accent-secondary"
                    />
                    <span>Aprobación QC</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-on-surface">
                    <input
                      type="checkbox"
                      checked={techCanParts}
                      onChange={(e) => setTechCanParts(e.target.checked)}
                      className="rounded accent-secondary"
                    />
                    <span>Toma de Repuestos</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTechModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-headline font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-headline font-bold shadow-md hover:brightness-110 active:scale-95 transition-all"
                >
                  Registrar Especialista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
