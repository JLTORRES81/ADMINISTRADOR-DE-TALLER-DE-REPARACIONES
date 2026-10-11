import React, { useState, useRef } from 'react';
import { Ticket, DeviceCategory } from '../../types';
import { triggerWorkbenchPushNotification } from '../../utils/fcmMessaging';
import { LogicBoardScannerModal } from '../modals/LogicBoardScannerModal';
import { LogicBoardScanResult } from '../../utils/logicBoardParser';

interface IngresoScreenProps {
  ticket: Ticket;
  onUpdateTicket: (updated: Ticket) => void;
  onOpenLabelModal: () => void;
  onShowToast: (msg: string, icon?: string) => void;
  onProceedToChat: () => void;
}

export const IngresoScreen: React.FC<IngresoScreenProps> = ({
  ticket,
  onUpdateTicket,
  onOpenLabelModal,
  onShowToast,
  onProceedToChat,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [ticketData, setTicketData] = useState<Ticket>(ticket);
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [isScanningIMEI, setIsScanningIMEI] = useState(false);
  const [isLogicBoardModalOpen, setIsLogicBoardModalOpen] = useState(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const categories: { id: DeviceCategory; label: string; icon: string }[] = [
    { id: 'smartphone', label: 'Smartphone', icon: 'smartphone' },
    { id: 'laptop', label: 'Laptop', icon: 'laptop_mac' },
    { id: 'console', label: 'Consola', icon: 'sports_esports' },
    { id: 'tablet', label: 'Tablet', icon: 'tablet_mac' },
    { id: 'wearable', label: 'Wearable', icon: 'watch' },
    { id: 'audio', label: 'Audio/Otro', icon: 'speaker' },
  ];

  // Canvas drawing functions
  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    setHasDrawnSignature(true);
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#4cd7f6';

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleStopDraw = () => {
    isDrawingRef.current = false;
  };

  const handleClearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  const simulateIMEIScan = () => {
    setIsScanningIMEI(true);
    onShowToast('Activando cámara escáner de código de barras/IMEI...', 'qr_code_scanner');
    setTimeout(() => {
      const generatedImei = '359284110829147';
      setTicketData((prev) => ({ ...prev, imeiSerial: generatedImei }));
      setIsScanningIMEI(false);
      onShowToast(`IMEI escaneado con éxito: ${generatedImei}`, 'check_circle');
    }, 1200);
  };

  const handleApplyLogicBoardScan = (result: LogicBoardScanResult) => {
    setTicketData((prev) => ({
      ...prev,
      deviceModel: result.model || prev.deviceModel,
      imeiSerial: result.serial || prev.imeiSerial,
      modelCode: result.modelCode || prev.modelCode,
      category: result.category || prev.category,
      tags: result.boardRevision
        ? Array.from(new Set([...prev.tags, `PCB ${result.boardRevision}`]))
        : prev.tags,
      cosmeticNotes: prev.cosmeticNotes
        ? `${prev.cosmeticNotes} | Placa escaneada: ${result.sourceFormat}`
        : `Tarjeta lógica escaneada vía cámara (${result.sourceFormat}): ${result.model} (S/N: ${result.serial})`,
    }));
    onShowToast(`Datos de placa importados: ${result.model} (${result.serial})`, 'verified');
  };

  const handleAddMacroPhoto = () => {
    const newPhoto = {
      id: `p-${Date.now()}`,
      label: 'MACRO LAB',
      status: 'Conector limpiado',
      isWarning: false,
      url: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80',
    };
    const updatedPhotos = [...ticketData.photos, newPhoto];
    setTicketData((prev) => ({ ...prev, photos: updatedPhotos }));
    onShowToast('Nueva evidencia macro agregada al expediente', 'add_a_photo');
  };

  const handleSaveDraft = () => {
    onUpdateTicket(ticketData);
    onShowToast('Borrador de ingreso guardado localmente en sistema', 'save');
  };

  const handleFinishStep1 = () => {
    onUpdateTicket(ticketData);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onShowToast('Paso 1 completado. Continúe con Triage y Firma del cliente.', 'arrow_forward');
  };

  const handleFinalizeTicket = () => {
    onUpdateTicket(ticketData);
    onOpenLabelModal();
    triggerWorkbenchPushNotification(
      ticketData.assignedTech,
      ticketData.assignedBench,
      ticketData.id,
      ticketData.deviceModel,
      ticketData.declaredFault
    );
    onShowToast(`Orden ingresada. Notificación FCM enviada a ${ticketData.assignedTech} (${ticketData.assignedBench})`, 'notifications_active');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-28 space-y-4">
      {/* Top Banner & Stepper Header */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-lg border border-outline-variant/20 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>RECEPCIÓN EN MOSTRADOR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              HOY • 11:42 AM
            </span>
            <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary font-bold">
              Paso {step} de 2
            </span>
          </div>
        </div>

        <div>
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
            IDENTIFICADOR ÚNICO
          </span>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Ticket #{ticketData.id}
          </h2>
        </div>

        {/* Tab Stepper Bar */}
        <div className="grid grid-cols-2 gap-1 pt-1 border-b border-outline-variant/20">
          <button
            onClick={() => setStep(1)}
            className={`py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              step === 1
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>1. Datos & Evidencias</span>
          </button>
          <button
            onClick={() => setStep(2)}
            className={`py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              step === 2
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span>2. Triage & Firma</span>
          </button>
        </div>
      </div>

      {step === 1 ? (
        <>
          {/* Card 1: Contacto del Titular */}
          <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">badge</span>
                <h3 className="font-headline text-sm font-bold text-on-surface">
                  Contacto del Titular
                </h3>
              </div>
              {ticketData.isRegularClient && (
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[11px] font-mono font-semibold">
                  <span className="material-symbols-outlined text-[14px]">history</span>
                  <span>Cliente Habitual</span>
                </div>
              )}
            </div>

            {/* Nombre completo */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                NOMBRE COMPLETO
              </label>
              <div className="flex items-center gap-2.5 h-12 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 focus-within:border-secondary transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">badge</span>
                <input
                  type="text"
                  value={ticketData.clientName}
                  onChange={(e) => setTicketData({ ...ticketData, clientName: e.target.value })}
                  className="w-full bg-transparent font-medium text-sm text-on-surface outline-none"
                  placeholder="Nombre y Apellidos"
                />
              </div>
            </div>

            {/* Teléfono directo / WhatsApp */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                TELÉFONO DIRECTO / WHATSAPP
              </label>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1 flex items-center justify-center gap-1 h-12 rounded-xl bg-surface-container-low border border-outline-variant/20 font-mono text-xs text-on-surface">
                  <span>🇲🇽</span>
                  <span>+52</span>
                </div>
                <div className="col-span-3 flex items-center gap-2.5 h-12 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 focus-within:border-secondary transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">chat</span>
                  <input
                    type="text"
                    value={ticketData.phone.replace('+52 ', '')}
                    onChange={(e) => setTicketData({ ...ticketData, phone: `+52 ${e.target.value}` })}
                    className="w-full bg-transparent font-mono text-sm text-on-surface outline-none"
                    placeholder="10 dígitos"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                EMAIL (TICKET Y REPORTE DIGITAL)
              </label>
              <div className="flex items-center gap-2.5 h-12 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 focus-within:border-secondary transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">mail</span>
                <input
                  type="email"
                  value={ticketData.email}
                  onChange={(e) => setTicketData({ ...ticketData, email: e.target.value })}
                  className="w-full bg-transparent font-medium text-sm text-on-surface outline-none"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Datos del Dispositivo */}
          <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">devices</span>
                <h3 className="font-headline text-sm font-bold text-on-surface">
                  Datos del Dispositivo
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLogicBoardModalOpen(true)}
                className="h-8 px-2.5 rounded-lg bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/30 flex items-center gap-1.5 text-xs font-mono font-bold transition-all active:scale-95"
                title="Escanear tarjeta lógica con cámara"
              >
                <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                <span>Escanear Placa / QR</span>
              </button>
            </div>

            {/* Quick banner indicating optical scanning feature */}
            <div className="p-2.5 rounded-xl bg-surface-container-low border border-secondary/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[18px]">memory</span>
                <div className="text-[11px] font-mono text-on-surface-variant">
                  <span className="text-secondary font-bold">Lector Óptico de Tarjeta Lógica:</span> Reconoce QR / Datamatrix / Códigos de barras de placas base e ingresa modelo y serie.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLogicBoardModalOpen(true)}
                className="shrink-0 text-[10px] font-mono font-bold px-2 py-1 rounded bg-secondary text-on-secondary-fixed hover:brightness-110 transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">videocam</span>
                <span>Cámara</span>
              </button>
            </div>

            {/* Categoría técnica buttons grid */}
            <div className="space-y-1.5">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                CATEGORÍA TÉCNICA
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => {
                  const isSelected = ticketData.category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setTicketData({ ...ticketData, category: cat.id })}
                      className={`h-11 px-2 rounded-xl font-headline text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-secondary text-on-secondary-fixed shadow-[0_0_12px_rgba(76,215,246,0.3)]'
                          : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Marca & modelo exacto */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                MARCA & MODELO EXACTO
              </label>
              <div className="flex items-center justify-between h-12 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <input
                  type="text"
                  value={ticketData.deviceModel}
                  onChange={(e) => setTicketData({ ...ticketData, deviceModel: e.target.value })}
                  className="w-full bg-transparent font-semibold text-sm text-on-surface outline-none"
                />
                <span className="px-2 py-0.5 rounded bg-surface-container-highest font-mono text-[11px] text-secondary font-bold shrink-0">
                  {ticketData.modelCode}
                </span>
              </div>
            </div>

            {/* IMEI / Serie */}
            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                IMEI / NÚMERO DE SERIE
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2.5 h-12 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px]">qr_code</span>
                  <input
                    type="text"
                    value={ticketData.imeiSerial}
                    onChange={(e) => setTicketData({ ...ticketData, imeiSerial: e.target.value })}
                    className="w-full bg-transparent font-mono text-sm text-on-surface outline-none tracking-wider font-semibold"
                    placeholder="Número de Serie o IMEI..."
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogicBoardModalOpen(true)}
                  className="h-12 px-3 rounded-xl bg-secondary/15 hover:bg-secondary/25 border border-secondary/30 text-secondary flex items-center gap-1.5 shrink-0 active:scale-95 transition-all text-xs font-mono font-bold"
                  title="Abrir escáner de cámara para leer QR o código de barras de placa"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    photo_camera
                  </span>
                  <span className="hidden sm:inline">Escanear</span>
                </button>
              </div>
            </div>

            {/* Clave / Patrón */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
                  CLAVE / PATRÓN DE ACCESO
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-mono text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={ticketData.isFormattedOrNoPin}
                    onChange={(e) =>
                      setTicketData({
                        ...ticketData,
                        isFormattedOrNoPin: e.target.checked,
                      })
                    }
                    className="w-3.5 h-3.5 rounded bg-surface-container accent-secondary"
                  />
                  <span>Sin clave / Formateado</span>
                </label>
              </div>
              <div className="h-12 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[18px]">password</span>
                <input
                  type={ticketData.isFormattedOrNoPin ? 'text' : 'password'}
                  disabled={ticketData.isFormattedOrNoPin}
                  value={ticketData.isFormattedOrNoPin ? 'Equipo sin código de bloqueo' : ticketData.accessPin}
                  onChange={(e) => setTicketData({ ...ticketData, accessPin: e.target.value })}
                  className="w-full bg-transparent font-mono text-sm text-on-surface outline-none"
                  placeholder="PIN o patrón numérico"
                />
              </div>
              <p className="font-mono text-[10px] text-on-surface-variant flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-secondary">history</span>
                <span>Uso exclusivo para validación funcional post-reparación (audio, cámaras, táctil).</span>
              </p>
            </div>

            {/* Accesorios en custodia */}
            <div className="space-y-2 pt-1 border-t border-outline-variant/15">
              <label className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                ACCESORIOS ENTREGADOS EN CUSTODIA
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs font-medium text-on-surface">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="checkbox"
                    checked={ticketData.accessories.funda}
                    onChange={(e) =>
                      setTicketData({
                        ...ticketData,
                        accessories: { ...ticketData.accessories, funda: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-secondary"
                  />
                  <span>Funda / Protector</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="checkbox"
                    checked={ticketData.accessories.cargador}
                    onChange={(e) =>
                      setTicketData({
                        ...ticketData,
                        accessories: { ...ticketData.accessories, cargador: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-secondary"
                  />
                  <span>Cargador Original</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="checkbox"
                    checked={ticketData.accessories.cable}
                    onChange={(e) =>
                      setTicketData({
                        ...ticketData,
                        accessories: { ...ticketData.accessories, cable: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-secondary"
                  />
                  <span>Cable USB</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container-high transition-colors">
                  <input
                    type="checkbox"
                    checked={ticketData.accessories.bandejaSim}
                    onChange={(e) =>
                      setTicketData({
                        ...ticketData,
                        accessories: { ...ticketData.accessories, bandejaSim: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-secondary"
                  />
                  <span>Bandeja SIM intacta</span>
                </label>
              </div>
            </div>
          </section>

          {/* Card 3: Falla Declarada */}
          <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-3">
            <div className="flex items-center gap-2 text-tertiary">
              <span className="material-symbols-outlined text-[20px]">warning</span>
              <h3 className="font-headline text-sm font-bold text-on-surface">
                Falla Declarada por el Cliente
              </h3>
            </div>
            <textarea
              rows={3}
              value={ticketData.declaredFault}
              onChange={(e) => setTicketData({ ...ticketData, declaredFault: e.target.value })}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface font-medium leading-relaxed outline-none focus:border-secondary"
            />
            <div className="flex flex-wrap gap-1.5">
              {ticketData.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-high font-mono text-[11px] text-secondary font-bold"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Card 4: Inspección Física */}
          <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">photo_camera</span>
                <div>
                  <h3 className="font-headline text-sm font-bold text-on-surface">
                    Inspección Física
                  </h3>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    Respaldo visual pre-desensamble
                  </p>
                </div>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-container-high text-secondary">
                {ticketData.photos.length} Fotos
              </span>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-3 gap-2">
              {ticketData.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative rounded-xl overflow-hidden aspect-square border border-outline-variant/30 group shadow-sm bg-black"
                >
                  <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] bg-black/60 backdrop-blur-sm">
                    {photo.isWarning ? (
                      <span className="material-symbols-outlined text-amber-400 text-[14px]">warning</span>
                    ) : (
                      <span className="material-symbols-outlined text-secondary text-[14px]">done</span>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5">
                    <span className="font-mono text-[9px] text-secondary font-bold block truncate">
                      {photo.label}
                    </span>
                    <span className="font-mono text-[8px] text-gray-300 block truncate">
                      {photo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Add photo button */}
            <button
              type="button"
              onClick={handleAddMacroPhoto}
              className="w-full h-11 rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-dashed border-secondary/40 text-secondary font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>Tomar Foto / Añadir Macro Evidencia</span>
            </button>

            {/* Anotaciones de estética previa */}
            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block">
                ANOTACIONES DE ESTÉTICA PREVIA (DESGASTE)
              </span>
              <div className="flex items-start gap-2 pt-1 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
                  shield
                </span>
                <p className="leading-relaxed">{ticketData.cosmeticNotes}</p>
              </div>
            </div>
          </section>

          {/* Tray thermal label commitment notice */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-container border border-outline-variant/20 cursor-pointer">
            <input
              type="checkbox"
              checked={ticketData.requiresThermalLabel}
              onChange={(e) =>
                setTicketData({ ...ticketData, requiresThermalLabel: e.target.checked })
              }
              className="w-4 h-4 mt-0.5 rounded accent-secondary"
            />
            <span className="font-mono text-xs text-on-surface leading-snug">
              Al continuar, el sistema genera la etiqueta adhesiva térmica QR #{ticketData.id} para bandeja antiestática.
            </span>
          </label>

          {/* Action buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleFinishStep1}
              className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 active:scale-98 transition-all"
            >
              <span>Generar QR & Continuar a Triage</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="col-span-4 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface font-headline text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Guardar Borrador</span>
              </button>
              <button
                type="button"
                onClick={onOpenLabelModal}
                className="col-span-1 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-secondary flex items-center justify-center transition-colors"
                title="Vista previa etiqueta"
              >
                <span className="material-symbols-outlined text-[20px]">print</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* STEP 2: Triage & Firma */
        <div className="space-y-4">
          {/* Triage bench measurements */}
          <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[20px]">hardware</span>
                <h3 className="font-headline text-sm font-bold text-on-surface">
                  Diagnóstico Rápido de Mesa (Triage)
                </h3>
              </div>
              <span className="font-mono text-[10px] text-tertiary">Banco A-04</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="font-mono text-[10px] text-on-surface-variant block">Consumo USB-C (45W)</span>
                <span className="font-mono font-bold text-error text-sm">0.00A @ 5V (Sin ciclo PD)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="font-mono text-[10px] text-on-surface-variant block">Línea VDD_MAIN</span>
                <span className="font-mono font-bold text-secondary text-sm">3.4 Ohms (Cortocircuito)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="font-mono text-[10px] text-on-surface-variant block">Sensor Térmico Cámara</span>
                <span className="font-mono font-bold text-tertiary text-sm">Punto caliente IC U9001</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                <span className="font-mono text-[10px] text-on-surface-variant block">Tiempo Estimado</span>
                <span className="font-mono font-bold text-on-surface text-sm">24 a 48 hrs hábiles</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 text-xs space-y-1">
              <span className="font-mono text-[10px] text-secondary uppercase font-bold">
                Resolución Preliminar del Técnico Mark Vance:
              </span>
              <p className="text-on-surface-variant leading-relaxed">
                Extracción de blindaje con micro-fresadora para inyección de 1.2V con cámara térmica Flir. Reparación de línea de alimentación principal y reemplazo de condensadores cerámicos 0201.
              </p>
            </div>
          </section>

          {/* Interactive Digital Signature Canvas */}
          <section className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">draw</span>
                <div>
                  <h3 className="font-headline text-sm font-bold text-on-surface">
                    Firma Digital de Conformidad
                  </h3>
                  <p className="font-mono text-[10px] text-on-surface-variant">
                    Titular: {ticketData.clientName}
                  </p>
                </div>
              </div>
              {hasDrawnSignature && (
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="font-mono text-[10px] text-secondary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[12px]">refresh</span>
                  <span>Limpiar</span>
                </button>
              )}
            </div>

            {/* Signature Pad Canvas */}
            <div className="relative rounded-xl border border-secondary/40 bg-surface-container-lowest overflow-hidden h-36 flex items-center justify-center">
              <canvas
                ref={signatureCanvasRef}
                width={500}
                height={144}
                className="w-full h-full touch-none cursor-crosshair"
                onMouseDown={handleStartDraw}
                onMouseMove={handleDraw}
                onMouseUp={handleStopDraw}
                onMouseLeave={handleStopDraw}
                onTouchStart={handleStartDraw}
                onTouchMove={handleDraw}
                onTouchEnd={handleStopDraw}
              />
              {!hasDrawnSignature && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-on-surface-variant/40">
                  <span className="material-symbols-outlined text-[28px]">signature</span>
                  <span className="font-mono text-xs">Firme aquí con el dedo o stylus</span>
                </div>
              )}
            </div>

            {/* Terms clause */}
            <div className="p-2.5 rounded-xl bg-surface-container-low text-[11px] text-on-surface-variant space-y-1">
              <p>
                Acepto el diagnóstico por $350 MXN (100% deducible al reparar) y confirmo que he respaldado mi información. Autorizo apertura de equipo bajo las condiciones físicas notificadas.
              </p>
            </div>
          </section>

          {/* Step 2 Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleFinalizeTicket}
              className="w-full h-12 rounded-xl bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-secondary/20 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
              <span>Finalizar Ingreso & Imprimir Etiqueta</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-11 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface font-headline text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                <span>Modificar Datos</span>
              </button>
              <button
                type="button"
                onClick={onProceedToChat}
                className="h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                <span>Abrir ElectroBot IA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logic Board / Motherboard Optical QR & Barcode Scanner Modal */}
      <LogicBoardScannerModal
        isOpen={isLogicBoardModalOpen}
        onClose={() => setIsLogicBoardModalOpen(false)}
        onApplyScan={handleApplyLogicBoardScan}
        onShowToast={onShowToast}
      />
    </div>
  );
};
