/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenTab, Ticket, Technician, PriceCategoryItem, InvoiceRecord, ChatMessage } from './types';
import {
  INITIAL_TICKETS,
  INITIAL_TECHNICIANS,
  INITIAL_PRICE_CATEGORIES,
  INITIAL_INVOICES,
  INITIAL_CHAT_MESSAGES,
} from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { IngresoScreen } from './components/screens/IngresoScreen';
import { ElectroBotScreen } from './components/screens/ElectroBotScreen';
import { OrdenesFinanzasScreen } from './components/screens/OrdenesFinanzasScreen';
import { FacturacionScreen } from './components/screens/FacturacionScreen';
import { EntregasScreen } from './components/screens/EntregasScreen';
import { DashboardScreen } from './components/screens/DashboardScreen';
import { ThermalLabelModal } from './components/modals/ThermalLabelModal';
import { TicketDetailModal } from './components/modals/TicketDetailModal';
import { MicroscopeZoomModal } from './components/modals/MicroscopeZoomModal';
import { FirestoreBackupModal } from './components/modals/FirestoreBackupModal';
import { CommonFaultSolverModal } from './components/modals/CommonFaultSolverModal';
import { WorkbenchAlertHUD } from './components/WorkbenchAlertHUD';
import { initFCM } from './utils/fcmMessaging';
import {
  syncTickets,
  saveTicketToFirestore,
  syncTechnicians,
  saveTechnicianToFirestore,
  syncPriceCategories,
  savePriceCategoryToFirestore,
  syncInvoices,
  saveInvoiceToFirestore,
  validateFirestoreConnection,
} from './firebase';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('dashboard');
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [activeTicket, setActiveTicket] = useState<Ticket>(INITIAL_TICKETS[0]);
  const [technicians, setTechnicians] = useState<Technician[]>(INITIAL_TECHNICIANS);
  const [priceCategories, setPriceCategories] = useState<PriceCategoryItem[]>(INITIAL_PRICE_CATEGORIES);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Modals state
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isFaultSolverOpen, setIsFaultSolverOpen] = useState(false);
  const [microscopeModal, setMicroscopeModal] = useState<{
    isOpen: boolean;
    url: string;
    title: string;
    subtitle: string;
  }>({
    isOpen: false,
    url: '',
    title: '',
    subtitle: '',
  });

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIcon, setToastIcon] = useState<string>('check_circle');

  const triggerToast = (msg: string, icon = 'check_circle') => {
    setToastMessage(msg);
    setToastIcon(icon);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Setup Firebase Realtime Listeners & FCM Push
  useEffect(() => {
    initFCM();

    validateFirestoreConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });

    const unsubTickets = syncTickets((remoteTickets) => {
      if (remoteTickets.length > 0) {
        setTickets(remoteTickets);
        // Sync active ticket reference if it exists in remote
        setActiveTicket((curr) => {
          const match = remoteTickets.find((t) => t.id === curr.id);
          return match || remoteTickets[0];
        });
      }
    });

    const unsubTechs = syncTechnicians((remoteTechs) => {
      if (remoteTechs.length > 0) {
        setTechnicians(remoteTechs);
      }
    });

    const unsubPrices = syncPriceCategories((remotePrices) => {
      if (remotePrices.length > 0) {
        setPriceCategories(remotePrices);
      }
    });

    const unsubInvoices = syncInvoices((remoteInvoices) => {
      if (remoteInvoices.length > 0) {
        setInvoices(remoteInvoices);
      }
    });

    return () => {
      unsubTickets();
      unsubTechs();
      unsubPrices();
      unsubInvoices();
    };
  }, []);

  // Update active ticket & sync to Firestore
  const handleUpdateTicket = (updated: Ticket) => {
    setActiveTicket(updated);
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    saveTicketToFirestore(updated);
  };

  const handleApplySolutionToTicket = (
    ticketId: string,
    solution: string,
    rootCause: string,
    parts: string[]
  ) => {
    const today = new Date().toISOString().split('T')[0];
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const updated: Ticket = {
            ...t,
            solutionApplied: solution,
            rootCauseFound: rootCause,
            partsReplaced: parts,
            resolvedAt: today,
            stage: t.stage === 'ingreso' ? 'triage' : t.stage,
          };
          saveTicketToFirestore(updated);
          if (activeTicket.id === ticketId) {
            setActiveTicket(updated);
          }
          return updated;
        }
        return t;
      })
    );
  };

  // Technician management & sync
  const handleToggleTechWorkload = (techId: string, isActive: boolean) => {
    setTechnicians((prev) =>
      prev.map((t) => {
        if (t.id === techId) {
          const updated = { ...t, isWorkloadActive: isActive };
          saveTechnicianToFirestore(updated);
          return updated;
        }
        return t;
      })
    );
  };

  const handleAddTechnician = (newTech: Technician) => {
    setTechnicians((prev) => [newTech, ...prev]);
    saveTechnicianToFirestore(newTech);
  };

  // Price category management & sync
  const handleUpdateCategory = (cat: PriceCategoryItem) => {
    setPriceCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));
    savePriceCategoryToFirestore(cat);
  };

  const handleAddCategory = (newCat: PriceCategoryItem) => {
    setPriceCategories((prev) => [...prev, newCat]);
    savePriceCategoryToFirestore(newCat);
  };

  const handleAddInvoice = (newInv: InvoiceRecord) => {
    setInvoices((prev) => [newInv, ...prev]);
    saveInvoiceToFirestore(newInv);
  };

  // Chatbot message response handler
  const handleSendMessage = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: timeStr,
      text,
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Intelligent reply generator
    setTimeout(() => {
      let botReply = '';
      const lower = text.toLowerCase();

      if (lower.includes('reparación') || lower.includes('cómo va') || lower.includes('estatus')) {
        botReply = `Tu ${activeTicket.deviceModel} está actualmente en ${activeTicket.assignedBench} con el técnico ${activeTicket.assignedTech}. Se concluyó la inspección de microscopio y las pruebas térmicas. El tiempo estimado de entrega es de ${activeTicket.estimatedHours}.`;
      } else if (lower.includes('garantía') || lower.includes('cubre')) {
        botReply = `La póliza oficial de ElectroFix cubre ${activeTicket.warrantyPeriod} contra cualquier defecto en refacciones y soldadura SMD. No cubre filtración por líquidos posterior ni golpes severos.`;
      } else if (lower.includes('costo') || lower.includes('revisión') || lower.includes('presupuesto')) {
        botReply = `El costo de diagnóstico es de $${activeTicket.diagnosisCost} MXN, el cual es 100% bonificable a tu favor si autorizas la reparación. Mano de obra estimada: $${activeTicket.laborCost} MXN.`;
      } else if (lower.includes('autorizar') || lower.includes('acepto')) {
        botReply = `¡Excelente! He registrado tu autorización formal para el ticket #${activeTicket.id}. El técnico ${activeTicket.assignedTech} iniciará el montaje del repuesto original de inmediato.`;
      } else {
        botReply = `He recibido tu mensaje técnico sobre "${text}". He anexado esta nota a la bitácora del ticket #${activeTicket.id}. ¿Deseas que te contacte directamente con el técnico o requieres información sobre pagos y facturación?`;
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'bot',
        timestamp: timeStr,
        text: botReply,
      };

      setChatMessages((prev) => [...prev, botMsg]);
    }, 1100);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col font-body selection:bg-secondary/30 selection:text-secondary">
      {/* Toast Feedback */}
      <Toast
        message={toastMessage}
        icon={toastIcon}
        onClose={() => setToastMessage(null)}
      />

      {/* FCM Workbench Alert HUD Banner */}
      <WorkbenchAlertHUD
        onOpenTicket={(ticketId) => {
          const match = tickets.find((t) => t.id === ticketId);
          if (match) setActiveTicket(match);
          setIsTicketDetailOpen(true);
        }}
      />

      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenFaultSolverModal={() => setIsFaultSolverOpen(true)}
      />

      {/* Main Viewport Routed Content */}
      <main className="flex-1 flex flex-col relative w-full">
        {currentTab === 'dashboard' && (
          <DashboardScreen
            technicians={technicians}
            invoices={invoices}
            tickets={tickets}
            onShowToast={triggerToast}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
            onOpenFaultSolverModal={() => setIsFaultSolverOpen(true)}
            onSelectTicket={(t) => {
              setActiveTicket(t);
              setIsTicketDetailOpen(true);
            }}
          />
        )}

        {currentTab === 'ingreso' && (
          <IngresoScreen
            ticket={activeTicket}
            onUpdateTicket={handleUpdateTicket}
            onOpenLabelModal={() => setIsLabelModalOpen(true)}
            onShowToast={triggerToast}
            onProceedToChat={() => setCurrentTab('diagnostico')}
          />
        )}

        {currentTab === 'diagnostico' && (
          <ElectroBotScreen
            tickets={tickets}
            activeTicket={activeTicket}
            chatMessages={chatMessages}
            onSelectTicket={(t) => setActiveTicket(t)}
            onSendMessage={handleSendMessage}
            onOpenTicketDetail={() => setIsTicketDetailOpen(true)}
            onOpenMicroscopeModal={(url, title, subtitle) =>
              setMicroscopeModal({ isOpen: true, url, title, subtitle })
            }
            onShowToast={triggerToast}
            onOpenFaultSolverModal={() => setIsFaultSolverOpen(true)}
          />
        )}

        {currentTab === 'ordenes' && (
          <OrdenesFinanzasScreen
            technicians={technicians}
            onToggleTechWorkload={handleToggleTechWorkload}
            onAddTechnician={handleAddTechnician}
            onShowToast={triggerToast}
            onTriggerTestPrint={() => setIsLabelModalOpen(true)}
            onOpenBackupModal={() => setIsBackupModalOpen(true)}
          />
        )}

        {currentTab === 'facturacion' && (
          <FacturacionScreen
            priceCategories={priceCategories}
            invoices={invoices}
            onUpdateCategory={handleUpdateCategory}
            onAddCategory={handleAddCategory}
            onAddInvoice={handleAddInvoice}
            onShowToast={triggerToast}
          />
        )}

        {currentTab === 'entregas' && (
          <EntregasScreen
            tickets={tickets}
            onShowToast={triggerToast}
            onOpenLabelModal={() => setIsLabelModalOpen(true)}
          />
        )}
      </main>

      {/* Bottom Industrial Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Modals */}
      <ThermalLabelModal
        ticket={activeTicket}
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        onPrintSuccess={() =>
          triggerToast(`Etiqueta térmica para bandeja #${activeTicket.id} impresa correctamente`, 'check_circle')
        }
      />

      <TicketDetailModal
        ticket={activeTicket}
        isOpen={isTicketDetailOpen}
        onClose={() => setIsTicketDetailOpen(false)}
        onOpenLabel={() => {
          setIsTicketDetailOpen(false);
          setIsLabelModalOpen(true);
        }}
        onOpenFaultSolver={() => setIsFaultSolverOpen(true)}
      />

      <MicroscopeZoomModal
        photoUrl={microscopeModal.url}
        title={microscopeModal.title}
        subtitle={microscopeModal.subtitle}
        isOpen={microscopeModal.isOpen}
        onClose={() => setMicroscopeModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <FirestoreBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onShowToast={triggerToast}
        onRefreshData={() => {
          triggerToast('Base de datos Firestore sincronizada y actualizada', 'sync');
        }}
      />

      {/* AI-Powered Common Fault Solver Modal */}
      <CommonFaultSolverModal
        isOpen={isFaultSolverOpen}
        onClose={() => setIsFaultSolverOpen(false)}
        activeTicket={activeTicket}
        allTickets={tickets}
        onApplySolutionToTicket={handleApplySolutionToTicket}
        onShowToast={triggerToast}
      />
    </div>
  );
}
