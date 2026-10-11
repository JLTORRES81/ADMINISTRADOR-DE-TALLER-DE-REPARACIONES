import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../../firebase-applet-config.json';
import { setDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export interface WorkbenchNotificationPayload {
  id: string;
  technicianName: string;
  bench: string;
  ticketId: string;
  deviceModel: string;
  faultSummary: string;
  timestamp: string;
  read: boolean;
}

let messagingInstance: Messaging | null = null;
let fcmToken: string | null = null;

// Dual-tone synthesizer alert chime for workshop laboratory benches
export function playWorkbenchAlertChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    // Tone 1: 784 Hz (G5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Tone 2: 1046.5 Hz (C6) high-frequency attention tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.55);

    if (navigator.vibrate) {
      navigator.vibrate([150, 80, 150]);
    }
  } catch (e) {
    console.warn('Audio alert could not play automatically:', e);
  }
}

// Initialize FCM messaging
export async function initFCM(): Promise<string | null> {
  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('FCM is not supported in this browser environment.');
      return null;
    }

    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      } catch (swErr) {
        console.warn('Service worker registration note:', swErr);
      }
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    messagingInstance = getMessaging(app);

    // Listen to foreground FCM messages
    onMessage(messagingInstance, (payload) => {
      console.log('[FCM] Foreground push message received:', payload);
      playWorkbenchAlertChime();

      const notifData: WorkbenchNotificationPayload = {
        id: `fcm-${Date.now()}`,
        technicianName: payload.data?.technicianName || 'Técnico Especialista',
        bench: payload.data?.bench || 'Banco de Trabajo',
        ticketId: payload.data?.ticketId || 'EF-2024-892',
        deviceModel: payload.data?.deviceModel || 'Dispositivo',
        faultSummary: payload.notification?.body || 'Nuevo ticket asignado',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      };

      dispatchLocalWorkbenchAlert(notifData);
    });

    return fcmToken || 'fcm-token-registered-workbench';
  } catch (error) {
    console.warn('FCM initialization note:', error);
    return null;
  }
}

// Request Notification Permission
export async function requestFCMNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted' && messagingInstance) {
      try {
        const token = await getToken(messagingInstance, {
          vapidKey: 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-WevMeTncQwb0KsSmC5_zF5TqN-f1b1s1v8'
        });
        fcmToken = token;
        console.log('[FCM] Device Token:', token);
      } catch (tokenErr) {
        console.warn('[FCM] Token generation notice (fallback active):', tokenErr);
      }
    }
    return permission;
  } catch (err) {
    console.warn('Could not request notification permission:', err);
    return 'denied';
  }
}

// Dispatch Workbench Push Alert
export function triggerWorkbenchPushNotification(
  technicianName: string,
  bench: string,
  ticketId: string,
  deviceModel: string,
  faultSummary: string
): void {
  const payload: WorkbenchNotificationPayload = {
    id: `push-${Date.now()}`,
    technicianName,
    bench,
    ticketId,
    deviceModel,
    faultSummary,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    read: false,
  };

  // 1. Play laboratory bench alert chime
  playWorkbenchAlertChime();

  // 2. Dispatch native browser Notification if permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`¡Nuevo Ticket en ${bench}!`, {
        body: `#${ticketId} (${deviceModel}) asignado a ${technicianName}: ${faultSummary.slice(0, 80)}...`,
        icon: 'https://lh3.googleusercontent.com/aida/AEtjO1WlXpClh1E_TIVeqaRELlTeYgDFPQjTZ1yXVydfMqxdDFrwTKKI0n0GYJIbOQi-l_XJkZWOhv1po6ijgUv_kZcT-FgiBKzXS8PfJIDUD0_XOggGZgb1DN-KCQpMlSpIC8z6wnf5uqifDzVX2W_IbpuoAW_tbt7bz0z9CZ6YBqStHE1AQkOUinHNq22H6DFSDSer5Q7_hxCxnPJcFYDODiCygFCX-TOPKD-CBmHhqiKyh4EwGwBoZWYMIUc',
        tag: `bench-${ticketId}`,
      });
    } catch (e) {
      console.warn('Browser Notification instance notice:', e);
    }
  }

  // 3. Dispatch in-app workbench HUD alert
  dispatchLocalWorkbenchAlert(payload);

  // 4. Persist to Firestore notifications collection
  try {
    setDoc(doc(db, 'workbenchNotifications', payload.id), payload).catch(() => {});
  } catch {
    // ignore
  }
}

function dispatchLocalWorkbenchAlert(payload: WorkbenchNotificationPayload): void {
  // Save to localStorage history
  try {
    const raw = localStorage.getItem('electrofix_workbench_notifications');
    const list: WorkbenchNotificationPayload[] = raw ? JSON.parse(raw) : [];
    list.unshift(payload);
    localStorage.setItem('electrofix_workbench_notifications', JSON.stringify(list.slice(0, 20)));
  } catch {
    // ignore
  }

  // Dispatch custom window event for React components
  window.dispatchEvent(new CustomEvent('workbench_push_alert', { detail: payload }));
}
