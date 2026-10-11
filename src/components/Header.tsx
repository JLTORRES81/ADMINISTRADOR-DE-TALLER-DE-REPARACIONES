import React, { useState, useEffect } from 'react';
import { ScreenTab } from '../types';
import { auth, loginWithGoogle, logoutUser, subscribeAuthState } from '../firebase';
import { User } from 'firebase/auth';
import {
  requestFCMNotificationPermission,
  triggerWorkbenchPushNotification,
  WorkbenchNotificationPayload,
} from '../utils/fcmMessaging';

interface HeaderProps {
  currentTab: ScreenTab;
  onNavigate: (tab: ScreenTab) => void;
  onOpenBackupModal: () => void;
  onOpenFaultSolverModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenBackupModal,
  onOpenFaultSolverModal,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [benchNotifications, setBenchNotifications] = useState<WorkbenchNotificationPayload[]>(() => {
    try {
      const raw = localStorage.getItem('electrofix_workbench_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    const handleWorkbenchEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WorkbenchNotificationPayload>;
      if (customEvent.detail) {
        setBenchNotifications((prev) => [customEvent.detail, ...prev.slice(0, 15)]);
      }
    };

    window.addEventListener('workbench_push_alert', handleWorkbenchEvent);
    return () => window.removeEventListener('workbench_push_alert', handleWorkbenchEvent);
  }, []);

  useEffect(() => {
    const unsub = subscribeAuthState((user) => {
      setCurrentUser(user);
    });
    return unsub;
  }, []);

  const getSubheaderTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { brand: 'ELECTRONICS DEL SURESTE', title: 'Dashboard D3 Analytics' };
      case 'ingreso':
        return { brand: 'ELECTROFIX OS', title: 'Nuevo Ingreso' };
      case 'diagnostico':
        return { brand: 'ELECTROFIX OS', title: 'Soporte & Diagnóstico' };
      case 'facturacion':
        return { brand: 'ELECTRONICS DEL SURESTE', title: 'Notas & Facturación / Tarifario' };
      case 'entregas':
        return { brand: 'ELECTROFIX OS', title: 'Entregas & Control QC' };
      case 'ordenes':
      default:
        return { brand: 'ELECTRONICS DEL SURESTE', title: 'Órdenes' };
    }
  };

  const { brand, title } = getSubheaderTitle();

  const handleRequestPush = async () => {
    const perm = await requestFCMNotificationPermission();
    setPushPermission(perm);
    if (perm === 'granted') {
      triggerWorkbenchPushNotification(
        'Mark Vance',
        'Banco A-04',
        'EF-2024-892',
        'Samsung Galaxy S23 Ultra',
        'Prueba de canal push FCM activada. Conexión de banco calibrada.'
      );
    }
  };

  const handleTriggerTestAlert = () => {
    triggerWorkbenchPushNotification(
      'Elena Ruiz',
      'Banco Triage B-02',
      'EF-2024-710',
      'MacBook Pro 14" M2',
      'Nueva orden asignada para diagnóstico térmico de placa lógica.'
    );
  };

  const handleGoogleSignIn = async () => {
    await loginWithGoogle();
    setShowProfileMenu(false);
  };

  const handleSignOut = async () => {
    await logoutUser();
    setShowProfileMenu(false);
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-[#131b2e]/90 backdrop-blur-xl border-b border-[#424754]/20 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      <div className="h-16 max-w-7xl mx-auto px-4 flex items-center justify-between gap-3">
        {/* Brand & Logo */}
        <div 
          className="flex items-center gap-3 min-w-0 cursor-pointer select-none"
          onClick={() => onNavigate('dashboard')}
        >
          <img
            alt="ElectroFix Logo"
            className="h-8 w-auto object-contain shrink-0 drop-shadow-[0_0_8px_rgba(76,215,246,0.3)]"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WlXpClh1E_TIVeqaRELlTeYgDFPQjTZ1yXVydfMqxdDFrwTKKI0n0GYJIbOQi-l_XJkZWOhv1po6ijgUv_kZcT-FgiBKzXS8PfJIDUD0_XOggGZgb1DN-KCQpMlSpIC8z6wnf5uqifDzVX2W_IbpuoAW_tbt7bz0z9CZ6YBqStHE1AQkOUinHNq22H6DFSDSer5Q7_hxCxnPJcFYDODiCygFCX-TOPKD-CBmHhqiKyh4EwGwBoZWYMIUc"
          />
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] text-secondary tracking-widest uppercase truncate font-semibold">
              {brand}
            </span>
            <span className="font-headline text-base font-bold text-on-surface truncate leading-tight">
              {title}
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Resolvedor de Fallas Comunes AI Button */}
          {onOpenFaultSolverModal && (
            <button
              aria-label="Resolvedor de Fallas Comunes AI"
              title="Resolvedor Inteligente de Fallas Comunes (IA + Historial)"
              onClick={onOpenFaultSolverModal}
              className="h-10 px-2.5 flex items-center gap-1.5 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary transition-all border border-secondary/35 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span className="hidden md:inline font-headline text-xs font-bold">Fallas AI</span>
            </button>
          )}

          {/* Firestore Backup Button */}
          <button
            aria-label="Copia de Seguridad Firestore"
            title="Copia de Seguridad Firestore (.JSON)"
            onClick={onOpenBackupModal}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-secondary hover:text-secondary-fixed transition-colors border border-secondary/25 shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">cloud_download</span>
          </button>

          {/* Quick Notification Button */}
          <div className="relative">
            <button
              aria-label="Notificaciones"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-low animate-pulse"></span>
            </button>

            {/* Notifications Dropdown Tray */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/30 p-3 z-50 text-left max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                      Alertas de Banco (FCM)
                    </span>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  </div>
                  <span className="font-mono text-[10px] text-secondary">
                    {benchNotifications.length + 3} avisos
                  </span>
                </div>

                {/* FCM Permission & Test Banner */}
                <div className="p-2.5 rounded-lg bg-surface-container mb-2 border border-outline-variant/20 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-on-surface-variant">Estado Push FCM:</span>
                    <span className={`font-bold ${pushPermission === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {pushPermission === 'granted' ? 'ACTIVO (VAPID OK)' : 'PENDIENTE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {pushPermission !== 'granted' ? (
                      <button
                        onClick={handleRequestPush}
                        className="col-span-2 h-7 rounded-lg bg-secondary text-on-secondary-fixed font-headline text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[14px]">notifications_active</span>
                        <span>Permitir Push FCM</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleTriggerTestAlert}
                        className="col-span-2 h-7 rounded-lg bg-surface-container-high hover:bg-surface-bright text-secondary font-mono text-[10px] font-bold flex items-center justify-center gap-1 border border-outline-variant/25 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[14px]">cell_tower</span>
                        <span>Simular Asignación de Banco</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Notifications Stream */}
                <div className="space-y-2 text-xs">
                  {benchNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-2.5 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors cursor-pointer border border-secondary/20 space-y-0.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-secondary font-mono text-[11px]">
                          #{notif.ticketId} • {notif.bench}
                        </span>
                        <span className="text-[9px] text-on-surface-variant font-mono">{notif.timestamp}</span>
                      </div>
                      <p className="font-medium text-on-surface text-xs leading-snug">
                        {notif.deviceModel} → {notif.technicianName}
                      </p>
                      <p className="text-[10px] text-on-surface-variant line-clamp-1">
                        {notif.faultSummary}
                      </p>
                    </div>
                  ))}

                  <div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors cursor-pointer">
                    <p className="font-medium text-on-surface">Mark Vance terminó micro-soldadura</p>
                    <span className="text-[10px] text-secondary font-mono">Ticket #EF-2024-892 • Hace 12 min</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors cursor-pointer">
                    <p className="font-medium text-on-surface">Elena Ruiz solicita autorización de cotización</p>
                    <span className="text-[10px] text-tertiary font-mono">MacBook M2 #EF-2024-710 • Hace 35 min</span>
                  </div>
                  <div className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-highest transition-colors cursor-pointer">
                    <p className="font-medium text-on-surface">Impresora térmica 80mm papel al 85%</p>
                    <span className="text-[10px] text-outline font-mono">Mostrador Principal • 10:14 AM</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Profile / Auth Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="relative flex items-center justify-center p-0.5 rounded-full bg-surface-container ring-1 ring-secondary/40 hover:ring-secondary transition-all"
            >
              <img
                alt="Perfil Técnico"
                className="w-8 h-8 rounded-full object-cover"
                src={currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBWkf45S9Pffx6sRMbkdf6mUrJoBfnH8dG8cgSfWkE3q0Z30F-o5AilX0Ut-blNgN3kYY8NJu5VGknO1F-Sr0LWMJw8OuV_Z85Vf2dwlKeWWQqBthU17Xx_KGR6WT4D1aQWRFeMffKK11PWzJEVwMVqFbQUw0isBVJNP8UrUnwzSUJj3IAe-ykq429lubwMsBO4QA7RcOLK2GGoe-ZP3ajX3KNuf9Lh0pFTa6HWM63SGK41d6UNKwtw"}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-surface-container-high rounded-xl shadow-2xl border border-outline-variant/30 p-3.5 z-50 text-left">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-outline-variant/20 mb-2.5">
                  <img
                    src={currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuBWkf45S9Pffx6sRMbkdf6mUrJoBfnH8dG8cgSfWkE3q0Z30F-o5AilX0Ut-blNgN3kYY8NJu5VGknO1F-Sr0LWMJw8OuV_Z85Vf2dwlKeWWQqBthU17Xx_KGR6WT4D1aQWRFeMffKK11PWzJEVwMVqFbQUw0isBVJNP8UrUnwzSUJj3IAe-ykq429lubwMsBO4QA7RcOLK2GGoe-ZP3ajX3KNuf9Lh0pFTa6HWM63SGK41d6UNKwtw"}
                    alt="Usuario"
                    className="w-10 h-10 rounded-full object-cover ring-1 ring-secondary/40"
                  />
                  <div className="min-w-0">
                    <h4 className="font-headline text-xs font-bold text-on-surface truncate">
                      {currentUser?.displayName || 'J. Torres (Técnico Master)'}
                    </h4>
                    <span className="font-mono text-[10px] text-secondary block truncate">
                      {currentUser?.email || 'jltorres2012@gmail.com'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-on-surface-variant font-medium">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                    <span>Firebase Auth</span>
                    <span className="font-mono text-[10px] text-secondary font-bold">
                      {currentUser ? 'GOOGLE CONECTADO' : 'SESIÓN LOCAL'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-surface-container">
                    <span>Firestore DB</span>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">(default) ACTIVA</span>
                  </div>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenBackupModal();
                    }}
                    className="w-full mt-1 h-8 rounded-lg bg-surface-container hover:bg-surface-container-highest text-secondary font-mono text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-secondary/20"
                  >
                    <span className="material-symbols-outlined text-[15px]">database</span>
                    <span>Copia de Seguridad JSON</span>
                  </button>

                  {currentUser ? (
                    <button
                      onClick={handleSignOut}
                      className="w-full mt-2 h-9 rounded-lg bg-surface-container hover:bg-surface-container-highest text-error font-mono text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      <span>Cerrar Sesión</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleGoogleSignIn}
                      className="w-full mt-2 h-9 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-headline text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">login</span>
                      <span>Iniciar sesión con Google</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};


