import React, { useState } from 'react';
import { Ticket } from '../../types';

interface EntregasScreenProps {
  tickets: Ticket[];
  onShowToast: (msg: string, icon?: string) => void;
  onOpenLabelModal: () => void;
}

export const EntregasScreen: React.FC<EntregasScreenProps> = ({
  tickets,
  onShowToast,
  onOpenLabelModal,
}) => {
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || 'EF-2024-892');
  const [qcList, setQcList] = useState({
    display: true,
    cameras: true,
    wifi: true,
    charge: true,
    seal: true,
  });
  const [isHandedOver, setIsHandedOver] = useState(false);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleCompleteHandover = () => {
    setIsHandedOver(true);
    onShowToast(`Equipo #${activeTicket.id} entregado y póliza de garantía de 90 días activada`, 'verified');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-28 space-y-4">
      {/* Top Header */}
      <div className="bg-surface-container rounded-2xl p-4 shadow-md border border-outline-variant/20 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-secondary font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            CONTROL DE CALIDAD & ENTREGA
          </span>
          <span className="text-on-surface-variant">Sede Principal</span>
        </div>
        <h2 className="font-headline text-2xl font-bold text-on-surface tracking-tight">
          Entregas & Finalizadas
        </h2>
        <p className="font-mono text-xs text-on-surface-variant">
          Pase de inspección QC, sellado de garantía y recepción por el cliente
        </p>
      </div>

      {/* Ticket selector chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tickets.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTicketId(t.id);
              setIsHandedOver(false);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-mono shrink-0 transition-all border ${
              t.id === selectedTicketId
                ? 'bg-secondary text-on-secondary-fixed border-secondary font-bold shadow-md'
                : 'bg-surface-container text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
            }`}
          >
            <span>#{t.id}</span>
            <span className="ml-1 opacity-80">({t.category})</span>
          </button>
        ))}
      </div>

      {/* Active Ticket Card */}
      <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant/20 shadow-md space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-mono text-[10px] text-secondary uppercase font-bold">
              Expediente #{activeTicket.id}
            </span>
            <h3 className="font-headline text-lg font-bold text-on-surface">
              {activeTicket.deviceModel}
            </h3>
            <p className="text-xs text-on-surface-variant font-mono">
              Cliente: {activeTicket.clientName} • {activeTicket.phone}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-secondary/15 text-secondary font-mono text-xs font-bold">
            Listo para Entrega
          </span>
        </div>

        {/* Quality Control Checklist */}
        <div className="space-y-2 pt-2 border-t border-outline-variant/15 text-xs">
          <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider block font-bold">
            Lista de Verificación de Laboratorio (QC Pass)
          </span>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">touch_app</span>
              <span>Display táctil sin ghosting ni puntos muertos</span>
            </div>
            <input
              type="checkbox"
              checked={qcList.display}
              onChange={(e) => setQcList({ ...qcList, display: e.target.checked })}
              className="w-4 h-4 rounded accent-secondary"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">photo_camera</span>
              <span>Cámaras frontal y trasera con enfoque infinito</span>
            </div>
            <input
              type="checkbox"
              checked={qcList.cameras}
              onChange={(e) => setQcList({ ...qcList, cameras: e.target.checked })}
              className="w-4 h-4 rounded accent-secondary"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">wifi</span>
              <span>Conectividad Wi-Fi, Bluetooth y módem celular</span>
            </div>
            <input
              type="checkbox"
              checked={qcList.wifi}
              onChange={(e) => setQcList({ ...qcList, wifi: e.target.checked })}
              className="w-4 h-4 rounded accent-secondary"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">battery_charging_full</span>
              <span>Carga rápida 45W verificada en tester USB (9V/5A)</span>
            </div>
            <input
              type="checkbox"
              checked={qcList.charge}
              onChange={(e) => setQcList({ ...qcList, charge: e.target.checked })}
              className="w-4 h-4 rounded accent-secondary"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px]">cleaning_services</span>
              <span>Limpieza ultrasónica, pasta térmica y sello anti-polvo</span>
            </div>
            <input
              type="checkbox"
              checked={qcList.seal}
              onChange={(e) => setQcList({ ...qcList, seal: e.target.checked })}
              className="w-4 h-4 rounded accent-secondary"
            />
          </label>
        </div>

        {/* Certificate Seal & Guarantee Badge */}
        <div className="p-3 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[28px]">verified</span>
          </div>
          <div className="text-xs">
            <h4 className="font-headline font-bold text-on-surface">Póliza de Garantía Electrónica</h4>
            <p className="text-on-surface-variant font-mono text-[11px]">
              Vigencia de 90 a 180 días naturales. Sellado por técnico responsable {activeTicket.assignedTech}.
            </p>
          </div>
        </div>

        {/* Handover action */}
        {isHandedOver ? (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            <span>EQUIPO ENTREGADO AL CLIENTE • TICKET CERRADO</span>
          </div>
        ) : (
          <div className="space-y-2 pt-2">
            <button
              onClick={handleCompleteHandover}
              className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-headline text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              <span>Firmar Entrega & Liberar Equipo</span>
            </button>
            <button
              onClick={onOpenLabelModal}
              className="w-full h-11 rounded-xl bg-surface-container-high hover:bg-surface-bright text-secondary font-headline text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Reimprimir Comprobante Térmico</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
