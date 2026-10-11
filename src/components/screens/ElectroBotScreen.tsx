import React, { useState, useRef, useEffect } from 'react';
import { Ticket, ChatMessage } from '../../types';

interface ElectroBotScreenProps {
  tickets: Ticket[];
  activeTicket: Ticket;
  chatMessages: ChatMessage[];
  onSelectTicket: (t: Ticket) => void;
  onSendMessage: (text: string) => void;
  onOpenTicketDetail: () => void;
  onOpenMicroscopeModal: (photoUrl: string, title: string, subtitle: string) => void;
  onShowToast: (msg: string, icon?: string) => void;
  onOpenFaultSolverModal?: () => void;
}

export const ElectroBotScreen: React.FC<ElectroBotScreenProps> = ({
  tickets,
  activeTicket,
  chatMessages,
  onSelectTicket,
  onSendMessage,
  onOpenTicketDetail,
  onOpenMicroscopeModal,
  onShowToast,
  onOpenFaultSolverModal,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const microscopePhotos = [
    {
      id: 'm1',
      title: 'Flex Conector • 45x Zoom',
      subtitle: 'Inspección de pines de flex de carga y soldadura SMD',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBu6_U99MbgmaxXKkiw_pk_R0gLBm-vZ2u7XAa1mUoRZrSTRz8yiiDJiuERghMLrsj9piespPkgXB7fbng8T1C8y2GKpF_jgxHQznzc5JddjCEB9czzhG7nTb6q9_X3i8y3uHogTCz2QEKg6LHOsN_QTO7JpCOwe3qOAIaDa_mgaB7CeR82Bttut42YYtb3AmgDFoMM-L4GXevtG0c2TdGJcScTu7dvVrTH3yzD_aNV6MlyHobWGH5T',
    },
    {
      id: 'm2',
      title: 'Pista Fisurada • Lab Mark',
      subtitle: 'Línea de alimentación fracturada bajo resina epóxica',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0ao10oY6nn1IEBr8oGIdBD3CW5BJ4CGD99VVtK65hhKzjIjL7f68EQ-Id8_7pm0fsckNOAF3W3FtalnR_VcAqpiEleJ72bQPVyn4L6dWcW_7XfRsA9g6D9Tu2yj-afmHn5I10c9DSibICB3HShQN5p4ENvQHfMDwQp572cPFCQQ3LvH_hzpCWoOF_CRlgtfiKdHxz0x0s2GEtifAD1j3JrZCSboF8MSWcCZt6D_qblpFobxjNcFSs',
    },
  ];

  const quickPrompts = [
    '¿Falla común o recurrente en este modelo?',
    '¿Cómo va mi reparación?',
    '¿Cuánto dura la garantía?',
    'Costos de revisión',
    'Autorizar presupuesto',
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1200);
  };

  const handleQuickPromptClick = (prompt: string) => {
    onSendMessage(prompt);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1100);
  };

  const handleEscalateHuman = () => {
    onShowToast('Conectando con el Agente de Turno de ElectroFix vía WhatsApp prioritario...', 'support_agent');
  };

  const handleContactTech = () => {
    onShowToast(`Enviando notificación al técnico de banco: ${activeTicket.assignedTech}`, 'chat');
  };

  const toggleMic = () => {
    setIsMicActive(!isMicActive);
    if (!isMicActive) {
      onShowToast('Micrófono activado. Escuchando dictado técnico...', 'mic');
      setTimeout(() => {
        setInputText('Favor de verificar si el repuesto incluye marco lateral original');
        setIsMicActive(false);
      }, 2000);
    }
  };

  const handleAttachEvidence = () => {
    onShowToast('Abriendo selector de cámara o microscopio USB...', 'add_a_photo');
  };

  return (
    <div className="w-full max-w-2xl mx-auto pt-16 pb-28 flex flex-col min-h-screen">
      {/* Status & Escalation Header */}
      <div className="px-4 pt-3 pb-2 bg-surface-container-low shadow-sm border-b border-outline-variant/20 sticky top-16 z-30">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined text-secondary text-[24px]">smart_toy</span>
              <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-sm font-bold text-on-surface truncate">ElectroBot AI</span>
                <span className="px-1.5 py-0.2 rounded-full bg-secondary/15 text-secondary font-mono text-[10px] uppercase tracking-wide font-bold">
                  En línea
                </span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-variant truncate">
                Soporte Técnico Especializado 24/7
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onOpenFaultSolverModal && (
              <button
                onClick={onOpenFaultSolverModal}
                className="h-9 px-3 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary flex items-center gap-1.5 shrink-0 transition-all shadow-sm active:scale-95 border border-secondary/30"
                title="Abrir Resolvedor de Fallas Comunes (IA + Historial de Reparaciones)"
              >
                <span className="material-symbols-outlined text-[18px]">psychology</span>
                <span className="font-mono text-xs font-bold">Fallas Comunes AI</span>
              </button>
            )}

            <button
              onClick={handleEscalateHuman}
              className="h-9 px-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-secondary flex items-center gap-1.5 shrink-0 transition-colors shadow-sm active:scale-95 border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[18px]">support_agent</span>
              <span className="font-mono text-xs font-bold">Humano</span>
            </button>
          </div>
        </div>

        {/* Active Ticket Context Bar */}
        <div className="mt-2 p-2.5 rounded-xl bg-surface-container flex items-center justify-between gap-2 shadow-sm border border-outline-variant/20">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-[18px]">smartphone</span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[11px] text-tertiary font-bold">#{activeTicket.id}</span>
                <span className="text-on-surface-variant font-mono text-[10px] truncate">• {activeTicket.deviceModel}</span>
              </div>
              <span className="text-xs text-on-surface truncate">
                Cambio de display & flex de carga
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowOrderSelector(!showOrderSelector)}
              className="p-1.5 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface shrink-0 hover:bg-surface-bright transition-colors"
              title="Cambiar orden"
            >
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
            </button>

            {/* Order Switcher Dropdown */}
            {showOrderSelector && (
              <div className="absolute right-0 mt-2 w-72 bg-surface-container-highest rounded-xl shadow-2xl border border-outline-variant/40 p-2 z-50 text-left">
                <div className="text-[10px] font-mono text-secondary uppercase font-bold px-2 py-1">
                  Seleccionar Orden de Trabajo
                </div>
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTicket(t);
                      setShowOrderSelector(false);
                      onShowToast(`Cambiado a orden #${t.id} (${t.deviceModel})`, 'check');
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col ${
                      t.id === activeTicket.id
                        ? 'bg-secondary/20 text-on-surface font-bold'
                        : 'hover:bg-surface-container text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="font-mono text-secondary">#{t.id}</span>
                    <span className="truncate">{t.deviceModel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Stream Messages */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {chatMessages.map((msg) => {
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} className="flex items-start justify-end gap-2 max-w-[92%] ml-auto animate-fade-in">
                <div className="flex flex-col items-end gap-1 min-w-0">
                  <div className="p-3.5 rounded-2xl rounded-tr-sm bg-primary text-on-primary shadow-md leading-relaxed text-xs sm:text-sm font-medium">
                    <p>{msg.text}</p>
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <span className="font-mono text-[10px] text-on-surface-variant">{msg.timestamp}</span>
                    <span className="material-symbols-outlined text-[14px] text-secondary">done_all</span>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-on-primary-container text-[16px]">person</span>
                </div>
              </div>
            );
          }

          // Bot message
          return (
            <div key={msg.id} className="flex items-start gap-2.5 max-w-[96%] animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0 shadow-sm border border-outline-variant/20">
                <span className="material-symbols-outlined text-secondary text-[16px]">smart_toy</span>
              </div>

              <div className="flex flex-col gap-2 min-w-0 w-full">
                {/* Standard text bubble */}
                {msg.text && (
                  <div className="p-3.5 rounded-2xl rounded-tl-sm bg-surface-container text-on-surface shadow-sm leading-relaxed text-xs sm:text-sm border border-outline-variant/20">
                    <p>{msg.text}</p>
                  </div>
                )}

                {/* Structured Diagnostic Sub-Card */}
                {msg.showTicketSubCard && (
                  <div className="p-3.5 rounded-2xl rounded-tl-sm bg-surface-container text-on-surface shadow-md flex flex-col gap-3 border border-outline-variant/25">
                    {/* Section 1: Estimated Delivery */}
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">timer</span>
                      <div className="flex flex-col text-xs sm:text-sm">
                        <span className="font-headline font-bold text-on-surface">Estado & Plazos</span>
                        <p className="text-on-surface-variant mt-0.5 leading-relaxed">
                          Tu equipo está en <strong className="text-secondary font-semibold">Diagnóstico & Laboratorio</strong>. Si autorizas el presupuesto hoy, el tiempo estimado es de <strong className="text-on-surface font-semibold">{activeTicket.estimatedHours}</strong> gracias a disponibilidad inmediata en almacén.
                        </p>
                      </div>
                    </div>

                    {/* Section 2: Warranty Scope */}
                    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-high/60 border border-outline-variant/20">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">verified_user</span>
                      <div className="flex flex-col text-xs sm:text-sm">
                        <span className="font-headline font-bold text-on-surface">Póliza de Garantía</span>
                        <p className="text-on-surface-variant mt-0.5 text-xs">
                          Tus refacciones nuevas cuentan con <strong className="text-on-surface font-semibold">{activeTicket.warrantyPeriod}</strong> contra defectos de fabricación o soldadura SMD.
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 text-error">
                          <span className="material-symbols-outlined text-[15px]">info</span>
                          <span className="font-mono text-[10px]">No cubre filtración de líquidos ni caídas posteriores.</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive Order Action Sub-Card */}
                    <div className="p-3 rounded-xl bg-surface-container-low shadow-inner border border-outline-variant/20 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-primary text-[18px]">build</span>
                          <span className="font-headline text-xs font-bold text-on-surface">Ticket #{activeTicket.id}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-tertiary-container/20 text-tertiary font-mono text-[10px] font-bold">
                          En Proceso
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-on-surface-variant text-xs">
                        <span>Técnico Asignado:</span>
                        <span className="font-semibold text-on-surface font-headline">{activeTicket.assignedTech}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={onOpenTicketDetail}
                          className="h-10 px-2 rounded-xl bg-surface-container-highest hover:bg-surface-bright text-on-surface text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-outline-variant/20 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                          <span>Ver Ticket</span>
                        </button>
                        <button
                          onClick={handleContactTech}
                          className="h-10 px-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                          <span>Contactar Mark</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <span className="font-mono text-[10px] text-on-surface-variant px-1">
                  {msg.timestamp} • ElectroBot
                </span>
              </div>
            </div>
          );
        })}

        {/* Suggested Prompt Pills */}
        <div className="flex flex-col gap-1.5 pl-9">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
            Consultas sugeridas
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleQuickPromptClick(prompt)}
                className="px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface-variant hover:text-on-surface text-xs font-medium transition-all shadow-sm active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Evidence Preview Carousel (Intake Microscope) */}
        <div className="pl-9 space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-secondary uppercase tracking-wider font-bold">
              Evidencia en microscopio (Intake)
            </span>
            <span className="font-mono text-[10px] text-on-surface-variant">2 fotos</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {microscopePhotos.map((item) => (
              <div
                key={item.id}
                onClick={() => onOpenMicroscopeModal(item.url, item.title, item.subtitle)}
                className="relative rounded-xl overflow-hidden shadow-md group cursor-pointer border border-outline-variant/30 aspect-video bg-black"
              >
                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-[9px] text-on-surface font-bold truncate">
                      {item.title}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-[14px]">zoom_in</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-1.5 px-1">
            <span className="material-symbols-outlined text-tertiary text-[18px]">help_center</span>
            <span className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
              Preguntas Frecuentes del Taller
            </span>
          </div>

          {/* FAQ 1 */}
          <div className="rounded-xl bg-surface-container border border-outline-variant/20 overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === 1 ? null : 1)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span>¿Cómo funciona el cobro de diagnóstico ($350 MXN)?</span>
              <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${openFaq === 1 ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {openFaq === 1 && (
              <div className="px-3.5 pb-3.5 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/15 pt-2">
                El costo de $350 cubre desarme en cuarto limpio y pruebas con multímetro/osciloscopio. Si decides autorizar la reparación sugerida, <strong className="text-secondary font-semibold">los $350 se descuentan al 100%</strong> del costo total de tu factura final.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div className="rounded-xl bg-surface-container border border-outline-variant/20 overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === 2 ? null : 2)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span>Política de resguardo y abandono</span>
              <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${openFaq === 2 ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {openFaq === 2 && (
              <div className="px-3.5 pb-3.5 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/15 pt-2">
                Los equipos se resguardan sin cargo durante 30 días tras ser notificado el diagnóstico. Pasados los 60 días sin respuesta ni retiro, el equipo ingresa al protocolo de almacenaje y reciclaje de partes según NOM de servicio técnico.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div className="rounded-xl bg-surface-container border border-outline-variant/20 overflow-hidden">
            <button
              onClick={() => setOpenFaq(openFaq === 3 ? null : 3)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span>Métodos de pago en mostrador o remotos</span>
              <span className={`material-symbols-outlined text-[18px] text-on-surface-variant transition-transform ${openFaq === 3 ? 'rotate-180' : ''}`}>
                expand_more
              </span>
            </button>
            {openFaq === 3 && (
              <div className="px-3.5 pb-3.5 text-xs text-on-surface-variant leading-relaxed border-t border-outline-variant/15 pt-2 space-y-2">
                <p>Aceptamos:</p>
                <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Efectivo en caja</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Tarjetas POS (Visa/Mastercard)</span>
                  <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface">Transferencia SPEI</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 pl-9 animate-fade-in">
            <div className="p-2.5 rounded-xl rounded-tl-sm bg-surface-container flex items-center gap-1.5 border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce"></span>
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 rounded-full bg-secondary animate-bounce [animation-delay:0.4s]"></span>
              <span className="font-mono text-[10px] text-on-surface-variant ml-1">
                ElectroBot formulando respuesta técnica...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Message Input Dock */}
      <div className="sticky bottom-18 inset-x-0 bg-surface-container-low/95 backdrop-blur-md p-3 border-t border-outline-variant/20 shadow-2xl flex flex-col gap-2 z-40">
        <div className="flex items-center justify-between px-1 text-[11px] font-mono">
          <button
            onClick={handleAttachEvidence}
            className="flex items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
            <span>Adjuntar foto de falla</span>
          </button>
          <span className="text-on-surface-variant text-[10px]">Cifrado ElectroFix Lab</span>
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          {/* File attach */}
          <button
            type="button"
            onClick={handleAttachEvidence}
            className="w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0 border border-outline-variant/20"
            title="Subir archivo o foto"
          >
            <span className="material-symbols-outlined text-[20px]">attach_file</span>
          </button>

          {/* Text Input Container */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escribe tu duda o consulta sobre tu equipo..."
              className="w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-container text-on-surface placeholder:text-on-surface-variant text-xs sm:text-sm border border-outline-variant/20 focus:border-secondary outline-none transition-colors"
            />
            <button
              type="button"
              onClick={toggleMic}
              className={`absolute right-2.5 top-2.5 flex items-center justify-center transition-colors ${
                isMicActive ? 'text-secondary animate-pulse' : 'text-on-surface-variant hover:text-on-surface'
              }`}
              title="Dictar por voz"
            >
              <span className="material-symbols-outlined text-[20px]">mic</span>
            </button>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            className="w-11 h-11 rounded-xl bg-primary hover:bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
            title="Enviar mensaje"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
