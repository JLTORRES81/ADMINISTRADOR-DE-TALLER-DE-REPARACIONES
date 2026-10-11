import React, { useState } from 'react';
import { PriceCategoryItem, InvoiceRecord, InvoiceItem } from '../../types';

interface FacturacionScreenProps {
  priceCategories: PriceCategoryItem[];
  invoices: InvoiceRecord[];
  onUpdateCategory: (cat: PriceCategoryItem) => void;
  onAddCategory: (cat: PriceCategoryItem) => void;
  onAddInvoice: (inv: InvoiceRecord) => void;
  onShowToast: (msg: string, icon?: string) => void;
}

export const FacturacionScreen: React.FC<FacturacionScreenProps> = ({
  priceCategories,
  invoices,
  onUpdateCategory,
  onAddCategory,
  onAddInvoice,
  onShowToast,
}) => {
  const [activeSegment, setActiveSegment] = useState<'tarifario' | 'emision' | 'historial'>('tarifario');
  const [docType, setDocType] = useState<'nota' | 'cfdi'>('nota');
  const [paymentType, setPaymentType] = useState<'efectivo' | 'pos' | 'spei'>('efectivo');

  // Emission form lines
  const [line1, setLine1] = useState<InvoiceItem>({
    id: 'l1',
    name: 'Revisión TV (60" - 80") Chasis Grande',
    price: 900,
    type: 'review',
  });
  const [line2, setLine2] = useState<InvoiceItem>({
    id: 'l2',
    name: 'Reparación tarjeta T-CON y Banco de Leds',
    price: 2400,
    type: 'labor',
  });
  const [line3, setLine3] = useState<InvoiceItem>({
    id: 'l3',
    name: 'Kit 12 Tiras LED 6V Originales LG',
    price: 650,
    type: 'parts',
  });
  const [anticipo, setAnticipo] = useState<number>(700);

  // CFDI 4.0 Fields
  const [rfc, setRfc] = useState('MEAC890412H81');
  const [cp, setCp] = useState('97000');
  const [razonSocial, setRazonSocial] = useState('CARLOS ALBERTO MENDEZ ACOSTA');
  const [regimen, setRegimen] = useState('612 - Personas Físicas con Actividades');
  const [usoCfdi, setUsoCfdi] = useState('G03 - Gastos en general');
  const [selectedTicketSearch, setSelectedTicketSearch] = useState('#EF-2024-892 • Carlos Mendez (TV 65")');

  // Add category modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatTitle, setNewCatTitle] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatGroup, setNewCatGroup] = useState<'tv' | 'audio_optica' | 'computo_movil' | 'otros'>('otros');
  const [newCatRev, setNewCatRev] = useState(400);
  const [newCatLabor, setNewCatLabor] = useState(900);

  // Calculations
  const subtotal = line1.price + line2.price + line3.price;
  const iva = docType === 'cfdi' ? subtotal * 0.16 : 0;
  const totalNeto = Math.max(0, subtotal + iva - anticipo);

  const handleSaveGlobal = () => {
    onShowToast('¡Tarifario oficial 2024 y configuraciones fiscales sincronizadas en la nube!', 'cloud_done');
  };

  const handleFixRow = (cat: PriceCategoryItem) => {
    onUpdateCategory(cat);
    onShowToast(`Tarifa fijada: Rev. $${cat.reviewCost} | Rep. $${cat.laborCost} MXN`, 'check_circle');
  };

  const handleQuickPreload = (catId: string) => {
    const found = priceCategories.find((c) => c.id === catId);
    if (!found) return;

    setLine1({
      id: 'l1',
      name: `Revisión ${found.title}`,
      price: found.reviewCost,
      type: 'review',
    });
    setLine2({
      id: 'l2',
      name: `Mano de obra ${found.title}`,
      price: found.laborCost,
      type: 'labor',
    });
    onShowToast(`Tarifas de "${found.title}" cargadas a la nota`, 'sync_alt');
  };

  const handleIssueDocument = () => {
    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      folio: docType === 'cfdi' ? `#F-${1050 + invoices.length}` : `#N-${2832 + invoices.length}`,
      type: docType,
      clientName: razonSocial,
      rfc: docType === 'cfdi' ? rfc : undefined,
      date: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      amount: totalNeto,
      deviceSummary: line1.name,
      status: docType === 'cfdi' ? 'Timbrado SAT' : paymentType === 'efectivo' ? 'Liquidado Efectivo' : paymentType === 'pos' ? 'Liquidado POS' : 'Liquidado SPEI',
      items: [line1, line2, line3],
    };

    onAddInvoice(newInvoice);

    if (docType === 'cfdi') {
      onShowToast(`CFDI 4.0 timbrado con PAC SAT exitosamente. Folio ${newInvoice.folio}`, 'verified_user');
    } else {
      onShowToast(`Nota mostrador ${newInvoice.folio} enviada a impresora térmica 80mm`, 'print');
    }
    setActiveSegment('historial');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatTitle.trim()) return;

    const newCat: PriceCategoryItem = {
      id: `cat-${Date.now()}`,
      title: newCatTitle.trim(),
      description: newCatDesc.trim() || 'Categoría personalizada de banco',
      group: newCatGroup,
      badge: 'Nuevo',
      reviewCost: newCatRev,
      laborCost: newCatLabor,
      isDeductible: true,
      requiresTwoTechs: false,
      footerNote: 'Deducible en reparación',
    };

    onAddCategory(newCat);
    setShowAddCatModal(false);
    setNewCatTitle('');
    setNewCatDesc('');
    onShowToast(`Nueva categoría "${newCat.title}" agregada al catálogo`, 'check_circle');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-20 pb-28 space-y-4">
      {/* Header Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-mono text-[10px] text-secondary uppercase tracking-widest font-bold">
              Catálogo Oficial & SAT CFDI 4.0
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-tertiary border border-outline-variant/20">
            <span className="material-symbols-outlined text-[14px]">edit_note</span>
            <span className="font-mono text-[10px] uppercase font-bold">Modo Edición</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
              Facturación & Tarifas
            </h1>
            <p className="font-mono text-xs text-on-surface-variant">
              Electronics del Sureste • Tabulador Taller 2024
            </p>
          </div>
          <button
            onClick={handleSaveGlobal}
            className="h-11 px-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-lg shadow-primary/20 shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_done</span>
            <span>Guardar</span>
          </button>
        </div>

        {/* Segmented Navigation Bar */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-surface-container-low border border-outline-variant/20 gap-1 text-xs">
          <button
            onClick={() => setActiveSegment('tarifario')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-headline font-bold transition-all ${
              activeSegment === 'tarifario'
                ? 'bg-surface-container-high text-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>Tarifario</span>
          </button>
          <button
            onClick={() => setActiveSegment('emision')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-headline font-bold transition-all ${
              activeSegment === 'emision'
                ? 'bg-surface-container-high text-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt</span>
            <span>Emisión</span>
          </button>
          <button
            onClick={() => setActiveSegment('historial')}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-headline font-bold transition-all ${
              activeSegment === 'historial'
                ? 'bg-surface-container-high text-secondary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Historial</span>
          </button>
        </div>
      </section>

      {/* SEGMENT 1: TARIFARIO */}
      {activeSegment === 'tarifario' && (
        <div className="space-y-4">
          {/* Mini KPI Strip */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">Equipos en Lista</span>
              <span className="font-headline text-lg text-secondary font-bold mt-1">
                {priceCategories.length} Cat.
              </span>
              <span className="font-mono text-[9px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                <span className="material-symbols-outlined text-[12px] text-secondary">verified</span> Mostrador
              </span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">Rev. Promedio</span>
              <span className="font-headline text-lg text-tertiary font-bold mt-1">$557</span>
              <span className="font-mono text-[9px] text-on-surface-variant">MXN x Unidad</span>
            </div>
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col">
              <span className="font-mono text-[10px] text-on-surface-variant uppercase">Estatus Base</span>
              <span className="font-headline text-lg text-primary font-bold mt-1">Vigente</span>
              <span className="font-mono text-[9px] text-on-surface-variant">Q4 - 2024</span>
            </div>
          </div>

          {/* Group 1: Televisores & Pantallas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">tv</span>
                <h2 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                  Televisores & Pantallas
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                {priceCategories.filter((c) => c.group === 'tv').length} RANGOS
              </span>
            </div>

            {priceCategories
              .filter((c) => c.group === 'tv')
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2.5 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline text-sm font-semibold text-on-surface">{item.title}</h3>
                      <p className="font-mono text-[11px] text-on-surface-variant">{item.description}</p>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded bg-secondary/15 text-secondary font-mono text-[10px] font-bold uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">REVISIÓN & DIAGNÓSTICO</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-tertiary font-bold">$</span>
                        <input
                          type="number"
                          value={item.reviewCost}
                          onChange={(e) =>
                            onUpdateCategory({ ...item, reviewCost: Number(e.target.value) })
                          }
                          className="w-full bg-transparent font-headline text-base text-on-surface font-bold outline-none focus:text-secondary"
                        />
                        <span className="font-mono text-[10px] text-on-surface-variant">MXN</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">MANO DE OBRA BASE</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-primary font-bold">$</span>
                        <input
                          type="number"
                          value={item.laborCost}
                          onChange={(e) =>
                            onUpdateCategory({ ...item, laborCost: Number(e.target.value) })
                          }
                          className="w-full bg-transparent font-headline text-base text-on-surface font-bold outline-none focus:text-primary"
                        />
                        <span className="font-mono text-[10px] text-on-surface-variant">MXN</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-on-surface-variant text-[11px]">
                      <input
                        type="checkbox"
                        checked={item.isDeductible}
                        onChange={(e) =>
                          onUpdateCategory({ ...item, isDeductible: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-secondary"
                      />
                      <span>{item.footerNote}</span>
                    </label>
                    <button
                      onClick={() => handleFixRow(item)}
                      className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-secondary font-mono text-xs flex items-center gap-1 transition-colors border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">done</span>
                      <span>Fijar</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Group 2: Óptica & Sonido */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">videocam</span>
                <h2 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                  Óptica & Sonido
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                {priceCategories.filter((c) => c.group === 'audio_optica').length} EQUIPOS
              </span>
            </div>

            {priceCategories
              .filter((c) => c.group === 'audio_optica')
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2.5 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline text-sm font-semibold text-on-surface">{item.title}</h3>
                      <p className="font-mono text-[11px] text-on-surface-variant">{item.description}</p>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded bg-tertiary/15 text-tertiary font-mono text-[10px] font-bold uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">REVISIÓN & DIAGNÓSTICO</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-tertiary font-bold">$</span>
                        <input
                          type="number"
                          value={item.reviewCost}
                          onChange={(e) =>
                            onUpdateCategory({ ...item, reviewCost: Number(e.target.value) })
                          }
                          className="w-full bg-transparent font-headline text-base text-on-surface font-bold outline-none focus:text-secondary"
                        />
                        <span className="font-mono text-[10px] text-on-surface-variant">MXN</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">MANO DE OBRA BASE</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-primary font-bold">$</span>
                        <input
                          type="number"
                          value={item.laborCost}
                          onChange={(e) =>
                            onUpdateCategory({ ...item, laborCost: Number(e.target.value) })
                          }
                          className="w-full bg-transparent font-headline text-base text-on-surface font-bold outline-none focus:text-primary"
                        />
                        <span className="font-mono text-[10px] text-on-surface-variant">MXN</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-mono text-[11px] text-on-surface-variant">{item.footerNote}</span>
                    <button
                      onClick={() => handleFixRow(item)}
                      className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-secondary font-mono text-xs flex items-center gap-1 transition-colors border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">done</span>
                      <span>Fijar</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Group 3: Cómputo & Móviles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">devices</span>
                <h2 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                  Cómputo & Móviles
                </h2>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                {priceCategories.filter((c) => c.group === 'computo_movil').length} EQUIPOS
              </span>
            </div>

            {priceCategories
              .filter((c) => c.group === 'computo_movil')
              .map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-2.5 relative overflow-hidden shadow-sm"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-headline text-sm font-semibold text-on-surface">{item.title}</h3>
                      <p className="font-mono text-[11px] text-on-surface-variant">{item.description}</p>
                    </div>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded bg-primary/20 text-primary font-mono text-[10px] font-bold uppercase">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">REVISIÓN & DIAGNÓSTICO</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-tertiary font-bold">$</span>
                        <input
                          type="number"
                          value={item.reviewCost}
                          onChange={(e) =>
                            onUpdateCategory({ ...item, reviewCost: Number(e.target.value) })
                          }
                          className="w-full bg-transparent font-headline text-base text-on-surface font-bold outline-none focus:text-secondary"
                        />
                        <span className="font-mono text-[10px] text-on-surface-variant">MXN</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                      <span className="font-mono text-[9px] text-on-surface-variant uppercase">MANO DE OBRA BASE</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-primary font-bold">$</span>
                        <input
                          type="number"
                          value={item.laborCost}
                          onChange={(e) =>
                            onUpdateCategory({ ...item, laborCost: Number(e.target.value) })
                          }
                          className="w-full bg-transparent font-headline text-base text-on-surface font-bold outline-none focus:text-primary"
                        />
                        <span className="font-mono text-[10px] text-on-surface-variant">MXN</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="font-mono text-[11px] text-on-surface-variant">{item.footerNote}</span>
                    <button
                      onClick={() => handleFixRow(item)}
                      className="h-8 px-2.5 rounded-lg bg-surface-container-high hover:bg-surface-bright text-secondary font-mono text-xs flex items-center gap-1 transition-colors border border-outline-variant/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">done</span>
                      <span>Fijar</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>

          {/* Add New Category CTA */}
          <button
            onClick={() => setShowAddCatModal(true)}
            className="w-full h-12 rounded-xl bg-surface-container hover:bg-surface-container-high border border-dashed border-secondary/40 text-secondary font-headline text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Agregar Nueva Categoría de Taller</span>
          </button>
        </div>
      )}

      {/* SEGMENT 2: EMISIÓN DE COMPROBANTE & FACTURACIÓN */}
      {activeSegment === 'emision' && (
        <div className="space-y-4">
          {/* Doc Type Selector */}
          <div className="p-1 rounded-xl bg-surface-container-low border border-outline-variant/20 grid grid-cols-2 gap-1 text-xs">
            <button
              onClick={() => setDocType('nota')}
              className={`py-2.5 px-3 rounded-lg font-headline font-bold flex items-center justify-center gap-2 transition-all ${
                docType === 'nota'
                  ? 'bg-surface-container text-on-surface shadow-sm border border-outline-variant/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-tertiary">receipt_long</span>
              <span>Nota / Ticket Mostrador</span>
            </button>
            <button
              onClick={() => setDocType('cfdi')}
              className={`py-2.5 px-3 rounded-lg font-headline font-bold flex items-center justify-center gap-2 transition-all ${
                docType === 'cfdi'
                  ? 'bg-surface-container text-on-surface shadow-sm border border-outline-variant/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
              <span>Factura CFDI 4.0</span>
            </button>
          </div>

          {/* Ticket Selection & Fast Preload */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-secondary uppercase font-bold">
                1. Selección de Orden Taller
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                Auto-Carga
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] text-on-surface-variant">
                Buscar Folio o Cliente Registrado
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 h-11 px-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 text-xs">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    value={selectedTicketSearch}
                    onChange={(e) => setSelectedTicketSearch(e.target.value)}
                    className="w-full bg-transparent text-on-surface font-medium outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onShowToast('Escaneando código QR de orden...', 'qr_code_scanner')}
                  className="w-11 h-11 rounded-xl bg-surface-container-high border border-outline-variant/20 text-on-surface flex items-center justify-center shrink-0 hover:bg-surface-bright"
                >
                  <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                </button>
              </div>
            </div>

            {/* Quick Category Fast-Injector */}
            <div className="space-y-1 pt-1">
              <label className="font-mono text-[10px] text-on-surface-variant">
                Importar Tarifa Directa del Catálogo
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  defaultValue="tv-2"
                  onChange={(e) => handleQuickPreload(e.target.value)}
                  className="h-11 px-3 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant/20 outline-none"
                >
                  {priceCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleQuickPreload('tv-2')}
                  className="h-11 rounded-xl bg-surface-container-high hover:bg-surface-bright text-secondary font-headline font-bold flex items-center justify-center gap-1 border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[18px]">sync_alt</span>
                  <span>Cargar Costos</span>
                </button>
              </div>
            </div>
          </div>

          {/* Fiscal SAT Block (Only visible on CFDI 4.0) */}
          {docType === 'cfdi' && (
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-secondary uppercase font-bold">
                  2. Datos Fiscales Receptores (SAT)
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">
                  VERSIÓN 4.0
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-on-surface-variant">RFC RECEPTOR</span>
                  <input
                    type="text"
                    value={rfc}
                    onChange={(e) => setRfc(e.target.value.toUpperCase())}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest font-mono text-on-surface uppercase font-bold border border-outline-variant/20 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-on-surface-variant">CÓDIGO POSTAL</span>
                  <input
                    type="text"
                    value={cp}
                    onChange={(e) => setCp(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest font-mono text-on-surface font-bold border border-outline-variant/20 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-mono text-[10px] text-on-surface-variant">RAZÓN SOCIAL / NOMBRE COMPLETO</span>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-lowest text-on-surface uppercase border border-outline-variant/20 outline-none font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-on-surface-variant">RÉGIMEN FISCAL</span>
                  <select
                    value={regimen}
                    onChange={(e) => setRegimen(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl bg-surface-container-lowest text-on-surface font-mono text-[10px] border border-outline-variant/20 outline-none"
                  >
                    <option>612 - Personas Físicas con Actividades</option>
                    <option>601 - General de Ley Personas Morales</option>
                    <option>626 - Régimen Simplificado (RESICO)</option>
                    <option>605 - Sueldos y Salarios</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="font-mono text-[10px] text-on-surface-variant">USO CFDI</span>
                  <select
                    value={usoCfdi}
                    onChange={(e) => setUsoCfdi(e.target.value)}
                    className="w-full h-10 px-2 rounded-xl bg-surface-container-lowest text-on-surface font-mono text-[10px] border border-outline-variant/20 outline-none"
                  >
                    <option>G03 - Gastos en general</option>
                    <option>I08 - Otra maquinaria y equipo</option>
                    <option>P01 - Por definir</option>
                    <option>S01 - Sin efectos fiscales</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Breakdown & Cost Calculation */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-secondary uppercase font-bold">
                Conceptos & Desglose Financiero
              </span>
              <button
                onClick={() => onShowToast('Añadido nuevo concepto de refacción a la lista', 'add')}
                className="font-mono text-[11px] text-secondary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">add</span>
                <span>Refacción</span>
              </button>
            </div>

            {/* Line 1: Revisión */}
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[9px] text-tertiary block font-bold uppercase truncate">
                  CARGO POR REVISIÓN
                </span>
                <input
                  type="text"
                  value={line1.name}
                  onChange={(e) => setLine1({ ...line1, name: e.target.value })}
                  className="w-full bg-transparent text-on-surface outline-none truncate font-medium"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono">
                <span className="text-on-surface-variant">$</span>
                <input
                  type="number"
                  value={line1.price}
                  onChange={(e) => setLine1({ ...line1, price: Number(e.target.value) })}
                  className="w-16 bg-transparent text-right font-headline text-base text-on-surface font-bold outline-none"
                />
              </div>
            </div>

            {/* Line 2: Mano de Obra */}
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[9px] text-primary block font-bold uppercase truncate">
                  MANO DE OBRA / REPARACIÓN
                </span>
                <input
                  type="text"
                  value={line2.name}
                  onChange={(e) => setLine2({ ...line2, name: e.target.value })}
                  className="w-full bg-transparent text-on-surface outline-none truncate font-medium"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono">
                <span className="text-on-surface-variant">$</span>
                <input
                  type="number"
                  value={line2.price}
                  onChange={(e) => setLine2({ ...line2, price: Number(e.target.value) })}
                  className="w-16 bg-transparent text-right font-headline text-base text-on-surface font-bold outline-none"
                />
              </div>
            </div>

            {/* Line 3: Refacciones */}
            <div className="p-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/15 flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-mono text-[9px] text-on-surface-variant block font-bold uppercase truncate">
                  REFACCIONES & COMPONENTES
                </span>
                <input
                  type="text"
                  value={line3.name}
                  onChange={(e) => setLine3({ ...line3, name: e.target.value })}
                  className="w-full bg-transparent text-on-surface outline-none truncate font-medium"
                />
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono">
                <span className="text-on-surface-variant">$</span>
                <input
                  type="number"
                  value={line3.price}
                  onChange={(e) => setLine3({ ...line3, price: Number(e.target.value) })}
                  className="w-16 bg-transparent text-right font-headline text-base text-on-surface font-bold outline-none"
                />
              </div>
            </div>

            {/* Financial Calculations Table */}
            <div className="pt-2 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-on-surface-variant">
                <span>Subtotal Trabajos + Piezas:</span>
                <span className="text-on-surface font-bold">
                  ${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>

              {docType === 'cfdi' && (
                <div className="flex justify-between text-on-surface-variant animate-fade-in">
                  <span>IVA Fiscal Trasladado (16%):</span>
                  <span className="text-secondary font-bold">
                    ${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>
              )}

              <div className="flex justify-between text-tertiary">
                <span>Menos Anticipo recibido en Recepción:</span>
                <div className="flex items-center gap-1">
                  <span>-$</span>
                  <input
                    type="number"
                    value={anticipo}
                    onChange={(e) => setAnticipo(Number(e.target.value))}
                    className="w-16 bg-transparent text-right text-tertiary font-bold outline-none"
                  />
                </div>
              </div>

              <div className="h-px bg-surface-container-high my-2"></div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="font-headline text-sm font-bold text-on-surface block">
                    Total Neto por Liquidar
                  </span>
                  <span className="font-mono text-[10px] text-secondary font-bold uppercase">
                    Liquidación: {paymentType.toUpperCase()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-headline text-2xl font-extrabold text-secondary tracking-tight">
                    ${totalNeto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-variant block">MXN Netos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/20 space-y-2.5">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase font-bold block">
              Método de Liquidación
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentType('efectivo')}
                className={`py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                  paymentType === 'efectivo'
                    ? 'bg-surface-container-high text-secondary border-secondary shadow'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">local_atm</span>
                <span className="font-mono text-[11px] font-bold">Efectivo</span>
              </button>
              <button
                onClick={() => setPaymentType('pos')}
                className={`py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                  paymentType === 'pos'
                    ? 'bg-surface-container-high text-secondary border-secondary shadow'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">credit_card</span>
                <span className="font-mono text-[11px] font-bold">Tarjeta POS</span>
              </button>
              <button
                onClick={() => setPaymentType('spei')}
                className={`py-2.5 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                  paymentType === 'spei'
                    ? 'bg-surface-container-high text-secondary border-secondary shadow'
                    : 'bg-surface-container-lowest text-on-surface-variant border-outline-variant/20 hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">account_balance</span>
                <span className="font-mono text-[11px] font-bold">SPEI / Transf.</span>
              </button>
            </div>
          </div>

          {/* Execution Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleIssueDocument}
              className={`w-full h-12 rounded-xl font-headline text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all ${
                docType === 'cfdi'
                  ? 'bg-primary hover:bg-primary-container text-on-primary shadow-primary/20'
                  : 'bg-secondary hover:bg-secondary-fixed text-on-secondary-fixed shadow-secondary/20'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {docType === 'cfdi' ? 'verified_user' : 'print'}
              </span>
              <span>
                {docType === 'cfdi'
                  ? 'Timbrar y Emitir CFDI 4.0 con PAC SAT'
                  : 'Generar Nota Mostrador Térmica (80mm)'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => onShowToast('Comprobante enviado por WhatsApp al cliente', 'chat')}
                className="h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center gap-2 border border-outline-variant/20 transition-colors"
              >
                <span className="material-symbols-outlined text-secondary text-[18px]">chat</span>
                <span>Enviar WhatsApp</span>
              </button>
              <button
                onClick={() => onShowToast('PDF y XML enviados a carlos.mendez@empresa.com', 'mark_email_read')}
                className="h-11 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center gap-2 border border-outline-variant/20 transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[18px]">mark_email_read</span>
                <span>Enviar por Correo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEGMENT 3: HISTORIAL */}
      {activeSegment === 'historial' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-base font-bold text-on-surface">Emisiones Recientes</h2>
              <p className="font-mono text-xs text-on-surface-variant">
                Comprobantes timbrados y tickets del mes
              </p>
            </div>
            <button
              onClick={() => onShowToast('Descargando reporte acumulado XLS de facturación...', 'file_download')}
              className="h-8 px-2.5 rounded-lg bg-surface-container text-secondary font-mono text-xs flex items-center gap-1 border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>XLS</span>
            </button>
          </div>

          <div className="space-y-2">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col gap-1.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-[10px] font-bold uppercase ${
                      inv.type === 'cfdi' ? 'text-secondary' : 'text-tertiary'
                    }`}
                  >
                    {inv.type === 'cfdi' ? 'CFDI 4.0' : 'NOTA MOSTRADOR'} • FOLIO {inv.folio}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      inv.type === 'cfdi'
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-tertiary/15 text-tertiary'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-headline text-xs text-on-surface font-bold truncate">
                    {inv.clientName}
                  </span>
                  <span className="font-headline text-sm text-on-surface font-extrabold">
                    ${inv.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                  </span>
                </div>

                <div className="flex items-center justify-between text-on-surface-variant font-mono text-[10px]">
                  <span className="truncate">{inv.deviceSummary}</span>
                  <span className="shrink-0">{inv.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Agregar Nueva Categoría */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-surface-container rounded-2xl border border-outline-variant/30 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <h3 className="font-headline text-base font-bold text-on-surface">
                Nueva Categoría de Taller
              </h3>
              <button
                onClick={() => setShowAddCatModal(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Drones / Gimbal Estabilizadores"
                  value={newCatTitle}
                  onChange={(e) => setNewCatTitle(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/25 outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                  Descripción Técnica
                </label>
                <input
                  type="text"
                  placeholder="Ej. Motores brushless, IMU y calibración de brújula"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface border border-outline-variant/25 outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                    Costo Revisión ($)
                  </label>
                  <input
                    type="number"
                    value={newCatRev}
                    onChange={(e) => setNewCatRev(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-mono border border-outline-variant/25 outline-none focus:border-secondary font-bold"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] text-on-surface-variant uppercase mb-1">
                    Mano de Obra ($)
                  </label>
                  <input
                    type="number"
                    value={newCatLabor}
                    onChange={(e) => setNewCatLabor(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface font-mono border border-outline-variant/25 outline-none focus:border-secondary font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-headline font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-headline font-bold shadow-md active:scale-95 transition-all"
                >
                  Crear Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
