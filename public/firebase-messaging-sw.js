// Firebase Cloud Messaging Service Worker for ElectroFix OS
/* eslint-disable no-restricted-globals */

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyDemoProjectMockKeyElectroFix2024",
  authDomain: "electrofix-os-596672002791.firebaseapp.com",
  projectId: "electrofix-os-596672002791",
  storageBucket: "electrofix-os-596672002791.appspot.com",
  messagingSenderId: "596672002791",
  appId: "1:596672002791:web:a1b2c3d4e5f6g7h8"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message: ', payload);
    const title = payload.notification?.title || 'Nuevo Ticket en Banco de Trabajo';
    const options = {
      body: payload.notification?.body || 'Se ha asignado un nuevo equipo a tu estación técnica.',
      icon: 'https://lh3.googleusercontent.com/aida/AEtjO1WlXpClh1E_TIVeqaRELlTeYgDFPQjTZ1yXVydfMqxdDFrwTKKI0n0GYJIbOQi-l_XJkZWOhv1po6ijgUv_kZcT-FgiBKzXS8PfJIDUD0_XOggGZgb1DN-KCQpMlSpIC8z6wnf5uqifDzVX2W_IbpuoAW_tbt7bz0z9CZ6YBqStHE1AQkOUinHNq22H6DFSDSer5Q7_hxCxnPJcFYDODiCygFCX-TOPKD-CBmHhqiKyh4EwGwBoZWYMIUc',
      badge: 'https://lh3.googleusercontent.com/aida/AEtjO1WlXpClh1E_TIVeqaRELlTeYgDFPQjTZ1yXVydfMqxdDFrwTKKI0n0GYJIbOQi-l_XJkZWOhv1po6ijgUv_kZcT-FgiBKzXS8PfJIDUD0_XOggGZgb1DN-KCQpMlSpIC8z6wnf5uqifDzVX2W_IbpuoAW_tbt7bz0z9CZ6YBqStHE1AQkOUinHNq22H6DFSDSer5Q7_hxCxnPJcFYDODiCygFCX-TOPKD-CBmHhqiKyh4EwGwBoZWYMIUc',
      vibrate: [200, 100, 200],
      data: payload.data || {},
      actions: [
        { action: 'open_bench', title: 'Ver Banco' },
        { action: 'dismiss', title: 'Entendido' }
      ]
    };

    self.registration.showNotification(title, options);
  });
} catch (e) {
  console.warn('FCM service worker initialization warning:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
