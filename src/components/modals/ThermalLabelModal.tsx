import React, { useState } from 'react';
import { Ticket } from '../../types';

interface ThermalLabelModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onPrintSuccess: () => void;
}

export const ThermalLabelModal: React.FC<ThermalLabelModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onPrintSuccess,
}) => {
  const [labelSize, setLabelSize] = useState<'58mm' | '80mm'>('58mm');
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      setIsPrinting(false);
      onPrintSuccess();
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container rounded-2xl border border-outline-variant/30 max-w-md w-full overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-[22px]">print</span>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">
                Etiqueta Adhesiva Térmica
              </h3>
              <p className="font-mono text-[10px] text-secondary">
                Bandeja Antiestática • #{ticket.id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Dimension Switcher */}
        <div className="px-4 pt-3 flex items-center justify-between">
          <span className="font-mono text-xs text-on-surface-variant uppercase">
            Formato de Impresión:
          </span>
          <div className="flex bg-surface-container-low p-1 rounded-lg gap-1 border border-outline-variant/20">
            <button
              onClick={() => setLabelSize('58mm')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                labelSize === '58mm'
                  ? 'bg-secondary text-on-secondary-fixed shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              58mm Bandeja
            </button>
            <button
              onClick={() => setLabelSize('80mm')}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                labelSize === '80mm'
                  ? 'bg-secondary text-on-secondary-fixed shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              80mm Completo
            </button>
          </div>
        </div>

        {/* Realistic Thermal Label Preview Paper Canvas */}
        <div className="p-4 overflow-y-auto flex justify-center bg-[#070b14]">
          <div
            className={`bg-[#fdfdfd] text-[#111111] font-mono shadow-2xl p-4 transition-all duration-300 border-2 border-dashed border-gray-400 ${
              labelSize === '58mm' ? 'w-64 text-[10px]' : 'w-80 text-xs'
            }`}
            style={{ minHeight: '340px' }}
          >
            {/* Header / Store */}
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <div className="font-extrabold text-sm tracking-wider uppercase font-sans">
                ELECTRONICS DEL SURESTE
              </div>
              <div className="text-[9px] uppercase tracking-wider text-gray-700">
                LABORATORIO & SERVICIO TÉCNICO
              </div>
              <div className="text-[8px] font-bold mt-0.5">
                FOLIO OFICIAL: #{ticket.id}
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="flex flex-col items-center justify-center my-2 py-1 bg-white">
              <div className="h-10 w-full flex items-center justify-center tracking-widest text-lg font-bold select-none overflow-hidden font-mono">
                |||||| | |||||||| || |||||| | |||||||
              </div>
              <span className="text-[9px] font-bold tracking-widest">{ticket.imeiSerial}</span>
            </div>

            {/* Device Info Matrix */}
            <div className="space-y-1 border-t border-b border-black py-2 my-1">
              <div className="flex justify-between">
                <span className="font-bold">EQUIPO:</span>
                <span className="truncate max-w-[140px] text-right font-extrabold">{ticket.deviceModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">MODELO:</span>
                <span>{ticket.modelCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">CLIENTE:</span>
                <span className="truncate font-semibold">{ticket.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">PIN ACCESO:</span>
                <span className="font-extrabold">{ticket.isFormattedOrNoPin ? 'SIN CLAVE' : ticket.accessPin}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">FECHA INGRESO:</span>
                <span>2024-10-14 11:42</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">TÉCNICO:</span>
                <span className="truncate font-bold">M. Vance [B-A04]</span>
              </div>
            </div>

            {/* QR Code & Scan Hash */}
            <div className="flex items-center gap-3 pt-2">
              {/* Dynamic SVG QR representation */}
              <div className="w-16 h-16 bg-black p-1 shrink-0 flex items-center justify-center rounded">
                <div className="grid grid-cols-4 gap-0.5 w-full h-full bg-white p-0.5">
                  <div className="bg-black col-span-2 row-span-2"></div>
                  <div className="bg-black"></div>
                  <div className="bg-transparent"></div>
                  <div className="bg-transparent"></div>
                  <div className="bg-black"></div>
                  <div className="bg-black col-span-2 row-span-2"></div>
                  <div className="bg-black"></div>
                  <div className="bg-black"></div>
                </div>
              </div>
              <div className="text-[8px] leading-tight flex-1">
                <p className="font-bold uppercase">ESCANEÉ PARA SEGUIMIENTO:</p>
                <p className="text-gray-800">eds.tech/track/{ticket.id}</p>
                <p className="mt-1 text-[7px] text-gray-600">
                  Válido para entrega, estatus y garantía.
                </p>
              </div>
            </div>

            {/* Footer warning */}
            <div className="mt-3 pt-1 border-t border-dashed border-gray-500 text-center text-[7px] text-gray-700 font-sans">
              * PEGATINA ANTIESTÁTICA MANDATORIA PARA BANDEJA DE DESENSAMBLE *
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-mono">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>Impresora EDS-LABEL-58 En Línea</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-xs font-semibold"
            >
              Cerrar
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPrinting ? 'hourglass_top' : 'print'}
              </span>
              <span>{isPrinting ? 'Imprimiendo...' : 'Enviar a Térmica'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
